import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OncoDash", template: "%s · OncoDash" },
  description: "Painel de monitoramento da autorização prévia de medicamentos oncológicos no SUS.",
  // Mesma marca do cabeçalho (cruz branca no quadrado verde). favicon.ico fica como reserva.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "48x48" }],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
