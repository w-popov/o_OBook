import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('p-cbits')
export class XHome extends LitElement {
  static styles = css`h1 { color: #333; }`;

  protected render(): TemplateResult {
    return html`
      <h1>Битовые операции</h1>
      <p>Здесь про битовые операции</p>
    `;
  }
}
