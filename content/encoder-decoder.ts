import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Pick an encoding, type or paste on the left, and the result appears on the right as you type. Switch between Encode and Decode and the result carries across, so you can check that what you encoded comes back the same.",
    "Everything happens in your browser. What you paste is never uploaded, stored or added to the share link, so it is safe to use with tokens, keys and customer data.",
  ],
  sections: [
    {
      heading: "Which encoding do I need?",
      paragraphs: [
        "Each of these solves the same problem in a different place: some characters have a special meaning where the text is going, or cannot travel there at all, so they are rewritten using characters that can.",
      ],
      bullets: [
        "**Base64**: carrying bytes or awkward text through something built for plain text, such as JSON, an email, an HTTP header or an environment variable. Output is letters, digits, + and /.",
        "**URL**: putting a value into a web address. Spaces become %20 and characters such as & and = are protected so they do not split the query string.",
        "**HTML entities**: showing text on a web page literally. < becomes &lt; so it is displayed rather than treated as a tag.",
        "**Hex**: looking at the actual bytes of a piece of text, to find invisible characters or compare with a hex dump.",
        "**Unicode escapes**: writing accents and emoji as \\uXXXX inside JSON or source code that must stay ASCII.",
      ],
    },
    {
      heading: "Encoding is not encryption",
      paragraphs: [
        "None of these hide anything. They are public, reversible ways of writing the same information, and anyone can decode them without a key, as this page shows. A password in Base64 is a password in plain sight. To keep something secret it must be **encrypted**, and to check that it has not been altered it must be **signed** or hashed.",
      ],
    },
    {
      heading: "Text, bytes and UTF-8",
      paragraphs: [
        "Base64, URL encoding and hex all work on bytes, not characters, so the text is first turned into bytes using **UTF-8**, the encoding used by practically every modern system. English letters are one byte each, accented letters two, most other symbols three and emoji four. The counter under each box shows both characters and bytes when they differ.",
        "This matters most when decoding. If the bytes that come out are not valid UTF-8, the tool says so instead of showing a row of question marks: the data is either binary (an image, a key, something compressed) or text in an older encoding such as Latin-1.",
      ],
    },
    {
      heading: "When text has been encoded twice",
      paragraphs: [
        "A very common bug is encoding something that was already encoded. The signs are easy to spot once you know them: **%2520** in a URL (the % of %20 encoded again as %25), **&amp;amp;** or **&amp;lt;** on a web page, or Base64 that decodes to more Base64. Decode once here, press Decode this again on the result, and you will see how many layers there are.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is my text sent to a server?",
      answer:
        "No. Encoding and decoding are done by your browser, and the page works offline once loaded. The share link only remembers which encoding and options you chose, never the text.",
    },
    {
      question: "Do I have to say which kind of Base64 or hex I am decoding?",
      answer:
        "No. Decoding accepts standard and URL-safe Base64 with or without padding, and hex with spaces, 0x prefixes, \\x escapes, commas or colons. Only URL decoding has a choice to make: whether + means a space.",
    },
    {
      question: "Can I decode a JWT with this?",
      answer:
        "A JWT is three URL-safe Base64 parts joined by dots, so you can decode the first two parts one at a time here. The JWT Decoder does it in one step and also reads the expiry and other claims.",
    },
    {
      question: "Can it encode files or images?",
      answer:
        "Not yet. This tool works on text. Base64 of a file (for example a data: URL for an image) needs the raw bytes of the file rather than pasted text.",
    },
    {
      question: "What is the difference between encoding, encryption and hashing?",
      answer:
        "Encoding changes how data is written and anyone can reverse it. Encryption can only be reversed with a key. Hashing cannot be reversed at all and is used to check that data has not changed.",
    },
  ],
};
