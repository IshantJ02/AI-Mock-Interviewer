import type { Metadata } from "next";
import { Space_Grotesk, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NextUp.ai - Mock Interviewer",
  description: "Ace your next tech interview with AI-powered mock interviews. Real-time feedback, code execution, and company-specific preparation.",
  keywords: "AI mock interview, coding interview prep, DSA practice, Google interview, Amazon interview",
  openGraph: {
    title: "NextUp.ai - Mock Interviewer",
    description: "Ace your next tech interview with AI-powered mock interviews",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${caveat.variable} font-sans antialiased`}
        suppressHydrationWarning
        style={{
          background: '#faf8f4',
          color: '#2d2926',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        }}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fffdf8',
              color: '#2d2926',
              border: '1px solid #e0dbd2',
              borderRadius: '10px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            },
          }}
        />
      </body>
    </html>
  );
}
