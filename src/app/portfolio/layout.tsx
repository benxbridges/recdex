import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Benjamin Cronin — Songwriter, Producer, Artist",
  description:
    "Portfolio of Benjamin Cronin — songwriter, producer, and one half of Gilligan Moss. Credits include work with Glass Animals, Sia, Goose, ODESZA, and Adventure Time.",
  openGraph: {
    title: "Benjamin Cronin — Songwriter, Producer, Artist",
    description:
      "Songwriter, producer, and one half of Gilligan Moss. Released on Foreign Family Collective / Ninja Tune.",
    type: "website",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="portfolio-body">{children}</body>
    </html>
  );
}
