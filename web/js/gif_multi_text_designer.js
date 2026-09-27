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

function fitNodeToContent(node, root, extra = 64) {
  requestAnimationFrame(() => {
    if (!node || !root) return;
    const width = Math.max(600, Number(node.size?.[0] || 600));
    const needed = Math.max(420, Math.ceil(root.scrollHeight + extra));
    const current = Number(node.size?.[1] || 0);
    if (Math.abs(current - needed) < 6) return;
    node.setSize?.([width, needed]);
    node.setDirtyCanvas?.(true, true);
    app.graph?.setDirtyCanvas?.(true, true);
  });
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

function defaultLayer(index) {
  const positions = [[45.2,5.6],[15,85],[85,85]];
  const [x,y] = positions[index] || [50,50];
  return {
    enabled: index === 0,
    text: index === 0 ? "LET'S GO!" : "",
    font: "PIL Default",
    font_size: index === 0 ? 16 : 20,
    font_color: index === 0 ? "#40e704" : "#ffffff",
    x_percent: x,
    y_percent: y,
    background_enabled: false,
    background_color: "#000000",
    background_opacity: 160,
    padding: 8,
    corner_radius: 8,
    outline_enabled: true,
    outline_color: "#000000",
    outline_width: 2,
    shadow_enabled: index === 0,
    shadow_color: "#000000",
    shadow_offset_x: 2,
    shadow_offset_y: 2,
    line_spacing: 4,
  };
}

function normalizeLayer(value, index) {
  return {...defaultLayer(index), ...(value && typeof value === "object" ? value : {})};
}

function parseLayers(node) {
  let parsed = [];
  try {
    parsed = JSON.parse(String(widget(node,"layers_json")?.value || "[]"));
  } catch {}
  if (!Array.isArray(parsed)) parsed = [];
  return [0,1,2].map(i => normalizeLayer(parsed[i], i));
}

function writeLayers(node, layers) {
  setWidget(node, "layers_json", JSON.stringify(layers.slice(0,3)));
}

function parseFonts(node) {
  try {
    const p = JSON.parse(String(widget(node,"font_catalog_json")?.value || "[]"));
    if (Array.isArray(p) && p.length) return p;
  } catch {}
  return ["PIL Default"];
}

function multiDesignerUI(node) {
  let layers = parseLayers(node);
  let active = Math.max(0, Math.min(2, Number(widget(node,"active_layer")?.value || 0)));
  const fonts = parseFonts(node);

  const root = document.createElement("div");
  root.style.cssText = [
    "display:flex","flex-direction:column","gap:8px","padding:8px",
    "box-sizing:border-box","background:#17130d","color:#eee",
    "font:12px system-ui,sans-serif","border-radius:6px","width:100%"
  ].join(";");

  const top = document.createElement("div");
  top.style.cssText = "display:flex;gap:8px;align-items:center;flex-wrap:wrap";
  root.appendChild(top);

  const globalLabel = document.createElement("label");
  globalLabel.style.cssText = "font-weight:800;display:flex;gap:5px;align-items:center";
  globalLabel.innerHTML = '<input type="checkbox"> Enable text overlay';
  const globalCb = globalLabel.querySelector("input");
  globalCb.checked = !!widget(node,"enabled")?.value;
  top.appendChild(globalLabel);

  const globalState = document.createElement("span");
  globalState.style.cssText = "font-size:11px;opacity:.78;margin-left:auto";
  top.appendChild(globalState);

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

  const canvasWrap = document.createElement("div");
  canvasWrap.style.cssText = "display:flex;justify-content:center;align-items:center;width:100%;min-height:180px;overflow:hidden";
  root.appendChild(canvasWrap);

  const canvas = document.createElement("canvas");
  canvas.width = 320; canvas.height = 320;
  canvas.style.cssText = "display:block;background:#090909;border:1px solid #5d4a25;border-radius:6px;cursor:grab;touch-action:none";
  canvasWrap.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const resolution = document.createElement("div");
  resolution.textContent = "Frame: waiting for preview";
  resolution.style.cssText = "text-align:center;opacity:.78;font-size:11px";
  root.appendChild(resolution);

  const hint = document.createElement("div");
  hint.textContent = "All active text layers are shown. Click a text to select it, then drag it directly on the image.";
  hint.style.cssText = "opacity:.72;text-align:center;font-size:11px";
  root.appendChild(hint);

  const controlsWrap = document.createElement("div");
  controlsWrap.style.cssText = "display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box";
  root.appendChild(controlsWrap);

  const layerBar = document.createElement("div");
  layerBar.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:5px";
  controlsWrap.appendChild(layerBar);
  const layerButtons = [];

  for (let i=0;i<3;i++) {
    const b=document.createElement("button");
    b.onclick=()=>selectLayer(i);
    layerBar.appendChild(b);
    layerButtons.push(b);
  }

  const layerActions = document.createElement("div");
  layerActions.style.cssText = "display:flex;gap:7px;align-items:center;flex-wrap:wrap";
  controlsWrap.appendChild(layerActions);

  const layerEnabledLabel=document.createElement("label");
  layerEnabledLabel.innerHTML='<input type="checkbox"> Enable selected layer';
  const layerEnabled=layerEnabledLabel.querySelector("input");
  layerEnabled.onchange=()=>{
    layers[active].enabled=layerEnabled.checked;
    commitLayers(); refreshEditor(); draw();
  };
  layerActions.appendChild(layerEnabledLabel);

  const duplicate=document.createElement("button");
  duplicate.textContent="Duplicate → next";
  duplicate.onclick=()=>{
    const target=(active+1)%3;
    layers[target]=JSON.parse(JSON.stringify(layers[active]));
    layers[target].x_percent=Math.max(0,Math.min(100,Number(layers[target].x_percent)+5));
    layers[target].y_percent=Math.max(0,Math.min(100,Number(layers[target].y_percent)+5));
    active=target;
    commitLayers(); setWidget(node,"active_layer",active); refreshEditor(); draw();
  };
  layerActions.appendChild(duplicate);

  const clear=document.createElement("button");
  clear.textContent="Clear selected";
  clear.onclick=()=>{
    layers[active]=defaultLayer(active);
    layers[active].enabled=false;
    layers[active].text="";
    commitLayers(); refreshEditor(); draw();
  };
  layerActions.appendChild(clear);

  const textarea=document.createElement("textarea");
  textarea.rows=2;
  textarea.placeholder="Text for selected layer";
  textarea.style.cssText="width:100%;box-sizing:border-box;background:#221d15;color:#fff;border:1px solid #5d4a25;border-radius:5px;padding:6px";
  textarea.oninput=()=>{ layers[active].text=textarea.value; commitLayers(); draw(); updateLayerButtons(); };
  controlsWrap.appendChild(textarea);

  const row1=document.createElement("div");
  row1.style.cssText="display:grid;grid-template-columns:1.5fr .7fr .8fr;gap:6px";
  controlsWrap.appendChild(row1);

  const fontSel=document.createElement("select");
  for (const v of fonts) {
    const o=document.createElement("option"); o.value=v; o.textContent=v; fontSel.appendChild(o);
  }
  fontSel.onchange=()=>{layers[active].font=fontSel.value;commitLayers();draw();};
  row1.appendChild(fontSel);

  const size=document.createElement("input");
  size.type="number"; size.min="6"; size.max="256"; size.step="1"; size.title="Font size";
  size.oninput=()=>{layers[active].font_size=Number(size.value)||16;commitLayers();draw();};
  row1.appendChild(size);

  const color=document.createElement("input");
  color.type="color"; color.title="Text color";
  color.oninput=()=>{layers[active].font_color=color.value;commitLayers();draw();updateLayerButtons();};
  row1.appendChild(color);

  const quick=document.createElement("div");
  quick.style.cssText="display:grid;grid-template-columns:repeat(3,1fr);gap:4px";
  const presets=[
    ["↖",12,12],["↑",50,12],["↗",88,12],
    ["←",12,50],["•",50,50],["→",88,50],
    ["↙",12,88],["↓",50,88],["↘",88,88],
  ];
  for(const [label,x,y] of presets){
    const b=document.createElement("button"); b.textContent=label;
    b.onclick=()=>{layers[active].x_percent=x;layers[active].y_percent=y;commitLayers();draw();};
    quick.appendChild(b);
  }
  controlsWrap.appendChild(quick);

  const styleRow=document.createElement("div");
  styleRow.style.cssText="display:grid;grid-template-columns:repeat(3,1fr);gap:6px";
  controlsWrap.appendChild(styleRow);

  function checkControl(label,name,colorName){
    const box=document.createElement("div");
    box.style.cssText="display:flex;gap:4px;align-items:center";
    const cb=document.createElement("input"); cb.type="checkbox";
    cb.onchange=()=>{layers[active][name]=cb.checked;commitLayers();draw();};
    box.appendChild(cb);
    const tx=document.createElement("span"); tx.textContent=label; box.appendChild(tx);
    let cp=null;
    if(colorName){
      cp=document.createElement("input"); cp.type="color";
      cp.oninput=()=>{layers[active][colorName]=cp.value;commitLayers();draw();};
      cp.style.marginLeft="auto"; box.appendChild(cp);
    }
    styleRow.appendChild(box);
    return {cb,cp,name,colorName};
  }

  const bgCtl=checkControl("Background","background_enabled","background_color");
  const outCtl=checkControl("Outline","outline_enabled","outline_color");
  const shCtl=checkControl("Shadow","shadow_enabled","shadow_color");

  const advanced=document.createElement("details");
  advanced.innerHTML="<summary>Advanced style</summary>";
  advanced.style.cssText="background:#211b12;border:1px solid #5d4a25;border-radius:5px;padding:6px;box-sizing:border-box;width:100%";
  controlsWrap.appendChild(advanced);
  advanced.addEventListener("toggle",()=>fitNodeToContent(node,root));

  const grid=document.createElement("div");
  grid.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px";
  advanced.appendChild(grid);

  const numericDefs=[
    ["Outline width","outline_width",0,32],
    ["Padding","padding",0,128],
    ["Corner radius","corner_radius",0,128],
    ["BG opacity","background_opacity",0,255],
    ["Shadow X","shadow_offset_x",-64,64],
    ["Shadow Y","shadow_offset_y",-64,64],
    ["Line spacing","line_spacing",0,64],
  ];
  const numericInputs={};
  for(const [label,name,min,max] of numericDefs){
    const lab=document.createElement("label"); lab.textContent=label+" ";
    const inp=document.createElement("input"); inp.type="number"; inp.min=min; inp.max=max; inp.step=1; inp.style.width="70px";
    inp.oninput=()=>{layers[active][name]=Number(inp.value)||0;commitLayers();draw();};
    lab.appendChild(inp); grid.appendChild(lab); numericInputs[name]=inp;
  }

  let bg=null;
  let imageRect={x:0,y:0,w:canvas.width,h:canvas.height};
  let textRects=[];
  let dragging=false;

  function commitLayers(){
    writeLayers(node,layers);
  }

  function selectLayer(index){
    active=Math.max(0,Math.min(2,index));
    setWidget(node,"active_layer",active);
    refreshEditor();
    draw();
  }

  function updateLayerButtons(){
    for(let i=0;i<3;i++){
      const l=layers[i];
      const txt=String(l.text||"").trim();
      layerButtons[i].textContent="Layer "+(i+1)+(l.enabled?" ✓":"");
      layerButtons[i].title=txt || "Empty layer";
      layerButtons[i].style.cssText = [
        "padding:7px","border-radius:5px",
        i===active ? "border:2px solid #e4b84c" : "border:1px solid #66583b",
        "background:"+(i===active?"#4b3b18":(l.enabled?"#2f3520":"#26231d")),
        "color:#fff","font-weight:"+(i===active?"800":"600")
      ].join(";");
    }
  }

  function refreshEditor(){
    const l=layers[active];
    layerEnabled.checked=!!l.enabled;
    textarea.value=String(l.text||"");
    fontSel.value=fonts.includes(l.font)?l.font:fonts[0];
    size.value=Number(l.font_size||16);
    color.value=hexColor(l.font_color,"#ffffff");
    bgCtl.cb.checked=!!l.background_enabled;
    bgCtl.cp.value=hexColor(l.background_color,"#000000");
    outCtl.cb.checked=!!l.outline_enabled;
    outCtl.cp.value=hexColor(l.outline_color,"#000000");
    shCtl.cb.checked=!!l.shadow_enabled;
    shCtl.cp.value=hexColor(l.shadow_color,"#000000");
    for(const [name,inp] of Object.entries(numericInputs)) inp.value=Number(l[name]??0);
    updateLayerButtons();
    fitNodeToContent(node,root);
  }

  function updateGlobalUI(){
    const on=!!widget(node,"enabled")?.value;
    controlsWrap.style.opacity=on?"1":"0.38";
    controlsWrap.style.filter=on?"none":"grayscale(.35)";
    controlsWrap.style.pointerEvents=on?"auto":"none";
    globalState.textContent=on?"TEXT LAYERS ON":"TEXT OFF · frames pass through unchanged";
    globalState.style.color=on?"#bfffd0":"#ffcf8a";
    canvas.style.cursor=on?"grab":"default";
    fitNodeToContent(node,root);
  }

  globalCb.onchange=()=>{
    setWidget(node,"enabled",globalCb.checked);
    updateGlobalUI(); draw();
  };

  function resizeCanvasForImage(){
    if(!bg) return;
    const srcW=bg.naturalWidth||320, srcH=bg.naturalHeight||320;
    const maxW=520,maxH=560;
    const scale=Math.min(1,maxW/srcW,maxH/srcH);
    canvas.width=Math.max(1,Math.round(srcW*scale));
    canvas.height=Math.max(1,Math.round(srcH*scale));
    canvas.style.width=canvas.width+"px";
    canvas.style.height=canvas.height+"px";
    resolution.textContent="Frame: "+srcW+" × "+srcH+(scale<1?" · preview scaled to fit":" · 1:1 preview");
  }

  function roundedRect(c,x,y,w,h,r){
    r=Math.max(0,Math.min(r,Math.min(w,h)/2));
    c.beginPath(); c.roundRect(x,y,w,h,r); c.fill();
  }

  function drawLayer(layer,index,selected){
    if(!layer.enabled || !String(layer.text||"").trim()) return null;
    const scale=bg?imageRect.w/bg.naturalWidth:1;
    const fs=Math.max(8,Number(layer.font_size||16)*scale);
    ctx.font="700 "+fs+"px "+fontFamilyFromChoice(layer.font);
    ctx.textAlign="center"; ctx.textBaseline="middle";

    const lines=String(layer.text||"").split("\n");
    const lineH=fs*1.2+Number(layer.line_spacing||4)*scale;
    const widths=lines.map(t=>ctx.measureText(t||" ").width);
    const tw=Math.max(...widths,1);
    const th=Math.max(lineH,lines.length*lineH);
    const pad=layer.background_enabled?Number(layer.padding||0)*scale:0;
    const bw=tw+pad*2,bh=th+pad*2;
    let cx=imageRect.x+imageRect.w*Number(layer.x_percent??50)/100;
    let cy=imageRect.y+imageRect.h*Number(layer.y_percent??50)/100;
    cx=Math.max(imageRect.x+bw/2,Math.min(imageRect.x+imageRect.w-bw/2,cx));
    cy=Math.max(imageRect.y+bh/2,Math.min(imageRect.y+imageRect.h-bh/2,cy));
    const rect={index,x:cx-bw/2,y:cy-bh/2,w:bw,h:bh,cx,cy};

    if(layer.background_enabled){
      const alpha=Math.max(0,Math.min(255,Number(layer.background_opacity||160)))/255;
      ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=hexColor(layer.background_color,"#000000");
      roundedRect(ctx,rect.x,rect.y,bw,bh,Number(layer.corner_radius||0)*scale);ctx.restore();
    }

    const startY=cy-(lines.length-1)*lineH/2;
    if(layer.shadow_enabled){
      ctx.fillStyle=hexColor(layer.shadow_color,"#000000");
      for(let i=0;i<lines.length;i++) ctx.fillText(lines[i],cx+Number(layer.shadow_offset_x||0)*scale,startY+i*lineH+Number(layer.shadow_offset_y||0)*scale);
    }

    ctx.fillStyle=hexColor(layer.font_color,"#ffffff");
    ctx.strokeStyle=hexColor(layer.outline_color,"#000000");
    ctx.lineWidth=Math.max(1,Number(layer.outline_width||0)*scale*2);
    ctx.lineJoin="round";
    for(let i=0;i<lines.length;i++){
      const yy=startY+i*lineH;
      if(layer.outline_enabled && Number(layer.outline_width||0)>0) ctx.strokeText(lines[i],cx,yy);
      ctx.fillText(lines[i],cx,yy);
    }

    ctx.save();
    ctx.strokeStyle=selected?"rgba(255,215,80,.95)":"rgba(255,255,255,.45)";
    ctx.setLineDash(selected?[5,4]:[2,4]);
    ctx.lineWidth=selected?1.5:1;
    ctx.strokeRect(rect.x-3,rect.y-3,rect.w+6,rect.h+6);
    ctx.restore();
    return rect;
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#090909";ctx.fillRect(0,0,canvas.width,canvas.height);

    if(!bg){
      imageRect={x:0,y:0,w:canvas.width,h:canvas.height};
      ctx.fillStyle="#777";ctx.textAlign="center";ctx.font="14px sans-serif";
      ctx.fillText("Run once to load a preview frame",canvas.width/2,canvas.height/2);
      textRects=[];return;
    }

    imageRect={x:0,y:0,w:canvas.width,h:canvas.height};
    ctx.drawImage(bg,0,0,canvas.width,canvas.height);
    textRects=[];
    if(!widget(node,"enabled")?.value) return;

    for(let i=0;i<3;i++){
      const rect=drawLayer(layers[i],i,i===active);
      if(rect) textRects.push(rect);
    }
  }

  function point(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)*(canvas.width/r.width),y:(e.clientY-r.top)*(canvas.height/r.height)};
  }

  canvas.addEventListener("pointerdown",e=>{
    if(!widget(node,"enabled")?.value) return;
    const p=point(e);
    let hit=null;
    for(let i=textRects.length-1;i>=0;i--){
      const r=textRects[i];
      if(p.x>=r.x-8&&p.x<=r.x+r.w+8&&p.y>=r.y-8&&p.y<=r.y+r.h+8){hit=r;break;}
    }
    if(!hit) return;
    if(hit.index!==active) selectLayer(hit.index);
    dragging=true;canvas.setPointerCapture(e.pointerId);canvas.style.cursor="grabbing";e.preventDefault();
  });

  canvas.addEventListener("pointermove",e=>{
    if(!dragging) return;
    const p=point(e);
    layers[active].x_percent=Math.round(Math.max(0,Math.min(100,(p.x-imageRect.x)/imageRect.w*100))*10)/10;
    layers[active].y_percent=Math.round(Math.max(0,Math.min(100,(p.y-imageRect.y)/imageRect.h*100))*10)/10;
    commitLayers();draw();
  });

  const stop=e=>{if(dragging){dragging=false;canvas.style.cursor="grab";try{canvas.releasePointerCapture(e.pointerId)}catch{}}};
  canvas.addEventListener("pointerup",stop);
  canvas.addEventListener("pointercancel",stop);

  node._gifMultiDesignerSetBackground=(entry)=>{
    const img=new Image();
    img.onload=()=>{bg=img;resizeCanvasForImage();draw();fitNodeToContent(node,root);};
    img.onerror=()=>{bg=null;draw();};
    img.src=viewUrl(entry);
  };

  globalCb.checked=!!widget(node,"enabled")?.value;
  refreshEditor();updateGlobalUI();draw();

  if(typeof ResizeObserver!=="undefined"){
    const ro=new ResizeObserver(()=>fitNodeToContent(node,root));
    ro.observe(root);node._gifMultiDesignerResizeObserver=ro;
  }
  fitNodeToContent(node,root);
  return root;
}

app.registerExtension({
  name:"giftoolkit.multiTextDesigner",
  async beforeRegisterNodeDef(nodeType,nodeData){
    if(nodeData.name!=="GIFToolkitMultiTextDesigner") return;
    const original=nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated=function(){
      const r=original?.apply(this,arguments);
      for(const name of ["enabled","layers_json","active_layer","font_catalog_json","preview_frame"]) hideWidget(widget(this,name));
      const ui=multiDesignerUI(this);
      this.addDOMWidget("multi_designer","gif_multi_text_designer",ui,{serialize:false,hideOnZoom:false});
      this.setSize([600,820]);
      fitNodeToContent(this,ui);
      return r;
    };
    const oldExec=nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted=function(message){
      oldExec?.apply(this,arguments);
      const entry=message?.gif_toolkit_multi_designer?.[0];
      if(entry) this._gifMultiDesignerSetBackground?.(entry);
    };
  }
});
