import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-gray-950 text-white antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e2e8f0',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
