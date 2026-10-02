/**
 * Ready-made patterns for the regex tester, each with a sample text that
 * shows it working (and the near misses it rightly skips). Tests run every
 * pattern on its sample, and the page runs them during render, so a pattern
 * here must be quick on its own sample.
 */

export interface LibraryPattern {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  /** Suggested replacement, loaded into replace mode. */
  replacement?: string;
  note: string;
  sample: string;
  /** How many matches the sample gives: checked by the tests. */
  expected: number;
}

export const LIBRARY: readonly LibraryPattern[] = [
  {
    id: "date",
    name: "ISO date",
    pattern: String.raw`(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])`,
    flags: "g",
    replacement: "$<day>/$<month>/$<year>",
    note: "YYYY-MM-DD with named groups, turned into DD/MM/YYYY in replace mode. Checks the ranges, not the calendar: 2026-02-31 passes.",
    sample: "Invoice 4417 was raised on 2026-09-28 and paid on 2026-10-02.\nThe contract runs from 2026-11-01 to 2027-10-31.\nNot dates: 2026-13-01, 2026-00-10, 26-10-02.",
    expected: 4,
  },
  {
    id: "email",
    name: "Email address",
    pattern: String.raw`\b[\w.%+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b`,
    flags: "gi",
    note: "A practical check, not the full RFC 5322 grammar: good for finding addresses in text. The only real test of an address is sending it an email.",
    sample: "Write to hello@bitsnbobs.tools or sales.team+uk@example.co.uk.\nAda.Lovelace@Analytical-Engine.org replied first.\nNot addresses: @handle, name@localhost, me@example.",
    expected: 3,
  },
  {
    id: "postcode",
    name: "UK postcode",
    pattern: String.raw`\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b`,
    flags: "gi",
    note: "Every UK postcode shape (A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA), with or without the space. It checks the shape, not that the postcode exists.",
    sample: "Send it to 10 Downing Street, London SW1A 2AA.\nOther shapes: M1 1AE, B33 8TH, CR2 6XH, DN55 1PT, W1A 0AX, ec1a1bb.\nNot postcodes: 12345, SW1A 2A, AB-1 2CD.",
    expected: 7,
  },
  {
    id: "url",
    name: "Web address",
    pattern: String.raw`\bhttps?:\/\/[^\s/?#]+[^\s]*?(?=[.,;:!?)]*(?:\s|$))`,
    flags: "gi",
    note: "http and https links in running text. The lazy part and the lookahead leave a full stop, comma or closing bracket after a link out of the match.",
    sample: "The docs live at https://bitsnbobs.tools/regex-tester.\nSee also (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions), or http://example.com?q=1&page=2, then stop.\nNot links: ftp://files.example.com, www.example.com.",
    expected: 3,
  },
  {
    id: "ipv4",
    name: "IPv4 address",
    pattern: String.raw`\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b`,
    flags: "g",
    note: "Four numbers from 0 to 255. The alternation spells out the ranges: 25[0-5], 2[0-4]\\d, 1\\d\\d and [1-9]?\\d.",
    sample: "Router 192.168.1.1, DNS 8.8.8.8 and 1.1.1.1, loopback 127.0.0.1.\nNot addresses: 256.1.1.1, 192.168.1, 10.0.0.300.",
    expected: 4,
  },
  {
    id: "hex",
    name: "Hex colour",
    pattern: String.raw`#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b`,
    flags: "gi",
    note: "CSS hex colours in 3, 4, 6 or 8 digits (the 4 and 8 digit forms carry alpha). The \\b stops #12345 matching as #1234.",
    sample: "color: #1f2937; background: #FFF; border-color: #ff880080;\naccent: #f80c; shadow: #0000001a;\nNot colours: #12345, #ggg, #1234567.",
    expected: 5,
  },
  {
    id: "mobile",
    name: "UK mobile number",
    pattern: String.raw`(?:\+44\s?7|\b07)\d{3}\s?\d{3}\s?\d{3}\b`,
    flags: "g",
    note: "07 or +44 7 numbers with optional spaces. Landlines vary too much in length for one tidy pattern.",
    sample: "Call 07700 900123 or +44 7700 900456, text 07700900789.\nNot mobiles: 020 7946 0018, 0770 090 012.",
    expected: 3,
  },
  {
    id: "duplicates",
    name: "Repeated words",
    pattern: String.raw`\b(\w+)\s+\1\b`,
    flags: "gi",
    replacement: "$1",
    note: "A word straight after itself, found with the back-reference \\1. Replace mode keeps one copy.",
    sample: "Paris in the the spring.\nIt was was a long day, and and then it rained.\nThat that is fine: case is ignored.",
    expected: 4,
  },
  {
    id: "camel",
    name: "Split camelCase",
    pattern: String.raw`(?<=[a-z\d])(?=[A-Z])`,
    flags: "g",
    replacement: " ",
    note: "Matches the empty gap between a lower-case letter and a capital, using lookbehind and lookahead. Replace with a space to split the words.",
    sample: "getUserName\nparseHttpResponse2Json\nbackgroundColor",
    expected: 6,
  },
  {
    id: "trailing",
    name: "Trailing spaces",
    pattern: String.raw`[ \t]+$`,
    flags: "gm",
    replacement: "",
    note: "Spaces and tabs at the end of each line. The m flag makes $ match at every line end, not just the end of the text.",
    sample: "const a = 1;   \nconst b = 2;\t\nconst c = 3;\nreturn a + b + c;  ",
    expected: 3,
  },
  {
    id: "time",
    name: "24-hour time",
    pattern: String.raw`\b([01]\d|2[0-3]):([0-5]\d)\b`,
    flags: "g",
    note: "HH:MM from 00:00 to 23:59, with the hour and minute in groups 1 and 2.",
    sample: "Trains at 06:45, 12:00 and 23:59.\nNot times: 24:00, 7:30, 12:60.",
    expected: 3,
  },
  {
    id: "price",
    name: "Price in pounds",
    pattern: String.raw`£\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?![\d,])`,
    flags: "g",
    note: "Pounds with optional thousands commas and pence. The negative lookahead stops £1,23 matching as £1.",
    sample: "Was £1,299.99, now £999. Delivery £4.50.\nA flat costs £350,000 and parking £12,500.\nNot prices: £1,23, 1,299.",
    expected: 5,
  },
  {
    id: "tags",
    name: "HTML tags",
    pattern: String.raw`<\/?([a-z][a-z\d-]*)\b[^>]*>`,
    flags: "gi",
    replacement: "",
    note: "Opening and closing tags with the tag name in group 1. Fine for tidying a snippet; for real HTML use a parser.",
    sample: '<p class="lead">Hello <b>world</b>, see <a href="/docs">the docs</a>.</p>\n<my-widget data-x="1"></my-widget>',
    expected: 8,
  },
  {
    id: "password",
    name: "Password rules",
    pattern: String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$`,
    flags: "gm",
    note: "One line passes when it has a lower-case letter, a capital and a digit (three lookaheads) and is at least 8 long. Length beats rules for real security.",
    sample: "Tr0ub4dor\npassword\nPASSWORD1\nCorrectHorse9\nshort1A",
    expected: 2,
  },
];

export const DEFAULT_PATTERN = LIBRARY[0] as LibraryPattern;

export const LIBRARY_IDS = LIBRARY.map((p) => p.id);

export function libraryPattern(id: string): LibraryPattern {
  return LIBRARY.find((p) => p.id === id) ?? DEFAULT_PATTERN;
}
