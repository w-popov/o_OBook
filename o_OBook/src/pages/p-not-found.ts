import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('p-not-found')
export class XNotFound extends LitElement {
  static styles = css`:host { display: block; color: red; }`;

  protected render(): TemplateResult {
    return html`
      <h1>Ошибка 404</h1>
      <p>К сожалению, запрашиваемая страница не существует.</p>
      <a href="/">Вернуться на главную</a>
    `;
  }
}
