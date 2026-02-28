const legendItems = [
  { color: "hsl(209, 80%, 25%)", label: "Deep Sea" },
  { color: "hsl(198, 70%, 40%)", label: "Shallow Water" },
  { color: "hsl(43, 50%, 65%)", label: "Sand/Beach" },
  { color: "hsl(119, 55%, 35%)", label: "Greenery" },
  { color: "hsl(101, 50%, 28%)", label: "Forest" },
  { color: "hsl(29, 10%, 45%)", label: "Stone/Rock" },
  { color: "hsl(209, 15%, 85%)", label: "Snow/Ice" },
];

export default function TerrainLegend() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm border border-border/50"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
