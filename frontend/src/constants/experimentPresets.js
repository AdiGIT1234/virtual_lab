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
    code: `// LED Blinking Experiment
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
  },

  exp02_push_button: {
    name: "Push Button & Debouncing",
    code: `// Push Button with Debouncing
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
  },

  exp03_seven_segment: {
    name: "7-Segment Display",
    code: `// 7-Segment Display Experiment
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
  },

  exp04_external_interrupts: {
    name: "External Interrupts",
    code: `// External Interrupts (INT0/INT1)
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
  },

  exp05_timer0_normal: {
    name: "Timer0 Normal Mode",
    code: `// Timer0 Normal Mode
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
  },

  exp06_timer1_ctc: {
    name: "Timer1 CTC Mode",
    code: `// Timer1 CTC Mode — 1Hz Signal
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
  },

  exp07_pwm_fast: {
    name: "Fast PWM & LED Fading",
    code: `// Fast PWM — LED Fading
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
  },

  exp08_pwm_phase_correct: {
    name: "Phase Correct PWM",
    code: `// Phase Correct PWM — Servo Control
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
  },

  exp09_adc_polling: {
    name: "ADC (Analog-to-Digital)",
    code: `// ADC Polling — Potentiometer Read
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
  },

  exp10_uart_tx: {
    name: "UART Serial Transmit",
    code: `// UART Transmit
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
  },

  exp11_uart_rx_interrupts: {
    name: "UART Receive Interrupts",
    code: `// UART Receive with Interrupts
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
  },

  exp12_spi_master: {
    name: "SPI Master",
    code: `// SPI Master Communication
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
  },

  exp13_i2c_master: {
    name: "I2C / TWI Master",
    code: `// I2C Master Communication
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
  },

  exp14_eeprom_rw: {
    name: "EEPROM Read/Write",
    code: `// EEPROM Read/Write
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
  },

  exp15_watchdog_timer: {
    name: "Watchdog Timer",
    code: `// Watchdog Timer
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
  },
};
