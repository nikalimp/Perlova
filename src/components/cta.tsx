import { site } from "@/content/site";
import { Container, Section } from "./container";
import { Button } from "./ui/button";

export function Cta({
  title = "Пригласить автора или задать вопрос",
  text = "Евгения Перлова проводит встречи в школах и библиотеках и отвечает на рабочие вопросы: издание, переводы, фестивали.",
}: { title?: string; text?: string }) {
  return (
    <Section className="border-t">
      <Container className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{text}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full"><a href={`mailto:${site.contacts.email}`} data-goal="contact_email">Написать на почту</a></Button>
          <Button asChild size="lg" variant="outline" className="rounded-full"><a href={site.contacts.telegram} target="_blank" rel="noopener" data-goal="contact_tg">Telegram</a></Button>
        </div>
      </Container>
    </Section>
  );
}
