import type { CodecId } from "@/lib/encoding";
import type { ContentSection, Faq } from "@/lib/tool-content";

/**
 * Landing pages under /tools/encoder-decoder/<slug>, one per codec. People
 * search for "base64 decode", not "encoder", so each codec gets its own page
 * with the tool preset, worked examples and its own FAQs.
 */
export interface CodecPage {
  slug: string;
  codec: CodecId;
  /** Page h1 and link text. */
  title: string;
  /** Under ~50 characters: the site name is appended. */
  seoTitle: string;
  /** Under ~155 characters. */
  description: string;
  lead: string;
  /** Plain text run through the codec at build time for the examples table. */
  examples: readonly { text: string; variant: string; note: string }[];
  sections: readonly ContentSection[];
  faqs: readonly Faq[];
}

export const codecPages: readonly CodecPage[] = [
  {
    slug: "base64",
    codec: "base64",
    title: "Base64 Encode and Decode",
    seoTitle: "Base64 Encode and Decode Online",
    description:
      "Encode text to Base64 or decode Base64 back to text, with full UTF-8 and emoji support and the URL-safe variant. Runs in your browser: nothing is uploaded.",
    lead: "Turn text into Base64 or Base64 back into text. Handles accents and emoji properly, reads URL-safe Base64, and never sends what you paste anywhere.",
    examples: [
      { text: "Hello", variant: "standard", note: "Five bytes need one = of padding" },
      { text: "Hello!", variant: "standard", note: "Six bytes divide evenly, so no padding" },
      { text: "café", variant: "standard", note: "é is two bytes in UTF-8" },
      { text: "user:p@ss", variant: "standard", note: "The form used by HTTP Basic auth" },
      { text: "??>>", variant: "standard", note: "Uses + and /" },
      { text: "??>>", variant: "urlsafe", note: "Swaps them for - and _ and drops the =" },
    ],
    sections: [
      {
        heading: "What Base64 is for",
        paragraphs: [
          "Base64 writes any sequence of bytes using only 64 safe characters: A to Z, a to z, 0 to 9, plus + and /. It exists because many systems were built to carry text and will corrupt raw bytes: email bodies, JSON, XML, URLs, HTTP headers and environment variables among them.",
          "It works by taking three bytes (24 bits) at a time and splitting them into four groups of six bits, each of which picks one character from the alphabet. When the input does not divide into threes, the last group is padded with one or two = signs. The result is always about **33% larger** than the input.",
          "Base64 is **an encoding, not encryption**. Anyone can decode it, so it hides nothing. A Base64 string in a config file or an Authorization header is exactly as secret as the plain text would be.",
        ],
      },
      {
        heading: "Text, UTF-8 and why other tools mangle accents",
        paragraphs: [
          "Base64 encodes bytes, so text has to be turned into bytes first. This tool uses UTF-8, the encoding of practically every modern system. That is why é becomes two bytes and an emoji four.",
          "JavaScript's built-in btoa function only accepts characters up to code 255 and throws an error on anything else, and tools built directly on it either fail on emoji or silently produce Latin-1 output that decodes to the wrong characters elsewhere. If a decoded string shows Ã© where é should be, it was decoded as Latin-1 instead of UTF-8.",
        ],
      },
      {
        heading: "Standard and URL-safe Base64",
        paragraphs: [
          "The + and / of standard Base64 both have meanings inside a URL, and = has one in a query string. **URL-safe Base64** (base64url in RFC 4648) swaps + for - and / for _, and usually leaves off the padding. It is what JSON Web Tokens, many API keys and signed URLs use.",
          "When decoding you do not need to say which one you have: both alphabets are accepted, with or without padding, and line breaks are ignored, so Base64 wrapped at 64 or 76 characters (PEM files, MIME email) can be pasted as it is.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Base64 secure?",
        answer:
          "No. Base64 is a way of writing bytes as text, not a way of protecting them. Anyone can decode it instantly without a key, so never treat a Base64 string as hidden.",
      },
      {
        question: "Why does my Base64 end in = or ==?",
        answer:
          "Base64 works on groups of three bytes. If the input has one byte left over the output ends in ==, with two left over it ends in =, and with none there is no padding.",
      },
      {
        question: "Why does decoding say the result is not valid text?",
        answer:
          "The Base64 decoded correctly but the bytes are not UTF-8 text. It is most likely a file such as an image, a certificate, a key or compressed data, which cannot be shown as text.",
      },
      {
        question: "How much bigger does Base64 make things?",
        answer:
          "Four characters are written for every three bytes, so the output is one third larger than the input, plus up to two padding characters.",
      },
    ],
  },
  {
    slug: "url",
    codec: "url",
    title: "URL Encode and Decode",
    seoTitle: "URL Encode and Decode Online (Percent-Encoding)",
    description:
      "Percent-encode text for a URL or decode %20-style text back to normal. Component, whole-URL and form (+ for space) modes, with UTF-8 support. Nothing is uploaded.",
    lead: "Percent-encode a value so it is safe inside a URL, or turn a string full of %20 and %3D back into something readable.",
    examples: [
      { text: "fish & chips", variant: "component", note: "A space is %20 and & is %26" },
      { text: "fish & chips", variant: "form", note: "The space is written as +" },
      { text: "a+b=c", variant: "component", note: "+ and = are encoded so they keep their literal meaning" },
      { text: "café", variant: "component", note: "Each UTF-8 byte of é gets its own %XX" },
      { text: "https://example.com/my file.pdf?q=a b", variant: "full", note: "The structure is kept, only the spaces change" },
      { text: "https://example.com/my file.pdf?q=a b", variant: "component", note: "The address itself becomes a value, ready to go in a query string" },
    ],
    sections: [
      {
        heading: "What URL encoding does",
        paragraphs: [
          "A URL may only contain a limited set of characters, and several of those, such as ? & = / and #, have a job: they separate the parts of the address. Anything else, and any of those characters used as ordinary data, has to be written as a percent sign followed by the two hex digits of each byte. A space becomes %20, an ampersand %26, and é becomes %C3%A9 because it is two bytes in UTF-8.",
        ],
      },
      {
        heading: "Component or whole URL?",
        paragraphs: [
          "This is the choice that catches people out, and it is the difference between JavaScript's encodeURIComponent and encodeURI.",
        ],
        bullets: [
          "**Component** encodes everything except letters, digits and - _ . ! ~ * ' ( ). Use it for a single value that you are putting into a URL: a search term, a redirect address, a file name. This is the right choice nearly every time.",
          "**Whole URL** leaves the characters that give a URL its structure alone (: / ? # & = + $ , ; @) and only fixes what is never allowed, such as spaces and accents. Use it to tidy a complete address that is already put together. Using it on a value is a bug: an & inside the value would stay as it is and split the query string.",
          "**Form** is component encoding with one change: a space is written as +. It is the format browsers use when submitting a form (application/x-www-form-urlencoded), and what most servers expect in a query string.",
        ],
      },
      {
        heading: "Decoding, and the + problem",
        paragraphs: [
          "Decoding turns every %XX back into its byte and reads the bytes as UTF-8. The one ambiguity is the plus sign. In a query string or form body, + means a space; in the path of a URL it is just a plus. The **+ means space** option is on by default because query strings are what people usually paste; switch it off when decoding a path.",
          "If decoding fails, the usual causes are a literal % that was never encoded (it should be %25), a string that was cut off halfway through a %XX sequence, or text that was encoded in an old single-byte character set such as Latin-1, where é is %E9 rather than %C3%A9.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is %20?",
        answer: "A space. 20 is the hexadecimal code of the space character, and spaces are not allowed in URLs, so it is written as %20, or as + inside query strings.",
      },
      {
        question: "Should I use %20 or + for a space?",
        answer:
          "%20 works everywhere in a URL. + only means a space in the query string and in form data, and is a literal plus sign in the path, so %20 is the safe choice when unsure.",
      },
      {
        question: "What does double encoding look like?",
        answer:
          "If you see %2520 or %253D, the text was encoded twice: the % of %20 was itself encoded to %25. Decode it twice to get the original back, and fix the code that encodes it a second time.",
      },
      {
        question: "Is URL encoding the same as HTML encoding?",
        answer:
          "No. URL encoding uses %XX and protects the structure of an address. HTML encoding uses entities such as &amp; and protects the structure of a page. A URL placed in an HTML attribute needs both, URL encoding first.",
      },
    ],
  },
  {
    slug: "html-entities",
    codec: "html",
    title: "HTML Entity Encode and Decode",
    seoTitle: "HTML Entity Encoder and Decoder",
    description:
      "Escape text for HTML (&lt; &gt; &amp; &quot;) or decode named and numeric entities such as &eacute; and &#8364; back to characters. Every HTML5 name supported.",
    lead: "Escape text so it displays literally on a web page, or turn &amp;, &eacute; and &#8364; back into the characters they stand for.",
    examples: [
      { text: "<script>alert(1)</script>", variant: "essential", note: "Shown as text instead of being run" },
      { text: 'Tom & "Jerry"', variant: "essential", note: "& and quotes are escaped, letters are not" },
      { text: "café £5 ©", variant: "essential", note: "Non-ASCII is left alone, which is fine on a UTF-8 page" },
      { text: "café £5 ©", variant: "named", note: "Readable in the source" },
      { text: "café £5 ©", variant: "numeric", note: "Understood by XML as well" },
    ],
    sections: [
      {
        heading: "Why HTML needs escaping",
        paragraphs: [
          "In HTML, < starts a tag and & starts an entity. To show either as an ordinary character it must be written as an entity: &lt; and &amp;. Inside an attribute value the quote that delimits the value needs the same treatment, &quot; or &apos;.",
          "Escaping is also the main defence against **cross-site scripting (XSS)**. If text that came from a user is put into a page without being escaped, a script tag in that text will run. Escaping the five characters & < > \" and ' makes any text inert as HTML content or as a quoted attribute value. It is not enough on its own inside a script block, a style block or an unquoted attribute, which have their own rules.",
        ],
      },
      {
        heading: "Essential, named or numeric",
        paragraphs: [
          "On a page served as UTF-8, which is nearly all of them, only the five special characters need escaping, and that is what **Essential** does. Accented letters, currency signs and emoji can be left exactly as they are.",
          "**Named** also converts non-ASCII characters to names where one exists (&eacute;, &euro;, &copy;) and to numbers where it does not. **Numeric** uses the hexadecimal code point for every one (&#xe9;). Both are for systems that are not safe for UTF-8, such as some email templates and old databases. Numeric entities are also valid in XML, which knows only five named entities.",
        ],
      },
      {
        heading: "Decoding",
        paragraphs: [
          "Decoding understands every entity name in the HTML5 standard (there are over 2,000), decimal entities such as &#8364; and hexadecimal ones such as &#x20AC;. Like a browser, it also accepts the older names without their closing semicolon (&copy, &amp, &nbsp), since a lot of real-world HTML leaves it off.",
          "One to watch for: &nbsp; decodes to a **non-breaking space**, which looks identical to a normal space but is a different character, and will not match a normal space in a search or a comparison.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which characters must be escaped in HTML?",
        answer:
          "& and < always. > is escaped by convention. Inside an attribute value, also the quote character around it: \" as &quot; or ' as &apos; (or &#39;).",
      },
      {
        question: "What is the difference between &#39; and &apos;?",
        answer:
          "Both are an apostrophe. &apos; is valid in HTML5 and XML but was not in HTML 4, so older code uses the numeric &#39;, which works everywhere.",
      },
      {
        question: "Why do I see &amp;amp; on my page?",
        answer:
          "The text was escaped twice, so the & of &amp; became &amp; again. Decode it once here to check, and remove one of the two escaping steps in your code.",
      },
      {
        question: "Do I need to encode accented letters and emoji?",
        answer:
          "Not if the page is UTF-8, which is the default for HTML5. Use the Named or Numeric style only when the text passes through something that cannot handle UTF-8.",
      },
    ],
  },
  {
    slug: "hex",
    codec: "hex",
    title: "Text to Hex and Hex to Text",
    seoTitle: "Text to Hex Converter and Hex to Text",
    description:
      "Convert text to hexadecimal bytes (UTF-8) or hex back to text. Accepts spaced, plain, 0x and \\x notation. Runs in your browser: nothing is uploaded.",
    lead: "See the exact bytes behind a piece of text, or turn a hex dump back into something readable.",
    examples: [
      { text: "Hi", variant: "spaced", note: "H is 48, i is 69" },
      { text: "Hello", variant: "plain", note: "No separators between bytes" },
      { text: "Hello", variant: "escaped", note: "As a C, Python or shell string" },
      { text: "é", variant: "spaced", note: "One character, two UTF-8 bytes" },
      { text: "€", variant: "spaced", note: "Three bytes" },
      { text: "😀", variant: "spaced", note: "Four bytes" },
    ],
    sections: [
      {
        heading: "How text becomes hex",
        paragraphs: [
          "Computers store text as bytes, and hexadecimal is the usual way to write a byte down: two digits from 0 to 9 and a to f, covering 00 to ff (0 to 255). Plain English letters, digits and punctuation are one byte each and follow the ASCII table: A is 41, a is 61, 0 is 30 and a space is 20.",
          "Everything else takes more than one byte in **UTF-8**, which is the encoding used here: accented Latin letters take two, most other scripts and symbols such as € take three, and emoji take four. That makes hex the quickest way to find an invisible problem in a string, such as a non-breaking space (c2 a0) where a space (20) should be, a zero-width space (e2 80 8b), or a byte order mark (ef bb bf) at the start of a file.",
        ],
      },
      {
        heading: "Notations it reads",
        paragraphs: [
          "When decoding, separators and prefixes are ignored, so you can paste hex as it appears in most tools without cleaning it up first.",
        ],
        bullets: [
          "Spaced pairs: 48 65 6c 6c 6f",
          "A continuous string: 48656c6c6f",
          "0x prefixes and commas, as in source code: 0x48, 0x65, 0x6c",
          "Escape sequences: \\x48\\x65\\x6c",
          "Colons or dashes, as in fingerprints: 48:65:6c",
        ],
      },
    ],
    faqs: [
      {
        question: "Why is one character more than one hex byte?",
        answer:
          "Only the 128 ASCII characters fit in a single byte in UTF-8. Accented letters use two bytes, most other characters three, and emoji four.",
      },
      {
        question: "Why does decoding say the bytes are not valid text?",
        answer:
          "The hex is well formed but the bytes do not make UTF-8 text. It is probably binary data such as a hash, a key or part of a file, or text in another encoding such as UTF-16 or Latin-1.",
      },
      {
        question: "Is uppercase or lowercase hex correct?",
        answer: "Both mean the same thing, and both are accepted when decoding. Lowercase is more common in programming and is what this tool writes.",
      },
    ],
  },
  {
    slug: "unicode-escape",
    codec: "unicode",
    title: "Unicode Escape and Unescape",
    seoTitle: "Unicode Escape and Unescape (\\uXXXX)",
    description:
      "Convert text to \\uXXXX Unicode escapes for JSON, JavaScript, Java and C#, or unescape \\u00e9, \\u{1f600} and \\x41 sequences back to readable text.",
    lead: "Turn accents, symbols and emoji into \\uXXXX escapes that survive any ASCII-only system, or make an escaped string from a log or a JSON file readable again.",
    examples: [
      { text: "café", variant: "nonascii", note: "Only the é is escaped" },
      { text: "£5 → €6", variant: "nonascii", note: "ASCII stays readable" },
      { text: "😀", variant: "nonascii", note: "Beyond U+FFFF, so a surrogate pair" },
      { text: "😀", variant: "codepoint", note: "The ES2015 form holds it in one escape" },
      { text: "Hi", variant: "all", note: "ASCII is escaped too" },
    ],
    sections: [
      {
        heading: "What a Unicode escape is",
        paragraphs: [
          "A Unicode escape writes a character as a backslash, a u and the four hex digits of its code: é is \\u00e9. The same syntax is understood by JSON, JavaScript, Java, C#, Python and many configuration formats, which makes it the standard way to carry non-ASCII text through something that only handles ASCII reliably: old source files, .properties files, logs and some APIs.",
          "Four hex digits only reach U+FFFF. Characters beyond that, which includes all emoji, are written as **two** escapes called a surrogate pair: 😀 is \\ud83d\\ude00. This is the form JSON requires. JavaScript since ES2015, along with Rust, Swift and others, also has a code point form in braces, \\u{1f600}, which needs no pair.",
        ],
      },
      {
        heading: "Unescaping",
        paragraphs: [
          "Decoding understands \\uXXXX (pairing surrogates back into one character), \\u{…}, two-digit \\xXX, and the common single-letter escapes \\n, \\t, \\r, \\\\, \\\" and \\'. Anything that is not a complete escape is left exactly as written rather than rejected, so you can paste a whole log line or JSON document and only the escapes change.",
          "When encoding, a backslash already in your text is doubled (\\\\), so that C:\\new is not read back as a line break and encoding then decoding always returns the original. Quotes are left alone, so add your own escaping for those if you are pasting the result between quotes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why is an emoji written as two \\u escapes?",
        answer:
          "\\uXXXX has room for four hex digits, which covers code points up to U+FFFF. Emoji sit above that, so they are split into a surrogate pair of two escapes, exactly as they are stored in UTF-16.",
      },
      {
        question: "Does JSON allow \\u{1f600}?",
        answer: "No. JSON only has the four-digit \\uXXXX form, so characters above U+FFFF must be written as a surrogate pair. The braces form is JavaScript (ES2015 and later) syntax.",
      },
      {
        question: "What is the difference between \\u00e9 and %C3%A9?",
        answer:
          "\\u00e9 is the character's Unicode code point, used in source code and JSON. %C3%A9 is URL encoding of the two bytes that é takes in UTF-8. They describe the same character in different systems.",
      },
    ],
  },
];

export function getCodecPage(slug: string): CodecPage | undefined {
  return codecPages.find((page) => page.slug === slug);
}

export function codecPagePath(page: CodecPage): string {
  return `/tools/encoder-decoder/${page.slug}`;
}
