# 🎮 PokeLayout

**Overlay de equipo Pokémon para OBS** — Muestra tu equipo en tiempo real mientras juegas y haces stream.

![Preview](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png)

## ✨ Características

- 📺 **Overlay para OBS** — Añádelo como Browser Source
- 🔄 **Actualización automática** — Detecta cuando guardas partida
- 🎨 **Totalmente personalizable**:
  - 2 layouts: Horizontal y Vertical
  - **~30 tipos de sprites** (PokeAPI por generación + PMD Collab)
  - 35+ fuentes disponibles
  - Colores personalizables para nombres, motes y niveles
  - Borde/contorno de texto configurable
  - Tamaño de sprites y espaciado ajustable
- ✨ **Indicador de Shiny** con brillo especial
- 💀 **Pokémon debilitados** se muestran en blanco y negro
- 🎮 **Juegos oficiales** — PKHeX.Core (`.sav`, `.dsv`, etc.)
- 🛠️ **Fan games Essentials** — Saves de RPG Maker (`.rxdata`, `.rvdata`)

## 📋 Requisitos

| Requisito | Detalle |
|-----------|---------|
| **Sistema operativo** | Windows 10/11 (64 bits) |
| **.NET Runtime** | No necesario (el release incluye el runtime) |
| **Internet** | Sí, para cargar sprites desde PokeAPI y PMD Collab |

> El `.zip` del release es **autocontenido**: extrae la carpeta y ejecuta `pokelayout.exe`. No hace falta instalar nada más.

## 📥 Descarga

1. Ve a [**Releases**](https://github.com/genexix05/pokelayout/releases)
2. Descarga `pokelayout-vX.X.zip`
3. Extrae **toda la carpeta** (no solo el `.exe`)
4. Ejecuta `pokelayout.exe`

## 🚀 Cómo usar

### 1. Ejecutar PokeLayout

Abre `pokelayout.exe` y haz clic en **"Abrir archivo .sav"** para seleccionar tu archivo de guardado.

**Formatos soportados:** `.sav`, `.dsv`, `.dat`, `.gci`, `.sa1`, `.sa2`, `.rxdata`, `.rvdata`, `.rvdata2`

**Ubicaciones comunes de saves:**

| Emulador / Juego | Ruta típica |
|------------------|-------------|
| mGBA | `%APPDATA%\mGBA\saves\` |
| DeSmuME | Misma carpeta que la ROM (`.dsv`) |
| Citra | `%APPDATA%\Citra\sdmc\Nintendo 3DS\...` |
| melonDS | Misma carpeta que la ROM |
| Pokémon Essentials (mkxp) | `%APPDATA%\GAMENAME\Game.rxdata` o carpeta del juego |

### 2. Configurar el overlay

1. Abre `http://localhost:5051` en tu navegador
2. Personaliza el layout, sprites, colores, fuente, etc.
3. Haz clic en **"📋 Copiar"** para copiar la URL configurada

### 3. Añadir a OBS

1. En OBS, añade una fuente → **Navegador (Browser Source)**
2. Pega la URL copiada
3. Tamaño recomendado: **400×100** (horizontal) o **150×400** (vertical)
4. Marca **"Actualizar navegador cuando la escena se active"**

## ⚙️ Opciones de configuración

| Opción | Descripción |
|--------|-------------|
| **Layout** | Horizontal o Vertical |
| **Tipo de Sprite** | Ver tabla de sprites abajo |
| **Mostrar** | Nombre, Nivel, Barra HP, Icono Shiny |
| **Espaciado** | Distancia entre Pokémon |
| **Tamaño sprite** | Tamaño de los sprites |
| **Fuente** | 35+ fuentes (modernas, gaming, pixel, etc.) |
| **Tamaño texto** | Tamaño del texto |
| **Colores** | Color de nombre, mote y nivel |
| **Borde texto** | Contorno del texto (color y grosor) |
| **Fondo** | Transparente, Oscuro o Cristal |

### Tipos de sprite

| Categoría | Estilos |
|-----------|---------|
| **Modernos** | Pixel Gen 5, Espalda, Official Artwork, HOME, Showdown (animado), Dream World |
| **PMD Collab** | Portrait Normal, Portrait Happy (estilo Mystery Dungeon) |
| **Gen I** | Rojo/Azul, Gris, Amarillo, Amarillo GBC |
| **Gen II** | Cristal, Cristal animado, Oro, Plata |
| **Gen III** | Esmeralda, RF/VH, Rubí/Zafiro |
| **Gen IV** | DP, HGSS, Platino |
| **Gen V** | N/B, N/B animado, Iconos |
| **Gen VI–IX** | ORAS, X/Y, USUM, Iconos, BDSP, Escarlata/Púrpura |

Los sprites de [PokeAPI](https://github.com/PokeAPI/sprites) soportan variantes **shiny** y **female** cuando existen. Los portraits de [PMD Collab](https://pmdcollab.org/) requieren atribución (licencia CC BY-NC).

## 🎮 Juegos compatibles

### Juegos oficiales (PKHeX)

Gracias a [PKHeX.Core](https://github.com/kwsch/PKHeX):

- Pokémon Rojo/Azul/Amarillo
- Pokémon Oro/Plata/Cristal
- Pokémon Ruby/Sapphire/Emerald
- Pokémon FireRed/LeafGreen
- Pokémon Diamond/Pearl/Platinum
- Pokémon HeartGold/SoulSilver
- Pokémon Black/White/Black 2/White 2
- Pokémon X/Y
- Pokémon Omega Ruby/Alpha Sapphire
- Pokémon Sun/Moon/Ultra Sun/Ultra Moon
- Pokémon Let's Go Pikachu/Eevee
- Pokémon Sword/Shield
- Pokémon Brilliant Diamond/Shining Pearl
- Pokémon Legends: Arceus
- Pokémon Scarlet/Violet

### Fan games (Pokémon Essentials / RPG Maker)

Saves `.rxdata`, `.rvdata` y `.rvdata2` de juegos hechos con **Pokémon Essentials** (RPG Maker XP/VX):

- Essentials v19+ (formato Hash)
- Formatos antiguos (varios `Marshal.dump` concatenados)
- Detecta equipo, mote, nivel, HP, shiny, género y forma

> Especies custom (fakemon) pueden no tener sprite en PokeAPI/PMD Collab, pero el resto de datos sí se leen.

## 🛠️ Compilar desde código fuente

Requisitos:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Windows (Windows Forms)

```bash
# Clonar repositorio
git clone https://github.com/genexix05/pokelayout.git
cd pokelayout

# Compilar (desarrollo)
dotnet build

# Publicar ejecutable autocontenido para distribución
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ./dist
```

Comprime la carpeta `dist/` completa para distribuir el release.

## 📝 Licencia

Este proyecto es de código abierto. Usa [PKHeX.Core](https://github.com/kwsch/PKHeX) bajo su licencia GPLv3.

## 🙏 Créditos

- [PKHeX](https://github.com/kwsch/PKHeX) — Lectura de saves oficiales
- [PokeAPI Sprites](https://github.com/PokeAPI/sprites) — Sprites por generación
- [PMD Collab / SpriteCollab](https://pmdcollab.org/) — Portraits Mystery Dungeon (CC BY-NC)
- Sprites oficiales de Nintendo/Game Freak/The Pokémon Company

---

**¿Problemas o sugerencias?** Abre un [Issue](https://github.com/genexix05/pokelayout/issues)
