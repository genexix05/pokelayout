using System.Diagnostics;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PokeLayout.Services;

public sealed class UpdateInfo
{
    public required Version LatestVersion { get; init; }
    public required string HtmlUrl { get; init; }
    public string? ReleaseName { get; init; }
}

public static class UpdateChecker
{
    private const string ReleasesApiUrl = "https://api.github.com/repos/genexix05/pokelayout/releases/latest";
    private const string ReleasesPageUrl = "https://github.com/genexix05/pokelayout/releases/latest";

    private static readonly HttpClient Http = CreateClient();

    public static Version CurrentVersion
    {
        get
        {
            var asm = Assembly.GetExecutingAssembly();
            return asm.GetName().Version ?? new Version(1, 0, 0, 0);
        }
    }

    public static string CurrentVersionDisplay => FormatVersion(CurrentVersion);

    public static async Task<UpdateInfo?> CheckForUpdateAsync(CancellationToken ct = default)
    {
        using var response = await Http.GetAsync(ReleasesApiUrl, ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var release = await JsonSerializer.DeserializeAsync<GitHubRelease>(stream, cancellationToken: ct);
        if (release is null || string.IsNullOrWhiteSpace(release.TagName))
            return null;

        if (!TryParseVersion(release.TagName, out var latest))
            return null;

        var current = Normalize(CurrentVersion);
        if (latest <= current)
            return null;

        return new UpdateInfo
        {
            LatestVersion = latest,
            HtmlUrl = string.IsNullOrWhiteSpace(release.HtmlUrl) ? ReleasesPageUrl : release.HtmlUrl,
            ReleaseName = release.Name
        };
    }

    public static void OpenReleasePage(string? url = null)
    {
        var target = string.IsNullOrWhiteSpace(url) ? ReleasesPageUrl : url;
        Process.Start(new ProcessStartInfo
        {
            FileName = target,
            UseShellExecute = true
        });
    }

    public static string FormatVersion(Version version)
    {
        var major = version.Major;
        var minor = version.Minor;
        var build = Math.Max(version.Build, 0);
        return version.Revision > 0
            ? $"v{major}.{minor}.{build}.{version.Revision}"
            : $"v{major}.{minor}.{build}";
    }

    private static Version Normalize(Version version) =>
        new(version.Major, version.Minor, Math.Max(version.Build, 0));

    private static bool TryParseVersion(string tag, out Version version)
    {
        version = new Version(0, 0);
        var cleaned = tag.Trim();
        if (cleaned.StartsWith("v", StringComparison.OrdinalIgnoreCase))
            cleaned = cleaned[1..];

        // Soporta "1.4.0" o "1.4.0-beta" → toma la parte numérica
        var dash = cleaned.IndexOf('-');
        if (dash >= 0)
            cleaned = cleaned[..dash];

        if (!Version.TryParse(cleaned, out var parsed))
            return false;

        version = Normalize(parsed);
        return true;
    }

    private static HttpClient CreateClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd("PokeLayout-Updater");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        return client;
    }

    private sealed class GitHubRelease
    {
        [JsonPropertyName("tag_name")]
        public string? TagName { get; set; }

        [JsonPropertyName("html_url")]
        public string? HtmlUrl { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
