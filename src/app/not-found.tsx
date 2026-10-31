import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import Link from "next/link";
import { Container, Section } from "@/components/container";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <Panel view="overview" back="/">
    <Section>
      <Container className="max-w-xl text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Страница не найдена</h1>
        <Link href="/" className="hand-link mt-6 inline-block">На главную</Link>
      </Container>
    </Section>
    </Panel>
  );
}
