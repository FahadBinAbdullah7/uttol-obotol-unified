import { useEffect, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";

type Mode = "slab" | "prism";

const SPECTRUM = [
  { name: "বেগুনি", en: "Violet", color: "#B14BFF", n: 1.532 },
  { name: "নীল", en: "Indigo", color: "#6A5BFF", n: 1.528 },
  { name: "আসমানী", en: "Blue", color: "#3DA5FF", n: 1.525 },
  { name: "সবুজ", en: "Green", color: "#3BFF6B", n: 1.519 },
  { name: "হলুদ", en: "Yellow", color: "#FFE234", n: 1.517 },
  { name: "কমলা", en: "Orange", color: "#FF9A2E", n: 1.514 },
  { name: "লাল", en: "Red", color: "#FF3B3B", n: 1.510 },
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
:root {
  --ten-red: #E8001D; --ten-red-dark: #931212;
  --success: #1CAB55; --success-dark: #0E7B4F;
  --ten-ink: #111827;
  --gray-100: #F3F4F6; --gray-200: #E5E7EB; --gray-300: #D1D5DB;
  --gray-500: #6B7280; --gray-600: #4B5563;
  --border: #E5E7EB; --bg: #FFFFFF; --surface: #F9FAFB;
  --info-soft: #D8F3FF;
}
.ref-root { font-family: 'Hind Siliguri','Inter',sans-serif; color: var(--ten-ink); background: var(--surface); min-height: 100vh; padding: 12px; box-sizing: border-box; line-height: 1.5; max-width: 540px; margin: 0 auto; }
.ref-root *, .ref-root *::before, .ref-root *::after { box-sizing: border-box; }
.ref-header { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; border-top: 4px solid #3B82F6; display: flex; align-items: center; gap: 12px; }
.ref-header .icon { width: 40px; height: 40px; background: #EFF6FF; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.ref-header h1 { font-size: 16px; font-weight: 700; margin: 0; }
.ref-header p { font-size: 11px; color: var(--gray-500); margin: 2px 0 0; font-family: 'Inter',sans-serif; }
.ref-card { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
.canvas-card { padding: 10px; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tab-btn { padding: 10px 8px; border: 1px solid var(--border); background: #fff; border-radius: 10px; font-weight: 600; font-size: 13px; color: var(--gray-600); cursor: pointer; transition: all 180ms; min-height: 44px; font-family: inherit; }
.tab-btn.active { border-color: #3B82F6; background: #EFF6FF; color: #2563EB; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.canvas-wrap { position: relative; width: 100%; background: #0B1220; border-radius: 12px; overflow: hidden; }
.canvas-wrap canvas { display: block; width: 100%; }
.action-row { display: flex; gap: 8px; margin-top: 10px; }
.anim-btn { flex: 1; min-height: 48px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--success-dark); background: var(--success); color: #fff; font-weight: 700; font-size: 15px; font-family: inherit; cursor: pointer; transition: all 180ms; box-shadow: 0 2px 8px rgba(28,171,85,0.25); }
.anim-btn:active { transform: scale(0.98); }
.anim-btn.on { background: linear-gradient(135deg,#3B82F6,#1D4ED8); border-color: #1E40AF; box-shadow: 0 0 0 3px rgba(59,130,246,0.15), 0 4px 14px rgba(59,130,246,0.4); }
.slider-row { margin-bottom: 14px; }
.slider-row:last-child { margin-bottom: 0; }
.slider-row label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.slider-row .val { color: #3B82F6; font-family: 'Inter',sans-serif; }
input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; background: transparent; cursor: pointer; }
input[type="range"]::-webkit-slider-runnable-track { height: 6px; background: var(--gray-200); border-radius: 999px; }
input[type="range"]::-moz-range-track { height: 6px; background: var(--gray-200); border-radius: 999px; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 24px; width: 24px; border-radius: 50%; background: #3B82F6; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); margin-top: -9px; }
input[type="range"]::-moz-range-thumb { height: 24px; width: 24px; border-radius: 50%; background: #3B82F6; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
input[type="range"]:focus { outline: none; }
.formula-card { padding: 16px; }
.formula-display { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #EFF6FF, #F0F9FF); border-radius: 12px; margin-bottom: 12px; }
.formula-values { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; background: var(--surface); border-radius: 8px; margin-bottom: 12px; }
.fv-row { display: flex; align-items: center; gap: 8px; }
.fraction { display: inline-flex; flex-direction: column; align-items: center; position: relative; padding: 0 4px; }
.fraction .num { font-family: 'Inter',serif; font-weight: 700; font-size: 20px; line-height: 1.2; }
.fraction .den { font-family: 'Inter',serif; font-weight: 600; font-size: 18px; line-height: 1.2; color: #3B82F6; border-top: 2px solid var(--ten-ink); padding-top: 2px; min-width: 20px; text-align: center; }
.fraction.small .num { font-size: 14px; }
.fraction.small .den { font-size: 13px; border-top-width: 1.5px; }
.op { font-family: 'Inter',serif; font-size: 22px; font-weight: 700; color: var(--gray-600); }
.formula-values .op { font-size: 16px; }
.data-rows { }
.data-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed var(--gray-200); }
.data-row:last-child { border-bottom: none; }
.data-row .k { color: var(--gray-600); }
.data-row .v { font-weight: 700; font-family: 'Inter',sans-serif; }
.data-row .v.bn { font-family: 'Hind Siliguri',sans-serif; }
.explain-card { background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #EEF2FF 100%); border: 1px solid #C7D2FE; padding: 16px; }
.explain-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.explain-icon { font-size: 22px; }
.explain-title { font-weight: 700; font-size: 15px; color: #1E40AF; }
.explain-body { font-size: 14px; line-height: 1.7; color: #1E3A5F; }
.spectrum-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
.spectrum-swatch { width: 14px; height: 12px; border-radius: 2px; flex-shrink: 0; }
.spectrum-name { font-weight: 600; min-width: 50px; }
.spectrum-n { font-family: 'Inter',sans-serif; color: var(--gray-600); }
.spectrum-dev { font-family: 'Inter',sans-serif; color: #3B82F6; font-weight: 600; margin-left: auto; }
`;

const Refraction = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("slab");
  const [angleDeg, setAngleDeg] = useState(35);
  const [n, setN] = useState(1.5);
  const [thickness, setThickness] = useState(160);
  const [animate, setAnimate] = useState(true);
  const tRef = useRef(0);
  const devRef = useRef<number[]>([]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0a18");
      bg.addColorStop(1, "#1a1530");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle stars
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 97) % W;
        const sy = (i * 53) % H;
        ctx.fillRect(sx, sy, 1, 1);
      }

      if (mode === "slab") drawSlab(ctx, W, H);
      else drawPrism(ctx, W, H);
    };

    const drawSlab = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      const cy = H / 2;
      const slabLeft = W / 2 - thickness / 2;
      const slabRight = W / 2 + thickness / 2;
      const slabTop = H * 0.18;
      const slabBot = H * 0.82;

      // Glass slab
      const grad = ctx.createLinearGradient(slabLeft, 0, slabRight, 0);
      grad.addColorStop(0, "rgba(140,200,255,0.10)");
      grad.addColorStop(0.5, "rgba(180,220,255,0.22)");
      grad.addColorStop(1, "rgba(140,200,255,0.10)");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(180,220,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.fillRect(slabLeft, slabTop, thickness, slabBot - slabTop);
      ctx.strokeRect(slabLeft, slabTop, thickness, slabBot - slabTop);

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`কাঁচের স্ল্যাব  (n = ${n.toFixed(2)})`, (slabLeft + slabRight) / 2, slabTop - 10);

      // Geometry
      const theta1 = (angleDeg * Math.PI) / 180;
      const sinTheta2 = Math.sin(theta1) / n;
      const theta2 = Math.asin(Math.max(-1, Math.min(1, sinTheta2)));

      const entryX = slabLeft;
      const entryY = cy;
      const rayStartX = entryX - 220;
      const rayStartY = entryY - 220 * Math.tan(theta1);
      const insideDx = thickness;
      const insideDy = thickness * Math.tan(theta2);
      const exitX = entryX + insideDx;
      const exitY = entryY + insideDy;
      const outDx = 260;
      const outDy = 260 * Math.tan(theta1);
      const outEndX = exitX + outDx;
      const outEndY = exitY + outDy;

      const dashOffset = animate ? -(tRef.current * 0.06) : 0;

      // Normal lines (dashed)
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(entryX, entryY - 70);
      ctx.lineTo(entryX, entryY + 70);
      ctx.moveTo(exitX, exitY - 70);
      ctx.lineTo(exitX, exitY + 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ghost ray (where it would have gone)
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(entryX, entryY);
      const ghostEndX = outEndX;
      const ghostEndY = entryY + (ghostEndX - entryX) * Math.tan(theta1);
      ctx.lineTo(ghostEndX, ghostEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow rays
      const drawRay = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.save();
        ctx.shadowColor = "rgba(255,235,150,0.8)";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "rgba(255,235,150,0.95)";
        ctx.lineWidth = 2.2;
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = dashOffset;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      };
      drawRay(rayStartX, rayStartY, entryX, entryY);
      drawRay(entryX, entryY, exitX, exitY);
      drawRay(exitX, exitY, outEndX, outEndY);

      // Lateral shift indicator
      const shift = Math.abs(
        (thickness * Math.sin(theta1 - theta2)) / Math.max(0.0001, Math.cos(theta2))
      );
      ctx.strokeStyle = "rgba(255,120,180,0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(outEndX, ghostEndY);
      ctx.lineTo(outEndX, outEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Angle labels (near the entry/exit points, not overlapping rays)
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`i = ${angleDeg}°`, entryX - 8, entryY - 8);
      ctx.textAlign = "left";
      ctx.fillText(`r = ${((theta2 * 180) / Math.PI).toFixed(1)}°`, entryX + 8, entryY + 18);

      // === FORMULA HUD — placed in top-right corner to avoid overlapping rays ===
      const sinI = Math.sin(theta1);
      const sinR = Math.sin(theta2);
      const rDeg = (theta2 * 180) / Math.PI;
      const hudW = 260;
      const hudH = 100;
      const hudX = W - hudW - 12;
      const hudY = 12;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      roundRect(ctx, hudX, hudY, hudW, hudH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,235,150,0.95)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("স্নেলের সূত্র · Snell's Law", hudX + 10, hudY + 18);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillText("n₁·sin(i) = n₂·sin(r)", hudX + 10, hudY + 36);
      ctx.fillStyle = "rgba(180,220,255,0.95)";
      ctx.fillText(`1.00·sin(${angleDeg}°) = ${n.toFixed(2)}·sin(${rDeg.toFixed(1)}°)`, hudX + 10, hudY + 52);
      ctx.fillText(`${sinI.toFixed(3)}  =  ${(n * sinR).toFixed(3)}`, hudX + 10, hudY + 66);
      ctx.fillStyle = "rgba(255,160,200,0.95)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`পার্শ্বিক সরণ ≈ ${shift.toFixed(1)} px`, hudX + 10, hudY + 86);
      ctx.restore();
    };

    const drawPrism = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      const cx = W / 2;
      const cy = H / 2;
      const size = Math.min(W, H) * 0.38;

      // 3D prism: front face (equilateral) + side faces for depth
      const depth3D = size * 0.18; // 3D depth offset
      const apex = { x: cx, y: cy - size * 0.55 };
      const left = { x: cx - size * 0.5, y: cy + size * 0.32 };
      const right = { x: cx + size * 0.5, y: cy + size * 0.32 };

      // Back face vertices (shifted right and up for 3D effect)
      const apexB = { x: apex.x + depth3D, y: apex.y - depth3D * 0.5 };
      const leftB = { x: left.x + depth3D, y: left.y - depth3D * 0.5 };
      const rightB = { x: right.x + depth3D, y: right.y - depth3D * 0.5 };

      // Draw back face first (darker)
      ctx.save();
      const bgGrad = ctx.createLinearGradient(leftB.x, leftB.y, rightB.x, rightB.y);
      bgGrad.addColorStop(0, "rgba(100,140,200,0.08)");
      bgGrad.addColorStop(0.5, "rgba(120,160,220,0.15)");
      bgGrad.addColorStop(1, "rgba(100,140,200,0.08)");
      ctx.fillStyle = bgGrad;
      ctx.strokeStyle = "rgba(180,210,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(apexB.x, apexB.y);
      ctx.lineTo(leftB.x, leftB.y);
      ctx.lineTo(rightB.x, rightB.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw right side face (medium shade)
      ctx.save();
      const sideGrad = ctx.createLinearGradient(right.x, right.y, rightB.x, rightB.y);
      sideGrad.addColorStop(0, "rgba(140,180,240,0.18)");
      sideGrad.addColorStop(1, "rgba(100,140,200,0.10)");
      ctx.fillStyle = sideGrad;
      ctx.strokeStyle = "rgba(180,210,255,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(right.x, right.y);
      ctx.lineTo(rightB.x, rightB.y);
      ctx.lineTo(apexB.x, apexB.y);
      ctx.lineTo(apex.x, apex.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw bottom face (darker shade)
      ctx.save();
      const botGrad = ctx.createLinearGradient(left.x, left.y, leftB.x, leftB.y);
      botGrad.addColorStop(0, "rgba(120,160,220,0.12)");
      botGrad.addColorStop(1, "rgba(80,120,180,0.06)");
      ctx.fillStyle = botGrad;
      ctx.strokeStyle = "rgba(180,210,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(leftB.x, leftB.y);
      ctx.lineTo(rightB.x, rightB.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Draw front face (brightest)
      ctx.save();
      const pg = ctx.createLinearGradient(left.x, left.y, right.x, right.y);
      pg.addColorStop(0, "rgba(180,210,255,0.10)");
      pg.addColorStop(0.5, "rgba(220,235,255,0.28)");
      pg.addColorStop(1, "rgba(180,210,255,0.10)");
      ctx.fillStyle = pg;
      ctx.strokeStyle = "rgba(220,235,255,0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 3D edge highlights
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(apex.x, apex.y);
      ctx.lineTo(apexB.x, apexB.y);
      ctx.moveTo(right.x, right.y);
      ctx.lineTo(rightB.x, rightB.y);
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(leftB.x, leftB.y);
      ctx.stroke();
      ctx.restore();

      // Hit point on left face midpoint
      const hit = { x: (apex.x + left.x) / 2, y: (apex.y + left.y) / 2 };

      const dashOffset = animate ? -(tRef.current * 0.08) : 0;
      const tNorm = (Math.sin(tRef.current * 0.04) + 1) / 2;

      // Geometry helpers
      const centroid = {
        x: (apex.x + left.x + right.x) / 3,
        y: (apex.y + left.y + right.y) / 3,
      };
      const outwardNormal = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const ex = b.x - a.x, ey = b.y - a.y;
        const cand = { x: -ey, y: ex };
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const toC = { x: centroid.x - mid.x, y: centroid.y - mid.y };
        const dot = cand.x * toC.x + cand.y * toC.y;
        const nn = dot < 0 ? cand : { x: ey, y: -ex };
        const L = Math.hypot(nn.x, nn.y);
        return { x: nn.x / L, y: nn.y / L };
      };
      const nLeft = outwardNormal(apex, left);
      const nRight = outwardNormal(apex, right);

      // Incoming direction
      const inwardN = { x: -nLeft.x, y: -nLeft.y };
      const aRad = (angleDeg * Math.PI) / 180;
      const cosA = Math.cos(aRad);
      const sinA = Math.sin(aRad);
      const backDir = {
        x: cosA * (-inwardN.x) - sinA * (-inwardN.y),
        y: sinA * (-inwardN.x) + cosA * (-inwardN.y),
      };
      const incDir = { x: -backDir.x, y: -backDir.y };
      const inLen = 240;
      const inStart = { x: hit.x + backDir.x * inLen, y: hit.y + backDir.y * inLen };

      // Bright white incoming beam
      ctx.save();
      ctx.shadowColor = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = 24;
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(inStart.x, inStart.y);
      ctx.lineTo(hit.x, hit.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,1)";
      ctx.lineWidth = 2.4;
      ctx.setLineDash([12, 6]);
      ctx.lineDashOffset = dashOffset;
      ctx.beginPath();
      ctx.moveTo(inStart.x, inStart.y);
      ctx.lineTo(hit.x, hit.y);
      ctx.stroke();
      ctx.restore();

      // Normal line at hit point
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hit.x - nLeft.x * 60, hit.y - nLeft.y * 60);
      ctx.lineTo(hit.x + nLeft.x * 60, hit.y + nLeft.y * 60);
      ctx.stroke();
      ctx.restore();

      // "সাদা আলো" label
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "সাদা আলো (white light)",
        (inStart.x + hit.x) / 2,
        (inStart.y + hit.y) / 2 - 14
      );
      ctx.restore();

      const refract = (
        d: { x: number; y: number },
        nOut: { x: number; y: number },
        eta: number
      ) => {
        let nn = nOut;
        let cosI = -(d.x * nn.x + d.y * nn.y);
        if (cosI < 0) { nn = { x: -nn.x, y: -nn.y }; cosI = -cosI; }
        const sin2T = eta * eta * (1 - cosI * cosI);
        if (sin2T > 1) return null;
        const cosT = Math.sqrt(1 - sin2T);
        return {
          x: eta * d.x + (eta * cosI - cosT) * nn.x,
          y: eta * d.y + (eta * cosI - cosT) * nn.y,
        };
      };

      const angBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y));
        return (Math.acos(dot) * 180) / Math.PI;
      };

      const negInc = { x: -incDir.x, y: -incDir.y };
      const theta_i_deg = angBetween(negInc, nLeft);
      const perColorDeviation: number[] = [];

      const intersectSeg = (
        O: { x: number; y: number },
        D: { x: number; y: number },
        A: { x: number; y: number },
        B: { x: number; y: number }
      ) => {
        const ex = B.x - A.x, ey = B.y - A.y;
        const denom = D.x * ey - D.y * ex;
        if (Math.abs(denom) < 1e-9) return null;
        const s = ((A.x - O.x) * ey - (A.y - O.y) * ex) / denom;
        const t = ((A.x - O.x) * D.y - (A.y - O.y) * D.x) / denom;
        if (s > 1e-4 && t >= -1e-4 && t <= 1 + 1e-4) return s;
        return null;
      };

      SPECTRUM.forEach((c) => {
        const dIn = refract(incDir, nLeft, 1 / c.n);
        if (!dIn) { perColorDeviation.push(0); return; }

        const sR = intersectSeg(hit, dIn, apex, right);
        const sB = intersectSeg(hit, dIn, left, right);
        let s: number | null = null;
        let exitNormal = nRight;
        if (sR !== null && (sB === null || sR < sB)) { s = sR; exitNormal = nRight; }
        else if (sB !== null) { s = sB; exitNormal = outwardNormal(left, right); }
        if (s === null) { perColorDeviation.push(0); return; }

        const exitX = hit.x + s * dIn.x;
        const exitY = hit.y + s * dIn.y;

        const dOut = refract(dIn, exitNormal, c.n);
        if (!dOut) { perColorDeviation.push(0); return; }

        const outLen = 360;
        const outEndX = exitX + dOut.x * outLen;
        const outEndY = exitY + dOut.y * outLen;

        const dev = angBetween(incDir, dOut);
        perColorDeviation.push(dev);

        // Inside colored ray
        ctx.save();
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(hit.x, hit.y);
        ctx.lineTo(exitX, exitY);
        ctx.stroke();
        ctx.restore();

        // Outgoing colored ray
        ctx.save();
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 24;
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(exitX, exitY);
        ctx.lineTo(outEndX, outEndY);
        ctx.stroke();
        ctx.restore();

        if (animate) {
          const px = exitX + (outEndX - exitX) * tNorm;
          const py = exitY + (outEndY - exitY) * tNorm;
          ctx.save();
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 16;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      devRef.current = perColorDeviation;

      // === FORMULA HUD — placed in top-right to avoid overlapping rays ===
      const hx = W - 280 - 12, hy = 12, hw = 280, hh = 110;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      roundRect(ctx, hx, hy, hw, hh, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,235,150,0.95)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("বিচ্ছুরণ · Prism Dispersion", hx + 10, hy + 18);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillText("sin(r) = sin(i) / n(λ)", hx + 10, hy + 36);
      ctx.fillText("δ = (i₁+i₂) − A   (A = 60°)", hx + 10, hy + 52);
      ctx.fillStyle = "rgba(180,220,255,0.95)";
      ctx.fillText(`আপতন  i ≈ ${theta_i_deg.toFixed(1)}°`, hx + 10, hy + 70);
      ctx.fillStyle = "rgba(177,75,255,0.95)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`বেগুনি: n=1.532, বেশি বাঁকে`, hx + 10, hy + 86);
      ctx.fillStyle = "rgba(255,59,59,0.95)";
      ctx.fillText(`লাল: n=1.510, কম বাঁকে`, hx + 10, hy + 100);
      ctx.restore();
    };

    const loop = () => {
      tRef.current += 1;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, angleDeg, n, thickness, animate]);

  // Computed values for formula card
  const theta1 = (angleDeg * Math.PI) / 180;
  const sinTheta2 = Math.sin(theta1) / n;
  const theta2 = Math.asin(Math.max(-1, Math.min(1, sinTheta2)));
  const rDeg = (theta2 * 180) / Math.PI;
  const shift = mode === "slab"
    ? Math.abs((thickness * Math.sin(theta1 - theta2)) / Math.max(0.0001, Math.cos(theta2)))
    : 0;

  return (
    <>
      <SiteNav />
      <div className="ref-root">
        <style>{STYLES}</style>

      <div className="ref-header">
        <div className="icon">🔬</div>
        <div>
          <h1 className="bn">আলোর প্রতিসরণ ও বিচ্ছুরণ</h1>
          <p>Refraction & Dispersion</p>
        </div>
      </div>

      <div className="ref-card">
        <div className="tabs">
          <button
            className={"tab-btn " + (mode === "slab" ? "active" : "")}
            onClick={() => setMode("slab")}
          >
            কাঁচের স্ল্যাব
          </button>
          <button
            className={"tab-btn " + (mode === "prism" ? "active" : "")}
            onClick={() => setMode("prism")}
          >
            প্রিজম (বিচ্ছুরণ)
          </button>
        </div>
      </div>

      <div className="ref-card canvas-card">
        <div className="canvas-wrap">
          <canvas ref={canvasRef} className="block w-full" style={{ height: 420 }} />
        </div>
        <div className="action-row">
          <button
            className={"anim-btn " + (animate ? "on" : "")}
            onClick={() => setAnimate((a) => !a)}
          >
            {animate ? "⏸ অ্যানিমেশন বন্ধ" : "▶ অ্যানিমেশন চালু"}
          </button>
        </div>
      </div>

      <div className="ref-card">
        <div className="slider-row">
          <label><span>আপতন কোণ (i)</span><span className="val">{angleDeg}°</span></label>
          <input
            type="range"
            min={5}
            max={75}
            value={angleDeg}
            onChange={(e) => setAngleDeg(+e.target.value)}
          />
        </div>
        {mode === "slab" && (
          <>
            <div className="slider-row">
              <label><span>প্রতিসরাঙ্ক (n)</span><span className="val">{n.toFixed(2)}</span></label>
              <input
                type="range"
                min={1.0}
                max={2.0}
                step={0.01}
                value={n}
                onChange={(e) => setN(+e.target.value)}
              />
            </div>
            <div className="slider-row">
              <label><span>স্ল্যাবের পুরুত্ব</span><span className="val">{thickness}px</span></label>
              <input
                type="range"
                min={60}
                max={260}
                value={thickness}
                onChange={(e) => setThickness(+e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* FORMULA CARD */}
      <div className="ref-card formula-card">
        {mode === "slab" ? (
          <>
            <div className="formula-display">
              <div className="fraction">
                <span className="num">1</span>
                <span className="den">v</span>
              </div>
              <span className="op">=</span>
              <div className="fraction">
                <span className="num">1</span>
                <span className="den">u</span>
              </div>
              <span className="op">+</span>
              <div className="fraction">
                <span className="num">1</span>
                <span className="den">f</span>
              </div>
            </div>
            <div className="data-rows">
              <div className="data-row"><span className="k">স্নেলের সূত্র</span><span className="v bn">n₁·sin(i) = n₂·sin(r)</span></div>
              <div className="data-row"><span className="k">আপতন কোণ (i)</span><span className="v">{angleDeg}°</span></div>
              <div className="data-row"><span className="k">প্রতিসরণ কোণ (r)</span><span className="v">{rDeg.toFixed(1)}°</span></div>
              <div className="data-row"><span className="k">প্রতিসরাঙ্ক (n)</span><span className="v">{n.toFixed(2)}</span></div>
              <div className="data-row"><span className="k">পার্শ্বিক সরণ</span><span className="v">{shift.toFixed(1)} px</span></div>
            </div>
          </>
        ) : (
          <>
            <div className="formula-display">
              <div className="fraction">
                <span className="num">sin(r)</span>
                <span className="den">sin(i)</span>
              </div>
              <span className="op">=</span>
              <div className="fraction">
                <span className="num">1</span>
                <span className="den">n(λ)</span>
              </div>
            </div>
            <div className="data-rows">
              <div className="data-row"><span className="k">বিচ্ছুরণ সূত্র</span><span className="v bn">δ = (i₁+i₂) − A</span></div>
              <div className="data-row"><span className="k">প্রিজম কোণ (A)</span><span className="v">60°</span></div>
              <div className="data-row"><span className="k">আপতন কোণ (i)</span><span className="v">{angleDeg}°</span></div>
            </div>
          </>
        )}
      </div>

      {/* SPECTRUM CARD (prism mode) */}
      {mode === "prism" && (
        <div className="ref-card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#1E40AF" }}>
            VIBGYOR · বর্ণালী
          </div>
          {SPECTRUM.map((c, i) => (
            <div key={c.en} className="spectrum-row">
              <div className="spectrum-swatch" style={{ background: c.color }} />
              <span className="spectrum-name bn">{c.name}</span>
              <span className="spectrum-n">n = {c.n.toFixed(3)}</span>
              <span className="spectrum-dev">δ = {(devRef.current[i] || 0).toFixed(1)}°</span>
            </div>
          ))}
        </div>
      )}

      {/* EXPLAIN CARD */}
      <div className="ref-card explain-card">
        <div className="explain-header">
          <div className="explain-icon">📍</div>
          <div className="explain-title bn">কেন বিচ্ছুরণ ঘটে?</div>
        </div>
        <div className="explain-body bn">
          বিভিন্ন রঙের আলোর তরঙ্গদৈর্ঘ্য আলাদা, ফলে কাঁচে তাদের প্রতিসরাঙ্ক (n) আলাদা।
          বেগুনি আলোর n সবচেয়ে বেশি, তাই এটি সবচেয়ে বেশি বাঁকে; লাল আলোর n সবচেয়ে কম,
          তাই এটি সবচেয়ে কম বাঁকে। ফলে সাদা আলো সাতটি রঙে (বেগুনি–নীল–আসমানী–সবুজ–হলুদ–কমলা–লাল) বিভক্ত হয়।
        </div>
      </div>
    </div>
    </>
  );
};

export default Refraction;
