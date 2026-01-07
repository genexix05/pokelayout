# 🎮 PokeLayout

**Overlay de equipo Pokémon para OBS** - Muestra tu equipo en tiempo real mientras juegas y haces stream.

![Preview](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png)

## ✨ Características

- 📺 **Overlay para OBS** - Añádelo como Browser Source
- 🔄 **Actualización automática** - Detecta cuando guardas partida
- 🎨 **Totalmente personalizable**:
  - 2 layouts: Horizontal y Vertical
  - 6 tipos de sprites (Pixel, Official Artwork, HOME, Showdown animado, Dream World, etc.)
  - 35+ fuentes disponibles
  - Colores personalizables para nombres, motes y niveles
  - Borde/contorno de texto configurable
  - Tamaño de sprites y espaciado ajustable
- ✨ **Indicador de Shiny** con brillo especial
- 💀 **Pokémon debilitados** se muestran en blanco y negro
- 🎮 **Compatible con múltiples juegos** gracias a PKHeX.Core

## 📥 Descarga

1. Ve a [**Releases**](../../releases)
2. Descarga `pokelayout-vX.X.zip`
3. Extrae el contenido
4. Ejecuta `pokelayout.exe`

## 🚀 Cómo usar

### 1. Ejecutar PokeLayout
Abre `pokelayout.exe` y haz clic en **"Abrir archivo .sav"** para seleccionar tu archivo de guardado.

**Ubicaciones comunes de saves:**
| Emulador | Ruta típica |
|----------|-------------|
| mGBA | `%APPDATA%\mGBA\saves\` |
| DeSmuME | Misma carpeta que la ROM (`.dsv`) |
| Citra | `%APPDATA%\Citra\sdmc\Nintendo 3DS\...` |
| melonDS | Misma carpeta que la ROM |

### 2. Configurar el overlay
1. Abre `http://localhost:5051` en tu navegador
2. Personaliza el layout, colores, fuente, etc.
3. Haz clic en **"📋 Copiar"** para copiar la URL configurada

### 3. Añadir a OBS
1. En OBS, añade una fuente → **Navegador (Browser Source)**
2. Pega la URL copiada
3. Tamaño recomendado: **400x100** (horizontal) o **150x400** (vertical)
4. Marca **"Actualizar navegador cuando la escena se active"**

## ⚙️ Opciones de configuración

| Opción | Descripción |
|--------|-------------|
| **Layout** | Horizontal o Vertical |
| **Tipo de Sprite** | Pixel, Official Artwork, HOME, Showdown (animado), Dream World, Espalda |
| **Mostrar** | Nombre, Nivel, Barra HP, Icono Shiny |
| **Espaciado** | Distancia entre Pokémon |
| **Tamaño sprite** | Tamaño de los sprites |
| **Fuente** | 35+ fuentes disponibles (modernas, gaming, pixel, etc.) |
| **Tamaño texto** | Tamaño del texto |
| **Colores** | Color de nombre, mote y nivel |
| **Borde texto** | Contorno del texto (color y grosor) |
| **Fondo** | Transparente, Oscuro o Cristal |

## 🎮 Juegos compatibles

Gracias a [PKHeX.Core](https://github.com/kwsch/PKHeX), soporta saves de:
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

## 🛠️ Compilar desde código fuente

Requisitos:
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/pokelayout.git
cd pokelayout

# Compilar
dotnet build

# Publicar ejecutable independiente
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ./dist
```

## 📝 Licencia

Este proyecto es de código abierto. Usa [PKHeX.Core](https://github.com/kwsch/PKHeX) bajo su licencia GPLv3.

## 🙏 Créditos

- [PKHeX](https://github.com/kwsch/PKHeX) por kwsch - Lectura de archivos save
- [PokeAPI](https://pokeapi.co/) - Sprites de Pokémon
- Sprites oficiales de Nintendo/Game Freak/The Pokémon Company

---

**¿Problemas o sugerencias?** Abre un [Issue](../../issues)

