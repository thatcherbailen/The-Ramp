import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Bailen's Command Centre",
  description: "Sales Command Centre — calls, jobs, prep, news, calendar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
