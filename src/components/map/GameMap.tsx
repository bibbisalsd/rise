"use client";

import { useEffect, useRef, useCallback } from "react";
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

// ── Biome colours (shown when tile has no owner) ──────────────────────────────
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

// ── Resource icons (emoji fallback for canvas) ────────────────────────────────
const RESOURCE_ICONS: Record<string, string> = {
  oil:       "⛽", iron:     "⚙", uranium:   "☢",
  copper:    "🔶", gold:     "✦", aluminum:  "⬡",
  titanium:  "◈",  tungsten: "◆", chromium:  "◉",
  diamond:   "♦",  phosphate:"⬩",
};

function getAdm1Code(p: Record<string, unknown>): string {
  const v = String(p.adm1_code ?? p.ADM1_CODE ?? "").trim();
  return v || "UNK";
}

function getName(p: Record<string, unknown>): string {
  return String(p.name ?? p.NAME ?? p.admin ?? "Unknown");
}

function getCountryName(p: Record<string, unknown>): string {
  return String(p.admin ?? p.ADMIN ?? p.name ?? "Unknown");
}

function getAdm0(p: Record<string, unknown>): string {
  return String(p.adm0_a3 ?? p.ADM0_A3 ?? "").trim();
}

/** Reverse coordinate rings so d3-geo interprets them correctly.
 *  RFC 7946 = CCW outer / CW holes → d3-geo = CW outer / CCW holes */
function rewindForD3(geojson: GeoJSON): GeoJSON {
  return {
    ...geojson,
    features: geojson.features.map((f) => {
      const g = f.geometry as any;
      if (g.type === "Polygon") {
        return { ...f, geometry: { ...g, coordinates: g.coordinates.map((r: number[][]) => r.slice().reverse()) } };
      }
      if (g.type === "MultiPolygon") {
        return { ...f, geometry: { ...g, coordinates: g.coordinates.map((poly: number[][][]) => poly.map((r: number[][]) => r.slice().reverse())) } };
      }
      return f;
    }),
  };
}

function toRgba(color: string, alpha: number): string {
  if (color.startsWith("hsl")) return color.replace("hsl(", "hsla(").replace(")", `,${alpha})`);
  const c = color.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fallbackColor(code: string): string {
  let hash = 5381;
  for (let i = 0; i < code.length; i++) hash = ((hash << 5) + hash) ^ code.charCodeAt(i);
  hash = hash >>> 0;
  return `hsl(${hash % 360},30%,30%)`;
}

export default function GameMap() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const geoRef     = useRef<GeoJSON | null>(null);
  const biomesRef  = useRef<Record<string, string>>({});
  const resourcesRef = useRef<Record<string, [string, number][]>>({});
  const rafRef     = useRef<number>(0);
  const spinRef    = useRef(true);
  const rotateRef  = useRef<[number, number, number]>([0, -25, 0]);
  const scaleRef   = useRef(260);
  const dragRef    = useRef({ active: false, startX: 0, startY: 0, startRot: [0, -25, 0] as [number, number, number], moved: false });
  const tooltipRef = useRef<{ name: string; regionName: string; owner: string; resources: string[]; x: number; y: number } | null>(null);

  const { nations, provinces, units, myNation, selectedProvinceId, setSelectedProvinceId, setActivePanel } = useGameStore();

  const getTileColor = useCallback((adm1Code: string, biome: string): string => {
    const province = Object.values(provinces).find(p => p.province_key === adm1Code);
    const owner    = province?.owner_nation_id ? nations[province.owner_nation_id] : null;
    if (owner?.color) return owner.color;
    // No owner: biome color
    const biomeKey = biome || (biomesRef.current[adm1Code] ?? "plains");
    return BIOME_COLORS[biomeKey] ?? BIOME_COLORS.plains;
  }, [provinces, nations]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const scale = scaleRef.current;

    const proj = geoOrthographic()
      .scale(scale)
      .translate([cx, cy])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const path      = geoPath(proj, ctx);
    const graticule = geoGraticule()();
    const sphere: GeoPermissibleObjects = { type: "Sphere" };

    ctx.clearRect(0, 0, W, H);

    // Space + stars
    ctx.fillStyle = "#03060f";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.1})`;
      ctx.beginPath();
      ctx.arc((i * 7919 + 11) % W, (i * 6271 + 17) % H, i % 4 === 0 ? 1.0 : 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ocean
    ctx.beginPath();
    path(sphere);
    const ocean = ctx.createRadialGradient(cx - scale * 0.2, cy - scale * 0.25, 0, cx, cy, scale);
    ocean.addColorStop(0, "#1e5fa0");
    ocean.addColorStop(0.5, "#0e3d70");
    ocean.addColorStop(1, "#071e3d");
    ctx.fillStyle = ocean;
    ctx.fill();

    // Graticule
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(150,190,230,0.06)";
    ctx.lineWidth   = 0.4;
    ctx.stroke();

    // ── Tiles ────────────────────────────────────────────────────────────────
    if (geo) {
      for (const feature of geo.features) {
        const code       = getAdm1Code(feature.properties);
        const biome      = biomesRef.current[code] ?? "plains";
        const province   = Object.values(provinces).find(p => p.province_key === code);
        const isSelected = province?.id === selectedProvinceId;
        const isMine     = province?.owner_nation_id === myNation?.id;
        const owner      = province?.owner_nation_id ? nations[province.owner_nation_id] : null;

        // Fill
        let fillColor: string;
        if (owner?.color) {
          fillColor = toRgba(owner.color, isSelected ? 1.0 : isMine ? 0.95 : 0.88);
        } else {
          const bc = BIOME_COLORS[biome] ?? BIOME_COLORS.plains;
          fillColor = toRgba(bc, isSelected ? 0.9 : 0.75);
        }

        ctx.beginPath();
        path(feature as GeoPermissibleObjects);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Border
        ctx.shadowBlur = 0;
        if (isSelected) {
          ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 10;
          ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1.8;
        } else if (isMine) {
          ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = scale > 400 ? 0.8 : 0.5;
        } else {
          ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = scale > 400 ? 0.5 : 0.3;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Tile labels at high zoom ────────────────────────────────────────────
      if (scale > 800) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const feature of geo.features) {
          const c = path.centroid(feature as GeoPermissibleObjects);
          if (!c || isNaN(c[0])) continue;
          const name = getName(feature.properties);
          ctx.fillText(name.slice(0, 12), c[0], c[1]);
        }
      }

      // ── Resource icons at zoom > 600 ────────────────────────────────────────
      if (scale > 600) {
        ctx.font = "10px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const feature of geo.features) {
          const code = getAdm1Code(feature.properties);
          const deps = resourcesRef.current[code];
          if (!deps || deps.length === 0) continue;
          const c = path.centroid(feature as GeoPermissibleObjects);
          if (!c || isNaN(c[0])) continue;
          const icon = RESOURCE_ICONS[deps[0][0]] ?? "?";
          ctx.fillText(icon, c[0], c[1]);
        }
      }
    }

    // Atmosphere
    ctx.save();
    const atmo = ctx.createRadialGradient(cx, cy, scale * 0.9, cx, cy, scale * 1.15);
    atmo.addColorStop(0,   "rgba(60,130,255,0.0)");
    atmo.addColorStop(0.4, "rgba(60,130,255,0.18)");
    atmo.addColorStop(1,   "rgba(60,130,255,0.0)");
    ctx.beginPath();
    ctx.arc(cx, cy, scale * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = atmo;
    ctx.fill();
    ctx.restore();

    // Rim
    ctx.beginPath(); path(sphere);
    ctx.strokeStyle = "rgba(100,170,255,0.22)"; ctx.lineWidth = 1; ctx.stroke();

    // ── Unit markers ─────────────────────────────────────────────────────────
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
        for (const u of pu) byN[u.nation_id] = (byN[u.nation_id] || 0) + 1;
        let idx = 0;
        for (const [nid, cnt] of Object.entries(byN)) {
          const col = nations[nid]?.color ?? "#888";
          const dy  = c[1] + idx * 18;
          ctx.beginPath(); ctx.arc(c[0], dy, 7, 0, Math.PI * 2);
          ctx.fillStyle = col; ctx.fill();
          ctx.strokeStyle = nid !== myNation?.id ? "#ff4444" : "#fff";
          ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = "#fff"; ctx.font = "bold 7px monospace";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(cnt), c[0], dy);
          idx++;
        }
      }
    }

    // ── Tooltip ───────────────────────────────────────────────────────────────
    const tt = tooltipRef.current;
    if (tt) {
      const lines  = [
        tt.owner || tt.name,
        tt.regionName && tt.regionName !== tt.name ? tt.regionName : null,
        tt.resources.length ? `Resources: ${tt.resources.join(", ")}` : null,
      ].filter(Boolean) as string[];
      const pad    = 8, w = 200, lineH = 16, h = pad * 2 + lines.length * lineH;
      const tx     = Math.min(tt.x + 14, W - w - 4);
      const ty     = Math.min(tt.y + 14, H - h - 4);
      ctx.fillStyle   = "rgba(6,10,22,0.94)";
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.roundRect(tx, ty, w, h, 5);
      ctx.fill(); ctx.stroke();
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? "#f9fafb" : "#9ca3af";
        ctx.font      = i === 0 ? "11px monospace" : "10px monospace";
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(line, tx + pad, ty + pad + i * lineH);
      });
    }

    // Coords
    const rot = rotateRef.current;
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "10px monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText(`${(-rot[1]).toFixed(1)}°N  ${(-rot[0]).toFixed(1)}°E`, W - 10, H - 10);

    // Zoom indicator
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "9px monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    const zoomLabel = scale < 200 ? "Global" : scale < 500 ? "Regional" : scale < 1000 ? "Country" : "Province";
    ctx.fillText(`Zoom: ${zoomLabel}`, 10, H - 10);

  }, [nations, provinces, units, myNation, selectedProvinceId, getTileColor]);

  // ── Hit test ──────────────────────────────────────────────────────────────
  const hitTest = useCallback((mx: number, my: number) => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas || !geo) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const proj = geoOrthographic()
      .scale(scaleRef.current)
      .translate([canvas.width / 2, canvas.height / 2])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const p = geoPath(proj, ctx);
    for (let i = geo.features.length - 1; i >= 0; i--) {
      const feature = geo.features[i];
      ctx.beginPath();
      p(feature as GeoPermissibleObjects);
      if (ctx.isPointInPath(mx, my)) {
        const code       = getAdm1Code(feature.properties);
        const country    = getCountryName(feature.properties);
        const regionName = getName(feature.properties);
        const province   = Object.values(provinces).find(pr => pr.province_key === code);
        const owner      = province?.owner_nation_id ? (nations[province.owner_nation_id]?.name ?? "") : "";
        const deps       = resourcesRef.current[code] ?? [];
        const resources  = deps.map(([r]) => r);
        return { name: country, regionName, province, owner, resources };
      }
    }
    return null;
  }, [provinces, nations]);

  // ── Setup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animating = true;

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

    const onDown = (e: MouseEvent) => {
      spinRef.current = false;
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startRot: [...rotateRef.current] as [number, number, number], moved: false };
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragRef.current.active) {
        const dx = (e.clientX - dragRef.current.startX) * ROTATE_SPEED;
        const dy = (e.clientY - dragRef.current.startY) * ROTATE_SPEED;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
        rotateRef.current = [dragRef.current.startRot[0] + dx, Math.max(-85, Math.min(85, dragRef.current.startRot[1] - dy)), 0];
        tooltipRef.current = null;
        draw();
      } else {
        const hit = hitTest(mx, my);
        tooltipRef.current = hit ? { name: hit.name, regionName: hit.regionName, owner: hit.owner, resources: hit.resources, x: mx, y: my } : null;
        canvas.style.cursor = hit ? "pointer" : "grab";
        draw();
      }
    };
    const onUp = (e: MouseEvent) => {
      const { moved } = dragRef.current;
      dragRef.current.active = false;
      if (!moved) {
        const rect = canvas.getBoundingClientRect();
        const hit  = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit?.province) { setSelectedProvinceId(hit.province.id); setActivePanel("country"); }
        else setSelectedProvinceId(null);
        draw();
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spinRef.current = false;
      scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * (e.deltaY < 0 ? 1.1 : 0.9)));
      draw();
    };

    canvas.addEventListener("mousedown",  onDown);
    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseup",    onUp);
    canvas.addEventListener("wheel",      onWheel, { passive: false });
    canvas.addEventListener("mouseleave", () => { tooltipRef.current = null; draw(); });
    canvas.addEventListener("dblclick",   () => { spinRef.current = true; });

    // Load all data files
    Promise.all([
      fetch("/maps/world-adm1.geojson").then(r => r.ok ? r.json() : null),
      fetch("/data/biomes.json").then(r => r.ok ? r.json() : {}),
      fetch("/data/resource_deposits.json").then(r => r.ok ? r.json() : {}),
    ]).then(([geo, biomes, resources]) => {
      if (geo) geoRef.current = geo;
      if (biomes) biomesRef.current = biomes;
      if (resources) resourcesRef.current = resources;
      draw();
    }).catch(() => draw());

    return () => {
      animating = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown",  onDown);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseup",    onUp);
      canvas.removeEventListener("wheel",      onWheel);
    };
  }, [draw, hitTest, setSelectedProvinceId, setActivePanel]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
