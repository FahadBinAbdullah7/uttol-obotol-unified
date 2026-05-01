import { useEffect, useRef, useState, useMemo, useCallback } from "react";

type Mode = "convexLens" | "concaveLens" | "convexMirror" | "concaveMirror";

// ============== LAB TEST QUEST SYSTEM ==============
interface Quest {
  id: number;
  instruction: string;
  targetMode: Mode;
  targetURange: [number, number]; // min, max uMag
  targetModeLabel: string; // Bengali label for the mode user must select
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  };
  hint: string;
}

const QUEST_POOL: Quest[] = [
  {
    id: 1,
    instruction: "উত্তল লেন্স ব্যবহার করে বস্তুকে F ও 2F-এর মাঝে রাখো। একটি বড় উল্টো প্রতিবিম্ব তৈরি করো।",
    targetMode: "convexLens",
    targetModeLabel: "উত্তল লেন্স",
    targetURange: [85, 155],
    quiz: { question: "এই অবস্থানে কোন যন্ত্র কাজ করে?", options: ["প্রজেক্টর", "ক্যামেরা", "ম্যাগনিফাইং গ্লাস", "টেলিস্কোপ"], correctIndex: 0 },
    hint: "বস্তু ফোকালের বাইরে (৮১ u) আছে",
  },
  {
    id: 2,
    instruction: "উত্তল লেন্স ব্যবহার করে বস্তুকে 2F-এর বাইরে রাখো। একটি ছোট উল্টো প্রতিবিম্ব তৈরি করো।",
    targetMode: "convexLens",
    targetModeLabel: "উত্তল লেন্স",
    targetURange: [165, 350],
    quiz: { question: "এটি কোন যন্ত্রের কাজের মতো?", options: ["টর্চলাইট", "প্রজেক্টর", "ক্যামেরা", "ম্যাগনিফাইং গ্লাস"], correctIndex: 2 },
    hint: "বস্তু 2F-এর বাইরে রাখো",
  },
  {
    id: 3,
    instruction: "উত্তল লেন্স ব্যবহার করে বস্তুকে F-এর ভেতরে রাখো। একটি বড় সোজা অভাসী প্রতিবিম্ব দেখো।",
    targetMode: "convexLens",
    targetModeLabel: "উত্তল লেন্স",
    targetURange: [5, 75],
    quiz: { question: "F-এর ভেতরে রাখলে প্রতিবিম্ব কেমন হয়?", options: ["বাস্তব ও উল্টো", "অভাসী ও সোজা ও বড়", "সমান আকার", "প্রতিবিম্ব হয় না"], correctIndex: 1 },
    hint: "ম্যাগনিফাইং গ্লাসের মতো কাজ করে",
  },
  {
    id: 4,
    instruction: "অবতল দর্পণ ব্যবহার করে আয়নার পেছনে একটি বিশাল প্রতিবিম্ব তৈরি করো। (বস্তু F এর ভেতরে আনো)",
    targetMode: "concaveMirror",
    targetModeLabel: "অবতল দর্পণ",
    targetURange: [5, 75],
    quiz: { question: "অবতল দর্পণে F-এর ভেতরে প্রতিবিম্ব কোথায় হয়?", options: ["আয়নার সামনে", "আয়নার পেছনে (অভাসী)", "অসীমে", "F-এ"], correctIndex: 1 },
    hint: "মেকআপ আয়নার মতো কাজ করে",
  },
  {
    id: 5,
    instruction: "উত্তল লেন্সে বস্তুকে ঠিক 2F-এ রাখো। সমান আকারের উল্টো প্রতিবিম্ব তৈরি করো।",
    targetMode: "convexLens",
    targetModeLabel: "উত্তল লেন্স",
    targetURange: [155, 165],
    quiz: { question: "2F-এ বস্তু রাখলে বিবর্ধন (m) কত?", options: ["0.5×", "1×", "2×", "∞"], correctIndex: 1 },
    hint: "u = 2f হলে v = 2f",
  },
  {
    id: 6,
    instruction: "উত্তল লেন্সে বস্তুকে ঠিক F-এ রাখো। দেখো কী হয়!",
    targetMode: "convexLens",
    targetModeLabel: "উত্তল লেন্স",
    targetURange: [76, 84],
    quiz: { question: "F-এ বস্তু রাখলে কী হয়?", options: ["ছোট প্রতিবিম্ব", "সমান প্রতিবিম্ব", "রশ্মি সমান্তরাল — প্রতিবিম্ব অসীমে", "উল্টো ও বড়"], correctIndex: 2 },
    hint: "টর্চলাইটের নীতি",
  },
  {
    id: 7,
    instruction: "অবতল লেন্স ব্যবহার করো। যেকোনো জায়গায় বস্তু রাখো এবং প্রতিবিম্বের ধরন পর্যবেক্ষণ করো।",
    targetMode: "concaveLens",
    targetModeLabel: "অবতল লেন্স",
    targetURange: [5, 350],
    quiz: { question: "অবতল লেন্সে প্রতিবিম্ব সবসময় কেমন?", options: ["বাস্তব ও বড়", "অভাসী, সোজা ও ছোট", "সমান আকার", "অসীমে"], correctIndex: 1 },
    hint: "চশমায় (মায়োপিয়া) এটি ব্যবহার হয়",
  },
  {
    id: 8,
    instruction: "উত্তল দর্পণ ব্যবহার করো এবং প্রতিবিম্ব দেখো।",
    targetMode: "convexMirror",
    targetModeLabel: "উত্তল দর্পণ",
    targetURange: [5, 350],
    quiz: { question: "উত্তল দর্পণ কোথায় ব্যবহার হয়?", options: ["প্রজেক্টরে", "গাড়ির পেছনের আয়নায়", "ক্যামেরায়", "টর্চলাইটে"], correctIndex: 1 },
    hint: "বড় দৃষ্টিক্ষেত্র দেখায়",
  },
  {
    id: 9,
    instruction: "অবতল দর্পণে বস্তুকে 2F-এর বাইরে রাখো।",
    targetMode: "concaveMirror",
    targetModeLabel: "অবতল দর্পণ",
    targetURange: [165, 350],
    quiz: { question: "অবতল দর্পণে 2F-এর বাইরে রাখলে প্রতিবিম্ব কেমন?", options: ["বড় ও সোজা", "ছোট, উল্টো ও বাস্তব", "সমান আকার", "অভাসী"], correctIndex: 1 },
    hint: "ক্যামেরার মতো",
  },
  {
    id: 10,
    instruction: "অবতল দর্পণে বস্তুকে F ও 2F-এর মাঝে রাখো।",
    targetMode: "concaveMirror",
    targetModeLabel: "অবতল দর্পণ",
    targetURange: [85, 155],
    quiz: { question: "এই অবস্থানে প্রতিবিম্ব কেমন?", options: ["ছোট ও সোজা", "বড়, উল্টো ও বাস্তব", "অভাসী ও ছোট", "তৈরি হয় না"], correctIndex: 1 },
    hint: "প্রজেক্টরের মতো",
  },
];

const MODES: { id: Mode; label: string; isLens: boolean; fSign: 1 | -1 }[] = [
  { id: "convexLens", label: "উত্তল লেন্স", isLens: true, fSign: 1 },
  { id: "concaveLens", label: "অবতল লেন্স", isLens: true, fSign: -1 },
  { id: "convexMirror", label: "উত্তল দর্পণ", isLens: false, fSign: 1 },
  { id: "concaveMirror", label: "অবতল দর্পণ", isLens: false, fSign: -1 },
];

const RAY_COLORS = {
  ray1: "#FF6B35",
  ray2: "#FFD23F",
  ray3: "#06D6A0",
};

const toBn = (n: number | string) => {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (d) => map[+d]);
};
const fmtNum = (n: number, decimals = 0) => {
  if (!isFinite(n)) return "∞";
  const sign = n < 0 ? "−" : n > 0 ? "+" : "";
  const abs = Math.abs(n).toFixed(decimals);
  return sign + toBn(abs);
};

// Use case data with icons and descriptions
const USE_CASES: Record<string, { icon: string; title: string; desc: string; animation: string }[]> = {
  projector: [
    { icon: "🎬", title: "প্রজেক্টর", desc: "ছোট স্লাইড থেকে বড় পর্দায় ছবি তৈরি করে", animation: "projector" },
  ],
  camera: [
    { icon: "📷", title: "ক্যামেরা", desc: "বড় দৃশ্য থেকে ছোট ফিল্মে ছবি ধরে", animation: "camera" },
  ],
  magnifier: [
    { icon: "🔍", title: "ম্যাগনিফাইং গ্লাস", desc: "ছোট জিনিস বড় করে দেখায়", animation: "magnifier" },
  ],
  torch: [
    { icon: "🔦", title: "টর্চলাইট", desc: "আলো সমান্তরাল রশ্মিতে পাঠায়", animation: "torch" },
  ],
  glasses: [
    { icon: "👓", title: "চশমা (Myopia)", desc: "দূরের জিনিস স্পষ্ট দেখায়", animation: "glasses" },
  ],
  rearview: [
    { icon: "🚗", title: "পেছনের আয়না", desc: "বড় দৃষ্টিক্ষেত্র দেখায়", animation: "rearview" },
  ],
  shaving: [
    { icon: "🪞", title: "মেকআপ আয়না", desc: "মুখ বড় করে দেখায়", animation: "shaving" },
  ],
  equal: [
    { icon: "⚖️", title: "সমান প্রতিবিম্ব", desc: "বস্তুর সমান আকারের উল্টো ছবি", animation: "equal" },
  ],
};

export default function RayOptics() {
  const [mode, setMode] = useState<Mode>("convexLens");
  const [uMag, setUMag] = useState(150);
  const [fMag, setFMag] = useState(80);
  const [lightOn, setLightOn] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [showUseCase, setShowUseCase] = useState<string | null>(null);
  const [useCaseAnim, setUseCaseAnim] = useState(0);

  // Lab test state
  const [labMode, setLabMode] = useState<"off" | "name" | "playing" | "quiz" | "result">("off");
  const [playerName, setPlayerName] = useState("");
  const [labScore, setLabScore] = useState(0);
  const [labRound, setLabRound] = useState(0);
  const [labQuests, setLabQuests] = useState<Quest[]>([]);
  const [questCompleted, setQuestCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<"correct" | "wrong" | null>(null);
  // User must physically grab the candle at least once before the quiz pops up.
  const [candleTouched, setCandleTouched] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const useCaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const dragRef = useRef<{ active: boolean; offset: number; targetU: number; cx: number; scale: number; lastCommit: number; pendingU: number }>({
    active: false,
    offset: 0,
    targetU: 150,
    cx: 0,
    scale: 1,
    lastCommit: 0,
    pendingU: 150,
  });
  const flameTimeRef = useRef(0);
  const layoutRef = useRef({ cx: 0, cy: 0, scale: 1, W: 0, H: 0, maxRange: 1 });
  const smoothURef = useRef(150);

  const modeInfo = MODES.find((m) => m.id === mode)!;
  const isLens = modeInfo.isLens;
  const u = -uMag;
  const f = modeInfo.fSign * fMag;

  const { v, m: mag } = useMemo(() => {
    let vv: number;
    if (isLens) {
      const inv = 1 / f + 1 / u;
      vv = Math.abs(inv) < 1e-6 ? Infinity : 1 / inv;
    } else {
      const inv = 1 / f - 1 / u;
      vv = Math.abs(inv) < 1e-6 ? Infinity : 1 / inv;
    }
    const mm = isFinite(vv) ? vv / u : Infinity;
    return { v: vv, m: mm };
  }, [u, f, isLens]);

  const isReal = isLens ? v > 0 : v < 0;
  const isErect = isLens ? mag > 0 : mag < 0;
  const sizeText = Math.abs(mag) > 1.05 ? "বড়" : Math.abs(mag) < 0.95 ? "ছোট" : "সমান আকার";

  // Smooth drag interpolation
  useEffect(() => {
    dragRef.current.targetU = uMag;
  }, [uMag]);

  // Animation loop
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      flameTimeRef.current += dt;

      // Smooth interpolation for drag
      if (!dragRef.current.active) {
        // Only interpolate when not actively dragging
        const target = dragRef.current.targetU;
        const current = smoothURef.current;
        const diff = target - current;
        if (Math.abs(diff) > 0.5) {
          smoothURef.current = current + diff * Math.min(1, dt * 12);
        } else {
          smoothURef.current = target;
        }
      }

      if (lightOn) {
        setAnimProgress((p) => Math.min(1, p + dt * 0.55));
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [lightOn]);

  // Use case animation loop
  useEffect(() => {
    if (!showUseCase) { setUseCaseAnim(0); return; }
    let raf: number;
    let start = performance.now();
    const loop = (now: number) => {
      setUseCaseAnim((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [showUseCase]);

  // Draw use case canvas
  useEffect(() => {
    if (!showUseCase) return;
    const canvas = useCaseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    drawUseCaseAnimation(ctx, W, H, showUseCase, useCaseAnim);
  }, [showUseCase, useCaseAnim]);

  useEffect(() => {
    setAnimProgress(0);
  }, [mode, uMag, fMag]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0B1220");
    bgGrad.addColorStop(1, "#1A2238");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let yy = 0; yy < H; yy += 24) {
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
    }

    const smoothU = -smoothURef.current;
    const smoothUMag = smoothURef.current;
    const smoothInv = isLens ? 1 / f + 1 / smoothU : 1 / f - 1 / smoothU;
    const drawV = Math.abs(smoothInv) < 1e-6 ? Infinity : 1 / smoothInv;
    const drawMag = isFinite(drawV) ? drawV / smoothU : Infinity;
    const drawIsReal = isLens ? drawV > 0 : drawV < 0;

    const cx = W / 2;
    const cy = H / 2;
    const maxRange = 390;
    const scale = (W / 2 - 30) / maxRange;
    layoutRef.current = { cx, cy, scale, W, H, maxRange };

    const X = (x: number) => cx + x * scale;
    const Y = (y: number) => cy - y * scale;

    // Principal axis
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(W - 10, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Element (lens/mirror)
    const elemHeight = H * 0.72;
    const top = cy - elemHeight / 2;
    const bot = cy + elemHeight / 2;

    if (isLens) {
      const isConvex = mode === "convexLens";
      const bulge = 14;
      const grad = ctx.createLinearGradient(cx - 24, 0, cx + 24, 0);
      grad.addColorStop(0, "rgba(120,180,255,0.15)");
      grad.addColorStop(0.5, "rgba(180,220,255,0.35)");
      grad.addColorStop(1, "rgba(120,180,255,0.15)");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(180,220,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isConvex) {
        // Biconvex: both surfaces bulge outward
        ctx.moveTo(cx, top);
        ctx.quadraticCurveTo(cx + bulge, cy, cx, bot);
        ctx.quadraticCurveTo(cx - bulge, cy, cx, top);
      } else {
        // Biconcave: thick edges, thin middle. Outline is a rectangle whose
        // left and right sides curve INWARD toward the optical axis.
        const halfW = bulge + 4; // edge thickness
        ctx.moveTo(cx - halfW, top);
        ctx.lineTo(cx + halfW, top);
        ctx.quadraticCurveTo(cx + halfW - bulge * 1.6, cy, cx + halfW, bot);
        ctx.lineTo(cx - halfW, bot);
        ctx.quadraticCurveTo(cx - halfW + bulge * 1.6, cy, cx - halfW, top);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(180,220,255,0.85)";
      const tri = (tx: number, ty: number, up: boolean) => {
        ctx.beginPath();
        ctx.moveTo(tx - 4, ty);
        ctx.lineTo(tx + 4, ty);
        ctx.lineTo(tx, ty + (up ? -6 : 6));
        ctx.closePath(); ctx.fill();
      };
      tri(cx, top, true); tri(cx, bot, false);
    } else {
      ctx.strokeStyle = "rgba(180,220,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const bulge = mode === "concaveMirror" ? 16 : -16;
      ctx.moveTo(cx, top);
      ctx.quadraticCurveTo(cx + bulge, cy, cx, bot);
      ctx.stroke();
      ctx.strokeStyle = "rgba(180,220,255,0.35)";
      ctx.lineWidth = 1;
      const back = mode === "concaveMirror" ? 1 : -1;
      for (let yy = top; yy < bot; yy += 8) {
        ctx.beginPath();
        ctx.moveTo(cx, yy);
        ctx.lineTo(cx + back * 7, yy + 4);
        ctx.stroke();
      }
    }

    // F, 2F labels
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    [
      { x: -fMag, label: "F" }, { x: fMag, label: "F" },
      { x: -2 * fMag, label: "2F" }, { x: 2 * fMag, label: "2F" },
      { x: 0, label: isLens ? "O" : "P" },
    ].forEach((mk) => {
      const px = X(mk.x);
      ctx.fillStyle = "rgba(255,210,63,0.9)";
      ctx.beginPath(); ctx.arc(px, cy, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(mk.label, px, cy + 14);
    });

    // === REALISTIC CANDLE ===
    const objHeight = 50;
    const candleX = X(smoothU);
    const candleBaseY = Y(0);
    const candleTopY = Y(objHeight);
    const candleW = Math.max(10, 14 * scale * 0.6);
    drawRealisticCandle(ctx, candleX, candleBaseY, candleTopY, candleW, flameTimeRef.current, lightOn);

    // === RAYS ===
    const oy = objHeight;
    const ox = smoothU;
    const Fx = f;

    type Path = { points: { x: number; y: number }[]; dashed?: boolean }[];
    const buildRays = (): { color: string; segments: Path }[] => {
      const result: { color: string; segments: Path }[] = [];

      if (isLens) {
        const r1: Path = [{ points: [{ x: ox, y: oy }, { x: 0, y: oy }] }];
        if (isFinite(drawV)) {
          if (drawV > 0) r1.push({ points: [{ x: 0, y: oy }, { x: drawV, y: drawMag * oy }] });
          else {
            const slope = -oy / f;
            r1.push({ points: [{ x: 0, y: oy }, { x: maxRange, y: oy + slope * maxRange }] });
            r1.push({ points: [{ x: 0, y: oy }, { x: drawV, y: drawMag * oy }], dashed: true });
          }
        } else {
          r1.push({ points: [{ x: 0, y: oy }, { x: maxRange, y: oy + (-oy / f) * maxRange }] });
        }
        result.push({ color: RAY_COLORS.ray1, segments: r1 });

        const r2: Path = [];
        if (isFinite(drawV) && drawV > 0) {
          r2.push({ points: [{ x: ox, y: oy }, { x: drawV, y: drawMag * oy }] });
        } else {
          r2.push({ points: [{ x: ox, y: oy }, { x: maxRange, y: (oy / ox) * maxRange }] });
          if (isFinite(drawV) && drawV < 0)
            r2.push({ points: [{ x: 0, y: 0 }, { x: drawV, y: drawMag * oy }], dashed: true });
        }
        result.push({ color: RAY_COLORS.ray2, segments: r2 });

        const slopeInc = -oy / (-f - ox);
        const yAtLens = oy + slopeInc * (0 - ox);
        const r3: Path = [
          { points: [{ x: ox, y: oy }, { x: 0, y: yAtLens }] },
          { points: [{ x: 0, y: yAtLens }, { x: maxRange, y: yAtLens }] },
        ];
        if (isFinite(drawV) && drawV < 0)
          r3.push({ points: [{ x: 0, y: yAtLens }, { x: drawV, y: drawMag * oy }], dashed: true });
        result.push({ color: RAY_COLORS.ray3, segments: r3 });
      } else {
        const r1: Path = [{ points: [{ x: ox, y: oy }, { x: 0, y: oy }] }];
        const slope1 = -oy / Fx;
        const xEnd = -maxRange;
        r1.push({ points: [{ x: 0, y: oy }, { x: xEnd, y: oy + slope1 * xEnd }] });
        if (mode === "convexMirror") r1.push({ points: [{ x: 0, y: oy }, { x: Fx, y: 0 }], dashed: true });
        result.push({ color: RAY_COLORS.ray1, segments: r1 });

        const r2: Path = [
          { points: [{ x: ox, y: oy }, { x: 0, y: 0 }] },
          { points: [{ x: 0, y: 0 }, { x: -maxRange, y: (maxRange * oy) / ox }] },
        ];
        if (!drawIsReal && isFinite(drawV))
          r2.push({ points: [{ x: 0, y: 0 }, { x: drawV, y: drawMag * oy }], dashed: true });
        result.push({ color: RAY_COLORS.ray2, segments: r2 });

        const slopeInc3 = (0 - oy) / (Fx - ox);
        const yAtMirror = oy + slopeInc3 * (0 - ox);
        const r3: Path = [
          { points: [{ x: ox, y: oy }, { x: 0, y: yAtMirror }] },
          { points: [{ x: 0, y: yAtMirror }, { x: -maxRange, y: yAtMirror }] },
        ];
        if (!drawIsReal && isFinite(drawV)) {
          r3.push({ points: [{ x: 0, y: yAtMirror }, { x: drawV, y: drawMag * oy }], dashed: true });
          if (mode === "convexMirror")
            r3.push({ points: [{ x: 0, y: yAtMirror }, { x: Fx, y: 0 }], dashed: true });
        }
        result.push({ color: RAY_COLORS.ray3, segments: r3 });
      }
      return result;
    };

    const rays = buildRays();
    const segLen = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot((b.x - a.x) * scale, (b.y - a.y) * scale);

    rays.forEach((ray) => {
      let totalSolid = 0;
      ray.segments.forEach((s) => {
        if (s.dashed) return;
        for (let i = 1; i < s.points.length; i++) totalSolid += segLen(s.points[i - 1], s.points[i]);
      });
      const allowed = animProgress * totalSolid;
      let consumed = 0;

      const drawSegment = (pts: { x: number; y: number }[], dashed: boolean, _fullLen: number, takeLen: number) => {
        if (takeLen <= 0) return;
        let remaining = takeLen;
        const drawPts: { x: number; y: number }[] = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
          const L = segLen(pts[i - 1], pts[i]);
          if (remaining >= L) {
            drawPts.push(pts[i]);
            remaining -= L;
          } else {
            const t = remaining / L;
            drawPts.push({
              x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
              y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
            });
            break;
          }
        }
        ctx.save();
        ctx.shadowColor = ray.color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = ray.color;
        ctx.lineWidth = dashed ? 1.5 : 2.4;
        ctx.setLineDash(dashed ? [6, 5] : []);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(X(drawPts[0].x), Y(drawPts[0].y));
        for (let i = 1; i < drawPts.length; i++) ctx.lineTo(X(drawPts[i].x), Y(drawPts[i].y));
        ctx.stroke();
        ctx.restore();
      };

      ray.segments.forEach((s) => {
        if (s.dashed) return;
        let segTotal = 0;
        for (let i = 1; i < s.points.length; i++) segTotal += segLen(s.points[i - 1], s.points[i]);
        const take = Math.max(0, Math.min(segTotal, allowed - consumed));
        drawSegment(s.points, false, segTotal, take);
        consumed += segTotal;
      });

      if (animProgress > 0.95) {
        ray.segments.forEach((s) => {
          if (!s.dashed) return;
          let segTotal = 0;
          for (let i = 1; i < s.points.length; i++) segTotal += segLen(s.points[i - 1], s.points[i]);
          drawSegment(s.points, true, segTotal, segTotal);
        });
      }
    });

    // Image candle
    if (isFinite(drawV) && Math.abs(drawV) > 2 && animProgress > 0.85) {
      const imgAlpha = Math.min(1, (animProgress - 0.85) / 0.15);
      ctx.save();
      ctx.globalAlpha = imgAlpha;
      const ix = X(drawV);
      const imgHeight = Math.abs(drawMag) * oy;
      // Sign convention here uses negative u (and negative v for mirrors on
      // the object side), so the "image is inverted" test depends on element
      // type — same rule used for `isErect` above.
      //   Lens:   inverted ⇔ mag < 0   (real image, opposite side, m = v/u with v>0,u<0)
      //   Mirror: inverted ⇔ mag > 0   (real image, same side,    m = v/u with v<0,u<0)
      const isInverted = isLens ? drawMag < 0 : drawMag > 0;
      const imgCandleW = candleW * Math.min(2, Math.abs(drawMag));
      // For inverted real images, pass flipped=true so the WHOLE candle
      // (plate, body, wax, wick, flame) is mirrored through the axis —
      // not just the flame.
      const baseY = Y(0);
      const topY = Y(imgHeight);
      drawRealisticCandle(
        ctx, ix, baseY, topY, imgCandleW,
        flameTimeRef.current, true, !drawIsReal, isInverted,
      );
      ctx.restore();
    }
  }, [mode, fMag, f, isLens, lightOn, animProgress]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const w = container.offsetWidth;
      const dpr = window.devicePixelRatio || 1;
      const cssH = Math.max(280, Math.round(w * 0.65));
      canvas.style.width = w + "px";
      canvas.style.height = cssH + "px";
      canvas.width = w * dpr;
      canvas.height = cssH * dpr;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Resize use case canvas
  useEffect(() => {
    if (!showUseCase) return;
    const canvas = useCaseCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.offsetWidth;
    const dpr = window.devicePixelRatio || 1;
    const h = 200;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [showUseCase]);

  // Continuous redraw
  useEffect(() => {
    let raf: number;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  // Smooth drag handlers
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { cx, cy, scale } = layoutRef.current;
    const candleScreenX = cx - smoothURef.current * scale;
    if (Math.abs(px - candleScreenX) < 70 && Math.abs(py - cy) < 120) {
      dragRef.current.active = true;
      dragRef.current.offset = px - candleScreenX;
      dragRef.current.cx = cx;
      dragRef.current.scale = scale;
      dragRef.current.lastCommit = performance.now();
      dragRef.current.pendingU = smoothURef.current;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      // Mark that the user has physically grabbed the candle — required
      // before the lab-test quiz pop-up will appear.
      setCandleTouched(true);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left - dragRef.current.offset;
    const { cx, scale } = dragRef.current;
    const newU = (px - cx) / scale;
    const newUmag = Math.max(5, Math.min(350, -newU));
    smoothURef.current = newUmag;
    dragRef.current.targetU = newUmag;
    dragRef.current.pendingU = newUmag;
    const now = performance.now();
    if (now - dragRef.current.lastCommit > 80) {
      dragRef.current.lastCommit = now;
      setUMag(Math.round(newUmag));
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current.active = false;
    dragRef.current.targetU = smoothURef.current;
    setUMag(Math.round(smoothURef.current));
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    try { canvasRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  const { explanation, useCaseKey } = useMemo(() => {
    let exp = "";
    let key = "";
    if (mode === "concaveLens") { exp = "অবতল লেন্সে সবসময় একই পাশে অভাসী, সোজা, ছোট প্রতিবিম্ব তৈরি হয়।"; key = "glasses"; }
    else if (mode === "convexMirror") { exp = "উত্তল দর্পণে সবসময় আয়নার পেছনে অভাসী, সোজা, ছোট প্রতিবিম্ব। বড় দৃষ্টিক্ষেত্র।"; key = "rearview"; }
    else {
      const ratio = uMag / fMag;
      const isMirror = mode === "concaveMirror";
      if (Math.abs(ratio - 1) < 0.05) { exp = isMirror ? "বস্তু ঠিক F-এ। প্রতিবিম্ব অসীমে — সমান্তরাল রশ্মি।" : "বস্তু ঠিক F-এ। রশ্মি সমান্তরাল হয়ে যায় — প্রতিবিম্ব অসীমে।"; key = "torch"; }
      else if (ratio < 1) { exp = isMirror ? "বস্তু F-এর ভেতরে। প্রতিবিম্ব আয়নার পেছনে — অভাসী, সোজা, বড়।" : "বস্তু F-এর ভেতরে। প্রতিবিম্ব একই দিকে — অভাসী, সোজা, বড়।"; key = isMirror ? "shaving" : "magnifier"; }
      else if (Math.abs(ratio - 2) < 0.05) { exp = "বস্তু ঠিক ২F-এ। প্রতিবিম্ব ঠিক ২F-এ — বাস্তব, উল্টো, সমান।"; key = "equal"; }
      else if (ratio > 2) { exp = "বস্তু ২F-এর বাইরে। প্রতিবিম্ব F ও ২F-এর মাঝে — বাস্তব, উল্টো, ছোট।"; key = "camera"; }
      else { exp = isMirror ? "বস্তু F ও ২F-এর মাঝে। প্রতিবিম্ব ২F-এর বাইরে — বাস্তব, উল্টো, বড়।" : "বস্তু F ও ২F-এর মাঝে। প্রতিবিম্ব ২F-এর বাইরে — বাস্তব, উল্টো, বড়।"; key = "projector"; }
    }
    return { explanation: exp, useCaseKey: key };
  }, [mode, uMag, fMag]);

  const currentUseCases = USE_CASES[useCaseKey] || [];

  const positionIndicator = useMemo(() => {
    if (mode === "concaveLens" || mode === "convexMirror") return "";
    const r = uMag / fMag;
    if (Math.abs(r - 1) < 0.05) return "বস্তু F-এ";
    if (r < 1) return "বস্তু F-এর ভেতরে";
    if (Math.abs(r - 2) < 0.05) return "বস্তু 2F-এ";
    if (r > 2) return "বস্তু 2F-এর বাইরে";
    return "বস্তু F ও 2F-এর মাঝে";
  }, [mode, uMag, fMag]);

  const presets = [
    { label: "অসীম দূরত্ব", calc: () => Math.min(340, fMag * 5) },
    { label: "2F-এ বস্তু", calc: () => fMag * 2 },
    { label: "F ও 2F-এর মাঝে", calc: () => Math.round(fMag * 1.5) },
    { label: "F-এ বস্তু", calc: () => fMag },
    { label: "F-এর ভেতরে", calc: () => Math.max(5, Math.round(fMag * 0.5)) },
  ];

  return (
    <div className="ro-root">
      <style>{styles}</style>

      {/* LAB TEST BUTTON in header */}
      <div className="ro-header" style={{ position: "relative" }}>
        <div className="icon">🔬</div>
        <div>
          <h1 className="bn">আলোর প্রতিফলন</h1>
          <p>Ray Optics: Lens & Mirror</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="lab-test-btn" onClick={() => { setLabMode("name"); }}>
            🧪 ল্যাব টেস্ট
          </button>
        </div>
      </div>

      {/* LAB TEST — NAME ENTRY */}
      {labMode === "name" && (
        <div className="ro-card lab-overlay">
          <div className="lab-name-card">
            <div className="lab-name-icon">🧪</div>
            <h2 className="bn">ল্যাব টেস্ট শুরু করো!</h2>
            <p className="bn">৫টি কুইজে সঠিক উত্তর দিয়ে পয়েন্ট অর্জন করো</p>
            <input
              className="lab-name-input"
              placeholder="তোমার নাম লেখো..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && playerName.trim()) {
                  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
                  setLabQuests(shuffled);
                  setLabRound(0);
                  setLabScore(0);
                  setQuestCompleted(false);
                  setCandleTouched(false);
                  setSelectedAnswer(null);
                  setAnswerResult(null);
                  setLabMode("playing");
                }
              }}
            />
            <button
              className="lab-start-btn"
              disabled={!playerName.trim()}
              onClick={() => {
                const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
                setLabQuests(shuffled);
                setLabRound(0);
                setLabScore(0);
                setQuestCompleted(false);
                  setCandleTouched(false);
                setSelectedAnswer(null);
                setAnswerResult(null);
                setLabMode("playing");
              }}
            >
              🚀 শুরু করো
            </button>
            <button className="lab-cancel-btn" onClick={() => setLabMode("off")}>বাতিল</button>
          </div>
        </div>
      )}

      {/* LAB TEST — ACTIVE QUEST */}
      {labMode === "playing" && labQuests[labRound] && (() => {
        const quest = labQuests[labRound];
        const modeMatches = mode === quest.targetMode;
        const isInRange = modeMatches && uMag >= quest.targetURange[0] && uMag <= quest.targetURange[1];
        // Quiz only fires after the user has physically grabbed the candle
        // at least once AND placed it in the correct range.
        if (isInRange && candleTouched && !questCompleted) {
          // Auto-trigger quiz after small delay
          setTimeout(() => {
            setQuestCompleted(true);
            setLabMode("quiz");
          }, 800);
        }
        return (
          <div className="ro-card quest-card">
            <div className="quest-header">
              <div className="quest-icon-wrap">
                <span className="quest-icon">🎯</span>
              </div>
              <div>
                <div className="quest-label">ACTIVE QUEST</div>
                <div className="quest-title bn">কুইজ {toBn(labRound + 1)}/৫</div>
              </div>
              <div className="quest-score-badge">{toBn(labScore)} পয়েন্ট</div>
            </div>
            <div className="quest-instruction bn">"{quest.instruction}"</div>
            {!modeMatches && (
              <div className="quest-mode-hint bn">
                ⚠️ প্রথমে "<strong>{quest.targetModeLabel}</strong>" সিলেক্ট করো ↓
              </div>
            )}
            {modeMatches && !isInRange && (
              <div className="quest-mode-ok bn">
                ✅ {quest.targetModeLabel} সিলেক্ট হয়েছে — এবার মোমবাতি সরাও!
              </div>
            )}
            <div className="quest-hint bn">
              <span className="quest-hint-icon">👆</span> {quest.hint}
            </div>
            {isInRange && !candleTouched && (
              <div className="quest-mode-hint bn">
                ☝️ মোমবাতিটিকে একবার ছুঁয়ে দেখো — তারপর কুইজ আসবে!
              </div>
            )}
            {isInRange && candleTouched && (
              <div className="quest-success-flash bn">✅ সঠিক অবস্থান! কুইজ আসছে...</div>
            )}
            <button className="lab-cancel-btn" onClick={() => setLabMode("off")} style={{ marginTop: 8 }}>❌ টেস্ট বাতিল</button>
          </div>
        );
      })()}

      {/* LAB TEST — QUIZ POPUP */}
      {labMode === "quiz" && labQuests[labRound] && (() => {
        const quest = labQuests[labRound];
        return (
          <div className="ro-card quiz-card">
            <div className="quiz-header">
              <span className="quiz-icon">❓</span>
              <span className="quiz-round bn">প্রশ্ন {toBn(labRound + 1)}/৫</span>
            </div>
            <div className="quiz-question bn">{quest.quiz.question}</div>
            <div className="quiz-options">
              {quest.quiz.options.map((opt, i) => (
                <button
                  key={i}
                  className={
                    "quiz-option bn" +
                    (selectedAnswer === i ? (answerResult === "correct" ? " correct" : " wrong") : "") +
                    (answerResult && i === quest.quiz.correctIndex ? " correct" : "")
                  }
                  disabled={answerResult !== null}
                  onClick={() => {
                    setSelectedAnswer(i);
                    const isCorrect = i === quest.quiz.correctIndex;
                    setAnswerResult(isCorrect ? "correct" : "wrong");
                    if (isCorrect) setLabScore((s) => s + 20);

                    // Move to next quest or finish after delay
                    setTimeout(() => {
                      const nextRound = labRound + 1;
                      if (nextRound >= 5) {
                        // Finish — save to leaderboard
                        setLabScore(isCorrect ? labScore + 20 : labScore);
                        setLabMode("result");
                      } else {
                        setLabRound(nextRound);
                        setQuestCompleted(false);
                  setCandleTouched(false);
                        setSelectedAnswer(null);
                        setAnswerResult(null);
                        setLabMode("playing");
                      }
                    }, 1500);
                  }}
                >
                  <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              ))}
            </div>
            {answerResult && (
              <div className={"quiz-feedback bn " + answerResult}>
                {answerResult === "correct" ? "🎉 সঠিক! +২০ পয়েন্ট" : "❌ ভুল উত্তর"}
              </div>
            )}
          </div>
        );
      })()}

      {/* LAB TEST — RESULT */}
      {labMode === "result" && (
        <div className="ro-card result-card">
          <div className="result-trophy">{labScore >= 80 ? "🏆" : labScore >= 40 ? "🎖️" : "⭐"}</div>
          <h2 className="bn result-title">
            {labScore >= 80 ? "অসাধারণ!" : labScore >= 40 ? "ভালো চেষ্টা!" : "আবার চেষ্টা করো!"}
          </h2>
          <div className="result-name bn">{playerName}</div>
          <div className="result-score">{toBn(labScore)}<span>/১০০ পয়েন্ট</span></div>
          <div className="result-stars">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < labScore / 20 ? "star-filled" : "star-empty"}>★</span>
            ))}
          </div>
          <div className="result-btns">
            <button className="lab-start-btn" onClick={() => {
              const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
              setLabQuests(shuffled);
              setLabRound(0);
              setLabScore(0);
              setQuestCompleted(false);
                  setCandleTouched(false);
              setSelectedAnswer(null);
              setAnswerResult(null);
              setLabMode("playing");
            }}>🔄 আবার খেলো</button>
            <button className="lab-cancel-btn" onClick={() => { setLabMode("off"); }}>🏠 হোমে ফিরো</button>
          </div>
        </div>
      )}

      <div className="ro-card" style={{ display: "flex", justifyContent: "center" }}>
        <div className="tabs">
          {MODES.map((mm) => (
            <button
              key={mm.id}
              className={"tab-btn " + (mode === mm.id ? "active" : "")}
              onClick={() => { setMode(mm.id); setLightOn(false); setAnimProgress(0); setShowUseCase(null); }}
            >
              {mm.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ro-card canvas-card">
        <div className="canvas-wrap" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ touchAction: "none", cursor: dragRef.current.active ? "grabbing" : "grab" }}
          />
          <div className="canvas-hint bn">মোমবাতিকে ছুঁয়ে টেনে সরাও 👆</div>
        </div>
        <div className="action-row">
          <button
            className={"light-btn " + (lightOn ? "on" : "")}
            onClick={() => {
              if (lightOn) { setLightOn(false); setAnimProgress(0); }
              else { setLightOn(true); setAnimProgress(0); }
            }}
          >
            {lightOn ? "🔥 আলো নিভাও" : "🕯️ মোমবাতি জ্বালাও"}
          </button>
          <button className="reset-btn" onClick={() => { setAnimProgress(0); }}>↻ আবার</button>
        </div>
        <div className="legend">
          <span><i style={{ background: RAY_COLORS.ray1 }} /> সমান্তরাল রশ্মি</span>
          <span><i style={{ background: RAY_COLORS.ray2 }} /> কেন্দ্রীয় রশ্মি</span>
          <span><i style={{ background: RAY_COLORS.ray3 }} /> ফোকাস রশ্মি</span>
          <span className="legend-dash">- - অভাসী</span>
        </div>
      </div>

      <div className="ro-card">
        <div className="slider-row">
          <label><span>বস্তুর দূরত্ব (u)</span><span className="val">{fmtNum(u)} একক</span></label>
          <input type="range" min={5} max={350} value={uMag} onChange={(e) => setUMag(+e.target.value)} />
        </div>
        <div className="slider-row">
          <label><span>ফোকাস দূরত্ব (f)</span><span className="val">{fmtNum(f)} একক</span></label>
          <input type="range" min={20} max={150} value={fMag} onChange={(e) => setFMag(+e.target.value)} />
        </div>
        {positionIndicator && <span className="pos-indicator bn">{positionIndicator}</span>}
      </div>

      <div className="ro-card">
        <div className="presets">
          {presets.map((p, i) => (
            <button key={i} className="preset-btn" onClick={() => setUMag(Math.max(5, Math.min(350, p.calc())))}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* FORMULA CARD — proper fraction display */}
      <div className="ro-card formula-card">
        <div className="formula-display">
          <div className="fraction">
            <span className="num">1</span>
            <span className="den">v</span>
          </div>
          <span className="op">{isLens ? "−" : "+"}</span>
          <div className="fraction">
            <span className="num">1</span>
            <span className="den">u</span>
          </div>
          <span className="op">=</span>
          <div className="fraction">
            <span className="num">1</span>
            <span className="den">f</span>
          </div>
        </div>
        <div className="formula-values">
          <div className="fv-row">
            <div className="fraction small">
              <span className="num">1</span>
              <span className="den">{isFinite(v) ? fmtNum(v, 1) : "∞"}</span>
            </div>
            <span className="op">{isLens ? "−" : "+"}</span>
            <div className="fraction small">
              <span className="num">1</span>
              <span className="den">{fmtNum(u)}</span>
            </div>
            <span className="op">=</span>
            <div className="fraction small">
              <span className="num">1</span>
              <span className="den">{fmtNum(f)}</span>
            </div>
          </div>
        </div>
        <div className="data-rows">
          <div className="row"><span className="k">বস্তুর দূরত্ব (u)</span><span className="v">{fmtNum(u)}</span></div>
          <div className="row"><span className="k">ফোকাস দূরত্ব (f)</span><span className="v">{fmtNum(f)}</span></div>
          <div className="row"><span className="k">প্রতিবিম্বের দূরত্ব (v)</span><span className="v">{isFinite(v) ? fmtNum(v, 1) : "∞"}</span></div>
          <div className="row"><span className="k">বিবর্ধন (m)</span><span className="v">{isFinite(mag) ? fmtNum(mag, 2) + "×" : "∞"}</span></div>
          <div className="row"><span className="k">প্রতিবিম্বের ধরন</span><span className="v bn">{isFinite(v) ? `${isReal ? "বাস্তব" : "অভাসী"}, ${isErect ? "সোজা" : "উল্টো"}, ${sizeText}` : "তৈরি হয় না"}</span></div>
        </div>
      </div>

      {/* ANIMATED EXPLAIN CARD with use case */}
      <div className="ro-card explain-card-v2">
        <div className="explain-header">
          <div className="explain-icon-pulse">📍</div>
          <div className="explain-title bn">এই অবস্থায় কী হচ্ছে:</div>
        </div>
        <div className="explain-body bn">{explanation}</div>

        {labMode === "off" && currentUseCases.length > 0 && (
          <div className="use-case-section">
            <div className="use-case-label bn">🎯 ব্যবহার (Use Case)</div>
            <div className="use-case-cards">
              {currentUseCases.map((uc, i) => (
                <button
                  key={i}
                  className={"use-case-card" + (showUseCase === uc.animation ? " active" : "")}
                  onClick={() => setShowUseCase(showUseCase === uc.animation ? null : uc.animation)}
                >
                  <span className="uc-icon">{uc.icon}</span>
                  <div>
                    <div className="uc-title bn">{uc.title}</div>
                    <div className="uc-desc bn">{uc.desc}</div>
                  </div>
                  <span className="uc-arrow">{showUseCase === uc.animation ? "▲" : "▶"}</span>
                </button>
              ))}
            </div>
            {showUseCase && (
              <div className="use-case-animation">
                <canvas ref={useCaseCanvasRef} />
                <div className="uc-anim-label bn">
                  {currentUseCases.find(c => c.animation === showUseCase)?.title} — অ্যানিমেশন
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============== REALISTIC Candle drawing ==============
function drawRealisticCandle(
  ctx: CanvasRenderingContext2D,
  x: number, baseY: number, topY: number, w: number,
  t: number, lit: boolean, ghost = false, flipped = false,
) {
  ctx.save();
  if (flipped) {
    // Mirror the whole candle vertically through baseY (the principal axis).
    // Drawing "upward" toward topY now renders downward on screen, so the
    // entire candle (plate, body, wax, flame) appears upside-down — correct
    // for a real inverted image.
    ctx.translate(x, baseY);
    ctx.scale(1, -1);
    ctx.translate(-x, -baseY);
  }
  const bodyTop = topY + Math.abs(baseY - topY) * 0.18;
  const candleH = baseY - bodyTop;
  const halfW = Math.max(5, w);

  if (ghost) ctx.globalAlpha *= 0.7;

  // Shadow on ground
  if (!ghost) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(x, baseY + 2, halfW * 1.6, halfW * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Base plate with metallic look
  const plateGrad = ctx.createLinearGradient(x - halfW * 1.5, baseY - 4, x + halfW * 1.5, baseY + 4);
  if (ghost) {
    plateGrad.addColorStop(0, "rgba(120,120,130,0.4)");
    plateGrad.addColorStop(0.5, "rgba(160,160,170,0.5)");
    plateGrad.addColorStop(1, "rgba(120,120,130,0.4)");
  } else {
    plateGrad.addColorStop(0, "#5A4A3A");
    plateGrad.addColorStop(0.3, "#8A7A6A");
    plateGrad.addColorStop(0.5, "#A0907A");
    plateGrad.addColorStop(0.7, "#8A7A6A");
    plateGrad.addColorStop(1, "#5A4A3A");
  }
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.ellipse(x, baseY, halfW * 1.5, halfW * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Candle body with wax texture
  const bodyGrad = ctx.createLinearGradient(x - halfW, 0, x + halfW, 0);
  if (ghost) {
    bodyGrad.addColorStop(0, "rgba(180,180,195,0.35)");
    bodyGrad.addColorStop(0.3, "rgba(210,210,225,0.5)");
    bodyGrad.addColorStop(0.5, "rgba(230,230,240,0.55)");
    bodyGrad.addColorStop(0.7, "rgba(210,210,225,0.5)");
    bodyGrad.addColorStop(1, "rgba(180,180,195,0.35)");
  } else {
    bodyGrad.addColorStop(0, "#C4A870");
    bodyGrad.addColorStop(0.2, "#DCC9A0");
    bodyGrad.addColorStop(0.4, "#F5E9C9");
    bodyGrad.addColorStop(0.5, "#FFF5DC");
    bodyGrad.addColorStop(0.6, "#F5E9C9");
    bodyGrad.addColorStop(0.8, "#DCC9A0");
    bodyGrad.addColorStop(1, "#A89060");
  }
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(x - halfW, bodyTop, halfW * 2, candleH, [halfW * 0.3, halfW * 0.3, 2, 2]);
  ctx.fill();

  // Wax drip effect
  if (!ghost && halfW > 6) {
    const dripSeed = Math.floor(x * 7.3) % 5;
    for (let d = 0; d < 2 + dripSeed % 2; d++) {
      const dx = x + (d - 0.5) * halfW * 0.6;
      const dripLen = 8 + (d * 13.7 + dripSeed * 5.1) % 12;
      const dripGrad = ctx.createLinearGradient(dx, bodyTop, dx, bodyTop + dripLen);
      dripGrad.addColorStop(0, "rgba(245,233,201,0.9)");
      dripGrad.addColorStop(1, "rgba(220,201,160,0.6)");
      ctx.fillStyle = dripGrad;
      ctx.beginPath();
      ctx.moveTo(dx - 2, bodyTop);
      ctx.quadraticCurveTo(dx - 2.5, bodyTop + dripLen * 0.6, dx, bodyTop + dripLen);
      ctx.quadraticCurveTo(dx + 2.5, bodyTop + dripLen * 0.6, dx + 2, bodyTop);
      ctx.fill();
    }
  }

  // Melted wax pool at top
  if (!ghost) {
    ctx.fillStyle = "rgba(255,248,220,0.6)";
    ctx.beginPath();
    ctx.ellipse(x, bodyTop + 2, halfW * 0.85, halfW * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wick with curve
  ctx.strokeStyle = ghost ? "rgba(60,60,60,0.5)" : "#1A1A1A";
  ctx.lineWidth = 1.8;
  const wickLen = 8;
  const wickSway = lit ? Math.sin(t * 6) * 1.2 : 0;
  ctx.beginPath();
  ctx.moveTo(x, bodyTop);
  ctx.quadraticCurveTo(x + wickSway, bodyTop - wickLen * 0.5, x + wickSway * 0.5, bodyTop - wickLen);
  ctx.stroke();

  // Glowing ember at wick tip
  if (lit) {
    ctx.fillStyle = "rgba(255,120,20,0.9)";
    ctx.beginPath();
    ctx.arc(x + wickSway * 0.5, bodyTop - wickLen, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flame
  if (lit) {
    const flicker1 = Math.sin(t * 9) * 1.2 + Math.sin(t * 14.5) * 0.8;
    const flicker2 = Math.cos(t * 11.3) * 0.8;
    const fH = 20 + flicker1;
    const fW = 9 + flicker2 * 0.5;
    const fx = x + wickSway * 0.3;
    const fy = bodyTop - wickLen;

    // Large ambient glow
    const glow = ctx.createRadialGradient(fx, fy - fH * 0.3, 0, fx, fy - fH * 0.3, fH * 3.5);
    glow.addColorStop(0, "rgba(255,200,90,0.35)");
    glow.addColorStop(0.3, "rgba(255,160,50,0.12)");
    glow.addColorStop(0.6, "rgba(255,140,40,0.04)");
    glow.addColorStop(1, "rgba(255,140,40,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy - fH * 0.3, fH * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer flame (deep orange-red)
    const outerGrad = ctx.createLinearGradient(fx, fy, fx, fy - fH);
    outerGrad.addColorStop(0, "rgba(255,80,20,0.9)");
    outerGrad.addColorStop(0.4, "rgba(255,120,30,0.85)");
    outerGrad.addColorStop(0.8, "rgba(255,180,60,0.6)");
    outerGrad.addColorStop(1, "rgba(255,200,100,0.2)");
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(fx - fW, fy);
    ctx.bezierCurveTo(fx - fW * 1.1, fy - fH * 0.3, fx - fW * 0.5, fy - fH * 0.8, fx, fy - fH);
    ctx.bezierCurveTo(fx + fW * 0.5, fy - fH * 0.8, fx + fW * 1.1, fy - fH * 0.3, fx + fW, fy);
    ctx.quadraticCurveTo(fx, fy + 3, fx - fW, fy);
    ctx.fill();

    // Mid flame (bright orange)
    ctx.fillStyle = "#FF9930";
    ctx.beginPath();
    ctx.moveTo(fx - fW * 0.7, fy);
    ctx.bezierCurveTo(fx - fW * 0.75, fy - fH * 0.4, fx - fW * 0.3, fy - fH * 0.75, fx, fy - fH * 0.9);
    ctx.bezierCurveTo(fx + fW * 0.3, fy - fH * 0.75, fx + fW * 0.75, fy - fH * 0.4, fx + fW * 0.7, fy);
    ctx.quadraticCurveTo(fx, fy + 2, fx - fW * 0.7, fy);
    ctx.fill();

    // Inner flame (bright yellow)
    const innerGrad = ctx.createLinearGradient(fx, fy, fx, fy - fH * 0.7);
    innerGrad.addColorStop(0, "#FFE060");
    innerGrad.addColorStop(0.5, "#FFD23F");
    innerGrad.addColorStop(1, "rgba(255,240,180,0.4)");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(fx - fW * 0.4, fy - 1);
    ctx.bezierCurveTo(fx - fW * 0.45, fy - fH * 0.4, fx - fW * 0.15, fy - fH * 0.7, fx, fy - fH * 0.82);
    ctx.bezierCurveTo(fx + fW * 0.15, fy - fH * 0.7, fx + fW * 0.45, fy - fH * 0.4, fx + fW * 0.4, fy - 1);
    ctx.quadraticCurveTo(fx, fy + 1, fx - fW * 0.4, fy - 1);
    ctx.fill();

    // Hot blue-white core
    const coreGrad = ctx.createRadialGradient(fx, fy - fH * 0.15, 0, fx, fy - fH * 0.25, fH * 0.25);
    coreGrad.addColorStop(0, "rgba(200,220,255,0.95)");
    coreGrad.addColorStop(0.4, "rgba(180,200,255,0.6)");
    coreGrad.addColorStop(1, "rgba(255,255,200,0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.ellipse(fx, fy - fH * 0.2, fW * 0.2, fH * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smoke particles when lit
    if (!ghost) {
      for (let s = 0; s < 3; s++) {
        const st = (t * 2 + s * 1.3) % 3;
        if (st > 2) continue;
        const sy = fy - fH - st * 15;
        const sx = fx + Math.sin(t * 3 + s * 2) * 4;
        const sa = Math.max(0, 0.15 - st * 0.07);
        ctx.fillStyle = `rgba(200,200,220,${sa})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + st * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ============== Use Case Animation Drawing ==============
function drawUseCaseAnimation(ctx: CanvasRenderingContext2D, W: number, H: number, type: string, t: number) {
  // Dark background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0D1525");
  bg.addColorStop(1, "#162035");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const cy = H / 2;

  switch (type) {
    case "projector": {
      // Projector body
      ctx.fillStyle = "#2A2A3A";
      ctx.beginPath();
      ctx.roundRect(30, cy - 25, 60, 50, 8);
      ctx.fill();
      // Lens
      ctx.fillStyle = "#4488CC";
      ctx.beginPath();
      ctx.arc(90, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6AB0FF";
      ctx.beginPath();
      ctx.arc(90, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Light cone
      const coneProgress = Math.min(1, (t % 4) / 2);
      const coneEnd = 90 + coneProgress * (W - 130);
      const coneSpread = coneProgress * 60;
      const coneGrad = ctx.createLinearGradient(90, 0, coneEnd, 0);
      coneGrad.addColorStop(0, "rgba(255,220,120,0.5)");
      coneGrad.addColorStop(0.5, "rgba(255,220,120,0.2)");
      coneGrad.addColorStop(1, "rgba(255,220,120,0.05)");
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(90, cy - 3);
      ctx.lineTo(coneEnd, cy - coneSpread);
      ctx.lineTo(coneEnd, cy + coneSpread);
      ctx.lineTo(90, cy + 3);
      ctx.closePath();
      ctx.fill();

      // Screen
      ctx.fillStyle = "#F5F5F0";
      ctx.fillRect(W - 35, cy - 55, 8, 110);

      // Projected image on screen (appears as cone reaches)
      if (coneProgress > 0.8) {
        const alpha = Math.min(1, (coneProgress - 0.8) / 0.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        // Simple "picture" on screen
        ctx.fillStyle = "#3388CC";
        ctx.fillRect(W - 33, cy - 40, 4, 30);
        ctx.fillStyle = "#CC4433";
        ctx.fillRect(W - 33, cy - 5, 4, 20);
        ctx.fillStyle = "#44AA44";
        ctx.fillRect(W - 33, cy + 20, 4, 20);
        ctx.restore();
      }

      // Small slide in projector
      ctx.fillStyle = "rgba(255,255,200,0.8)";
      ctx.fillRect(72, cy - 6, 8, 12);

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ছোট স্লাইড", 60, H - 12);
      ctx.fillText("বড় পর্দা", W - 30, H - 12);
      break;
    }
    case "camera": {
      // Scene (tree + mountain)
      ctx.fillStyle = "#2D5A27";
      ctx.beginPath();
      ctx.moveTo(10, cy + 30);
      ctx.lineTo(40, cy - 40);
      ctx.lineTo(70, cy + 30);
      ctx.fill();
      ctx.fillStyle = "#4A3728";
      ctx.fillRect(37, cy + 10, 6, 20);

      // Camera body
      const camX = W - 80;
      ctx.fillStyle = "#1A1A2A";
      ctx.beginPath();
      ctx.roundRect(camX, cy - 20, 50, 40, 6);
      ctx.fill();
      ctx.fillStyle = "#3366AA";
      ctx.beginPath();
      ctx.arc(camX, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      // Light rays converging
      const progress = (t % 3) / 2;
      if (progress < 1) {
        ctx.strokeStyle = `rgba(255,220,120,${0.3 * (1 - progress * 0.5)})`;
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          const startY = cy + i * 15;
          const endX = 70 + progress * (camX - 70);
          const endY = cy + i * 15 * (1 - progress);
          ctx.beginPath();
          ctx.moveTo(70, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }

      // Film/sensor tiny image
      ctx.fillStyle = "rgba(255,255,200,0.6)";
      ctx.fillRect(camX + 35, cy - 4, 6, 8);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("বড় দৃশ্য", 40, H - 12);
      ctx.fillText("ছোট ছবি", camX + 25, H - 12);
      break;
    }
    case "magnifier": {
      // Small text
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ABC", 60, cy + 2);

      // Magnifying glass
      const lensX = W / 2;
      const bounce = Math.sin(t * 2) * 5;
      ctx.strokeStyle = "#8B7355";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(lensX, cy + bounce, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(180,220,255,0.15)";
      ctx.fill();
      // Handle
      ctx.strokeStyle = "#6B5335";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(lensX + 21, cy + 21 + bounce);
      ctx.lineTo(lensX + 45, cy + 45 + bounce);
      ctx.stroke();

      // Magnified text
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("ABC", lensX, cy + 5 + bounce);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.fillText("ছোট জিনিস বড় দেখায়", W / 2, H - 12);
      break;
    }
    case "torch": {
      // Torch body
      ctx.fillStyle = "#2A2A3A";
      ctx.beginPath();
      ctx.roundRect(20, cy - 15, 50, 30, [4, 0, 0, 4]);
      ctx.fill();
      ctx.fillStyle = "#3A3A4A";
      ctx.beginPath();
      ctx.roundRect(65, cy - 20, 15, 40, [0, 4, 4, 0]);
      ctx.fill();

      // Parallel rays
      const rayLen = Math.min(1, (t % 3) / 1.5) * (W - 100);
      ctx.strokeStyle = "rgba(255,220,120,0.6)";
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(80, cy + i * 6);
        ctx.lineTo(80 + rayLen, cy + i * 6);
        ctx.stroke();
      }

      // Bulb
      ctx.fillStyle = "#FFE080";
      ctx.beginPath();
      ctx.arc(75, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("সমান্তরাল আলোর রশ্মি", W / 2, H - 12);
      break;
    }
    case "glasses": {
      // Eye
      const eyeX = W - 80;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(eyeX, cy, 20, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#4488AA";
      ctx.beginPath();
      ctx.arc(eyeX, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(eyeX, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Concave lens (glasses)
      const lx = W / 2;
      ctx.strokeStyle = "rgba(180,220,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, cy - 30);
      ctx.quadraticCurveTo(lx + 8, cy, lx, cy + 30);
      ctx.stroke();

      // Diverging rays
      const progress2 = (t % 3) / 2;
      ctx.strokeStyle = "rgba(255,200,100,0.4)";
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        const startX = 30;
        const endX = startX + progress2 * (lx - startX);
        ctx.beginPath();
        ctx.moveTo(startX, cy + i * 8);
        ctx.lineTo(endX, cy + i * 8);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("দূরদৃষ্টি সংশোধন", W / 2, H - 12);
      break;
    }
    case "rearview": {
      // Car outline
      ctx.fillStyle = "#3A3A4A";
      ctx.beginPath();
      ctx.roundRect(W - 70, cy - 20, 50, 40, 8);
      ctx.fill();

      // Convex mirror
      ctx.strokeStyle = "rgba(180,220,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W - 75, cy - 20);
      ctx.quadraticCurveTo(W - 85, cy, W - 75, cy + 20);
      ctx.stroke();

      // Wide field of view lines
      const spread = 1 + Math.sin(t * 1.5) * 0.3;
      ctx.strokeStyle = "rgba(255,200,100,0.3)";
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(10, cy + i * 12 * spread);
        ctx.lineTo(W - 80, cy + i * 3);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("বড় দৃষ্টিক্ষেত্র", W / 2, H - 12);
      break;
    }
    case "shaving": {
      // Face outline
      ctx.strokeStyle = "rgba(255,200,150,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(60, cy, 20, 28, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Eyes
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(52, cy - 6, 3, 0, Math.PI * 2);
      ctx.arc(68, cy - 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Concave mirror
      const mx = W - 60;
      ctx.strokeStyle = "rgba(180,220,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mx, cy - 40);
      ctx.quadraticCurveTo(mx + 12, cy, mx, cy + 40);
      ctx.stroke();

      // Large virtual image behind mirror
      const scale2 = 1.5 + Math.sin(t * 1.5) * 0.1;
      ctx.strokeStyle = "rgba(255,200,150,0.3)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(mx + 30, cy, 20 * scale2, 28 * scale2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("বড় প্রতিবিম্ব", W / 2, H - 12);
      break;
    }
    case "equal": {
      // Object
      ctx.fillStyle = "rgba(100,200,100,0.7)";
      ctx.fillRect(50, cy - 30, 10, 60);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("বস্তু", 55, cy + 50);

      // Lens at center
      ctx.strokeStyle = "rgba(180,220,255,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2, cy - 50);
      ctx.quadraticCurveTo(W / 2 - 8, cy, W / 2, cy + 50);
      ctx.quadraticCurveTo(W / 2 + 8, cy, W / 2, cy - 50);
      ctx.stroke();

      // Equal inverted image
      const flip = Math.min(1, (t % 4) / 2);
      ctx.fillStyle = `rgba(200,100,100,${0.7 * flip})`;
      ctx.fillRect(W - 60, cy - 30 * flip, 10, 60 * flip);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * flip})`;
      ctx.fillText("প্রতিবিম্ব", W - 55, cy + 50);
      break;
    }
    default:
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("অ্যানিমেশন লোড হচ্ছে...", W / 2, cy);
  }
}

const styles = `
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
.ro-root { font-family: 'Hind Siliguri','Inter',sans-serif; color: var(--ten-ink); background: var(--surface); min-height: 100vh; padding: 12px; box-sizing: border-box; line-height: 1.5; max-width: 1152px; margin: 0 auto; }
.ro-root *, .ro-root *::before, .ro-root *::after { box-sizing: border-box; }
.ro-header { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; margin-bottom: 12px; border-top: 4px solid var(--ten-red); display: flex; align-items: center; gap: 12px; }
.ro-header .icon { width: 40px; height: 40px; background: #FFF5F6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.ro-header h1 { font-size: 16px; font-weight: 700; margin: 0; }
.ro-header p { font-size: 11px; color: var(--gray-500); margin: 2px 0 0; font-family: 'Inter',sans-serif; }
.ro-card { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 12px; }
.canvas-card { padding: 10px; }
.tabs { display: inline-flex; gap: 0; border-radius: 9999px; border: 1px solid var(--border); background: #F3F4F6; padding: 4px; flex-wrap: wrap; }
.tab-btn { padding: 8px 16px; border: none; background: transparent; border-radius: 9999px; font-weight: 600; font-size: 13px; color: var(--gray-600); cursor: pointer; transition: all 180ms; min-height: 36px; font-family: inherit; white-space: nowrap; }
.tab-btn.active { background: var(--ten-red); color: #fff; box-shadow: 0 2px 8px rgba(232,0,29,0.25); }
.canvas-wrap { position: relative; width: 100%; background: #0B1220; border-radius: 12px; overflow: hidden; }
canvas { display: block; width: 100%; }
.canvas-hint { position: absolute; top: 8px; left: 10px; font-size: 11px; color: rgba(255,255,255,0.55); pointer-events: none; }
.action-row { display: flex; gap: 8px; margin-top: 10px; }
.light-btn { flex: 1; min-height: 48px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--success-dark); background: var(--success); color: #fff; font-weight: 700; font-size: 15px; font-family: inherit; cursor: pointer; transition: all 180ms; box-shadow: 0 2px 8px rgba(28,171,85,0.25); }
.light-btn:active { transform: scale(0.98); }
.light-btn.on { background: linear-gradient(135deg,#FF7B2A,#E8001D); border-color: #931212; box-shadow: 0 0 0 3px rgba(232,0,29,0.15), 0 4px 14px rgba(232,123,42,0.4); }
.reset-btn { min-height: 48px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: #fff; color: var(--gray-600); font-weight: 600; font-size: 13px; font-family: inherit; cursor: pointer; }
.legend { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: var(--gray-600); margin-top: 10px; padding: 0 4px; }
.legend span { display: inline-flex; align-items: center; gap: 4px; }
.legend i { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }
.legend-dash { font-family: monospace; }
.slider-row { margin-bottom: 14px; }
.slider-row:last-child { margin-bottom: 0; }
.slider-row label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.slider-row .val { color: var(--ten-red); font-family: 'Inter',sans-serif; }
input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; background: transparent; cursor: pointer; }
input[type="range"]::-webkit-slider-runnable-track { height: 6px; background: var(--gray-200); border-radius: 999px; }
input[type="range"]::-moz-range-track { height: 6px; background: var(--gray-200); border-radius: 999px; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 24px; width: 24px; border-radius: 50%; background: var(--success); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); margin-top: -9px; }
input[type="range"]::-moz-range-thumb { height: 24px; width: 24px; border-radius: 50%; background: var(--success); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
input[type="range"]:focus { outline: none; }
.pos-indicator { display: inline-block; background: var(--info-soft); color: #0B5C7A; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
.presets { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -webkit-overflow-scrolling: touch; }
.presets::-webkit-scrollbar { display: none; }
.preset-btn { flex: 0 0 auto; padding: 10px 14px; background: #fff; border: 1px solid var(--border); border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--gray-600); min-height: 44px; cursor: pointer; font-family: inherit; white-space: nowrap; }
.preset-btn:active { transform: scale(0.97); background: var(--gray-100); }

/* FORMULA CARD — proper fractions */
.formula-card { padding: 16px; }
.formula-display { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #FFF8E7, #FFFAEF); border-radius: 12px; margin-bottom: 12px; }
.formula-values { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; background: var(--surface); border-radius: 8px; margin-bottom: 12px; }
.fv-row { display: flex; align-items: center; gap: 8px; }
.fraction { display: inline-flex; flex-direction: column; align-items: center; position: relative; padding: 0 4px; }
.fraction .num { font-family: 'Inter',serif; font-weight: 700; font-size: 20px; line-height: 1.2; }
.fraction .den { font-family: 'Inter',serif; font-weight: 600; font-size: 18px; line-height: 1.2; color: var(--ten-red); border-top: 2px solid var(--ten-ink); padding-top: 2px; min-width: 20px; text-align: center; }
.fraction.small .num { font-size: 14px; }
.fraction.small .den { font-size: 13px; border-top-width: 1.5px; }
.op { font-family: 'Inter',serif; font-size: 22px; font-weight: 700; color: var(--gray-600); }
.formula-values .op { font-size: 16px; }
.data-rows { }
.row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed var(--gray-200); }
.row:last-child { border-bottom: none; }
.row .k { color: var(--gray-600); }
.row .v { font-weight: 700; font-family: 'Inter',sans-serif; }
.row .v.bn { font-family: 'Hind Siliguri',sans-serif; }

/* EXPLAIN CARD v2 — animated */
.explain-card-v2 { background: linear-gradient(135deg, #FFF8E7 0%, #FFFAEF 50%, #FFF5F0 100%); border: 1px solid #F5E2A8; padding: 16px; overflow: hidden; }
.explain-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.explain-icon-pulse { font-size: 22px; animation: pulse-glow 2s ease-in-out infinite; }
@keyframes pulse-glow {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.2); filter: brightness(1.3); }
}
.explain-title { font-weight: 700; font-size: 15px; color: #8A6100; }
.explain-body { font-size: 14px; line-height: 1.7; color: #5A4000; animation: fadeSlideIn 0.4s ease-out; }
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Use case section */
.use-case-section { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #E8D5A0; }
.use-case-label { font-weight: 700; font-size: 13px; color: #8A6100; margin-bottom: 10px; }
.use-case-cards { display: flex; flex-direction: column; gap: 8px; }
.use-case-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.8); border: 1px solid #F0DFA0; border-radius: 12px; cursor: pointer; transition: all 250ms ease; font-family: inherit; text-align: left; width: 100%; }
.use-case-card:hover { background: rgba(255,255,255,1); box-shadow: 0 2px 8px rgba(0,0,0,0.06); transform: translateY(-1px); }
.use-case-card.active { background: #FFF; border-color: var(--ten-red); box-shadow: 0 0 0 2px rgba(232,0,29,0.1); }
.uc-icon { font-size: 24px; flex-shrink: 0; }
.uc-title { font-weight: 700; font-size: 13px; color: var(--ten-ink); }
.uc-desc { font-size: 11px; color: var(--gray-500); margin-top: 2px; }
.uc-arrow { font-size: 10px; color: var(--gray-500); margin-left: auto; flex-shrink: 0; }
.use-case-animation { margin-top: 10px; border-radius: 10px; overflow: hidden; background: #0D1525; animation: expandIn 0.3s ease-out; }
.use-case-animation canvas { display: block; width: 100%; height: 200px; }
.uc-anim-label { text-align: center; color: rgba(255,255,255,0.5); font-size: 10px; padding: 6px; background: rgba(0,0,0,0.3); }
@keyframes expandIn {
  from { max-height: 0; opacity: 0; }
  to { max-height: 260px; opacity: 1; }
}

/* LAB TEST STYLES */
.lab-test-btn { padding: 6px 12px; background: linear-gradient(135deg, #FF6B35, #E8001D); color: #fff; border: none; border-radius: 999px; font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 8px rgba(232,0,29,0.25); transition: all 200ms; min-height: 36px; }
.lab-test-btn:hover { transform: scale(1.05); box-shadow: 0 4px 14px rgba(232,0,29,0.35); }
.quest-mode-hint { background: #FFF3CD; color: #856404; padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 8px; border: 1px solid #FFEEBA; }
.quest-mode-ok { background: #D4EDDA; color: #155724; padding: 10px 14px; border-radius: 10px; font-size: 13px; margin-bottom: 8px; border: 1px solid #C3E6CB; }
/* Lab name entry */
.lab-overlay { animation: fadeSlideIn 0.3s ease-out; text-align: center; }
.lab-name-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0; }
.lab-name-icon { font-size: 48px; animation: pulse-glow 2s ease-in-out infinite; }
.lab-name-card h2 { font-size: 18px; font-weight: 700; margin: 0; }
.lab-name-card p { font-size: 13px; color: var(--gray-500); margin: 0; }
.lab-name-input { width: 100%; max-width: 280px; padding: 12px 16px; border-radius: 12px; border: 2px solid var(--border); font-size: 15px; font-family: inherit; text-align: center; transition: border-color 200ms; outline: none; }
.lab-name-input:focus { border-color: var(--ten-red); }
.lab-start-btn { padding: 12px 28px; background: linear-gradient(135deg, #1CAB55, #0E7B4F); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; min-height: 48px; box-shadow: 0 4px 14px rgba(28,171,85,0.3); transition: all 200ms; }
.lab-start-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lab-start-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(28,171,85,0.4); }
.lab-cancel-btn { padding: 8px 16px; background: none; border: 1px solid var(--border); border-radius: 10px; font-size: 12px; color: var(--gray-500); font-family: inherit; cursor: pointer; transition: all 200ms; }

/* Quest card */
.quest-card { background: linear-gradient(135deg, #FFF5F6 0%, #FFFAEF 100%); border: 2px solid #F5C6CB; animation: fadeSlideIn 0.4s ease-out; position: relative; overflow: hidden; }
.quest-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #E8001D, #FF6B35, #FFD23F); }
.quest-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.quest-icon-wrap { width: 48px; height: 48px; background: #FFF0F0; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.quest-icon { font-size: 26px; animation: pulse-glow 2s ease-in-out infinite; }
.quest-label { font-size: 10px; font-weight: 800; color: #E8001D; letter-spacing: 1.5px; text-transform: uppercase; font-family: 'Inter',sans-serif; }
.quest-title { font-size: 16px; font-weight: 700; }
.quest-score-badge { margin-left: auto; background: linear-gradient(135deg, #FFD23F, #FF9930); color: #5A3800; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; font-family: inherit; }
.quest-instruction { background: rgba(255,255,255,0.7); padding: 14px 16px; border-radius: 12px; font-size: 14px; line-height: 1.7; color: var(--ten-ink); margin-bottom: 10px; }
.quest-hint { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--success-dark); }
.quest-hint-icon { font-size: 14px; }
.quest-success-flash { background: #D4EDDA; color: #155724; padding: 10px; border-radius: 10px; text-align: center; font-weight: 700; margin-top: 8px; animation: pulse-glow 1s ease-in-out infinite; }

/* Quiz card */
.quiz-card { animation: fadeSlideIn 0.3s ease-out; background: linear-gradient(135deg, #EFF6FF, #F5F3FF); border: 2px solid #93C5FD; }
.quiz-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.quiz-icon { font-size: 28px; }
.quiz-round { font-size: 13px; font-weight: 700; color: #3B82F6; }
.quiz-question { font-size: 15px; font-weight: 700; line-height: 1.6; margin-bottom: 14px; }
.quiz-options { display: flex; flex-direction: column; gap: 8px; }
.quiz-option { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border: 2px solid var(--border); border-radius: 12px; font-size: 14px; font-family: inherit; cursor: pointer; transition: all 200ms; text-align: left; min-height: 48px; }
.quiz-option:hover:not(:disabled) { border-color: #3B82F6; background: #F0F7FF; }
.quiz-option.correct { border-color: #1CAB55; background: #D4EDDA; }
.quiz-option.wrong { border-color: #E8001D; background: #FFF5F6; }
.opt-letter { width: 26px; height: 26px; border-radius: 50%; background: var(--gray-100); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; color: var(--gray-600); flex-shrink: 0; font-family: 'Inter',sans-serif; }
.quiz-option.correct .opt-letter { background: #1CAB55; color: #fff; }
.quiz-option.wrong .opt-letter { background: #E8001D; color: #fff; }
.quiz-feedback { text-align: center; padding: 10px; margin-top: 10px; border-radius: 10px; font-weight: 700; font-size: 14px; animation: fadeSlideIn 0.3s ease-out; }
.quiz-feedback.correct { background: #D4EDDA; color: #155724; }
.quiz-feedback.wrong { background: #FFF5F6; color: #931212; }

/* Result card */
.result-card { text-align: center; padding: 24px 16px; animation: fadeSlideIn 0.4s ease-out; background: linear-gradient(135deg, #FFF8E7 0%, #FFFAEF 50%, #FFF5F0 100%); border: 2px solid #F5E2A8; }
.result-trophy { font-size: 64px; animation: pulse-glow 2s ease-in-out infinite; }
.result-title { font-size: 22px; font-weight: 800; margin: 8px 0 4px; }
.result-name { font-size: 16px; color: var(--gray-600); font-weight: 600; }
.result-score { font-size: 36px; font-weight: 900; color: var(--ten-red); font-family: 'Inter',sans-serif; margin: 12px 0 8px; }
.result-score span { font-size: 16px; font-weight: 600; color: var(--gray-500); }
.result-stars { font-size: 28px; margin-bottom: 16px; }
.star-filled { color: #FFD23F; }
.star-empty { color: var(--gray-200); }
.result-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
`;
