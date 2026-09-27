import { app } from "../../scripts/app.js";

const HELP = {
  Deutsch: `
    <div class="wg-title">GIF Maker</div>
    <div class="wg-sub">Kurzanleitung · nach Workflow-Node getrennt</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video</div>
      <div>• force_rate: <b>12 FPS</b></div>
      <div>• custom_width: <b>512</b></div>
      <div>• custom_height: <b>0</b> → Original-Seitenverhältnis</div>
      <div>• frame_load_cap: <b>144</b> → ca. 12 s bei 12 FPS</div>
      <div class="wg-tip">Große 2K/4K-Videos werden schon beim Laden verkleinert.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>2</span> → PRESET / PREPARE</div>
      <div><b>Node:</b> GIF Preset / Prepare</div>
      <div>• Small: 288 px · 6 FPS · 4.0 s</div>
      <div>• Balanced: 320 px · 8 FPS · 5.0 s</div>
      <div>• Quality: 384 px · 10 FPS · 5.5 s</div>
      <div>• Custom: Größe / FPS / Dauer frei</div>
      <div>• Auto behält 1:1, 16:9, 9:16 usw. bei.</div>
      <div>• Festes Ratio erzwingen = mittiger Crop.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3</span> → TEXT / BLINK</div>
      <div><b>Node:</b> Add Label + Blink-Helfer</div>
      <div>• Text, X/Y, Größe, Farbe und Font im Add Label einstellen.</div>
      <div>• blink_on_seconds / blink_off_seconds im Prepare-Node.</div>
      <div class="wg-tip"><b>Kein Text?</b> Text-/Blink-Pfad bypassen und vorbereitete Frames direkt zum GIF-Saver führen.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4</span> → SAVE GIF</div>
      <div><b>Node:</b> VHS Video Combine</div>
      <div>• format: <b>image/gif</b></div>
      <div>• loop_count: <b>0</b> = Endlosschleife</div>
      <div>• FPS kommt automatisch aus dem Prepare-Node.</div>
      <div class="wg-warn">GIF-Größe hängt stark von Bewegung, Rauschen und Farben ab. Unter 2 MB kann nicht garantiert werden.</div>
    </section>

    <div class="wg-foot">Benötigt: VideoHelperSuite · KJNodes · ComfyUI-GIFToolkit</div>`,

  English: `
    <div class="wg-title">GIF Maker</div>
    <div class="wg-sub">Quick guide · separated by workflow node</div>

    <section><div class="wg-head"><span>1</span> → LOAD VIDEO</div>
      <div><b>Node:</b> VHS Load Video</div>
      <div>• force_rate: <b>12 FPS</b></div>
      <div>• custom_width: <b>512</b></div>
      <div>• custom_height: <b>0</b> → preserve source aspect</div>
      <div>• frame_load_cap: <b>144</b> → about 12 s at 12 FPS</div>
      <div class="wg-tip">Large 2K/4K videos are reduced while loading.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>2</span> → PRESET / PREPARE</div>
      <div><b>Node:</b> GIF Preset / Prepare</div>
      <div>• Small: 288 px · 6 FPS · 4.0 s</div>
      <div>• Balanced: 320 px · 8 FPS · 5.0 s</div>
      <div>• Quality: 384 px · 10 FPS · 5.5 s</div>
      <div>• Custom: free size / FPS / duration controls</div>
      <div>• Auto preserves 1:1, 16:9, 9:16, etc.</div>
      <div>• Forcing an aspect ratio uses a centered crop.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>3</span> → TEXT / BLINK</div>
      <div><b>Node:</b> Add Label + blink helper</div>
      <div>• Set text, X/Y, size, color and font in Add Label.</div>
      <div>• Set blink_on_seconds / blink_off_seconds in Prepare.</div>
      <div class="wg-tip"><b>No text?</b> Bypass the text/blink overlay path and send prepared frames directly to the GIF saver.</div>
    </section>

    <div class="wg-arrow">↓</div>
    <section><div class="wg-head"><span>4</span> → SAVE GIF</div>
      <div><b>Node:</b> VHS Video Combine</div>
      <div>• format: <b>image/gif</b></div>
      <div>• loop_count: <b>0</b> = endless loop</div>
      <div>• FPS is supplied automatically by Prepare.</div>
      <div class="wg-warn">GIF size depends heavily on motion, noise and colors. A sub-2 MB result cannot be guaranteed.</div>
    </section>

    <div class="wg-foot">Requires: VideoHelperSuite · KJNodes · ComfyUI-GIFToolkit</div>`
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
  .wg-head span{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#163b51;color:#fff;margin-right:4px}
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
      this.setSize([510, 760]);
      update();
      return result;
    };
  },
});
