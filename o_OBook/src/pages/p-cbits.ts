import { LitElement, html, css, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css?inline';
import prismTheme from 'prismjs/themes/prism-tomorrow.css?inline'; 
import { highlightC } from '../highlighter.js';

/////////////////////////////////////////////////////////
type BitwiseOp = '&' | '|' | '^' | '~' | '<<' | '>>';
type BitWidth = 8 | 16 | 32 | 64;
type InputMode = 'dec' | 'hex' | 'bin';

@customElement('bit-calculator')
export class BitCalculator extends LitElement {
 
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  static override styles = css`
    :host {
      display: block;
      font-family: var(--bs-body-font-family, system-ui, sans-serif);
    }
    .bit-row {
      display: flex;
      align-items: center;
      font-family: var(--bs-font-monospace, monospace);
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .row-label {
      width: 70px;
      flex-shrink: 0;
      color: #6c757d;
    }
    .cells-container {
      display: flex;
      gap: 0;
    }
    .bit-cell {
      width: 24px;
      text-align: center;
      display: inline-block;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
    }
    .index-cell {
      color: #6c757d;
      font-size: 0.65rem;
      font-weight: bold;
    }
    .btn-xs {
      padding: 0px 3px;
      font-size: 0.6rem;
      line-height: 1.1;
      border-radius: 2px;
    }
    .input-compact {
      width: 6rem !important;
      min-width: 0 !important;
      font-size: 0.75rem !important;
      padding: 2px 4px !important;
    }
    .select-compact {
      width: auto !important;
      font-size: 0.7rem !important;
      padding: 2px 4px !important;
    }
    .label-compact {
      font-size: 0.65rem !important;
      margin-bottom: 2px !important;
    }
    .preview-compact {
      font-size: 0.6rem !important;
      line-height: 1.2 !important;
    }
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    input[type=number] { 
      -moz-appearance: textfield; 
    }
    .controls-row {
      margin-top: 8px;
    }

    .mbinputs-8
    {
      margin-bottom: 8px !important;
    }
  `;

  @state() private valueA: bigint = 12n;
  @state() private valueB: bigint = 5n;
  @state() private inputStrA = '12';
  @state() private inputStrB = '5';
  @state() private modeA: InputMode = 'dec';
  @state() private modeB: InputMode = 'dec';
  @state() private operation: BitwiseOp = '&';
  @state() private bitWidth: BitWidth = 8;

  private _getMask(): bigint {
    return (1n << BigInt(this.bitWidth)) - 1n;
  }

  private _applyMask(val: bigint): bigint {
    return val & this._getMask();
  }

  private _calculateResult(): bigint {
    const mask = this._getMask();
    const a = BigInt(this.valueA) & mask;
    const b = BigInt(this.valueB) & mask;
    
    let res: bigint = 0n;

    switch (this.operation) {
      case '&': res = a & b; break;
      case '|': res = a | b; break;
      case '^': res = a ^ b; break;
      case '~': res = ~a; break; 
      case '<<': res = a << b; break;
      case '>>': res = a >> b; break; 
    }

    return res & mask;
  }

  private _formatValue(val: bigint, mode: InputMode): string {
    const masked = this._applyMask(val);
    switch (mode) {
      case 'bin': return masked.toString(2).padStart(this.bitWidth, '0');
      case 'hex': return '0x' + masked.toString(16).toUpperCase();
      case 'dec': return masked.toString(10);
    }
  }

  private _getAlternativeView(val: bigint, currentMode: InputMode): string {
    const masked = this._applyMask(val);
    switch (currentMode) {
      case 'dec':
        return `HEX: 0x${masked.toString(16).toUpperCase()} | BIN: ${masked.toString(2).padStart(this.bitWidth, '0')}`;
      case 'hex':
        return `DEC: ${masked.toString(10)} | BIN: ${masked.toString(2).padStart(this.bitWidth, '0')}`;
      case 'bin':
        return `DEC: ${masked.toString(10)} | HEX: 0x${masked.toString(16).toUpperCase()}`;
    }
  }

  private _filterInput(str: string, mode: InputMode): string {
    switch (mode) {
      case 'bin': {
        let filtered = str.replace(/[^01]/g, '');
        if (filtered.length > this.bitWidth) {
          filtered = filtered.slice(0, this.bitWidth);
        }
        return filtered;
      }
      case 'hex': {
        let hasPrefix = str.toLowerCase().startsWith('0x');
        let cleaned = hasPrefix ? str.slice(2) : str;
        let filtered = cleaned.replace(/[^0-9a-fA-F]/g, '');
        const maxLen = Math.ceil(this.bitWidth / 4);
        if (filtered.length > maxLen) {
          filtered = filtered.slice(0, maxLen);
        }
        return hasPrefix ? '0x' + filtered : filtered;
      }
      case 'dec': {
        let filtered = str.replace(/[^0-9]/g, '');
        const maxVal = this._getMask();
        const maxStr = maxVal.toString();
        if (filtered.length > maxStr.length) {
          filtered = filtered.slice(0, maxStr.length);
        }
        if (filtered && BigInt(filtered) > maxVal) {
          filtered = maxStr;
        }
        return filtered;
      }
    }
  }

  private _parseInput(str: string, mode: InputMode): bigint {
    try {
      let cleanStr = str.trim();
      if (cleanStr === '') return 0n;

      switch (mode) {
        case 'bin':
          cleanStr = cleanStr.replace(/[^01]/g, '');
          return cleanStr ? BigInt('0b' + cleanStr) : 0n;
        case 'hex':
          cleanStr = cleanStr.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '');
          return cleanStr ? BigInt('0x' + cleanStr) : 0n;
        case 'dec':
          cleanStr = cleanStr.replace(/[^0-9]/g, '');
          return cleanStr ? BigInt(cleanStr) : 0n;
      }
    } catch {
      return 0n;
    }
  }

  private _changeMode(target: 'A' | 'B', newMode: InputMode): void {
    if (target === 'A') {
      this.modeA = newMode;
      const masked = this._applyMask(this.valueA);
      this.inputStrA = newMode === 'hex' 
        ? masked.toString(16).toUpperCase() 
        : (newMode === 'bin' ? masked.toString(2) : masked.toString(10));
    } else {
      this.modeB = newMode;
      const masked = this._applyMask(this.valueB);
      this.inputStrB = newMode === 'hex' 
        ? masked.toString(16).toUpperCase() 
        : (newMode === 'bin' ? masked.toString(2) : masked.toString(10));
    }
  }

  private _renderBitIndexes(): TemplateResult {
    const cells: TemplateResult[] = [];
    const width = this.bitWidth;
    let step = 4;
    
    if (width === 8) {
      step = 1;
    } else if (width === 16) {
      step = 4;
    } else if (width === 32) {
      step = 4;
    } else if (width === 64) {
      step = 8;
    }

    for (let i = width - 1; i >= 0; i--) {
      const showLabel = i === width - 1 || i === 0 || i % step === 0;
      const label = showLabel ? i.toString() : '·';
      cells.push(html`
        <span class="bit-cell index-cell">${label}</span>
      `);
    }
    return html`<div class="cells-container">${cells}</div>`;
  }

  private _renderBitRow(binaryStr: string, className = ''): TemplateResult {
    const cells = binaryStr.split('').map(bit => html`
      <span class="bit-cell ${className}">${bit}</span>
    `);
    return html`<div class="cells-container">${cells}</div>`;
  }

  private _renderInput(target: 'A' | 'B'): TemplateResult {
    const mode = target === 'A' ? this.modeA : this.modeB;
    const inputStr = target === 'A' ? this.inputStrA : this.inputStrB;
    
    if (mode === 'dec') {
      const maxVal = Number(this._getMask());
      return html`
        <input 
          type="number"
          class="form-control form-control-sm text-center font-monospace input-compact"
          .value=${inputStr}
          min="0"
          max=${maxVal}
          @input=${(e: Event) => {
            const val = (e.target as HTMLInputElement).value;
            const filtered = this._filterInput(val, mode);
            if (target === 'A') {
              this.inputStrA = filtered;
              this.valueA = this._parseInput(filtered, mode);
            } else {
              this.inputStrB = filtered;
              this.valueB = this._parseInput(filtered, mode);
            }
          }}
        />
      `;
    }
    
    return html`
      <input 
        type="text"
        class="form-control form-control-sm text-center font-monospace input-compact"
        .value=${inputStr}
        @input=${(e: Event) => {
          const val = (e.target as HTMLInputElement).value;
          const filtered = this._filterInput(val, mode);
          if (target === 'A') {
            this.inputStrA = filtered;
            this.valueA = this._parseInput(filtered, mode);
            (e.target as HTMLInputElement).value = filtered;
          } else {
            this.inputStrB = filtered;
            this.valueB = this._parseInput(filtered, mode);
            (e.target as HTMLInputElement).value = filtered;
          }
        }}
      />
    `;
  }

  protected override render(): TemplateResult {
    const result = this._calculateResult();
    const isSingleOp = this.operation === '~';

    const strA = this._formatValue(this.valueA, 'bin');
    const strB = this._formatValue(this.valueB, 'bin');
    const strResult = this._formatValue(result, 'bin');

    const altA = this._getAlternativeView(this.valueA, this.modeA);
    const altB = this._getAlternativeView(this.valueB, this.modeB);

    return html`
      <div class="card shadow-sm p-2">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="card-title mb-0 text-primary fw-bold" style="font-size: 0.85rem;">Калькулятор битовых операций</h6>
          
          <div class="d-flex align-items-center gap-1">
            <label class="small text-muted text-nowrap mb-0 label-compact">Разрядность:</label>
            <select class="form-select form-select-sm fw-bold bg-light select-compact" @change=${(e: Event) => { 
              const newWidth = parseInt((e.target as HTMLSelectElement).value) as BitWidth;
              this.bitWidth = newWidth;
              this.inputStrA = this._filterInput(this.inputStrA, this.modeA);
              this.inputStrB = this._filterInput(this.inputStrB, this.modeB);
              this.valueA = this._parseInput(this.inputStrA, this.modeA);
              this.valueB = this._parseInput(this.inputStrB, this.modeB);
            }} .value=${String(this.bitWidth)}>
              <option value="8">8 бит</option>
              <option value="16">16 бит</option>
              <option value="32">32 бит</option>
              <option value="64">64 бит</option>
            </select>
          </div>
        </div>

        <div class="row g-1 align-items-end mb-2 controls-row">
          
          <div class="col-auto">
            <div class="d-flex align-items-center justify-content-between mb-0">
              <label class="form-label small fw-semibold mb-0 label-compact">Число A</label>
              <div class="btn-group ms-1" role="group">
                <button type="button" class="btn btn-xs ${this.modeA === 'dec' ? 'btn-secondary' : 'btn-outline-secondary'}" @click=${() => this._changeMode('A', 'dec')}>DEC</button>
                <button type="button" class="btn btn-xs ${this.modeA === 'hex' ? 'btn-secondary' : 'btn-outline-secondary'}" @click=${() => this._changeMode('A', 'hex')}>HEX</button>
                <button type="button" class="btn btn-xs ${this.modeA === 'bin' ? 'btn-secondary' : 'btn-outline-secondary'}" @click=${() => this._changeMode('A', 'bin')}>BIN</button>
              </div>
            </div>
            ${this._renderInput('A')}
          </div>

          <div class="col-auto">
            <label class="form-label small fw-semibold mb-0 label-compact">Операция</label>
            <select class="form-select form-select-sm text-center fw-bold bg-light select-compact" @change=${(e: Event) => { this.operation = (e.target as HTMLSelectElement).value as BitwiseOp; }} .value=${this.operation}>
              <option value="&">&amp; (AND)</option>
              <option value="|">| (OR)</option>
              <option value="^">^ (XOR)</option>
              <option value="~">~ (NOT)</option>
              <option value="<<">&lt;&lt; (LSH)</option>
              <option value=">>">&gt;&gt; (RSH)</option>
            </select>
          </div>

          <div class="col-auto" ?hidden=${isSingleOp}>
            <div class="d-flex align-items-center justify-content-between mb-0">
              <label class="form-label small fw-semibold mb-0 label-compact">Число B</label>
              <div class="btn-group ms-1" role="group">
                <button type="button" class="btn btn-xs ${this.modeB === 'dec' ? 'btn-secondary' : 'btn-outline-secondary'}" @click=${() => this._changeMode('B', 'dec')}>DEC</button>
                <button type="button" class="btn btn-xs ${this.modeB === 'hex' ? 'btn-secondary' : 'btn-outline-secondary'}" @click=${() => this._changeMode('B', 'hex')}>HEX</button>
                <button type="button" class="btn btn-xs ${this.modeB === 'bin' ? 'btn-secondary' : 'btn-outline-secondary'}" @click=${() => this._changeMode('B', 'bin')}>BIN</button>
              </div>
            </div>
            ${this._renderInput('B')}
          </div>

          <div class="col-auto align-self-center ms-1 preview-compact text-muted lh-sm">
            <div>A: <span class="text-dark">${altA}</span></div>
            <div ?hidden=${isSingleOp}>B: <span class="text-dark">${altB}</span></div>
          </div>
        </div>

        <div class="bg-light p-2 rounded mb-2 shadow-inner overflow-x-auto">
          <div class="d-flex flex-column gap-1" style="min-width: max-content;">
            
            <div class="bit-row">
              <span class="row-label" style="font-size: 0.7rem;">Бит:</span>
              ${this._renderBitIndexes()}
            </div>
            
            <hr class="my-1 border-light opacity-50">
            
            <div class="bit-row">
              <span class="row-label">A:</span>
              ${this._renderBitRow(strA, 'text-success fw-bold')}
            </div>
            
            <div class="bit-row" ?hidden=${isSingleOp}>
              <span class="row-label">B:</span>
              ${this._renderBitRow(strB, 'text-success fw-bold')}
            </div>
            
            <hr class="my-1 border-secondary opacity-25">
            
            <div class="bit-row">
              <span class="row-label fw-bold text-primary">Итог:</span>
              ${this._renderBitRow(strResult, 'text-primary fw-bold')}
            </div>
          </div>
        </div>

        <div class="bg-light d-flex justify-content-around text-center mb-0 py-1 small">
          <div>
            <div class="text-muted text-uppercase" style="font-size: 0.6rem;">Decimal</div>
            <div class="fw-bold text-dark" style="font-size: 0.85rem;">${result.toString()}</div>
          </div>
          <div class="border-start mx-1"></div>
          <div>
            <div class="text-muted text-uppercase" style="font-size: 0.6rem;">Hexadecimal</div>
            <div class="fw-bold text-dark font-monospace" style="font-size: 0.85rem;">${this._formatValue(result, 'hex')}</div>
          </div>
          <div class="border-start mx-1"></div>
          <div>
            <div class="text-muted text-uppercase" style="font-size: 0.6rem;">Binary</div>
            <div class="fw-bold text-dark font-monospace" style="font-size: 0.85rem;">${this._formatValue(result, 'bin')}</div>
          </div>
        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bit-calculator': BitCalculator;
  }
}
////////////////////////////////////////////////////////


@customElement('p-cbits')
export class XHome extends LitElement {
  static styles = css`${unsafeCSS(bootstrapStyles)}
                      ${unsafeCSS(prismTheme)}
    
    pre[class*="language-"] {
      margin: 0;
      padding: 1rem;
      border-radius: 0.375rem;
    }
    /* скролл меню */
    @media (min-width: 992px) {
        .sticky-scroll-menu {
            max-height: calc(100vh - 4rem);
            overflow-y: auto;
            scroll-behavior: smooth;
        }
        .sticky-scroll-menu::-webkit-scrollbar {
            width: 5px;
        }
        .sticky-scroll-menu::-webkit-scrollbar-thumb {
            background-color: #e8e8e9;
            border-radius: 3px;
        }
        .sticky-scroll-menu::-webkit-scrollbar-thumb:hover {
            background-color: #ced4da;
        }
    } // конец скролл меню
  `;

  private _scrollToSection(e: Event) {
  e.preventDefault();
  const target = (e.target as HTMLElement).closest('a') as HTMLAnchorElement;
  if (target && target.hash) {
    const section = this.shadowRoot?.querySelector(target.hash) as HTMLElement;
    if (section) {
      const topOffset = 64; 
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}

  protected render(): TemplateResult {
   return html`
      <div class="container-fluid py-4">
        <!-- Заголовок страницы -->
        <h2 class="mb-4 fw-bold border-bottom pb-2">Битовые операции</h2>

        <div class="row g-4">
          <!-- БЛОК СОДЕРЖАНИЯ (Занимает 3 колонки на больших экранах, на мобильных встает наверх) -->
          <aside class="col-lg-3 order-lg-1">
            <div class="card shadow-sm sticky-lg-top" style="top: 2rem;">
              <div class="card-header bg-light fw-bold py-3">
                Содержание
              </div>
              <div class="list-group list-group-flush sticky-scroll-menu overflow-y-auto" 
                     style="max-height: calc(100vh - 10rem);" 
                     @click=${this._scrollToSection}>
                <a href="#calculator" class="list-group-item list-group-item-action fw-semibold text-primary">
                Битовый калькулятор
                </a>
                <a href="#and" class="list-group-item list-group-item-action">Побитовое И (&amp;)</a>
                <a href="#or" class="list-group-item list-group-item-action">Побитовое ИЛИ (|)</a>
                <a href="#xor" class="list-group-item list-group-item-action">Исключающее ИЛИ (^)</a>
                <a href="#not" class="list-group-item list-group-item-action">Побитовое НЕ (~)</a>
                <a href="#shifts" class="list-group-item list-group-item-action">Битовые сдвиги (&lt;&lt;, &gt;&gt;)</a>
                <a href="#setbit" class="list-group-item list-group-item-action">Установка бита</a>
                <a href="#clrbit" class="list-group-item list-group-item-action">Сброс бита</a>
                <a href="#invertbit" class="list-group-item list-group-item-action">Инверсия бита</a>
                <a href="#checkbit" class="list-group-item list-group-item-action">Проверка бита</a>
                <a href="#iseven" class="list-group-item list-group-item-action">Проверка числа на четность</a>
                <a href="#ispower2" class="list-group-item list-group-item-action">Число степенью 2?</a>
                <a href="#swap" class="list-group-item list-group-item-action">Обмен значениями</a>
                
                <a href="#get-sign" class="list-group-item list-group-item-action">Получение знака числа</a>
                <a href="#abs-value" class="list-group-item list-group-item-action">Модуль числа (abs)</a>
                <a href="#lowest-bit" class="list-group-item list-group-item-action">Извлечение младшего бита</a>
                <a href="#popcount" class="list-group-item list-group-item-action">Подсчет единиц (Керниган)</a>
                <a href="#round-pow2" class="list-group-item list-group-item-action">Округление к степени 2</a>
                <a href="#toggle-case" class="list-group-item list-group-item-action">Инверсия регистра ASCII</a>
                <a href="#to-lower" class="list-group-item list-group-item-action">Перевод в нижний регистр</a>
                <a href="#to-upper" class="list-group-item list-group-item-action">Перевод в верхний регистр</a>
                <a href="#bitwise-min" class="list-group-item list-group-item-action">Минимум двух чисел</a>
                <a href="#bitwise-max" class="list-group-item list-group-item-action">Максимум двух чисел</a>
                <a href="#diff-signs" class="list-group-item list-group-item-action">Проверка разных знаков</a>
                <a href="#fast-mul" class="list-group-item list-group-item-action">Быстрое умножение на 2^n</a>
                <a href="#fast-div" class="list-group-item list-group-item-action">Быстрое деление на 2^n</a>
                <a href="#bit-inc" class="list-group-item list-group-item-action">Инкремент без знака +</a>
                <a href="#bit-dec" class="list-group-item list-group-item-action">Декремент без знака -</a>

                <a href="#same-signs" class="list-group-item list-group-item-action">Проверка одинаковых знаков</a>
                <a href="#clear-low-bits" class="list-group-item list-group-item-action">Зануление n младших бит</a>
                <a href="#fast-mod" class="list-group-item list-group-item-action">Остаток от деления % 2^n</a>
                <a href="#align-down" class="list-group-item list-group-item-action">Выравнивание вниз до 2^n</a>
                <a href="#align-up" class="list-group-item list-group-item-action">Выравнивание вверх до 2^n</a>
                <a href="#negate" class="list-group-item list-group-item-action">Смена знака числа (~X + 1)</a>
                <a href="#all-ones" class="list-group-item list-group-item-action">Проверка вида 2^n - 1</a>
                <a href="#rot-left" class="list-group-item list-group-item-action">Циклический сдвиг влево</a>

                <a href="#rot-right" class="list-group-item list-group-item-action">Циклический сдвиг вправо</a>
                <a href="#swap-bytes16" class="list-group-item list-group-item-action">Переворот байт (16 бит)</a>
                <a href="#swap-bytes32" class="list-group-item list-group-item-action">Переворот байт (32 бита)</a>
                <a href="#reverse-bits8" class="list-group-item list-group-item-action">Зеркальные биты в байте</a>
                <a href="#bit-average" class="list-group-item list-group-item-action">Среднее без переполнения</a>
                <a href="#conditional-set" class="list-group-item list-group-item-action">Запись флага в бит без if</a>
                <a href="#bit-merge" class="list-group-item list-group-item-action">Слияние битов по маске</a>
                <a href="#is-power4" class="list-group-item list-group-item-action">Число степенью 4?</a>
                <a href="#clear-trailing-ones" class="list-group-item list-group-item-action">Сброс хвоста из единиц</a>
                <a href="#set-trailing-zeros" class="list-group-item list-group-item-action">Заполнение хвоста из нулей</a>

                <a href="#overflow-add" class="list-group-item list-group-item-action">Переполнение при сложении</a>
                <a href="#fast-log2" class="list-group-item list-group-item-action">Двоичный логарифм (log2)</a>
                <a href="#sign-extend" class="list-group-item list-group-item-action">Расширение знака b-бит</a>
                <a href="#parity-check" class="list-group-item list-group-item-action">Проверка четности (Parity)</a>
                <a href="#interleave-bits" class="list-group-item list-group-item-action">Чередование бит (Z-Order)</a>
                <a href="#has-zero-byte" class="list-group-item list-group-item-action">Поиск нулевого байта</a>
                <a href="#msb-mask" class="list-group-item list-group-item-action">Изоляция старшего бита</a>
                <a href="#mod-three" class="list-group-item list-group-item-action">Проверка деления на 3</a>
                <a href="#bit-condense" class="list-group-item list-group-item-action">Сжатие битовых групп</a>
                <a href="#zigzag-encode" class="list-group-item list-group-item-action">Кодирование ZigZag (Protobuf)</a>

                <a href="#zigzag-decode" class="list-group-item list-group-item-action">Декодирование ZigZag</a>
                <a href="#clear-high-bits" class="list-group-item list-group-item-action">Зануление старших бит</a>
                <a href="#extract-bitfield" class="list-group-item list-group-item-action">Извлечение группы бит</a>
                <a href="#overflow-mul" class="list-group-item list-group-item-action">Переполнение при умножении</a>
                <a href="#intrinsic-popcount" class="list-group-item list-group-item-action">Аппаратный подсчет единиц</a>
                <a href="#intrinsic-clz" class="list-group-item list-group-item-action">Подсчет ведущих нулей (clz)</a>
                <a href="#intrinsic-ctz" class="list-group-item list-group-item-action">Подсчет хвостовых нулей (ctz)</a>
                <a href="#intrinsic-bswap64" class="list-group-item list-group-item-action">Переворот байт (64 бита)</a>
                <a href="#bit-select" class="list-group-item list-group-item-action">Побитовый выбор по условию</a>
                <a href="#vector-xor" class="list-group-item list-group-item-action">Инверсия данных блоками</a>

                <a href="#lfsr-rand" class="list-group-item list-group-item-action">Случайный бит (LFSR)</a>
                <a href="#crc8-fast" class="list-group-item list-group-item-action">Вычисление CRC8 на лету</a>
                <a href="#rgb565-unpack" class="list-group-item list-group-item-action">Распаковка цвета RGB565</a>
                <a href="#rgb565-pack" class="list-group-item list-group-item-action">Упаковка цвета RGB565</a>
                <a href="#bit-width" class="list-group-item list-group-item-action">Ширина числа в битах</a>
                <a href="#clear-msb" class="list-group-item list-group-item-action">Сброс старшей единицы</a>
                <a href="#bit-range-mask" class="list-group-item list-group-item-action">Изоляция диапазона [H:L]</a>
                <a href="#logical-shift" class="list-group-item list-group-item-action">Логический сдвиг знакового int</a>
                <a href="#alternate-bits" class="list-group-item list-group-item-action">Проверка чередования бит</a>
                <a href="#flip-even-bits" class="list-group-item list-group-item-action">Инверсия четных битов</a>

                <a href="#hamming-distance" class="list-group-item list-group-item-action">Расстояние Хэмминга</a>
                <a href="#utf8-len" class="list-group-item list-group-item-action">Длина UTF-8 символа</a>
                <a href="#utf8-continuation" class="list-group-item list-group-item-action">Проверка UTF-8 продолжения</a>
                <a href="#varint-encode" class="list-group-item list-group-item-action">Сжатие в Varint (LEB128)</a>
                <a href="#wang-hash" class="list-group-item list-group-item-action">Битовое хэширование Ванга</a>
                <a href="#div-three-fixed" class="list-group-item list-group-item-action">Деление на 3 через сдвиг</a>
                <a href="#clear-bit-range" class="list-group-item list-group-item-action">Стирание диапазона битов</a>
                <a href="#nibble-swap" class="list-group-item list-group-item-action">Смена полубайт (Nibble Swap)</a>
                <a href="#is-zero" class="list-group-item list-group-item-action">Проверка регистра на 0</a>
                <a href="#negate-sub" class="list-group-item list-group-item-action">Смена знака через вычитание</a>

                <a href="#crc16-bitwise" class="list-group-item list-group-item-action">Расчет CRC16 (Побитовый)</a>
                <a href="#crc32-bitwise" class="list-group-item list-group-item-action">Расчет CRC32 (Побитовый)</a>
                <a href="#crc32-branchless" class="list-group-item list-group-item-action">CRC32 без ветвления</a>
                <a href="#reflect-16" class="list-group-item list-group-item-action">Реверс битов uint16_t</a>
                <a href="#reflect-32" class="list-group-item list-group-item-action">Реверс битов uint32_t</a>
                <a href="#crc8-table-gen" class="list-group-item list-group-item-action">Генерация таблицы CRC8</a>
                <a href="#crc8-table-lookup" class="list-group-item list-group-item-action">Табличный расчет CRC8</a>
                <a href="#crc-xor-property" class="list-group-item list-group-item-action">Линейность CRC (XOR)</a>
                <a href="#crc-clmul" class="list-group-item list-group-item-action">Аппаратный CLMUL (Концепция)</a>
                <a href="#crc-symmetric" class="list-group-item list-group-item-action">Симметричность полинома</a>

                <a href="#fast-inv-sqrt" class="list-group-item list-group-item-action">Инверсный корень (Quake III)</a>
                <a href="#find-single" class="list-group-item list-group-item-action">Поиск уникального элемента (XOR)</a>
                <a href="#one-bit-diff" class="list-group-item list-group-item-action">Отличие ровно в один бит</a>
                <a href="#bit-rle" class="list-group-item list-group-item-action">Длина битовой серии (RLE)</a>
                <a href="#pack-bools" class="list-group-item list-group-item-action">Упаковка 8 флагов в байт</a>
                <a href="#unpack-bools" class="list-group-item list-group-item-action">Распаковка байта флагов</a>
                <a href="#align-down-8" class="list-group-item list-group-item-action">Округление вниз до кратного 8</a>
                <a href="#align-up-8" class="list-group-item list-group-item-action">Округление вверх до кратного 8</a>
                <a href="#next-perm" class="list-group-item list-group-item-action">Битовая перестановка Госпера</a>
                <a href="#abs-diff" class="list-group-item list-group-item-action">Абсолютная разность без if</a>

              </div>
            </div>
          </aside>

          <!-- ОСНОВНОЙ КОНТЕНТ (Занимает 9 колонок) -->
          <main class="col-lg-9 order-lg-2">
            <div class="p-4 bg-white border rounded shadow-sm">
               <section id="calculator" class="mb-5">
                <bit-calculator></bit-calculator>
              </section>
              <!-- 1. Побитовое И (AND) -->
              <section id="and" class="mb-5">
                <h4 class="fw-bold text-primary">1. Побитовое И (AND)</h4>
                <p class="text-muted">
                  Оператор <code>&amp;</code> сравнивает каждый бит первого операнда с соответствующим битом второго операнда. 
                  Если оба бита равны 1, соответствующий результирующий бит устанавливается в 1. В противном случае — в 0.
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  0101 (5)\n&amp; 0011 (3)\n-------\n  0001 (1)</code></pre>
                </div>
                
                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Проверка четности и маскирование битов</h5>
                ${highlightC(`
#include <stdio.h>

int main() {
    int num = 43; // В двоичной системе: 00101011
    
    // 1. Проверка младшего бита (проверка на четность)
    if ((num & 1) != 0) {
        printf("Число %d нечетное\\n", num);
    }

    // 2. Сброс (очистка) определенного бита с помощью маски
    unsigned char flags = 0b00001111; // Исходные флага
    unsigned char mask  = 0b00000100; // Хотим сбросить 2-й бит
    
    // Операция AND с инвертированной маской (~mask = 11111011)
    flags = flags & ~mask; // Результат: 0b00001011
    return 0;
}
                `)}
              </section>

              <!-- 2. Побитовое ИЛИ (OR) -->
              <section id="or" class="mb-5">
                <h4 class="fw-bold text-primary">2. Побитовое ИЛИ (OR)</h4>
                <p class="text-muted">
                  Оператор <code>|</code> устанавливает результирующий бит в 1, если хотя бы один из соответствующих битов операндов равен 1. В противном случае — в 0.
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  0101 (5)\n| 0011 (3)\n-------\n  0111 (7)</code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Установка битовых флагов в регистре</h5>
                ${highlightC(`
#include <stdio.h>

// Определение маски для флагов доступа (сдвигом влево)
#define FLAG_READ  (1 << 0) // 00000001
#define FLAG_WRITE (1 << 1) // 00000010
#define FLAG_EXEC  (1 << 2) // 00000100

int main() {
    unsigned char my_permissions = 0b00000000; // Изначально прав нет

    // Принудительное включение прав на чтение и выполнение через оператор ИЛИ
    my_permissions = my_permissions | FLAG_READ | FLAG_EXEC; // Стал: 00000101
    
    // Альтернативная сокращенная запись (добавление прав на запись)
    my_permissions |= FLAG_WRITE; // Теперь установлены все три бита: 00000111
    return 0;
}
                `)}
              </section>

              <!-- 3. Исключающее ИЛИ (XOR) -->
              <section id="xor" class="mb-5">
                <h4 class="fw-bold text-primary">3. Исключающее ИЛИ (XOR)</h4>
                <p class="text-muted">
                  Оператор <code>^</code> устанавливает результирующий бит в 1, только если один из битов равен 1, а другой — 0 (биты в разряде различаются).
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  0101 (5)\n^ 0011 (3)\n-------\n  0110 (6)</code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Переключение состояния бита (Toggle) и XOR-шифрование</h5>
                ${highlightC(`
#include <stdio.h>

int main() {
    // 1. Быстрое переключение состояния пина (например, мигание светодиода)
    unsigned char led_register = 0b00000000;
    unsigned char led_mask = 0b00000001;     // Нулевой бит отвечает за LED

    led_register ^= led_mask; // Был 0, стал 1 (Включили)
    led_register ^= led_mask; // Был 1, стал 0 (Выключили)

    // 2. Алгоритм обмена значениями переменных без буфера
    int a = 15, b = 27;
    a ^= b; 
    b ^= a; 
    a ^= b; // Теперь значения поменялись местами: a = 27, b = 15
    return 0;
}
                `)}
              </section>

              <!-- 4. Побитовое НЕ (NOT) -->
              <section id="not" class="mb-5">
                <h4 class="fw-bold text-primary">4. Побитовое НЕ (NOT)</h4>
                <p class="text-muted">
                  Унарный оператор <code>~</code> (тильда) инвертирует каждый отдельный бит операнда. Все единицы превращаются в нули, а нули — в единицы.
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>~ 00001111 (15)\n---------\n  11110000 (240 для unsigned char)</code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Инвертирование масок и особенности знаковых типов</h5>
                ${highlightC(`
#include <stdio.h>

int main() {
    // 1. Инвертирование маски для последующей очистки битов
    unsigned char mask = 0b00001111;
    unsigned char inverted_mask = ~mask; // Результат: 0b11110000

    // 2. Особенность работы со знаковыми переменными (дополнительный код)
    int value = 0;
    int inverted_value = ~value; // Результат: -1
    
    printf("Инверсия 0 в знаковом int дает: %d\\n", inverted_value);
    return 0;
}
                `)}
              </section>

              <!-- 5. Битовые сдвиги (SHIFTS) -->
              <section id="shifts" class="mb-2">
                <h4 class="fw-bold text-primary">5. Битовые сдвиги (Shifts)</h4>
                <p class="text-muted">
                  Операторы сдвигают битовую сетку числа влево <code>&lt;&lt;</code> или вправо <code>&gt;&gt;</code> на указанное количество позиций. Сдвиг влево на N бит аналогичен умножению на 2^N, а сдвиг вправо — целочисленному делению на 2^N.
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  00000101 (5) &lt;&lt; 2 позиций\n---------\n  00010100 (20)</code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Быстрая арифметика и упаковка байт</h5>
                ${highlightC(`
#include <stdio.h>
#include <stdint.h>

int main() {
    // 1. Быстрое умножение и деление через сдвиги
    int x = 7;
    int multiply_by_4 = x << 2; // 7 * 4 = 28
    int divide_by_2   = x >> 1; // 7 / 2 = 3

    // 2. Упаковка двух 8-битных чисел в один 16-битный регистр
    uint8_t high_byte = 0xAB; // Старший байт
    uint8_t low_byte  = 0xCD; // Младший байт

    // Результат: 0xABCD
    uint16_t packed_word = ((uint16_t)high_byte << 8) | low_byte; 
    return 0;
}
                `)}
              </section>
            <!-- 6 установка бита-->
              <section id="setbit" class="mb-2">
                <h4 class="fw-bold text-primary">6. Установка бита</h4>
                <p class="text-muted fw-bold">
                  X |= (1U << n);
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  00000101  (X = 5) \n| 00001000  (Маска 1U << 3)\n---------\n  00001101  (Результат = 13) </code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Установка n-го бита</h5>
                ${highlightC(`
#include <stdio.h>

// Макрос для установки n-го бита
#define SET_BIT(X, n) ((X) |= (1U << (n)))

int main(void) { 
    unsigned int X = 5; // 00000101
    int n = 3;
    // Установка 3-го бита (индексация с 0)
    SET_BIT(X, n); 
    printf("Результат: %u", n, X); // 13 (00001101)
    return 0;
}
                `)}
              </section>

              <!-- 7 сброс бита -->
              <section id="clrbit" class="mb-2">
                <h4 class="fw-bold text-primary">7. Сброс бита</h4>
                <p class="text-muted fw-bold">
                  X &= ~(1U << n);
                </p>
                <p class="text-muted">
                  1. Создается маска (1U << 3): 00001000 <br>
                  2. Маска инвертируется ~: НЕ оператор меняет все нули на единицы, а единицы на нули. ~00001000 превращается в 11110111 <br>
                  3. Применяется И (&): Операция И возвращает 1 только если оба бита равны 1
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  00001101  (X = 13) \n& 11110111  (Инвертированная маска)\n---------\n  00000101  (Результат = 5) </code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Сброс n-го бита</h5>
                ${highlightC(`
#include <stdio.h>

// Макрос для сброса n-го бита в 0
#define CLEAR_BIT(X, n) ((X) &= ~(1U << (n)))

int main(void) {
    unsigned int X = 13; // 00001101
    int n = 3;

    // Сбросить 3-й бит
    CLEAR_BIT(X, n); 
    printf("Результат %u", n, X); // 5 (00000101)

    return 0;
}
                `)}
              </section>

              <!-- 8 Инверсия бита -->
              <section id="invertbit" class="mb-2">
                <h4 class="fw-bold text-primary">8. Инверсия бита</h4>
                <p class="text-muted fw-bold">
                  X ^= (1U << n);
                </p>
                <p class="text-muted">
                  Пусть X = 5 (00000101). Инвертируем 3-й бит (сейчас он равен 0).<br>
                  1. Создаем маску (1U << 3): Получаем 00001000 <br>
                  2. Применяем XOR (^): Исключающее ИЛИ возвращает 1, только если биты разные <br>
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code>  00000101  (X = 5) \n^ 00001000  (Маска)\n---------\n  00001101  (Результат = 13. Бит стал равен 1) </code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Инверсия n-го бита</h5>
                ${highlightC(`
#include <stdio.h>

// Макрос для инверсии (переключения) n-го бита
#define TOGGLE_BIT(X, n) ((X) ^= (1U << (n)))

int main(void) {
    unsigned int X = 5; // 00000101
    int n = 3;

    // Переключаем 3-й бит (0 станет 1)
    TOGGLE_BIT(X, n);
    printf("После первой инверсии: %u", X); // 13 (00001101)

    // Переключаем 3-й бит обратно (1 станет 0)
    TOGGLE_BIT(X, n);
    printf("После второй инверсии: %u", X); // 5 (00000101)

    return 0;
}
                `)}
              </section>

              <!-- 9 Проверка бита -->
              <section id="checkbit" class="mb-2">
                <h4 class="fw-bold text-primary">9. Проверка бита</h4>
                <p class="text-muted fw-bold">
                  (X >> n) & 1U;
                </p>
                <p class="text-muted">
                    Альтернативный способ (без сдвига X): <span class="fw-bold">(X & (1U << n))</span> 
                </p>
                <p class="text-muted">
                  I: Пусть X = 5 (00000101). Проверим состояние 2-го бита (он равен 1).<br>
                  1. Сдвигаем вправо (X >> 2): Продвигаем нужный нам бит в самый конец (в нулевую позицию). Было: 00000101 → Стало: 00000001 <br>
                  2. Накладываем маску & 1U: Зануляем все старшие биты, кроме самого последнего. 1U — это 00000001 <br><br>
                  II: Для 2-го бита числа X = 5 (00000101): <br>
                  1. Создаем маску 1U << 2: получаем 00000100 <br>
                  2. Применяем И (&)
                </p>
                <div class="bg-light p-3 rounded mb-3">
                  <pre class="m-0"><code><b>I:</b>\n  00000001  (Сдвинутый X) \n& 00000001  (Маска 1U)\n---------\n  00000001  (Результат = 1, значит бит был равен 1) </code></pre>
                  <pre class="m-0"><code><b>II:</b>\n  00000101  (X = 5) \n& 00000100  (Маска)\n---------\n  00000100  (Результат = 4) </code></pre>
                </div>

                <h5 class="h6 fw-bold text-secondary mb-2">Пример на Си: Проверка бита</h5>
                ${highlightC(`
#include <stdio.h>
#include <stdbool.h>

// Способ 1: сдвиг числа вправо. Возвращает строго 0 или 1
#define CHECK_BIT_V1(X, n) (((X) >> (n)) & 1U)

// Способ 2: сдвиг маски влево. Возвращает 0 или (1U << n)
#define CHECK_BIT_V2(X, n) ((X) & (1U << (n)))

int main(void) {
    unsigned int X = 5; // 00000101
    int n = 2;
    unsigned int bit_val = CHECK_BIT_V1(X, n);
    printf("Способ 1: Бит равен %u", bit_val); // Выведет 1

    if (CHECK_BIT_V2(X, n)) {
        printf("Способ 2: Бит установлен (1)");
    } else {
        printf("Способ 2: Бит сброшен (0)");
    }

    return 0;
}
                `)}
              </section>

               <!-- 10 Проверка числа на четность -->
              <section id="iseven" class="mb-2">
                <h4 class="fw-bold text-primary">10. Проверка числа на четность</h4>
                ${highlightC(`
if ((X & 1) == 0) { /* Число четное */ }
                `)}
              </section>
                
              <!-- 11 Проверка, является ли число степенью двойки (работает для X > 0): -->
              <section id="ispower2" class="mb-2">
                <h4 class="fw-bold text-primary">11. Проверка, является ли число степенью двойки (X > 0):</h4>
                ${highlightC(`
if ((X & (X - 1)) == 0) { /* Степень двойки (например: 2, 4, 8, 16...) */ }
                `)}
              </section>

              <!-- 12 Обмен значениями -->
              <section id="swap" class="mb-2">
                <h4 class="fw-bold text-primary">12. Обмен значениями:</h4>
                ${highlightC(`
a ^= b;
b ^= a;
a ^= b; // Теперь значения переменных поменялись местами

                `)}
              </section>
              
                            <!-- 13 Получение знака числа без ветвления -->
              <section id="get-sign" class="mb-2">
                <h4 class="fw-bold text-primary">13. Получение знака числа (без оператора if):</h4>
                ${highlightC(`
int sign = (v > 0) - (v < 0); 
/* Возвращает -1 для отрицательных, 0 для нуля, 1 для положительных */
                `)}
              </section>

              <!-- 14 Модуль числа без ветвления -->
              <section id="abs-value" class="mb-2">
                <h4 class="fw-bold text-primary">14. Модуль числа (Absolute Value) без использования if-else:</h4>
                ${highlightC(`
int mask = v >> 31; // Создает маску: все 0 (если v >= 0) или все 1 (если v < 0)
int abs_v = (v + mask) ^ mask;
                `)}
              </section>

              <!-- 15 Извлечение младшего установленного бита -->
              <section id="lowest-bit" class="mb-2">
                <h4 class="fw-bold text-primary">15. Извлечение самого младшего установленного бита:</h4>
                ${highlightC(`
int lowest_bit = X & -X; 
/* Оставляет только одну самую правую единицу, остальные биты зануляет */
                `)}
              </section>

              <!-- 16 Подсчет установленных битов (Алгоритм Кернигана) -->
              <section id="popcount" class="mb-2">
                <h4 class="fw-bold text-primary">16. Подсчет количества единиц (Алгоритм Брайана Кернигана):</h4>
                ${highlightC(`
int count = 0;
while (X) {
    X &= (X - 1); // Сбрасывает крайнюю правую единицу на каждой итерации
    count++;
}
/* Цикл выполняется ровно столько раз, сколько единиц в числе */
                `)}
              </section>

              <!-- 17 Округление вверх до ближайшей степени двойки -->
              <section id="round-pow2" class="mb-2">
                <h4 class="fw-bold text-primary">17. Округление 32-битного числа вверх до ближайшей степени 2:</h4>
                ${highlightC(`
X--;
X |= X >> 1;
X |= X >> 2;
X |= X >> 4;
X |= X >> 8;
X |= X >> 16;
X++; // Например, преобразует 5 в 8, а 11 в 16
                `)}
              </section>

              <!-- 18 Изменение регистра ASCII-символа на противоположный -->
              <section id="toggle-case" class="mb-2">
                <h4 class="fw-bold text-primary">18. Инверсия регистра ASCII-буквы (A ↔ a):</h4>
                ${highlightC(`
char c = 'g';
c ^= ' '; // Переключает 5-й бит маской 0x20. 'g' станет 'G', а 'G' станет 'g'
                `)}
              </section>

              <!-- 19 Перевод ASCII-буквы в нижний регистр -->
              <section id="to-lower" class="mb-2">
                <h4 class="fw-bold text-primary">19. Перевод ASCII-буквы в нижний регистр (lowercase):</h4>
                ${highlightC(`
char c = 'A';
c |= ' '; // Принудительно устанавливает 5-й бит в 1. 'A' превращается в 'a'
                `)}
              </section>

              <!-- 20 Перевод ASCII-буквы в верхний регистр -->
              <section id="to-upper" class="mb-2">
                <h4 class="fw-bold text-primary">20. Перевод ASCII-буквы в верхний регистр (UPPERCASE):</h4>
                ${highlightC(`
char c = 'a';
c &= '_'; // Маска 0xDF зануляет 5-й бит. 'a' превращается в 'A'
                `)}
              </section>

              <!-- 21 Поиск минимума двух чисел без ветвления -->
              <section id="bitwise-min" class="mb-2">
                <h4 class="fw-bold text-primary">21. Минимум двух чисел без использования оператора if:</h4>
                ${highlightC(`
int min = b ^ ((a ^ b) & -(a < b));
/* Работает на основе знакового расширения результата сравнения */
                `)}
              </section>

              <!-- 22 Поиск максимума двух чисел без ветвления -->
              <section id="bitwise-max" class="mb-2">
                <h4 class="fw-bold text-primary">22. Максимум двух чисел без использования оператора if:</h4>
                ${highlightC(`
int max = a ^ ((a ^ b) & -(a < b));
/* Избегает условных переходов на уровне инструкций процессора */
                `)}
              </section>

              <!-- 23 Проверка, имеют ли числа разные знаки -->
              <section id="diff-signs" class="mb-2">
                <h4 class="fw-bold text-primary">23. Проверка, имеют ли два числа разные знаки:</h4>
                ${highlightC(`
bool has_different_signs = ((x ^ y) < 0);
/* Возвращает true, если одно число положительное, а другое отрицательное */
                `)}
              </section>

              <!-- 24 Быстрое умножение на степени двойки -->
              <section id="fast-mul" class="mb-2">
                <h4 class="fw-bold text-primary">24. Быстрое умножение числа на 2 в степени n:</h4>
                ${highlightC(`
int result = X << n; // Эквивалентно X * pow(2, n)
                `)}
              </section>

              <!-- 25 Быстрое деление на степени двойки -->
              <section id="fast-div" class="mb-2">
                <h4 class="fw-bold text-primary">25. Быстрое целочисленное деление на 2 в степени n:</h4>
                ${highlightC(`
int result = X >> n; // Эквивалентно X / pow(2, n) для беззнаковых чисел
                `)}
              </section>

              <!-- 26 Инкремент числа через побитовое НЕ -->
              <section id="bit-inc" class="mb-2">
                <h4 class="fw-bold text-primary">26. Инкремент числа (X + 1) без оператора +:</h4>
                ${highlightC(`
X = -~X; // Превращает X в X + 1 за счет свойств дополнительного кода
                `)}
              </section>

              <!-- 27 Декремент числа через побитовое НЕ -->
              <section id="bit-dec" class="mb-2">
                <h4 class="fw-bold text-primary">27. Декремент числа (X - 1) без оператора -:</h4>
                ${highlightC(`
X = ~-X; // Превращает X в X - 1
                `)}
              </section>

                            <!-- 28 Проверка: имеют ли два числа одинаковый знак -->
              <section id="same-signs" class="mb-2">
                <h4 class="fw-bold text-primary">28. Проверка, имеют ли два числа одинаковый знак:</h4>
                ${highlightC(`
bool has_same_signs = ((x ^ y) >= 0);
/* Возвращает true, если оба числа либо положительные, либо отрицательные */
                `)}
              </section>

              <!-- 29 Определение маски для зануления n младших битов -->
              <section id="clear-low-bits" class="mb-2">
                <h4 class="fw-bold text-primary">29. Быстрое зануление n младших битов числа:</h4>
                ${highlightC(`
X &= ~((1U << n) - 1);
/* Например, при n=3 маска превратит 0b11111111 в 0b11111000 */
                `)}
              </section>

              <!-- 30 Получение остатка от деления на степень двойки -->
              <section id="fast-mod" class="mb-2">
                <h4 class="fw-bold text-primary">30. Остаток от деления на 2 в степени n (вместо оператора %):</h4>
                ${highlightC(`
int remainder = X & ((1U << n) - 1);
/* Работает в разы быстрее, чем тяжелая процессорная операция деления */
                `)}
              </section>

              <!-- 31 Округление числа вниз до ближайшего кратного степени двойки -->
              <section id="align-down" class="mb-2">
                <h4 class="fw-bold text-primary">31. Выравнивание (округление) вниз до ближайшего кратного 2^n:</h4>
                ${highlightC(`
uint32_t aligned = X & ~((1U << n) - 1);
/* Часто применяется при управлении памятью для выравнивания адресов */
                `)}
              </section>

              <!-- 32 Округление числа вверх до ближайшего кратного степени двойки -->
              <section id="align-up" class="mb-2">
                <h4 class="fw-bold text-primary">32. Выравнивание (округление) вверх до ближайшего кратного 2^n:</h4>
                ${highlightC(`
uint32_t mask = (1U << n) - 1;
uint32_t aligned = (X + mask) & ~mask;
/* Популярный трюк при работе со страницами памяти и графическими буферами */
                `)}
              </section>

              <!-- 33 Смена знака числа на противоположный без унарного минуса -->
              <section id="negate" class="mb-2">
                <h4 class="fw-bold text-primary">33. Изменение знака числа (X = -X) через инверсию:</h4>
                ${highlightC(`
X = ~X + 1;
/* Прямая демонстрация того, как процессор работает с дополнительным кодом */
                `)}
              </section>

              <!-- 34 Проверка: заполнена ли вся правая часть числа единицами -->
              <section id="all-ones" class="mb-2">
                <h4 class="fw-bold text-primary">34. Проверка, имеет ли число вид 2^n - 1 (все биты справа — 1):</h4>
                ${highlightC(`
bool is_mask = ((X + 1) & X) == 0;
/* Возвращает true для таких чисел, как 1 (01), 3 (11), 7 (111), 15 (1111) и т.д. */
                `)}
              </section>

              <!-- 35 Циклический сдвиг 32-битного числа влево -->
              <section id="rot-left" class="mb-2">
                <h4 class="fw-bold text-primary">35. Циклический сдвиг (Rotate Left) для uint32_t:</h4>
                ${highlightC(`
uint32_t rotated = (X << n) | (X >> (32 - n));
/* Биты, вылетающие слева, не пропадают, а залетают обратно справа (криптография) */
                `)}
              </section>

                            <!-- 36 Циклический сдвиг 32-битного числа вправо -->
              <section id="rot-right" class="mb-2">
                <h4 class="fw-bold text-primary">36. Циклический сдвиг (Rotate Right) для uint32_t:</h4>
                ${highlightC(`
uint32_t rotated = (X >> n) | (X << (32 - n));
/* Биты, вылетающие справа, возвращаются обратно слева. Базовая операция в шифрах SHA/AES */
                `)}
              </section>

              <!-- 37 Быстрый обмен байт (Endianness / Byte Swap) для uint16_t -->
              <section id="swap-bytes16" class="mb-2">
                <h4 class="fw-bold text-primary">37. Переворот байт (Byte Swap) для 16-битного числа:</h4>
                ${highlightC(`
uint16_t swapped = (X >> 8) | (X << 8);
/* Переводит число из Big-Endian в Little-Endian и обратно. Важно при работе с сетью */
                `)}
              </section>

              <!-- 38 Быстрый обмен байт (Endianness / Byte Swap) для uint32_t -->
              <section id="swap-bytes32" class="mb-2">
                <h4 class="fw-bold text-primary">38. Переворот байт (Byte Swap) для 32-битного числа:</h4>
                ${highlightC(`
X = ((X >> 24) & 0x000000FF) |
    ((X >>  8) & 0x0000FF00) |
    ((X <<  8) & 0x00FF0000) |
    ((X << 24) & 0xFF000000);
/* Меняет порядок байт в 32-битном слове на противоположный */
                `)}
              </section>

              <!-- 39 Зеркальное отражение битов (Bit Reversal) в байте -->
              <section id="reverse-bits8" class="mb-2">
                <h4 class="fw-bold text-primary">39. Зеркальное развертывание битов в 8-битном байте:</h4>
                ${highlightC(`
b = ((b * 0x0202020202ULL & 0x010884422010ULL) % 1023);
/* Магический трюк без циклов, разворачивающий порядок битов (например, 11000000 -> 00000011) */
                `)}
              </section>

              <!-- 40 Получение среднего значения без переполнения -->
              <section id="bit-average" class="mb-2">
                <h4 class="fw-bold text-primary">40. Среднее арифметическое двух чисел без риска переполнения:</h4>
                ${highlightC(`
int avg = (x & y) + ((x ^ y) >> 1);
/* Защищает от переполнения, которое случается при классическом (x + y) / 2 */
                `)}
              </section>

              <!-- 41 Условная установка или сброс бита без ветвления -->
              <section id="conditional-set" class="mb-2">
                <h4 class="fw-bold text-primary">41. Установка n-го бита в значение флага f (0 или 1) без if:</h4>
                ${highlightC(`
X = (X & ~(1U << n)) | (-f & (1U << n));
/* Напрямую перезаписывает n-й бит значением f, полностью исключая ветвление */
                `)}
              </section>

              <!-- 42 Слияние битов по маске (Bitwise Merge) -->
              <section id="bit-merge" class="mb-2">
                <h4 class="fw-bold text-primary">42. Слияние битов двух чисел по маске (Bitwise Merge):</h4>
                ${highlightC(`
uint32_t result = a ^ ((a ^ b) & mask);
/* Выбирает биты из b там, где в маске стоят 1, и биты из a там, где в маске 0 */
                `)}
              </section>

              <!-- 43 Проверка, является ли число степенью четырех -->
              <section id="is-power4" class="mb-2">
                <h4 class="fw-bold text-primary">43. Проверка, является ли число степенью 4 (X > 0):</h4>
                ${highlightC(`
bool is_pow4 = (X & (X - 1)) == 0 && (X & 0x55555555) != 0;
/* Проверяет, что это степень двойки и единица стоит строго на нечетной позиции */
                `)}
              </section>

              <!-- 44 Сброс всех единиц, идущих подряд с младшего конца -->
              <section id="clear-trailing-ones" class="mb-2">
                <h4 class="fw-bold text-primary">44. Сброс всех непрерывных единиц в конце числа:</h4>
                ${highlightC(`
X = X & (X + 1);
/* Например, преобразует двоичное 0b10110111 в 0b10110000 */
                `)}
              </section>

              <!-- 45 Заполнение всех битов справа от младшего нуля единицами -->
              <section id="set-trailing-zeros" class="mb-2">
                <h4 class="fw-bold text-primary">45. Установка в 1 всех непрерывных нулей в конце числа:</h4>
                ${highlightC(`
X = X | (X - 1);
/* Например, преобразует двоичное 0b10110000 в 0b10111111 */
                `)}
              </section>

                            <!-- 46 Проверка переполнения при сложении знаковых чисел -->
              <section id="overflow-add" class="mb-2">
                <h4 class="fw-bold text-primary">46. Проверка переполнения при сложении (signed add):</h4>
                ${highlightC(`
bool is_overflow = ((sum ^ a) & (sum ^ b)) >> 31;
/* Возвращает true, если при сложении a и b произошло знаковое переполнение */
                `)}
              </section>

              <!-- 47 Быстрое вычисление двоичного логарифма (floor log2) -->
              <section id="fast-log2" class="mb-2">
                <h4 class="fw-bold text-primary">47. Двоичный логарифм (floor log2) для 32-битного целого:</h4>
                ${highlightC(`
uint32_t r =     (X > 0xFFFF) << 4; X >>= r;
uint32_t shift = (X > 0xFF)   << 3; X >>= shift; r |= shift;
shift =          (X > 0xF)    << 2; X >>= shift; r |= shift;
shift =          (X > 0x3)    << 1; X >>= shift; r |= shift;
r |= (X >> 1); // r хранит результат floor(log2( исходный_X )) без циклов
                `)}
              </section>

              <!-- 48 Расширение знака из произвольной битовой ширины -->
              <section id="sign-extend" class="mb-2">
                <h4 class="fw-bold text-primary">48. Расширение знака для b-битного числа внутри int:</h4>
                ${highlightC(`
int m = 1U << (b - 1);
int result = (X ^ m) - m;
/* Превращает, например, 5-битное отрицательное число в полноценное знаковое int */
                `)}
              </section>

              <!-- 49 Вычисление четности подмножества битов (Parity) -->
              <section id="parity-check" class="mb-2">
                <h4 class="fw-bold text-primary">49. Проверка четности числа (Parity Check) за O(log N):</h4>
                ${highlightC(`
X ^= X >> 16;
X ^= X >> 8;
X ^= X >> 4;
X ^= X >> 2;
X ^= X >> 1;
bool is_odd_parity = X & 1; // Возвращает 1, если число содержит нечетное количество единиц
                `)}
              </section>

              <!-- 50 Чередование битов (Interleave / Кривая Мортона / Z-order) -->
              <section id="interleave-bits" class="mb-2">
                <h4 class="fw-bold text-primary">50. Чередование битов двух 16-битных чисел (Z-Order):</h4>
                ${highlightC(`
X = (X | (X << 8)) & 0x00FF00FF;
X = (X | (X << 4)) & 0x0F0F0F0F;
X = (X | (X << 2)) & 0x33333333;
X = (X | (X << 1)) & 0x55555555;
/* Раздвигает биты числа X через один нулями для последующего слияния с Y координатой */
                `)}
              </section>

              <!-- 51 Определение наличия нулевого байта в 32-битном слове -->
              <section id="has-zero-byte" class="mb-2">
                <h4 class="fw-bold text-primary">51. Проверка наличия хотя бы одного нулевого байта (0x00):</h4>
                ${highlightC(`
bool has_zero = ~(((X & 0x7F7F7F7F) + 0x7F7F7F7F) | X | 0x7F7F7F7F);
/* Классический трюк из исходников strlen в библиотеках glibc для ускорения поиска */
                `)}
              </section>

              <!-- 52 Вычисление маски старшей значащей единицы (Most Significant Bit) -->
              <section id="msb-mask" class="mb-2">
                <h4 class="fw-bold text-primary">52. Изоляция старшего установленного бита (MSB):</h4>
                ${highlightC(`
X |= X >> 1;  X |= X >> 2;
X |= X >> 4;  X |= X >> 8;  X |= X >> 16;
uint32_t msb_mask = X ^ (X >> 1);
/* Зануляет все биты, кроме самой левой (старшей) единицы */
                `)}
              </section>

              <!-- 53 Проверка кратности числа трем -->
              <section id="mod-three" class="mb-2">
                <h4 class="fw-bold text-primary">53. Быстрая проверка деления числа на 3 без остатка:</h4>
                ${highlightC(`
uint32_t odd = X & 0x55555555;
uint32_t even = (X >> 1) & 0x55555555;
bool is_div3 = ((odd - even) % 3) == 0;
/* Основано на свойстве разности сумм бит на четных и нечетных позициях */
                `)}
              </section>

              <!-- 54 Сжатие маски битов (Bit Condense / Сжатие разреженных флагов) -->
              <section id="bit-condense" class="mb-2">
                <h4 class="fw-bold text-primary">54. Очистить все нули между непрерывными группами единиц:</h4>
                ${highlightC(`
uint32_t mask = X | (X - 1);
uint32_t next_group = (mask + 1) & ~mask;
/* Помогает переходить к следующей изолированной группе битов в структурах данных */
                `)}
              </section>

              <!-- 55 Сдвиг знакового бита в младший разряд (ZigZag кодирование) -->
              <section id="zigzag-encode" class="mb-2">
                <h4 class="fw-bold text-primary">55. Кодирование ZigZag (перенос знака в младший бит):</h4>
                ${highlightC(`
uint32_t encoded = (X << 1) ^ (X >> 31);
/* Превращает знаковые числа в беззнаковые: 0->0, -1->1, 1->2, -2->3. Используется в Protocol Buffers */
                `)}
              </section>

                            <!-- 56 Декодирование ZigZag (обратное преобразование) -->
              <section id="zigzag-decode" class="mb-2">
                <h4 class="fw-bold text-primary">56. Декодирование ZigZag (восстановление знака):</h4>
                ${highlightC(`
int32_t decoded = (encoded >> 1) ^ -(encoded & 1);
/* Восстанавливает исходное знаковое число из беззнакового ZigZag-кода (из Protobuf) */
                `)}
              </section>

              <!-- 57 Очистка старшего бита до определенной позиции -->
              <section id="clear-high-bits" class="mb-2">
                <h4 class="fw-bold text-primary">57. Зануление всех битов, начиная с n-й позиции и выше:</h4>
                ${highlightC(`
X &= (1U << n) - 1;
/* Оставляет нетронутыми только n младших битов, стирая всю старшую часть числа */
                `)}
              </section>

              <!-- 58 Извлечение поля битов заданной длины и смещения -->
              <section id="extract-bitfield" class="mb-2">
                <h4 class="fw-bold text-primary">58. Извлечение группы битов (Bitfield Extraction):</h4>
                ${highlightC(`
uint32_t extracted = (X >> shift) & ((1U << length) - 1);
/* Сдвигает и вырезает последовательность битов нужной длины length со смещения shift */
                `)}
              </section>

              <!-- 59 Определение переполнения при умножении знаковых чисел -->
              <section id="overflow-mul" class="mb-2">
                <h4 class="fw-bold text-primary">59. Проверка переполнения при умножении (signed mul):</h4>
                ${highlightC(`
bool is_overflow = a > 0 ? (b > INT_MAX / a || b < INT_MIN / a) : (a < 0 ? (b < INT_MAX / a || b > INT_MIN / a) : false);
/* Битово-математический контроль переполнения разрядной сетки типа int */
                `)}
              </section>

              <!-- 60 Аппаратный подсчет единиц (GCC Intrinsics) -->
              <section id="intrinsic-popcount" class="mb-2">
                <h4 class="fw-bold text-primary">60. Аппаратный подсчет единиц (__builtin_popcount):</h4>
                ${highlightC(`
int total_ones = __builtin_popcount(X);
/* Компилируется напрямую в процессорную инструкцию POPCNT на x86/ARM (быстрее любого цикла) */
                `)}
              </section>

              <!-- 61 Аппаратный подсчет ведущих нулей (GCC Intrinsics) -->
              <section id="intrinsic-clz" class="mb-2">
                <h4 class="fw-bold text-primary">61. Подсчет ведущих (левых) нулей (__builtin_clz):</h4>
                ${highlightC(`
int leading_zeros = __builtin_clz(X);
/* Находит позицию старшей единицы. Внимание: результат неопределен, если X == 0 */
                `)}
              </section>

              <!-- 62 Аппаратный подсчет хвостовых нулей (GCC Intrinsics) -->
              <section id="intrinsic-ctz" class="mb-2">
                <h4 class="fw-bold text-primary">62. Подсчет хвостовых (правых) нулей (__builtin_ctz):</h4>
                ${highlightC(`
int trailing_zeros = __builtin_ctz(X);
/* Возвращает индекс самого младшего установленного бита. Не вызывать при X == 0 */
                `)}
              </section>

              <!-- 63 Аппаратный разворот байт 64-битного числа (GCC Intrinsics) -->
              <section id="intrinsic-bswap64" class="mb-2">
                <h4 class="fw-bold text-primary">63. Аппаратный переворот байт uint64_t (__builtin_bswap64):</h4>
                ${highlightC(`
uint64_t swapped = __builtin_bswap64(X);
/* Конвертирует 64-битное число между Big-Endian и Little-Endian одной векторизованной командой */
                `)}
              </section>

              <!-- 64 Маскирование битов по условию (Bitwise Select) -->
              <section id="bit-select" class="mb-2">
                <h4 class="fw-bold text-primary">64. Побитовый выбор между двумя числами на основе условия:</h4>
                ${highlightC(`
uint32_t r = a ^ ((a ^ b) & -(uint32_t)condition);
/* Если condition == 1, возвращает b; если condition == 0, возвращает a. Без ветвлений */
                `)}
              </section>

              <!-- 65 Инверсия битов в массиве (Векторный XOR-маскинг) -->
              <section id="vector-xor" class="mb-2">
                <h4 class="fw-bold text-primary">65. Быстрая инверсия всего массива данных блоками:</h4>
                ${highlightC(`
for (size_t i = 0; i < size; i++) {
    buffer[i] ^= 0xFFFFFFFFU;
}
/* Инвертирует за раз по 32 бита (при использовании типов uint64_t скорость удваивается) */
                `)}
              </section>

                            <!-- 66 Генератор случайных чисел на базе LFSR -->
              <section id="lfsr-rand" class="mb-2">
                <h4 class="fw-bold text-primary">66. Генерация псевдослучайного бита (LFSR 16-бит):</h4>
                ${highlightC(`
uint16_t bit = ((lfsr >> 0) ^ (lfsr >> 2) ^ (lfsr >> 3) ^ (lfsr >> 5)) & 1U;
lfsr = (lfsr >> 1) | (bit << 15);
/* Линейный регистр сдвига с обратной связью. Применяется в аппаратных генераторах шума и криптографии */
                `)}
              </section>

              <!-- 67 Быстрый подсчет CRC8 (алгоритм без таблицы) -->
              <section id="crc8-fast" class="mb-2">
                <h4 class="fw-bold text-primary">67. Побитовое вычисление контрольной суммы CRC8 за одну итерацию:</h4>
                ${highlightC(`
crc ^= data;
for (int i = 0; i < 8; i++) {
    crc = (crc & 0x80) ? (crc << 1) ^ 0x07 : (crc << 1);
}
/* Вычисление контрольной суммы на лету без использования громоздких статических таблиц в памяти */
                `)}
              </section>

              <!-- 68 Извлечение каналов из 16-битного цвета RGB565 -->
              <section id="rgb565-unpack" class="mb-2">
                <h4 class="fw-bold text-primary">68. Распаковка каналов RGB из 16-битного формата RGB565:</h4>
                ${highlightC(`
uint8_t r = (pixel >> 11) & 0x1F; // 5 бит красного
uint8_t g = (pixel >> 5)  & 0x3F; // 6 бит зеленого
uint8_t b = pixel         & 0x1F; // 5 бит синего
/* Стандартная битовая операция в движках для работы с дисплеями микроконтроллеров */
                `)}
              </section>

              <!-- 69 Упаковка каналов в 16-битный цвет RGB565 -->
              <section id="rgb565-pack" class="mb-2">
                <h4 class="fw-bold text-primary">69. Сборка пикселя RGB565 из отдельных каналов:</h4>
                ${highlightC(`
uint16_t pixel = ((r & 0x1F) << 11) | ((g & 0x3F) << 5) | (b & 0x1F);
/* Объединяет три цветовые составляющие в единое 16-битное слово */
                `)}
              </section>

              <!-- 70 Быстрый подсчет значащих битов (Bit Width) -->
              <section id="bit-width" class="mb-2">
                <h4 class="fw-bold text-primary">70. Определение минимального количества бит для хранения числа:</h4>
                ${highlightC(`
uint32_t width = 32 - __builtin_clz(X | 1);
/* Вычисляет точную разрядность, необходимую для упаковки числа (полезно в компрессии данных) */
                `)}
              </section>

              <!-- 71 Обнуление старшей значащей единицы (Clear MSB) -->
              <section id="clear-msb" class="mb-2">
                <h4 class="fw-bold text-primary">71. Сброс самой левой (старшей) единицы в числе:</h4>
                ${highlightC(`
uint32_t temp = X;
temp |= temp >> 1;  temp |= temp >> 2;
temp |= temp >> 4;  temp |= temp >> 8;  temp |= temp >> 16;
X &= ~(temp ^ (temp >> 1));
/* Находит старший бит, инвертирует его в маске и зануляет в исходном числе x */
                `)}
              </section>

              <!-- 72 Выделение битового диапазона [high:low] без сдвига -->
              <section id="bit-range-mask" class="mb-2">
                <h4 class="fw-bold text-primary">72. Изоляция диапазона битов на месте по индексам high и low:</h4>
                ${highlightC(`
uint32_t mask = ((1U << (high + 1)) - 1) & ~((1U << low) - 1);
uint32_t result = X & mask;
/* Например, для диапазона [5:2] создаст маску 0x3C (0b00111100) и выделит эти биты */
                `)}
              </section>

              <!-- 73 Преобразование знакового сдвига в логический без приведения типов -->
              <section id="logical-shift" class="mb-2">
                <h4 class="fw-bold text-primary">73. Эмуляция логического сдвига вправо для знакового int:</h4>
                ${highlightC(`
int result = (X >> n) & ~(((int)INT_MIN >> n) << 1);
/* Сдвигает число вправо, гарантированно забивая освободившиеся левые биты нулями вместо знака */
                `)}
              </section>

              <!-- 74 Проверка: состоит ли байт из чередующихся битов -->
              <section id="alternate-bits" class="mb-2">
                <h4 class="fw-bold text-primary">74. Проверка, чередуются ли биты в числе (01010101 или 10101010):</h4>
                ${highlightC(`
uint32_t temp = X ^ (X >> 1);
bool is_alternating = (temp & (temp + 1)) == 0;
/* Сдвиг и XOR превращают чередующуюся структуру в непрерывную последовательность единиц вида 2^n-1 */
                `)}
              </section>

              <!-- 75 Инверсия каждого второго бита (Маскированный флип) -->
              <section id="flip-even-bits" class="mb-2">
                <h4 class="fw-bold text-primary">75. Инверсия всех четных битов в 32-битном числе:</h4>
                ${highlightC(`
X ^= 0x55555555;
/* Меняет состояние каждого второго бита (0, 2, 4...), не трогая нечетные позиции */
                `)}
              </section>

                            <!-- 76 Вычисление расстояния Хэмминга -->
              <section id="hamming-distance" class="mb-2">
                <h4 class="fw-bold text-primary">76. Расстояние Хэмминга между двумя числами:</h4>
                ${highlightC(`
int dist = __builtin_popcount(x ^ y);
/* Вычисляет количество отличающихся битов в двух числах. База для кодов коррекции ошибок */
                `)}
              </section>

              <!-- 77 Определение длины UTF-8 символа по первому байту -->
              <section id="utf8-len" class="mb-2">
                <h4 class="fw-bold text-primary">77. Определение длины UTF-8 символа по первому байту:</h4>
                ${highlightC(`
int len = (byte < 0x80) ? 1 : (__builtin_clz(~(byte << 24)) - 24);
/* Быстро узнает размер символа (1-4 байта) по количеству ведущих единиц в старшем байте */
                `)}
              </section>

              <!-- 78 Валидация байта продолжения UTF-8 -->
              <section id="utf8-continuation" class="mb-2">
                <h4 class="fw-bold text-primary">78. Проверка, является ли байт байтом продолжения UTF-8:</h4>
                ${highlightC(`
bool is_continuation = (byte & 0xC0) == 0x80;
/* Проверяет маску 0x10xxxxxx, определяя корректность структуры многобайтовой строки */
                `)}
              </section>

              <!-- 79 Кодирование целого числа в формат Varint (LEB128) -->
              <section id="varint-encode" class="mb-2">
                <h4 class="fw-bold text-primary">79. Потоковое сжатие числа в Varint (LEB128) — один шаг:</h4>
                ${highlightC(`
uint8_t byte = (value & 0x7F) | ((value > 0x7F) ? 0x80 : 0x00);
/* Вырезает 7 бит числа и выставляет старший (8-й) бит как флаг наличия следующих байт */
                `)}
              </section>

              <!-- 80 Смешивание битов для хэширования (Трюк Томаса Ванга) -->
              <section id="wang-hash" class="mb-2">
                <h4 class="fw-bold text-primary">80. Битовое перемешивание 32-битного числа (Thomas Wang Hash):</h4>
                ${highlightC(`
X = (X ^ 61) ^ (X >> 16);
X = X + (X << 3);
X = X ^ (X >> 4);
X = X * 0x27d4eb2d;
X = X ^ (X >> 15); // Идеально распределяет биты для защиты от коллизий в хэш-таблицах
                `)}
              </section>

              <!-- 81 Быстрое деление на 3 через умножение и сдвиг -->
              <section id="div-three-fixed" class="mb-2">
                <h4 class="fw-bold text-primary">81. Быстрое целочисленное деление uint32_t на 3 без операции деления:</h4>
                ${highlightC(`
uint32_t result = (uint32_t)(((uint64_t)X * 0xAAAAAAABULL) >> 33);
/* Оптимизация «магическим числом» (вместо тяжелой инструкции DIV используется MUL и сдвиг) */
                `)}
              </section>

              <!-- 82 Зануление всех бит между n-й и m-й позицией -->
              <section id="clear-bit-range" class="mb-2">
                <h4 class="fw-bold text-primary">82. Стирание (обнуление) диапазона битов от n до m:</h4>
                ${highlightC(`
uint32_t mask = ~(((1U << (m + 1)) - 1) & ~((1U << n) - 1));
X &= mask; // Превращает выбранное окно битов внутри числа в нули
                `)}
              </section>

              <!-- 83 Смена порядка полубайт (Nibble Swap) в байте -->
              <section id="nibble-swap" class="mb-2">
                <h4 class="fw-bold text-primary">83. Обмен местами старшего и младшего полубайта (4 бита):</h4>
                ${highlightC(`
uint8_t swapped = ((byte & 0x0F) << 4) | ((byte & 0xF0) >> 4);
/* Преобразует, например, двоичное число 0b11010011 в 0b00111101 */
                `)}
              </section>

              <!-- 84 Проверка: все ли биты в числе равны нулю -->
              <section id="is-zero" class="mb-2">
                <h4 class="fw-bold text-primary">84. Проверка числа на полное отсутствие единиц:</h4>
                ${highlightC(`
bool is_zero = !(X | 0);
/* Лаконичный логический трюк для проверки пустоты битового регистра */
                `)}
              </section>

              <!-- 85 Инверсия знака без унарного минуса и без НЕ -->
              <section id="negate-sub" class="mb-2">
                <h4 class="fw-bold text-primary">85. Изменение знака числа через вычитание из нуля:</h4>
                ${highlightC(`
X = 0 - X;
/* Эквивалентно инверсии всех битов и добавлению единицы (реализация на уровне ALU) */
                `)}
              </section>

                            <!-- 86 Классический побитовый расчет CRC16 (без таблиц) -->
              <section id="crc16-bitwise" class="mb-2">
                <h4 class="fw-bold text-primary">86. Побитовый расчет CRC16-CCITT (Полином 0x1021):</h4>
                ${highlightC(`
uint16_t crc = 0xFFFF; // Начальное значение
while (size--) {
    crc ^= (uint16_t)*buffer++ << 8;
    for (int i = 0; i < 8; i++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
    }
}
/* Стандартный алгоритм проверки целостности пакетов без использования памяти под таблицы */
                `)}
              </section>

              <!-- 87 Побитовый расчет CRC32 (без таблиц) -->
              <section id="crc32-bitwise" class="mb-2">
                <h4 class="fw-bold text-primary">87. Побитовый расчет CRC32 (Полином 0xEDB88320):</h4>
                ${highlightC(`
uint32_t crc = 0xFFFFFFFF;
while (size--) {
    crc ^= *buffer++;
    for (int i = 0; i < 8; i++) {
        crc = (crc & 1) ? (crc >> 1) ^ 0xEDB88320 : (crc >> 1);
    }
}
crc = ~crc; // Финальная инверсия
/* Прямая реализация алгоритма деления многочленов в реверсном битовом порядке */
                `)}
              </section>

              <!-- 88 Быстрый CRC32 без ветвления развертыванием цикла -->
              <section id="crc32-branchless" class="mb-2">
                <h4 class="fw-bold text-primary">88. Оптимизация шага CRC32 без использования инструкций ветвления:</h4>
                ${highlightC(`
// Замена конструкции if (crc & 1) на арифметическое маскирование
crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
/* Ускоряет побитовый расчет примерно на 30%, избавляя конвейер процессора от условных переходов */
                `)}
              </section>

              <!-- 89 Зеркальное отражение 16-битного регистра полинома (Reflect) -->
              <section id="reflect-16" class="mb-2">
                <h4 class="fw-bold text-primary">89. Реверс (отражение) битов для uint16_t:</h4>
                ${highlightC(`
X = ((X >> 1) & 0x5555) | ((X & 0x5555) << 1);
X = ((X >> 2) & 0x3333) | ((X & 0x3333) << 2);
X = ((X >> 4) & 0x0F0F) | ((X & 0x0F0F) << 4);
X = (X >> 8) | (X << 8);
/* Изменяет порядок битов на противоположный (нужно для согласования endianness в некоторых стандартах CRC) */
                `)}
              </section>

              <!-- 90 Зеркальное отражение 32-битного регистра полинома (Reflect) -->
              <section id="reflect-32" class="mb-2">
                <h4 class="fw-bold text-primary">90. Реверс (отражение) битов для uint32_t за O(log N):</h4>
                ${highlightC(`
X = ((X >> 1) & 0x55555555) | ((X & 0x55555555) << 1);
X = ((X >> 2) & 0x33333333) | ((X & 0x33333333) << 2);
X = ((X >> 4) & 0x0F0F0F0F) | ((X & 0x0F0F0F0F) << 4);
X = ((X >> 8) & 0x00FF00FF) | ((X & 0x00FF00FF) << 8);
X = (X >> 16) | (X << 16);
/* Позволяет за несколько тактов развернуть 32-битное слово задом наперед */
                `)}
              </section>

              <!-- 91 Побитовая генерация таблицы для CRC8 -->
              <section id="crc8-table-gen" class="mb-2">
                <h4 class="fw-bold text-primary">91. Динамическая генерация таблицы CRC8 при старте:</h4>
                ${highlightC(`
uint8_t table[256];
for (int div = 0; div < 256; div++) {
    uint8_t curr = div;
    for (int bit = 0; bit < 8; bit++) {
        curr = (curr & 0x80) ? (curr << 1) ^ 0x07 : (curr << 1);
    }
    table[div] = curr;
}
/* Генерирует 256-байтную таблицу в ОЗУ, чтобы затем считать CRC8 в байтовом режиме за один такт */
                `)}
              </section>

              <!-- 92 Быстрый байтовый расчет CRC8 по готовой таблице -->
              <section id="crc8-table-lookup" class="mb-2">
                <h4 class="fw-bold text-primary">92. Расчет CRC8 по таблице (Табличный метод):</h4>
                ${highlightC(`
while (size--) {
    crc = crc_table[crc ^ *buffer++];
}
/* Самый быстрый программный способ вычисления CRC8 — один шаг цикла на один входящий байт */
                `)}
              </section>

              <!-- 93 Вычисление CRC от XOR двух сообщений -->
              <section id="crc-xor-property" class="mb-2">
                <h4 class="fw-bold text-primary">93. Свойство дистрибутивности CRC (Линейность):</h4>
                ${highlightC(`
uint32_t crc_combined = crc_A ^ crc_B; 
/* CRC(A ^ B) эквивалентно CRC(A) ^ CRC(B). Помогает вычислять синдромы битовых ошибок при передаче данных */
                `)}
              </section>

              <!-- 94 Свертка полинома через умножение Кэрри-Лесс (Carry-less Multiplication) -->
              <section id="crc-clmul" class="mb-2">
                <h4 class="fw-bold text-primary">94. Понятие аппаратного CLMUL для расчета CRC (Концепция):</h4>
                ${highlightC(`
// Аппаратное умножение многочленов без переноса разрядов (Инструкция PCLMULQDQ на x86)
// Используется для сворачивания длинных блоков данных в CRC на скоростях свыше 10 ГБ/с
uint64_t product = _mm_extract_epi64(_mm_clmulepi64_si128(a, b, 0x00), 0);
                `)}
              </section>

              <!-- 95 Проверка: является ли CRC-полином самодвойственным (Симметричным) -->
              <section id="crc-symmetric" class="mb-2">
                <h4 class="fw-bold text-primary">95. Быстрая проверка полинома на симметричность структуры:</h4>
                ${highlightC(`
bool is_symmetric = (poly == reflect32(poly));
/* Проверяет битовую маску полинома на зеркальность, что важно при анализе кодов Хэмминга */
                `)}
              </section>

                            <!-- 96 Быстрый обратный квадратный корень (Трюк из Quake III) -->
              <section id="fast-inv-sqrt" class="mb-2">
                <h4 class="fw-bold text-primary">96. Быстрый обратный квадратный корень (1 / sqrt(x)):</h4>
                ${highlightC(`
float xhalf = 0.5f * x;
int i = *(int*)&x;            // Злоупотребление приведением типов через указатели
i = 0x5f3759df - (i >> 1);    // Магическое число и битовый сдвиг экспоненты
x = *(float*)&i;
x = x * (1.5f - xhalf * x * x); // Один шаг метода Ньютона для точности
/* Легендарный алгоритм Кармака для сверхбыстрого расчета освещения в 3D-графике */
                `)}
              </section>

              <!-- 97 Поиск единственного уникального элемента в массиве дубликатов -->
              <section id="find-single" class="mb-2">
                <h4 class="fw-bold text-primary">97. Поиск одиночного элемента среди парных дубликатов:</h4>
                ${highlightC(`
int unique_element = 0;
for (size_t i = 0; i < size; i++) {
    unique_element ^= array[i];
}
/* Все парные числа взаимно уничтожатся (A ^ A = 0), оставив в результате единственный уникальный элемент */
                `)}
              </section>

              <!-- 98 Проверка: отличается ли в двух числах ровно один бит -->
              <section id="one-bit-diff" class="mb-2">
                <h4 class="fw-bold text-primary">98. Проверка, отличаются ли два числа ровно в одном бите:</h4>
                ${highlightC(`
uint32_t diff = x ^ y;
bool is_one_bit_diff = diff && ((diff & (diff - 1)) == 0);
/* С помощью XOR изолируются различающиеся биты, а затем проверяется, является ли разница степенью двойки */
                `)}
              </section>

              <!-- 99 Быстрое побитовое кодирование длин серий (RLE-маска) -->
              <section id="bit-rle" class="mb-2">
                <h4 class="fw-bold text-primary">99. Определение длины непрерывной серии одинаковых битов:</h4>
                ${highlightC(`
uint32_t series_mask = X ^ (X >> 1);
int run_length = __builtin_ctz(series_mask);
/* Находит позицию первого изменившегося бита, определяя длину серии одинаковых знаков с правого конца */
                `)}
              </section>

              <!-- 100 Сжатие массива логических флагов в байты (Bit Packing) -->
              <section id="pack-bools" class="mb-2">
                <h4 class="fw-bold text-primary">100. Упаковка 8 булевых флагов в один байт:</h4>
                ${highlightC(`
uint8_t packed_byte = 0;
for (int i = 0; i < 8; i++) {
    packed_byte |= (bool_array[i] & 1U) << i;
}
/* Экономит память в 8 раз, превращая массив структур bool/char в плотную битовую карту */
                `)}
              </section>

              <!-- 101 Распаковка байта флагов в булевый массив (Bit Unpacking) -->
              <section id="unpack-bools" class="mb-2">
                <h4 class="fw-bold text-primary">101. Распаковка битовой карты обратно в булевый массив:</h4>
                ${highlightC(`
for (int i = 0; i < 8; i++) {
    bool_array[i] = (packed_byte >> i) & 1U;
}
/* Восстанавливает исходные логические значения флагов из упакованного байта данных */
                `)}
              </section>

              <!-- 102 Побитовое округление числа до ближайшего меньшего кратного 8 -->
              <section id="align-down-8" class="mb-2">
                <h4 class="fw-bold text-primary">102. Быстрое округление числа вниз до ближайшего кратного 8:</h4>
                ${highlightC(`
uint32_t aligned = X & ~7U;
/* Стирает три младших бита (маска 0xFFFFFFF8), мгновенно выравнивая число по границе 8 байт */
                `)}
              </section>

              <!-- 103 Побитовое округление числа до ближайшего большего кратного 8 -->
              <section id="align-up-8" class="mb-2">
                <h4 class="fw-bold text-primary">103. Быстрое округление числа вверх до ближайшего кратного 8:</h4>
                ${highlightC(`
uint32_t aligned = (X + 7U) & ~7U;
/* Популярный трюк при выделении выровненной памяти под структуры данных и объекты */
                `)}
              </section>

              <!-- 104 Генерация следующей лексикографической битовой перестановки -->
              <section id="next-perm" class="mb-2">
                <h4 class="fw-bold text-primary">104. Следующее число с тем же количеством единиц (Алгоритм Госпера):</h4>
                ${highlightC(`
uint32_t lowest = X & -X;
uint32_t n = X + lowest;
uint32_t next_permutation = n | (((X ^ n) >> 2) / lowest);
/* Генерирует перестановки битов с фиксированным весом Хэмминга без циклов и рекурсий */
                `)}
              </section>

              <!-- 105 Быстрое побитовое вычисление абсолютной разности -->
              <section id="abs-diff" class="mb-2">
                <h4 class="fw-bold text-primary">105. Абсолютная разность |x - y| без использования ветвления if:</h4>
                ${highlightC(`
int diff = x - y;
int mask = diff >> 31;
int abs_diff = (diff + mask) ^ mask;
/* Высокоэффективный способ вычисления расстояния между точками на одномерной оси */
                `)}
              </section>


            </div>
          </main>
          
        </div>
      </div>
    `;

  }
}
