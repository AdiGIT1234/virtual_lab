/**
 * Maps each experiment ID to the components required for that experiment.
 * When a user selects an experiment and launches the sandbox, these components
 * are auto-loaded onto the workplane, arranged neatly around the MCU chip.
 */

// Positions are arranged in a radial pattern around the chip (centered at ~260, 180)
// Components are placed in logical groups: inputs left/bottom, outputs right/top

export const EXPERIMENT_PRESETS = {
  exp01_led_blinking: {
    name: "LED Blinking",
    solutionCode: `// LED Blinking Experiment
// Toggle LED on pin 13 using GPIO

#include <avr/io.h>
#include <util/delay.h>

int main(void) {
    DDRB |= (1 << PB5);    // Pin 13 as output

    while (1) {
        PORTB |= (1 << PB5);  // LED ON
        _delay_ms(500);
        PORTB &= ~(1 << PB5); // LED OFF
        _delay_ms(500);
    }
}`,
    workspace: [
      { id: "led-exp01", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp01", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp01", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp01-1", source: "mcu::13",         target: "res-exp01::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp01-2", source: "res-exp01::t2",   target: "led-exp01::main",  bends: [], color: "#ff4444" },
      { id: "w-exp01-3", source: "led-exp01::main", target: "gnd-exp01::main",  bends: [], color: "#333" },
    ],
  },

  exp02_push_button: {
    name: "Push Button & Debouncing",
    solutionCode: `// Push Button with Debouncing
// Read button on pin 2, control LED on pin 13

#include <avr/io.h>
#include <util/delay.h>

int main(void) {
    DDRB |= (1 << PB5);     // Pin 13 output (LED)
    DDRD &= ~(1 << PD2);    // Pin 2 input (Button)
    PORTD |= (1 << PD2);    // Enable pull-up

    while (1) {
        if (!(PIND & (1 << PD2))) {
            _delay_ms(50);   // Debounce
            if (!(PIND & (1 << PD2))) {
                PORTB ^= (1 << PB5); // Toggle LED
                while (!(PIND & (1 << PD2))); // Wait release
            }
        }
    }
}`,
    workspace: [
      { id: "btn-exp02", type: "BUTTON", pins: { main: 2 }, x: 80, y: 160, scale: 1 },
      { id: "led-exp02", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp02", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp02", type: "GROUND_NODE", pins: { main: "" }, x: 260, y: 380, scale: 1 },
      { id: "vcc-exp02", type: "VCC_NODE", pins: { main: "" }, x: 80, y: 60, scale: 1 },
    ],
    wires: [
      { id: "w-exp02-1", source: "mcu::2",           target: "btn-exp02::main",  bends: [], color: "#4dabf7" },
      { id: "w-exp02-2", source: "btn-exp02::main",  target: "gnd-exp02::main",  bends: [], color: "#333" },
      { id: "w-exp02-3", source: "mcu::13",          target: "res-exp02::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp02-4", source: "res-exp02::t2",    target: "led-exp02::main",  bends: [], color: "#ff4444" },
      { id: "w-exp02-5", source: "led-exp02::main",  target: "gnd-exp02::main",  bends: [], color: "#333" },
    ],
  },

  exp03_seven_segment: {
    name: "7-Segment Display",
    solutionCode: `// 7-Segment Display Experiment
// Segments: a→D2, b→D3, c→D4, d→D5, e→D6, f→D7, g→B0

#include <avr/io.h>
#include <util/delay.h>

// Precomputed PORTD values (bits 2-7 = segments a-f)
// and PORTB bit-0 = segment g
const uint8_t seg_portD[] = {
    0xFC, 0x18, 0x6C, 0x3C, 0x98,
    0xB4, 0xF4, 0x1C, 0xFC, 0xBC
};
const uint8_t seg_g[] = {
    0, 0, 1, 1, 1, 1, 1, 0, 1, 1
};

int main(void) {
    DDRD  = 0xFC;       // D2-D7 as output (segments a-f)
    DDRB |= (1 << PB0); // B0 (pin 8) as output (segment g)

    while (1) {
        for (uint8_t i = 0; i < 10; i++) {
            PORTD = seg_portD[i];
            if (seg_g[i]) PORTB |= (1 << PB0);
            else          PORTB &= ~(1 << PB0);
            _delay_ms(1000);
        }
    }
}`,
    workspace: [
      { id: "seg-exp03", type: "SEVEN_SEG", pins: { a: 2, b: 3, c: 4, d: 5, e: 6, f: 7, g: 8 }, x: 460, y: 140, scale: 1 },
      { id: "res-exp03a", type: "RESISTOR", pins: { t1: 2, t2: "" }, resistance: 220, x: 380, y: 80, scale: 1 },
      { id: "res-exp03b", type: "RESISTOR", pins: { t1: 5, t2: "" }, resistance: 220, x: 380, y: 200, scale: 1 },
      { id: "gnd-exp03", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp03-a", source: "mcu::2",          target: "seg-exp03::a",    bends: [], color: "#ff4444" },
      { id: "w-exp03-b", source: "mcu::3",          target: "seg-exp03::b",    bends: [], color: "#fbbf24" },
      { id: "w-exp03-c", source: "mcu::4",          target: "seg-exp03::c",    bends: [], color: "#22c55e" },
      { id: "w-exp03-d", source: "mcu::5",          target: "seg-exp03::d",    bends: [], color: "#4dabf7" },
      { id: "w-exp03-e", source: "mcu::6",          target: "seg-exp03::e",    bends: [], color: "#a78bfa" },
      { id: "w-exp03-f", source: "mcu::7",          target: "seg-exp03::f",    bends: [], color: "#f97316" },
      { id: "w-exp03-g", source: "mcu::8",          target: "seg-exp03::g",    bends: [], color: "#fb7185" },
      { id: "w-exp03-gnd", source: "gnd-exp03::main", target: "seg-exp03::com", bends: [], color: "#333" },
    ],
  },

  exp04_external_interrupts: {
    name: "External Interrupts",
    solutionCode: `// External Interrupts (INT0/INT1)
// Toggle LED via interrupt on pin 2

#include <avr/io.h>
#include <avr/interrupt.h>

ISR(INT0_vect) {
    PORTB ^= (1 << PB5); // Toggle pin 13
}

int main(void) {
    DDRB |= (1 << PB5);    // Pin 13 output
    DDRD &= ~(1 << PD2);   // Pin 2 input
    PORTD |= (1 << PD2);   // Pull-up
    
    EICRA |= (1 << ISC01); // Falling edge
    EIMSK |= (1 << INT0);  // Enable INT0
    sei();

    while (1) {}
}`,
    workspace: [
      { id: "btn-exp04", type: "BUTTON", pins: { main: 2 }, x: 80, y: 180, scale: 1 },
      { id: "led-exp04", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp04", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp04", type: "GROUND_NODE", pins: { main: "" }, x: 260, y: 380, scale: 1 },
    ],
    wires: [
      { id: "w-exp04-1", source: "mcu::2",          target: "btn-exp04::main",  bends: [], color: "#4dabf7" },
      { id: "w-exp04-2", source: "btn-exp04::main", target: "gnd-exp04::main",  bends: [], color: "#333" },
      { id: "w-exp04-3", source: "mcu::13",         target: "res-exp04::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp04-4", source: "res-exp04::t2",   target: "led-exp04::main",  bends: [], color: "#ff4444" },
      { id: "w-exp04-5", source: "led-exp04::main", target: "gnd-exp04::main",  bends: [], color: "#333" },
    ],
  },

  exp05_timer0_normal: {
    name: "Timer0 Normal Mode",
    solutionCode: `// Timer0 Normal Mode
// LED blink using Timer0 overflow interrupt

#include <avr/io.h>
#include <avr/interrupt.h>

volatile uint8_t overflow_count = 0;

ISR(TIMER0_OVF_vect) {
    overflow_count++;
    if (overflow_count >= 61) {  // ~1 second
        PORTB ^= (1 << PB5);
        overflow_count = 0;
    }
}

int main(void) {
    DDRB |= (1 << PB5);
    TCCR0B |= (1 << CS02) | (1 << CS00); // prescaler 1024
    TIMSK0 |= (1 << TOIE0);
    sei();
    while (1) {}
}`,
    workspace: [
      { id: "led-exp05", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp05", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp05", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp05-1", source: "mcu::13",         target: "res-exp05::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp05-2", source: "res-exp05::t2",   target: "led-exp05::main",  bends: [], color: "#ff4444" },
      { id: "w-exp05-3", source: "led-exp05::main", target: "gnd-exp05::main",  bends: [], color: "#333" },
    ],
  },

  exp06_timer1_ctc: {
    name: "Timer1 CTC Mode",
    solutionCode: `// Timer1 CTC Mode — 1Hz Signal
// Precise 1-second toggle using OCR1A

#include <avr/io.h>
#include <avr/interrupt.h>

ISR(TIMER1_COMPA_vect) {
    PORTB ^= (1 << PB5);
}

int main(void) {
    DDRB |= (1 << PB5);
    OCR1A = 15624;           // 1 second at 16 MHz / 1024
    TCCR1B |= (1 << WGM12); // CTC mode
    TCCR1B |= (1 << CS12) | (1 << CS10); // prescaler 1024
    TIMSK1 |= (1 << OCIE1A);
    sei();
    while (1) {}
}`,
    workspace: [
      { id: "led-exp06", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp06", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp06", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp06-1", source: "mcu::13",         target: "res-exp06::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp06-2", source: "res-exp06::t2",   target: "led-exp06::main",  bends: [], color: "#ff4444" },
      { id: "w-exp06-3", source: "led-exp06::main", target: "gnd-exp06::main",  bends: [], color: "#333" },
    ],
  },

  exp07_pwm_fast: {
    name: "Fast PWM & LED Fading",
    solutionCode: `// Fast PWM — LED Fading
// Fade LED on pin 6 (OC0A) using Timer0 Fast PWM

#include <avr/io.h>
#include <util/delay.h>

int main(void) {
    DDRD |= (1 << PD6);  // Pin 6 (OC0A)
    
    // Fast PWM, non-inverting, prescaler 64
    TCCR0A = (1 << COM0A1) | (1 << WGM01) | (1 << WGM00);
    TCCR0B = (1 << CS01) | (1 << CS00);

    while (1) {
        for (uint8_t i = 0; i < 255; i++) {
            OCR0A = i;
            _delay_ms(8);
        }
        for (uint8_t i = 255; i > 0; i--) {
            OCR0A = i;
            _delay_ms(8);
        }
    }
}`,
    workspace: [
      { id: "led-exp07", type: "LED_GREEN", pins: { main: 6 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp07", type: "RESISTOR", pins: { t1: 6, t2: "" }, resistance: 220, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp07", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp07-1", source: "mcu::6",          target: "res-exp07::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp07-2", source: "res-exp07::t2",   target: "led-exp07::main",  bends: [], color: "#22c55e" },
      { id: "w-exp07-3", source: "led-exp07::main", target: "gnd-exp07::main",  bends: [], color: "#333" },
    ],
  },

  exp08_pwm_phase_correct: {
    name: "Phase Correct PWM",
    solutionCode: `// Phase Correct PWM — Servo Control
// Servo on pin 9 using Timer1 Phase Correct PWM

#include <avr/io.h>
#include <util/delay.h>

int main(void) {
    DDRB |= (1 << PB1);  // Pin 9 (OC1A)

    // Phase Correct PWM, TOP = ICR1
    // f = F_CPU / (2 * N * TOP) = 16MHz / (2 * 8 * 20000) = 50 Hz
    ICR1 = 19999;
    TCCR1A = (1 << COM1A1) | (1 << WGM11);
    TCCR1B = (1 << WGM13) | (1 << CS11); // prescaler 8 → 0.5µs/tick

    while (1) {
        OCR1A = 2000;  // 0°   (2000 × 0.5µs = 1.0 ms pulse)
        _delay_ms(1000);
        OCR1A = 3000;  // 90°  (3000 × 0.5µs = 1.5 ms pulse)
        _delay_ms(1000);
        OCR1A = 4000;  // 180° (4000 × 0.5µs = 2.0 ms pulse)
        _delay_ms(1000);
    }
}`,
    workspace: [
      { id: "srv-exp08", type: "SERVO", pins: { main: 9 }, x: 460, y: 140, scale: 1 },
      { id: "vcc-exp08", type: "VCC_NODE", pins: { main: "" }, x: 460, y: 60, scale: 1 },
      { id: "gnd-exp08", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp08-1", source: "mcu::9",           target: "srv-exp08::main",  bends: [], color: "#fbbf24" },
      { id: "w-exp08-2", source: "vcc-exp08::main",  target: "srv-exp08::main",  bends: [], color: "#dc2626" },
      { id: "w-exp08-3", source: "gnd-exp08::main",  target: "srv-exp08::main",  bends: [], color: "#333" },
    ],
  },

  exp09_adc_polling: {
    name: "ADC (Analog-to-Digital)",
    solutionCode: `// ADC Polling — Potentiometer Read
// Read analog value from A0 and light up LEDs as a bar graph

#include <avr/io.h>
#include <util/delay.h>

uint16_t readADC(uint8_t channel) {
    ADMUX = (1 << REFS0) | (channel & 0x07);
    ADCSRA |= (1 << ADSC);
    while (ADCSRA & (1 << ADSC));
    return ADC;
}

int main(void) {
    ADCSRA = (1 << ADEN) | (1 << ADPS2) | (1 << ADPS1);
    DDRB = 0x3F;  // Pins 8-13 as output (PB0-PB5 only; PB6/PB7 = crystal)

    while (1) {
        uint16_t val = readADC(0);         // 0-1023
        uint8_t leds = val / 171;          // 0-5 (1023/171 ≈ 5.98)
        if (leds > 6) leds = 6;
        PORTB = ((1 << leds) - 1) & 0x3F; // safe mask keeps PB6/PB7 clear
        _delay_ms(100);
    }
}`,
    workspace: [
      { id: "dial-exp09", type: "DIAL", pins: { main: 14 }, x: 80, y: 160, scale: 1 },
      { id: "led1-exp09", type: "LED_RED", pins: { main: 10 }, x: 440, y: 80, scale: 1 },
      { id: "led2-exp09", type: "LED_GREEN", pins: { main: 11 }, x: 480, y: 140, scale: 1 },
      { id: "led3-exp09", type: "LED_YELLOW", pins: { main: 12 }, x: 480, y: 220, scale: 1 },
      { id: "res-exp09", type: "RESISTOR", pins: { t1: 10, t2: "" }, resistance: 220, x: 440, y: 300, scale: 1 },
      { id: "gnd-exp09", type: "GROUND_NODE", pins: { main: "" }, x: 260, y: 380, scale: 1 },
      { id: "vcc-exp09", type: "VCC_NODE", pins: { main: "" }, x: 80, y: 60, scale: 1 },
    ],
    wires: [
      { id: "w-exp09-1",  source: "mcu::14",          target: "dial-exp09::main",  bends: [], color: "#a78bfa" },
      { id: "w-exp09-2",  source: "vcc-exp09::main",  target: "dial-exp09::main",  bends: [], color: "#dc2626" },
      { id: "w-exp09-3",  source: "mcu::10",          target: "res-exp09::t1",     bends: [], color: "#fbbf24" },
      { id: "w-exp09-4",  source: "res-exp09::t2",    target: "led1-exp09::main",  bends: [], color: "#ff4444" },
      { id: "w-exp09-5",  source: "led1-exp09::main", target: "gnd-exp09::main",   bends: [], color: "#333" },
      { id: "w-exp09-6",  source: "mcu::11",          target: "led2-exp09::main",  bends: [], color: "#22c55e" },
      { id: "w-exp09-7",  source: "led2-exp09::main", target: "gnd-exp09::main",   bends: [], color: "#333" },
      { id: "w-exp09-8",  source: "mcu::12",          target: "led3-exp09::main",  bends: [], color: "#fbbf24" },
      { id: "w-exp09-9",  source: "led3-exp09::main", target: "gnd-exp09::main",   bends: [], color: "#333" },
    ],
  },

  exp10_uart_tx: {
    name: "UART Serial Transmit",
    solutionCode: `// UART Transmit
// Send "Hello AVR!" over USART at 9600 baud

#include <avr/io.h>
#include <util/delay.h>

void UART_init(uint16_t baud) {
    uint16_t ubrr = F_CPU / 16 / baud - 1;
    UBRR0H = (ubrr >> 8);
    UBRR0L = ubrr;
    UCSR0B = (1 << TXEN0);
    UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
}

void UART_putchar(char c) {
    while (!(UCSR0A & (1 << UDRE0)));
    UDR0 = c;
}

void UART_print(const char *str) {
    while (*str) UART_putchar(*str++);
}

int main(void) {
    UART_init(9600);
    while (1) {
        UART_print("Hello AVR!\\r\\n");
        _delay_ms(1000);
    }
}`,
    workspace: [
      { id: "led-exp10", type: "LED_GREEN", pins: { main: 1 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp10", type: "RESISTOR", pins: { t1: 1, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp10", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp10-1", source: "mcu::1",          target: "res-exp10::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp10-2", source: "res-exp10::t2",   target: "led-exp10::main",  bends: [], color: "#22c55e" },
      { id: "w-exp10-3", source: "led-exp10::main", target: "gnd-exp10::main",  bends: [], color: "#333" },
    ],
  },

  exp11_uart_rx_interrupts: {
    name: "UART Receive Interrupts",
    solutionCode: `// UART Receive with Interrupts
// Echo received data back and toggle LED

#include <avr/io.h>
#include <avr/interrupt.h>

ISR(USART_RX_vect) {
    char c = UDR0;
    while (!(UCSR0A & (1 << UDRE0)));
    UDR0 = c;  // Echo
    PORTB ^= (1 << PB5); // Toggle LED
}

int main(void) {
    uint16_t ubrr = F_CPU / 16 / 9600 - 1;
    UBRR0H = (ubrr >> 8);
    UBRR0L = ubrr;
    UCSR0B = (1 << RXEN0) | (1 << TXEN0) | (1 << RXCIE0);
    UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
    DDRB |= (1 << PB5);
    sei();
    while (1) {}
}`,
    workspace: [
      { id: "led-exp11", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp11", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp11", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp11-1", source: "mcu::13",         target: "res-exp11::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp11-2", source: "res-exp11::t2",   target: "led-exp11::main",  bends: [], color: "#ff4444" },
      { id: "w-exp11-3", source: "led-exp11::main", target: "gnd-exp11::main",  bends: [], color: "#333" },
    ],
  },

  exp12_spi_master: {
    name: "SPI Master",
    solutionCode: `// SPI Master Communication
// Send data via SPI to a shift register

#include <avr/io.h>
#include <util/delay.h>

void SPI_init(void) {
    DDRB |= (1 << PB3) | (1 << PB5) | (1 << PB2); // MOSI, SCK, SS
    SPCR = (1 << SPE) | (1 << MSTR) | (1 << SPR0);
}

void SPI_send(uint8_t data) {
    SPDR = data;
    while (!(SPSR & (1 << SPIF)));
}

int main(void) {
    SPI_init();
    while (1) {
        for (uint8_t i = 0; i < 8; i++) {
            PORTB &= ~(1 << PB2);  // SS low
            SPI_send(1 << i);
            PORTB |= (1 << PB2);   // SS high
            _delay_ms(200);
        }
    }
}`,
    workspace: [
      { id: "led-exp12", type: "LED_RED", pins: { main: 13 }, x: 460, y: 100, scale: 1 },
      { id: "led2-exp12", type: "LED_GREEN", pins: { main: 11 }, x: 460, y: 200, scale: 1 },
      { id: "res-exp12", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 300, scale: 1 },
      { id: "gnd-exp12", type: "GROUND_NODE", pins: { main: "" }, x: 260, y: 380, scale: 1 },
    ],
    wires: [
      { id: "w-exp12-1", source: "mcu::13",          target: "res-exp12::t1",     bends: [], color: "#fbbf24" },
      { id: "w-exp12-2", source: "res-exp12::t2",    target: "led-exp12::main",   bends: [], color: "#ff4444" },
      { id: "w-exp12-3", source: "led-exp12::main",  target: "gnd-exp12::main",   bends: [], color: "#333" },
      { id: "w-exp12-4", source: "mcu::11",          target: "led2-exp12::main",  bends: [], color: "#22c55e" },
      { id: "w-exp12-5", source: "led2-exp12::main", target: "gnd-exp12::main",   bends: [], color: "#333" },
    ],
  },

  exp13_i2c_master: {
    name: "I2C / TWI Master",
    solutionCode: `// I2C Master Communication
// Send data to an I2C slave device

#include <avr/io.h>
#include <util/delay.h>

void TWI_init(void) {
    TWSR = 0x00;
    TWBR = 0x47;  // SCL ~100 kHz at 16 MHz
    TWCR = (1 << TWEN);
}

void TWI_start(void) {
    TWCR = (1 << TWINT) | (1 << TWSTA) | (1 << TWEN);
    while (!(TWCR & (1 << TWINT)));
}

void TWI_write(uint8_t data) {
    TWDR = data;
    TWCR = (1 << TWINT) | (1 << TWEN);
    while (!(TWCR & (1 << TWINT)));
}

void TWI_stop(void) {
    TWCR = (1 << TWINT) | (1 << TWSTO) | (1 << TWEN);
}

int main(void) {
    TWI_init();
    DDRB |= (1 << PB5);
    while (1) {
        TWI_start();
        TWI_write(0x50);  // Address
        TWI_write(0xAA);  // Data
        TWI_stop();
        PORTB ^= (1 << PB5);
        _delay_ms(500);
    }
}`,
    workspace: [
      { id: "led-exp13", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp13a", type: "RESISTOR", pins: { t1: 18, t2: "" }, resistance: 4700, x: 80, y: 120, scale: 1 },
      { id: "res-exp13b", type: "RESISTOR", pins: { t1: 19, t2: "" }, resistance: 4700, x: 80, y: 220, scale: 1 },
      { id: "vcc-exp13", type: "VCC_NODE", pins: { main: "" }, x: 80, y: 60, scale: 1 },
      { id: "gnd-exp13", type: "GROUND_NODE", pins: { main: "" }, x: 260, y: 380, scale: 1 },
    ],
    wires: [
      { id: "w-exp13-1", source: "mcu::13",          target: "led-exp13::main",   bends: [], color: "#ff4444" },
      { id: "w-exp13-2", source: "led-exp13::main",  target: "gnd-exp13::main",   bends: [], color: "#333" },
      { id: "w-exp13-3", source: "vcc-exp13::main",  target: "res-exp13a::t1",    bends: [], color: "#dc2626" },
      { id: "w-exp13-4", source: "res-exp13a::t2",   target: "mcu::18",           bends: [], color: "#fbbf24" },
      { id: "w-exp13-5", source: "vcc-exp13::main",  target: "res-exp13b::t1",    bends: [], color: "#dc2626" },
      { id: "w-exp13-6", source: "res-exp13b::t2",   target: "mcu::19",           bends: [], color: "#22d3ee" },
    ],
  },

  exp14_eeprom_rw: {
    name: "EEPROM Read/Write",
    solutionCode: `// EEPROM Read/Write
// Store and retrieve a counter value

#include <avr/io.h>
#include <avr/eeprom.h>
#include <util/delay.h>

int main(void) {
    DDRB |= (1 << PB5);  // Pin 13

    uint8_t count = eeprom_read_byte((uint8_t*)0x00);
    count++;
    eeprom_write_byte((uint8_t*)0x00, count);

    // Blink LED 'count' times
    for (uint8_t i = 0; i < (count & 0x07); i++) {
        PORTB |= (1 << PB5);
        _delay_ms(200);
        PORTB &= ~(1 << PB5);
        _delay_ms(200);
    }
    _delay_ms(2000);

    while (1) {}
}`,
    workspace: [
      { id: "led-exp14", type: "LED_RED", pins: { main: 13 }, x: 460, y: 160, scale: 1 },
      { id: "res-exp14", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 240, scale: 1 },
      { id: "gnd-exp14", type: "GROUND_NODE", pins: { main: "" }, x: 460, y: 320, scale: 1 },
    ],
    wires: [
      { id: "w-exp14-1", source: "mcu::13",         target: "res-exp14::t1",    bends: [], color: "#fbbf24" },
      { id: "w-exp14-2", source: "res-exp14::t2",   target: "led-exp14::main",  bends: [], color: "#ff4444" },
      { id: "w-exp14-3", source: "led-exp14::main", target: "gnd-exp14::main",  bends: [], color: "#333" },
    ],
  },

  exp15_watchdog_timer: {
    name: "Watchdog Timer",
    solutionCode: `// Watchdog Timer
// Auto-reset crashed firmware using WDT

#include <avr/io.h>
#include <avr/wdt.h>
#include <avr/interrupt.h>
#include <util/delay.h>

int main(void) {
    DDRB |= (1 << PB5);  // Pin 13

    // Fast blinks to show boot
    for (uint8_t i = 0; i < 3; i++) {
        PORTB |= (1 << PB5);
        _delay_ms(100);
        PORTB &= ~(1 << PB5);
        _delay_ms(100);
    }

    // Enable watchdog at 2s timeout
    wdt_enable(WDTO_2S);

    // Simulate a "hang"
    PORTB |= (1 << PB5);  // LED stays on
    while (1) {
        // NOT resetting WDT — will trigger reset!
    }
}`,
    workspace: [
      { id: "led-exp15", type: "LED_RED", pins: { main: 13 }, x: 460, y: 120, scale: 1 },
      { id: "led2-exp15", type: "LED_GREEN", pins: { main: 12 }, x: 460, y: 220, scale: 1 },
      { id: "res-exp15a", type: "RESISTOR", pins: { t1: 13, t2: "" }, resistance: 330, x: 460, y: 310, scale: 1 },
      { id: "res-exp15b", type: "RESISTOR", pins: { t1: 12, t2: "" }, resistance: 330, x: 380, y: 310, scale: 1 },
      { id: "gnd-exp15", type: "GROUND_NODE", pins: { main: "" }, x: 260, y: 380, scale: 1 },
    ],
    wires: [
      { id: "w-exp15-1", source: "mcu::13",           target: "res-exp15a::t1",   bends: [], color: "#fbbf24" },
      { id: "w-exp15-2", source: "res-exp15a::t2",    target: "led-exp15::main",  bends: [], color: "#ff4444" },
      { id: "w-exp15-3", source: "led-exp15::main",   target: "gnd-exp15::main",  bends: [], color: "#333" },
      { id: "w-exp15-4", source: "mcu::12",           target: "res-exp15b::t1",   bends: [], color: "#fbbf24" },
      { id: "w-exp15-5", source: "res-exp15b::t2",    target: "led2-exp15::main", bends: [], color: "#22c55e" },
      { id: "w-exp15-6", source: "led2-exp15::main",  target: "gnd-exp15::main",  bends: [], color: "#333" },
    ],
  },
};
