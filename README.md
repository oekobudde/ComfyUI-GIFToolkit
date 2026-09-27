# ComfyUI-GIFToolkit

Create compact looping GIFs from short videos directly in ComfyUI, with preset sizing, visual multi-text placement, optional blinking, a preview-first export flow, and bilingual help.

**Deutsch:** [Direkt zum deutschen Teil](#deutsch) · **English:** [Jump to English](#english)

> **Status:** Development / pre-release. The current development workflow supports up to three independent text layers and is not yet published to the ComfyUI Registry.

---

# Deutsch

## Überblick

`ComfyUI-GIFToolkit` ergänzt ComfyUI um eigene Helper-Nodes und einen fertigen Workflow für kurze GIFs.

Der aktuelle Workflow:

1. lädt ein Video über **VideoHelperSuite**
2. legt Größe, Seitenverhältnis, FPS und Dauer fest
3. erlaubt bis zu **3 unabhängige Text-Layer**
4. zeigt Text und GIF zunächst nur als Vorschau
5. speichert das finale GIF erst nach ausdrücklicher Freigabe

Der Text-Designer ist grafisch aufgebaut: Texte können direkt auf dem Preview-Frame angeklickt und mit der Maus verschoben werden.

## Voraussetzungen

- ComfyUI
- [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)
- dieses Repository: `ComfyUI-GIFToolkit`

**KJNodes wird im aktuellen Workflow nicht mehr benötigt.**

Für `ComfyUI-GIFToolkit` selbst sind derzeit keine zusätzlichen pip-Pakete erforderlich.

### Drittanbieter-Abhängigkeit

Der Beispielworkflow verwendet Nodes aus **ComfyUI-VideoHelperSuite** von Kosinkadink.

VideoHelperSuite wird **nicht** mit diesem Repository gebündelt. Bitte separat aus dem Original-Repository oder über den ComfyUI Manager installieren. Urheberrecht und Lizenzbedingungen verbleiben beim jeweiligen Projekt.

## Installation

### Git

Im Ordner `ComfyUI/custom_nodes`:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/oekobudde/ComfyUI-GIFToolkit.git
```

Danach ComfyUI vollständig neu starten.

### ZIP

1. Repository als ZIP herunterladen.
2. Entpacken.
3. Als `ComfyUI/custom_nodes/ComfyUI-GIFToolkit` ablegen.
4. ComfyUI vollständig neu starten.

### VideoHelperSuite

Falls noch nicht installiert:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
```

Danach ComfyUI neu starten.

## Workflow laden

Der Beispielworkflow liegt unter:

```text
workflows/ComfyUI_GIF_Maker.json
```

Hauptbereiche:

```text
1 → LOAD VIDEO
      ↓
2 → PREPARE
      ↓
3 → MULTI-TEXT DESIGNER + BLINK
      ↓
4 → TEMP PREVIEW → APPROVE → FINAL EXPORT
```

## Schnellstart

1. In `1 → LOAD VIDEO` ein kurzes Video auswählen.
2. In `2 → PREPARE` zunächst `Balanced` verwenden.
3. `aspect_ratio = Auto (Input Image)` lassen, wenn das Originalformat erhalten bleiben soll.
4. Workflow einmal mit **Run** starten.
5. Im **GIF Multi-Text Designer** Texte platzieren und gestalten.
6. Das temporäre GIF bei `4A` prüfen.
7. Erst wenn alles passt: **✓ APPROVE & EXPORT FINAL GIF** drücken.

Ein normaler Run schreibt **kein finales GIF** dauerhaft in den Output-Ordner.

## Presets

| Preset | Lange Seite | FPS | maximale Dauer | Einsatz |
|---|---:|---:|---:|---|
| `Small` | 288 px | 6 | 4.0 s | kleine Chat-GIFs |
| `Balanced` | 320 px | 8 | 5.0 s | guter Standard |
| `Quality` | 384 px | 10 | 5.5 s | höhere Qualität |
| `Custom` | frei | frei | frei | eigene Werte |

> Die tatsächliche Dateigröße hängt stark von Bewegung, Bildrauschen, Farbwechseln und Motivdetails ab. Ein festes MB-Limit kann nicht garantiert werden.

---

## Feldreferenz — Deutsch

### 0 · GIF Toolkit Guide / Hilfe

#### `language`
Schaltet die Hilfe direkt im Workflow zwischen `Deutsch` und `English` um.

Der Guide verändert das GIF nicht.

---

### 1 · VHS Load Video

Kommt aus **ComfyUI-VideoHelperSuite**.

#### `video`
Eingabevideo.

#### `force_rate`
FPS beim Laden. Im Beispiel:

```text
12
```

#### `custom_width` / `custom_height`
Standard im öffentlichen Workflow:

```text
0 / 0
```

Damit startet der Loader neutral. Für sehr große Quellen kann `custom_width` optional z. B. auf `512` gesetzt werden.

#### `frame_load_cap`
Standard:

```text
144
```

Bei 12 FPS entspricht das ungefähr 12 Sekunden maximal geladener Videolänge.

#### `skip_first_frames`
Überspringt Frames am Anfang.

#### `select_every_nth`
- `1` = jeden Frame
- `2` = jeden zweiten Frame
- usw.

Im Beispielworkflow normalerweise `1`.

---

### 2 · GIF Prepare / Preset

Bereitet die Videoframes für das GIF vor.

#### `preset`
- `Small`
- `Balanced`
- `Quality`
- `Custom`

#### `aspect_ratio`
- `Auto (Input Image)`
- `1:1`
- `16:9`
- `9:16`
- `4:3`
- `3:4`

`Auto` behält das Quellformat. Ein festes Verhältnis führt einen mittigen Crop aus.

#### `custom_long_side`
Nur bei `Custom`: Pixelgröße der längeren Seite.

#### `custom_fps`
Nur bei `Custom`: Ausgabe-FPS.

#### `custom_duration_seconds`
Nur bei `Custom`: maximale Dauer.

#### Outputs
- `images` – vorbereitete Frames
- `fps` – endgültige GIF-FPS
- `frame_count`
- `duration_seconds`
- `width`
- `height`
- `settings`

---

### 3A · GIF Multi-Text Designer

Die zentrale Text-UI.

#### `Enable text overlay`
Master-Schalter.

- **an** → aktive Text-Layer werden gerendert
- **aus** → keinerlei Text; Frames laufen unverändert weiter

Es ist kein manuelles Bypassen von Nodes nötig.

### Text-Layer

Der Designer unterstützt aktuell genau **3 Layer**.

Jeder Layer besitzt eigene Werte für:

- an / aus
- Text
- Font
- Schriftgröße
- Schriftfarbe
- X/Y-Position
- Hintergrund
- Hintergrundfarbe
- Hintergrund-Transparenz
- Padding
- Corner Radius
- Outline
- Outline-Farbe
- Outline-Breite
- Shadow
- Shadow-Farbe
- Shadow-X/Y
- Line Spacing

#### Layer auswählen
Oben im Designer:

```text
Layer 1   Layer 2   Layer 3
```

Der gold markierte Layer ist aktiv.

Ein Klick direkt auf einen sichtbaren Text im Preview wählt ebenfalls diesen Layer aus.

#### Text verschieben
Den ausgewählten Text direkt im Bild anklicken und ziehen.

Die Position wird relativ in Prozent gespeichert. Dadurch bleibt sie unabhängig von der tatsächlichen GIF-Auflösung sinnvoll.

#### `Enable selected layer`
Schaltet nur den aktuell ausgewählten Layer an oder aus.

#### `Duplicate → next`
Kopiert den aktiven Layer in den nächsten der drei Slots und versetzt ihn leicht, damit beide Texte sichtbar bleiben.

#### `Clear selected`
Leert und deaktiviert nur den ausgewählten Layer.

#### 3×3-Positionsraster
Setzt den ausgewählten Layer schnell auf typische Positionen:

```text
↖   ↑   ↗
←   •   →
↙   ↓   ↘
```

#### Background
Optionale Hintergrundbox pro Layer.

#### Outline
Eigene Kontur pro Layer.

#### Shadow
Eigener Schatten pro Layer.

#### Advanced style
Enthält:

- Outline width
- Padding
- Corner radius
- BG opacity
- Shadow X
- Shadow Y
- Line spacing

Die Node passt ihre Höhe beim Auf- und Zuklappen automatisch an.

#### Preview Frame
Wählt den Einzel-Frame, der im Designer angezeigt wird.

`Refresh frame` startet einen Preview-Lauf, ohne ein finales GIF dauerhaft zu speichern.

---

### 3B · GIF Text Overlay

Wendet die Layer-Konfiguration auf den kompletten Frame-Batch an.

#### `blink_enabled`
- an → alle aktiven Layer blinken gemeinsam
- aus → alle aktiven Layer bleiben dauerhaft sichtbar

#### `blink_on_seconds`
Dauer der sichtbaren Blinkphase.

#### `blink_off_seconds`
Dauer der unsichtbaren Blinkphase.

> In der aktuellen Multi-Text-Version ist Blinken **global**. Eigene Blink-Zeiten pro Layer sind noch nicht enthalten.

---

### 4A · TEMP GIF PREVIEW

VHS Video Combine mit:

```text
save_output = false
```

Der normale Run erzeugt nur ein temporäres GIF zur Kontrolle.

---

### 4B · GIF Export Gate

Standardmäßig blockiert diese Node den finalen Saver.

Status:

```text
PREVIEW MODE
```

Wenn das Preview stimmt:

**✓ APPROVE & EXPORT FINAL GIF**

Der Button startet einen finalen Exportlauf und schaltet anschließend wieder in den Preview-Modus zurück.

---

### 4C · FINAL GIF

Der finale VHS Video Combine speichert erst nach Freigabe dauerhaft nach:

```text
ComfyUI/output/GIFToolkit
```

---

## Kein Text gewünscht?

Im Multi-Text Designer einfach:

```text
Enable text overlay = off
```

Alle drei Layer werden damit auf einmal abgeschaltet und die Frames unverändert weitergereicht.

---

## Tipps für kleine GIFs

Wenn das GIF zu groß wird, zuerst reduzieren:

1. Dauer
2. lange Bildseite
3. FPS

Praktischer Ausgangspunkt:

```text
4–5 Sekunden
288–320 px lange Seite
6–8 FPS
```

---

## Troubleshooting

### Designer zeigt vor dem ersten Run nur eine schwarze Fläche
Normal. Einmal **Run** starten, damit ein echter Preview-Frame geladen wird.

### Text lässt sich nicht ziehen
Prüfen:
- `Enable text overlay` ist an
- ausgewählter Layer ist aktiviert
- Layer enthält Text

### Zweiter oder dritter Text erscheint nicht
Layer 2 / 3 auswählen und `Enable selected layer` aktivieren.

### GIF wird nicht final gespeichert
Das ist im Preview-Modus absichtlich so. Bei `4B` **✓ APPROVE & EXPORT FINAL GIF** drücken.

### GIF ist zu groß
`Small` testen oder bei `Custom` Dauer, Auflösung und FPS reduzieren.

### Seitenverhältnis ist falsch
`aspect_ratio = Auto (Input Image)` verwenden.

### Missing Nodes
Benötigt werden:
- ComfyUI-VideoHelperSuite
- ComfyUI-GIFToolkit

KJNodes wird für den aktuellen Workflow nicht benötigt.

---

# English

## Overview

`ComfyUI-GIFToolkit` adds custom helper nodes and a ready-to-use workflow for short looping GIFs.

The current workflow:

1. loads video through **VideoHelperSuite**
2. controls target size, aspect ratio, FPS and duration
3. supports up to **3 independent text layers**
4. previews the text and GIF before permanent output
5. writes the final GIF only after explicit approval

The text designer is visual: text can be clicked directly on the preview frame and dragged with the mouse.

## Requirements

- ComfyUI
- [ComfyUI-VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)
- this repository: `ComfyUI-GIFToolkit`

**KJNodes is no longer required by the current workflow.**

`ComfyUI-GIFToolkit` currently has no additional pip dependencies.

### Third-party dependency

The example workflow uses nodes from **ComfyUI-VideoHelperSuite** by Kosinkadink.

VideoHelperSuite is **not bundled** with this repository. Install it separately from its upstream repository or through ComfyUI Manager. Its copyright and license terms remain with the upstream project.

## Installation

### Git

From `ComfyUI/custom_nodes`:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/oekobudde/ComfyUI-GIFToolkit.git
```

Fully restart ComfyUI afterwards.

### ZIP

1. Download the repository ZIP.
2. Extract it.
3. Place it at `ComfyUI/custom_nodes/ComfyUI-GIFToolkit`.
4. Fully restart ComfyUI.

## Load the workflow

```text
workflows/ComfyUI_GIF_Maker.json
```

Main sections:

```text
1 → LOAD VIDEO
      ↓
2 → PREPARE
      ↓
3 → MULTI-TEXT DESIGNER + BLINK
      ↓
4 → TEMP PREVIEW → APPROVE → FINAL EXPORT
```

## Quick start

1. Select a short video in `1 → LOAD VIDEO`.
2. Start with `Balanced` in `2 → PREPARE`.
3. Keep `aspect_ratio = Auto (Input Image)` to preserve the source ratio.
4. Run the workflow once.
5. Place and style text in **GIF Multi-Text Designer**.
6. Review the temporary GIF at `4A`.
7. When satisfied, click **✓ APPROVE & EXPORT FINAL GIF**.

A normal Run does **not** permanently write the final GIF.

## Presets

| Preset | Long side | FPS | max duration | Use |
|---|---:|---:|---:|---|
| `Small` | 288 px | 6 | 4.0 s | small chat GIF |
| `Balanced` | 320 px | 8 | 5.0 s | good default |
| `Quality` | 384 px | 10 | 5.5 s | higher quality |
| `Custom` | custom | custom | custom | manual control |

---

## Field reference — English

### 0 · GIF Toolkit Guide / Help

#### `language`
Switches the on-canvas guide between `Deutsch` and `English`.

---

### 1 · VHS Load Video

Provided by **ComfyUI-VideoHelperSuite**.

Important fields:

- `video` – input video
- `force_rate` – load FPS, default 12
- `custom_width / custom_height` – default 0 / 0
- `frame_load_cap` – default 144
- `skip_first_frames`
- `select_every_nth`

---

### 2 · GIF Prepare / Preset

Controls:

- preset
- aspect ratio
- target size
- FPS
- maximum duration

`Auto (Input Image)` preserves the source aspect ratio. A fixed ratio performs a centered crop.

---

### 3A · GIF Multi-Text Designer

The central text UI.

#### `Enable text overlay`
Global master switch.

- on → enabled text layers are rendered
- off → no text is rendered and frames pass through unchanged

No manual node bypass is required.

### Text layers

The current version supports exactly **3 layers**.

Every layer has independent:

- enable state
- text
- font
- font size
- font color
- X/Y position
- background
- background color / opacity
- padding
- corner radius
- outline / outline color / width
- shadow / shadow color / X/Y
- line spacing

#### Layer selection
Use:

```text
Layer 1   Layer 2   Layer 3
```

The gold-highlighted layer is selected.

Clicking a visible text directly on the preview also selects its layer.

#### Dragging
Drag the selected text directly on the image.

Positions are stored as relative percentages, so they remain meaningful across output sizes.

#### `Enable selected layer`
Enables or disables only the selected layer.

#### `Duplicate → next`
Copies the active layer into the next slot and offsets it slightly.

#### `Clear selected`
Clears and disables only the selected layer.

#### 3×3 position grid
Quick placement shortcuts:

```text
↖   ↑   ↗
←   •   →
↙   ↓   ↘
```

#### Background / Outline / Shadow
Each layer has independent styling.

#### Advanced style
Contains:

- outline width
- padding
- corner radius
- background opacity
- shadow X/Y
- line spacing

The node automatically fits its height when Advanced style opens or closes.

#### Preview frame
Selects the frame shown in the designer.

`Refresh frame` queues a preview run without permanently writing the final GIF.

---

### 3B · GIF Text Overlay

Applies all enabled layers to the full frame batch.

#### `blink_enabled`
- on → all active layers blink together
- off → all active layers remain continuously visible

#### `blink_on_seconds` / `blink_off_seconds`
Shared blink rhythm.

> Per-layer blink timing is not included yet.

---

### 4A · TEMP GIF PREVIEW

Uses VHS Video Combine with `save_output = false`.

A normal Run creates only a temporary GIF for review.

---

### 4B · GIF Export Gate

Blocks permanent output by default.

When satisfied, click:

**✓ APPROVE & EXPORT FINAL GIF**

It performs one export run, then returns to preview mode.

---

### 4C · FINAL GIF

The final VHS Video Combine writes to:

```text
ComfyUI/output/GIFToolkit
```

only after approval.

---

## No text?

Turn off:

```text
Enable text overlay
```

All three layers are bypassed at once and frames pass through unchanged.

---

## Troubleshooting

### Designer is blank before the first Run
Expected. Run once to load the preview frame.

### Text cannot be dragged
Check that:
- `Enable text overlay` is on
- the selected layer is enabled
- the layer contains text

### Layer 2 or 3 does not appear
Select it and enable `Enable selected layer`.

### Final GIF is not saved
This is intentional in Preview mode. Click **✓ APPROVE & EXPORT FINAL GIF**.

### GIF is too large
Reduce duration, long-side size, or FPS.

### Missing Nodes
Required:
- ComfyUI-VideoHelperSuite
- ComfyUI-GIFToolkit

KJNodes is not required by the current workflow.
