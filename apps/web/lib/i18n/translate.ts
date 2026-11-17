import { zhDict, zhPatterns } from "./zh-dict";

/**
 * Built-in Chinese UI override (B2): an exact-match text/attribute replacer driven by
 * a MutationObserver. It only rewrites nodes whose value exactly matches the dictionary
 * (or an English-anchored pattern), so model output, code, and filenames are never
 * touched. The pure helpers are exported separately so they can be unit-tested without
 * a DOM; `installZhLocale` is the thin DOM wiring.
 */

/** Containers whose text is never translated (model prose, code, editable input). */
const SKIP_SELECTOR = "[data-i18n-skip], code, pre, script, style, noscript, textarea";

/** Attributes translated on elements. Mirrors the observed attribute filter. */
const TRANSLATED_ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

const WHOLE = /^(\s*)([\s\S]*?)(\s*)$/;
const HAS_CJK = /[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/;

/** Translate a trimmed phrase via the dictionary, then patterns. Returns null on a miss. */
function translatePhrase(text: string): string | null {
  const exact = zhDict[text];
  if (exact !== undefined) return exact;
  // Patterns are English-only and never carry CJK; skip the scan if already Chinese.
  if (HAS_CJK.test(text)) return null;
  for (const rule of zhPatterns) {
    const match = rule.pattern.exec(text);
    if (!match) continue;
    return typeof rule.replace === "function" ? rule.replace(match) : text.replace(rule.pattern, rule.replace);
  }
  return null;
}

/**
 * Translate a text-node value, preserving surrounding whitespace. Returns the input
 * unchanged when there is no match, so it is safe to call on any node (idempotent:
 * a Chinese result never matches the English-only dictionary on the next pass).
 */
export function translateTextContent(raw: string): string {
  if (raw.length === 0) return raw;
  const parts = WHOLE.exec(raw);
  if (!parts) return raw;
  const [, lead, middle, trail] = parts;
  if (middle.length === 0) return raw;
  const hit = translatePhrase(middle);
  if (hit === null || hit === middle) return raw;
  return lead + hit + trail;
}

/** Translate a supported element attribute value, or return it unchanged. */
export function translateAttribute(attribute: string, value: string): string {
  if (!(TRANSLATED_ATTRS as readonly string[]).includes(attribute)) return value;
  return translateTextContent(value);
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

/**
 * Mount the Chinese override for the whole client app. Safe to call more than once and
 * a no-op during server rendering (no `document`/`MutationObserver`). Returns a cleanup
 * function that stops observing, matching the effect-cleanup style used in the SPA.
 */
export function installZhLocale(): () => void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {};
  }

  document.documentElement.lang = "zh-CN";
  const root = document.body ?? document.documentElement;

  function translateTextNode(node: Text): void {
    const value = node.nodeValue;
    if (value === null) return;
    const translated = translateTextContent(value);
    if (translated !== value) node.nodeValue = translated;
  }

  function translateElement(element: Element): void {
    for (const attribute of TRANSLATED_ATTRS) {
      const value = element.getAttribute(attribute);
      if (value === null) continue;
      const translated = translateAttribute(attribute, value);
      if (translated !== value) element.setAttribute(attribute, translated);
    }
  }

  function skip(node: Node): boolean {
    return node.nodeType === Node.ELEMENT_NODE && (node as Element).closest(SKIP_SELECTOR) !== null;
  }

  function walk(node: Node): void {
    if (isTextNode(node)) {
      translateTextNode(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || skip(node)) return;
    translateElement(node as Element);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      if (!skip(current)) translateTextNode(current as Text);
      current = walker.nextNode();
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") {
        if (isTextNode(record.target) && !skip(record.target)) translateTextNode(record.target);
      } else if (record.type === "attributes") {
        const element = record.target;
        if (element.nodeType === Node.ELEMENT_NODE && !skip(element)) translateElement(element as Element);
      } else {
        record.addedNodes.forEach((node) => walk(node));
      }
    }
  });

  walk(root);
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...TRANSLATED_ATTRS],
  });

  return () => observer.disconnect();
}
