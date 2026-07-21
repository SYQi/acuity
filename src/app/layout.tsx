import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acuity — Cataract Outcomes Dashboard",
  description:
    "Acuity: cataract outcomes dashboard for AIA — Dr Roy Tan and Dr Soh Yu Qiang, Woodlands Hospital.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
