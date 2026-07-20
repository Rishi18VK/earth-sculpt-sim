import { useCallback, useEffect, useState } from "react";
import { Maximize2, Minimize2, Camera, Share2, Check } from "lucide-react";
import { toast } from "sonner";

interface ExplorerActionsProps {
  biomeLabel: string;
  shareState: Record<string, string | number | boolean | undefined | null>;
}

const captureCanvas = (): string | null => {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) return null;
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
};

const buildShareUrl = (state: ExplorerActionsProps["shareState"]) => {
  const url = new URL(window.location.href);
  url.search = "";
  Object.entries(state).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === false) return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
};

const ExplorerActions = ({ biomeLabel, shareState }: ExplorerActionsProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [justShared, setJustShared] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Fullscreen not available");
    }
  }, []);

  const takeScreenshot = useCallback(() => {
    // Give the renderer a frame to ensure buffer is fresh
    requestAnimationFrame(() => {
      const data = captureCanvas();
      if (!data) {
        toast.error("Could not capture screenshot");
        return;
      }
      const a = document.createElement("a");
      a.href = data;
      a.download = `terra-explorer-${biomeLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Screenshot saved");
    });
  }, [biomeLabel]);

  const share = useCallback(async () => {
    const url = buildShareUrl(shareState);
    const text = `Explore ${biomeLabel} on Terra Explorer`;

    // Try native share with screenshot image
    const dataUrl = captureCanvas();
    if (navigator.share && dataUrl && (navigator as any).canShare) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "terra-explorer.png", { type: "image/png" });
        if ((navigator as any).canShare({ files: [file] })) {
          await navigator.share({ title: "Terra Explorer", text, url, files: [file] });
          setJustShared(true);
          setTimeout(() => setJustShared(false), 2000);
          return;
        }
      } catch {
        /* fall through */
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Terra Explorer", text, url });
        setJustShared(true);
        setTimeout(() => setJustShared(false), 2000);
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setJustShared(true);
      setTimeout(() => setJustShared(false), 2000);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }, [shareState, biomeLabel]);

  const btn =
    "h-9 w-9 flex items-center justify-center rounded-lg bg-card/80 backdrop-blur-md border border-border/50 text-foreground/90 hover:text-primary hover:border-primary/60 transition-colors";

  return (
    <div className="flex flex-col gap-2 pointer-events-auto">
      <button onClick={toggleFullscreen} className={btn} aria-label="Toggle fullscreen" title="Fullscreen (F)">
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
      <button onClick={takeScreenshot} className={btn} aria-label="Take screenshot" title="Screenshot">
        <Camera className="w-4 h-4" />
      </button>
      <button onClick={share} className={btn} aria-label="Share location" title="Share this view">
        {justShared ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default ExplorerActions;
