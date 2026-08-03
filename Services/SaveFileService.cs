using PKHeX.Core;

namespace PokeLayout.Services;

public class PokemonData
{
    public int Slot { get; set; }
    public int Species { get; set; }
    public string SpeciesName { get; set; } = "";
    public string SpeciesKey { get; set; } = "";
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
    /// <summary>Pokémon de la última caja del PC (cementerio nuzlocke).</summary>
    public List<PokemonData> Cemetery { get; set; } = new();
    public int CemeteryBoxIndex { get; set; } = -1;
    public List<BadgeSetData> BadgeSets { get; set; } = new();
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
            var fileName = Path.GetFileName(filePath);

            TeamData? team = IsRxData(ext, data)
                ? ReadEssentialsSave(data, filePath)
                : ReadPkhexSave(data, filePath);

            if (team == null)
            {
                Console.WriteLine($"[SaveFileService] No se pudo leer el archivo de guardado ({fileName})");
                return null;
            }

            _cachedTeam = team;
            _lastFilePath = filePath;
            _lastModified = File.GetLastWriteTime(filePath);

            Console.WriteLine($"[SaveFileService] Equipo leído: {team.Team.Count} Pokémon de {team.TrainerName}" +
                (team.Cemetery.Count > 0 ? $", cementerio: {team.Cemetery.Count} (caja {team.CemeteryBoxIndex + 1})" : ""));
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

    private static TeamData? ReadPkhexSave(byte[] data, string filePath)
    {
        // Preferir carga por ruta: PKHeX detecta mejor algunos dumps de Switch (main/backup)
        SaveFile? sav = null;
        try
        {
            if (!string.IsNullOrWhiteSpace(filePath) && File.Exists(filePath))
                sav = SaveUtil.GetSaveFile(filePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SaveFileService] GetSaveFile(path) falló: {ex.Message}");
        }

        try
        {
            sav ??= SaveUtil.GetSaveFile(data, filePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SaveFileService] GetSaveFile(data) falló: {ex.Message}");
        }

        // Algunos dumps de emulador traen padding; probar tamaños típicos de Switch
        if (sav == null)
            sav = TryLoadSwitchSizedSave(data, filePath);

        if (sav != null)
        {
            var team = BuildTeamFromSave(sav);
            team.BadgeSets = BadgeReader.Extract(sav);
            return team;
        }

        // Luminescent Platinum / forks: PKHeX oficial no los reconoce
        if (LumiSaveBridge.IsLumiCandidate(data, filePath))
        {
            var lumi = LumiSaveBridge.TryRead(data, filePath);
            if (lumi != null)
                return lumi;
        }

        return null;
    }

    private static TeamData BuildTeamFromSave(SaveFile sav)
    {
        var team = new TeamData
        {
            GameVersion = FormatGameVersion(sav),
            TrainerName = sav.OT,
            LastUpdated = DateTime.Now
        };

        var partyData = sav.PartyData;
        for (int i = 0; i < partyData.Count && i < 6; i++)
        {
            var pk = partyData[i];
            if (pk.Species == 0) continue;
            team.Team.Add(BuildPokemonFromPkhex(pk, i + 1));
        }

        FillCemeteryFromPkhex(sav, team);
        return team;
    }

    private static void FillCemeteryFromPkhex(SaveFile sav, TeamData team)
    {
        try
        {
            if (!sav.HasBox || sav.BoxCount <= 0)
                return;

            var lastBox = sav.BoxCount - 1;
            team.CemeteryBoxIndex = lastBox;
            var box = sav.GetBoxData(lastBox);
            for (int i = 0; i < box.Length; i++)
            {
                var pk = box[i];
                if (pk.Species == 0) continue;
                team.Cemetery.Add(BuildPokemonFromPkhex(pk, i + 1));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SaveFileService] No se pudo leer cementerio (última caja): {ex.Message}");
        }
    }

    private static PokemonData BuildPokemonFromPkhex(PKM pk, int slot) => new()
    {
        Slot = slot,
        Species = pk.Species,
        SpeciesName = GetSpeciesName(pk.Species),
        SpeciesKey = NormalizeSpeciesKey(GetSpeciesName(pk.Species)),
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
    };

    /// <summary>
    /// Intenta recortar dumps con bytes extra (algunos backups de Switch/emulador).
    /// </summary>
    private static SaveFile? TryLoadSwitchSizedSave(byte[] data, string? filePath)
    {
        if (data.Length < 0x10000)
            return null;

        // Reintento: a veces hay footer de emulador al final (pocos KB)
        foreach (var trim in new[] { 0x4, 0x10, 0x100, 0x200, 0x1000 })
        {
            if (data.Length <= trim) continue;
            try
            {
                var slice = data.AsSpan(0, data.Length - trim).ToArray();
                var sav = SaveUtil.GetSaveFile(slice, filePath);
                if (sav != null)
                {
                    Console.WriteLine($"[SaveFileService] Save leído tras recortar {trim} bytes del final");
                    return sav;
                }
            }
            catch { }
        }

        return null;
    }

    private static string FormatGameVersion(SaveFile sav)
    {
        try
        {
            var version = sav.Version.ToString();
            var gen = sav.Generation;
            // Switch: Gen 8 (SwSh/BDSP/LA) y Gen 9 (SV)
            if (gen is 8 or 9)
                return $"{version} (Switch / Gen {gen})";
            return version;
        }
        catch
        {
            return sav.Version.ToString();
        }
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
            BadgeSets = BadgeReader.ExtractEssentials(player),
            LastUpdated = DateTime.Now
        };

        if (player.TryGetValue("party", out var partyObj) && partyObj is List<object?> party)
        {
            for (int i = 0; i < party.Count && i < 6; i++)
            {
                var poke = TryBuildEssentialsPokemon(party[i], i + 1);
                if (poke != null)
                    team.Team.Add(poke);
            }
        }

        FillCemeteryFromEssentials(objects, player, team);
        return team;
    }

    private static void FillCemeteryFromEssentials(
        List<object?> objects,
        Dictionary<string, object?> player,
        TeamData team)
    {
        try
        {
            var boxes = FindEssentialsBoxes(objects, player);
            if (boxes == null || boxes.Count == 0)
                return;

            var lastIdx = boxes.Count - 1;
            team.CemeteryBoxIndex = lastIdx;
            var lastBox = boxes[lastIdx];
            var slots = ExtractEssentialsBoxSlots(lastBox);
            for (int i = 0; i < slots.Count; i++)
            {
                var poke = TryBuildEssentialsPokemon(slots[i], i + 1);
                if (poke != null)
                    team.Cemetery.Add(poke);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SaveFileService] Cementerio Essentials: {ex.Message}");
        }
    }

    private static List<object?>? FindEssentialsBoxes(
        List<object?> objects,
        Dictionary<string, object?> player)
    {
        // v19+: storage en el hash raíz; pre-v19: objeto PokemonStorage suelto o en player
        foreach (var obj in objects)
        {
            if (obj is Dictionary<string, object?> root)
            {
                var fromRoot = TryGetBoxesFromStorage(GetRaw(root, "storage")
                    ?? GetRaw(root, "pokemon_storage")
                    ?? GetRaw(root, "pc"));
                if (fromRoot != null) return fromRoot;
            }
        }

        var fromPlayer = TryGetBoxesFromStorage(GetRaw(player, "storage")
            ?? GetRaw(player, "pokemon_storage")
            ?? GetRaw(player, "pc"));
        if (fromPlayer != null) return fromPlayer;

        foreach (var obj in objects.OfType<Dictionary<string, object?>>())
        {
            if (obj.ContainsKey("boxes") || obj.ContainsKey("box"))
            {
                var boxes = TryGetBoxesFromStorage(obj);
                if (boxes != null) return boxes;
            }
        }

        return null;
    }

    private static List<object?>? TryGetBoxesFromStorage(object? storage)
    {
        if (storage is not Dictionary<string, object?> dict)
            return null;

        if (GetRaw(dict, "boxes") is List<object?> boxes && boxes.Count > 0)
            return boxes;

        if (GetRaw(dict, "box") is List<object?> box && box.Count > 0)
            return box;

        return null;
    }

    private static List<object?> ExtractEssentialsBoxSlots(object? box)
    {
        if (box is List<object?> list)
            return list;

        if (box is Dictionary<string, object?> dict)
        {
            foreach (var key in new[] { "pokemon", "pokemons", "contents", "data", "slots" })
            {
                if (GetRaw(dict, key) is List<object?> slots)
                    return slots;
            }
        }

        return [];
    }

    private static PokemonData? TryBuildEssentialsPokemon(object? raw, int slot)
    {
        if (raw is not Dictionary<string, object?> pk)
            return null;

        var speciesKey = GetString(pk, "species");
        if (string.IsNullOrEmpty(speciesKey))
            return null;

        var speciesId = EssentialsSpeciesMap.Resolve(speciesKey);
        if (speciesId == 0)
            Console.WriteLine($"[SaveFileService] Especie Essentials desconocida: {speciesKey}");

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

        return new PokemonData
        {
            Slot = slot,
            Species = speciesId,
            SpeciesName = speciesName,
            SpeciesKey = NormalizeSpeciesKey(speciesKey),
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
        };
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

    private static string NormalizeSpeciesKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key)) return "";
        return key.Trim().TrimStart(':').ToUpperInvariant().Replace(" ", "");
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
