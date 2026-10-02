import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Type a regular expression and every match in the test text lights up as you type, with each capture group in its own colour and listed underneath. Switch on Replace to see the text after a find and replace, read the pattern explained step by step in plain English, and copy it as working code for JavaScript, Python, PHP, Java, C# or Go.",
    "Patterns run on your browser's own JavaScript engine, so the results are exactly what your code will get. The test text never leaves your device and is not put in the share link; the pattern, flags and replacement are, so a link reopens the same regex.",
  ],
  sections: [
    {
      heading: "How to use the regex tester",
      paragraphs: [
        "Write the pattern between the slashes without the slashes themselves, as you would pass it to new RegExp(). Turn flags on with the pills underneath: the letters after the closing slash update to match, and the count of matches and groups updates with every keystroke.",
        "Not sure where to start? The pattern library loads a tested pattern with a sample text that shows what it catches and what it rightly skips: dates, emails, UK postcodes and mobile numbers, web addresses, IP addresses, hex colours, prices and more. Edit any of them to fit your data.",
      ],
      bullets: [
        "**Matches and groups**: every match with its position and the value of each group, named groups by name. A group that did not take part (the other side of an |) is shown as such, which is different from an empty match.",
        "**Replace**: the replaced text, with each substitution highlighted. Without the g flag only the first match is replaced, exactly as String.replace does.",
        "**What the pattern means**: the pattern broken into steps, with groups and alternatives nested, so you can check it says what you meant.",
        "**Use it in code**: a snippet with the pattern translated into the other language's syntax, and a note wherever that engine works differently.",
      ],
    },
    {
      heading: "Regex cheat sheet",
      paragraphs: ["The pieces almost every pattern is built from. Anything not listed here stands for itself, apart from the special characters . * + ? ^ $ ( ) [ ] { } | \\ and /, which need a backslash in front to be matched literally."],
      bullets: [
        "**.** any character except a line break (any at all with the s flag)",
        "**\\d \\w \\s** a digit, a word character (letter, digit or underscore) and whitespace; capitals **\\D \\W \\S** mean the opposite",
        "**[abc]** one of a, b or c; **[a-z]** a range; **[^abc]** anything except those",
        "**^ and $** the start and end of the text, or of each line with the m flag; **\\b** a word boundary",
        "**Repeats**: * zero or more, + one or more, ? optional, {3} exactly 3, {2,5} from 2 to 5, {2,} 2 or more",
        "**Lazy repeats**: *?, +? and {2,5}? match as little as possible instead of as much",
        "**a|b** either a or b; **(…)** a capture group; **(?:…)** a group that does not capture; **(?<name>…)** a named group",
        "**\\1** or **\\k<name>** the same text that group 1, or the named group, matched earlier",
      ],
    },
    {
      heading: "The flags",
      paragraphs: ["Flags change how the whole pattern behaves. In JavaScript they go after the closing slash, as in /cat/gi."],
      bullets: [
        "**g** global: find every match, not just the first. Without it, matchAll throws and replace changes one match.",
        "**i** ignore case: cat matches Cat and CAT.",
        "**m** multiline: ^ and $ match at the start and end of every line, not only of the whole text.",
        "**s** dot all: . matches line breaks too.",
        "**u** Unicode: stricter syntax, \\p{…} property escapes such as \\p{L} for any letter, and emoji treated as one character rather than two.",
        "**v** Unicode sets: everything u does, plus set operations inside classes, such as [\\p{L}--[a-z]] for letters other than a to z. Use u or v, not both.",
        "**y** sticky: each match must start exactly where the previous one ended. Useful for tokenisers.",
      ],
    },
    {
      heading: "Lookahead and lookbehind",
      paragraphs: [
        "A lookaround checks what comes before or after a position without including it in the match. **(?=…)** means followed by and **(?!…)** not followed by; **(?<=…)** means preceded by and **(?<!…)** not preceded by.",
        "So \\d+(?=px) finds the 12 in 12px but nothing in 12em, and (?<=£)\\d+ finds the amount after a pound sign without the sign. The Split camelCase pattern in the library matches no characters at all: only the gap between a lower-case letter and a capital, which a replacement can turn into a space.",
      ],
    },
    {
      heading: "Replacement patterns",
      paragraphs: [
        "In the replacement, **$1** to **$99** insert a numbered group, **$<name>** a named group, **$&** the whole match, **$`** the text before the match, **$'** the text after it and **$$** a single dollar sign. A group that did not take part inserts nothing.",
        "The ISO date pattern in the library shows the idea: (?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2}) replaced with $<day>/$<month>/$<year> turns 2026-10-02 into 02/10/2026.",
      ],
    },
    {
      heading: "Why a regex can hang: catastrophic backtracking",
      paragraphs: [
        "When a match fails, the engine goes back and tries every other way the pattern could have split the text. With a repeat inside a repeat, such as (a+)+$ or (\\w|\\d)*, the number of ways grows exponentially with the length of the text, so 30 characters can take minutes and freeze a browser tab or a server.",
        "This tester runs your pattern in a background worker and stops it after two seconds, so a runaway pattern cannot lock up the page. The fix is to make the repeats unable to overlap: (a+)+ is just a+, \\w already includes \\d, and a delimited field is better written as [^,]* than .*.",
      ],
    },
    {
      heading: "Using the pattern in another language",
      paragraphs: [
        "Most regex syntax is shared, but each engine has its own spellings and gaps, which the code snippets handle for you. Python writes named groups as (?P<name>…) and references in replacements as \\g<name>. PHP's preg_replace has no named references, so they become group numbers. Go's engine (RE2) guarantees linear time by leaving out lookarounds and back-references altogether, so patterns that use them will not compile there.",
        "Smaller differences remain. In Python and .NET, \\d and \\w also match digits and letters from other scripts, and in Python $ also matches just before a final line break. Always rerun your tests in the target language.",
      ],
    },
  ],
  faqs: [
    {
      question: "Which regex flavour does this tester use?",
      answer:
        "JavaScript (ECMAScript), run by your browser's own engine, including modern features such as lookbehind, named groups, the v flag and inline modifiers like (?i:…) where your browser supports them. The code snippets translate the pattern for Python, PHP, Java, C# and Go and flag anything those engines cannot do.",
    },
    {
      question: "Is my test text sent anywhere?",
      answer:
        "No. Matching happens on your device and the text is never uploaded or added to the share link. The pattern, flags and replacement are kept in the link so you can share the regex itself.",
    },
    {
      question: "Why does my pattern find only one match?",
      answer:
        "The g (global) flag is off. Without it a JavaScript regex stops at the first match, and replace changes only that one. Switch on g to find them all.",
    },
    {
      question: "What does it mean when the tester stops my pattern?",
      answer:
        "The pattern ran for more than two seconds on your text, which almost always means catastrophic backtracking: nested repeats that try an exponential number of ways to match. Rewrite the repeats so they cannot overlap, for example a+ instead of (a+)+.",
    },
    {
      question: "How do I match a dot, bracket or other special character?",
      answer:
        "Put a backslash in front of it: \\. matches a full stop, \\( a bracket and \\\\ a backslash. Inside square brackets most characters are literal already, so [.] also matches a full stop.",
    },
    {
      question: "What is the difference between greedy and lazy?",
      answer:
        "A greedy repeat such as .* takes as much text as it can and gives back only what the rest of the pattern needs; a lazy one such as .*? takes as little as it can. On <b>one</b><b>two</b>, <b>.*</b> matches the whole line while <b>.*?</b> matches each tag pair separately.",
    },
  ],
};
