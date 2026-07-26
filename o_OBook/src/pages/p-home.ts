import { LitElement, html, css, type TemplateResult, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css?inline';

@customElement('p-home')
export class XHome extends LitElement {
   static styles = css`${unsafeCSS(bootstrapStyles)}
    
      h1 { color: #333; }
      .min-vh-100 {
        min-height: calc(100vh - 100px) !important; 
      }
    `;

  protected render(): TemplateResult {
    return html`
      <h2>Главная</h2>
      <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div class="card text-center shadow" style="max-width: 500px; border-radius: 1rem;">
            <img 
            src="/obook.png" 
            class="card-img-top" 
            alt="o_OBook"
            style="border-top-left-radius: 1rem; border-top-right-radius: 1rem;"
            />
            
            <div class="card-body p-4">
            <h3 class="card-title fw-bold mb-3">Что это?</h3>
            <p class="card-text text-muted mb-4">
                Это хранилище некоторой информации за время моего обучения в 
                Центр «Пуск» МФТИ 2026. Гр. Д01-134 "Инженер умных систем".
            </p>
            </div>
        </div>
      </div>

    `;
  }
}
