"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";

// ─── GeoJSON types ──────────────────────────────────────────
interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}
interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

// ─── Map dimensions ─────────────────────────────────────────
const MAP_W = 2048;
const MAP_H = 1024;
const MIN_SCALE = 0.3;
const MAX_SCALE = 12;

// ─── Helpers ────────────────────────────────────────────────
function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * MAP_W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = MAP_H / 2 - (mercN * MAP_H) / (2 * Math.PI);
  return [x, y];
}

function getRings(feature: GeoFeature): number[][][] {
  return feature.geometry.type === "Polygon"
    ? (feature.geometry.coordinates as number[][][])
    : (feature.geometry.coordinates as number[][][][]).flat(1);
}

function centroid(ring: number[][]): [number, number] {
  let sx = 0, sy = 0;
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat);
    sx += x; sy += y;
  }
  return [sx / ring.length, sy / ring.length];
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function pointInRing(
  mx: number, my: number,
  ring: number[][],
  sc: number, ox: number, oy: number
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = project(ring[i][0], ring[i][1]);
    const [xj, yj] = project(ring[j][0], ring[j][1]);
    const sxi = xi * sc + ox, syi = yi * sc + oy;
    const sxj = xj * sc + ox, syj = yj * sc + oy;
    const intersect =
      syi > my !== syj > my &&
      mx < ((sxj - sxi) * (my - syi)) / (syj - syi) + sxi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─── Component ──────────────────────────────────────────────
export default function GameMap() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const geoRef     = useRef<GeoJSON | null>(null);
  const scaleRef   = useRef(1);
  const offsetRef  = useRef({ x: 0, y: 0 });
  const dragRef    = useRef({ active: false, lastX: 0, lastY: 0, moved: false });
  const tooltipRef = useRef<{ name: string; owner: string; x: number; y: number } | null>(null);
  const rafRef     = useRef<number>(0);

  const {
    nations, provinces, units, myNation,
    selectedProvinceId, setSelectedProvinceId, setActivePanel,
  } = useGameStore();

  // ─── Main draw function ──────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const geo = geoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sc = scaleRef.current;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;

    // Background
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!geo) return;

    // ── Provinces ────────────────────────────────────────
    for (const feature of geo.features) {
      const tag  = String(feature.properties.iso_a3 ?? "").toUpperCase();
      const name = String(feature.properties.name ?? tag);

      const province      = Object.values(provinces).find(p => p.province_key === tag);
      const ownerNationId = province?.owner_nation_id ?? null;
      const ownerNation   = ownerNationId ? nations[ownerNationId] : null;
      const isSelected    = province?.id === selectedProvinceId;
      const isMine        = ownerNationId === myNation?.id;

      let fillColor = "#2d3748";
      if (ownerNation?.color) fillColor = ownerNation.color;

      const rings = getRings(feature);
      for (const ring of rings) {
        if (ring.length < 3) continue;
        ctx.beginPath();
        for (let i = 0; i < ring.length; i++) {
          const [px, py] = project(ring[i][0], ring[i][1]);
          const sx = px * sc + ox;
          const sy = py * sc + oy;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.closePath();

        const alpha = isSelected ? 1 : isMine ? 0.95 : 0.82;
        ctx.fillStyle = `rgba(${hexToRgb(fillColor)},${alpha})`;
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth   = 2 / sc;
        } else if (isMine) {
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth   = 0.8 / sc;
        } else {
          ctx.strokeStyle = "rgba(0,0,0,0.55)";
          ctx.lineWidth   = 0.5 / sc;
        }
        ctx.stroke();
      }

      // Province name label (only show when zoomed in)
      if (sc > 2.5 && rings[0]?.length > 3) {
        const [cx, cy] = centroid(rings[0]);
        ctx.fillStyle    = "rgba(255,255,255,0.7)";
        ctx.font         = `${Math.min(11, 9 * sc / 3)}px sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name, cx * sc + ox, cy * sc + oy);
      }
    }

    // ── Unit markers ─────────────────────────────────────
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

      const rings = getRings(feature);
      if (!rings[0]) continue;
      const [cx, cy] = centroid(rings[0]);
      const sx = cx * sc + ox;
      const sy = cy * sc + oy;

      const byNation: Record<string, number> = {};
      for (const u of pUnits) byNation[u.nation_id] = (byNation[u.nation_id] || 0) + 1;

      let idx = 0;
      for (const [nid, count] of Object.entries(byNation)) {
        const nation  = nations[nid];
        const color   = nation?.color ?? "#888";
        const isEnemy = nid !== myNation?.id;
        const r       = Math.max(5, 8 * Math.min(sc, 2));
        const dy      = sy + idx * (r * 2.5);

        ctx.beginPath();
        ctx.arc(sx, dy, r, 0, Math.PI * 2);
        ctx.fillStyle   = color;
        ctx.fill();
        ctx.strokeStyle = isEnemy ? "#ff4444" : "#ffffff";
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        ctx.fillStyle    = "#fff";
        ctx.font         = `bold ${Math.max(7, r * 0.85)}px monospace`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(count), sx, dy);
        idx++;
      }
    }

    // ── Tooltip ──────────────────────────────────────────
    const tt = tooltipRef.current;
    if (tt) {
      const pad = 8, w = 170, h = tt.owner ? 46 : 28;
      const tx = Math.min(tt.x + 14, canvas.width - w - 4);
      const ty = Math.min(tt.y + 14, canvas.height - h - 4);

      ctx.fillStyle   = "rgba(10,15,26,0.93)";
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(tx, ty, w, h, 5);
      ctx.fill();
      ctx.stroke();

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
  }, [nations, provinces, units, myNation, selectedProvinceId]);

  // ─── Hit test ───────────────────────────────────────────
  const hitTest = useCallback((mx: number, my: number) => {
    const geo = geoRef.current;
    if (!geo) return null;
    const sc = scaleRef.current;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;

    for (const feature of geo.features) {
      for (const ring of getRings(feature)) {
        if (pointInRing(mx, my, ring, sc, ox, oy)) {
          const tag      = String(feature.properties.iso_a3 ?? "").toUpperCase();
          const name     = String(feature.properties.name ?? tag);
          const province = Object.values(provinces).find(p => p.province_key === tag);
          const owner    = province?.owner_nation_id
            ? (nations[province.owner_nation_id]?.name ?? "")
            : "";
          return { name, province, owner };
        }
      }
    }
    return null;
  }, [provinces, nations]);

  // ─── Setup canvas + events ───────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const wasBlank = canvas.width === 0;
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      if (wasBlank) {
        const sc = Math.min(canvas.width / MAP_W, canvas.height / MAP_H) * 0.95;
        scaleRef.current  = sc;
        offsetRef.current = {
          x: (canvas.width  - MAP_W * sc) / 2,
          y: (canvas.height - MAP_H * sc) / 2,
        };
      }
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();

    const onDown = (e: MouseEvent) => {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, moved: false };
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
        offsetRef.current.x += dx;
        offsetRef.current.y += dy;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        tooltipRef.current = null;
      } else {
        const hit = hitTest(mx, my);
        if (hit) {
          tooltipRef.current = { name: hit.name, owner: hit.owner, x: mx, y: my };
          canvas.style.cursor = "pointer";
        } else {
          tooltipRef.current = null;
          canvas.style.cursor = "grab";
        }
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
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
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect   = canvas.getBoundingClientRect();
      const mx     = e.clientX - rect.left;
      const my     = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      const newSc  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * factor));
      offsetRef.current.x = mx - (mx - offsetRef.current.x) * (newSc / scaleRef.current);
      offsetRef.current.y = my - (my - offsetRef.current.y) * (newSc / scaleRef.current);
      scaleRef.current    = newSc;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    const onLeave = () => { tooltipRef.current = null; draw(); };

    canvas.addEventListener("mousedown",  onDown);
    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseup",    onUp);
    canvas.addEventListener("wheel",      onWheel, { passive: false });
    canvas.addEventListener("mouseleave", onLeave);

    // Load map data
    fetch("/maps/world.geojson")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((geo: GeoJSON) => { geoRef.current = geo; draw(); })
      .catch(() => draw());

    return () => {
      ro.disconnect();
      canvas.removeEventListener("mousedown",  onDown);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseup",    onUp);
      canvas.removeEventListener("wheel",      onWheel);
      canvas.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, hitTest, setSelectedProvinceId, setActivePanel]);

  // Redraw on state changes
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
}
