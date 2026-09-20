import type { ToolContent } from "@/lib/tool-content";

export const content: ToolContent = {
  intro: [
    "Paste the original text on the left and the changed version on the right. The differences appear underneath as you type: removed lines in pink with a minus, added lines in green with a plus, and the exact words that changed picked out within each line.",
    "The comparison runs entirely in your browser. Neither text is uploaded, stored or added to the share link, so it is safe to use for contracts, unpublished drafts and private code.",
  ],
  sections: [
    {
      heading: "How to read the result",
      paragraphs: [
        "The checker compares the two texts **line by line**, then looks inside each changed line to find the words that differ. The numbers in the margin are line numbers in the original and in the changed text, so you can find the same spot in your own document.",
      ],
      bullets: [
        "**Pink line with a minus**: this line is in the original but not in the changed text.",
        "**Green line with a plus**: this line is only in the changed text.",
        "**A pink line opposite a green one**: the line was edited. The darker highlights are the words that were taken out and put in.",
        "**No colour**: the line is the same in both.",
        "**Show unchanged lines**: long runs of matching lines are folded away, leaving three lines of context around each change. Click the fold to open it, or switch off Fold unchanged to see everything.",
      ],
    },
    {
      heading: "Side by side or inline",
      paragraphs: [
        "**Side by side** puts the original on the left and the changed text on the right with matching lines level with each other. It is the easier layout for prose and for edits within lines, because you can read across.",
        "**Inline** stacks everything in one column, with removed lines directly above the lines that replaced them. This is the layout used by Git and most code review tools, and it copes better with long lines. On a phone the result is always shown inline, because two columns of text do not fit.",
      ],
    },
    {
      heading: "Ignoring case and whitespace",
      paragraphs: [
        "Some differences are noise. Two options let you switch them off so the real edits stand out.",
      ],
      bullets: [
        "**Ignore case** treats capital and small letters as the same, so Hello and hello match.",
        "**Ignore whitespace** ignores spaces and tabs at the start and end of a line, and treats any run of spaces or tabs inside a line as a single space. Re-indented code and text with trailing spaces then count as unchanged. Removing the space between two words entirely still counts as a change.",
        "Line endings never count. A file saved on Windows (CRLF) and the same file saved on a Mac or Linux (LF) compare as identical. If the only difference is that one text ends with a line break and the other does not, every line still matches: the result says so, and Copy patch includes it.",
      ],
    },
    {
      heading: "Copying the result as a patch",
      paragraphs: [
        "Copy patch puts the differences on your clipboard in **unified diff** format, the plain-text format produced by git diff and understood by the patch command and by most code review tools. Lines starting with a minus were removed, lines starting with a plus were added, and each @@ header says where in the two texts the section sits.",
        "The patch always describes the exact texts, so the ignore options do not affect it. It is handy for sending someone a precise list of edits in an email or a ticket without attaching both versions.",
      ],
    },
    {
      heading: "What people use a diff checker for",
      paragraphs: [
        "Anywhere there are two versions of something and the question is what changed between them.",
      ],
      bullets: [
        "Checking what a supplier, client or solicitor changed in a contract or set of terms before you sign",
        "Comparing two drafts of an essay, article or CV to see which edits were made",
        "Spotting the difference between two configuration files, one of which works",
        "Reviewing a change to code or a SQL query outside of version control",
        "Confirming that two exports, lists or sets of data really are identical",
      ],
    },
  ],
  faqs: [
    {
      question: "Is my text uploaded anywhere?",
      answer:
        "No. The comparison is done by your own browser and neither text leaves your device. The share link carries only your layout and ignore settings, never the text itself.",
    },
    {
      question: "How do I compare two Word documents or PDFs?",
      answer:
        "Select all the text in each document, copy it, and paste one into each box. Formatting such as bold, fonts and images is not compared, only the words.",
    },
    {
      question: "Why is a whole paragraph marked as changed when I only edited one word?",
      answer:
        "The comparison works on lines, and a paragraph with no line breaks in it is a single line. The paragraph is shown as changed, and the darker highlight within it shows the word you edited.",
    },
    {
      question: "Why are some changed lines not highlighted word by word?",
      answer:
        "Word highlights are only shown when the two lines are recognisably the same line edited. If a line was replaced with something mostly different, or is over 1,000 characters long, it is shown as one line removed and one added.",
    },
    {
      question: "Is there a size limit?",
      answer:
        "There is no fixed limit. Texts of many thousands of lines compare in well under a second when they are mostly alike, and large comparisons run in the background so the page never freezes. Two very large texts with almost nothing in common can take too long: the checker gives up after about eight seconds and asks you to compare a smaller section. Very long results are shown 2,000 rows at a time.",
    },
    {
      question: "What is the difference between a diff and a patch?",
      answer:
        "A diff is the list of differences between two texts. A patch is that list saved in a standard format, so a program can apply the same edits to another copy of the original.",
    },
  ],
};
