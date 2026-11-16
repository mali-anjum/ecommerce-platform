// app/layout.tsx - CORRECTED
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import CommonLayout from "@/components/common/organisms/AppShell";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeInitializer from "@/components/layout/ThemeInitializer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Meridian",
  description:
    "A marketplace for shoppers, sellers, and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Add futuristic favicon and meta tags */}
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

      </head>
      <body className="antialiased">
        <ThemeInitializer />
        
          <AuthProvider>
            <CommonLayout>{children}</CommonLayout>
          </AuthProvider>
        <Toaster />
        
        {/* Performance monitoring script */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Performance monitoring
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    if (window.performance) {
                      const perfData = window.performance.timing;
                      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                      console.log('🚀 Page loaded in:', loadTime + 'ms');
                    }
                  }, 0);
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}