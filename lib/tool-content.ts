/**
 * Long-form explanatory content shown under each calculator. Written for
 * people first (how the tool works, what the numbers mean) and reused for
 * FAQ structured data. One file per tool in content/<slug>.ts.
 */

export interface ContentSection {
  /** Rendered as an h2. */
  heading: string;
  /** Plain-text paragraphs. Use ** ** around a phrase for bold. */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

export interface Faq {
  question: string;
  /** One to three sentences, plain text. */
  answer: string;
}

export interface ToolContent {
  /** One or two short paragraphs shown directly under the calculator. */
  intro: string[];
  sections: ContentSection[];
  faqs: Faq[];
}
