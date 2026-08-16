using PKHeX.Core;

namespace PokeLayout.Services;

public class BadgeEntry
{
    public int SpriteId { get; set; }
    public string Name { get; set; } = "";
    public bool Obtained { get; set; }
    /// <summary>URL local o absoluta; si hay valor, el frontend la usa en lugar de PokeAPI.</summary>
    public string? ImageUrl { get; set; }
    /// <summary>Clase CSS extra (p. ej. "kahuna").</summary>
    public string? CssClass { get; set; }
    /// <summary>Color de acento (anillo del portrait).</summary>
    public string? Accent { get; set; }
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

    // PokeAPI insertó Toxic (35) y Bolt (37) en Unova; las 8 medallas clásicas saltan esos índices.
    private static readonly int[] UnovaSprites = [33, 34, 36, 38, 39, 40, 41, 42];

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

    // IDs PokeAPI tras el rearrange de Unova (+2 desde Kalos en adelante).
    // Kanto 1–8, Johto 9–16, Hoenn 17–24, Sinnoh 25–32,
    // Unova 33–42, Kalos 43–50, Galar 51–58, Galar DLC 59–60,
    // Dominantes 61–65, Team Star 66–69 (+ lucha sin sprite dedicado), gimnasios Paldea 70–77.
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
        (0xA6CDE603, 61, "Roca"),
        (0xBDAC74B3, 62, "Tierra"),
        (0x9C16DA94, 63, "Volador"),
        (0x0D0602DE, 64, "Acero"),
        (0xEC7361B7, 65, "Dragón"),
    ];

    private static readonly (uint Key, int SpriteId, string Name)[] PaldeaStar =
    [
        (0x6C29ACC5, 66, "Siniestro"),
        (0x71DB2CEB, 67, "Veneno"),
        (0xE1271327, 68, "Hada"),
        (0x9C6FF7DD, 69, "Fuego"),
        // PokeAPI solo tiene 4 emblemas Star (66–69); reutilizamos 69 para Lucha.
        (0x2A3AC89A, 69, "Lucha"),
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
            SAV5 s5 => [FromSprites("Teselia", s5.Misc.Badges, UnovaSprites, Unova)],
            SAV6XY s6xy => [FromBitmask("Kalos", s6xy.Badges, 43, Kalos)],
            // ORAS reutiliza el bitmask de Hoenn (no Kalos).
            SAV6AO s6ao => [FromBitmask("Hoenn", s6ao.Badges, 17, Hoenn)],
            SAV7SM s7sm => [ExtractAlolaKahunas(s7sm.Inventory)],
            SAV7USUM s7u => [ExtractAlolaKahunas(s7u.Inventory)],
            SAV7b s7b => [ExtractLetsGo(s7b)],
            SAV8SWSH s8 => ExtractSwSh(s8),
            SAV8BS s8b => [ExtractBdsp(s8b)],
            SAV9SV s9 => ExtractSv(s9),
            _ => []
        };
    }

    // Cristales Z en la bolsa (ZCrystalKey). Los IDs held (782…) no se guardan en el pouch.
    private static readonly (string File, string Name, string Accent, int ItemId)[] AlolaKahunas =
    [
        ("hala", "Hala", "#e8a838", 813),    // Fightinium Z — Melemele
        ("olivia", "Mayla", "#c4785a", 819), // Rockium Z — Akala
        ("nanu", "Denio", "#7060a0", 822),   // Darkinium Z — Ula'ula
        ("hapu", "Hela", "#c9a227", 815),    // Groundium Z — Poni
    ];

    private static BadgeSetData ExtractAlolaKahunas(PlayerBag bag)
    {
        var owned = new HashSet<int>();
        try
        {
            foreach (var item in bag.GetPouch(InventoryType.ZCrystals).Items)
            {
                if (item.Count > 0)
                    owned.Add(item.Index);
            }
        }
        catch
        {
            /* pouch no disponible */
        }

        var set = new BadgeSetData { Region = "Kahunas" };
        foreach (var (file, name, accent, itemId) in AlolaKahunas)
        {
            set.Badges.Add(new BadgeEntry
            {
                Name = name,
                Obtained = owned.Contains(itemId),
                ImageUrl = $"/kahunas/{file}.png",
                CssClass = "kahuna",
                Accent = accent
            });
        }
        return set;
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
        var main = FromBitmask("Galar", s8.Badges, 51, Galar);
        var sets = new List<BadgeSetData> { main };

        // Medallas extra (Isla de la Armadura / Corona) en bits altos si están presentes
        var extraMask = s8.Badges >> 8;
        if (extraMask != 0)
            sets.Add(FromBitmask("Galar (DLC)", extraMask, 59, GalarExtra));

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

    private static BadgeSetData FromSprites(string region, int bitmask, int[] spriteIds, string[] names)
    {
        var set = new BadgeSetData { Region = region };
        var count = Math.Min(spriteIds.Length, names.Length);
        for (int i = 0; i < count; i++)
        {
            set.Badges.Add(new BadgeEntry
            {
                SpriteId = spriteIds[i],
                Name = names[i],
                Obtained = (bitmask & (1 << i)) != 0
            });
        }
        return set;
    }
}
