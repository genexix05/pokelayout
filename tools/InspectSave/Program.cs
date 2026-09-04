using PKHeX.Core;
foreach (var path in args)
{
    var sav = SaveUtil.GetSaveFile(Path.GetFullPath(path));
    if (sav==null){ Console.WriteLine(path+": NULL"); continue; }
    Console.WriteLine($"=== {Path.GetFileName(path)} {sav.GetType().Name} {sav.Version} ===");
    Console.WriteLine($"BoxCount={sav.BoxCount} Unlocked={sav.BoxesUnlocked}");
    if (sav is IBoxDetailName names)
    {
        for (int b=0;b<sav.BoxCount;b++)
        {
            var n = names.GetBoxName(b);
            var occ = sav.GetBoxData(b).Count(p=>p.Species!=0);
            if (occ==0 && sav.BoxesUnlocked>0 && b!=sav.BoxesUnlocked-1) continue;
            if (occ==0 && (sav.BoxesUnlocked<=0 || b!=sav.BoxCount-1) && !LooksCem(n)) continue;
            Console.WriteLine($"  Box {b+1} '{n}' occ={occ}");
        }
    }
}
static bool LooksCem(string n)
{
    var s = n.ToLowerInvariant();
    string[] k = ["muert","dead","death","cement","cimit","cimet","grave","tumba","fallen","friedhof","nuzlocke","rip","morti","morte"];
    return k.Any(x => s.Contains(x));
}
