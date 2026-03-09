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
const MAX_SCALE    = 2000;
const ROTATE_SPEED = 0.4;
const SPIN_SPEED   = 0.025;

// ADM0_A3 is always populated in Natural Earth; ISO_A3 often has -99 placeholders
function getTag(p: Record<string, unknown>): string {
  const candidates = [
    p.ADM0_A3, p.adm0_a3,
    p.ISO_A3,  p.iso_a3,
    p.ISO_A3_EH, p.iso_a3_eh,
  ];
  for (const v of candidates) {
    const s = String(v ?? "").toUpperCase().trim();
    if (s && s !== "-99" && s !== "N/A" && s.length >= 2) return s;
  }
  // Last resort: hash the country name
  return String(p.NAME ?? p.name ?? p.ADMIN ?? p.admin ?? "UNK").toUpperCase().slice(0, 3);
}

function getName(p: Record<string, unknown>): string {
  return String(p.NAME ?? p.name ?? p.ADMIN ?? p.admin ?? p.NAME_LONG ?? "Unknown");
}

function tagToColor(tag: string): string {
  let hash = 5381;
  for (let i = 0; i < tag.length; i++) hash = ((hash << 5) + hash) ^ tag.charCodeAt(i);
  hash = hash >>> 0;
  const h = hash % 360;
  const s = 25 + (hash >> 4) % 20;   // 25–45%
  const l = 22 + (hash >> 8) % 18;   // 22–40%
  return `hsl(${h},${s}%,${l}%)`;
}

function toRgba(color: string, alpha: number): string {
  if (color.startsWith("hsl")) {
    return color.replace("hsl(", "hsla(").replace(")", `,${alpha})`);
  }
  const c = color.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function GameMap() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const geoRef     = useRef<GeoJSON | null>(null);
  const rafRef     = useRef<number>(0);
  const spinRef    = useRef(true);
  const rotateRef  = useRef<[number, number, number]>([0, -25, 0]);
  const scaleRef   = useRef(260);
  const dragRef    = useRef({
    active: false, startX: 0, startY: 0,
    startRot: [0, -25, 0] as [number, number, number],
    moved: false,
  });
  const tooltipRef = useRef<{ name: string; owner: string; x: number; y: number } | null>(null);

  const {
    nations, provinces, units, myNation,
    selectedProvinceId, setSelectedProvinceId, setActivePanel,
  } = useGameStore();

  const getColor = useCallback((tag: string): string => {
    const province = Object.values(provinces).find(p => p.province_key === tag);
    const owner    = province?.owner_nation_id ? nations[province.owner_nation_id] : null;
    return owner?.color ?? tagToColor(tag);
  }, [provinces, nations]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const proj = geoOrthographic()
      .scale(scaleRef.current)
      .translate([cx, cy])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const path      = geoPath(proj, ctx);
    const graticule = geoGraticule()();
    const sphere: GeoPermissibleObjects = { type: "Sphere" };

    ctx.clearRect(0, 0, W, H);

    // Space
    ctx.fillStyle = "#03060f";
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + (i % 5) * 0.1})`;
      ctx.beginPath();
      ctx.arc((i * 7919 + 11) % W, (i * 6271 + 17) % H, i % 4 === 0 ? 1.0 : 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ocean
    ctx.beginPath();
    path(sphere);
    const ocean = ctx.createRadialGradient(cx - scaleRef.current * 0.2, cy - scaleRef.current * 0.25, 0, cx, cy, scaleRef.current);
    ocean.addColorStop(0,   "#1e5fa0");
    ocean.addColorStop(0.5, "#0e3d70");
    ocean.addColorStop(1,   "#071e3d");
    ctx.fillStyle = ocean;
    ctx.fill();

    // Graticule
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(150,190,230,0.06)";
    ctx.lineWidth   = 0.4;
    ctx.stroke();

    // Countries
    if (geo) {
      for (const feature of geo.features) {
        const tag        = getTag(feature.properties);
        const province   = Object.values(provinces).find(p => p.province_key === tag);
        const isSelected = province?.id === selectedProvinceId;
        const isMine     = province?.owner_nation_id === myNation?.id;
        const color      = getColor(tag);

        ctx.beginPath();
        path(feature as GeoPermissibleObjects);
        ctx.fillStyle = toRgba(color, isSelected ? 1.0 : isMine ? 0.95 : 0.88);
        ctx.fill();

        ctx.shadowBlur = 0;
        if (isSelected) {
          ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 10;
          ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1.8;
        } else if (isMine) {
          ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 0.9;
        } else {
          ctx.strokeStyle = "rgba(0,0,0,0.65)"; ctx.lineWidth = 0.5;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Atmosphere
    ctx.save();
    const atmo = ctx.createRadialGradient(cx, cy, scaleRef.current * 0.9, cx, cy, scaleRef.current * 1.15);
    atmo.addColorStop(0,   "rgba(60,130,255,0.0)");
    atmo.addColorStop(0.4, "rgba(60,130,255,0.18)");
    atmo.addColorStop(1,   "rgba(60,130,255,0.0)");
    ctx.beginPath();
    ctx.arc(cx, cy, scaleRef.current * 1.15, 0, Math.PI * 2);
    ctx.fillStyle = atmo; ctx.fill();
    ctx.restore();

    // Rim
    ctx.beginPath(); path(sphere);
    ctx.strokeStyle = "rgba(100,170,255,0.22)"; ctx.lineWidth = 1; ctx.stroke();

    // Unit markers
    if (geo) {
      const byProv: Record<string, { nation_id: string }[]> = {};
      for (const u of Object.values(units)) {
        if (!byProv[u.province_id]) byProv[u.province_id] = [];
        byProv[u.province_id].push(u);
      }
      for (const [pid, pu] of Object.entries(byProv)) {
        const prov = provinces[pid]; if (!prov) continue;
        const feat = geo.features.find(f => getTag(f.properties) === prov.province_key);
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

    // Tooltip
    const tt = tooltipRef.current;
    if (tt) {
      const pad = 8, w = 170, h = tt.owner ? 46 : 28;
      const tx = Math.min(tt.x + 14, W - w - 4);
      const ty = Math.min(tt.y + 14, H - h - 4);
      ctx.fillStyle = "rgba(6,10,22,0.94)"; ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(tx, ty, w, h, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#f9fafb"; ctx.font = "11px monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(tt.name, tx + pad, ty + 7);
      if (tt.owner) {
        ctx.fillStyle = "#9ca3af"; ctx.font = "10px monospace";
        ctx.fillText(`Owner: ${tt.owner}`, tx + pad, ty + 26);
      }
    }

    // Coords
    const rot = rotateRef.current;
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "10px monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText(`${(-rot[1]).toFixed(1)}°N  ${(-rot[0]).toFixed(1)}°E`, W - 10, H - 10);

  }, [nations, provinces, units, myNation, selectedProvinceId, getColor]);

  // Hit test
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
    // Iterate in reverse so smaller/top countries win over large background ones
    for (let i = geo.features.length - 1; i >= 0; i--) {
      const feature = geo.features[i];
      ctx.beginPath();
      p(feature as GeoPermissibleObjects);
      if (ctx.isPointInPath(mx, my)) {
        const tag      = getTag(feature.properties);
        const name     = getName(feature.properties);
        const province = Object.values(provinces).find(pr => pr.province_key === tag);
        const owner    = province?.owner_nation_id
          ? (nations[province.owner_nation_id]?.name ?? "") : "";
        return { name, province, owner };
      }
    }
    return null;
  }, [provinces, nations]);

  // Setup
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
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startRot: [...rotateRef.current] as [number,number,number], moved: false };
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragRef.current.active) {
        const dx = (e.clientX - dragRef.current.startX) * ROTATE_SPEED;
        const dy = (e.clientY - dragRef.current.startY) * ROTATE_SPEED;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
        rotateRef.current = [
          dragRef.current.startRot[0] + dx,
          Math.max(-85, Math.min(85, dragRef.current.startRot[1] - dy)), 0,
        ];
        tooltipRef.current = null; draw();
      } else {
        const hit = hitTest(mx, my);
        tooltipRef.current = hit ? { name: hit.name, owner: hit.owner, x: mx, y: my } : null;
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

    fetch("/maps/world.geojson")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((geo: GeoJSON) => { geoRef.current = geo; draw(); })
      .catch(() => draw());

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
