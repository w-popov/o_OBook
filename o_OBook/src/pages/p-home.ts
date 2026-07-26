import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('p-home')
export class XHome extends LitElement {
  static styles = css`h1 { color: #333; }`;

  protected render(): TemplateResult {
    return html`
      <h1>Главная страница</h1>
      <p>Добро пожаловать в o_OBook.</p>
    `;
  }
}
