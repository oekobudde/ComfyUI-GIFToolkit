import { app } from "../../scripts/app.js";

const HELP = {
  Deutsch: `
    <div class="wg-title">GIF Maker · v0.2 Preview</div>
    <div class="wg-sub">KJNodes-freier Workflow · Textposition jetzt über verständliche Anker</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video (Upload)</div>
      <div>• force_rate: <b>12 FPS</b></div>
      <div>• custom_width / custom_height: <b>0 / 0</b> = Originalformat</div>
      <div>• frame_load_cap: <b>144</b> → max. ca. 12 s bei 12 FPS</div>
      <div class="wg-tip">Bei sehr großen 2K/4K-Quellen kannst du optional custom_width auf z. B. 512 setzen.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>2</span> → PREPARE</div>
      <div><b>Node:</b> GIF Prepare / Preset</div>
      <div>• Small: 288 px · 6 FPS · 4.0 s</div>
      <div>• Balanced: 320 px · 8 FPS · 5.0 s</div>
      <div>• Quality: 384 px · 10 FPS · 5.5 s</div>
      <div>• Custom: Größe / FPS / Dauer frei</div>
      <div>• Auto behält das Seitenverhältnis des Videos bei.</div>
      <div>• Festes Ratio = mittiger Crop.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3A</span> → TEXT STYLE</div>
      <div><b>Node:</b> GIF Text Style</div>
      <div>• Text, Font, Größe und Farbe einmal einstellen.</div>
      <div>• Position z. B. <b>Top Center</b>, <b>Bottom Right</b> oder <b>Center</b>.</div>
      <div>• margin_x / margin_y steuern nur den Abstand zum gewählten Rand.</div>
      <div>• Optional: Hintergrundbox, Outline und Shadow.</div>
      <div class="wg-tip"><b>Kein Text?</b> enabled = false. Der Workflow muss nicht umverkabelt werden.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3B</span> → PREVIEW</div>
      <div><b>Nodes:</b> GIF Text Preview + Preview Image</div>
      <div>• preview_frame wählt nur einen einzelnen Frame.</div>
      <div>• Damit Position und Style schnell prüfen, ohne erst das komplette GIF beurteilen zu müssen.</div>
      <div class="wg-tip">Style ändern → erneut ausführen → Preview prüfen.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3C</span> → TEXT / BLINK</div>
      <div><b>Node:</b> GIF Text Overlay</div>
      <div>• blink_enabled aus = Text dauerhaft sichtbar.</div>
      <div>• blink_on_seconds / blink_off_seconds = Blinkrhythmus.</div>
      <div>• Die Node bearbeitet den kompletten Frame-Batch direkt.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4</span> → SAVE GIF</div>
      <div><b>Node:</b> VHS Video Combine</div>
      <div>• format: <b>image/gif</b></div>
      <div>• loop_count: <b>0</b> = Endlosschleife</div>
      <div>• FPS wird automatisch von Prepare übernommen.</div>
      <div class="wg-warn">Die Dateigröße hängt stark von Bewegung, Rauschen und Farben ab. Ein fixes MB-Limit kann nicht garantiert werden.</div>
    </section>

    <div class="wg-foot">Benötigt: ComfyUI · VideoHelperSuite · ComfyUI-GIFToolkit</div>`,

  English: `
    <div class="wg-title">GIF Maker · v0.2 Preview</div>
    <div class="wg-sub">KJNodes-free workflow · human-friendly text positioning</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video (Upload)</div>
      <div>• force_rate: <b>12 FPS</b></div>
      <div>• custom_width / custom_height: <b>0 / 0</b> = preserve source size</div>
      <div>• frame_load_cap: <b>144</b> → about 12 s at 12 FPS</div>
      <div class="wg-tip">For very large 2K/4K sources, optionally set custom_width to e.g. 512.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>2</span> → PREPARE</div>
      <div><b>Node:</b> GIF Prepare / Preset</div>
      <div>• Small: 288 px · 6 FPS · 4.0 s</div>
      <div>• Balanced: 320 px · 8 FPS · 5.0 s</div>
      <div>• Quality: 384 px · 10 FPS · 5.5 s</div>
      <div>• Custom: free size / FPS / duration controls</div>
      <div>• Auto preserves the source aspect ratio.</div>
      <div>• A forced ratio performs a centered crop.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3A</span> → TEXT STYLE</div>
      <div><b>Node:</b> GIF Text Style</div>
      <div>• Configure text, font, size and color once.</div>
      <div>• Position using anchors such as <b>Top Center</b>, <b>Bottom Right</b> or <b>Center</b>.</div>
      <div>• margin_x / margin_y only control distance from the selected edge.</div>
      <div>• Optional background box, outline and shadow.</div>
      <div class="wg-tip"><b>No text?</b> Set enabled = false. No rewiring required.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3B</span> → PREVIEW</div>
      <div><b>Nodes:</b> GIF Text Preview + Preview Image</div>
      <div>• preview_frame selects a single frame.</div>
      <div>• Quickly check position and styling before judging the final GIF.</div>
      <div class="wg-tip">Change style → run again → inspect preview.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3C</span> → TEXT / BLINK</div>
      <div><b>Node:</b> GIF Text Overlay</div>
      <div>• blink_enabled off = text stays visible.</div>
      <div>• blink_on_seconds / blink_off_seconds = blink rhythm.</div>
      <div>• The node processes the complete frame batch directly.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4</span> → SAVE GIF</div>
      <div><b>Node:</b> VHS Video Combine</div>
      <div>• format: <b>image/gif</b></div>
      <div>• loop_count: <b>0</b> = endless loop</div>
      <div>• FPS is supplied automatically by Prepare.</div>
      <div class="wg-warn">File size depends strongly on motion, noise and colors. A fixed MB target cannot be guaranteed.</div>
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
  .wg-warn{margin-top:6px;padding:6px 8px;border-left:3px solid #d6a85a;background:#2a2111}
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

      this.addDOMWidget("guide", "gif_toolkit_guide", root, {
        serialize: false,
        hideOnZoom: false,
      });
      this.setSize([510, 820]);
      update();
      return result;
    };
  },
});
