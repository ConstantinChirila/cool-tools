import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ToolContent } from "@/lib/tool-content";
import { tools, type Tool } from "@/lib/tools";

/** Renders "**bold**" spans inside a plain-text paragraph. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Long-form explanation under a calculator: intro, sections, FAQs and
 * related tools. Plain headings and paragraphs, nothing collapsed, so
 * every word is visible to readers and crawlers alike.
 */
export function ToolGuide({ tool, content }: { tool: Tool; content: ToolContent }) {
  const related = [
    ...tools.filter((t) => t.category === tool.category && t.slug !== tool.slug),
    ...tools.filter((t) => t.category !== tool.category),
  ].slice(0, 3);

  return (
    <div className="mx-auto mt-14 max-w-3xl space-y-12">
      <section className="space-y-4 text-lg font-semibold leading-relaxed">
        {content.intro.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </section>

      {content.sections.map((section) => (
        <section key={section.heading} className="space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{section.heading}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="font-semibold leading-relaxed text-foreground/85">
              <Rich text={p} />
            </p>
          ))}
          {section.bullets && (
            <ul className="list-disc space-y-2 pl-6 font-semibold leading-relaxed text-foreground/85 marker:text-foreground">
              {section.bullets.map((b, i) => (
                <li key={i}>
                  <Rich text={b} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Frequently asked questions</h2>
        <dl className="space-y-5">
          {content.faqs.map((faq) => (
            <div key={faq.question} className="sticker rounded-3xl bg-card p-5">
              <dt className="font-heading text-lg font-extrabold">{faq.question}</dt>
              <dd className="mt-2 font-semibold leading-relaxed text-foreground/85">
                <Rich text={faq.answer} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">More bits and bobs</h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {related.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/tools/${t.slug}`}
                className="sticker-sm group flex h-full flex-col gap-2 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                style={{ background: t.tint }}
              >
                <span className="flex items-center justify-between font-heading text-lg font-extrabold">
                  {t.name}
                  <ArrowUpRight className="size-4 shrink-0" strokeWidth={2.5} />
                </span>
                <span className="text-sm font-semibold leading-snug">{t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
