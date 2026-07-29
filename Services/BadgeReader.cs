using PKHeX.Core;

namespace PokeLayout.Services;

public class BadgeEntry
{
    public int SpriteId { get; set; }
    public string Name { get; set; } = "";
    public bool Obtained { get; set; }
}

public class BadgeSetData
{
    public string Region { get; set; } = "";
    public List<BadgeEntry> Badges { get; set; } = new();
}

public static class BadgeReader
{
    private static readonly string[] Kanto =
    [
        "Roca", "Cascada", "Rayo", "Arcoíris", "Alma", "Pantano", "Volcán", "Tierra"
    ];

    private static readonly string[] Johto =
    [
        "Zephyr", "Colmena", "Planicie", "Fogón", "Pantano", "Mineral", "Glaciar", "Dragón"
    ];

    private static readonly string[] Hoenn =
    [
        "Piedra", "Puñetazo", "Dinamo", "Calor", "Equilibrio", "Fe", "Mente", "Lluvia"
    ];

    private static readonly string[] Sinnoh =
    [
        "Carbón", "Bosque", "Cobre", "Relicario", "Icónica", "Glaciar", "Guadaña", "Isla"
    ];

    private static readonly string[] Unova =
    [
        "Trio", "Básico", "Insecto", "Voltaje", "Quimera", "Jet", "Psique", "Legado"
    ];

    private static readonly string[] Kalos =
    [
        "Bug", "Roca", "Planta", "Relámpago", "Psique", "Hielo", "Dragón", "Fada"
    ];

    private static readonly string[] Galar =
    [
        "Hierba", "Agua", "Fuego", "Lucha", "Hada", "Roca", "Oscuro", "Dragón"
    ];

    private static readonly string[] GalarExtra =
    [
        "Isla", "Corona"
    ];

    private static readonly (uint Key, int SpriteId, string Name)[] PaldeaGyms =
    [
        (0x89306FE6, 70, "Insecto"),
        (0xB4C3AFE6, 71, "Planta"),
        (0x8205ECAD, 72, "Eléctrico"),
        (0xA803FAAD, 73, "Agua"),
        (0xF90EFD79, 74, "Normal"),
        (0x3B819021, 75, "Psíquico"),
        (0xCDA61DED, 76, "Fantasma"),
        (0x46B6CB30, 77, "Hielo"),
    ];

    private static readonly (uint Key, int SpriteId, string Name)[] PaldeaTitans =
    [
        (0xA6CDE603, 59, "Roca"),
        (0xBDAC74B3, 60, "Tierra"),
        (0x9C16DA94, 61, "Volador"),
        (0x0D0602DE, 62, "Acero"),
        (0xEC7361B7, 63, "Dragón"),
    ];

    private static readonly (uint Key, int SpriteId, string Name)[] PaldeaStar =
    [
        (0x6C29ACC5, 64, "Siniestro"),
        (0x71DB2CEB, 65, "Veneno"),
        (0xE1271327, 66, "Hada"),
        (0x9C6FF7DD, 67, "Fuego"),
        (0x2A3AC89A, 68, "Lucha"),
    ];

    public static List<BadgeSetData> Extract(SaveFile sav)
    {
        return sav switch
        {
            SAV1 s1 => [FromBitmask("Kanto", s1.Badges, 1, Kanto)],
            SAV2 s2 => ExtractGen2(s2),
            SAV3FRLG s3f => [FromBitmask("Kanto", s3f.Badges, 1, Kanto)],
            SAV3E s3e => [FromBitmask("Hoenn", s3e.Badges, 17, Hoenn)],
            SAV3RS s3rs => [FromBitmask("Hoenn", s3rs.Badges, 17, Hoenn)],
            SAV3 s3 => [FromBitmask("Hoenn", s3.Badges, 17, Hoenn)],
            SAV4HGSS s4h => ExtractHgss(s4h),
            SAV4 s4 => [FromBitmask("Sinnoh", s4.Badges, 25, Sinnoh)],
            SAV5 s5 => [FromBitmask("Teselia", s5.Misc.Badges, 33, Unova)],
            SAV6XY s6xy => [FromBitmask("Kalos", s6xy.Badges, 41, Kalos)],
            SAV6AO s6ao => [FromBitmask("Kalos", s6ao.Badges, 41, Kalos)],
            SAV7b s7b => [ExtractLetsGo(s7b)],
            SAV8SWSH s8 => ExtractSwSh(s8),
            SAV8BS s8b => [ExtractBdsp(s8b)],
            SAV9SV s9 => ExtractSv(s9),
            _ => []
        };
    }

    public static List<BadgeSetData> ExtractEssentials(Dictionary<string, object?> player)
    {
        if (!player.TryGetValue("badges", out var raw) || raw == null)
            return [];

        var bitmask = raw switch
        {
            int i => i,
            long l => (int)l,
            byte b => b,
            short s => s,
            _ => 0
        };

        if (bitmask == 0)
            return [];

        // La mayoría de fan games Essentials usan medallas estilo Kanto (8)
        return [FromBitmask("Medallas", bitmask, 1, Kanto)];
    }

    private static List<BadgeSetData> ExtractGen2(SAV2 s2)
    {
        var value = s2.Badges;
        return
        [
            FromBitmask("Johto", value & 0xFF, 9, Johto),
            FromBitmask("Kanto", (value >> 8) & 0xFF, 1, Kanto)
        ];
    }

    private static List<BadgeSetData> ExtractHgss(SAV4HGSS s4)
    {
        return
        [
            FromBitmask("Johto", s4.Badges, 9, Johto),
            FromBitmask("Kanto", s4.Badges16, 1, Kanto)
        ];
    }

    private static BadgeSetData ExtractLetsGo(SAV7b s7b)
    {
        // FSYS_GYM_CLEAR_* (s0012–s0019 en flags_gg_en.txt)
        var flags = new[] { 12, 13, 14, 15, 16, 17, 18, 19 };
        var set = new BadgeSetData { Region = "Kanto" };
        for (int i = 0; i < flags.Length; i++)
        {
            set.Badges.Add(new BadgeEntry
            {
                SpriteId = 1 + i,
                Name = Kanto[i],
                Obtained = TryGetEventFlag(s7b, flags[i])
            });
        }
        return set;
    }

    private static bool TryGetEventFlag(SaveFile sav, int flagNumber)
    {
        var method = sav.GetType().GetMethod("GetEventFlag", [typeof(int)]);
        if (method == null)
            return false;
        try
        {
            return Convert.ToBoolean(method.Invoke(sav, [flagNumber]) ?? false);
        }
        catch
        {
            return false;
        }
    }

    private static List<BadgeSetData> ExtractSwSh(SAV8SWSH s8)
    {
        var main = FromBitmask("Galar", s8.Badges, 49, Galar);
        var sets = new List<BadgeSetData> { main };

        // Medallas extra (Isla de la Armadura / Corona) en bits altos si están presentes
        var extraMask = s8.Badges >> 8;
        if (extraMask != 0)
            sets.Add(FromBitmask("Galar (DLC)", extraMask, 57, GalarExtra));

        return sets;
    }

    private static BadgeSetData ExtractBdsp(SAV8BS s8b)
    {
        var set = new BadgeSetData { Region = "Sinnoh" };
        for (int i = 0; i < 8; i++)
        {
            set.Badges.Add(new BadgeEntry
            {
                SpriteId = 25 + i,
                Name = Sinnoh[i],
                Obtained = s8b.FlagWork.GetSystemFlag(124 + i)
            });
        }
        return set;
    }

    private static List<BadgeSetData> ExtractSv(SAV9SV s9)
    {
        return
        [
            FromEventKeys("Gimnasios", s9, PaldeaGyms),
            FromEventKeys("Dominantes", s9, PaldeaTitans),
            FromEventKeys("Team Star", s9, PaldeaStar)
        ];
    }

    private static BadgeSetData FromEventKeys(string region, SAV9SV s9, (uint Key, int SpriteId, string Name)[] entries)
    {
        var set = new BadgeSetData { Region = region };
        foreach (var (key, spriteId, name) in entries)
        {
            var obtained = false;
            try { obtained = s9.GetValue<int>(key) > 0; }
            catch { /* bloque ausente en saves antiguos */ }

            set.Badges.Add(new BadgeEntry
            {
                SpriteId = spriteId,
                Name = name,
                Obtained = obtained
            });
        }
        return set;
    }

    private static BadgeSetData FromBitmask(string region, int bitmask, int startSpriteId, string[] names)
    {
        var set = new BadgeSetData { Region = region };
        for (int i = 0; i < names.Length; i++)
        {
            set.Badges.Add(new BadgeEntry
            {
                SpriteId = startSpriteId + i,
                Name = names[i],
                Obtained = (bitmask & (1 << i)) != 0
            });
        }
        return set;
    }
}
