import { LitElement, html, unsafeCSS, css,  } from 'lit'
import { customElement,  } from 'lit/decorators.js'
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css?inline';

/**
 * An example element.
 *
 * 
 */
@customElement('main-app-container')
export class o_OBook extends LitElement {
  
  static styles = css`${unsafeCSS(bootstrapStyles)}`

  render() {
    return html`
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum dignissimos quis, 
            ullam neque sed possimus architecto quidem tempora commodi, illo cumque expedita. 
            Facilis velit beatae saepe aliquam quos, maxime reprehenderit.</p>
    `
  }

  
}

declare global {
  interface HTMLElementTagNameMap {
    'main-app-container': o_OBook  
  }
}


// workbench.browser.openLocalhostLinks
