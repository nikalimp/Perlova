import { site } from "@/content/site";
import { Container, Section } from "./container";

export function Cta({
  title = "Пригласить автора или задать вопрос",
  text = "Евгения Перлова проводит встречи в школах и библиотеках и отвечает на рабочие вопросы: издание, переводы, фестивали.",
}: { title?: string; text?: string }) {
  return (
    <Section className="border-t">
      <Container className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{text}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a href={`mailto:${site.contacts.email}`} data-goal="contact_email" className="hand-link">Написать на почту</a>
          <a href={site.contacts.telegram} target="_blank" rel="noopener" data-goal="contact_tg" className="hand-link">Telegram</a>
        </div>
      </Container>
    </Section>
  );
}
