"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/brand";

export type Stroke = { x: number; y: number }[];
const W = 480;
const H = 160;

/** Draw-your-signature box: mouse, finger or stylus (pointer events). Hands back the strokes in canvas units. */
export function SignaturePad({ onSave, busy }: { onSave: (strokes: Stroke[], canvas: { w: number; h: number }) => void; busy?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = W * ratio;
    c.height = H * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#261C18";
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    strokes.current.push([point(e)]);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const s = strokes.current[strokes.current.length - 1];
    const p = point(e);
    const last = s[s.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return;
    s.push(p);
    const ctx = ref.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setCount(strokes.current.reduce((n, s) => n + s.length, 0));
  };
  const clear = () => {
    strokes.current = [];
    setCount(0);
    ref.current!.getContext("2d")!.clearRect(0, 0, W, H);
  };

  return (
    <div className="gw-pad">
      <canvas
        ref={ref}
        className="gw-pad__canvas"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-label="Signature drawing area. Draw with your mouse, finger or stylus."
        role="img"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <div className="gs-row">
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!count}>Clear</Button>
        <Button type="button" size="sm" disabled={count < 8 || busy} onClick={() => onSave(strokes.current.map((s) => s.map((p) => ({ x: +p.x.toFixed(1), y: +p.y.toFixed(1) }))), { w: W, h: H })}>
          Save signature
        </Button>
      </div>
    </div>
  );
}
