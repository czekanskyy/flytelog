'use client';

import { useRef, useEffect } from 'react';
import type { TerrainSample } from '@/lib/terrain';

interface TerrainProfileChartProps {
  profile: TerrainSample[];
  plannedAltitudeFt: number;
  width?: number;
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 32, left: 48 };

export function TerrainProfileChart({ profile, plannedAltitudeFt, width = 600, height = 200 }: TerrainProfileChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || profile.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const plotW = width - PADDING.left - PADDING.right;
    const plotH = height - PADDING.top - PADDING.bottom;

    const maxDist = profile[profile.length - 1].distanceNM;
    const maxElev = Math.max(plannedAltitudeFt * 1.15, Math.max(...profile.map(s => s.elevationFt)) * 1.2, 1000);

    const xScale = (d: number) => PADDING.left + (d / maxDist) * plotW;
    const yScale = (e: number) => PADDING.top + plotH - (e / maxElev) * plotH;

    ctx.clearRect(0, 0, width, height);

    // Terrain fill
    ctx.beginPath();
    ctx.moveTo(xScale(profile[0].distanceNM), yScale(0));
    for (const s of profile) {
      ctx.lineTo(xScale(s.distanceNM), yScale(s.elevationFt));
    }
    ctx.lineTo(xScale(profile[profile.length - 1].distanceNM), yScale(0));
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, yScale(maxElev), 0, yScale(0));
    gradient.addColorStop(0, 'rgba(139, 92, 42, 0.8)');
    gradient.addColorStop(1, 'rgba(139, 92, 42, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Terrain line
    ctx.beginPath();
    ctx.moveTo(xScale(profile[0].distanceNM), yScale(profile[0].elevationFt));
    for (let i = 1; i < profile.length; i++) {
      ctx.lineTo(xScale(profile[i].distanceNM), yScale(profile[i].elevationFt));
    }
    ctx.strokeStyle = '#8B5C2A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Planned altitude line
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.moveTo(PADDING.left, yScale(plannedAltitudeFt));
    ctx.lineTo(width - PADDING.right, yScale(plannedAltitudeFt));
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Red warning zones
    for (const s of profile) {
      if (s.elevationFt + 1000 > plannedAltitudeFt) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        const x = xScale(s.distanceNM);
        ctx.fillRect(x - 1, PADDING.top, 3, plotH);
      }
    }

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top);
    ctx.lineTo(PADDING.left, height - PADDING.bottom);
    ctx.lineTo(width - PADDING.right, height - PADDING.bottom);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const elev = (maxElev / ySteps) * i;
      const y = yScale(elev);
      ctx.fillText(`${Math.round(elev)}`, PADDING.left - 6, y + 3);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    const xSteps = Math.min(5, Math.ceil(maxDist));
    for (let i = 0; i <= xSteps; i++) {
      const dist = (maxDist / xSteps) * i;
      const x = xScale(dist);
      ctx.fillText(`${dist.toFixed(0)} NM`, x, height - PADDING.bottom + 16);
    }

    // Altitude label
    ctx.fillStyle = '#3b82f6';
    ctx.textAlign = 'left';
    ctx.fillText(`${plannedAltitudeFt} ft`, width - PADDING.right + 4, yScale(plannedAltitudeFt) + 3);
  }, [profile, plannedAltitudeFt, width, height]);

  if (profile.length === 0) {
    return <div className='flex items-center justify-center h-32 text-sm text-slate-400 dark:text-zinc-500'>Draw a route to see terrain profile</div>;
  }

  return <canvas ref={canvasRef} style={{ width, height }} className='rounded-lg' />;
}
