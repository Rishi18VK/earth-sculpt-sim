import { useRef, useCallback, useEffect, useState } from "react";

interface MobileControlsProps {
  visible: boolean;
  onInput: (input: { moveX: number; moveZ: number; cameraX: number; cameraY: number }) => void;
  onJump?: () => void;
  onSprintChange?: (sprinting: boolean) => void;
}

export default function MobileControls({ visible, onInput, onJump, onSprintChange }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const cameraTouchId = useRef<number | null>(null);
  const lastCameraPos = useRef({ x: 0, y: 0 });
  const inputRef = useRef({ moveX: 0, moveZ: 0, cameraX: 0, cameraY: 0 });
  const rafRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const JOYSTICK_RADIUS = 45;

  const updateInput = useCallback(() => {
    onInput({ ...inputRef.current });
    // Reset camera deltas each frame
    inputRef.current.cameraX = 0;
    inputRef.current.cameraY = 0;
    rafRef.current = requestAnimationFrame(updateInput);
  }, [onInput]);

  useEffect(() => {
    if (!visible || !isMobile) return;
    rafRef.current = requestAnimationFrame(updateInput);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, isMobile, updateInput]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const rect = joystickRef.current?.getBoundingClientRect();
      if (rect && touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        joystickTouchId.current = touch.identifier;
      } else {
        cameraTouchId.current = touch.identifier;
        lastCameraPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current && joystickRef.current && knobRef.current) {
        const rect = joystickRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = touch.clientX - cx;
        let dy = touch.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > JOYSTICK_RADIUS) {
          dx = (dx / dist) * JOYSTICK_RADIUS;
          dy = (dy / dist) * JOYSTICK_RADIUS;
        }
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
        inputRef.current.moveX = dx / JOYSTICK_RADIUS;
        inputRef.current.moveZ = dy / JOYSTICK_RADIUS;
      }
      if (touch.identifier === cameraTouchId.current) {
        const dx = touch.clientX - lastCameraPos.current.x;
        const dy = touch.clientY - lastCameraPos.current.y;
        inputRef.current.cameraX = dx * 0.15;
        inputRef.current.cameraY = dy * 0.08;
        lastCameraPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        inputRef.current.moveX = 0;
        inputRef.current.moveZ = 0;
        if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
      }
      if (touch.identifier === cameraTouchId.current) {
        cameraTouchId.current = null;
        inputRef.current.cameraX = 0;
        inputRef.current.cameraY = 0;
      }
    }
  }, []);

  if (!visible || !isMobile) return null;

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Right side is camera touch area */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto opacity-30">
        <div className="w-16 h-16 rounded-full border-2 border-foreground/30 flex items-center justify-center">
          <span className="text-[10px] text-foreground/50 font-mono">LOOK</span>
        </div>
      </div>

      {/* Joystick */}
      <div
        ref={joystickRef}
        className="absolute bottom-20 left-8 pointer-events-auto"
        style={{ touchAction: "none" }}
      >
        <div className="relative w-[120px] h-[120px] rounded-full bg-card/40 backdrop-blur-sm border border-border/40 flex items-center justify-center">
          <div
            ref={knobRef}
            className="w-12 h-12 rounded-full bg-primary/60 border-2 border-primary shadow-lg"
            style={{ transition: "none" }}
          />
        </div>
      </div>

      {/* Zoom buttons */}
      <div className="absolute bottom-20 right-8 flex flex-col gap-2 pointer-events-auto">
        <button
          className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border/40 text-foreground font-bold text-lg"
          onTouchStart={() => { window.dispatchEvent(new WheelEvent("wheel", { deltaY: -50 })); }}
        >
          +
        </button>
        <button
          className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border/40 text-foreground font-bold text-lg"
          onTouchStart={() => { window.dispatchEvent(new WheelEvent("wheel", { deltaY: 50 })); }}
        >
          −
        </button>
      </div>
    </div>
  );
}
