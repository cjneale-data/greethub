import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { NO_INDEX, SITE_NAME, isIndexable, siteUrl } from "@/lib/seo";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "700", "800"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SITE_TITLE = "GreetHub — cards and picture books that sound like you";
const SITE_DESCRIPTION = "Custom illustrated greeting cards and picture books, drawn from your story, printed and mailed for you.";

// No canonical here: a canonical on the root layout would be inherited by every page. Pages set their own (lib/seo.ts).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: { icon: "/logo-mark.svg" },
  openGraph: { title: SITE_TITLE, description: SITE_DESCRIPTION, siteName: SITE_NAME, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  ...(isIndexable() ? {} : { robots: NO_INDEX }),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>
        <a className="gh-skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
