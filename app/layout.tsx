import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import "./globals.css";

// Inter is a variable font: one file covers 300–700. Italic is used for the form's data note.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

// Be Vietnam Pro is not variable, so only the three weights the design uses are loaded.
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KlearStack | Document AI with Fraud, Compliance & Audit Checks",
  description:
    "KlearStack processes your messiest documents live — 99% accuracy, proprietary AI and pilots ready in under 7 hours. Calculate your savings and book a free live demo.",
  applicationName: "KlearStack",
  openGraph: {
    title: "KlearStack | Document AI with Fraud, Compliance & Audit Checks",
    description: "No templates. No setup calls. See your documents processed live, right now.",
    type: "website",
    siteName: "KlearStack",
  },
};

export const viewport: Viewport = {
  themeColor: "#edf5ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${beVietnam.variable}`}>
      <body>{children}</body>
    </html>
  );
}
