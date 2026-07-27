import { LitElement, html, css, type TemplateResult, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import bootstrapStyles from 'bootstrap/dist/css/bootstrap.min.css?inline';
import prismTheme from 'prismjs/themes/prism-tomorrow.css?inline'; 
import { highlightC } from '../highlighter.js';

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
    const target = e.target as HTMLAnchorElement;
    if (target && target.hash) {
      const section = this.shadowRoot?.querySelector(target.hash);
      if (section) {
        section.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
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
              <div class="list-group list-group-flush sticky-scroll-menu" @click=${this._scrollToSection}>
                <a href="#and" class="list-group-item list-group-item-action">Побитовое И (&amp;)</a>
                <a href="#or" class="list-group-item list-group-item-action">Побитовое ИЛИ (|)</a>
                <a href="#xor" class="list-group-item list-group-item-action">Исключающее ИЛИ (^)</a>
                <a href="#not" class="list-group-item list-group-item-action">Побитовое НЕ (~)</a>
                <a href="#shifts" class="list-group-item list-group-item-action">Битовые сдвиги (&lt;&lt;, &gt;&gt;)</a>
              </div>
            </div>
          </aside>

          <!-- ОСНОВНОЙ КОНТЕНТ (Занимает 9 колонок) -->
          <main class="col-lg-9 order-lg-2">
            <div class="p-4 bg-white border rounded shadow-sm">
              
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

            </div>
          </main>
          
        </div>
      </div>
    `;

  }
}
