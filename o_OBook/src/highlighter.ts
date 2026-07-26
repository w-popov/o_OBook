import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import { html, type TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/**
 * Функция принимает строку кода на Си и возвращает отформатированный HTML для Lit
 */
export function highlightC(code: string): TemplateResult {
  const trimmedCode = code.trim();
  const highlighted = Prism.highlight(trimmedCode, Prism.languages.c, 'c');
  return html`<pre class="language-c"><code class="language-c">${unsafeHTML(highlighted)}</code></pre>`;
}
