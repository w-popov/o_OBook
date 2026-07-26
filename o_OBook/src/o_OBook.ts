import { LitElement, html, unsafeCSS, css,  } from 'lit'
import { customElement,  } from 'lit/decorators.js'
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css?inline';
import { Router } from '@lit-labs/router';
import { Offcanvas } from 'bootstrap';

/**
 * Главный компонент
 */
@customElement('main-app-container')
export class o_OBook extends LitElement {
  
  static styles = css`${unsafeCSS(bootstrapStyles)}
  
    .bd-placeholder-img {
        font-size: 1.125rem;
        text-anchor: middle;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
      }
      @media (min-width: 768px) {
        .bd-placeholder-img-lg {
          font-size: 3.5rem;
        }
      }
      .b-example-divider {
        width: 100%;
        height: 3rem;
        background-color: #0000001a;
        border: solid rgba(0, 0, 0, 0.15);
        border-width: 1px 0;
        box-shadow:
          inset 0 0.5em 1.5em #0000001a,
          inset 0 0.125em 0.5em #00000026;
      }
      .b-example-vr {
        flex-shrink: 0;
        width: 1.5rem;
        height: 100vh;
      }
      .bi {
        vertical-align: -0.125em;
        fill: currentColor;
      }
      .nav-scroller {
        position: relative;
        z-index: 2;
        height: 2.75rem;
        overflow-y: hidden;
      }
      .nav-scroller .nav {
        display: flex;
        flex-wrap: nowrap;
        padding-bottom: 1rem;
        margin-top: -1px;
        overflow-x: auto;
        text-align: center;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
      }
      .btn-bd-primary {
        --bd-violet-bg: #712cf9;
        --bd-violet-rgb: 112.520718, 44.062154, 249.437846;
        --bs-btn-font-weight: 600;
        --bs-btn-color: var(--bs-white);
        --bs-btn-bg: var(--bd-violet-bg);
        --bs-btn-border-color: var(--bd-violet-bg);
        --bs-btn-hover-color: var(--bs-white);
        --bs-btn-hover-bg: #6528e0;
        --bs-btn-hover-border-color: #6528e0;
        --bs-btn-focus-shadow-rgb: var(--bd-violet-rgb);
        --bs-btn-active-color: var(--bs-btn-hover-color);
        --bs-btn-active-bg: #5a23c8;
        --bs-btn-active-border-color: #5a23c8;
      }
      .bd-mode-toggle {
        z-index: 1500;
      }
      .bd-mode-toggle .bi {
        width: 1em;
        height: 1em;
      }
      .bd-mode-toggle .dropdown-menu .active .bi {
        display: block !important;
      }
      .bi {
        display: inline-block;
        width: 1rem;
        height: 1rem;
      }

      @media (min-width: 768px) {
      .sidebar .offcanvas-lg {
        position: -webkit-sticky;
        position: sticky;
        top: 48px;
      }
      .navbar-search {
        display: block;
      }
    }

    .sidebar .nav-link {
      font-size: .875rem;
      font-weight: 500;
    }

    .sidebar .nav-link.active {
      color: #2470dc;
    }

    .sidebar-heading {
      font-size: .75rem;
    }

    .navbar-brand {
      padding-top: .75rem;
      padding-bottom: .75rem;
      background-color: rgba(0, 0, 0, .25);
      box-shadow: inset -1px 0 0 rgba(0, 0, 0, .25);
    }

    .navbar .form-control {
      padding: .75rem 1rem;
    }
  `

  private offcanvas: Offcanvas | null = null;

  
  /* Роутер */
  private router = new Router(this, [
    {
      path: import.meta.env.BASE_URL,
      // Ленивая загрузка файла стратегии перед активацией
      enter: async (): Promise<boolean> => { 
        await import('./pages/p-home.js'); 
        return true;
      },
      render: () => html`<p-home></p-home>`
    },
    {
      path: `${import.meta.env.BASE_URL}p-cbits`,
      enter: async (): Promise<boolean> => { 
        await import('./pages/p-cbits.js'); 
        return true;
      },
      render: () => html`<p-cbits></p-cbits>`
    },
    {
      // 404
      path: `${import.meta.env.BASE_URL}*`,
      enter: async (): Promise<boolean> => { 
        await import('./pages/p-not-found.js'); 
        return true;
      },
      render: () => html`<p-not-found></p-not-found>`
    }
  ]);


  firstUpdated() {
    const sidebarMenu = this.shadowRoot?.getElementById('sidebarMenu');
    if (sidebarMenu) {
      this.offcanvas = new Offcanvas(sidebarMenu);
      
      // слушатель для кнопки закрытия
      const closeButton = sidebarMenu.querySelector('[data-bs-dismiss="offcanvas"]');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.offcanvas?.hide();
        });
      }
    }
  }

  connectedCallback() {
    super.connectedCallback(); 
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.offcanvas) {
      this.offcanvas.dispose();
    }
  }

  private toggleOffcanvas() {
    if (this.offcanvas) {
      this.offcanvas.toggle();
    }
  }

  private closeOffcanvas() {
    if (this.offcanvas) {
      this.offcanvas.hide();
    }
  }

/////////////////////////////////////////////////////////////////////
  render() {
    return html`
    <svg xmlns="http://www.w3.org/2000/svg" class="d-none">
      <symbol id="list" viewBox="0 0 15 15">
        <path
          fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
        ></path>
      </symbol>
    </svg>

    <header class="navbar sticky-top bg-dark flex-md-nowrap p-0 shadow" data-bs-theme="dark">
      <a class="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6 text-white" href="${import.meta.env.BASE_URL}">Справочник</a>
      <ul class="navbar-nav flex-row d-md-none">
        <li class="nav-item text-nowrap">
          <button
            class="nav-link px-3 text-white"
            type="button"
            @click=${this.toggleOffcanvas}
            data-bs-toggle="offcanvas"
            data-bs-target="#sidebarMenu"
            aria-controls="sidebarMenu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <svg class="bi" aria-hidden="true">
              <use xlink:href="#list"></use>
            </svg>
          </button>
        </li>
      </ul>
    </header>

    <div class="container-fluid">
      <div class="row">
        <div class="sidebar border border-right col-md-3 col-lg-2 p-0 bg-body-tertiary">
          <div class="offcanvas-md offcanvas-end bg-body-tertiary" tabindex="-1" id="sidebarMenu" aria-labelledby="sidebarMenuLabel">
            <div class="offcanvas-header">
              <h5 class="offcanvas-title" id="sidebarMenuLabel">
                Справочник
              </h5>
              <button
                type="button"
                class="btn-close"
                @click=${this.closeOffcanvas}
                data-bs-dismiss="offcanvas"
                data-bs-target="#sidebarMenu"
                aria-label="Close"
              ></button>
            </div>
            <div class="offcanvas-body d-md-flex flex-column p-0 pt-lg-3 overflow-y-auto">
              
              <ul class="nav flex-column">
                <li class="nav-item">
                  <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-body-secondary text-uppercase">
                  <span>Си</span>
                  </h6>
                  <a class="nav-link d-flex align-items-center gap-2 active" aria-current="page" href="${import.meta.env.BASE_URL}p-cbits" @click=${this.closeOffcanvas}>
                    Битовые операции
                  </a>
                </li>
                <!-- <li class="nav-item">
                  <a class="nav-link d-flex align-items-center gap-2" href="#">
                    Orders
                  </a>
                </li> -->
                <hr class="my-3" />
              </ul>
             
            </div>
          </div>
        </div>
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          ${this.router.outlet()}
        </main>
      </div>
    </div>
    `
  }
///////////////////////////////////////////////////////////////////////



  
}

declare global {
  interface HTMLElementTagNameMap {
    'main-app-container': o_OBook  
  }
}

// workbench.browser.openLocalhostLinks
