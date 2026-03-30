import type { Metadata } from "next"
import "./globals.css"
import AuthSessionProvider from "@/components/session-provider"

export const metadata: Metadata = {
  title: "Marketing Hub — Seazone",
  description: "Artefatos e ferramentas do time de Marketing da Seazone",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
