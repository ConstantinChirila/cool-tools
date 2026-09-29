// Reminds about figures that go stale (tax rates, stamp duty, inflation data).
//
//   node scripts/check-data-reviews.mjs            list every entry and when it is due
//   node scripts/check-data-reviews.mjs --hook     SessionStart hook: JSON only when something is due, else silent
//   node scripts/check-data-reviews.mjs done <id> <next-due>   mark an entry checked today
//
// An entry is due once today reaches its `due` date, or a year after `lastChecked`
// if `due` was pushed further out than that.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("./data-reviews.json", import.meta.url);
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const data = JSON.parse(readFileSync(FILE, "utf8"));
const today = new Date().toISOString().slice(0, 10);

function dueDate(entry) {
  const yearOn = new Date(Date.parse(entry.lastChecked) + YEAR_MS).toISOString().slice(0, 10);
  return entry.due < yearOn ? entry.due : yearOn;
}

const describe = (e) =>
  `- ${e.id} (due ${dueDate(e)}, last checked ${e.lastChecked}): ${e.what}. When: ${e.when}. Tools: ${e.tools.join(", ")}. Files: ${e.files.join(", ")}. Sources: ${e.sources.join(" ")}`;

const [command, id, next] = process.argv.slice(2);

if (command === "done") {
  const entry = data.reviews.find((e) => e.id === id);
  if (!entry || !ISO.test(next ?? "") || next <= today) {
    console.error(`Usage: pnpm data:reviewed <id> <next-due YYYY-MM-DD, after today>\nIds: ${data.reviews.map((e) => e.id).join(", ")}`);
    process.exit(1);
  }
  entry.lastChecked = today;
  entry.due = next;
  writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${id}: checked ${today}, next due ${dueDate(entry)}.`);
  process.exit(0);
}

const due = data.reviews.filter((e) => dueDate(e) <= today);

if (command === "--hook") {
  if (due.length === 0) process.exit(0);
  const names = due.map((e) => e.id).join(", ");
  console.log(
    JSON.stringify({
      systemMessage: `Data review due in scripts/data-reviews.json: ${names}`,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: [
          `DATA REVIEW DUE (today ${today}). Some figures in this repo may be out of date because laws, budgets or published statistics change.`,
          "At the start of your first reply, briefly remind the user that these checks are due and offer to do them now (they may decline and carry on with their task):",
          ...due.map(describe),
          "To do a check: verify every figure against the listed sources (fetch them, never from memory), update code, tests and guide content, then run `pnpm data:reviewed <id> <next-due>` with the next date a change could land.",
        ].join("\n"),
      },
    }),
  );
  process.exit(0);
}

for (const e of [...data.reviews].sort((a, b) => dueDate(a).localeCompare(dueDate(b)))) {
  const d = dueDate(e);
  const status = d <= today ? "DUE NOW" : `due ${d}`;
  console.log(`${status.padEnd(15)} ${e.id.padEnd(24)} last checked ${e.lastChecked}  (${e.when})`);
}
if (due.length) console.log(`\n${due.length} due. After checking one: pnpm data:reviewed <id> <next-due YYYY-MM-DD>`);
