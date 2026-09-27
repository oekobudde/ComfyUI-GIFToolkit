import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

function widget(node, name) {
  return (node.widgets || []).find((w) => w?.name === name);
}

function setWidget(node, name, value) {
  const w = widget(node, name);
  if (!w) return;
  w.value = value;
  try { w.callback?.(value); } catch {}
  node.setDirtyCanvas?.(true, true);
  app.graph?.setDirtyCanvas?.(true, true);
}

function hideWidget(w) {
  if (!w) return;
  w.hidden = true;
  w.computeSize = () => [0, -4];
  if (w.inputEl) w.inputEl.style.display = "none";
}

function viewUrl(entry) {
  const params = new URLSearchParams({
    filename: entry.filename,
    subfolder: entry.subfolder || "",
    type: entry.type || "temp",
    t: String(Date.now()),
  });
  return api.apiURL("/view?" + params.toString());
}

function hexColor(value, fallback) {
  const s = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  const named = {
    yellow:"#ffff00", black:"#000000", white:"#ffffff", red:"#ff0000",
    blue:"#0000ff", green:"#008000", orange:"#ffa500", pink:"#ffc0cb",
    cyan:"#00ffff", magenta:"#ff00ff"
  };
  return named[s.toLowerCase()] || fallback;
}

function fontFamilyFromChoice(value) {
  const raw = String(value || "Arial");
  const stem = raw.replace(/\.(ttf|otf|ttc)$/i, "").replace(/[-_]+/g, " ");
  return '"' + stem + '", Arial, sans-serif';
}

function designerUI(node) {
  const root = document.createElement("div");
  root.style.cssText = [
    "display:flex","flex-direction:column","gap:8px","padding:8px",
    "box-sizing:border-box","background:#17130d","color:#eee",
    "font:12px system-ui,sans-serif","border-radius:6px","width:100%"
  ].join(";");

  const top = document.createElement("div");
  top.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap";
  root.appendChild(top);

  const enabled = document.createElement("label");
  enabled.innerHTML = '<input type="checkbox"> Text enabled';
  enabled.querySelector("input").checked = !!widget(node,"enabled")?.value;
  enabled.querySelector("input").onchange = e => {
    setWidget(node,"enabled",e.target.checked);
    draw();
  };
  top.appendChild(enabled);

  const frameWrap = document.createElement("label");
  frameWrap.textContent = "Preview frame ";
  const frameInput = document.createElement("input");
  frameInput.type="number"; frameInput.min="0"; frameInput.step="1";
  frameInput.value = widget(node,"preview_frame")?.value ?? 0;
  frameInput.style.width="64px";
  frameInput.onchange = () => setWidget(node,"preview_frame", Number(frameInput.value)||0);
  frameWrap.appendChild(frameInput);
  top.appendChild(frameWrap);

  const refresh = document.createElement("button");
  refresh.textContent = "Refresh frame";
  refresh.title = "Run the workflow again to load this preview frame. No permanent GIF is saved.";
  refresh.onclick = async () => {
    setWidget(node,"preview_frame", Number(frameInput.value)||0);
    try { await app.queuePrompt(0, 1); } catch (e) { console.warn("[GIF Toolkit] preview refresh failed", e); }
  };
  top.appendChild(refresh);

  const canvas = document.createElement("canvas");
  canvas.width = 500; canvas.height = 360;
  canvas.style.cssText = "width:100%;max-height:470px;background:#090909;border:1px solid #5d4a25;border-radius:6px;cursor:grab;touch-action:none";
  root.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const hint = document.createElement("div");
  hint.textContent = "Drag the text directly on the image. Changes are stored as relative X/Y positions.";
  hint.style.cssText = "opacity:.72;text-align:center;font-size:11px";
  root.appendChild(hint);

  const textarea = document.createElement("textarea");
  textarea.value = widget(node,"text")?.value ?? "";
  textarea.rows = 2;
  textarea.placeholder = "Text";
  textarea.style.cssText = "width:100%;box-sizing:border-box;background:#221d15;color:#fff;border:1px solid #5d4a25;border-radius:5px;padding:6px";
  textarea.oninput = () => { setWidget(node,"text",textarea.value); draw(); };
  root.appendChild(textarea);

  const row1 = document.createElement("div");
  row1.style.cssText = "display:grid;grid-template-columns:1.5fr .7fr .8fr;gap:6px";
  root.appendChild(row1);

  const fontSel = document.createElement("select");
  const fontW = widget(node,"font");
  const vals = fontW?.options?.values || [];
  for (const v of vals) {
    const o=document.createElement("option"); o.value=v; o.textContent=v; fontSel.appendChild(o);
  }
  fontSel.value = fontW?.value ?? vals[0] ?? "PIL Default";
  fontSel.onchange=()=>{setWidget(node,"font",fontSel.value);draw();};
  row1.appendChild(fontSel);

  const size = document.createElement("input");
  size.type="number"; size.min="6"; size.max="256"; size.step="1";
  size.value=widget(node,"font_size")?.value ?? 34;
  size.title="Font size";
  size.oninput=()=>{setWidget(node,"font_size",Number(size.value)||34);draw();};
  row1.appendChild(size);

  const color = document.createElement("input");
  color.type="color"; color.value=hexColor(widget(node,"font_color")?.value,"#ffff00");
  color.title="Text color";
  color.oninput=()=>{setWidget(node,"font_color",color.value);draw();};
  row1.appendChild(color);

  const quick = document.createElement("div");
  quick.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:4px";
  const presets = [
    ["↖",12,12],["↑",50,12],["↗",88,12],
    ["←",12,50],["•",50,50],["→",88,50],
    ["↙",12,88],["↓",50,88],["↘",88,88],
  ];
  for(const [label,x,y] of presets){
    const b=document.createElement("button"); b.textContent=label; b.title="Move text";
    b.onclick=()=>{setWidget(node,"x_percent",x);setWidget(node,"y_percent",y);draw();};
    quick.appendChild(b);
  }
  root.appendChild(quick);

  const styleRow = document.createElement("div");
  styleRow.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:6px";
  root.appendChild(styleRow);

  function checkControl(label,name,colorName){
    const box=document.createElement("div");
    box.style.cssText="display:flex;gap:4px;align-items:center";
    const cb=document.createElement("input"); cb.type="checkbox"; cb.checked=!!widget(node,name)?.value;
    cb.onchange=()=>{setWidget(node,name,cb.checked);draw();};
    box.appendChild(cb);
    const tx=document.createElement("span"); tx.textContent=label; box.appendChild(tx);
    if(colorName){
      const cp=document.createElement("input"); cp.type="color"; cp.value=hexColor(widget(node,colorName)?.value,"#000000");
      cp.oninput=()=>{setWidget(node,colorName,cp.value);draw();};
      cp.style.marginLeft="auto"; box.appendChild(cp);
    }
    return box;
  }
  styleRow.appendChild(checkControl("Background","background_enabled","background_color"));
  styleRow.appendChild(checkControl("Outline","outline_enabled","outline_color"));
  styleRow.appendChild(checkControl("Shadow","shadow_enabled","shadow_color"));

  const advanced = document.createElement("details");
  advanced.innerHTML = "<summary>Advanced style</summary>";
  advanced.style.cssText="background:#211b12;border-radius:5px;padding:5px";
  root.appendChild(advanced);

  const grid=document.createElement("div");
  grid.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px";
  advanced.appendChild(grid);

  const numericNames = [
    ["Outline width","outline_width",0,32],
    ["Padding","padding",0,128],
    ["Corner radius","corner_radius",0,128],
    ["BG opacity","background_opacity",0,255],
    ["Shadow X","shadow_offset_x",-64,64],
    ["Shadow Y","shadow_offset_y",-64,64],
    ["Line spacing","line_spacing",0,64],
  ];
  for(const [label,name,min,max] of numericNames){
    const lab=document.createElement("label"); lab.textContent=label+" ";
    const inp=document.createElement("input"); inp.type="number"; inp.min=min; inp.max=max; inp.step=1;
    inp.value=widget(node,name)?.value ?? 0; inp.style.width="70px";
    inp.oninput=()=>{setWidget(node,name,Number(inp.value)||0);draw();};
    lab.appendChild(inp); grid.appendChild(lab);
  }

  let bg = null;
  let imageRect = {x:0,y:0,w:canvas.width,h:canvas.height};
  let textRect = null;
  let dragging = false;

  function resizeCanvasForImage() {
    if (!bg) return;
    const maxW = 500, maxH = 470;
    const scale = Math.min(maxW/bg.naturalWidth, maxH/bg.naturalHeight, 1.5);
    canvas.width = Math.max(220, Math.round(bg.naturalWidth*scale));
    canvas.height = Math.max(180, Math.round(bg.naturalHeight*scale));
  }

  function currentStyle() {
    return {
      enabled: !!widget(node,"enabled")?.value,
      text: String(widget(node,"text")?.value ?? ""),
      font: widget(node,"font")?.value ?? "Arial",
      font_size: Number(widget(node,"font_size")?.value ?? 34),
      font_color: String(widget(node,"font_color")?.value ?? "#ffff00"),
      x: Number(widget(node,"x_percent")?.value ?? 50),
      y: Number(widget(node,"y_percent")?.value ?? 15),
      background_enabled: !!widget(node,"background_enabled")?.value,
      background_color: String(widget(node,"background_color")?.value ?? "#000000"),
      background_opacity: Number(widget(node,"background_opacity")?.value ?? 160),
      padding: Number(widget(node,"padding")?.value ?? 8),
      corner_radius: Number(widget(node,"corner_radius")?.value ?? 8),
      outline_enabled: !!widget(node,"outline_enabled")?.value,
      outline_color: String(widget(node,"outline_color")?.value ?? "#000000"),
      outline_width: Number(widget(node,"outline_width")?.value ?? 2),
      shadow_enabled: !!widget(node,"shadow_enabled")?.value,
      shadow_color: String(widget(node,"shadow_color")?.value ?? "#000000"),
      shadow_offset_x: Number(widget(node,"shadow_offset_x")?.value ?? 2),
      shadow_offset_y: Number(widget(node,"shadow_offset_y")?.value ?? 2),
      line_spacing: Number(widget(node,"line_spacing")?.value ?? 4),
    };
  }

  function roundedRect(c,x,y,w,h,r){
    r=Math.max(0,Math.min(r,Math.min(w,h)/2));
    c.beginPath(); c.roundRect(x,y,w,h,r); c.fill();
  }

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#090909"; ctx.fillRect(0,0,canvas.width,canvas.height);

    if(bg){
      const scale=Math.min(canvas.width/bg.naturalWidth,canvas.height/bg.naturalHeight);
      const w=bg.naturalWidth*scale, h=bg.naturalHeight*scale;
      const x=(canvas.width-w)/2, y=(canvas.height-h)/2;
      imageRect={x,y,w,h};
      ctx.drawImage(bg,x,y,w,h);
    } else {
      imageRect={x:0,y:0,w:canvas.width,h:canvas.height};
      ctx.fillStyle="#777"; ctx.textAlign="center"; ctx.font="14px sans-serif";
      ctx.fillText("Run once to load a preview frame",canvas.width/2,canvas.height/2);
    }

    const st=currentStyle();
    if(!st.enabled || !st.text.trim()){ textRect=null; return; }

    const scale = bg ? imageRect.w / bg.naturalWidth : 1;
    const fs=Math.max(8,st.font_size*scale);
    ctx.font = "700 "+fs+"px "+fontFamilyFromChoice(st.font);
    ctx.textAlign="center"; ctx.textBaseline="middle";

    const lines=st.text.split("\n");
    const lineH=fs*1.2 + st.line_spacing*scale;
    const widths=lines.map(t=>ctx.measureText(t || " ").width);
    const tw=Math.max(...widths,1);
    const th=Math.max(lineH,lines.length*lineH);

    let cx=imageRect.x+imageRect.w*st.x/100;
    let cy=imageRect.y+imageRect.h*st.y/100;
    const pad=st.background_enabled ? st.padding*scale : 0;
    const bw=tw+pad*2, bh=th+pad*2;
    cx=Math.max(imageRect.x+bw/2,Math.min(imageRect.x+imageRect.w-bw/2,cx));
    cy=Math.max(imageRect.y+bh/2,Math.min(imageRect.y+imageRect.h-bh/2,cy));
    textRect={x:cx-bw/2,y:cy-bh/2,w:bw,h:bh,cx,cy};

    if(st.background_enabled){
      const alpha=Math.max(0,Math.min(255,st.background_opacity))/255;
      ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=hexColor(st.background_color,"#000000");
      roundedRect(ctx,textRect.x,textRect.y,bw,bh,st.corner_radius*scale); ctx.restore();
    }

    const startY=cy-(lines.length-1)*lineH/2;
    if(st.shadow_enabled){
      ctx.fillStyle=hexColor(st.shadow_color,"#000000");
      for(let i=0;i<lines.length;i++) ctx.fillText(lines[i],cx+st.shadow_offset_x*scale,startY+i*lineH+st.shadow_offset_y*scale);
    }
    ctx.fillStyle=hexColor(st.font_color,"#ffff00");
    ctx.strokeStyle=hexColor(st.outline_color,"#000000");
    ctx.lineWidth=Math.max(1,st.outline_width*scale*2);
    ctx.lineJoin="round";
    for(let i=0;i<lines.length;i++){
      const yy=startY+i*lineH;
      if(st.outline_enabled && st.outline_width>0) ctx.strokeText(lines[i],cx,yy);
      ctx.fillText(lines[i],cx,yy);
    }

    ctx.save();
    ctx.strokeStyle="rgba(255,215,80,.9)";
    ctx.setLineDash([5,4]); ctx.lineWidth=1;
    ctx.strokeRect(textRect.x-3,textRect.y-3,textRect.w+6,textRect.h+6);
    ctx.restore();
  }

  function point(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(canvas.width/r.width), y:(e.clientY-r.top)*(canvas.height/r.height)};
  }

  canvas.addEventListener("pointerdown",e=>{
    const p=point(e);
    if(textRect && p.x>=textRect.x-8 && p.x<=textRect.x+textRect.w+8 && p.y>=textRect.y-8 && p.y<=textRect.y+textRect.h+8){
      dragging=true; canvas.setPointerCapture(e.pointerId); canvas.style.cursor="grabbing"; e.preventDefault();
    }
  });
  canvas.addEventListener("pointermove",e=>{
    if(!dragging) return;
    const p=point(e);
    const x=Math.max(0,Math.min(100,(p.x-imageRect.x)/imageRect.w*100));
    const y=Math.max(0,Math.min(100,(p.y-imageRect.y)/imageRect.h*100));
    setWidget(node,"x_percent",Math.round(x*10)/10);
    setWidget(node,"y_percent",Math.round(y*10)/10);
    draw();
  });
  const stop=e=>{if(dragging){dragging=false;canvas.style.cursor="grab";try{canvas.releasePointerCapture(e.pointerId)}catch{}}};
  canvas.addEventListener("pointerup",stop);
  canvas.addEventListener("pointercancel",stop);

  node._gifDesignerSetBackground = (entry)=>{
    const img=new Image();
    img.onload=()=>{bg=img;resizeCanvasForImage();draw();};
    img.onerror=()=>{bg=null;draw();};
    img.src=viewUrl(entry);
  };
  node._gifDesignerDraw=draw;
  draw();
  return root;
}

function exportGateUI(node){
  const root=document.createElement("div");
  root.style.cssText="padding:10px;background:#102016;color:#eaffef;border:1px solid #39734a;border-radius:6px;font:12px system-ui,sans-serif";
  const status=document.createElement("div");
  status.textContent="PREVIEW MODE · permanent GIF saving is blocked";
  status.style.cssText="margin-bottom:8px;font-weight:700";
  root.appendChild(status);
  const btn=document.createElement("button");
  btn.textContent="EXPORT GIF NOW";
  btn.style.cssText="width:100%;padding:9px;font-weight:800;background:#2e8b57;color:white;border:0;border-radius:5px;cursor:pointer";
  root.appendChild(btn);
  const note=document.createElement("div");
  note.textContent="Normal Run = preview only. This button arms one export run.";
  note.style.cssText="margin-top:7px;opacity:.75";
  root.appendChild(note);

  btn.onclick=async()=>{
    setWidget(node,"export_enabled",true);
    status.textContent="EXPORTING…";
    btn.disabled=true;
    try {
      await app.queuePrompt(0,1);
    } catch(e) {
      console.warn("[GIF Toolkit] export queue failed",e);
      setWidget(node,"export_enabled",false);
      status.textContent="Export queue failed";
      btn.disabled=false;
    }
  };
  node._gifExportStatus=(state)=>{
    if(state==="export"){
      setWidget(node,"export_enabled",false);
      status.textContent="EXPORT SENT TO SAVER ✓ · back to preview mode";
      btn.disabled=false;
    }else{
      status.textContent="PREVIEW MODE · permanent GIF saving is blocked";
      btn.disabled=false;
    }
  };
  return root;
}

app.registerExtension({
  name:"giftoolkit.visualDesigner",
  async beforeRegisterNodeDef(nodeType,nodeData){
    if(nodeData.name==="GIFToolkitTextDesigner"){
      const original=nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated=function(){
        const r=original?.apply(this,arguments);
        const names=[
          "enabled","text","font","font_size","font_color","x_percent","y_percent",
          "background_enabled","background_color","background_opacity","padding","corner_radius",
          "outline_enabled","outline_color","outline_width","shadow_enabled","shadow_color",
          "shadow_offset_x","shadow_offset_y","line_spacing","preview_frame"
        ];
        for(const n of names) hideWidget(widget(this,n));
        const ui=designerUI(this);
        this.addDOMWidget("designer","gif_text_designer",ui,{serialize:false,hideOnZoom:false});
        this.setSize([560,760]);
        return r;
      };
      const oldExec=nodeType.prototype.onExecuted;
      nodeType.prototype.onExecuted=function(message){
        oldExec?.apply(this,arguments);
        const entry=message?.gif_toolkit_designer?.[0];
        if(entry) this._gifDesignerSetBackground?.(entry);
      };
    }

    if(nodeData.name==="GIFToolkitExportGate"){
      const original=nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated=function(){
        const r=original?.apply(this,arguments);
        hideWidget(widget(this,"export_enabled"));
        const ui=exportGateUI(this);
        this.addDOMWidget("export_controls","gif_export_gate",ui,{serialize:false,hideOnZoom:false});
        this.setSize([330,160]);
        return r;
      };
      const oldExec=nodeType.prototype.onExecuted;
      nodeType.prototype.onExecuted=function(message){
        oldExec?.apply(this,arguments);
        const state=message?.gif_toolkit_export_gate?.[0]?.state;
        if(state) this._gifExportStatus?.(state);
      };
    }
  }
});
