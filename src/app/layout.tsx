
import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import DashboardButton from "@/components/dashboard-button";
import { MainFooter } from "@/components/main-footer";

const inconsolata = Inconsolata({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TrustStars",
  description: "Verified GitHub repositories and developer profiles.",
  icons: {
    icon: '/web-app-manifest-192x192.png',
    shortcut: '/web-app-manifest-192x192.png',
    apple: '/web-app-manifest-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col", inconsolata.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardButton />
          {children}
          <MainFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
