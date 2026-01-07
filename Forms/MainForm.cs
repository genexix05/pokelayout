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
            Text = "  Abrir archivo .sav",
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
            Icon = SystemIcons.Application,
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
            Filter = "Archivos Save|*.sav;*.dsv;*.dat;*.gci;*.sa1;*.sa2|Todos los archivos|*.*",
            FilterIndex = 1
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
        response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
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
