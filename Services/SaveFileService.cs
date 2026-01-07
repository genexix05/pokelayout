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
            var sav = SaveUtil.GetVariantSAV(data);

            if (sav == null)
            {
                Console.WriteLine("[SaveFileService] No se pudo leer el archivo .sav");
                return null;
            }

            var team = new TeamData
            {
                GameVersion = sav.Version.ToString(),
                TrainerName = sav.OT,
                LastUpdated = DateTime.Now
            };

            // Leer el equipo del jugador
            var partyData = sav.PartyData;
            for (int i = 0; i < partyData.Count && i < 6; i++)
            {
                var pk = partyData[i];
                if (pk.Species == 0) continue;

                var pokemon = new PokemonData
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
                    SpriteUrl = GetSpriteUrl(pk)
                };

                team.Team.Add(pokemon);
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

    private static string GetSpeciesName(ushort species)
    {
        // PKHeX tiene los nombres en GameInfo
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

    private static string GetSpriteUrl(PKM pk)
    {
        // Usamos PokeAPI sprites o ProjectPokemon
        // Formato para sprites de PokeAPI
        var species = pk.Species;
        var shiny = pk.IsShiny ? "shiny/" : "";
        var form = pk.Form > 0 ? $"-{pk.Form}" : "";
        
        // URL base de sprites (usando PokeAPI)
        // Alternativa: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/
        return $"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{shiny}{species}.png";
    }
}

