import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-oswald", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://will-a-robot-take-your-job.vercel.app"),
  title: "Will a robot take your job?",
  description:
    "Barclays is cutting 5,000 jobs and blames AI. Type in your job to see how exposed it is, how it ranks against every other job in Britain, and what the robots can already do.",
  openGraph: {
    title: "Will a robot take your job?",
    description: "Barclays is cutting 5,000 jobs and blames AI. Check your own job against 408 UK occupations.",
    type: "article",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
};

// Applies a saved theme before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={oswald.variable} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
