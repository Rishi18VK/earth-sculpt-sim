import { useState } from "react";
import { Send, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AdminSection, Panel, Pill, fmtDate } from "../AdminUI";
import { mockAnnouncements, type Announcement } from "@/lib/admin/mock-data";

export default function NotificationsSection() {
  const [items, setItems] = useState<Announcement[]>(mockAnnouncements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Announcement["channel"]>("in_app");
  const [audience, setAudience] = useState<Announcement["audience"]>("all");

  const publish = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setItems((prev) => [
      { id: `an_${Date.now()}`, title: title.trim(), body: body.trim(), audience, channel, publishedAt: new Date().toISOString() },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    toast.success("Announcement published");
  };

  return (
    <AdminSection title="Notifications" description="Announcements, push notifications and release notes.">
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2 space-y-3">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> New announcement
          </h2>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl" aria-label="Announcement title" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" rows={5} className="rounded-xl resize-none" aria-label="Announcement message" />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Announcement["channel"])}
              aria-label="Channel"
              className="rounded-xl bg-background border border-input px-3 py-2 text-sm"
            >
              <option value="in_app">In-app</option>
              <option value="email">Email</option>
              <option value="release_note">Release note</option>
            </select>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Announcement["audience"])}
              aria-label="Audience"
              className="rounded-xl bg-background border border-input px-3 py-2 text-sm"
            >
              <option value="all">All users</option>
              <option value="supporters">Supporters</option>
              <option value="admins">Admins</option>
            </select>
          </div>
          <Button className="w-full rounded-xl premium-gradient border-0 text-white gap-2" onClick={publish}>
            <Send className="h-4 w-4" /> Publish
          </Button>
        </Panel>

        <div className="lg:col-span-3 space-y-3">
          {items.map((a) => (
            <Panel key={a.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{a.title}</h3>
                <div className="flex gap-1.5 shrink-0">
                  <Pill tone="info">{a.channel.replace("_", " ")}</Pill>
                  <Pill tone={a.publishedAt ? "success" : "warning"}>{a.publishedAt ? "published" : "draft"}</Pill>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{a.body}</p>
              <p className="text-xs text-muted-foreground">
                {a.audience} · {a.publishedAt ? fmtDate(a.publishedAt) : "not scheduled"}
              </p>
            </Panel>
          ))}
        </div>
      </div>
    </AdminSection>
  );
}
