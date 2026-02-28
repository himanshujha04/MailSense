/** Strip HTML, inline CSS, and angle-bracketed URLs for display. */
export function cleanBodyForDisplay(body: string): string {
  if (!body || typeof body !== "string") return "";
  let text = body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(\s*https?:\/\/[^>]+)\s*>/gi, (_, url: string) => " " + url.trim() + " ")
    .replace(/<[^>]+>/g, " ");
  // Remove inline CSS blocks like *{...} or .class{...}
  for (let i = 0; i < 20; i++) {
    const next = text.replace(/[.#*a-zA-Z\[\]\s]+\{[^{}]*\}/g, " ");
    if (next === text) break;
    text = next;
  }
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&\w+;/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}
