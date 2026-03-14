import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lexara AI | Cognitive Exam Assistant",
  description: "Lexara transforms exam questions into cognitively accessible formats for dyslexic students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-highlight selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
