using PKHeX.Core;

namespace PokeLayout.Services;

/// <summary>
/// Convierte nombres internos de Pokémon Essentials (p.ej. CHARMANDER, MR_MIME) a dex nacional.
/// </summary>
internal static class EssentialsSpeciesMap
{
    private static readonly Dictionary<string, int> Map = Build();

    public static int Resolve(string? essentialsName)
    {
        if (string.IsNullOrWhiteSpace(essentialsName))
            return 0;

        var key = Normalize(essentialsName);
        if (Map.TryGetValue(key, out var id))
            return id;

        // Sin guiones bajos: MR_MIME -> MRMIME
        var compact = key.Replace("_", "", StringComparison.Ordinal);
        if (Map.TryGetValue(compact, out id))
            return id;

        return 0;
    }

    public static string GetDisplayName(int speciesId, string? essentialsName)
    {
        try
        {
            var strings = GameInfo.GetStrings("en");
            if (speciesId > 0 && speciesId < strings.Species.Count)
                return strings.Species[speciesId];
        }
        catch { }

        if (!string.IsNullOrWhiteSpace(essentialsName))
            return ToTitleCase(essentialsName.Replace('_', ' '));

        return $"Pokemon #{speciesId}";
    }

    private static Dictionary<string, int> Build()
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var strings = GameInfo.GetStrings("en");
            for (int i = 1; i < strings.Species.Count; i++)
            {
                var name = strings.Species[i];
                if (string.IsNullOrWhiteSpace(name) || name.StartsWith("???", StringComparison.Ordinal))
                    continue;

                foreach (var key in EssentialsKeysFromEnglish(name))
                {
                    if (!map.ContainsKey(key))
                        map[key] = i;
                }
            }
        }
        catch { }

        // Alias frecuentes de Essentials / fan games
        Add(map, 29, "NIDORANF", "NIDORAN_F");
        Add(map, 32, "NIDORANM", "NIDORAN_M");
        Add(map, 83, "FARFETCHD", "FARFETCH_D");
        Add(map, 122, "MRMIME", "MR_MIME");
        Add(map, 250, "HOOH", "HO_OH");
        Add(map, 439, "MIMEJR", "MIME_JR");
        Add(map, 474, "PORYGONZ", "PORYGON_Z");
        Add(map, 669, "FLABEBE");
        Add(map, 772, "TYPENULL", "TYPE_NULL", "TYPENULL");
        Add(map, 785, "TAPUKOKO", "TAPU_KOKO");
        Add(map, 786, "TAPULELE", "TAPU_LELE");
        Add(map, 787, "TAPUBULU", "TAPU_BULU");
        Add(map, 788, "TAPUFINI", "TAPU_FINI");
        Add(map, 782, "JANGMOO", "JANGMO_O");
        Add(map, 783, "HAKAMOO", "HAKAMO_O");
        Add(map, 784, "KOMMOO", "KOMMO_O");
        Add(map, 865, "SIRFETCHD", "SIRFETCH_D");
        Add(map, 866, "MRRIME", "MR_RIME");
        Add(map, 902, "BASCULEGION");
        Add(map, 979, "ANNIHILAPE");

        return map;
    }

    private static void Add(Dictionary<string, int> map, int id, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (!map.ContainsKey(key))
                map[key] = id;
        }
    }

    private static IEnumerable<string> EssentialsKeysFromEnglish(string english)
    {
        var s = english.Trim()
            .Replace("♀", "F", StringComparison.Ordinal)
            .Replace("♂", "M", StringComparison.Ordinal)
            .Replace("'", "", StringComparison.Ordinal)
            .Replace(".", "", StringComparison.Ordinal)
            .Replace(":", "", StringComparison.Ordinal)
            .Replace(" ", "_", StringComparison.Ordinal)
            .Replace("-", "_", StringComparison.Ordinal);

        // Quitar acentos básicos
        s = s.Replace("é", "e", StringComparison.OrdinalIgnoreCase)
             .Replace("á", "a", StringComparison.OrdinalIgnoreCase)
             .Replace("í", "i", StringComparison.OrdinalIgnoreCase)
             .Replace("ó", "o", StringComparison.OrdinalIgnoreCase)
             .Replace("ú", "u", StringComparison.OrdinalIgnoreCase);

        var upper = s.ToUpperInvariant();
        yield return upper;
        yield return upper.Replace("_", "", StringComparison.Ordinal);
    }

    private static string Normalize(string name)
    {
        var s = name.Trim();
        if (s.StartsWith(':')) s = s[1..];
        return s.ToUpperInvariant();
    }

    private static string ToTitleCase(string value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        var parts = value.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        for (int i = 0; i < parts.Length; i++)
        {
            if (parts[i].Length == 0) continue;
            parts[i] = char.ToUpperInvariant(parts[i][0]) + parts[i][1..];
        }
        return string.Join(' ', parts);
    }
}
