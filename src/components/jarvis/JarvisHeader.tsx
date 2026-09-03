import { ArrowLeft, Download, Link2, Power, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  locationName: string;
  quality: string;
  jarvisOn: boolean;
  dirty: boolean;
  onBack: () => void;
  onToggle: () => void;
  onQuality: () => void;
  onShare: () => void;
  onExport: () => void;
}

export default function JarvisHeader({ locationName, quality, jarvisOn, dirty, onBack, onToggle, onQuality, onShare, onExport }: Props) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border/40 bg-background/75 px-3 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" aria-label="Back to explorer" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button><div className="min-w-0"><div className="flex items-center gap-2"><p className="text-eyebrow text-primary">Terra / JARVIS</p>{dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Unsaved changes" />}</div><h1 className="truncate text-base font-bold md:text-lg">{locationName}</h1></div></div>
      <div className="flex shrink-0 items-center gap-1.5"><Badge variant={jarvisOn ? "default" : "outline"} className="hidden gap-1 px-2.5 uppercase sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-current" />{jarvisOn ? "Online" : "Standby"}</Badge><Button variant="ghost" size="icon" aria-label="Change quality preset" onClick={onQuality}><Settings2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Share model" onClick={onShare}><Link2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Export model" onClick={onExport}><Download className="h-4 w-4" /></Button><Button size="sm" variant={jarvisOn ? "secondary" : "default"} onClick={onToggle} className="gap-1.5"><Power className="h-4 w-4" />{jarvisOn ? "JARVIS ON" : "JARVIS OFF"}</Button></div>
    </header>
  );
}
