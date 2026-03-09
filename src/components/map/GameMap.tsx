"use client";

import { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { useGameStore } from "@/stores/gameStore";
import { NATION_DEFINITIONS } from "@/data/nations";

// ─── GeoJSON types ───────────────────────────────────────────
interface GeoFeature {
  type: "Feature";
  properties: { name: string; iso_a3: string; [key: string]: unknown };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}
interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

// ─── Map constants ───────────────────────────────────────────
const MAP_WIDTH = 2048;
const MAP_HEIGHT = 1024;
const MIN_SCALE = 0.4;
const MAX_SCALE = 8;

// Convert lon/lat to pixel using Web Mercator
function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * MAP_WIDTH;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = MAP_HEIGHT / 2 - (mercN * MAP_HEIGHT) / (2 * Math.PI);
  return [x, y];
}

// Flatten GeoJSON polygon rings to flat [x,y,x,y,...] array for PixiJS
function ringToPoints(ring: number[][]): number[] {
  const pts: number[] = [];
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat);
    pts.push(x, y);
  }
  return pts;
}

// Compute centroid of a polygon ring
function centroid(ring: number[][]): [number, number] {
  let sx = 0, sy = 0;
  for (const [lon, lat] of ring) {
    const [x, y] = project(lon, lat);
    sx += x; sy += y;
  }
  return [sx / ring.length, sy / ring.length];
}

export default function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const provinceLayerRef = useRef<PIXI.Container | null>(null);
  const unitLayerRef = useRef<PIXI.Container | null>(null);
  const tooltipRef = useRef<PIXI.Container | null>(null);
  const geoRef = useRef<GeoJSON | null>(null);

  const {
    nations, provinces, units,
    myNation, selectedProvinceId,
    setSelectedProvinceId, setActivePanel,
  } = useGameStore();

  // ── Build a tag→color map from live game nations + fallback to definition colors
  const getNationColor = useCallback((tag: string | null | undefined): number => {
    if (!tag) return 0x3a3a4a;
    // Find nation in live game by tag
    const live = Object.values(nations).find((n) => n.tag === tag);
    if (live?.color) return parseInt(live.color.replace("#", ""), 16);
    // Fall back to definition
    const def = NATION_DEFINITIONS.find((n) => n.tag === tag);
    if (def?.color) return parseInt(def.color.replace("#", ""), 16);
    return 0x4a5568;
  }, [nations]);

  // ── Draw all provinces ───────────────────────────────────
  const drawProvinces = useCallback((geo: GeoJSON) => {
    const layer = provinceLayerRef.current;
    if (!layer) return;
    layer.removeChildren();

    for (const feature of geo.features) {
      const tag = feature.properties.iso_a3?.toUpperCase();
      const name = feature.properties.name as string;

      // Find if this country has a province in our session
      const province = Object.values(provinces).find(
        (p) => p.province_key === tag
      );
      const ownerNationId = province?.owner_nation_id ?? null;
      const ownerNation = ownerNationId ? nations[ownerNationId] : null;
      const isSelected = province?.id === selectedProvinceId;
      const isMyProvince = ownerNationId === myNation?.id;

      // Get color
      let fillColor = 0x2d3748; // unclaimed grey
      if (ownerNation) fillColor = parseInt(ownerNation.color.replace("#", ""), 16);

      const geom = feature.geometry;
      // Normalise both Polygon and MultiPolygon into an array of rings
      const allRings: number[][][] =
        geom.type === "Polygon"
          ? (geom.coordinates as number[][][])
          : (geom.coordinates as number[][][][]).flat(1);

      // We draw each polygon ring as a separate graphics object
      for (const rings of [allRings]) {
        for (let ri = 0; ri < rings.length; ri++) {
          const ring = rings[ri];
          const pts = ringToPoints(ring);
          if (pts.length < 6) continue;

          const g = new PIXI.Graphics();
          g.interactive = true;
          g.cursor = "pointer";

          const alpha = isSelected ? 1.0 : 0.88;
          const borderColor = isSelected ? 0xffd700 : (isMyProvince ? 0xffffff : 0x000000);
          const borderWidth = isSelected ? 2 : 0.5;

          g.beginFill(fillColor, alpha);
          g.lineStyle(borderWidth, borderColor, 0.6);
          g.drawPolygon(pts);
          g.endFill();

          // Hover highlight
          g.on("pointerover", () => {
            if (!isSelected) {
              g.tint = 0xccddff;
            }
            showTooltip(name, tag, ownerNation?.name);
          });
          g.on("pointerout", () => {
            g.tint = 0xffffff;
            hideTooltip();
          });
          g.on("pointertap", () => {
            if (province) {
              setSelectedProvinceId(province.id);
              setActivePanel("country");
            }
          });

          layer.addChild(g);
        }
      }
    }
  }, [provinces, nations, myNation, selectedProvinceId, setSelectedProvinceId, setActivePanel]);

  // ── Draw unit markers ────────────────────────────────────
  const drawUnits = useCallback((geo: GeoJSON) => {
    const layer = unitLayerRef.current;
    if (!layer) return;
    layer.removeChildren();

    // Group units by province_id
    const byProvince: Record<string, typeof units[string][]> = {};
    for (const unit of Object.values(units)) {
      if (!byProvince[unit.province_id]) byProvince[unit.province_id] = [];
      byProvince[unit.province_id].push(unit);
    }

    for (const [provinceId, provinceUnits] of Object.entries(byProvince)) {
      const province = provinces[provinceId];
      if (!province) continue;

      // Find the GeoJSON feature for this province
      const feature = geo.features.find(
        (f) => f.properties.iso_a3?.toUpperCase() === province.province_key
      );
      if (!feature) continue;

      // Get centroid
      const ring = feature.geometry.type === "Polygon"
        ? (feature.geometry.coordinates as number[][][])[0]
        : (feature.geometry.coordinates as number[][][][])[0][0];
      const [cx, cy] = centroid(ring);

      // Group by nation
      const byNation: Record<string, number> = {};
      for (const u of provinceUnits) {
        byNation[u.nation_id] = (byNation[u.nation_id] || 0) + 1;
      }

      let offsetY = 0;
      for (const [nationId, count] of Object.entries(byNation)) {
        const nation = nations[nationId];
        const color = nation ? parseInt(nation.color.replace("#", ""), 16) : 0x888888;
        const isEnemy = nationId !== myNation?.id;

        // Draw marker circle
        const marker = new PIXI.Graphics();
        marker.lineStyle(1.5, isEnemy ? 0xff4444 : 0xffffff, 1);
        marker.beginFill(color, 0.9);
        marker.drawCircle(cx, cy + offsetY, 8);
        marker.endFill();

        // Unit count text
        const style = new PIXI.TextStyle({
          fontFamily: "monospace",
          fontSize: 8,
          fill: "#ffffff",
          fontWeight: "bold",
        });
        const text = new PIXI.Text(String(count), style);
        text.anchor.set(0.5);
        text.position.set(cx, cy + offsetY);
        layer.addChild(marker);
        layer.addChild(text);

        offsetY += 18;
      }
    }
  }, [units, provinces, nations, myNation]);

  // ── Tooltip ──────────────────────────────────────────────
  const showTooltip = (name: string, tag: string, owner?: string) => {
    const tt = tooltipRef.current;
    if (!tt) return;
    tt.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x111827, 0.9);
    bg.lineStyle(1, 0x4b5563);
    bg.drawRoundedRect(0, 0, 160, owner ? 44 : 28, 4);
    bg.endFill();
    tt.addChild(bg);

    const style = new PIXI.TextStyle({ fontFamily: "monospace", fontSize: 11, fill: "#f9fafb" });
    const t1 = new PIXI.Text(`${name} (${tag})`, style);
    t1.position.set(8, 6);
    tt.addChild(t1);

    if (owner) {
      const style2 = new PIXI.TextStyle({ fontFamily: "monospace", fontSize: 10, fill: "#9ca3af" });
      const t2 = new PIXI.Text(`Owner: ${owner}`, style2);
      t2.position.set(8, 24);
      tt.addChild(t2);
    }

    tt.visible = true;
  };

  const hideTooltip = () => {
    if (tooltipRef.current) tooltipRef.current.visible = false;
  };

  // ── Init PixiJS ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0x0d1b2a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // ── World container (pan/zoom target) ─────────────────
    const world = new PIXI.Container();
    app.stage.addChild(world);

    const provinceLayer = new PIXI.Container();
    const unitLayer = new PIXI.Container();
    const tt = new PIXI.Container();
    tt.visible = false;
    tt.zIndex = 100;

    world.addChild(provinceLayer);
    world.addChild(unitLayer);
    app.stage.addChild(tt); // tooltip in screen space

    provinceLayerRef.current = provinceLayer;
    unitLayerRef.current = unitLayer;
    tooltipRef.current = tt;

    // Initial scale to fit
    const scaleX = app.screen.width / MAP_WIDTH;
    const scaleY = app.screen.height / MAP_HEIGHT;
    const initScale = Math.min(scaleX, scaleY) * 0.95;
    world.scale.set(initScale);
    world.position.set(
      (app.screen.width - MAP_WIDTH * initScale) / 2,
      (app.screen.height - MAP_HEIGHT * initScale) / 2
    );

    // ── Pan & zoom ────────────────────────────────────────
    let dragging = false;
    let lastX = 0, lastY = 0;

    app.stage.interactive = true;
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);

    app.stage.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    app.stage.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
      if (!dragging) {
        // Move tooltip to cursor
        if (tt.visible) {
          tt.position.set(e.clientX + 12, e.clientY + 12);
        }
        return;
      }
      world.x += e.clientX - lastX;
      world.y += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    app.stage.on("pointerup", () => { dragging = false; });
    app.stage.on("pointerupoutside", () => { dragging = false; });

    // Scroll to zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, world.scale.x * factor));
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      world.x = mouseX - (mouseX - world.x) * (newScale / world.scale.x);
      world.y = mouseY - (mouseY - world.y) * (newScale / world.scale.y);
      world.scale.set(newScale);
    };
    (app.view as HTMLCanvasElement).addEventListener("wheel", onWheel, { passive: false });

    // ── Load GeoJSON & draw ───────────────────────────────
    fetch("/maps/world.geojson")
      .then((r) => {
        if (!r.ok) throw new Error("Map data not found");
        return r.json();
      })
      .then((geo: GeoJSON) => {
        geoRef.current = geo;
        drawProvinces(geo);
        drawUnits(geo);
      })
      .catch(() => {
        // Draw placeholder if GeoJSON not found
        const txt = new PIXI.Text(
          "Map data not found.\nPlace world.geojson in /public/maps/",
          new PIXI.TextStyle({ fill: "#9ca3af", fontSize: 18, align: "center" })
        );
        txt.anchor.set(0.5);
        txt.position.set(MAP_WIDTH / 2, MAP_HEIGHT / 2);
        provinceLayer.addChild(txt);
      });

    // ── Resize handler ────────────────────────────────────
    const onResize = () => {
      if (!containerRef.current) return;
      app.renderer.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
      app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      (app.view as HTMLCanvasElement).removeEventListener("wheel", onWheel);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redraw when game state changes ────────────────────────
  useEffect(() => {
    if (!geoRef.current) return;
    drawProvinces(geoRef.current);
  }, [provinces, nations, selectedProvinceId, drawProvinces]);

  useEffect(() => {
    if (!geoRef.current) return;
    drawUnits(geoRef.current);
  }, [units, drawUnits]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: "grab" }}
    />
  );
}
