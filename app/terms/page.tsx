import Link from "next/link";
import { FeedbackLink } from "@/components/feedback-link";
import { LegalPage } from "@/components/legal-page";
import { LEGAL_PAGES, legalMetadata } from "@/lib/seo";

export const metadata = legalMetadata(
  "terms",
  "Terms of Use",
  "The rules for using Bits & Bobs: free calculators that try hard to be right, come with no guarantee, and are not financial advice.",
);

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      tint="yellow"
      gist="The tools are free and I try hard to make them right. You use them at your own risk. That is most of it."
      updated={LEGAL_PAGES.terms.updated}
    >
      <section>
        <h2>What this is</h2>
        <p>
          Bits &amp; Bobs is a collection of free online calculators and small tools, built and looked after
          by one person (<a href="https://constantinchirila.com">Constantin Chirila</a>, &ldquo;I&rdquo; or
          &ldquo;me&rdquo; below). Using the site means you agree to these terms. If you don&apos;t, the back
          button is right there and I won&apos;t take it personally.
        </p>
      </section>

      <section>
        <h2>Accuracy, or the lack of a guarantee</h2>
        <p>
          I put real effort into getting the numbers right. Tax rates, thresholds and allowances are checked
          against official sources such as gov.uk, the engines are tested against published worked examples,
          and I review the figures when a Budget changes them. Even so:
        </p>
        <ul>
          <li>
            <strong>Every result is an estimate.</strong>{" "}Real life has edge cases a calculator cannot see:
            your tax code, your employer&apos;s pension scheme, the way your lender rounds, how wet the sand is.
          </li>
          <li>
            <strong>Rates change.</strong>{" "}A tool can be right on Monday and out of date after a Budget on
            Wednesday. The date each tool was last updated is shown on its page.
          </li>
          <li>
            <strong>I make mistakes.</strong>{" "}If you find one, please{" "}
            <FeedbackLink subject="Bits & Bobs: a mistake in a tool">tell me</FeedbackLink> and I will fix it.
          </li>
        </ul>
        <p>
          So: I cannot guarantee that any result is accurate, complete or current, and I don&apos;t. The site is
          provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, with no warranties of any kind, express
          or implied, to the fullest extent the law allows.
        </p>
      </section>

      <section>
        <h2>Not advice</h2>
        <p>
          Nothing on this site is financial, tax, legal, investment, building, gardening or archery advice.
          The tools exist to help you think, not to decide for you. Before you do anything that costs real
          money, such as taking a mortgage, going contracting, buying a car on finance or ordering five tonnes
          of gravel, check the figures with the people who will actually be charging you, or with a qualified
          professional.
        </p>
      </section>

      <section>
        <h2>Use at your own risk</h2>
        <p>
          You use Bits &amp; Bobs entirely at your own risk. To the fullest extent permitted by law, I am not
          liable for any loss or damage of any kind arising from your use of the site or reliance on anything
          it shows, including, without limitation, a mortgage you couldn&apos;t afford, a tax bill that was
          larger than the tool said, a patio that came up two slabs short, or an arrow that went somewhere
          unexpected. Nothing in these terms limits liability that cannot be limited by law.
        </p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>
          The site may be down, slow, changed or missing a tool at any time, without notice. Tools get added,
          reworked and occasionally retired. I will try not to remove anything you were in the middle of
          using, but I can&apos;t promise it.
        </p>
      </section>

      <section>
        <h2>Your inputs and shared links</h2>
        <p>
          The calculators run in your browser. Numbers you type stay on your device unless you choose to copy
          a share link, in which case they are in that link for anyone you give it to. Texts you paste into
          the text tools are never put in a link. The details are in the{" "}
          <Link href="/privacy">privacy policy</Link>, which is short.
        </p>
      </section>

      <section>
        <h2>Using the site sensibly</h2>
        <p>
          Please don&apos;t attack the site, scrape it at a rate that makes the server sad, or try to break
          it on purpose. Automated bulk use is not what it is for. You are welcome to link to any page.
        </p>
      </section>

      <section>
        <h2>Who owns what</h2>
        <p>
          The results a tool gives you are yours to use however you like. The site itself, its design, its
          text and its code are mine, and you may not copy or republish them without asking. The sticker look
          took a while.
        </p>
      </section>

      <section>
        <h2>Other websites</h2>
        <p>
          Some pages link to other sites (gov.uk, suppliers, data sources). Those are run by other people, with
          their own terms and their own ideas about privacy. I am not responsible for them.
        </p>
      </section>

      <section>
        <h2>Changes and the boring legal bit</h2>
        <p>
          I may update these terms from time to time. The date at the top tells you when. Carrying on using
          the site after a change means you accept the new version. These terms are governed by the law of
          England and Wales, and any dispute belongs to the courts of England and Wales.
        </p>
        <p>
          Questions? <FeedbackLink subject="Bits & Bobs: terms">Email me</FeedbackLink>.
        </p>
      </section>
    </LegalPage>
  );
}
