using PKHeX.Core;

namespace PokeLayout.Services;

public class PokemonData
{
    public int Slot { get; set; }
    public int Species { get; set; }
    public string SpeciesName { get; set; } = "";
    public string Nickname { get; set; } = "";
    public bool HasNickname { get; set; }
    public int Level { get; set; }
    public bool IsShiny { get; set; }
    public bool IsEgg { get; set; }
    public int Form { get; set; }
    public int Gender { get; set; } // 0 = Male, 1 = Female, 2 = Genderless
    public int CurrentHP { get; set; }
    public int MaxHP { get; set; }
    public string HeldItem { get; set; } = "";
    public string SpriteUrl { get; set; } = "";
}

public class TeamData
{
    public string GameVersion { get; set; } = "";
    public string TrainerName { get; set; } = "";
    public List<PokemonData> Team { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class SaveFileService
{
    private TeamData? _cachedTeam;
    private string? _lastFilePath;
    private DateTime _lastModified;

    public TeamData? GetCachedTeam() => _cachedTeam;

    public TeamData? ReadSaveFile(string filePath)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"[SaveFileService] Archivo no encontrado: {filePath}");
                return null;
            }

            var data = File.ReadAllBytes(filePath);
            var ext = Path.GetExtension(filePath).ToLowerInvariant();

            TeamData? team = IsRxData(ext, data)
                ? ReadEssentialsSave(data, filePath)
                : ReadPkhexSave(data);

            if (team == null)
            {
                Console.WriteLine("[SaveFileService] No se pudo leer el archivo de guardado");
                return null;
            }

            _cachedTeam = team;
            _lastFilePath = filePath;
            _lastModified = File.GetLastWriteTime(filePath);

            Console.WriteLine($"[SaveFileService] Equipo leído: {team.Team.Count} Pokémon de {team.TrainerName}");
            return team;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SaveFileService] Error leyendo save: {ex.Message}");
            return null;
        }
    }

    private static bool IsRxData(string ext, byte[] data)
    {
        if (ext is ".rxdata" or ".rvdata" or ".rvdata2")
            return true;

        // Cabecera Marshal 4.8
        return data.Length >= 2 && data[0] == 0x04 && data[1] == 0x08;
    }

    private static TeamData? ReadPkhexSave(byte[] data)
    {
        var sav = SaveUtil.GetVariantSAV(data);
        if (sav == null)
            return null;

        var team = new TeamData
        {
            GameVersion = sav.Version.ToString(),
            TrainerName = sav.OT,
            LastUpdated = DateTime.Now
        };

        var partyData = sav.PartyData;
        for (int i = 0; i < partyData.Count && i < 6; i++)
        {
            var pk = partyData[i];
            if (pk.Species == 0) continue;

            team.Team.Add(new PokemonData
            {
                Slot = i + 1,
                Species = pk.Species,
                SpeciesName = GetSpeciesName(pk.Species),
                Nickname = pk.Nickname,
                HasNickname = pk.IsNicknamed,
                Level = pk.CurrentLevel,
                IsShiny = pk.IsShiny,
                IsEgg = pk.IsEgg,
                Form = pk.Form,
                Gender = pk.Gender,
                CurrentHP = pk.Stat_HPCurrent,
                MaxHP = pk.Stat_HPMax,
                HeldItem = GetItemName(pk.HeldItem),
                SpriteUrl = GetSpriteUrl(pk.Species, pk.IsShiny)
            });
        }

        return team;
    }

    private static TeamData? ReadEssentialsSave(byte[] data, string filePath)
    {
        var reader = new RubyMarshalReader(data);
        var objects = reader.LoadAll();
        if (objects.Count == 0)
            return null;

        Dictionary<string, object?>? player = null;
        string gameVersion = "RPG Maker / Essentials";

        // v19+: un Hash con clave "player"
        if (objects[0] is Dictionary<string, object?> rootHash &&
            rootHash.TryGetValue("player", out var playerObj) &&
            playerObj is Dictionary<string, object?> playerDict)
        {
            player = playerDict;
            if (rootHash.TryGetValue("game_version", out var gv) && gv != null)
                gameVersion = $"Essentials ({gv})";
            else if (rootHash.TryGetValue("essentials_version", out var ev) && ev != null)
                gameVersion = $"Essentials {ev}";
        }
        else
        {
            // pre-v19: primer objeto suele ser Trainer / Player con @party
            player = objects
                .OfType<Dictionary<string, object?>>()
                .FirstOrDefault(o => o.ContainsKey("party"));
        }

        if (player == null)
            return null;

        var team = new TeamData
        {
            GameVersion = gameVersion,
            TrainerName = GetString(player, "name") ?? Path.GetFileNameWithoutExtension(filePath),
            LastUpdated = DateTime.Now
        };

        if (player.TryGetValue("party", out var partyObj) && partyObj is List<object?> party)
        {
            for (int i = 0; i < party.Count && i < 6; i++)
            {
                if (party[i] is not Dictionary<string, object?> pk)
                    continue;

                var speciesKey = GetString(pk, "species");
                if (string.IsNullOrEmpty(speciesKey))
                    continue;

                var speciesId = EssentialsSpeciesMap.Resolve(speciesKey);
                if (speciesId == 0)
                {
                    Console.WriteLine($"[SaveFileService] Especie Essentials desconocida: {speciesKey}");
                }

                var speciesName = EssentialsSpeciesMap.GetDisplayName(speciesId, speciesKey);
                var nickname = GetString(pk, "name");
                var hasNickname = !string.IsNullOrWhiteSpace(nickname) &&
                                  !string.Equals(nickname, speciesName, StringComparison.OrdinalIgnoreCase) &&
                                  !string.Equals(nickname, speciesKey, StringComparison.OrdinalIgnoreCase);

                var isShiny = GetBool(pk, "shiny") || GetBool(pk, "super_shiny");
                var form = GetInt(pk, "form");
                var level = GetInt(pk, "level");
                var hp = GetInt(pk, "hp");
                var totalHp = GetInt(pk, "totalhp");
                if (totalHp <= 0) totalHp = Math.Max(hp, 1);

                var stepsToHatch = GetInt(pk, "steps_to_hatch");
                var isEgg = stepsToHatch > 0;

                var gender = GetInt(pk, "gender");
                if (gender is < 0 or > 2) gender = 2;

                var item = FormatEssentialsSymbol(GetRaw(pk, "item"));

                team.Team.Add(new PokemonData
                {
                    Slot = i + 1,
                    Species = speciesId,
                    SpeciesName = speciesName,
                    Nickname = hasNickname ? nickname! : speciesName,
                    HasNickname = hasNickname,
                    Level = level,
                    IsShiny = isShiny,
                    IsEgg = isEgg,
                    Form = form,
                    Gender = gender,
                    CurrentHP = hp,
                    MaxHP = totalHp,
                    HeldItem = item,
                    SpriteUrl = GetSpriteUrl(speciesId, isShiny)
                });
            }
        }

        return team;
    }

    private static object? GetRaw(Dictionary<string, object?> obj, string key)
        => obj.TryGetValue(key, out var v) ? v : null;

    private static string? GetString(Dictionary<string, object?> obj, string key)
    {
        if (!obj.TryGetValue(key, out var v) || v == null)
            return null;
        return v switch
        {
            string s => s,
            _ => v.ToString()
        };
    }

    private static int GetInt(Dictionary<string, object?> obj, string key)
    {
        if (!obj.TryGetValue(key, out var v) || v == null)
            return 0;
        return v switch
        {
            int i => i,
            long l => (int)l,
            byte b => b,
            short s => s,
            string s when int.TryParse(s, out var n) => n,
            _ => 0
        };
    }

    private static bool GetBool(Dictionary<string, object?> obj, string key)
    {
        if (!obj.TryGetValue(key, out var v) || v == null)
            return false;
        return v switch
        {
            bool b => b,
            int i => i != 0,
            string s => s is "true" or "True" or "T",
            _ => false
        };
    }

    private static string FormatEssentialsSymbol(object? value)
    {
        if (value == null) return "";
        var s = value.ToString() ?? "";
        if (string.IsNullOrWhiteSpace(s) || s is "0" or "null")
            return "";
        return s.Replace('_', ' ');
    }

    private static string GetSpeciesName(ushort species)
    {
        try
        {
            var strings = GameInfo.GetStrings("en");
            if (species < strings.Species.Count)
                return strings.Species[species];
        }
        catch { }
        return $"Pokemon #{species}";
    }

    private static string GetItemName(int itemId)
    {
        if (itemId == 0) return "";
        try
        {
            var strings = GameInfo.GetStrings("en");
            if (itemId < strings.Item.Count)
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
}
