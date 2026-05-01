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

const Refraction = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("slab");
  const [angleDeg, setAngleDeg] = useState(35); // angle of incidence
  const [n, setN] = useState(1.5); // slab refractive index
  const [thickness, setThickness] = useState(160); // slab thickness in px
  const [animate, setAnimate] = useState(true);
  const tRef = useRef(0);

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
      const theta1 = (angleDeg * Math.PI) / 180; // incidence
      const sinTheta2 = Math.sin(theta1) / n;
      const theta2 = Math.asin(Math.max(-1, Math.min(1, sinTheta2)));

      // Entry point on left face
      const entryX = slabLeft;
      const entryY = cy;

      // Incoming ray start
      const rayStartX = entryX - 220;
      const rayStartY = entryY - 220 * Math.tan(theta1);

      // Inside slab path
      const insideDx = thickness;
      const insideDy = thickness * Math.tan(theta2);
      const exitX = entryX + insideDx;
      const exitY = entryY + insideDy;

      // Outgoing ray (parallel to incoming)
      const outDx = 260;
      const outDy = 260 * Math.tan(theta1);
      const outEndX = exitX + outDx;
      const outEndY = exitY + outDy;

      // Animated dash offset
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

      // Where the ray WOULD have gone without refraction (dotted ghost)
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(entryX, entryY);
      const ghostEndX = outEndX;
      const ghostEndY = entryY + (ghostEndX - entryX) * Math.tan(theta1);
      ctx.lineTo(ghostEndX, ghostEndY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow ray
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
      // Perpendicular distance: drop perpendicular from exitY actual to ghost line at x=outEndX
      ctx.moveTo(outEndX, ghostEndY);
      ctx.lineTo(outEndX, outEndY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,160,200,0.95)";
      ctx.font = "12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `পার্শ্বিক সরণ ≈ ${shift.toFixed(1)} px`,
        outEndX + 8,
        (ghostEndY + outEndY) / 2
      );

      // Angle labels
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`i = ${angleDeg}°`, entryX - 8, entryY - 8);
      ctx.textAlign = "left";
      ctx.fillText(`r = ${((theta2 * 180) / Math.PI).toFixed(1)}°`, entryX + 8, entryY + 18);

      // === FORMULA HUD (top-left) ===
      const sinI = Math.sin(theta1);
      const sinR = Math.sin(theta2);
      const rDeg = (theta2 * 180) / Math.PI;
      const hudX = 16, hudY = 16, hudW = 300, hudH = 138;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      roundRect(ctx, hudX, hudY, hudW, hudH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,235,150,0.95)";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("স্নেলের সূত্র · Snell's Law", hudX + 12, hudY + 22);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "13px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("n₁·sin(i) = n₂·sin(r)", hudX + 12, hudY + 44);
      ctx.fillStyle = "rgba(180,220,255,0.95)";
      ctx.fillText(`1.00·sin(${angleDeg}°) = ${n.toFixed(2)}·sin(${rDeg.toFixed(1)}°)`, hudX + 12, hudY + 64);
      ctx.fillText(`${sinI.toFixed(3)}  =  ${(n * sinR).toFixed(3)}`, hudX + 12, hudY + 82);
      ctx.fillStyle = "rgba(255,160,200,0.95)";
      ctx.font = "12px ui-monospace, monospace";
      ctx.fillText("পার্শ্বিক সরণ  d = t·sin(i−r)/cos(r)", hudX + 12, hudY + 104);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText(`d = ${thickness}·sin(${(angleDeg - rDeg).toFixed(1)}°)/cos(${rDeg.toFixed(1)}°) ≈ ${shift.toFixed(1)} px`, hudX + 12, hudY + 122);
      ctx.restore();
    };

    const drawPrism = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      const cx = W / 2;
      const cy = H / 2;
      const size = Math.min(W, H) * 0.42;

      // Equilateral prism, apex up
      const apex = { x: cx, y: cy - size * 0.55 };
      const left = { x: cx - size * 0.5, y: cy + size * 0.32 };
      const right = { x: cx + size * 0.5, y: cy + size * 0.32 };

      // Prism fill
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

      // Incoming white ray hits left face midpoint
      const hit = { x: (apex.x + left.x) / 2, y: (apex.y + left.y) / 2 };
      const inStart = { x: hit.x - 220, y: hit.y - 30 };

      const dashOffset = animate ? -(tRef.current * 0.08) : 0;
      const tNorm = (Math.sin(tRef.current * 0.04) + 1) / 2; // 0..1 pulse for travelling dots

      // Bright white incoming beam (core + outer glow halo)
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

      // "সাদা আলো" label on incoming beam
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("সাদা আলো (white light)", (inStart.x + hit.x) / 2, (inStart.y + hit.y) / 2 - 14);
      ctx.restore();

      // === Vector-form Snell's law refraction ===
      const idx0 = hit.x - inStart.x;
      const idy0 = hit.y - inStart.y;
      const ilen = Math.hypot(idx0, idy0);
      const incDir = { x: idx0 / ilen, y: idy0 / ilen };

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

      const refract = (
        d: { x: number; y: number },
        nOut: { x: number; y: number },
        eta: number
      ) => {
        let n = nOut;
        let cosI = -(d.x * n.x + d.y * n.y);
        if (cosI < 0) { n = { x: -n.x, y: -n.y }; cosI = -cosI; }
        const sin2T = eta * eta * (1 - cosI * cosI);
        if (sin2T > 1) return null;
        const cosT = Math.sqrt(1 - sin2T);
        return {
          x: eta * d.x + (eta * cosI - cosT) * n.x,
          y: eta * d.y + (eta * cosI - cosT) * n.y,
        };
      };

      const angBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
        const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y));
        return (Math.acos(dot) * 180) / Math.PI;
      };

      const negInc = { x: -incDir.x, y: -incDir.y };
      const theta_i_deg = angBetween(negInc, nLeft);
      const perColorDeviation: number[] = [];

      SPECTRUM.forEach((c) => {
        const dIn = refract(incDir, nLeft, 1 / c.n);
        if (!dIn) { perColorDeviation.push(0); return; }

        const rfx = right.x - apex.x;
        const rfy = right.y - apex.y;
        const denom = dIn.x * rfy - dIn.y * rfx;
        const s = ((apex.x - hit.x) * rfy - (apex.y - hit.y) * rfx) / denom;
        const exitX = hit.x + s * dIn.x;
        const exitY = hit.y + s * dIn.y;

        const dOut = refract(dIn, nRight, c.n);
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

      // Spectrum legend (bottom-right) with per-color angles
      ctx.save();
      const legendW = 200;
      const lx = W - legendW - 12;
      const ly = H - 12 - SPECTRUM.length * 18 - 26;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      roundRect(ctx, lx - 8, ly - 22, legendW, SPECTRUM.length * 18 + 36, 8);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,235,150,0.95)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("VIBGYOR  ·  n  ·  বিচ্যুতি", lx, ly - 6);
      ctx.font = "11px ui-monospace, monospace";
      SPECTRUM.forEach((c, i) => {
        const dev = perColorDeviation[i];
        ctx.fillStyle = c.color;
        ctx.fillRect(lx, ly + i * 18, 14, 12);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText(
          `${c.name.padEnd(6, " ")}  n=${c.n.toFixed(3)}  δ=${dev.toFixed(1)}°`,
          lx + 22,
          ly + i * 18 + 10
        );
      });
      ctx.restore();

      // === FORMULA HUD (top-left) for prism ===
      const hx = 16, hy = 16, hw = 320, hh = 132;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      roundRect(ctx, hx, hy, hw, hh, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,235,150,0.95)";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("বিচ্ছুরণ · Prism Dispersion", hx + 12, hy + 22);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "13px ui-monospace, monospace";
      ctx.fillText("sin(r) = sin(i) / n(λ)", hx + 12, hy + 44);
      ctx.fillText("δ = (i₁+i₂) − A     (A = 60°)", hx + 12, hy + 64);
      ctx.fillStyle = "rgba(180,220,255,0.95)";
      const iDeg = theta_i_deg;
      ctx.fillText(`আপতন  i ≈ ${iDeg.toFixed(1)}°`, hx + 12, hy + 88);
      ctx.fillStyle = "rgba(177,75,255,0.95)";
      ctx.fillText(`বেগুনি : n=1.532, বেশি বাঁকে`, hx + 12, hy + 106);
      ctx.fillStyle = "rgba(255,59,59,0.95)";
      ctx.fillText(`লাল    : n=1.510, কম বাঁকে`, hx + 12, hy + 124);
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

  return (
    <div className="min-h-screen bg-[#0a0a18] text-white">
      <SiteNav />
      <header className="pt-20 pb-4 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          আলোর প্রতিসরণ ও বিচ্ছুরণ
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/60 max-w-2xl mx-auto">
          কাঁচের স্ল্যাবের মধ্য দিয়ে আলো বাঁকা পথে যায়; প্রিজমে সাদা আলো সাত রঙে বিভক্ত হয়।
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setMode("slab")}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                mode === "slab" ? "bg-white text-black font-semibold" : "text-white/70 hover:text-white"
              }`}
            >
              কাঁচের স্ল্যাব
            </button>
            <button
              onClick={() => setMode("prism")}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                mode === "prism" ? "bg-white text-black font-semibold" : "text-white/70 hover:text-white"
              }`}
            >
              প্রিজম (বিচ্ছুরণ)
            </button>
          </div>
          <button
            onClick={() => setAnimate((a) => !a)}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm hover:bg-white/10"
          >
            {animate ? "⏸ অ্যানিমেশন বন্ধ" : "▶ অ্যানিমেশন চালু"}
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden shadow-2xl">
          <canvas ref={canvasRef} className="block w-full h-[520px]" />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <label className="flex items-center justify-between text-sm">
              <span>আপতন কোণ (i)</span>
              <span className="font-mono text-white/80">{angleDeg}°</span>
            </label>
            <input
              type="range"
              min={5}
              max={75}
              value={angleDeg}
              onChange={(e) => setAngleDeg(+e.target.value)}
              className="mt-2 w-full accent-yellow-300"
            />
          </div>
          {mode === "slab" && (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <label className="flex items-center justify-between text-sm">
                  <span>প্রতিসরাঙ্ক (n)</span>
                  <span className="font-mono text-white/80">{n.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.01}
                  value={n}
                  onChange={(e) => setN(+e.target.value)}
                  className="mt-2 w-full accent-sky-300"
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <label className="flex items-center justify-between text-sm">
                  <span>স্ল্যাবের পুরুত্ব</span>
                  <span className="font-mono text-white/80">{thickness}px</span>
                </label>
                <input
                  type="range"
                  min={60}
                  max={260}
                  value={thickness}
                  onChange={(e) => setThickness(+e.target.value)}
                  className="mt-2 w-full accent-pink-300"
                />
              </div>
            </>
          )}
          {mode === "prism" && (
            <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75 leading-relaxed">
              <p className="font-semibold text-white mb-1">কেন বিচ্ছুরণ ঘটে?</p>
              <p>
                বিভিন্ন রঙের আলোর তরঙ্গদৈর্ঘ্য আলাদা, ফলে কাঁচে তাদের প্রতিসরাঙ্ক (n) আলাদা।
                বেগুনি আলোর n সবচেয়ে বেশি, তাই এটি সবচেয়ে বেশি বাঁকে; লাল আলোর n সবচেয়ে কম,
                তাই এটি সবচেয়ে কম বাঁকে। ফলে সাদা আলো সাতটি রঙে (বেগুনি–নীল–আসমানী–সবুজ–হলুদ–কমলা–লাল) বিভক্ত হয়।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Refraction;
