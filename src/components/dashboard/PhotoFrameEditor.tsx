import { useRef, useState, useCallback, useEffect } from "react";
import { Move } from "lucide-react";

interface PhotoFrameEditorProps {
  src: string;
  offsetX: number;
  offsetY: number;
  onChange: (x: number, y: number) => void;
}

export default function PhotoFrameEditor({ src, offsetX, offsetY, onChange }: PhotoFrameEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: offsetX, y: offsetY });
  const [localX, setLocalX] = useState(offsetX);
  const [localY, setLocalY] = useState(offsetY);

  useEffect(() => { setLocalX(offsetX); setLocalY(offsetY); }, [offsetX, offsetY]);

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const handleStart = useCallback((clientX: number, clientY: number) => {
    dragging.current = true;
    startPos.current = { x: clientX, y: clientY };
    startOffset.current = { x: localX, y: localY };
  }, [localX, localY]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((clientX - startPos.current.x) / rect.width) * 100;
    const dy = ((clientY - startPos.current.y) / rect.height) * 100;
    // Invert: dragging right moves object-position left
    const nx = clamp(startOffset.current.x - dx);
    const ny = clamp(startOffset.current.y - dy);
    setLocalX(nx);
    setLocalY(ny);
  }, []);

  const handleEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(Math.round(localX), Math.round(localY));
  }, [localX, localY, onChange]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg cursor-grab active:cursor-grabbing select-none border border-border"
        style={{ aspectRatio: "4 / 3.2", background: "#2a2a2a" }}
        onMouseDown={(e) => { e.preventDefault(); handleStart(e.clientX, e.clientY); }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
      >
        <img
          src={src}
          alt="Preview do enquadramento"
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${localX}% ${localY}%` }}
          draggable={false}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 text-white/80 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium backdrop-blur-sm">
            <Move className="h-3.5 w-3.5" />
            Arraste para ajustar
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        💡 Use uma foto vertical com boa iluminação e rosto visível para melhor resultado
      </p>
    </div>
  );
}
