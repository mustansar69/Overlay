(function(){
  const KEY = "overlay-live";
  const CH  = ("BroadcastChannel" in window) ? new BroadcastChannel("overlay-sync") : null;

  let root, surface, textEl;
  let last = null;

  function getVideoRect(){
    const cand =
      document.querySelector("video") ||
      document.querySelector("#screen video") ||
      document.querySelector("#screen canvas") ||
      document.querySelector("canvas");
    if (cand) return cand.getBoundingClientRect();

    const vw = window.innerWidth, vh = window.innerHeight;
    let w = vw, h = w * 9/16;
    if (h > vh) { h = vh; w = h * 16/9; }
    return { left:(vw-w)/2, top:(vh-h)/2, width:w, height:h, right:(vw+w)/2, bottom:(vh+h)/2 };
  }

  function placeSurface(){
    const r = getVideoRect();
    Object.assign(surface.style, {
      left:  r.left + "px",
      top:   r.top  + "px",
      width: r.width + "px",
      height: r.height + "px"
    });
  }

  function hexToRgb(hex){
    let h = (hex||"").replace("#","");
    if (h.length===3) h = h.split("").map(c=>c+c).join("");
    const r = parseInt(h.slice(0,2)||"00",16),
          g = parseInt(h.slice(2,4)||"00",16),
          b = parseInt(h.slice(4,6)||"00",16);
    return {r,g,b};
  }

  function apply(s){
    if (!s || typeof s !== "object") return;
    last = s;

    placeSurface();
    const rect = surface.getBoundingClientRect();

    textEl.textContent      = (s.text || "");
    textEl.style.opacity    = String(s.opacity ?? 1);
    textEl.style.color      = s.color || "#fff";
    textEl.style.fontWeight = String(s.weight || 700);
    textEl.style.width      = (s.widthPct || 60) + "%";

    const {r,g,b} = hexToRgb(s.highlightColor || "#000000");
    const a = +s.highlightAlpha || 0;
    textEl.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;

    const shadowOn = !!s.shadow && a <= 0.001;
    textEl.style.textShadow = shadowOn ? "2px 2px 4px rgba(0,0,0,.7)" : "none";

    const px = ((+s.fontPercent || 4) / 100) * rect.width;
    textEl.style.fontSize = Math.max(8, px) + "px";

    const x = Math.max(0, Math.min(100, +s.x || 0));
    const y = Math.max(0, Math.min(100, +s.y || 0));
    textEl.style.left = x + "%";
    textEl.style.top  = y + "%";
    textEl.style.transform = "translate(-50%, -50%)";

    textEl.style.display = (s.visible && (s.text||"").trim()) ? "block" : "none";
  }

  function readLocal(){
    try { return JSON.parse(localStorage.getItem(KEY)); } catch(e){ return null; }
  }

  function init(){
    if (document.getElementById("overlay-root")) return;

    root = document.createElement("div");
    root.id = "overlay-root";
    Object.assign(root.style, {
      position: "fixed",
      left: "0", top: "0", width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: "2147483647"
    });
    document.body.appendChild(root);

    surface = document.createElement("div");
    surface.id = "overlay-surface";
    Object.assign(surface.style, {
      position: "absolute",
      left: "0px", top: "0px", width: "0px", height: "0px",
      pointerEvents: "none"
    });
    root.appendChild(surface);

    textEl = document.createElement("div");
    textEl.id = "overlay-text";
    Object.assign(textEl.style, {
      position: "absolute",
      left: "50%", top: "50%", transform: "translate(-50%, -50%)",
      whiteSpace: "pre-wrap", textAlign: "center",
      fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Inter,Arial,sans-serif",
      fontWeight: "700",
      padding: "6px 10px",
      borderRadius: "8px",
      pointerEvents: "none"
    });
    surface.appendChild(textEl);

    apply(readLocal());

    window.addEventListener("message", (ev)=> apply(ev.data));
    if (CH) CH.onmessage = (ev)=> apply(ev.data);
    window.addEventListener("storage", (e)=>{ if (e.key === KEY) { try{ apply(JSON.parse(e.newValue)); }catch(_){} }});
    window.addEventListener("resize", ()=>{ if (last) apply(last); });

    const mo = new MutationObserver(()=> { if (last) apply(last); });
    mo.observe(document.documentElement, { childList:true, subtree:true, attributes:true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
