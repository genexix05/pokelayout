using System.Net;
using System.Text;
using System.Text.Json;
using PokeLayout.Services;

namespace PokeLayout.Forms;

public class MainForm : Form
{
    private readonly SaveFileService _saveService = new();
    private FileSystemWatcher? _watcher;
    private HttpListener? _httpListener;
    private CancellationTokenSource? _httpCts;
    private string _savePath = "";
    private DateTime _lastRead = DateTime.MinValue;
    private readonly object _lock = new();

    // Controles UI
    private Panel _sidePanel = null!;
    private Panel _mainPanel = null!;
    private Button _openSaveButton = null!;
    private Label _statusLabel = null!;
    private Label _serverLabel = null!;
    private FlowLayoutPanel _teamFlowPanel = null!;
    private NotifyIcon _trayIcon = null!;
    private Button _copyUrlButton = null!;

    // Colores del tema
    private readonly Color _bgDark = Color.FromArgb(15, 15, 25);
    private readonly Color _bgPanel = Color.FromArgb(22, 22, 35);
    private readonly Color _bgCard = Color.FromArgb(30, 30, 48);
    private readonly Color _accent = Color.FromArgb(99, 102, 241); // Indigo
    private readonly Color _accentHover = Color.FromArgb(129, 132, 255);
    private readonly Color _success = Color.FromArgb(34, 197, 94);
    private readonly Color _textPrimary = Color.FromArgb(248, 250, 252);
    private readonly Color _textSecondary = Color.FromArgb(148, 163, 184);

    public MainForm()
    {
        InitializeComponent();
        StartHttpServer();
    }

    private void InitializeComponent()
    {
        // Configuración del formulario
        Text = "PokeLayout";
        Size = new Size(520, 480);
        MinimumSize = new Size(480, 420);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = _bgDark;
        ForeColor = _textPrimary;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;

        // Cargar icono
        try
        {
            var iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "icon.ico");
            if (File.Exists(iconPath))
            {
                Icon = new Icon(iconPath);
            }
        }
        catch { }

        // Panel lateral izquierdo (accent)
        _sidePanel = new Panel
        {
            Dock = DockStyle.Left,
            Width = 6,
            BackColor = _accent
        };

        // Panel principal
        _mainPanel = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = _bgDark,
            Padding = new Padding(30, 25, 30, 25)
        };

        // Logo/Título
        var logoPanel = new Panel
        {
            Size = new Size(440, 60),
            Location = new Point(30, 20),
            BackColor = Color.Transparent
        };

        var titleLabel = new Label
        {
            Text = "PokeLayout",
            Font = new Font("Segoe UI", 28F, FontStyle.Bold),
            ForeColor = _textPrimary,
            AutoSize = true,
            Location = new Point(0, 0)
        };

        var versionLabel = new Label
        {
            Text = "v1.0",
            Font = new Font("Segoe UI", 10F),
            ForeColor = _accent,
            AutoSize = true,
            Location = new Point(195, 15)
        };

        var subtitleLabel = new Label
        {
            Text = "Stream Overlay Tool",
            Font = new Font("Segoe UI", 10F),
            ForeColor = _textSecondary,
            AutoSize = true,
            Location = new Point(2, 42)
        };

        logoPanel.Controls.Add(titleLabel);
        logoPanel.Controls.Add(versionLabel);
        logoPanel.Controls.Add(subtitleLabel);

        // Botón Abrir Save
        _openSaveButton = new Button
        {
            Text = "  Abrir archivo de guardado",
            Size = new Size(200, 44),
            Location = new Point(30, 95),
            FlatStyle = FlatStyle.Flat,
            BackColor = _accent,
            ForeColor = Color.White,
            Font = new Font("Segoe UI Semibold", 11F),
            Cursor = Cursors.Hand,
            TextAlign = ContentAlignment.MiddleCenter
        };
        _openSaveButton.FlatAppearance.BorderSize = 0;
        _openSaveButton.FlatAppearance.MouseOverBackColor = _accentHover;
        _openSaveButton.Click += OpenSaveButton_Click;

        // Status Label
        _statusLabel = new Label
        {
            Text = "Sin archivo cargado",
            Font = new Font("Segoe UI", 9F),
            ForeColor = _textSecondary,
            AutoSize = true,
            Location = new Point(32, 148)
        };

        // Separador
        var separator = new Panel
        {
            Size = new Size(440, 1),
            Location = new Point(30, 175),
            BackColor = Color.FromArgb(45, 45, 65)
        };

        // Server info panel
        var serverPanel = new Panel
        {
            Size = new Size(440, 70),
            Location = new Point(30, 190),
            BackColor = _bgCard
        };

        var serverIcon = new Label
        {
            Text = "🌐",
            Font = new Font("Segoe UI", 16F),
            AutoSize = true,
            Location = new Point(15, 20)
        };

        _serverLabel = new Label
        {
            Text = "http://localhost:5051",
            Font = new Font("Consolas", 12F),
            ForeColor = _success,
            AutoSize = true,
            Location = new Point(50, 15)
        };

        var serverHint = new Label
        {
            Text = "Añadir como Browser Source en OBS",
            Font = new Font("Segoe UI", 9F),
            ForeColor = _textSecondary,
            AutoSize = true,
            Location = new Point(50, 40)
        };

        _copyUrlButton = new Button
        {
            Text = "Copiar",
            Size = new Size(70, 30),
            Location = new Point(355, 20),
            FlatStyle = FlatStyle.Flat,
            BackColor = Color.FromArgb(45, 45, 70),
            ForeColor = _textSecondary,
            Font = new Font("Segoe UI", 9F),
            Cursor = Cursors.Hand
        };
        _copyUrlButton.FlatAppearance.BorderColor = Color.FromArgb(60, 60, 90);
        _copyUrlButton.FlatAppearance.BorderSize = 1;
        _copyUrlButton.Click += (s, e) =>
        {
            Clipboard.SetText("http://localhost:5051");
            _copyUrlButton.Text = "✓";
            Task.Delay(1500).ContinueWith(_ => Invoke(() => _copyUrlButton.Text = "Copiar"));
        };

        serverPanel.Controls.Add(serverIcon);
        serverPanel.Controls.Add(_serverLabel);
        serverPanel.Controls.Add(serverHint);
        serverPanel.Controls.Add(_copyUrlButton);

        // Team Panel
        var teamLabel = new Label
        {
            Text = "Equipo actual",
            Font = new Font("Segoe UI Semibold", 11F),
            ForeColor = _textPrimary,
            AutoSize = true,
            Location = new Point(30, 275)
        };

        _teamFlowPanel = new FlowLayoutPanel
        {
            Location = new Point(30, 300),
            Size = new Size(440, 110),
            BackColor = _bgPanel,
            AutoScroll = false,
            FlowDirection = FlowDirection.LeftToRight,
            WrapContents = false,
            Padding = new Padding(10, 10, 10, 10)
        };

        // Placeholder para equipo vacío
        UpdateTeamDisplay(null);

        // Añadir controles
        _mainPanel.Controls.Add(logoPanel);
        _mainPanel.Controls.Add(_openSaveButton);
        _mainPanel.Controls.Add(_statusLabel);
        _mainPanel.Controls.Add(separator);
        _mainPanel.Controls.Add(serverPanel);
        _mainPanel.Controls.Add(teamLabel);
        _mainPanel.Controls.Add(_teamFlowPanel);

        Controls.Add(_mainPanel);
        Controls.Add(_sidePanel);

        // Icono de bandeja del sistema
        _trayIcon = new NotifyIcon
        {
            Text = "PokeLayout",
            Icon = this.Icon ?? SystemIcons.Application,
            Visible = true
        };

        var trayMenu = new ContextMenuStrip();
        trayMenu.Items.Add("Abrir", null, (s, e) => { Show(); WindowState = FormWindowState.Normal; });
        trayMenu.Items.Add("-");
        trayMenu.Items.Add("Salir", null, (s, e) => { Application.Exit(); });
        _trayIcon.ContextMenuStrip = trayMenu;
        _trayIcon.DoubleClick += (s, e) => { Show(); WindowState = FormWindowState.Normal; };

        // Eventos del formulario
        FormClosing += MainForm_FormClosing;
        Resize += MainForm_Resize;
    }

    private void UpdateTeamDisplay(TeamData? team)
    {
        _teamFlowPanel.Controls.Clear();

        if (team == null || team.Team.Count == 0)
        {
            var emptyLabel = new Label
            {
                Text = "No hay Pokémon cargados",
                Font = new Font("Segoe UI", 10F),
                ForeColor = _textSecondary,
                AutoSize = true,
                Margin = new Padding(10, 30, 0, 0)
            };
            _teamFlowPanel.Controls.Add(emptyLabel);
            return;
        }

        foreach (var pokemon in team.Team)
        {
            var card = CreateMiniPokemonCard(pokemon);
            _teamFlowPanel.Controls.Add(card);
        }
    }

    private Panel CreateMiniPokemonCard(PokemonData pokemon)
    {
        var card = new Panel
        {
            Size = new Size(65, 85),
            BackColor = _bgCard,
            Margin = new Padding(3)
        };

        var pokePic = new PictureBox
        {
            Size = new Size(50, 50),
            Location = new Point(7, 5),
            SizeMode = PictureBoxSizeMode.Zoom,
            BackColor = Color.Transparent
        };

        try
        {
            pokePic.LoadAsync(pokemon.SpriteUrl);
        }
        catch { }

        var nameLabel = new Label
        {
            Text = pokemon.HasNickname ? pokemon.Nickname : pokemon.SpeciesName,
            Font = new Font("Segoe UI", 7F),
            ForeColor = _textPrimary,
            TextAlign = ContentAlignment.MiddleCenter,
            Size = new Size(65, 15),
            Location = new Point(0, 55)
        };

        var lvlLabel = new Label
        {
            Text = $"Lv.{pokemon.Level}",
            Font = new Font("Segoe UI", 7F),
            ForeColor = _textSecondary,
            TextAlign = ContentAlignment.MiddleCenter,
            Size = new Size(65, 12),
            Location = new Point(0, 70)
        };

        card.Controls.Add(pokePic);
        card.Controls.Add(nameLabel);
        card.Controls.Add(lvlLabel);

        return card;
    }

    private void OpenSaveButton_Click(object? sender, EventArgs e)
    {
        using var openFileDialog = new OpenFileDialog
        {
            Title = "Selecciona tu archivo de guardado",
            Filter =
                "Todos los saves|main;backup;SaveData.bin;*.sav;*.dsv;*.dat;*.bin;*.gci;*.sa1;*.sa2;*.rxdata;*.rvdata;*.rvdata2|" +
                "Nintendo Switch (main/backup/SaveData.bin)|main;backup;SaveData.bin;*.bin|" +
                "Emuladores clásicos|*.sav;*.dsv;*.dat;*.gci;*.sa1;*.sa2|" +
                "RPG Maker / Essentials|*.rxdata;*.rvdata;*.rvdata2|" +
                "Todos los archivos|*.*",
            FilterIndex = 1,
            CheckFileExists = true,
            // Permite elegir archivos sin extensión (main / backup de Switch)
            SupportMultiDottedExtensions = true
        };

        if (openFileDialog.ShowDialog() == DialogResult.OK)
        {
            _savePath = openFileDialog.FileName;
            LoadSaveFile();
            SetupFileWatcher();
        }
    }

    private void LoadSaveFile()
    {
        var team = _saveService.ReadSaveFile(_savePath);

        if (team != null)
        {
            UpdateTeamDisplay(team);
            _statusLabel.Text = $"✓ {Path.GetFileName(_savePath)}";
            _statusLabel.ForeColor = _success;
        }
        else
        {
            _statusLabel.Text = "✗ Error al leer el archivo";
            _statusLabel.ForeColor = Color.FromArgb(239, 68, 68);
        }
    }

    private void SetupFileWatcher()
    {
        _watcher?.Dispose();

        var directory = Path.GetDirectoryName(_savePath);
        var fileName = Path.GetFileName(_savePath);

        if (string.IsNullOrEmpty(directory)) return;

        _watcher = new FileSystemWatcher(directory)
        {
            Filter = fileName,
            NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.CreationTime,
            EnableRaisingEvents = true
        };

        _watcher.Changed += OnSaveFileChanged;
        _watcher.Created += OnSaveFileChanged;
        _watcher.Renamed += OnSaveFileRenamed;
    }

    private void OnSaveFileRenamed(object sender, RenamedEventArgs e)
    {
        // Emuladores / JKSV a veces renombran temp → main
        if (!string.Equals(e.FullPath, _savePath, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(e.Name, Path.GetFileName(_savePath), StringComparison.OrdinalIgnoreCase))
            return;
        OnSaveFileChanged(sender, e);
    }

    private void OnSaveFileChanged(object sender, FileSystemEventArgs e)
    {
        lock (_lock)
        {
            if ((DateTime.Now - _lastRead).TotalMilliseconds < 500)
                return;
            _lastRead = DateTime.Now;
        }

        Thread.Sleep(200);

        try
        {
            var team = _saveService.ReadSaveFile(_savePath);
            if (team != null)
            {
                Invoke(() => UpdateTeamDisplay(team));
            }
        }
        catch { }
    }

    private void StartHttpServer()
    {
        _httpCts = new CancellationTokenSource();
        Task.Run(() => RunHttpServer(_httpCts.Token));
    }

    private async Task RunHttpServer(CancellationToken ct)
    {
        _httpListener = new HttpListener();
        _httpListener.Prefixes.Add("http://localhost:5051/");

        try
        {
            _httpListener.Start();
        }
        catch
        {
            Invoke(() =>
            {
                _serverLabel.Text = "Error: puerto en uso";
                _serverLabel.ForeColor = Color.FromArgb(239, 68, 68);
            });
            return;
        }

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var context = await _httpListener.GetContextAsync();
                _ = HandleRequestAsync(context);
            }
            catch when (ct.IsCancellationRequested) { break; }
            catch { }
        }
    }

    private async Task HandleRequestAsync(HttpListenerContext context)
    {
        var request = context.Request;
        var response = context.Response;

        response.Headers.Add("Access-Control-Allow-Origin", "*");
        response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        response.Headers.Add("Access-Control-Allow-Headers", "*");

        if (request.HttpMethod == "OPTIONS")
        {
            response.StatusCode = 200;
            response.Close();
            return;
        }

        var path = request.Url?.LocalPath ?? "/";
        byte[] buffer;

        try
        {
            if (path.StartsWith("/fonts/", StringComparison.OrdinalIgnoreCase) &&
                request.HttpMethod == "GET")
            {
                await ServeCustomFontAsync(context, path["/fonts/".Length..]);
                return;
            }

            if (path.StartsWith("/sprites/", StringComparison.OrdinalIgnoreCase) &&
                request.HttpMethod == "GET")
            {
                await ServeCustomSpriteAsync(context, path["/sprites/".Length..]);
                return;
            }

            if (path.Equals("/api/custom-sprites/packs", StringComparison.OrdinalIgnoreCase) &&
                request.HttpMethod == "GET")
            {
                response.ContentType = "application/json; charset=utf-8";
                buffer = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(ListCustomSpritePacks(), new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                }));
                response.ContentLength64 = buffer.Length;
                await response.OutputStream.WriteAsync(buffer);
                return;
            }

            if (path.Equals("/api/fonts", StringComparison.OrdinalIgnoreCase))
            {
                if (request.HttpMethod == "GET")
                {
                    response.ContentType = "application/json; charset=utf-8";
                    buffer = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(ListCustomFonts(), new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }));
                    response.ContentLength64 = buffer.Length;
                    await response.OutputStream.WriteAsync(buffer);
                    return;
                }

                if (request.HttpMethod == "POST")
                {
                    await HandleFontUploadAsync(context);
                    return;
                }
            }

            if (path.StartsWith("/api/fonts/", StringComparison.OrdinalIgnoreCase) &&
                request.HttpMethod == "DELETE")
            {
                await HandleFontDeleteAsync(context, path["/api/fonts/".Length..]);
                return;
            }

            switch (path)
            {
                case "/":
                case "/index.html":
                    response.ContentType = "text/html; charset=utf-8";
                    buffer = await GetStaticFileAsync("index.html");
                    break;

                case "/style.css":
                    response.ContentType = "text/css; charset=utf-8";
                    buffer = await GetStaticFileAsync("style.css");
                    break;

                case "/script.js":
                    response.ContentType = "application/javascript; charset=utf-8";
                    buffer = await GetStaticFileAsync("script.js");
                    break;

                case "/favicon.ico":
                    response.ContentType = "image/x-icon";
                    buffer = await GetStaticFileAsync("favicon.ico");
                    break;

                case "/api/team":
                    response.ContentType = "application/json; charset=utf-8";
                    var team = _saveService.GetCachedTeam();
                    var json = JsonSerializer.Serialize(team, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        WriteIndented = true
                    });
                    buffer = Encoding.UTF8.GetBytes(json);
                    break;

                default:
                    response.StatusCode = 404;
                    buffer = Encoding.UTF8.GetBytes("Not Found");
                    break;
            }

            response.ContentLength64 = buffer.Length;
            await response.OutputStream.WriteAsync(buffer);
        }
        catch { response.StatusCode = 500; }
        finally { response.Close(); }
    }

    private static string GetCustomFontsDirectory()
    {
        var dir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "custom-fonts");
        Directory.CreateDirectory(dir);
        return dir;
    }

    private static string GetCustomSpritesDirectory()
    {
        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var dir = Path.Combine(baseDir, "custom-sprites");
        if (Directory.Exists(dir) && Directory.EnumerateFileSystemEntries(dir).Any())
            return dir;

        // Desarrollo: carpeta en la raíz del proyecto al ejecutar desde bin/
        var devDir = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "custom-sprites"));
        if (Directory.Exists(devDir))
            return devDir;

        Directory.CreateDirectory(dir);
        return dir;
    }

    private static readonly HashSet<string> AllowedSpriteExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".gif", ".webp"
    };

    private sealed class CustomSpritePackInfo
    {
        public string Id { get; set; } = "";
        public List<string> Folders { get; set; } = new();
        public bool HasFormsFile { get; set; }
    }

    private static List<CustomSpritePackInfo> ListCustomSpritePacks()
    {
        var root = GetCustomSpritesDirectory();
        if (!Directory.Exists(root))
            return [];

        return Directory.GetDirectories(root)
            .Select(packDir =>
            {
                var id = Path.GetFileName(packDir) ?? "";
                var folders = Directory.GetDirectories(packDir)
                    .Select(Path.GetFileName)
                    .Where(f => !string.IsNullOrWhiteSpace(f))
                    .Select(f => f!)
                    .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
                    .ToList();
                return new CustomSpritePackInfo
                {
                    Id = id,
                    Folders = folders,
                    HasFormsFile = File.Exists(Path.Combine(packDir, "pokemon_forms.txt"))
                };
            })
            .Where(p => p.Folders.Count > 0)
            .OrderBy(p => p.Id, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string? FindFileCaseInsensitive(string dir, string fileName)
    {
        fileName = Path.GetFileName(fileName);
        var baseName = Path.GetFileNameWithoutExtension(fileName);
        if (string.IsNullOrWhiteSpace(baseName) || !Directory.Exists(dir))
            return null;

        foreach (var file in Directory.GetFiles(dir))
        {
            if (!AllowedSpriteExtensions.Contains(Path.GetExtension(file))) continue;
            if (string.Equals(Path.GetFileNameWithoutExtension(file), baseName, StringComparison.OrdinalIgnoreCase))
                return file;
        }

        return null;
    }

    private static string? FindCustomSpritePath(string relativePath)
    {
        relativePath = Uri.UnescapeDataString(relativePath).Replace('\\', '/').Trim('/');
        if (string.IsNullOrWhiteSpace(relativePath))
            return null;

        var root = Path.GetFullPath(GetCustomSpritesDirectory());
        var segments = relativePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length == 0)
            return null;

        string? found = null;

        if (segments.Length >= 3)
        {
            var dir = Path.GetFullPath(Path.Combine(root, segments[0], segments[1]));
            if (!dir.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                return null;
            found = FindFileCaseInsensitive(dir, segments[2]);
        }
        else if (segments.Length == 1)
        {
            found = FindFileCaseInsensitive(root, segments[0]);
        }

        if (found == null)
            return null;

        var full = Path.GetFullPath(found);
        return full.StartsWith(root, StringComparison.OrdinalIgnoreCase) ? full : null;
    }

    private static readonly HashSet<string> AllowedFontExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".ttf", ".otf", ".woff", ".woff2"
    };

    private sealed class FontInfo
    {
        public string Family { get; set; } = "";
        public string FileName { get; set; } = "";
    }

    private sealed class FontUploadRequest
    {
        public string? Family { get; set; }
        public string? FileName { get; set; }
        public string? Data { get; set; }
    }

    private static List<FontInfo> ListCustomFonts()
    {
        var dir = GetCustomFontsDirectory();
        return Directory.GetFiles(dir)
            .Where(f => AllowedFontExtensions.Contains(Path.GetExtension(f)))
            .Select(f =>
            {
                var fileName = Path.GetFileName(f);
                return new FontInfo
                {
                    FileName = fileName,
                    Family = Path.GetFileNameWithoutExtension(fileName)
                };
            })
            .OrderBy(f => f.Family, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(name.Where(c => !invalid.Contains(c)).ToArray()).Trim();
        if (string.IsNullOrWhiteSpace(cleaned)) cleaned = "custom-font.ttf";
        return cleaned;
    }

    private static string SanitizeFamily(string? family, string fileName)
    {
        var baseName = string.IsNullOrWhiteSpace(family)
            ? Path.GetFileNameWithoutExtension(fileName)
            : family.Trim();
        baseName = new string(baseName.Where(c => char.IsLetterOrDigit(c) || c is ' ' or '-' or '_').ToArray()).Trim();
        return string.IsNullOrWhiteSpace(baseName) ? "CustomFont" : baseName;
    }

    private async Task HandleFontUploadAsync(HttpListenerContext context)
    {
        var response = context.Response;
        using var reader = new StreamReader(context.Request.InputStream, context.Request.ContentEncoding);
        var body = await reader.ReadToEndAsync();
        var req = JsonSerializer.Deserialize<FontUploadRequest>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (req?.Data == null || string.IsNullOrWhiteSpace(req.Data))
        {
            response.StatusCode = 400;
            var err = Encoding.UTF8.GetBytes("Falta el contenido de la fuente");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        var rawName = SanitizeFileName(req.FileName ?? "font.ttf");
        var ext = Path.GetExtension(rawName);
        if (!AllowedFontExtensions.Contains(ext))
        {
            response.StatusCode = 400;
            var err = Encoding.UTF8.GetBytes("Extensión no permitida");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(req.Data);
        }
        catch
        {
            response.StatusCode = 400;
            var err = Encoding.UTF8.GetBytes("Base64 inválido");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        if (bytes.Length > 8 * 1024 * 1024)
        {
            response.StatusCode = 400;
            var err = Encoding.UTF8.GetBytes("Fuente demasiado grande");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        var family = SanitizeFamily(req.Family, rawName);
        var safeFileName = SanitizeFileName(family + ext);
        var path = Path.Combine(GetCustomFontsDirectory(), safeFileName);
        await File.WriteAllBytesAsync(path, bytes);

        var info = new FontInfo { Family = family, FileName = safeFileName };
        var json = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(info, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
        response.ContentType = "application/json; charset=utf-8";
        response.StatusCode = 200;
        response.ContentLength64 = json.Length;
        await response.OutputStream.WriteAsync(json);
    }

    private async Task HandleFontDeleteAsync(HttpListenerContext context, string fileName)
    {
        var response = context.Response;
        fileName = Uri.UnescapeDataString(fileName);
        fileName = Path.GetFileName(fileName); // evita path traversal
        var path = Path.Combine(GetCustomFontsDirectory(), fileName);

        if (!File.Exists(path) || !AllowedFontExtensions.Contains(Path.GetExtension(path)))
        {
            response.StatusCode = 404;
            var err = Encoding.UTF8.GetBytes("Fuente no encontrada");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        File.Delete(path);
        response.StatusCode = 200;
        var ok = Encoding.UTF8.GetBytes("{\"ok\":true}");
        response.ContentType = "application/json; charset=utf-8";
        response.ContentLength64 = ok.Length;
        await response.OutputStream.WriteAsync(ok);
    }

    private async Task ServeCustomSpriteAsync(HttpListenerContext context, string fileName)
    {
        var response = context.Response;
        var path = FindCustomSpritePath(fileName);

        if (path == null)
        {
            response.StatusCode = 404;
            var err = Encoding.UTF8.GetBytes("Not Found");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        var ext = Path.GetExtension(path).ToLowerInvariant();
        response.ContentType = ext switch
        {
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "image/png"
        };
        response.Headers.Add("Cache-Control", "public, max-age=3600");
        var bytes = await File.ReadAllBytesAsync(path);
        response.ContentLength64 = bytes.Length;
        await response.OutputStream.WriteAsync(bytes);
    }

    private async Task ServeCustomFontAsync(HttpListenerContext context, string fileName)
    {
        var response = context.Response;
        fileName = Uri.UnescapeDataString(fileName);
        fileName = Path.GetFileName(fileName);
        var path = Path.Combine(GetCustomFontsDirectory(), fileName);

        if (!File.Exists(path) || !AllowedFontExtensions.Contains(Path.GetExtension(path)))
        {
            response.StatusCode = 404;
            var err = Encoding.UTF8.GetBytes("Not Found");
            response.ContentLength64 = err.Length;
            await response.OutputStream.WriteAsync(err);
            return;
        }

        var ext = Path.GetExtension(path).ToLowerInvariant();
        response.ContentType = ext switch
        {
            ".woff2" => "font/woff2",
            ".woff" => "font/woff",
            ".otf" => "font/otf",
            _ => "font/ttf"
        };
        response.Headers.Add("Cache-Control", "public, max-age=31536000");
        var bytes = await File.ReadAllBytesAsync(path);
        response.ContentLength64 = bytes.Length;
        await response.OutputStream.WriteAsync(bytes);
    }

    private static async Task<byte[]> GetStaticFileAsync(string filename)
    {
        var basePath = AppDomain.CurrentDomain.BaseDirectory;
        var filePath = Path.Combine(basePath, "wwwroot", filename);

        if (!File.Exists(filePath))
            filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", filename);

        if (File.Exists(filePath))
            return await File.ReadAllBytesAsync(filePath);

        return Encoding.UTF8.GetBytes($"<!-- File not found: {filename} -->");
    }

    private void MainForm_Resize(object? sender, EventArgs e)
    {
        if (WindowState == FormWindowState.Minimized)
        {
            Hide();
            _trayIcon.ShowBalloonTip(1000, "PokeLayout", "Minimizado a la bandeja", ToolTipIcon.None);
        }
    }

    private void MainForm_FormClosing(object? sender, FormClosingEventArgs e)
    {
        _httpCts?.Cancel();
        _httpListener?.Stop();
        _watcher?.Dispose();
        _trayIcon?.Dispose();
    }
}
