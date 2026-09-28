import { app } from "../../scripts/app.js";

const HELP = {
  Deutsch: `
    <div class="wg-title">GIF Toolkit · Multi-Text Designer</div>
    <div class="wg-sub">Bis zu 3 Texte · visuell platzieren · Preview zuerst · Export erst nach Freigabe</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video (Upload)</div>
      <div>Video auswählen. Standard: 12 FPS, maximal 144 geladene Frames.</div>
      <div class="wg-tip">Ein normaler Run erzeugt nur Vorschauen – noch kein finales GIF im Output-Ordner.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>2</span> → PREPARE</div>
      <div><b>Node:</b> GIF Prepare / Preset</div>
      <div>• <b>Small:</b> 288 px · 6 FPS · 4.0 s</div>
      <div>• <b>Balanced:</b> 320 px · 8 FPS · 5.0 s</div>
      <div>• <b>Quality:</b> 384 px · 10 FPS · 5.5 s</div>
      <div>• <b>Custom:</b> Größe, FPS und Dauer frei</div>
      <div>• <b>Auto (Input Image)</b> erhält das Seitenverhältnis.</div>
      <div>• Ein festes Ratio führt einen mittigen Crop aus.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>3A</span> → MULTI-TEXT DESIGNER</div>
      <div><b>Node:</b> GIF Multi-Text Designer</div>
      <div>• Unterstützt <b>3 unabhängige Text-Layer</b>.</div>
      <div>• <b>Enable text overlay</b> ist der Master-Schalter für alle Texte.</div>
      <div>• Jeder Layer kann zusätzlich einzeln aktiviert/deaktiviert werden.</div>
      <div>• Layer 1 / 2 / 3 oben auswählen.</div>
      <div>• Klick auf einen Text im Bild wählt diesen Layer ebenfalls aus.</div>
      <div>• Den ausgewählten Text direkt mit der Maus auf dem Bild verschieben.</div>
      <div>• Jeder Layer besitzt eigenen Text, Font, Größe, Farbe, Position, Hintergrund, Outline und Shadow.</div>
      <div>• <b>Duplicate → next</b> kopiert den aktiven Layer in den nächsten Slot.</div>
      <div>• <b>Clear selected</b> leert nur den ausgewählten Layer.</div>
      <div>• Das 3×3-Pfeilraster setzt den ausgewählten Text schnell an typische Positionen.</div>
      <div>• <b>Advanced style</b> enthält Outline-Breite, Padding, Corner Radius, BG-Opacity, Shadow-X/Y und Line Spacing.</div>
      <div class="wg-tip">Master-Schalter aus = keinerlei Text-Rendering. Die Frames laufen unverändert weiter – kein manuelles Bypassen nötig.</div>
      <div class="wg-tip">Blinken ist in dieser Version global: alle aktiven Text-Layer blinken gemeinsam.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>3B</span> → TEXT / BLINK</div>
      <div><b>Node:</b> GIF Text Overlay</div>
      <div>• Rendert alle aktivierten Text-Layer auf den kompletten Frame-Batch.</div>
      <div>• <b>blink_enabled = aus</b> → alle aktiven Texte dauerhaft sichtbar.</div>
      <div>• <b>blink_on_seconds / blink_off_seconds</b> → gemeinsamer Blinkrhythmus.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>4A</span> → TEMP GIF PREVIEW</div>
      <div><b>Node:</b> VHS Video Combine · TEMP ONLY</div>
      <div>Ein normaler Run erzeugt nur ein temporäres GIF zur Kontrolle.</div>
      <div>Dieses Preview landet nicht dauerhaft im normalen Output-Ordner.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>4B</span> → APPROVE & EXPORT</div>
      <div><b>Node:</b> GIF Export Gate</div>
      <div>Standard: <b>PREVIEW MODE</b> – der finale Saver bleibt blockiert.</div>
      <div>Wenn alles passt: <b>✓ APPROVE & EXPORT FINAL GIF</b> drücken.</div>
      <div>Der Button startet genau einen Export-Lauf und schaltet danach zurück auf Preview.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>4C</span> → FINAL GIF</div>
      <div><b>Node:</b> VHS Video Combine</div>
      <div>Speichert erst nach der Freigabe dauerhaft nach <b>output/GIFToolkit</b>.</div>
    </section>

    <div class="wg-foot">Benötigt: ComfyUI · ComfyUI-VideoHelperSuite · ComfyUI-GIFToolkit</div>`,

  English: `
    <div class="wg-title">GIF Toolkit · Multi-Text Designer</div>
    <div class="wg-sub">Up to 3 text layers · visual placement · preview first · export only after approval</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video (Upload)</div>
      <div>Select a video. Default: 12 FPS, maximum 144 loaded frames.</div>
      <div class="wg-tip">A normal Run creates previews only – no permanent final GIF yet.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>2</span> → PREPARE</div>
      <div><b>Node:</b> GIF Prepare / Preset</div>
      <div>• <b>Small:</b> 288 px · 6 FPS · 4.0 s</div>
      <div>• <b>Balanced:</b> 320 px · 8 FPS · 5.0 s</div>
      <div>• <b>Quality:</b> 384 px · 10 FPS · 5.5 s</div>
      <div>• <b>Custom:</b> free size, FPS and duration controls</div>
      <div>• <b>Auto (Input Image)</b> preserves the source aspect ratio.</div>
      <div>• A forced ratio performs a centered crop.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>3A</span> → MULTI-TEXT DESIGNER</div>
      <div><b>Node:</b> GIF Multi-Text Designer</div>
      <div>• Supports <b>3 independent text layers</b>.</div>
      <div>• <b>Enable text overlay</b> is the master switch for all text.</div>
      <div>• Each layer can also be enabled or disabled individually.</div>
      <div>• Select Layer 1 / 2 / 3 at the top.</div>
      <div>• Clicking a text directly on the image also selects that layer.</div>
      <div>• Drag the selected text directly on the image.</div>
      <div>• Every layer has its own text, font, size, color, position, background, outline and shadow.</div>
      <div>• <b>Duplicate → next</b> copies the active layer into the next slot.</div>
      <div>• <b>Clear selected</b> clears only the selected layer.</div>
      <div>• The 3×3 arrow grid quickly moves the selected text to common positions.</div>
      <div>• <b>Advanced style</b> contains outline width, padding, corner radius, BG opacity, shadow X/Y and line spacing.</div>
      <div class="wg-tip">Master switch off = no text rendering at all. Frames pass through unchanged; no manual bypassing is required.</div>
      <div class="wg-tip">Blinking is global in this version: all active text layers blink together.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>3B</span> → TEXT / BLINK</div>
      <div><b>Node:</b> GIF Text Overlay</div>
      <div>• Renders all enabled text layers across the complete frame batch.</div>
      <div>• <b>blink_enabled off</b> → all active text remains continuously visible.</div>
      <div>• <b>blink_on_seconds / blink_off_seconds</b> → shared blink rhythm.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>4A</span> → TEMP GIF PREVIEW</div>
      <div><b>Node:</b> VHS Video Combine · TEMP ONLY</div>
      <div>A normal Run creates only a temporary GIF for review.</div>
      <div>The preview is not permanently written to the normal output folder.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>4B</span> → APPROVE & EXPORT</div>
      <div><b>Node:</b> GIF Export Gate</div>
      <div>Default: <b>PREVIEW MODE</b> – the final saver remains blocked.</div>
      <div>When satisfied, click <b>✓ APPROVE & EXPORT FINAL GIF</b>.</div>
      <div>The button starts one export run, then returns the workflow to preview mode.</div>
    </section>

    <div class="wg-arrow">↓</div>

    <section><div class="wg-head"><span>4C</span> → FINAL GIF</div>
      <div><b>Node:</b> VHS Video Combine</div>
      <div>Saves permanently to <b>output/GIFToolkit</b> only after approval.</div>
    </section>

    <div class="wg-foot">Requires: ComfyUI · ComfyUI-VideoHelperSuite · ComfyUI-GIFToolkit</div>`
};

function styleContainer(el) {
  el.style.boxSizing = "border-box";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.overflowY = "auto";
  el.style.padding = "10px 12px";
  el.style.background = "#0b0d10";
  el.style.color = "#e8edf2";
  el.style.fontFamily = "Inter, system-ui, sans-serif";
  el.style.fontSize = "12px";
  el.style.lineHeight = "1.45";
  el.style.borderRadius = "6px";
}

const css = `
  .wg-title{font-size:22px;font-weight:800;margin-bottom:2px;color:#fff}
  .wg-sub{opacity:.72;margin-bottom:10px}
  .wg-head{font-size:14px;font-weight:800;color:#8fd3ff;margin-bottom:5px}
  .wg-head span{display:inline-grid;place-items:center;min-width:24px;height:20px;border-radius:10px;background:#163b51;color:#fff;margin-right:4px;padding:0 5px}
  section{border:1px solid #2a3340;border-radius:7px;padding:9px 10px;background:#11161c}
  .wg-arrow{text-align:center;font-size:20px;line-height:24px;color:#79c7ff;font-weight:900}
  .wg-tip{margin-top:6px;padding:6px 8px;border-left:3px solid #5aa9d6;background:#10202b}
  .wg-foot{margin-top:10px;font-size:11px;opacity:.72}
`;

app.registerExtension({
  name: "giftoolkit.bilingualGuide",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "GIFToolkitGuide") return;

    const original = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = original?.apply(this, arguments);
      const root = document.createElement("div");
      styleContainer(root);
      const style = document.createElement("style");
      style.textContent = css;
      root.appendChild(style);
      const body = document.createElement("div");
      root.appendChild(body);

      const languageWidget = this.widgets?.find((w) => w.name === "language");
      const update = () => {
        const lang = languageWidget?.value === "English" ? "English" : "Deutsch";
        body.innerHTML = HELP[lang];
      };

      if (languageWidget) {
        const oldCallback = languageWidget.callback;
        languageWidget.callback = function (value) {
          oldCallback?.apply(this, arguments);
          update();
        };
      }

      this.addDOMWidget("guide", "gif_toolkit_guide", root, { serialize: false, hideOnZoom: false });
      this.setSize([510, 820]);
      update();
      return result;
    };
  },
});
