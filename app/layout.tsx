import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CARE Collective - Preview",
  description: "Southwest Missouri CARE Collective - Building community through mutual aid (Preview Version)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <footer className="bg-secondary text-secondary-foreground py-4 mt-16">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm opacity-75">
                🚀 Preview Version - Built for Client Review
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}