import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "How does RAG work? — Interactive Retrieval-Augmented Generation Demo";
const description =
  "An interactive demo that visualizes every step of the RAG pipeline: document chunking, vector embeddings, cosine similarity search, and LLM-augmented generation with source citations. Built with Next.js, Vercel AI SDK, and Anthropic Claude. Runs fully locally without an API key.";
const url = "https://how-does-rag-work.vercel.app";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "RAG",
    "Retrieval-Augmented Generation",
    "how RAG works",
    "RAG tutorial",
    "RAG demo",
    "RAG pipeline",
    "vector embeddings",
    "cosine similarity",
    "document chunking",
    "LLM",
    "AI",
    "Next.js",
    "Vercel AI SDK",
    "Anthropic Claude",
    "TF-IDF",
    "vector database",
    "semantic search",
    "prompt engineering",
    "AI agents",
  ],
  authors: [{ name: "Jesse Peplinski", url: "https://jessepeplinski.github.io" }],
  creator: "Jesse Peplinski",
  metadataBase: new URL(url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title,
    description,
    url,
    siteName: "How does RAG work?",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "How does RAG work?",
    description:
      "Interactive demo visualizing every step of the RAG pipeline — chunking, embedding, similarity search, and augmented generation.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "How does RAG work?",
              description,
              url,
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              author: {
                "@type": "Person",
                name: "Jesse Peplinski",
                url: "https://jessepeplinski.github.io",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Interactive RAG pipeline visualization",
                "Document chunking and embedding",
                "Cosine similarity search with animated chart",
                "Query term analysis with importance weights",
                "Bidirectional hover highlighting between chat and sources",
                "Source citations with [Source N] notation",
                "Works without API key using TF-IDF fallback",
              ],
            }),
          }}
        />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
