import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Paste a JSON Web Token and its header and payload are decoded straight away, with the time claims turned into real dates and a note of whether the token has expired. A Bearer prefix, quotes and line breaks are ignored, so you can paste straight from a request header or a log.",
    "The token is decoded by your browser and is never uploaded, stored or added to the share link. That matters: a live access token is a password, and pasting one into a site that sends it to a server hands over the account it belongs to.",
  ],
  sections: [
    {
      heading: "What is inside a JWT",
      paragraphs: [
        "A JWT (pronounced jot) is three pieces of URL-safe Base64 joined by dots: **header.payload.signature**. The first two are ordinary JSON, which is why every JWT starts with eyJ: that is what the start of a JSON object, {\" followed by a lowercase letter, looks like in Base64.",
      ],
      bullets: [
        "**Header**: how the token was signed. alg is the algorithm (HS256, RS256, ES256…), and kid, when present, says which of the issuer's keys was used.",
        "**Payload**: the claims, meaning the statements the token makes: who it is about, who issued it, when it expires, and whatever else the application added, such as roles or an email address.",
        "**Signature**: the header and payload signed with the issuer's key. It lets a server detect any change to the other two parts. It does not hide them.",
      ],
    },
    {
      heading: "A JWT is signed, not encrypted",
      paragraphs: [
        "Anyone who holds a token can read everything in it, exactly as this page does, with no key or secret. The signature only proves that the contents have not been altered since the issuer signed them.",
        "So **never put anything secret in a JWT payload**: no passwords, no card numbers, nothing you would not show the user it belongs to. And treat the token itself as a credential, because whoever has it can use it until it expires.",
      ],
    },
    {
      heading: "The standard claims",
      paragraphs: [
        "Seven claim names are defined by the JWT standard (RFC 7519). All are optional, and applications add their own alongside them. The three time claims are written as the number of **seconds** since 1 January 1970 UTC, which this tool converts to your local time.",
      ],
      bullets: [
        "**iss** (issuer): who created the token, often a URL",
        "**sub** (subject): who it is about, usually a user ID",
        "**aud** (audience): which service it is meant for. A service should reject tokens meant for someone else",
        "**exp** (expires): the moment after which the token must be rejected",
        "**nbf** (not before): the moment before which it must be rejected",
        "**iat** (issued at): when it was created",
        "**jti** (JWT ID): a unique ID, used to stop a token being replayed",
      ],
    },
    {
      heading: "Checking the signature",
      paragraphs: [
        "Tokens signed with **HS256, HS384 or HS512** use one shared secret for both signing and checking. Enter the secret and the tool recomputes the signature in your browser and compares it. If your secret is stored as Base64, as many frameworks do, switch on Secret is Base64 so that it is decoded to bytes first.",
        "Tokens signed with **RS256, ES256, PS256 or EdDSA** are checked with the issuer's public key, normally published at a JWKS address. This page does not verify those, but the header and payload are decoded all the same.",
        "Decoding a token is for debugging. It is never a substitute for verification on the server: code that trusts a payload without checking the signature, the expiry and the audience will accept a token that anyone could have written.",
      ],
    },
  ],
  faqs: [
    {
      question: "Is it safe to paste a real token here?",
      answer:
        "The token never leaves your browser: decoding and signature checking are done on your device, and nothing is sent, logged or put in the URL. As a habit, prefer expired or test tokens when you can, whatever tool you use.",
    },
    {
      question: "Can you decode a JWT without the secret?",
      answer:
        "Yes. The header and payload are only Base64-encoded, not encrypted, so anyone can read them. The secret or key is needed only to check or create the signature.",
    },
    {
      question: "Why is exp a long number?",
      answer:
        "It is a Unix timestamp: the number of seconds since midnight UTC on 1 January 1970. 1893456000, for example, is 1 January 2030. The tool shows the date next to each time claim.",
    },
    {
      question: "What does alg none mean?",
      answer:
        "That the token has no signature at all. Anyone can write such a token, so servers must refuse them. Accepting alg none was the cause of a well-known class of JWT vulnerabilities.",
    },
    {
      question: "My token has five parts, not three. Why can it not be decoded?",
      answer:
        "Five parts means it is a JWE, an encrypted JWT. Its payload is genuinely encrypted and can only be read with the decryption key, unlike an ordinary signed JWT.",
    },
    {
      question: "Why does the signature not match when I am sure the secret is right?",
      answer:
        "The usual cause is the secret's form. If it is stored as Base64, switch on Secret is Base64. Also check for a trailing space or line break, and that you are using the secret for the right environment.",
    },
  ],
};
