/** Site-wide constants for metadata, canonical URLs and structured data. */

export const SITE_NAME = "Bits & Bobs";

/** Public origin. Set NEXT_PUBLIC_SITE_URL in production; the fallback keeps local builds working. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bitsbobs.app").replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Free online calculators for UK money and everyday maths: take-home salary, mortgage repayments and overpayments, compound interest, percentages and more. No sign-up, no email.";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
