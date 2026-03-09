"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
  GeoPermissibleObjects,
} from "d3-geo";

// ─── Types ───────────────────────────────────────────────────
interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoPermissibleObjects;
}
interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

// ─── Constants ───────────────────────────────────────────────
const MIN_SCALE = 80;
const MAX_SCALE = 2000;
const ROTATE_SPEED = 0.4;
const AUTO_SPIN_SPEED = 0.03;

export default function GameMap() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const geoRef     = useRef<GeoJSON | null>(null);
  const rafRef     = useRef<number>(0);
  const spinRef    = useRef(true);
  const rotateRef  = useRef<[number, number, number]>([0, -20, 0]);
  const scaleRef   = useRef(260);
  const dragRef    = useRef({
    active: false, startX: 0, startY: 0,
    startRot: [0, -20, 0] as [number, number, number],
    moved: false,
  });
  const tooltipRef = useRef<{ name: string; owner: string; x: number; y: number } | null>(null);

  const {
    nations, provinces, units, myNation,
    selectedProvinceId, setSelectedProvinceId, setActivePanel,
  } = useGameStore();

  // ─── Get fill color ─────────────────────────────────────
  const getColor = useCallback((tag: string): string => {
    const province      = Object.values(provinces).find(p => p.province_key === tag);
    const ownerNationId = province?.owner_nation_id ?? null;
    const ownerNation   = ownerNationId ? nations[ownerNationId] : null;
    return ownerNation?.color ?? "#3d5a40"; // green-grey for unclaimed land
  }, [provinces, nations]);

  // ─── Main draw ──────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const projection = geoOrthographic()
      .scale(scaleRef.current)
      .translate([cx, cy])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const path      = geoPath(projection, ctx);
    const graticule = geoGraticule()();
    const sphere: GeoPermissibleObjects = { type: "Sphere" };

    ctx.clearRect(0, 0, W, H);

    // Space background
    const bg = ctx.createRadialGradient(cx, cy, scaleRef.current * 0.1, cx, cy, W * 0.8);
    bg.addColorStop(0, "#080d1a");
    bg.addColorStop(1, "#000306");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars (seeded so they don't move)
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 200; i++) {
      const sx = ((i * 7919) % W);
      const sy = ((i * 6271) % H);
      const sr = (i % 3 === 0) ? 1.2 : 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ocean
    ctx.beginPath();
    path(sphere);
    const ocean = ctx.createRadialGradient(
      cx - scaleRef.current * 0.25, cy - scaleRef.current * 0.25, 0,
      cx, cy, scaleRef.current
    );
    ocean.addColorStop(0, "#1a5080");
    ocean.addColorStop(0.6, "#0e3560");
    ocean.addColorStop(1, "#081a35");
    ctx.fillStyle = ocean;
    ctx.fill();

    // Graticule
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(120,160,200,0.07)";
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    // Countries
    if (geo) {
      for (const feature of geo.features) {
        const tag        = String(feature.properties.iso_a3 ?? "").toUpperCase();
        const province   = Object.values(provinces).find(p => p.province_key === tag);
        const isSelected = province?.id === selectedProvinceId;
        const isMine     = province?.owner_nation_id === myNation?.id;
        const fillColor  = getColor(tag);

        ctx.beginPath();
        path(feature as GeoPermissibleObjects);

        // Parse hex color
        const r = parseInt(fillColor.slice(1, 3), 16);
        const g = parseInt(fillColor.slice(3, 5), 16);
        const b = parseInt(fillColor.slice(5, 7), 16);

        if (isSelected) {
          ctx.fillStyle = `rgb(${Math.min(255,r+40)},${Math.min(255,g+40)},${Math.min(255,b+40)})`;
        } else if (isMine) {
          ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
        }
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth   = 1.5;
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur  = 8;
        } else if (isMine) {
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth   = 0.8;
          ctx.shadowBlur  = 0;
        } else {
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.lineWidth   = 0.4;
          ctx.shadowBlur  = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Globe rim
    ctx.beginPath();
    path(sphere);
    ctx.strokeStyle = "rgba(120,180,240,0.25)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Atmosphere glow
    ctx.save();
    ctx.beginPath();
    path(sphere);
    const atmo = ctx.createRadialGradient(cx, cy, scaleRef.current * 0.88, cx, cy, scaleRef.current * 1.12);
    atmo.addColorStop(0,   "rgba(80,140,255,0.0)");
    atmo.addColorStop(0.5, "rgba(80,140,255,0.15)");
    atmo.addColorStop(1,   "rgba(80,140,255,0.0)");
    ctx.strokeStyle = atmo;
    ctx.lineWidth   = scaleRef.current * 0.16;
    ctx.stroke();
    ctx.restore();

    // Unit markers
    if (geo) {
      const byProvince: Record<string, { nation_id: string }[]> = {};
      for (const unit of Object.values(units)) {
        if (!byProvince[unit.province_id]) byProvince[unit.province_id] = [];
        byProvince[unit.province_id].push(unit);
      }
      for (const [provinceId, pUnits] of Object.entries(byProvince)) {
        const province = provinces[provinceId];
        if (!province) continue;
        const feature = geo.features.find(
          f => String(f.properties.iso_a3 ?? "").toUpperCase() === province.province_key
        );
        if (!feature) continue;
        const c = path.centroid(feature as GeoPermissibleObjects);
        if (!c || isNaN(c[0]) || isNaN(c[1])) continue;

        const byNation: Record<string, number> = {};
        for (const u of pUnits) byNation[u.nation_id] = (byNation[u.nation_id] || 0) + 1;

        let idx = 0;
        for (const [nid, count] of Object.entries(byNation)) {
          const nation  = nations[nid];
          const color   = nation?.color ?? "#888";
          const isEnemy = nid !== myNation?.id;
          const dy      = c[1] + idx * 18;
          ctx.beginPath();
          ctx.arc(c[0], dy, 7, 0, Math.PI * 2);
          ctx.fillStyle   = color;
          ctx.fill();
          ctx.strokeStyle = isEnemy ? "#ff4444" : "#ffffff";
          ctx.lineWidth   = 1.5;
          ctx.stroke();
          ctx.fillStyle    = "#fff";
          ctx.font         = "bold 7px monospace";
          ctx.textAlign    = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(count), c[0], dy);
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
      ctx.fillStyle   = "rgba(6,10,22,0.94)";
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, w, h, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle    = "#f9fafb";
      ctx.font         = "11px monospace";
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
      ctx.fillText(tt.name, tx + pad, ty + 7);
      if (tt.owner) {
        ctx.fillStyle = "#9ca3af";
        ctx.font      = "10px monospace";
        ctx.fillText(`Owner: ${tt.owner}`, tx + pad, ty + 26);
      }
    }

    // Coordinates
    const rot = rotateRef.current;
    ctx.fillStyle    = "rgba(255,255,255,0.18)";
    ctx.font         = "10px monospace";
    ctx.textAlign    = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${(-rot[1]).toFixed(1)}°N  ${(-rot[0]).toFixed(1)}°E`, W - 10, H - 10);

  }, [nations, provinces, units, myNation, selectedProvinceId, getColor]);

  // ─── Hit test ───────────────────────────────────────────
  const hitTest = useCallback((mx: number, my: number) => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas || !geo) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const projection = geoOrthographic()
      .scale(scaleRef.current)
      .translate([canvas.width / 2, canvas.height / 2])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const p = geoPath(projection, ctx);

    for (const feature of geo.features) {
      ctx.beginPath();
      p(feature as GeoPermissibleObjects);
      if (ctx.isPointInPath(mx, my)) {
        const tag      = String(feature.properties.iso_a3 ?? "").toUpperCase();
        const name     = String(feature.properties.name ?? tag);
        const province = Object.values(provinces).find(pr => pr.province_key === tag);
        const owner    = province?.owner_nation_id
          ? (nations[province.owner_nation_id]?.name ?? "")
          : "";
        return { name, province, owner };
      }
    }
    return null;
  }, [provinces, nations]);

  // ─── Setup ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animating = true;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      scaleRef.current = Math.min(canvas.width, canvas.height) * 0.38;
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();

    // Auto-spin loop
    const tick = () => {
      if (!animating) return;
      if (spinRef.current) {
        rotateRef.current[0] += AUTO_SPIN_SPEED;
        draw();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onDown = (e: MouseEvent) => {
      spinRef.current = false;
      dragRef.current = {
        active: true, startX: e.clientX, startY: e.clientY,
        startRot: [...rotateRef.current] as [number, number, number],
        moved: false,
      };
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current.active) {
        const dx = (e.clientX - dragRef.current.startX) * ROTATE_SPEED;
        const dy = (e.clientY - dragRef.current.startY) * ROTATE_SPEED;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
        rotateRef.current = [
          dragRef.current.startRot[0] + dx,
          Math.max(-85, Math.min(85, dragRef.current.startRot[1] - dy)),
          0,
        ];
        tooltipRef.current = null;
        draw();
      } else {
        const hit = hitTest(mx, my);
        if (hit) {
          tooltipRef.current = { name: hit.name, owner: hit.owner, x: mx, y: my };
          canvas.style.cursor = "pointer";
        } else {
          tooltipRef.current = null;
          canvas.style.cursor = "grab";
        }
        draw();
      }
    };

    const onUp = (e: MouseEvent) => {
      const { moved } = dragRef.current;
      dragRef.current.active = false;
      if (!moved) {
        const rect = canvas.getBoundingClientRect();
        const hit  = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit?.province) {
          setSelectedProvinceId(hit.province.id);
          setActivePanel("country");
        } else {
          setSelectedProvinceId(null);
        }
        draw();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spinRef.current = false;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * factor));
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
