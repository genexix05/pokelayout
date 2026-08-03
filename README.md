# PokeLayout

Overlay de equipo Pokémon para OBS: muestra tu equipo en tiempo real mientras juegas y streameas.

![Demo PokeLayout](media/demo-essentials.gif)

## Requisitos

- Windows 10/11 (64 bits)
- Conexión a internet (para cargar sprites)

No hace falta instalar .NET: el release ya incluye todo.

## Descarga

1. Ve a [Releases](https://github.com/genexix05/pokelayout/releases)
2. Descarga el último `.zip`
3. Extrae **toda la carpeta** (no solo el `.exe`)
4. Ejecuta `pokelayout.exe`

## Cómo usarlo

### 1. Abrir el save

En PokeLayout, haz clic en **Abrir archivo de guardado** y selecciona tu save.

Formatos habituales: `main`, `backup`, `.sav`, `.dsv`, `.bin`, `.rxdata`, `.rvdata`

**Dónde suelen estar los saves:**

| Emulador / plataforma | Archivo típico |
|-----------------------|----------------|
| mGBA, DeSmuME, melonDS | `.sav` / `.dsv` junto a la ROM o en la carpeta del emulador |
| Ryujinx / Yuzu / Sudachi / Eden | `main` (SwSh, PLA, SV) o `SaveData.bin` (BDSP / Luminescent) |
| Switch con CFW | `main` o `SaveData.bin` exportado con JKSV / Checkpoint |
| Pokémon Essentials | `Game.rxdata` en `%APPDATA%\NOMBREDELJUEGO\` |

> Usa el archivo de save real, no un save state del emulador.

### 2. Personalizar el overlay

1. Abre `http://localhost:5051` en el navegador
2. Elige layout, sprites, colores, fuentes, etc.
3. Pulsa **Copiar** para obtener la URL del overlay

### 3. Añadir a OBS

1. Añade una fuente → **Navegador (Browser Source)**
2. Pega la URL copiada
3. Tamaño orientativo: **400×100** (horizontal) o **150×400** (vertical)
4. Activa **Actualizar navegador cuando la escena se active**

#### Animación de muerte (opcional)

Si activas **Animación de muerte** en la configuración:

1. Copia la URL de animación de muerte
2. Añade otra Browser Source a pantalla completa (por ejemplo 1920×1080)
3. Quedará transparente hasta que un Pokémon caiga a 0 HP al guardar

## Qué incluye

- Actualización automática al guardar la partida
- Layouts horizontal, vertical y en cuadrícula
- Muchos estilos de sprite, fuentes, colores, contornos y sombras
- Indicador shiny y Pokémon debilitados en blanco y negro
- Compatible con juegos oficiales, romhacks (p. ej. Luminescent Platinum) y fan games Essentials

## Juegos compatibles

- **Oficiales** (Gen I–IX): saves leídos con PKHeX (incluyendo randomizados y muchos romhacks basados en juegos oficiales)
- **Luminescent Platinum**: selecciona `SaveData.bin`
- **Pokémon Essentials / RPG Maker**: `.rxdata`, `.rvdata`, `.rvdata2`

Solo lectura: el programa no modifica tu save. Aun así, conviene hacer backup.

## Problemas

¿Algo no funciona? Abre un [Issue](https://github.com/genexix05/pokelayout/issues).

## Créditos

[PKHeX](https://github.com/kwsch/PKHeX) · [PKLumiHex](https://github.com/TalonSabre/PKLumiHex) · [PokeAPI Sprites](https://github.com/PokeAPI/sprites) · [PMD Collab](https://pmdcollab.org/)
