using System.Reflection;
using System.Runtime.Loader;

namespace PokeLayout.Services;

/// <summary>
/// Carga el Core de PKLumiHex en un AssemblyLoadContext aislado
/// (mismo nombre de ensamblado que PKHeX.Core oficial) para leer saves de Luminescent Platinum.
/// </summary>
internal static class LumiSaveBridge
{
    // Tamaños BDSP / Lumi conocidos (SaveUtil SIZE_G8BDSP*)
    private static readonly HashSet<int> BdspLikeSizes =
    [
        0xE9828, // SIZE_G8BDSP
        0xEDC20, // SIZE_G8BDSP_1
        0xEED8C, // SIZE_G8BDSP_2
        0xEF0A4, // SIZE_G8BDSP_3
    ];

    private static readonly object Gate = new();
    private static AssemblyLoadContext? _alc;
    private static Assembly? _assembly;
    private static MethodInfo? _getVariantFromBytes;
    private static MethodInfo? _getVariantFromPath;
    private static bool _initAttempted;
    private static bool _initFailed;

    public static bool IsLumiCandidate(byte[] data, string? filePath)
    {
        var name = Path.GetFileName(filePath ?? "");
        if (name.Equals("SaveData.bin", StringComparison.OrdinalIgnoreCase) ||
            name.Equals("SaveData.Bin", StringComparison.OrdinalIgnoreCase))
            return true;

        if (filePath != null &&
            (filePath.Contains("0100000011D90000", StringComparison.OrdinalIgnoreCase) ||
             filePath.Contains("010018E011D92000", StringComparison.OrdinalIgnoreCase)))
            return true;

        return BdspLikeSizes.Contains(data.Length);
    }

    public static TeamData? TryRead(byte[] data, string? filePath)
    {
        if (!EnsureLoaded())
            return null;

        try
        {
            object? sav = null;

            if (!string.IsNullOrWhiteSpace(filePath) && File.Exists(filePath) && _getVariantFromPath != null)
            {
                try { sav = _getVariantFromPath.Invoke(null, [filePath]); }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LumiSaveBridge] GetVariantSAV(path) falló: {ex.InnerException?.Message ?? ex.Message}");
                }
            }

            if (sav == null && _getVariantFromBytes != null)
            {
                try
                {
                    var ps = _getVariantFromBytes.GetParameters();
                    object?[] args = ps.Length >= 2
                        ? [data, filePath ?? ""]
                        : [data];
                    sav = _getVariantFromBytes.Invoke(null, args);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LumiSaveBridge] GetVariantSAV(data) falló: {ex.InnerException?.Message ?? ex.Message}");
                }
            }

            if (sav == null)
                return null;

            return BuildTeam(sav);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LumiSaveBridge] Error: {ex.Message}");
            return null;
        }
    }

    private static bool EnsureLoaded()
    {
        if (_assembly != null)
            return true;
        if (_initFailed)
            return false;

        lock (Gate)
        {
            if (_assembly != null)
                return true;
            if (_initAttempted)
                return false;
            _initAttempted = true;

            try
            {
                var dllPath = ResolvePluginPath();
                if (dllPath == null)
                {
                    Console.WriteLine("[LumiSaveBridge] No se encontró plugins/pklumihex/PKHeX.Core.dll");
                    _initFailed = true;
                    return false;
                }

                _alc = new AssemblyLoadContext("PKLumiHex", isCollectible: false);
                _assembly = _alc.LoadFromAssemblyPath(dllPath);

                var saveUtil = _assembly.GetType("PKHeX.Core.SaveUtil");
                if (saveUtil == null)
                {
                    Console.WriteLine("[LumiSaveBridge] Tipo SaveUtil no encontrado en PKLumiHex");
                    _initFailed = true;
                    return false;
                }

                // PKLumiHex (~23.x): GetVariantSAV(string) y GetVariantSAV(byte[], string)
                _getVariantFromPath = saveUtil.GetMethod("GetVariantSAV", [typeof(string)]);
                _getVariantFromBytes = saveUtil.GetMethod("GetVariantSAV", [typeof(byte[]), typeof(string)])
                    ?? saveUtil.GetMethod("GetVariantSAV", [typeof(byte[])]);

                // Por si el fork actualiza a GetSaveFile
                if (_getVariantFromPath == null)
                    _getVariantFromPath = saveUtil.GetMethod("GetSaveFile", [typeof(string)]);
                if (_getVariantFromBytes == null)
                {
                    foreach (var m in saveUtil.GetMethods(BindingFlags.Public | BindingFlags.Static))
                    {
                        if (m.Name is not ("GetVariantSAV" or "GetSaveFile")) continue;
                        var ps = m.GetParameters();
                        if (ps.Length >= 1 && ps[0].ParameterType == typeof(byte[]))
                        {
                            _getVariantFromBytes = m;
                            break;
                        }
                    }
                }

                if (_getVariantFromBytes == null && _getVariantFromPath == null)
                {
                    Console.WriteLine("[LumiSaveBridge] No se encontró método de carga de saves en PKLumiHex");
                    _initFailed = true;
                    return false;
                }

                Console.WriteLine($"[LumiSaveBridge] PKLumiHex cargado desde {dllPath}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LumiSaveBridge] No se pudo cargar el plugin: {ex.Message}");
                _initFailed = true;
                return false;
            }
        }
    }

    private static string? ResolvePluginPath()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var candidates = new[]
        {
            Path.Combine(baseDir, "plugins", "pklumihex", "PKHeX.Core.dll"),
            Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "plugins", "pklumihex", "PKHeX.Core.dll")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "plugins", "pklumihex", "PKHeX.Core.dll")),
        };

        foreach (var path in candidates)
        {
            if (File.Exists(path))
                return Path.GetFullPath(path);
        }

        return null;
    }

    private static TeamData BuildTeam(object sav)
    {
        var savType = sav.GetType();
        var ot = savType.GetProperty("OT")?.GetValue(sav)?.ToString() ?? "";
        var version = savType.GetProperty("Version")?.GetValue(sav)?.ToString() ?? "BD";

        var team = new TeamData
        {
            GameVersion = $"Luminescent Platinum ({version})",
            TrainerName = ot,
            LastUpdated = DateTime.Now
        };

        var partyData = savType.GetProperty("PartyData")?.GetValue(sav);
        if (partyData is not System.Collections.IEnumerable party)
            return team;

        int slot = 0;
        foreach (var pk in party)
        {
            if (pk == null || slot >= 6)
                break;
            slot++;

            var pkType = pk.GetType();
            var species = Convert.ToInt32(pkType.GetProperty("Species")?.GetValue(pk) ?? 0);
            if (species == 0)
                continue;

            var nickname = pkType.GetProperty("Nickname")?.GetValue(pk)?.ToString() ?? "";
            var isNicknamed = Convert.ToBoolean(pkType.GetProperty("IsNicknamed")?.GetValue(pk) ?? false);
            var level = Convert.ToInt32(pkType.GetProperty("CurrentLevel")?.GetValue(pk) ?? 0);
            var isShiny = Convert.ToBoolean(pkType.GetProperty("IsShiny")?.GetValue(pk) ?? false);
            var isEgg = Convert.ToBoolean(pkType.GetProperty("IsEgg")?.GetValue(pk) ?? false);
            var form = Convert.ToInt32(pkType.GetProperty("Form")?.GetValue(pk) ?? 0);
            var gender = Convert.ToInt32(pkType.GetProperty("Gender")?.GetValue(pk) ?? 2);
            var hpCur = Convert.ToInt32(pkType.GetProperty("Stat_HPCurrent")?.GetValue(pk) ?? 0);
            var hpMax = Convert.ToInt32(pkType.GetProperty("Stat_HPMax")?.GetValue(pk) ?? 0);
            var heldItem = Convert.ToInt32(pkType.GetProperty("HeldItem")?.GetValue(pk) ?? 0);

            var speciesName = GetSpeciesNameFromLumi(species) ?? GetSpeciesNameOfficial(species);

            team.Team.Add(new PokemonData
            {
                Slot = slot,
                Species = species,
                SpeciesName = speciesName,
                SpeciesKey = NormalizeSpeciesKey(speciesName),
                Nickname = nickname,
                HasNickname = isNicknamed,
                Level = level,
                IsShiny = isShiny,
                IsEgg = isEgg,
                Form = form,
                Gender = gender,
                CurrentHP = hpCur,
                MaxHP = hpMax,
                HeldItem = GetItemNameOfficial(heldItem),
                SpriteUrl = GetSpriteUrl(species, isShiny)
            });
        }

        team.BadgeSets = TryReadBdspBadges(sav);
        return team;
    }

    private static List<BadgeSetData> TryReadBdspBadges(object sav)
    {
        try
        {
            var flagWork = sav.GetType().GetProperty("FlagWork")?.GetValue(sav);
            if (flagWork == null)
                return [];

            var getSystemFlag = flagWork.GetType().GetMethod("GetSystemFlag");
            if (getSystemFlag == null)
                return [];

            var names = new[] { "Carbón", "Bosque", "Cobre", "Relicario", "Icónica", "Glaciar", "Guadaña", "Isla" };
            var set = new BadgeSetData { Region = "Sinnoh" };
            for (int i = 0; i < 8; i++)
            {
                var obtained = Convert.ToBoolean(getSystemFlag.Invoke(flagWork, [124 + i]) ?? false);
                set.Badges.Add(new BadgeEntry
                {
                    SpriteId = 25 + i,
                    Name = names[i],
                    Obtained = obtained
                });
            }
            return [set];
        }
        catch
        {
            return [];
        }
    }

    private static string? GetSpeciesNameFromLumi(int species)
    {
        try
        {
            var gameInfo = _assembly?.GetType("PKHeX.Core.GameInfo");
            var getStrings = gameInfo?.GetMethod("GetStrings", [typeof(string)]);
            var strings = getStrings?.Invoke(null, ["en"]);
            var speciesProp = strings?.GetType().GetProperty("Species");
            var list = speciesProp?.GetValue(strings);
            if (list is System.Collections.IList names && species >= 0 && species < names.Count)
                return names[species]?.ToString();
        }
        catch { }
        return null;
    }

    private static string GetSpeciesNameOfficial(int species)
    {
        try
        {
            var strings = PKHeX.Core.GameInfo.GetStrings("en");
            if (species > 0 && species < strings.Species.Count)
                return strings.Species[species];
        }
        catch { }
        return $"Pokemon #{species}";
    }

    private static string GetItemNameOfficial(int itemId)
    {
        if (itemId == 0) return "";
        try
        {
            var strings = PKHeX.Core.GameInfo.GetStrings("en");
            if (itemId > 0 && itemId < strings.Item.Count)
                return strings.Item[itemId];
        }
        catch { }
        return "";
    }

    private static string GetSpriteUrl(int species, bool shiny)
    {
        if (species <= 0)
            return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
        var shinyPath = shiny ? "shiny/" : "";
        return $"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{shinyPath}{species}.png";
    }

    private static string NormalizeSpeciesKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return "";
        return key.Trim().TrimStart(':').ToUpperInvariant().Replace(" ", "");
    }
}
