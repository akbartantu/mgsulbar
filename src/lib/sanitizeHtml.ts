/**
 * Sanitize HTML for safe display (LetterDetailDialog, ContentPreview).
 * Allows only: p, br, div, span, strong, b, em, i, u, ul, ol, li, blockquote.
 * Strips all attributes except safe style values (underline on span/u; list-style-type on ol/ul; margin on blockquote).
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote',
]);

function isAllowedTag(tagName: string): boolean {
  return ALLOWED_TAGS.has(tagName.toLowerCase());
}

const SAFE_LIST_STYLE_TYPES = new Set([
  'decimal', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman',
  'disc', 'circle', 'square', 'none',
]);

/** Allow only style attribute, and only safe values (underline on span/u; list-style-type on ol/ul). */
function sanitizeAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  const tag = el.tagName.toLowerCase();
  if (!el.hasAttribute('style')) return attrs;
  const style = el.getAttribute('style') || '';
  if (tag === 'span' || tag === 'u') {
    const underline = /text-decoration:\s*underline/.test(style);
    if (underline) attrs['style'] = 'text-decoration: underline';
  } else if (tag === 'ol' || tag === 'ul') {
    const listMatch = style.match(/list-style-type\s*:\s*([^;]+)/i);
    const value = listMatch ? listMatch[1].trim().toLowerCase() : '';
    if (SAFE_LIST_STYLE_TYPES.has(value)) {
      attrs['style'] = `list-style-type: ${value}`;
    } else if (tag === 'ul') {
      attrs['style'] = 'list-style-type: disc';
    }
  } else if (tag === 'blockquote') {
    // Preserve indent: margin or margin-left (e.g. 40px from execCommand indent)
    const marginMatch = style.match(/margin(?:-left)?\s*:\s*([^;]+)/i);
    if (marginMatch) {
      const value = marginMatch[1].trim();
      if (/^(\d+(?:\.\d+)?(?:px|em|ch)\s*)+$/.test(value) || /^0\s+0\s+0\s+\d+(?:px|em|ch)$/.test(value)) {
        attrs['style'] = `margin-left: ${value.includes(' ') ? value.split(/\s+/).pop() : value}`;
      } else if (/^\d+px$/.test(value)) {
        attrs['style'] = `margin-left: ${value}`;
      }
    }
    if (!attrs['style']) attrs['style'] = 'margin-left: 40px';
  }
  return attrs;
}

function serializeAttrs(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${ escapeAttr(v) }"`)
    .join(' ');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize HTML string for safe use in dangerouslySetInnerHTML.
 * Uses a temporary div and walk to allow only safe tags and attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: string[] = [];

  function escapeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function walk(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(escapeText(node.textContent || ''));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!isAllowedTag(tag)) {
      // #region agent log
      if (typeof document !== 'undefined' && (tag === 'blockquote' || tag === 'blockquote'.toLowerCase())) {
        try {
          fetch('http://127.0.0.1:7246/ingest/55bae2bf-7bcd-493f-9377-31aad3707983',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sanitizeHtml.ts:strip-tag',message:'Stripping disallowed tag',data:{tag},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        } catch (_) {}
      }
      // #endregion
      Array.from(node.childNodes).forEach(walk);
      return;
    }
    const attrs = sanitizeAttributes(el);
    const attrStr = Object.keys(attrs).length ? ' ' + serializeAttrs(attrs) : '';
    if (tag === 'br') {
      out.push('<br/>');
      return;
    }
    out.push(`<${tag}${attrStr}>`);
    Array.from(node.childNodes).forEach(walk);
    out.push(`</${tag}>`);
  }

  Array.from(doc.body.childNodes).forEach(walk);
  return out.join('');
}

/** Heuristic: content is stored as HTML (from WYSIWYG) if it contains any HTML tag (e.g. <br>, <div>, <p>). */
export function isHtmlContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  if (!trimmed.includes('<') || !trimmed.includes('>')) return false;
  return trimmed.startsWith('<') || /<[a-z][^>]*\/?>\s*|<\/([a-z]+)>/i.test(trimmed);
}
