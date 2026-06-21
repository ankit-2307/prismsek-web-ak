import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrismSek — Light, Refracted",
  description:
    "PrismSek: a scroll-driven cinematic journey through light, refraction, and the full spectrum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
