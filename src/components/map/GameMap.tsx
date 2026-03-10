"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  GeoPermissibleObjects,
} from "d3-geo";

interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoPermissibleObjects;
}
interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

const MIN_SCALE    = 80;
const MAX_SCALE    = 3000;
const ROTATE_SPEED = 0.4;
const SPIN_SPEED   = 0.025;

const BIOME_COLORS: Record<string, string> = {
  plains:      "#7a9e5a",
  grassland:   "#8ab56a",
  savanna:     "#b8a84a",
  shrubland:   "#9a9a5a",
  forest:      "#3a6e3a",
  rainforest:  "#1e5a1e",
  taiga:       "#4a7a5a",
  tundra:      "#7a9090",
  hot_desert:  "#c8a040",
  cold_desert: "#a89878",
  desert:      "#b89850",
  mountain:    "#807060",
  highland:    "#908070",
  hills:       "#8a9a70",
  marsh:       "#5a8060",
  wetland:     "#4a7050",
  mangrove:    "#3a6040",
  urban:       "#6a6a7a",
  farmland:    "#a0b060",
  coastal:     "#4a8ab0",
  island:      "#5a9aba",
  arctic:      "#c0dce8",
  ice_sheet:   "#d8eef8",
  ocean:       "#0e3d70",
  sea:         "#1a4d80",
};

const RESOURCE_ICONS: Record<string, string> = {
  oil:       "⛽", iron:      "⚙",  uranium:  "☢",
  copper:    "🔶", gold:      "✦",  aluminum: "⬡",
  titanium:  "◈",  tungsten:  "◆",  chromium: "◉",
  diamond:   "♦",  phosphate: "⬩",
};

function getAdm1Code(p: Record<string, unknown>): string {
  return String(p.adm1_code ?? p.ADM1_CODE ?? "").trim() || "UNK";
}

/** Fix GeoJSON winding for canvas: exterior rings must be CCW for nonzero fill rule */
function fixWinding(geojson: GeoJSON): GeoJSON {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      const g = f.geometry as any;
      const fixPoly = (rings: number[][][]) =>
        rings.map((ring, i) => {
          // Calculate signed area
          let area = 0;
          for (let j = 0; j < ring.length - 1; j++) {
            area += ring[j][0] * ring[j+1][1] - ring[j+1][0] * ring[j][1];
          }
          const isCCW = area > 0;
          // Exterior ring (i===0) must be CCW; holes (i>0) must be CW
          const shouldBeCCW = i === 0;
          return (isCCW !== shouldBeCCW) ? [...ring].reverse() : ring;
        });
      if (g.type === "Polygon")
        return { ...f, geometry: { ...g, coordinates: fixPoly(g.coordinates) } };
      if (g.type === "MultiPolygon")
        return { ...f, geometry: { ...g, coordinates: g.coordinates.map(fixPoly) } };
      return f;
    }),
  };
}

function getName(p: Record<string, unknown>): string {
  return String(p.name ?? p.NAME ?? p.admin ?? "Unknown");
}
function toRgba(color: string, alpha: number): string {
  if (color.startsWith("hsl")) return color.replace("hsl(", "hsla(").replace(")", `,${alpha})`);
  const c = color.replace("#", "");
  return `rgba(${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)},${alpha})`;
}

export default function GameMap() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const geoRef       = useRef<GeoJSON | null>(null);
  const biomesRef    = useRef<Record<string, string>>({});
  const resourcesRef = useRef<Record<string, [string, number][]>>({});
  const rafRef       = useRef<number>(0);
  const spinRef      = useRef(true);
  const rotateRef    = useRef<[number, number, number]>([0, -25, 0]);
  const scaleRef     = useRef(260);
  const dragRef      = useRef({ active: false, startX: 0, startY: 0, startRot: [0,-25,0] as [number,number,number], moved: false });
  const tooltipRef   = useRef<{ name: string; owner: string; resources: string[]; x: number; y: number } | null>(null);

  // Keep a ref to current store state so draw() never goes stale
  const storeRef = useRef(useGameStore.getState());
  useEffect(() => useGameStore.subscribe(s => { storeRef.current = s; }), []);

  // draw lives in a ref — updated every render but never causes re-mounts
  const drawRef = useRef<() => void>(() => {});
  useEffect(() => {
    drawRef.current = function draw() {
      const canvas = canvasRef.current;
      const geo    = geoRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { nations, provinces, units, myNation, selectedProvinceId } = storeRef.current;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const scale = scaleRef.current;

      const proj = geoOrthographic()
        .scale(scale).translate([cx, cy])
        .rotate(rotateRef.current).clipAngle(90);
      const path      = geoPath(proj, ctx);
      const graticule = geoGraticule()();
      const sphere: GeoPermissibleObjects = { type: "Sphere" };

      ctx.clearRect(0, 0, W, H);

      // ── Space background ──────────────────────────────────────────────
      ctx.fillStyle = "#03060f";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.1})`;
        ctx.beginPath();
        ctx.arc((i*7919+11)%W, (i*6271+17)%H, i%4===0 ? 1.0 : 0.5, 0, Math.PI*2);
        ctx.fill();
      }

      // ── Globe clip: everything below is clipped to the sphere circle ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.clip();

      // Ocean fill
      const ocean = ctx.createRadialGradient(cx-scale*0.2, cy-scale*0.25, 0, cx, cy, scale);
      ocean.addColorStop(0, "#1e5fa0"); ocean.addColorStop(0.5, "#0e3d70"); ocean.addColorStop(1, "#071e3d");
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - scale, cy - scale, scale * 2, scale * 2);

      // Graticule
      ctx.beginPath(); path(graticule);
      ctx.strokeStyle = "rgba(150,190,230,0.06)"; ctx.lineWidth = 0.4; ctx.stroke();

      // ── Province tiles ────────────────────────────────────────────────
      if (geo) {
        for (const feature of geo.features) {
          const code       = getAdm1Code(feature.properties);
          const biome      = biomesRef.current[code] ?? "plains";
          const province   = Object.values(provinces).find(p => p.province_key === code);
          const isSelected = province?.id === selectedProvinceId;
          const isMine     = province?.owner_nation_id === myNation?.id;
          const owner      = province?.owner_nation_id ? nations[province.owner_nation_id] : null;

          const fillColor = owner?.color
            ? toRgba(owner.color, isSelected ? 1.0 : isMine ? 0.95 : 0.88)
            : toRgba(BIOME_COLORS[biome] ?? BIOME_COLORS.plains, isSelected ? 0.9 : 0.75);

          ctx.beginPath();
          path(feature as GeoPermissibleObjects);
          ctx.fillStyle = fillColor;
          ctx.fill();

          ctx.shadowBlur = 0;
          if (isSelected) {
            ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 10;
            ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1.8;
          } else if (isMine) {
            ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = scale > 400 ? 0.8 : 0.5;
          } else {
            ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = scale > 400 ? 0.5 : 0.3;
          }
          ctx.stroke(); ctx.shadowBlur = 0;
        }

        if (scale > 800) {
          ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "8px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          for (const feature of geo.features) {
            const c = path.centroid(feature as GeoPermissibleObjects);
            if (!c || isNaN(c[0])) continue;
            ctx.fillText(getName(feature.properties).slice(0,12), c[0], c[1]);
          }
        }

        if (scale > 600) {
          ctx.font = "10px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          for (const feature of geo.features) {
            const code = getAdm1Code(feature.properties);
            const deps = resourcesRef.current[code];
            if (!deps?.length) continue;
            const c = path.centroid(feature as GeoPermissibleObjects);
            if (!c || isNaN(c[0])) continue;
            ctx.fillText(RESOURCE_ICONS[deps[0][0]] ?? "?", c[0], c[1]);
          }
        }
      }

      // ── End globe clip ────────────────────────────────────────────────
      ctx.restore();

      // Atmosphere glow
      ctx.save();
      const atmo = ctx.createRadialGradient(cx, cy, scale*0.9, cx, cy, scale*1.15);
      atmo.addColorStop(0, "rgba(60,130,255,0.0)"); atmo.addColorStop(0.4, "rgba(60,130,255,0.18)"); atmo.addColorStop(1, "rgba(60,130,255,0.0)");
      ctx.beginPath(); ctx.arc(cx, cy, scale*1.15, 0, Math.PI*2); ctx.fillStyle = atmo; ctx.fill();
      ctx.restore();

      // Rim
      ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI*2); ctx.strokeStyle = "rgba(100,170,255,0.22)"; ctx.lineWidth = 1; ctx.stroke();

      // Units
      if (geo) {
        const byProv: Record<string, { nation_id: string }[]> = {};
        for (const u of Object.values(units)) {
          if (!byProv[u.province_id]) byProv[u.province_id] = [];
          byProv[u.province_id].push(u);
        }
        for (const [pid, pu] of Object.entries(byProv)) {
          const prov = provinces[pid]; if (!prov) continue;
          const feat = geo.features.find(f => getAdm1Code(f.properties) === prov.province_key);
          if (!feat) continue;
          const c = path.centroid(feat as GeoPermissibleObjects);
          if (!c || isNaN(c[0])) continue;
          const byN: Record<string, number> = {};
          for (const u of pu) byN[u.nation_id] = (byN[u.nation_id]||0) + 1;
          let idx = 0;
          for (const [nid, cnt] of Object.entries(byN)) {
            const col = nations[nid]?.color ?? "#888";
            const dy  = c[1] + idx*18;
            ctx.beginPath(); ctx.arc(c[0], dy, 7, 0, Math.PI*2);
            ctx.fillStyle = col; ctx.fill();
            ctx.strokeStyle = nid !== myNation?.id ? "#ff4444" : "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = "#fff"; ctx.font = "bold 7px monospace";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(String(cnt), c[0], dy);
            idx++;
          }
        }
      }

      // Tooltip
      const tt = tooltipRef.current;
      if (tt) {
        const lines = [tt.owner || tt.name, tt.owner ? tt.name : null, tt.resources.length ? `Resources: ${tt.resources.join(", ")}` : null].filter(Boolean) as string[];
        const pad = 8, w = 200, lineH = 16, h = pad*2 + lines.length*lineH;
        const tx = Math.min(tt.x+14, W-w-4), ty = Math.min(tt.y+14, H-h-4);
        ctx.fillStyle = "rgba(6,10,22,0.94)"; ctx.strokeStyle = "rgba(255,255,255,0.13)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(tx, ty, w, h, 5); ctx.fill(); ctx.stroke();
        lines.forEach((line, i) => {
          ctx.fillStyle = i===0 ? "#f9fafb" : "#9ca3af";
          ctx.font = i===0 ? "11px monospace" : "10px monospace";
          ctx.textAlign = "left"; ctx.textBaseline = "top";
          ctx.fillText(line, tx+pad, ty+pad+i*lineH);
        });
      }

      // HUD
      const rot = rotateRef.current;
      ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "10px monospace"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText(`${(-rot[1]).toFixed(1)}°N  ${(-rot[0]).toFixed(1)}°E`, W-10, H-10);
      ctx.textAlign = "left";
      ctx.fillText(`Zoom: ${scale<200?"Global":scale<500?"Regional":scale<1000?"Country":"Province"}`, 10, H-10);
    };
  });

  // Hit test throttle
  const hitThrottleRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const lastMouseRef   = useRef<{x:number;y:number}|null>(null);

  // One-time setup — empty deps, never re-runs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animating = true;
    const draw = () => drawRef.current();

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      scaleRef.current = Math.min(canvas.width, canvas.height) * 0.4;
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();

    const tick = () => {
      if (!animating) return;
      if (spinRef.current) { rotateRef.current[0] += SPIN_SPEED; draw(); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const hitTest = (mx: number, my: number) => {
      const geo = geoRef.current; if (!canvas || !geo) return null;
      const ctx = canvas.getContext("2d"); if (!ctx) return null;
      const proj = geoOrthographic().scale(scaleRef.current).translate([canvas.width/2, canvas.height/2]).rotate(rotateRef.current).clipAngle(90);
      const p = geoPath(proj, ctx);
      const { provinces, nations } = storeRef.current;
      for (let i = geo.features.length-1; i >= 0; i--) {
        const feature = geo.features[i];
        ctx.beginPath(); p(feature as GeoPermissibleObjects);
        if (ctx.isPointInPath(mx, my)) {
          const code     = getAdm1Code(feature.properties);
          const province = Object.values(provinces).find(pr => pr.province_key === code);
          const owner    = province?.owner_nation_id ? (nations[province.owner_nation_id]?.name ?? "") : "";
          const deps     = resourcesRef.current[code] ?? [];
          return { name: getName(feature.properties), province, owner, resources: deps.map(([r]) => r) };
        }
      }
      return null;
    };

    const onDown = (e: MouseEvent) => {
      spinRef.current = false;
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startRot: [...rotateRef.current] as [number,number,number], moved: false };
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragRef.current.active) {
        const dx = (e.clientX - dragRef.current.startX) * ROTATE_SPEED;
        const dy = (e.clientY - dragRef.current.startY) * ROTATE_SPEED;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
        rotateRef.current = [dragRef.current.startRot[0]+dx, Math.max(-85, Math.min(85, dragRef.current.startRot[1]-dy)), 0];
        tooltipRef.current = null; draw(); return;
      }
      // Throttled hit test — max 20/sec
      lastMouseRef.current = { x: mx, y: my };
      if (hitThrottleRef.current) return;
      hitThrottleRef.current = setTimeout(() => {
        hitThrottleRef.current = null;
        const pos = lastMouseRef.current; if (!pos) return;
        const hit = hitTest(pos.x, pos.y);
        tooltipRef.current = hit ? { name: hit.name, owner: hit.owner, resources: hit.resources, x: pos.x, y: pos.y } : null;
        canvas.style.cursor = hit ? "pointer" : "grab";
        draw();
      }, 50);
    };

    const onUp = (e: MouseEvent) => {
      const { moved } = dragRef.current; dragRef.current.active = false;
      if (!moved) {
        const rect = canvas.getBoundingClientRect();
        const hit  = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        const { setSelectedProvinceId, setActivePanel } = storeRef.current;
        if (hit?.province) { setSelectedProvinceId(hit.province.id); setActivePanel("country"); }
        else setSelectedProvinceId(null);
        draw();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); spinRef.current = false;
      scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * (e.deltaY < 0 ? 1.1 : 0.9)));
      draw();
    };

    canvas.addEventListener("mousedown",  onDown);
    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseup",    onUp);
    canvas.addEventListener("wheel",      onWheel, { passive: false });
    canvas.addEventListener("mouseleave", () => { tooltipRef.current = null; draw(); });
    canvas.addEventListener("dblclick",   () => { spinRef.current = true; });

    // Load data
    const bust = `?v=${Date.now()}`;
    Promise.all([
      fetch(`/maps/world-adm1.geojson${bust}`, { cache: "no-store" }).then(r => r.json()),
      fetch(`/data/biomes.json${bust}`, { cache: "no-store" }).then(r => r.json()),
      fetch(`/data/resource_deposits.json${bust}`, { cache: "no-store" }).then(r => r.json()),
    ]).then(([geo, biomes, resources]) => {
      geoRef.current       = fixWinding(geo);
      biomesRef.current    = biomes;
      resourcesRef.current = resources;
      draw();
    }).catch((e) => { console.error("Map data load failed:", e); draw(); });

    // Redraw on game state changes (e.g. nation captures a province)
    const unsubStore = useGameStore.subscribe(() => { if (!spinRef.current) draw(); });

    return () => {
      animating = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      unsubStore();
      canvas.removeEventListener("mousedown",  onDown);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseup",    onUp);
      canvas.removeEventListener("wheel",      onWheel);
      if (hitThrottleRef.current) clearTimeout(hitThrottleRef.current);
    };
  }, []); // ← empty: runs once, never re-mounts

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
