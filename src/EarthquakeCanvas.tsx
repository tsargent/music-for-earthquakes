// EarthquakeCanvas.tsx
import { useEffect, useRef } from "react";

export type EarthquakeFeature = {
  properties: {
    mag: number;
    time: number;
    place: string;
  };
  geometry: {
    coordinates: [number, number, number]; // [lon, lat, depthKm]
  };
};

type Props = {
  events: EarthquakeFeature[];
};

export function EarthquakeCanvas({ events }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simple projection lon/lat -> x/y
  const project = (lon: number, lat: number, width: number, height: number) => {
    const x = ((lon + 180) / 360) * width;
    const y = height * (1 - (lat + 90) / 180);
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(
        window.devicePixelRatio,
        0,
        0,
        window.devicePixelRatio,
        0,
        0
      );
      // Optional: clear background on resize
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Draw the latest event when events[] changes
  useEffect(() => {
    if (events.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const last = events[events.length - 1];
    const { mag } = last.properties;
    const [lon, lat, depthKm] = last.geometry.coordinates;

    const { width, height } = canvas;
    const { x, y } = project(lon, lat, width, height);

    const radius = 3 + Math.max(0, mag) * 1.5;
    const depthNorm = Math.max(0, Math.min(700, depthKm || 0)) / 700;
    const alpha = 0.2 + (1 - depthNorm) * 0.7;

    // Optional: fade the whole canvas a bit each event to create trails
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fill();
    ctx.restore();
  }, [events]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "black",
      }}
    />
  );
}
