import Link from 'next/link'

export default function TypographyPage() {
  const headings = [
    { tag: "h1", size: "text-5xl", weight: "font-bold", sample: "Heading 1" },
    { tag: "h2", size: "text-4xl", weight: "font-bold", sample: "Heading 2" },
    { tag: "h3", size: "text-3xl", weight: "font-semibold", sample: "Heading 3" },
    { tag: "h4", size: "text-2xl", weight: "font-semibold", sample: "Heading 4" },
    { tag: "h5", size: "text-xl", weight: "font-medium", sample: "Heading 5" },
    { tag: "h6", size: "text-lg", weight: "font-medium", sample: "Heading 6" },
  ];

  const textStyles = [
    { name: "Body", classes: "text-base", sample: "This is body text. It's used for main content and should be easily readable." },
    { name: "Body Large", classes: "text-lg", sample: "This is large body text for emphasis or introductions." },
    { name: "Body Small", classes: "text-sm", sample: "This is small body text for captions or secondary information." },
    { name: "Caption", classes: "text-xs text-muted-foreground", sample: "This is caption text for labels and metadata." },
    { name: "Link", classes: "text-primary underline hover:text-primary-contrast", sample: "This is a link" },
    { name: "Button", classes: "font-medium", sample: "BUTTON TEXT" },
  ];

  const weights = [
    { name: "Regular", weight: "font-normal", value: "400" },
    { name: "Bold", weight: "font-bold", value: "700" },
    { name: "Black", weight: "font-black", value: "900" },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:text-primary-contrast">← Back to Home</Link>
        </div>
        
        <h1 className="mb-8 text-4xl font-bold text-foreground">
          CARE Collective Typography
        </h1>
        
        <div className="mb-12 rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">Font Family</h2>
          <p className="mb-2 text-lg">
            <span className="font-bold">Primary:</span> Overlock
          </p>
          <p className="text-sm text-muted-foreground">
            Fallback: system-ui, -apple-system, sans-serif
          </p>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Headings</h2>
          <div className="space-y-6 rounded-lg border bg-card p-6">
            {headings.map((heading) => (
              <div key={heading.tag} className="border-b pb-4 last:border-0">
                <div className="mb-2 flex items-baseline gap-4">
                  <code className="rounded bg-muted px-2 py-1 text-xs">
                    {heading.tag}
                  </code>
                  <code className="text-xs text-muted-foreground">
                    {heading.size} {heading.weight}
                  </code>
                </div>
                <p className={`${heading.size} ${heading.weight}`}>
                  {heading.sample}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Text Styles</h2>
          <div className="space-y-4 rounded-lg border bg-card p-6">
            {textStyles.map((style) => (
              <div key={style.name} className="border-b pb-4 last:border-0">
                <div className="mb-2 flex items-baseline gap-4">
                  <span className="font-semibold">{style.name}</span>
                  <code className="text-xs text-muted-foreground">
                    {style.classes}
                  </code>
                </div>
                <p className={style.classes}>{style.sample}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Font Weights</h2>
          <div className="grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-3">
            {weights.map((weight) => (
              <div key={weight.name}>
                <p className="mb-1 text-sm text-muted-foreground">
                  {weight.name} ({weight.value})
                </p>
                <p className={`text-2xl ${weight.weight}`}>
                  Overlock
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">Usage Guidelines</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use Overlock for all text to maintain brand consistency</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Maintain clear hierarchy with appropriate heading sizes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Ensure minimum 16px font size for body text</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use bold weight sparingly for emphasis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Keep line length between 45-75 characters for optimal readability</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}