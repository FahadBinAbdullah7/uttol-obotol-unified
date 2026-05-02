import { useEffect, useMemo, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { Microscope, Play, Pause, Info, Plus, Trash2 } from "lucide-react";

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

const RAY_PRESET_COLORS = ["#FFFFFF", "#FFD166", "#06D6A0", "#EF476F", "#118AB2", "#F78C6B"];

type PrismRay = {
  id: number;
  // Source position normalized to canvas size (0..1) so it stays consistent on resize
  sx: number;
  sy: number;
};

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
.ref-root { font-family: 'Hind Siliguri','Inter',sans-serif; color: var(--ten-ink); background: var(--surface); min-height: 100vh; padding: 16px; box-sizing: border-box; line-height: 1.5; max-width: 361px; margin: 0 auto; }
@media (min-width: 768px) { .ref-root { max-width: 720px; padding: 24px; } }
@media (min-width: 1440px) { .ref-root { max-width: 1216px; } }
.ref-root *, .ref-root *::before, .ref-root *::after { box-sizing: border-box; }
.ref-header { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; border-top: 4px solid var(--ten-red); display: flex; align-items: center; gap: 12px; }
.ref-header .icon { width: 40px; height: 40px; background: #FFF5F6; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.ref-header .icon svg { width: 20px; height: 20px; color: var(--ten-red); }
.ref-header h1 { font-size: 16px; font-weight: 700; margin: 0; }
.ref-header p { font-size: 11px; color: var(--gray-500); margin: 2px 0 0; font-family: 'Inter',sans-serif; }
.ref-card { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
.experiment-row { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
@media (min-width: 768px) { .experiment-row { flex-direction: row; } }
.experiment-canvas { flex: 1; min-width: 0; }
.experiment-controls { flex: 0 0 auto; width: 100%; }
@media (min-width: 768px) { .experiment-controls { width: 280px; } }
.canvas-card { padding: 10px; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tab-btn { padding: 10px 8px; border: 1px solid var(--border); background: #fff; border-radius: 10px; font-weight: 600; font-size: 13px; color: var(--gray-600); cursor: pointer; transition: all 180ms; min-height: 44px; font-family: inherit; }
.tab-btn.active { border-color: var(--ten-red); background: #FFF5F6; color: var(--ten-red); box-shadow: 0 0 0 3px rgba(232,0,29,0.08); }
.canvas-wrap { position: relative; width: 100%; background: #0B1220; border-radius: 12px; overflow: auto; max-height: 70vh; }
.canvas-wrap canvas { display: block; width: 100%; }
.action-row { display: flex; gap: 8px; margin-top: 10px; }
.anim-btn { flex: 1; min-height: 48px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--success-dark); background: var(--success); color: #fff; font-weight: 700; font-size: 15px; font-family: inherit; cursor: pointer; transition: all 180ms; box-shadow: 0 2px 8px rgba(28,171,85,0.25); display: flex; align-items: center; justify-content: center; gap: 8px; }
.anim-btn:active { transform: scale(0.98); }
.anim-btn.on { background: linear-gradient(135deg,#FF7B2A,#E8001D); border-color: #931212; box-shadow: 0 0 0 3px rgba(232,0,29,0.15), 0 4px 14px rgba(232,123,42,0.4); }
.anim-btn svg { width: 18px; height: 18px; }
.add-btn { min-height: 40px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--ten-red-dark); background: var(--ten-red); color: #fff; font-weight: 700; font-size: 13px; font-family: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.add-btn svg { width: 14px; height: 14px; }
.del-btn { background: transparent; border: none; cursor: pointer; color: var(--gray-500); padding: 4px; border-radius: 6px; }
.del-btn:hover { color: var(--ten-red); background: #FFF5F6; }
.del-btn svg { width: 16px; height: 16px; }
.slider-row { margin-bottom: 14px; }
.slider-row:last-child { margin-bottom: 0; }
.slider-row label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.slider-row .val { color: var(--ten-red); font-family: 'Inter',sans-serif; }
input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 36px; background: transparent; cursor: pointer; }
input[type="range"]::-webkit-slider-runnable-track { height: 6px; background: var(--gray-200); border-radius: 999px; }
input[type="range"]::-moz-range-track { height: 6px; background: var(--gray-200); border-radius: 999px; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 20px; width: 20px; border-radius: 50%; background: var(--success); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); margin-top: -7px; }
input[type="range"]::-moz-range-thumb { height: 20px; width: 20px; border-radius: 50%; background: var(--success); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
input[type="range"]:focus { outline: none; }
.formula-card { padding: 16px; }
.formula-display { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #FFF8E7, #FFFAEF); border-radius: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.fraction { display: inline-flex; flex-direction: column; align-items: center; position: relative; padding: 0 4px; }
.fraction .num { font-family: 'Inter',serif; font-weight: 700; font-size: 18px; line-height: 1.2; border-bottom: 2px solid var(--ten-ink); padding-bottom: 2px; min-width: 36px; text-align: center; }
.fraction .den { font-family: 'Inter',serif; font-weight: 600; font-size: 18px; line-height: 1.2; color: var(--ten-red); padding-top: 2px; min-width: 36px; text-align: center; }
.op { font-family: 'Inter',serif; font-size: 22px; font-weight: 700; color: var(--gray-600); }
.data-rows { }
.data-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed var(--gray-200); gap: 8px; }
.data-row:last-child { border-bottom: none; }
.data-row .k { color: var(--gray-600); }
.data-row .v { font-weight: 700; font-family: 'Inter',sans-serif; text-align: right; }
.data-row .v.bn { font-family: 'Hind Siliguri',sans-serif; }
.explain-card { background: linear-gradient(135deg, #FFF8E7 0%, #FFFAEF 50%, #FFF5F0 100%); border: 1px solid #F5E2A8; padding: 16px; }
.explain-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.explain-header svg { width: 20px; height: 20px; color: #8A6100; flex-shrink: 0; }
.explain-title { font-weight: 700; font-size: 15px; color: #8A6100; }
.explain-body { font-size: 14px; line-height: 1.7; color: #5A4000; }
.spectrum-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; border-bottom: 1px dashed var(--gray-200); }
.spectrum-row:last-child { border-bottom: none; }
.spectrum-swatch { width: 14px; height: 12px; border-radius: 2px; flex-shrink: 0; }
.spectrum-name { font-weight: 600; min-width: 50px; }
.spectrum-n { font-family: 'Inter',sans-serif; color: var(--gray-600); }
.spectrum-dev { font-family: 'Inter',sans-serif; color: var(--ten-red); font-weight: 600; margin-left: auto; }
.ray-card { border: 1px solid var(--border); border-radius: 10px; padding: 10px; margin-bottom: 8px; background: #fff; }
.ray-card.active { border-color: var(--ten-red); box-shadow: 0 0 0 2px rgba(232,0,29,0.08); }
.ray-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px; }
.ray-tag { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; }
.ray-dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }
.controls-title { font-weight: 700; font-size: 13px; color: var(--ten-red); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
.section-title { font-weight: 700; font-size: 14px; margin-bottom: 10px; color: var(--ten-ink); }
.calc-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
@media (min-width: 768px) { .calc-grid { grid-template-columns: 1fr 1fr; } }
.calc-block { border: 1px solid var(--border); border-radius: 10px; padding: 10px; background: #FAFAFB; }
.calc-block-head { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; margin-bottom: 6px; }
`;

function refract(
  d: { x: number; y: number },
  nOut: { x: number; y: number },
  eta: number
) {
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
}

function angBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y));
  return (Math.acos(dot) * 180) / Math.PI;
}

function intersectSeg(
  O: { x: number; y: number },
  D: { x: number; y: number },
  A: { x: number; y: number },
  B: { x: number; y: number }
) {
  const ex = B.x - A.x, ey = B.y - A.y;
  const denom = D.x * ey - D.y * ex;
  if (Math.abs(denom) < 1e-9) return null;
  const s = ((A.x - O.x) * ey - (A.y - O.y) * ex) / denom;
  const t = ((A.x - O.x) * D.y - (A.y - O.y) * D.x) / denom;
  if (s > 1e-4 && t >= -1e-4 && t <= 1 + 1e-4) return s;
  return null;
}

const Refraction = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("slab");
  const [angleDeg, setAngleDeg] = useState(35);
  const [n, setN] = useState(1.5);
  const [thickness, setThickness] = useState(160);
  const [animate, setAnimate] = useState(true);
  const tRef = useRef(0);

  // Multiple rays for prism
  const [rays, setRays] = useState<PrismRay[]>([
    { id: 1, sx: 0.12, sy: 0.35 },
  ]);
  const nextRayId = useRef(2);

  // Per-ray, per-color deviation results (for under-canvas display)
  const [rayResults, setRayResults] = useState<
    { id: number; theta_i: number; deviations: number[] }[]
  >([]);

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

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0a18");
      bg.addColorStop(1, "#1a1530");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

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

      const grad = ctx.createLinearGradient(slabLeft, 0, slabRight, 0);
      grad.addColorStop(0, "rgba(140,200,255,0.10)");
      grad.addColorStop(0.5, "rgba(180,220,255,0.22)");
      grad.addColorStop(1, "rgba(140,200,255,0.10)");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(180,220,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.fillRect(slabLeft, slabTop, thickness, slabBot - slabTop);
      ctx.strokeRect(slabLeft, slabTop, thickness, slabBot - slabTop);

      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`কাঁচের স্ল্যাব  (n = ${n.toFixed(2)})`, (slabLeft + slabRight) / 2, slabTop - 10);

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

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(entryX, entryY);
      const ghostEndX = outEndX;
      const ghostEndY = entryY + (ghostEndX - entryX) * Math.tan(theta1);
      ctx.lineTo(ghostEndX, ghostEndY);
      ctx.stroke();
      ctx.setLineDash([]);

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

      ctx.strokeStyle = "rgba(255,120,180,0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(outEndX, ghostEndY);
      ctx.lineTo(outEndX, outEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`i = ${angleDeg}°`, entryX - 8, entryY - 8);
      ctx.textAlign = "left";
      ctx.fillText(`r = ${((theta2 * 180) / Math.PI).toFixed(1)}°`, entryX + 8, entryY + 18);
    };

    const drawPrism = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      const cx = W / 2;
      const cy = H / 2;
      const size = Math.min(W, H) * 0.38;

      const depth3D = size * 0.18;
      const apex = { x: cx, y: cy - size * 0.55 };
      const left = { x: cx - size * 0.5, y: cy + size * 0.32 };
      const right = { x: cx + size * 0.5, y: cy + size * 0.32 };

      const apexB = { x: apex.x + depth3D, y: apex.y - depth3D * 0.5 };
      const leftB = { x: left.x + depth3D, y: left.y - depth3D * 0.5 };
      const rightB = { x: right.x + depth3D, y: right.y - depth3D * 0.5 };

      // Back face
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

      // Right face
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

      // Bottom face
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

      // Front face
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
      const nBottom = outwardNormal(left, right);

      const dashOffset = animate ? -(tRef.current * 0.08) : 0;
      const tNorm = (Math.sin(tRef.current * 0.04) + 1) / 2;

      const results: { id: number; theta_i: number; deviations: number[] }[] = [];

      // Helper to find which face the source-to-prism ray actually hits.
      const faces: { a: { x: number; y: number }; b: { x: number; y: number }; n: { x: number; y: number } }[] = [
        { a: apex, b: left, n: nLeft },
        { a: apex, b: right, n: nRight },
        { a: left, b: right, n: nBottom },
      ];

      rays.forEach((ray) => {
        const inStart = { x: ray.sx * W, y: ray.sy * H };

        // Aim ray from source toward prism centroid as a sensible default direction.
        const aim = { x: centroid.x - inStart.x, y: centroid.y - inStart.y };
        const aimLen = Math.hypot(aim.x, aim.y) || 1;
        const incDir = { x: aim.x / aimLen, y: aim.y / aimLen };

        // Find nearest face hit
        let bestS = Infinity;
        let hit: { x: number; y: number } | null = null;
        let entryNormal: { x: number; y: number } | null = null;
        for (const f of faces) {
          const s = intersectSeg(inStart, incDir, f.a, f.b);
          if (s !== null && s < bestS) {
            bestS = s;
            hit = { x: inStart.x + incDir.x * s, y: inStart.y + incDir.y * s };
            entryNormal = f.n;
          }
        }
        if (!hit || !entryNormal) {
          // Source is inside or ray misses prism — just draw a stub
          ctx.save();
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(inStart.x, inStart.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          results.push({ id: ray.id, theta_i: 0, deviations: SPECTRUM.map(() => NaN) });
          return;
        }

        // White incoming beam
        ctx.save();
        ctx.shadowColor = "rgba(255,255,255,0.85)";
        ctx.shadowBlur = 18;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(inStart.x, inStart.y);
        ctx.lineTo(hit.x, hit.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = dashOffset;
        ctx.beginPath();
        ctx.moveTo(inStart.x, inStart.y);
        ctx.lineTo(hit.x, hit.y);
        ctx.stroke();
        ctx.restore();

        // Source dot (the "lamp")
        ctx.save();
        ctx.shadowColor = colorFor(ray.id);
        ctx.shadowBlur = 16;
        ctx.fillStyle = colorFor(ray.id);
        ctx.beginPath();
        ctx.arc(inStart.x, inStart.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(inStart.x, inStart.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Normal at hit (along entryNormal)
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.30)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(hit.x - entryNormal.x * 50, hit.y - entryNormal.y * 50);
        ctx.lineTo(hit.x + entryNormal.x * 50, hit.y + entryNormal.y * 50);
        ctx.stroke();
        ctx.restore();

        const negInc = { x: -incDir.x, y: -incDir.y };
        const theta_i_deg = angBetween(negInc, entryNormal);

        // Ray label
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`R${ray.id}  i=${theta_i_deg.toFixed(0)}°`, inStart.x + 10, inStart.y - 8);
        ctx.restore();

        const deviations: number[] = [];

        SPECTRUM.forEach((c) => {
          const dIn = refract(incDir, entryNormal!, 1 / c.n);
          if (!dIn) { deviations.push(NaN); return; }

          // Find nearest exit face (any face that isn't the entry one)
          let s: number | null = null;
          let exitNormal: { x: number; y: number } | null = null;
          for (const f of faces) {
            if (f.n === entryNormal) continue;
            const ss = intersectSeg(hit, dIn, f.a, f.b);
            if (ss !== null && (s === null || ss < s)) { s = ss; exitNormal = f.n; }
          }
          if (s === null || !exitNormal) { deviations.push(NaN); return; }

          const exitX = hit.x + s * dIn.x;
          const exitY = hit.y + s * dIn.y;

          const dOut = refract(dIn, exitNormal, c.n);
          if (!dOut) { deviations.push(NaN); return; }

          const outLen = 360;
          const outEndX = exitX + dOut.x * outLen;
          const outEndY = exitY + dOut.y * outLen;

          const dev = angBetween(incDir, dOut);
          deviations.push(dev);

          // inside ray
          ctx.save();
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 8;
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(hit.x, hit.y);
          ctx.lineTo(exitX, exitY);
          ctx.stroke();
          ctx.restore();

          // outgoing dispersed ray
          ctx.save();
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 20;
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 2.6;
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
            ctx.shadowBlur = 14;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        results.push({ id: ray.id, theta_i: theta_i_deg, deviations });
      });

      // publish results to React state (only when changed enough)
      setRayResults((prev) => {
        if (prev.length !== results.length) return results;
        let same = true;
        for (let i = 0; i < results.length; i++) {
          const a = prev[i], b = results[i];
          if (!a || a.id !== b.id || Math.abs(a.theta_i - b.theta_i) > 0.05) { same = false; break; }
        }
        return same ? prev : results;
      });
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
  }, [mode, angleDeg, n, thickness, animate, rays]);

  // Slab values
  const theta1 = (angleDeg * Math.PI) / 180;
  const sinTheta2 = Math.sin(theta1) / n;
  const theta2 = Math.asin(Math.max(-1, Math.min(1, sinTheta2)));
  const rDeg = (theta2 * 180) / Math.PI;
  const shift = Math.abs((thickness * Math.sin(theta1 - theta2)) / Math.max(0.0001, Math.cos(theta2)));

  const addRay = () => {
    if (rays.length >= 5) return;
    const id = nextRayId.current++;
    const angle = 30 + Math.round(Math.random() * 30);
    const offset = Math.round((Math.random() * 1.4 - 0.7) * 100) / 100;
    setRays((rs) => [...rs, { id, angle, offset }]);
  };
  const removeRay = (id: number) => setRays((rs) => rs.filter((r) => r.id !== id));
  const updateRay = (id: number, patch: Partial<PrismRay>) =>
    setRays((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const colorFor = (id: number) => RAY_PRESET_COLORS[(id - 1) % RAY_PRESET_COLORS.length];

  return (
    <>
      <SiteNav />
      <div className="ref-root">
        <style>{STYLES}</style>

        <div className="ref-header">
          <div className="icon"><Microscope /></div>
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

        <div className="experiment-row">
          <div className="experiment-canvas">
            <div className="ref-card canvas-card">
              <div className="canvas-wrap">
                <canvas ref={canvasRef} className="block w-full" style={{ height: 560 }} />
              </div>
              <div className="action-row">
                <button
                  className={"anim-btn " + (animate ? "on" : "")}
                  onClick={() => setAnimate((a) => !a)}
                >
                  {animate ? <Pause /> : <Play />}
                  {animate ? "অ্যানিমেশন বন্ধ" : "অ্যানিমেশন চালু"}
                </button>
              </div>
            </div>
          </div>

          <div className="experiment-controls">
            {mode === "slab" ? (
              <div className="ref-card">
                <div className="controls-title"><span>স্ল্যাব নিয়ন্ত্রণ</span></div>
                <div className="slider-row">
                  <label><span>আপতন কোণ (i)</span><span className="val">{angleDeg}°</span></label>
                  <input type="range" min={5} max={75} value={angleDeg} onChange={(e) => setAngleDeg(+e.target.value)} />
                </div>
                <div className="slider-row">
                  <label><span>প্রতিসরাঙ্ক (n)</span><span className="val">{n.toFixed(2)}</span></label>
                  <input type="range" min={1.0} max={2.0} step={0.01} value={n} onChange={(e) => setN(+e.target.value)} />
                </div>
                <div className="slider-row">
                  <label><span>স্ল্যাবের পুরুত্ব</span><span className="val">{thickness}px</span></label>
                  <input type="range" min={60} max={260} value={thickness} onChange={(e) => setThickness(+e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="ref-card">
                <div className="controls-title">
                  <span>আলোক রশ্মি ({rays.length})</span>
                  <button className="add-btn" onClick={addRay} disabled={rays.length >= 5}>
                    <Plus /> রশ্মি যোগ
                  </button>
                </div>
                {rays.map((ray) => (
                  <div key={ray.id} className="ray-card">
                    <div className="ray-card-head">
                      <span className="ray-tag">
                        <span className="ray-dot" style={{ background: colorFor(ray.id), color: colorFor(ray.id) }} />
                        রশ্মি R{ray.id}
                      </span>
                      {rays.length > 1 && (
                        <button className="del-btn" onClick={() => removeRay(ray.id)} aria-label="remove">
                          <Trash2 />
                        </button>
                      )}
                    </div>
                    <div className="slider-row">
                      <label><span>আপতন কোণ</span><span className="val">{ray.angle}°</span></label>
                      <input
                        type="range" min={5} max={75} value={ray.angle}
                        onChange={(e) => updateRay(ray.id, { angle: +e.target.value })}
                      />
                    </div>
                    <div className="slider-row">
                      <label><span>আঘাতের অবস্থান</span><span className="val">{ray.offset.toFixed(2)}</span></label>
                      <input
                        type="range" min={-0.85} max={0.85} step={0.01} value={ray.offset}
                        onChange={(e) => updateRay(ray.id, { offset: +e.target.value })}
                      />
                    </div>
                  </div>
                ))}
                {rays.length >= 5 && (
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 4 }}>
                    সর্বাধিক ৫টি রশ্মি যোগ করা যাবে।
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SLAB FORMULA + DATA */}
        {mode === "slab" && (
          <div className="ref-card formula-card">
            <div className="section-title bn">সূত্র ও গণনা — কাঁচের স্ল্যাব</div>
            <div className="formula-display">
              <span className="op">n₁</span>
              <div className="fraction">
                <span className="num">sin(i)</span>
                <span className="den">sin(r)</span>
              </div>
              <span className="op">= n₂</span>
            </div>
            <div className="data-rows">
              <div className="data-row"><span className="k">স্নেলের সূত্র</span><span className="v bn">n₁·sin(i) = n₂·sin(r)</span></div>
              <div className="data-row"><span className="k">আপতন কোণ (i)</span><span className="v">{angleDeg}°</span></div>
              <div className="data-row"><span className="k">প্রতিসরণ কোণ (r)</span><span className="v">{rDeg.toFixed(2)}°</span></div>
              <div className="data-row"><span className="k">প্রতিসরাঙ্ক (n)</span><span className="v">{n.toFixed(2)}</span></div>
              <div className="data-row"><span className="k">sin(i)</span><span className="v">{Math.sin(theta1).toFixed(3)}</span></div>
              <div className="data-row"><span className="k">n · sin(r)</span><span className="v">{(n * Math.sin(theta2)).toFixed(3)}</span></div>
              <div className="data-row"><span className="k">পার্শ্বিক সরণ (d)</span><span className="v">{shift.toFixed(1)} px</span></div>
              <div className="data-row"><span className="k">d = t·sin(i−r)/cos(r)</span><span className="v">{thickness}·sin({(angleDeg - rDeg).toFixed(1)}°)/cos({rDeg.toFixed(1)}°)</span></div>
            </div>
          </div>
        )}

        {/* PRISM FORMULA + PER-RAY CALCULATIONS */}
        {mode === "prism" && (
          <>
            <div className="ref-card formula-card">
              <div className="section-title bn">সূত্র — প্রিজম বিচ্ছুরণ</div>
              <div className="formula-display">
                <div className="fraction">
                  <span className="num">sin(i)</span>
                  <span className="den">sin(r)</span>
                </div>
                <span className="op">= n(λ)</span>
                <span className="op">,</span>
                <span className="op">δ = (i₁ + i₂) − A</span>
              </div>
              <div className="data-rows">
                <div className="data-row"><span className="k">প্রিজম কোণ (A)</span><span className="v">60°</span></div>
                <div className="data-row"><span className="k">মোট রশ্মি</span><span className="v">{rays.length}</span></div>
                <div className="data-row"><span className="k">নিয়ম</span><span className="v bn">বেগুনি বেশি বাঁকে · লাল কম বাঁকে</span></div>
              </div>
            </div>

            <div className="ref-card">
              <div className="section-title bn">প্রতিটি রশ্মির বিচ্ছুরণ গণনা</div>
              <div className="calc-grid">
                {rayResults.map((res) => (
                  <div key={res.id} className="calc-block">
                    <div className="calc-block-head">
                      <span className="ray-dot" style={{ background: colorFor(res.id), color: colorFor(res.id) }} />
                      <span>রশ্মি R{res.id}</span>
                      <span style={{ marginLeft: "auto", color: "var(--gray-500)", fontWeight: 500 }}>
                        i ≈ {res.theta_i.toFixed(1)}°
                      </span>
                    </div>
                    {SPECTRUM.map((c, i) => (
                      <div key={c.en} className="spectrum-row">
                        <div className="spectrum-swatch" style={{ background: c.color }} />
                        <span className="spectrum-name bn">{c.name}</span>
                        <span className="spectrum-n">n={c.n.toFixed(3)}</span>
                        <span className="spectrum-dev">
                          δ = {Number.isFinite(res.deviations[i]) ? `${res.deviations[i].toFixed(1)}°` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* EXPLAIN CARD */}
        <div className="ref-card explain-card">
          <div className="explain-header">
            <Info />
            <div className="explain-title bn">
              {mode === "slab" ? "কেন আলো বাঁকা পথে চলে?" : "কেন বিচ্ছুরণ ঘটে?"}
            </div>
          </div>
          <div className="explain-body bn">
            {mode === "slab" ? (
              <>কাঁচের প্রতিসরাঙ্ক বাতাসের চেয়ে বেশি, তাই আলো কাঁচে ঢোকার সময় অভিলম্বের
              দিকে এবং বের হওয়ার সময় অভিলম্ব থেকে দূরে বাঁকে। দুই পৃষ্ঠ সমান্তরাল হওয়ায়
              বের হওয়া রশ্মি আপতন রশ্মির সমান্তরাল থাকে, কিন্তু কিছুটা পার্শ্বিক সরণ ঘটে।</>
            ) : (
              <>বিভিন্ন রঙের আলোর তরঙ্গদৈর্ঘ্য আলাদা, ফলে কাঁচে তাদের প্রতিসরাঙ্ক (n) আলাদা।
              বেগুনি আলোর n সবচেয়ে বেশি, তাই এটি সবচেয়ে বেশি বাঁকে; লাল আলোর n সবচেয়ে কম,
              তাই এটি সবচেয়ে কম বাঁকে। এখানে একাধিক রশ্মি যোগ করে প্রতিটির আলাদা বিচ্ছুরণ পর্যবেক্ষণ করা যায়।</>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Refraction;
