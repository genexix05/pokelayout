# PokeLayout

Overlay de equipo Pokémon para OBS: muestra tu equipo en tiempo real mientras juegas y streameas.

[Demo PokeLayout](https://github.com/genexix05/pokelayout/blob/main/media/demo-essentials.gif)

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


| Emulador / plataforma           | Archivo típico                                               |
| ------------------------------- | ------------------------------------------------------------ |
| mGBA, DeSmuME, melonDS          | `.sav` / `.dsv` junto a la ROM o en la carpeta del emulador  |
| Ryujinx / Yuzu / Sudachi / Eden | `main` (SwSh, PLA, SV) o `SaveData.bin` (BDSP / Luminescent) |
| Switch con CFW                  | `main` o `SaveData.bin` exportado con JKSV / Checkpoint      |
| Pokémon Essentials              | `Game.rxdata` en `%APPDATA%\NOMBREDELJUEGO\`                 |


> Usa el archivo de save real, no un save state del emulador.

### 2. Personalizar el overlay

1. Abre `http://localhost:5051` en el navegador
2. Configura en las pestañas **General**, **Apariencia**, **Nuzlocke** y **OBS**
3. En **OBS**, copia las URLs que necesites (equipo, vidas, slots, etc.)

### 3. Añadir a OBS

1. Añade una fuente → **Navegador (Browser Source)**
2. Pega la URL del equipo (u otra vista)
3. Tamaño orientativo: **400×100** (horizontal) o **150×400** (vertical)
4. Activa **Actualizar navegador cuando la escena se active**

#### Otras fuentes (opcionales)

Desde la pestaña **OBS** puedes copiar URLs adicionales:


| Vista                        | Uso                                                               |
| ---------------------------- | ----------------------------------------------------------------- |
| Vidas (`?obs&view=lives`)    | Contador de vidas del nuzlocke (número o corazones)               |
| URLs por Pokémon (slots 1–6) | Un Browser Source por hueco del equipo                            |
| Animación de muerte          | Pantalla completa; transparente hasta que un Pokémon caiga a 0 HP |
| Medallas / cementerio        | Si ya las usabas en tu setup                                      |


## Qué incluye

- Actualización automática al guardar la partida
- Layouts horizontal, vertical y en cuadrícula
- Panel de configuración por pestañas (General, Apariencia, Nuzlocke, OBS)
- Contador de vidas nuzlocke (número o corazones, estilo y tipografía propios)
- Barra de HP, objetos equipados y nivel con estilo independiente
- Sprites oficiales, packs custom (variantes aleatorias en `Custom/` con reroll en preview) y arte **TCG** ([TCGdex](https://tcgdex.dev/es/assets): carta completa o artwork recortable)
- Fuentes, colores, contornos y sombras
- Indicador shiny y Pokémon debilitados en blanco y negro
- Compatible con juegos oficiales (también randomizados), romhacks y fan games Essentials (soporte en evolución)

## Juegos compatibles

### Oficiales

Todos los juegos **oficiales** (Gen I–IX) funcionan, **incluso si la partida está randomizada** (`.sav`, `.dsv`, `main`, `backup`, etc.).

### ROM hacks / ROMs custom

Custom roms basados en juegos oficiales. Ejemplos comprobados o habituales:

- Pokémon Blaze Black / Volt White
- Pokémon Luminescent Platinum (`SaveData.bin`)
- Pokémon Renegade Platinum
- Pokémon Shining Sapphire

> Muchos otros romhacks compatibles también deberían funcionar. Si el tuyo no abre bien, abre un [Issue](https://github.com/genexix05/pokelayout/issues).

### Pokémon Essentials / RPG Maker

Fan games hechos con Essentials (`.rxdata`, `.rvdata`, `.rvdata2`). Hay **muchísimos** y el soporte **sigue en desarrollo**: puede haber errores según la versión del motor o cómo guarde cada juego.


| Funcionan con sprites | Funcionan con sprites (sin mote en customs)* |
| --------------------- | -------------------------------------------- |
| Pokémon Añil          | Pokémon Z                                    |


***Sobre el mote en Essentials antiguos (pre-v19):** en esos saves la especie custom se identifica por el **nombre** del Pokémon. Si no le pones mote, el sprite custom (p. ej. `CEFIREON` en packs tipo Gen V Animado) se resuelve bien. Si le pones mote a un Pokémon **custom**, el save ya no guarda el nombre de la especie y el sprite puede fallar o mostrar uno incorrecto. Los oficiales con mote siguen yendo por número de dex.

++***Solo lectura: el programa no modifica tu save. Aun así, conviene hacer backup***++.

## Problemas

¿Algo no funciona? Abre un [Issue](https://github.com/genexix05/pokelayout/issues).

## Créditos

[PKHeX](https://github.com/kwsch/PKHeX) · [PKLumiHex](https://github.com/TalonSabre/PKLumiHex) · [PokeAPI Sprites](https://github.com/PokeAPI/sprites) · [PMD Collab](https://pmdcollab.org/) · [TCGdex](https://tcgdex.dev/)
