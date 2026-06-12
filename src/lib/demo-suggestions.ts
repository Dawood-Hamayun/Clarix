/**
 * Curated suggestion pool for the chat UI. Every question here is
 * verifiably answerable from the bundled Acme Cloud knowledge base, so
 * suggested chips never lead the agent off a cliff mid-demo.
 *
 * Used by both /api/starter-suggestions (conversation openers) and
 * /api/quick-replies (follow-ups), which filter out anything already
 * asked in the thread.
 */
export const ANSWERABLE_QUESTIONS: string[] = [
  "How much does the Business plan cost?",
  "Is there a free plan?",
  "Can I cancel anytime?",
  "Do you offer refunds?",
  "Are you SOC 2 compliant?",
  "Where is my data stored?",
  "Do you integrate with Slack and GitHub?",
  "Do you have a mobile app?",
  "What are your support hours?",
  "What features does Acme Cloud offer?",
  "How does the 14-day trial work?",
  "What is Acme Copilot?",
];

/** Pick up to `count` questions that haven't been asked yet. */
export function pickSuggestions(asked: string[], count = 3): string[] {
  const norm = asked.map((a) => a.toLowerCase().trim());
  return ANSWERABLE_QUESTIONS.filter(
    (q) => !norm.some((a) => a.includes(q.toLowerCase().slice(0, 24)))
  ).slice(0, count);
}
