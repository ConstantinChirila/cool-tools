import Link from "next/link";
import { FeedbackLink } from "@/components/feedback-link";
import { LegalPage, legalMetadata } from "@/components/legal-page";
import { PrivacyIllustration } from "@/components/privacy-illustration";

export const metadata = legalMetadata(
  "/privacy",
  "Privacy Policy",
  "Bits & Bobs has no accounts, no cookies, no ads and no idea who you are. Here is what the site does and doesn't see, in plain English.",
);

const NOT_COLLECTED = [
  ["Your name", "No. We never ask, and the input box for it does not exist."],
  ["Your email", "No. There is no sign-up, no newsletter, no “just one more thing before you see the result”."],
  ["Cookies", "None. Not tracking ones, not “essential” ones, not even the edible kind."],
  ["An account", "There isn’t one. I checked."],
  ["Ads and ad trackers", "None. No pixel, no retargeting, no shoes following you round the internet."],
  ["Your salary, mortgage, gravel", "Typed into your browser, calculated in your browser, never sent to me."],
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      tint="mint"
      gist="The short version: I don't know who you are, and I would like to keep it that way."
      updated="1 October 2026"
    >
      <PrivacyIllustration />

      <section>
        <h2>What we collect about you</h2>
        <dl className="sticker divide-y-2 divide-foreground overflow-hidden rounded-3xl bg-card">
          {NOT_COLLECTED.map(([thing, answer]) => (
            <div key={thing} className="grid gap-1 p-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="font-heading font-extrabold text-foreground">{thing}</dt>
              <dd>{answer}</dd>
            </div>
          ))}
        </dl>
        <p>
          Most privacy policies have a section called &ldquo;How we use your information&rdquo;. We don&apos;t
          have your information, so this one is more of a mood.
        </p>
      </section>

      <section>
        <h2>The honest bits</h2>
        <p>
          A website cannot run on nothing at all, so here is everything that does happen, in full. It is not a
          long list.
        </p>
        <ul>
          <li>
            <strong>Your browser remembers things for you.</strong>{" "}So you don&apos;t have to retype them, the
            site saves your chosen currency, the last four tools you opened and the numbers you put into each
            calculator. This lives in your browser&apos;s local storage, on your device. I cannot see it, it
            never leaves your machine, and clearing the site&apos;s data in your browser wipes it. It is three
            entries, named <code className="font-mono text-sm">bitsbobs:currency</code>,{" "}
            <code className="font-mono text-sm">bitsbobs:recent</code> and{" "}
            <code className="font-mono text-sm">bitsbobs:state</code>.
          </li>
          <li>
            <strong>Share links carry your numbers.</strong>{" "}When you copy a link to a result, the inputs are
            in the web address. That is the whole point of the link, but it does mean the person you send it
            to can see them. Maybe don&apos;t paste your salary calculation into the company chat. The text
            tools (diff checker, encoder, JWT decoder) never put what you pasted into a link.
          </li>
          <li>
            <strong>Page view counting.</strong>{" "}The site uses{" "}
            <a href="https://www.cloudflare.com/web-analytics/">Cloudflare Web Analytics</a>, which was chosen
            because it sets no cookies and does no fingerprinting. It tells me things like &ldquo;the mortgage
            calculator got 212 visits on Tuesday, mostly from the UK, mostly on phones, and loaded in under a
            second&rdquo;. It does not tell me who any of those people were. It does record which page address
            was visited, so if you open a share link, the numbers in it pass through that count. Nobody could
            tie them to you, but it would be dishonest not to mention it.
          </li>
          <li>
            <strong>The server sees your IP address.</strong>{" "}The site is hosted on{" "}
            <a href="https://vercel.com/legal/privacy-policy">Vercel</a>. Like every web server since 1991, it
            has to know where to send the page back to, so it briefly sees your IP address and user agent in
            its standard request logs. I don&apos;t look at them, store them anywhere else, or do anything
            with them.
          </li>
          <li>
            <strong>Fonts are served from here.</strong>{" "}Not from Google. No font request means no font
            tracking.
          </li>
          <li>
            <strong>If you install the app on your phone,</strong>{" "}it quietly checks a one-number file on this
            site when you reopen it, to see whether there is a newer version. That is all it fetches.
          </li>
          <li>
            <strong>If you email me,</strong>{" "}I will have your email address, because that is how email
            works. I use it to reply and for nothing else. There is no mailing list to accidentally add you to.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Under UK GDPR you have the right to see the personal data an organisation holds about you, to have
          it corrected, to have it deleted, to object to its processing, and several others. You have all of
          those rights here too. In practice, exercising them is a bit of an anticlimax: if you ask me what I
          hold about you, the answer is Fig. 1 above. If you ask me to delete it, consider it done. If
          you&apos;d like to delete the bits your own browser remembers, clear this site&apos;s data in your
          browser settings; that one is in your hands, not mine.
        </p>
        <p>
          If you think I&apos;ve got any of this wrong, you can complain to the{" "}
          <a href="https://ico.org.uk/">Information Commissioner&apos;s Office</a>, though I would be grateful
          for an <FeedbackLink subject="Bits & Bobs: privacy">email</FeedbackLink> first so I can fix it.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          The site is a pile of calculators. It is suitable for anyone old enough to wonder how much a patio
          costs, and it collects exactly as much data from a child as from an adult, which is none.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If any of this ever changes, for example if I add a feature that needs to send something to a
          server, this page will change first, the date at the top will move, and the jar will get a new
          drawing. Until then: nothing to see here, quite literally. The{" "}
          <Link href="/terms">terms of use</Link> are next door if you enjoyed this.
        </p>
      </section>
    </LegalPage>
  );
}
