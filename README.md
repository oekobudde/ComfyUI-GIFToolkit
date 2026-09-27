# ComfyUI-GIFToolkit

Create compact looping GIFs from short videos directly in ComfyUI — with presets, automatic aspect-ratio handling, optional blinking text and a bilingual on-canvas guide.

**Deutsch:** [Direkt zum deutschen Teil](#deutsch) · **English:** [Jump to English](#english)


> **Status:** Development / pre-release. The workflow and custom nodes are already usable, but the package has not yet been published to the ComfyUI Registry.

---

# Deutsch

## Was macht das Projekt?

`ComfyUI-GIFToolkit` ergänzt ComfyUI um kleine Helper-Nodes und einen fertigen Beispielworkflow, um kurze Videos in kompakte, wiederholende GIFs umzuwandeln.

Der mitgelieferte Workflow übernimmt dabei:

1. Video laden und schon beim Laden verkleinern
2. Preset, Seitenverhältnis, FPS und Dauer festlegen
3. optional Text einblenden und automatisch blinken lassen
4. das Ergebnis als GIF speichern

Der Workflow enthält außerdem einen **Deutsch/English-Hilfe-Node**, der direkt in ComfyUI erklärt, welche Bereiche wofür gedacht sind.

## Enthaltene Custom Nodes

| Node | Zweck |
|---|---|
| `GIF Toolkit Guide / Hilfe (DE-EN)` | Zweisprachige Hilfe direkt auf der ComfyUI-Arbeitsfläche |
| `GIF Preset / Prepare` | Presets, Ratio, FPS, Dauer, Resize und Blink-Zeitplan |
| `GIF Prepare / Blink Schedule` | ältere kompatible Helper-Node aus v2 |

Der Beispielworkflow verwendet zusätzlich Nodes aus **ComfyUI-VideoHelperSuite** und **ComfyUI-KJNodes**.

## Voraussetzungen

- ComfyUI
- [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)
- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes)
- dieses Repository: `ComfyUI-GIFToolkit`

Für `ComfyUI-GIFToolkit` selbst sind aktuell **keine zusätzlichen pip-Pakete** erforderlich.

### Drittanbieter-Abhängigkeiten

Der Beispielworkflow verwendet Nodes aus diesen eigenständigen Projekten:

- [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) von Kosinkadink
- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) von kijai

Diese Projekte werden **nicht** mit diesem Repository gebündelt. Bitte installiere sie separat aus ihren jeweiligen Original-Repositories oder über den ComfyUI Manager.

Zum Zeitpunkt dieser Dokumentation deklarieren beide Upstream-Repositories **GPL-3.0**. Urheberrechte und Lizenzbedingungen dieser Projekte verbleiben bei den jeweiligen Autoren. `ComfyUI-GIFToolkit` enthält keinen kopierten Quellcode dieser Abhängigkeiten; der mitgelieferte Workflow verweist lediglich auf deren Node-Typen.

## Installation

### Variante A — Git

Im Ordner `ComfyUI/custom_nodes`:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/oekobudde/ComfyUI-GIFToolkit.git
```

Danach ComfyUI **vollständig neu starten**.

> Die endgültige GitHub-URL wird vor der öffentlichen Veröffentlichung in dieser README eingetragen.

### Variante B — ZIP

1. Repository als ZIP herunterladen.
2. Entpacken.
3. Den Ordner als
   `ComfyUI/custom_nodes/ComfyUI-GIFToolkit`
   ablegen.
4. ComfyUI vollständig neu starten.

### Abhängigkeiten installieren

Falls VideoHelperSuite oder KJNodes noch fehlen, können sie über den ComfyUI Manager oder manuell installiert werden.

Manuell:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
git clone https://github.com/kijai/ComfyUI-KJNodes.git
```

Danach ComfyUI erneut starten.

### Später über ComfyUI Manager / Registry

Nach der öffentlichen Veröffentlichung in der ComfyUI Registry soll das Paket direkt über den ComfyUI Manager installierbar sein. Bis dahin bitte Git oder ZIP verwenden.

## Workflow laden

Der fertige Beispielworkflow liegt unter:

```text
workflows/ComfyUI_GIF_Maker.json
```

Die vier Hauptbereiche sind:

```text
1 → LOAD VIDEO
        ↓
2 → PRESET / PREPARE
        ↓
3 → TEXT / BLINK
        ↓
4 → SAVE GIF
```

## Schnellstart

1. In `1 → LOAD VIDEO` ein kurzes Video auswählen.
2. In `2 → PRESET / PREPARE` zunächst `Small` oder `Balanced` testen.
3. `aspect_ratio = Auto (Input Image)` lassen, wenn das Originalformat erhalten bleiben soll.
4. Optional im `Add Label`-Node Text, Position, Schriftgröße und Farbe einstellen.
5. Workflow starten.
6. Das GIF wird über `VHS Video Combine` gespeichert.

## Presets

| Preset | Lange Seite | FPS | maximale Dauer | Empfehlung |
|---|---:|---:|---:|---|
| `Small` | 288 px | 6 | 4.0 s | kleine Chat-Datei |
| `Balanced` | 320 px | 8 | 5.0 s | guter Standard |
| `Quality` | 384 px | 10 | 5.5 s | höhere Qualität, größere Datei |
| `Custom` | frei | frei | frei | eigene Werte |

> Die endgültige GIF-Größe hängt stark von Bewegung, Bildrauschen, Farbwechseln und Motivdetails ab. Ein bestimmtes MB-Limit kann deshalb nicht garantiert werden.

---

# Feldreferenz — Deutsch

## 0 · GIF Toolkit Guide / Hilfe (DE-EN)

### `language`
Schaltet den Hilfe-Node direkt im Workflow zwischen `Deutsch` und `English` um.

Der Guide ist nur eine Bedienhilfe und verändert das GIF nicht.

---

## 1 · VHS Load Video

Dieser Node kommt aus **ComfyUI-VideoHelperSuite** und lädt das Eingabevideo als Bildsequenz.

### `video`
Die Videodatei, die verarbeitet werden soll.

### `force_rate`
Erzwingt beim Laden eine bestimmte Bildrate.

Im Beispielworkflow:

```text
12 FPS
```

Ein Video mit z. B. 24 oder 30 FPS wird dadurch bereits beim Laden auf eine kleinere, GIF-freundliche Bildrate gebracht. Das spart Arbeitsspeicher und Rechenzeit.

### `custom_width`
Zielbreite bereits beim Laden.

Im Beispielworkflow:

```text
0
```

Damit bleibt der Loader zunächst neutral. Die eigentliche GIF-Zielgröße wird später in `GIF Preset / Prepare` festgelegt.

Optional kann hier z. B. `512` gesetzt werden, um sehr große Eingabevideos bereits beim Laden zu verkleinern.

Große 2K-/4K-Videos werden dadurch früh verkleinert.

### `custom_height`
Zielhöhe beim Laden.

Im Beispielworkflow:

```text
0
```

`0` deaktiviert die feste Höhe. Zusammen mit `custom_width = 512` bleibt dadurch das Seitenverhältnis des Eingabevideos erhalten.

Wenn sowohl Breite als auch Höhe gesetzt werden, kann VideoHelperSuite das Bild passend auf diese Vorgabe zuschneiden.

### `frame_load_cap`
Maximale Anzahl Frames, die geladen werden.

Im Beispielworkflow:

```text
144
```

Bei `force_rate = 12` entspricht das maximal ungefähr 12 Sekunden.

`0` bedeutet bei VideoHelperSuite: kein Frame-Limit.

### `skip_first_frames`
Überspringt Frames am Anfang des Videos.

Beispiel:

```text
24
```

würde bei 12 FPS ungefähr die ersten 2 Sekunden überspringen.

Im Beispielworkflow steht der Wert auf `0`.

### `select_every_nth`
Behält nur jeden n-ten Frame.

- `1` = jeden Frame behalten
- `2` = jeden zweiten Frame
- `3` = jeden dritten Frame

Normalerweise sollte im mitgelieferten Workflow `1` verwendet werden, weil die spätere Preset-Node die endgültige GIF-FPS festlegt.

### `format`
Optionales Ladeformat von VideoHelperSuite. Im Beispielworkflow steht es auf `None`.

Für den normalen GIF-Workflow muss hier in der Regel nichts geändert werden.

### `choose video to upload`
Upload-Schaltfläche von VideoHelperSuite, um ein lokales Video in den ComfyUI-Input-Ordner zu übernehmen.

### `videopreview`
Vorschau des geladenen Videos. Sie ist nur eine UI-Vorschau und verändert die eigentlichen Frames nicht.

### wichtige Outputs

| Output | Bedeutung |
|---|---|
| `IMAGE` | geladene Videoframes |
| `frame_count` | Anzahl geladener Frames |
| `audio` | Audiospur, falls vorhanden |
| `video_info` | Metadaten wie geladene bzw. ursprüngliche FPS |

---

## 2 · GIF Preset / Prepare

Das ist die zentrale Node dieses Projekts.

Sie übernimmt:

- Preset-Auswahl
- Zielgröße
- Ziel-FPS
- maximale GIF-Dauer
- Seitenverhältnis / Center Crop
- automatischen Blink-Zeitplan

### `preset`
Verfügbare Werte:

- `Small`
- `Balanced`
- `Quality`
- `Custom`

Bei den drei fertigen Presets werden Größe, FPS und Dauer automatisch festgelegt.

Nur bei `Custom` werden die drei `custom_*`-Felder verwendet.

### `aspect_ratio`
Verfügbare Werte:

- `Auto (Input Image)`
- `1:1`
- `16:9`
- `9:16`
- `4:3`
- `3:4`

#### `Auto (Input Image)`
Behält das Seitenverhältnis des Eingabevideos bei.

Beispiele:

- 1:1 bleibt 1:1
- 16:9 bleibt 16:9
- 9:16 bleibt 9:16
- ungewöhnliche Formate bleiben ebenfalls erhalten

#### festes Seitenverhältnis
Wenn z. B. `1:1` oder `9:16` gewählt wird, wird das Bild **mittig zugeschnitten**, bis das gewünschte Verhältnis erreicht ist.

Es wird dabei nicht einfach verzerrt.

### `custom_long_side`
Nur bei `preset = Custom` aktiv.

Legt die Pixelgröße der **längeren Bildseite** fest.

Bereich der Node:

```text
128–512 px
```

Beispiel:

- 16:9 + `320` → ungefähr 320 × 180
- 9:16 + `320` → ungefähr 180 × 320
- 1:1 + `320` → 320 × 320

Die Node rundet auf gerade Abmessungen.

### `custom_fps`
Nur bei `preset = Custom` aktiv.

Legt die GIF-Bildrate fest.

Bereich:

```text
2–12 FPS
```

Niedrigere FPS ergeben meist deutlich kleinere GIF-Dateien.

### `custom_duration_seconds`
Nur bei `preset = Custom` aktiv.

Maximale Dauer des GIFs.

Bereich:

```text
0.5–12.0 Sekunden
```

Wenn das Eingabevideo kürzer ist, wird natürlich nur die tatsächlich vorhandene Länge verwendet.

### `blink_on_seconds`
Wie lange der Text innerhalb eines Blink-Zyklus sichtbar bleibt.

Standard:

```text
0.5 s
```

### `blink_off_seconds`
Wie lange der Text innerhalb eines Blink-Zyklus unsichtbar bleibt.

Standard:

```text
0.5 s
```

Beispiel:

```text
blink_on_seconds  = 0.4
blink_off_seconds = 0.2
```

macht ein schnelleres Blinken mit längerer Sichtbar- als Unsichtbarphase.

### Outputs

| Output | Bedeutung |
|---|---|
| `images` | fertig gesampelte und skalierte Frames |
| `text_on_indexes` | Frame-Indizes, auf denen der Text sichtbar sein soll |
| `fps` | endgültige GIF-FPS |
| `frame_count` | Anzahl der Ausgabe-Frames |
| `duration_seconds` | tatsächliche Dauer |
| `width` | endgültige Breite |
| `height` | endgültige Höhe |
| `settings` | kurze Zusammenfassung der verwendeten Einstellungen |

---

## 3A · Add Label

Dieser Node kommt aus **ComfyUI-KJNodes** und zeichnet den Text auf die ausgewählten Videoframes.

### `text_x`
Horizontaler Abstand des Textes vom linken Rand.

Größerer Wert = weiter nach rechts.

### `text_y`
Vertikaler Abstand des Textes vom oberen Rand.

Größerer Wert = weiter nach unten.

### `height`
Höhe einer zusätzlichen Label-Fläche, wenn `direction` auf `up`, `down`, `left` oder `right` steht.

Bei unserem Standard:

```text
direction = overlay
```

wird der Text direkt auf das Bild gezeichnet; `height` ist dann für die Bildgröße nicht relevant.

### `font_size`
Schriftgröße in Pixeln.

### `font_color`
Schriftfarbe.

Beispiele:

```text
yellow
white
red
#FFD700
```

### `label_color`
Hintergrundfarbe der zusätzlichen Label-Fläche bei den Nicht-Overlay-Modi.

Bei `direction = overlay` wird keine separate Label-Fläche erzeugt, deshalb ist dieser Wert normalerweise nicht sichtbar.

### `font`
Ausgewählte Schriftart.

KJNodes lädt Fonts aus seinem Font-Verzeichnis. Welche Fonts verfügbar sind, hängt von deiner lokalen KJNodes-Installation ab.

### `text`
Der Text, der eingeblendet werden soll.

Beispiel:

```text
LET'S GO!
```

### `direction`
Mögliche Werte:

- `overlay`
- `up`
- `down`
- `left`
- `right`

Für diesen Workflow empfehlen wir:

```text
overlay
```

Dann bleibt die GIF-Auflösung unverändert und der Text liegt direkt über dem Bild.

### `caption`
Optionaler String-Eingang. Wird er verbunden, kann für einzelne Bilder/Frames ein externer Caption-Text geliefert werden.

Im Beispielworkflow bleibt dieser Eingang unverbunden und das Feld `text` wird verwendet.

---

## 3B · Get Images From Batch Indexed

KJNodes-Node. Sie nimmt nur die Frames heraus, auf denen der Text sichtbar sein soll.

### `indexes`
Liste der Frame-Indizes.

Im Workflow wird dieser Wert **automatisch** vom Output `text_on_indexes` der Prepare-Node geliefert.

Normalerweise nicht manuell ändern.

---

## 3C · Insert Images To Batch Indexed

KJNodes-Node. Sie setzt die zuvor beschrifteten Frames wieder an die richtigen Stellen in die ursprüngliche Bildsequenz ein.

### `indexes`
Wird ebenfalls automatisch vom Blink-Zeitplan geliefert.

### `mode`
Im Workflow:

```text
replace
```

Dadurch werden die entsprechenden Originalframes durch die beschrifteten Frames ersetzt.

`insert` würde zusätzliche Frames einfügen und damit Timing und Dauer verändern; für diesen Workflow sollte deshalb `replace` verwendet werden.

---

## 4 · VHS Video Combine

Dieser Node kommt aus **ComfyUI-VideoHelperSuite** und speichert die endgültige Bildsequenz als animiertes GIF.

### `frame_rate`
Die Ausgabe-FPS.

Im Beispielworkflow ist dieser Eingang mit dem `fps`-Output der Prepare-Node verbunden und wird deshalb **automatisch gesetzt**.

### `loop_count`
Loop-Wert des animierten GIFs.

Im Beispielworkflow:

```text
0
```

Bei GIF-Ausgabe bedeutet `0` eine Endlosschleife.

### `filename_prefix`
Dateiname bzw. Unterordner + Dateiname.

Beispiel:

```text
GIFToolkit/ComfyUI_GIF
```

Dann landet das Ergebnis im Unterordner `GIFToolkit` des ComfyUI-Output-Ordners.

### `format`
Für diesen Workflow:

```text
image/gif
```

Nicht auf MP4/WebM ändern, wenn tatsächlich ein GIF erzeugt werden soll.

### `pingpong`
Wenn aktiviert, wird die Sequenz vorwärts und anschließend rückwärts abgespielt.

Das kann bei sehr kurzen Loops einen weicheren Übergang erzeugen, verdoppelt aber ungefähr die Anzahl der abgespielten Frames.

Standard:

```text
false
```

### `save_output`
- `true` → in den normalen ComfyUI-Output-Ordner speichern
- `false` → temporäre Ausgabe

Für den normalen Einsatz sollte `true` verwendet werden.

### `audio`
GIF unterstützt in diesem Workflow keinen Ton. Der Audio-Eingang bleibt daher unverbunden.

### `meta_batch` / `vae`
Erweiterte VideoHelperSuite-Eingänge. Für den normalen GIF-Workflow werden sie nicht benötigt.

---

## Kein Text gewünscht?

Wenn kein Text benötigt wird, kann der komplette Text-/Blink-Pfad umgangen werden.

Statt:

```text
Prepare images
   → Add Label
   → Get Images From Batch Indexed
   → Insert Images To Batch Indexed
   → Save GIF
```

kann direkt verbunden werden:

```text
Prepare images
   → Save GIF
```

Die Preset-, Resize-, Ratio-, FPS- und Dauerfunktionen bleiben dadurch vollständig erhalten.

## Empfehlungen für kleine GIF-Dateien

Wenn das GIF zu groß wird, in dieser Reihenfolge reduzieren:

1. Dauer
2. lange Bildseite
3. FPS
4. Motivkomplexität ist nicht direkt steuerbar, beeinflusst GIF-Größe aber stark

Typischer Ausgangspunkt für Chat-GIFs:

```text
4–5 Sekunden
288–320 px lange Seite
6–8 FPS
```

## Troubleshooting

### GIF ist größer als erwartet

Das ist bei stark bewegten, verrauschten oder detailreichen Videos normal. `Small` testen oder in `Custom` Dauer, Pixelgröße und FPS weiter reduzieren.

### Mein 16:9-/1:1-/9:16-Video wird falsch zugeschnitten

`aspect_ratio` auf:

```text
Auto (Input Image)
```

stellen.

Ein fest ausgewähltes Ratio erzwingt bewusst einen Center Crop.

### Mein Video ist sehr groß / 2K / 4K

Der öffentliche Beispielworkflow verwendet `custom_width = 0`, damit der Upload-Loader neutral und versionsrobust startet. Bei sehr großen 2K-/4K-Videos kannst du optional `custom_width = 512` setzen; die endgültige GIF-Größe wird trotzdem in `GIF Preset / Prepare` festgelegt.

### Sehr langes Video

`frame_load_cap = 144` begrenzt bei 12 FPS die geladene Länge auf ungefähr 12 Sekunden.

### Missing Nodes

Prüfen, ob installiert sind:

- ComfyUI-VideoHelperSuite
- ComfyUI-KJNodes
- ComfyUI-GIFToolkit

Nach Installation ComfyUI vollständig neu starten.

### Deutsch/English-Umschalter fehlt

Prüfen, ob der Ordner

```text
web/js/gif_toolkit_help.js
```

im installierten Repository vorhanden ist und ComfyUI nach der Installation vollständig neu gestartet wurde.

---

# English

## What does this project do?

`ComfyUI-GIFToolkit` adds small helper nodes and a ready-to-use example workflow for converting short videos into compact looping GIFs directly in ComfyUI.

The included workflow handles:

1. loading and pre-scaling the video
2. preset, aspect ratio, FPS and duration
3. optional text overlay with an automatic blink schedule
4. saving the final animation as a GIF

The workflow also contains a **Deutsch/English help node** directly on the ComfyUI canvas.

## Included custom nodes

| Node | Purpose |
|---|---|
| `GIF Toolkit Guide / Hilfe (DE-EN)` | bilingual help directly on the ComfyUI canvas |
| `GIF Preset / Prepare` | presets, aspect ratio, FPS, duration, resize and blink schedule |
| `GIF Prepare / Blink Schedule` | backward-compatible helper from v2 |

The example workflow also uses nodes from **ComfyUI-VideoHelperSuite** and **ComfyUI-KJNodes**.

## Requirements

- ComfyUI
- [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)
- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes)
- this repository: `ComfyUI-GIFToolkit`

`ComfyUI-GIFToolkit` currently has **no additional pip dependencies**.

### Third-party dependencies

The example workflow uses nodes from these independent projects:

- [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite) by Kosinkadink
- [ComfyUI-KJNodes](https://github.com/kijai/ComfyUI-KJNodes) by kijai

These projects are **not bundled** with this repository. Install them separately from their respective upstream repositories or through ComfyUI Manager.

At the time of this documentation, both upstream repositories declare **GPL-3.0**. Their copyrights and license terms remain with their respective authors. `ComfyUI-GIFToolkit` does not copy their source code; the included workflow only references their node types.

## Installation

### Option A — Git

From `ComfyUI/custom_nodes`:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/oekobudde/ComfyUI-GIFToolkit.git
```

Then **fully restart ComfyUI**.

> The final GitHub URL will be added before the public release.

### Option B — ZIP

1. Download the repository as a ZIP.
2. Extract it.
3. Place the folder at
   `ComfyUI/custom_nodes/ComfyUI-GIFToolkit`.
4. Fully restart ComfyUI.

### Installing dependencies

If VideoHelperSuite or KJNodes are missing, install them through ComfyUI Manager or manually.

Manual installation:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
git clone https://github.com/kijai/ComfyUI-KJNodes.git
```

Restart ComfyUI afterwards.

### Future ComfyUI Manager / Registry installation

After the project is publicly published to the ComfyUI Registry, it is intended to be directly installable from ComfyUI Manager. Until then, use Git or ZIP installation.

## Load the workflow

The ready-to-use workflow is located at:

```text
workflows/ComfyUI_GIF_Maker.json
```

Main workflow sections:

```text
1 → LOAD VIDEO
        ↓
2 → PRESET / PREPARE
        ↓
3 → TEXT / BLINK
        ↓
4 → SAVE GIF
```

## Quick start

1. Select a short video in `1 → LOAD VIDEO`.
2. Start with `Small` or `Balanced` in `2 → PRESET / PREPARE`.
3. Keep `aspect_ratio = Auto (Input Image)` to preserve the source aspect ratio.
4. Optionally configure text, position, font size and color in `Add Label`.
5. Queue the workflow.
6. `VHS Video Combine` writes the final GIF.

## Presets

| Preset | Long side | FPS | maximum duration | Recommended use |
|---|---:|---:|---:|---|
| `Small` | 288 px | 6 | 4.0 s | small chat GIF |
| `Balanced` | 320 px | 8 | 5.0 s | good default |
| `Quality` | 384 px | 10 | 5.5 s | higher quality, larger file |
| `Custom` | custom | custom | custom | manual control |

> Final GIF size depends strongly on motion, image noise, color changes and scene detail. A specific MB target therefore cannot be guaranteed.

---

# Field reference — English

## 0 · GIF Toolkit Guide / Hilfe (DE-EN)

### `language`
Switches the on-canvas help node between `Deutsch` and `English`.

The guide is UI-only and does not change the generated GIF.

---

## 1 · VHS Load Video

This node comes from **ComfyUI-VideoHelperSuite** and loads the source video as an image sequence.

### `video`
The input video file.

### `force_rate`
Forces a specific frame rate while loading.

Example workflow value:

```text
12 FPS
```

A 24/30 FPS source is already reduced to a smaller GIF-friendly rate, saving memory and processing time.

### `custom_width`
Target width while loading.

Example workflow value:

```text
0
```

This keeps the loader neutral by default. The final GIF target size is controlled later by `GIF Preset / Prepare`.

Optionally set this to e.g. `512` to reduce very large source videos while loading.

This reduces large 2K/4K input videos early in the pipeline.

### `custom_height`
Target height while loading.

Example workflow value:

```text
0
```

`0` disables a fixed height. With `custom_width = 512`, the original aspect ratio is preserved.

If both width and height are set, VideoHelperSuite can crop to fit the specified dimensions.

### `frame_load_cap`
Maximum number of frames to load.

Example workflow value:

```text
144
```

At `force_rate = 12`, this is approximately 12 seconds of input.

`0` means no frame limit in VideoHelperSuite.

### `skip_first_frames`
Skips frames at the beginning after the forced frame rate is applied.

Example:

```text
24
```

at 12 FPS skips roughly the first 2 seconds.

The example workflow uses `0`.

### `select_every_nth`
Keeps only every n-th frame.

- `1` = keep every frame
- `2` = every second frame
- `3` = every third frame

The example workflow normally keeps this at `1`, because the Prepare node later controls the final GIF FPS.

### `format`
Optional VideoHelperSuite load format. The example workflow uses `None`.

Usually no change is required for this GIF workflow.

### `choose video to upload`
VideoHelperSuite upload button for copying a local video into the ComfyUI input folder.

### `videopreview`
UI preview of the selected input video. It does not itself modify the output frames.

### important outputs

| Output | Meaning |
|---|---|
| `IMAGE` | loaded video frames |
| `frame_count` | number of loaded frames |
| `audio` | audio track if present |
| `video_info` | metadata such as loaded/source FPS |

---

## 2 · GIF Preset / Prepare

This is the central node of this project.

It handles:

- preset selection
- target size
- target FPS
- maximum GIF duration
- aspect ratio / centered crop
- dynamic blink schedule

### `preset`
Available values:

- `Small`
- `Balanced`
- `Quality`
- `Custom`

The three built-in presets automatically define size, FPS and duration.

The three `custom_*` fields are only used when `Custom` is selected.

### `aspect_ratio`
Available values:

- `Auto (Input Image)`
- `1:1`
- `16:9`
- `9:16`
- `4:3`
- `3:4`

#### `Auto (Input Image)`
Preserves the source aspect ratio.

Examples:

- 1:1 stays 1:1
- 16:9 stays 16:9
- 9:16 stays 9:16
- unusual source ratios are preserved as well

#### forced aspect ratio
Selecting a fixed ratio such as `1:1` or `9:16` performs a **center crop** until the target ratio is reached.

The image is not simply stretched.

### `custom_long_side`
Used only when `preset = Custom`.

Sets the pixel size of the **longer side**.

Node range:

```text
128–512 px
```

Examples:

- 16:9 + `320` → approximately 320 × 180
- 9:16 + `320` → approximately 180 × 320
- 1:1 + `320` → 320 × 320

The helper rounds to even output dimensions.

### `custom_fps`
Used only when `preset = Custom`.

Sets the GIF frame rate.

Range:

```text
2–12 FPS
```

Lower FPS usually produces significantly smaller GIF files.

### `custom_duration_seconds`
Used only when `preset = Custom`.

Maximum GIF duration.

Range:

```text
0.5–12.0 seconds
```

If the source video is shorter, only the available duration is used.

### `blink_on_seconds`
How long the text remains visible during each blink cycle.

Default:

```text
0.5 s
```

### `blink_off_seconds`
How long the text remains hidden during each blink cycle.

Default:

```text
0.5 s
```

Example:

```text
blink_on_seconds  = 0.4
blink_off_seconds = 0.2
```

creates a faster blink where the text is visible longer than it is hidden.

### outputs

| Output | Meaning |
|---|---|
| `images` | sampled and resized output frames |