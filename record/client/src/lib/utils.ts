import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeHtml(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    doc.querySelectorAll('script, iframe, object, embed, link').forEach((el) => el.remove());
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null);
    const toRemoveAttrs = [/^on/i, /javascript:/i];
    while (walker.nextNode()) {
      const el = walker.currentNode as HTMLElement;
      [...el.attributes].forEach(attr => {
        if (toRemoveAttrs.some(rx => rx.test(attr.name) || rx.test(attr.value))) {
          el.removeAttribute(attr.name);
        }
      });
    }
    return doc.body.innerHTML;
  } catch {
    return '';
  }
}
