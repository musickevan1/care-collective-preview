import Link from 'next/link'

export default function ColorsPage() {
  const colors = [
    {
      name: "Primary Terracotta",
      variable: "primary",
      hex: "#BC6547",
      usage: "Primary buttons, CTAs, links",
      textColor: "white",
    },
    {
      name: "Secondary Deep Navy",
      variable: "secondary",
      hex: "#324158",
      usage: "Headers, footers, secondary buttons",
      textColor: "white",
    },
    {
      name: "Accent Warm Tan",
      variable: "accent",
      hex: "#C39778",
      usage: "Borders, dividers, muted elements",
      textColor: "black",
    },
    {
      name: "Background Soft Cream",
      variable: "background",
      hex: "#FBF2E9",
      usage: "Main background color",
      textColor: "black",
    },
    {
      name: "Dark Accent Brown",
      variable: "dark-accent",
      hex: "#483129",
      usage: "Dark text, emphasis",
      textColor: "white",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:text-primary-contrast">← Back to Home</Link>
        </div>
        
        <h1 className="mb-8 text-4xl font-bold text-foreground">
          CARE Collective Color System
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {colors.map((color) => (
            <div
              key={color.variable}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              <div
                className="h-32 w-full"
                style={{ backgroundColor: color.hex }}
              />
              <div className="p-4">
                <h3 className="font-semibold">{color.name}</h3>
                <p className="text-sm text-muted-foreground">
                  var(--{color.variable})
                </p>
                <p className="mt-1 text-sm">{color.hex}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {color.usage}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Text:</span>
                  <span
                    className="rounded px-2 py-1 text-xs"
                    style={{
                      backgroundColor: color.hex,
                      color: color.textColor,
                    }}
                  >
                    {color.textColor}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold">Usage Guidelines</h2>
          <div className="rounded-lg border bg-card p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  Use <strong>Primary Terracotta</strong> for main CTAs and
                  important interactive elements
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary">•</span>
                <span>
                  Use <strong>Deep Navy</strong> for headers, footers, and
                  secondary buttons
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>
                  Use <strong>Warm Tan</strong> for borders, dividers, and
                  subtle backgrounds
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Maintain WCAG AA contrast ratios for all text
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  Prefer black text on light colors, white text on dark colors
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}