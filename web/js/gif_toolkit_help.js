import { app } from "../../scripts/app.js";

const HELP = {
  Deutsch: `
    <div class="wg-title">GIF Maker · Visual Designer Preview</div>
    <div class="wg-sub">Vorschau zuerst · permanentes GIF erst nach Freigabe</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video (Upload)</div>
      <div>Video auswählen. Standard: 12 FPS, max. 144 geladene Frames.</div>
      <div class="wg-tip">Normales Run speichert ab jetzt kein finales GIF mehr.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>2</span> → PREPARE</div>
      <div><b>Node:</b> GIF Prepare / Preset</div>
      <div>• Small: 288 px · 6 FPS · 4.0 s</div>
      <div>• Balanced: 320 px · 8 FPS · 5.0 s</div>
      <div>• Quality: 384 px · 10 FPS · 5.5 s</div>
      <div>• Auto erhält das Seitenverhältnis.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3A</span> → VISUAL TEXT DESIGNER</div>
      <div><b>Node:</b> GIF Text Designer</div>
      <div>• Einmal Run drücken, damit ein Preview-Frame geladen wird.</div>
      <div>• Text direkt im Bild mit der Maus verschieben.</div>
      <div>• Text, Font, Größe und Farben grafisch einstellen.</div>
      <div>• Pfeilraster = schnelle Positionierung.</div>
      <div>• Background, Outline und Shadow direkt ein-/ausschalten.</div>
      <div>• enabled aus = kein Text.</div>
      <div class="wg-tip">Nach dem ersten Run kannst du Position und Style lokal im Browser ändern, ohne jedes Mal neu zu rendern.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3B</span> → TEXT / BLINK</div>
      <div><b>Node:</b> GIF Text Overlay</div>
      <div>• blink_enabled aus = Text dauerhaft sichtbar.</div>
      <div>• blink_on_seconds / blink_off_seconds = Blinkrhythmus.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4A</span> → GIF PREVIEW</div>
      <div><b>Node:</b> VHS Video Combine · TEMP ONLY</div>
      <div>Bei normalem Run entsteht nur ein temporäres Preview-GIF.</div>
      <div>Es landet nicht dauerhaft im Output-Ordner.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4B</span> → APPROVE / EXPORT</div>
      <div><b>Node:</b> GIF Export Gate</div>
      <div>Standard: <b>PREVIEW MODE</b> — finaler Saver ist blockiert.</div>
      <div>Wenn alles passt: <b>EXPORT GIF NOW</b> drücken.</div>
      <div>Der Button startet genau einen Export-Lauf und schaltet danach zurück auf Preview.</div>
    </section>

    <div class="wg-foot">Benötigt: ComfyUI · VideoHelperSuite · ComfyUI-GIFToolkit</div>`,

  English: `
    <div class="wg-title">GIF Maker · Visual Designer Preview</div>
    <div class="wg-sub">Preview first · permanent GIF only after approval</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video (Upload)</div>
      <div>Select a video. Default: 12 FPS, max. 144 loaded frames.</div>
      <div class="wg-tip">A normal Run no longer writes a final GIF.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>2</span> → PREPARE</div>
      <div><b>Node:</b> GIF Prepare / Preset</div>
      <div>• Small: 288 px · 6 FPS · 4.0 s</div>
      <div>• Balanced: 320 px · 8 FPS · 5.0 s</div>
      <div>• Quality: 384 px · 10 FPS · 5.5 s</div>
      <div>• Auto preserves the source aspect ratio.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3A</span> → VISUAL TEXT DESIGNER</div>
      <div><b>Node:</b> GIF Text Designer</div>
      <div>• Run once to load a preview frame.</div>
      <div>• Drag the text directly on the image.</div>
      <div>• Edit text, font, size and colors graphically.</div>
      <div>• Arrow grid = fast positioning shortcuts.</div>
      <div>• Toggle background, outline and shadow directly.</div>
      <div>• Disable enabled for no text.</div>
      <div class="wg-tip">After the first Run, position and style changes are local in the browser and do not require repeated rendering.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3B</span> → TEXT / BLINK</div>
      <div><b>Node:</b> GIF Text Overlay</div>
      <div>• blink_enabled off = text stays visible.</div>
      <div>• blink_on_seconds / blink_off_seconds = blink rhythm.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4A</span> → GIF PREVIEW</div>
      <div><b>Node:</b> VHS Video Combine · TEMP ONLY</div>
      <div>A normal Run creates only a temporary preview GIF.</div>
      <div>It is not permanently written to the output folder.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4B</span> → APPROVE / EXPORT</div>
      <div><b>Node:</b> GIF Export Gate</div>
      <div>Default: <b>PREVIEW MODE</b> — final saver is blocked.</div>
      <div>When satisfied, click <b>EXPORT GIF NOW</b>.</div>
      <div>The button starts one export run, then returns to preview mode.</div>
    </section>

    <div class="wg-foot">Requires: ComfyUI · VideoHelperSuite · ComfyUI-GIFToolkit</div>`
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
      this.setSize([510, 860]);
      update();
      return result;
    };
  },
});
