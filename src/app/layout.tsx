import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GameweekProvider } from "@/contexts/GameweekContext";
import NotificationProvider from "@/components/NotificationProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fantasy Jordan Pro League | الدوري الأردني فانتازي",
  description: "Official Fantasy Football Game of the Jordan Pro League. العب الدوري الأردني فانتازي وكون فريقك ونافس أصدقائك.",
  keywords: "Jordanian Fantasy, الدوري الأردني, فانتازي, كرة القدم, Fantasy Football",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Fantasy Jordan Pro League | الدوري الأردني فانتازي",
    description: "Official Fantasy Football Game of the Jordan Pro League. العب الدوري الأردني فانتازي وكون فريقك ونافس أصدقائك.",
    url: "https://jordanianleaugefantsayy.vercel.app/",
    siteName: "Fantasy Jordan Pro League",
    images: [
      {
        url: "https://jordanianleaugefantsayy.vercel.app/images/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://jordanianleaugefantsayy.vercel.app/",
    languages: {
      "en": "https://jordanianleaugefantsayy.vercel.app/en",
      "ar": "https://jordanianleaugefantsayy.vercel.app/ar",
    },
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <GameweekProvider>
                {children}
                <NotificationProvider />
              </GameweekProvider>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}





