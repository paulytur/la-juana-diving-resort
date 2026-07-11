import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { RESORT } from "@/lib/constants";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: RESORT.name,
    template: `%s | ${RESORT.name}`,
  },
  description: RESORT.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
