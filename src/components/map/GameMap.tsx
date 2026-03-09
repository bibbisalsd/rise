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
const AUTO_SPIN_SPEED = 0.03; // degrees per frame when idle

export default function GameMap() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const geoRef       = useRef<GeoJSON | null>(null);
  const rafRef       = useRef<number>(0);
  const spinRef      = useRef(true); // auto-spin until user interacts

  // Projection state
  const rotateRef    = useRef<[number, number, number]>([0, -20, 0]);
  const scaleRef     = useRef(260);

  // Drag state
  const dragRef      = useRef({
    active: false,
    startX: 0, startY: 0,
    startRot: [0, -20, 0] as [number, number, number],
    moved: false,
  });

  // Tooltip
  const tooltipRef   = useRef<{ name: string; owner: string; x: number; y: number } | null>(null);

  const {
    nations, provinces, units, myNation,
    selectedProvinceId, setSelectedProvinceId, setActivePanel,
  } = useGameStore();

  // ─── Helper: get fill color for a feature ──────────────
  const getColor = useCallback((tag: string): string => {
    const province      = Object.values(provinces).find(p => p.province_key === tag);
    const ownerNationId = province?.owner_nation_id ?? null;
    const ownerNation   = ownerNationId ? nations[ownerNationId] : null;
    return ownerNation?.color ?? "#1e293b";
  }, [provinces, nations]);

  // ─── Main draw ─────────────────────────────────────────
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

    // Build projection
    const projection = geoOrthographic()
      .scale(scaleRef.current)
      .translate([cx, cy])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const path = geoPath(projection, ctx);
    const graticule = geoGraticule()();
    const sphere: GeoPermissibleObjects = { type: "Sphere" };

    ctx.clearRect(0, 0, W, H);

    // ── Space background ──────────────────────────────
    const bg = ctx.createRadialGradient(cx, cy, scaleRef.current * 0.1, cx, cy, W * 0.7);
    bg.addColorStop(0, "#0a0f1e");
    bg.addColorStop(1, "#000408");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Globe shadow ──────────────────────────────────
    const shadow = ctx.createRadialGradient(
      cx + scaleRef.current * 0.15,
      cy + scaleRef.current * 0.15,
      scaleRef.current * 0.5,
      cx, cy,
      scaleRef.current * 1.1
    );
    shadow.addColorStop(0, "rgba(0,0,0,0)");
    shadow.addColorStop(1, "rgba(0,0,0,0.6)");

    // ── Ocean ─────────────────────────────────────────
    ctx.beginPath();
    path(sphere);
    const ocean = ctx.createRadialGradient(
      cx - scaleRef.current * 0.2,
      cy - scaleRef.current * 0.2,
      0,
      cx, cy,
      scaleRef.current
    );
    ocean.addColorStop(0, "#0d2b4e");
    ocean.addColorStop(1, "#071520");
    ctx.fillStyle = ocean;
    ctx.fill();

    // ── Graticule (grid lines) ────────────────────────
    ctx.beginPath();
    path(graticule);
    ctx.strokeStyle = "rgba(100,140,180,0.08)";
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    // ── Countries ─────────────────────────────────────
    if (geo) {
      for (const feature of geo.features) {
        const tag        = String(feature.properties.iso_a3 ?? "").toUpperCase();
        const province   = Object.values(provinces).find(p => p.province_key === tag);
        const isSelected = province?.id === selectedProvinceId;
        const isMine     = province?.owner_nation_id === myNation?.id;
        const fillColor  = getColor(tag);

        ctx.beginPath();
        path(feature as GeoPermissibleObjects);

        // Fill
        if (isSelected) {
          ctx.fillStyle = fillColor;
        } else {
          // Parse hex and add slight transparency
          const r = parseInt(fillColor.slice(1, 3), 16);
          const g = parseInt(fillColor.slice(3, 5), 16);
          const b = parseInt(fillColor.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r},${g},${b},${isMine ? 0.95 : 0.8})`;
        }
        ctx.fill();

        // Border
        if (isSelected) {
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth   = 1.5;
        } else if (isMine) {
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth   = 0.7;
        } else {
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth   = 0.4;
        }
        ctx.stroke();
      }

      // ── Selected glow ──────────────────────────────
      if (selectedProvinceId) {
        const selFeature = geo.features.find(f => {
          const tag = String(f.properties.iso_a3 ?? "").toUpperCase();
          return Object.values(provinces).find(p => p.province_key === tag)?.id === selectedProvinceId;
        });
        if (selFeature) {
          ctx.beginPath();
          path(selFeature as GeoPermissibleObjects);
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth   = 2.5;
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur  = 10;
          ctx.stroke();
          ctx.shadowBlur  = 0;
        }
      }
    }

    // ── Globe rim ─────────────────────────────────────
    ctx.beginPath();
    path(sphere);
    ctx.strokeStyle = "rgba(100,160,220,0.2)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ── Atmosphere glow ───────────────────────────────
    ctx.beginPath();
    path(sphere);
    const atmo = ctx.createRadialGradient(cx, cy, scaleRef.current * 0.95, cx, cy, scaleRef.current * 1.08);
    atmo.addColorStop(0, "rgba(80,140,220,0.0)");
    atmo.addColorStop(0.5, "rgba(80,140,220,0.12)");
    atmo.addColorStop(1, "rgba(80,140,220,0.0)");
    ctx.strokeStyle = atmo;
    ctx.lineWidth   = scaleRef.current * 0.13;
    ctx.stroke();

    // ── Unit markers ──────────────────────────────────
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

        // Use d3 centroid
        const c = path.centroid(feature as GeoPermissibleObjects);
        if (!c || isNaN(c[0]) || isNaN(c[1])) continue;

        const byNation: Record<string, number> = {};
        for (const u of pUnits) byNation[u.nation_id] = (byNation[u.nation_id] || 0) + 1;

        let idx = 0;
        for (const [nid, count] of Object.entries(byNation)) {
          const nation  = nations[nid];
          const color   = nation?.color ?? "#888";
          const isEnemy = nid !== myNation?.id;
          const r       = 7;
          const dy      = c[1] + idx * 18;

          ctx.beginPath();
          ctx.arc(c[0], dy, r, 0, Math.PI * 2);
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

    // ── Tooltip ───────────────────────────────────────
    const tt = tooltipRef.current;
    if (tt) {
      const pad = 8, w = 170, h = tt.owner ? 46 : 28;
      const tx = Math.min(tt.x + 14, W - w - 4);
      const ty = Math.min(tt.y + 14, H - h - 4);

      ctx.fillStyle   = "rgba(8,12,24,0.94)";
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
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

    // ── Mini compass / coordinates ────────────────────
    const rot = rotateRef.current;
    const lon  = (-rot[0]).toFixed(1);
    const lat  = (-rot[1]).toFixed(1);
    ctx.fillStyle    = "rgba(255,255,255,0.2)";
    ctx.font         = "10px monospace";
    ctx.textAlign    = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${lat}°N  ${lon}°E`, W - 10, H - 10);

  }, [nations, provinces, units, myNation, selectedProvinceId, getColor]);

  // ─── Hit test: invert projection to find feature ────────
  const hitTest = useCallback((mx: number, my: number) => {
    const canvas = canvasRef.current;
    const geo    = geoRef.current;
    if (!canvas || !geo) return null;

    const projection = geoOrthographic()
      .scale(scaleRef.current)
      .translate([canvas.width / 2, canvas.height / 2])
      .rotate(rotateRef.current)
      .clipAngle(90);

    const path = geoPath(projection);

    for (const feature of geo.features) {
      if (path.measure(feature as GeoPermissibleObjects) === 0) continue;
      const ctx = canvasRef.current!.getContext("2d")!;
      const p   = geoPath(projection, ctx);
      ctx.beginPath();
      p(feature as GeoPermissibleObjects);
      if (ctx.isPointInPath(mx, my)) {
        const tag      = String(feature.properties.iso_a3 ?? "").toUpperCase();
        const name     = String(feature.properties.name ?? tag);
        const province = Object.values(provinces).find(p => p.province_key === tag);
        const owner    = province?.owner_nation_id
          ? (nations[province.owner_nation_id]?.name ?? "")
          : "";
        return { name, province, owner };
      }
    }
    return null;
  }, [provinces, nations]);

  // ─── Canvas setup ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animating = true;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
      // Fit scale to container
      scaleRef.current = Math.min(canvas.width, canvas.height) * 0.38;
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement ?? canvas);
    resize();

    // ── Auto-spin loop ──────────────────────────────────
    const tick = () => {
      if (!animating) return;
      if (spinRef.current) {
        rotateRef.current = [
          rotateRef.current[0] + AUTO_SPIN_SPEED,
          rotateRef.current[1],
          rotateRef.current[2],
        ];
        draw();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // ── Mouse events ────────────────────────────────────
    const onDown = (e: MouseEvent) => {
      spinRef.current = false;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startRot: [...rotateRef.current] as [number, number, number],
        moved: false,
      };
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;

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

    const onLeave = () => { tooltipRef.current = null; draw(); };
    const onDblClick = () => { spinRef.current = true; }; // double-click to resume spin

    canvas.addEventListener("mousedown",  onDown);
    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseup",    onUp);
    canvas.addEventListener("wheel",      onWheel, { passive: false });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("dblclick",   onDblClick);

    // Load GeoJSON
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
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("dblclick",   onDblClick);
    };
  }, [draw, hitTest, setSelectedProvinceId, setActivePanel]);

  // Redraw on state changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ cursor: "grab" }}
    />
  );
}
