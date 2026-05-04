import os
import subprocess
import tempfile

def compile_code(source_code: str) -> str:
    """
    Compiles Arduino-like C++ code using avr-gcc into an Intel HEX string.

    Provides a complete Arduino API mock that writes to real ATmega328P hardware
    registers so avr8js can simulate Serial, Wire (I2C/TWI), timers, and GPIO.
    """

    minimal_core = r"""
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// ── Constants ────────────────────────────────────────────────────────────────
#define HIGH 1
#define LOW  0
#define INPUT         0
#define OUTPUT        1
#define INPUT_PULLUP  2

#ifndef true
#define true  1
#define false 0
#endif

#define PI      3.14159265358979323846
#define TWO_PI  6.28318530717958647692
#define HALF_PI 1.5707963267948966192

#define HEX 16
#define DEC 10
#define OCT  8
#define BIN  2

#define LSBFIRST 0
#define MSBFIRST 1
#define CHANGE   1
#define FALLING  2
#define RISING   3

#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A4 18
#define A5 19

// ── Math helpers ─────────────────────────────────────────────────────────────
static inline long _map(long x, long in_min, long in_max, long out_min, long out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
#define map(x,a,b,c,d) _map((long)(x),(long)(a),(long)(b),(long)(c),(long)(d))
#define constrain(x,lo,hi) ((x)<(lo)?(lo):((x)>(hi)?(hi):(x)))
#define sq(x) ((x)*(x))
#ifndef abs
#define abs(x) ((x)>=0?(x):-(x))
#endif
#ifndef min
#define min(a,b) ((a)<(b)?(a):(b))
#endif
#ifndef max
#define max(a,b) ((a)>(b)?(a):(b))
#endif
#define bitRead(v,b)     (((v)>>(b))&1)
#define bitSet(v,b)      ((v)|=(1UL<<(b)))
#define bitClear(v,b)    ((v)&=~(1UL<<(b)))
#define bit(b)           (1UL<<(b))
#define lowByte(x)       ((uint8_t)((x)&0xFF))
#define highByte(x)      ((uint8_t)(((x)>>8)&0xFF))
#define radians(deg)     ((deg)*0.01745329251994)
#define degrees(rad)     ((rad)*57.2957795130823)

// ── Timing ───────────────────────────────────────────────────────────────────
static volatile uint32_t _timer0_ms = 0;

ISR(TIMER0_OVF_vect) {
    _timer0_ms++;
}

static void _init_timer0() {
    TCCR0A = 0;
    TCCR0B = (1<<CS01)|(1<<CS00);  // prescaler 64 → ~1 ms overflow at 16 MHz
    TIMSK0 = (1<<TOIE0);
    sei();
}

unsigned long millis()  { return _timer0_ms; }
unsigned long micros()  { return _timer0_ms * 1000UL; }

void delay(unsigned long ms) {
    uint32_t start = millis();
    while ((millis() - start) < ms) {}
}

void delayMicroseconds(unsigned int us) {
    while (us--) _delay_us(1);
}

// ── GPIO ─────────────────────────────────────────────────────────────────────
void pinMode(int pin, int mode) {
    if (pin >= 0 && pin <= 7) {
        if (mode == OUTPUT)       DDRD |=  (1<<pin);
        else if (mode == INPUT)   DDRD &= ~(1<<pin);
        else { DDRD &= ~(1<<pin); PORTD |= (1<<pin); }  // INPUT_PULLUP
    } else if (pin >= 8 && pin <= 13) {
        uint8_t b = pin - 8;
        if (mode == OUTPUT)       DDRB |=  (1<<b);
        else if (mode == INPUT)   DDRB &= ~(1<<b);
        else { DDRB &= ~(1<<b); PORTB |= (1<<b); }
    } else if (pin >= 14 && pin <= 19) {
        uint8_t b = pin - 14;
        if (mode == OUTPUT)       DDRC |=  (1<<b);
        else if (mode == INPUT)   DDRC &= ~(1<<b);
        else { DDRC &= ~(1<<b); PORTC |= (1<<b); }
    }
}

void digitalWrite(int pin, int val) {
    if (pin >= 0 && pin <= 7) {
        if (val) PORTD |= (1<<pin); else PORTD &= ~(1<<pin);
    } else if (pin >= 8 && pin <= 13) {
        if (val) PORTB |= (1<<(pin-8)); else PORTB &= ~(1<<(pin-8));
    } else if (pin >= 14 && pin <= 19) {
        if (val) PORTC |= (1<<(pin-14)); else PORTC &= ~(1<<(pin-14));
    }
}

int digitalRead(int pin) {
    if (pin >= 0 && pin <= 7)   return (PIND >> pin) & 1;
    if (pin >= 8 && pin <= 13)  return (PINB >> (pin-8)) & 1;
    if (pin >= 14 && pin <= 19) return (PINC >> (pin-14)) & 1;
    return 0;
}

// ── Analog ───────────────────────────────────────────────────────────────────
int analogRead(int pin) {
    if (pin >= 14) pin -= 14;  // A0-A5 → 0-5
    ADMUX  = (1<<REFS0) | (pin & 0x07);
    ADCSRA = (1<<ADEN) | (1<<ADSC) | (1<<ADPS2) | (1<<ADPS1) | (1<<ADPS0);
    while (ADCSRA & (1<<ADSC)) {}
    return ADC;
}

void analogWrite(int pin, int val) {
    val = constrain(val, 0, 255);
    switch (pin) {
        case 3:  // OC2B
            TCCR2A |= (1<<COM2B1)|(1<<WGM20)|(1<<WGM21);
            TCCR2B  = (1<<CS22);
            OCR2B   = val; break;
        case 5:  // OC0B
            TCCR0A |= (1<<COM0B1)|(1<<WGM01)|(1<<WGM00);
            OCR0B   = val; break;
        case 6:  // OC0A
            TCCR0A |= (1<<COM0A1)|(1<<WGM01)|(1<<WGM00);
            OCR0A   = val; break;
        case 9:  // OC1A
            TCCR1A |= (1<<COM1A1)|(1<<WGM10);
            TCCR1B  = (1<<WGM12)|(1<<CS11)|(1<<CS10);
            OCR1A   = val; break;
        case 10: // OC1B
            TCCR1A |= (1<<COM1B1)|(1<<WGM10);
            TCCR1B  = (1<<WGM12)|(1<<CS11)|(1<<CS10);
            OCR1B   = val; break;
        case 11: // OC2A
            TCCR2A |= (1<<COM2A1)|(1<<WGM20)|(1<<WGM21);
            TCCR2B  = (1<<CS22);
            OCR2A   = val; break;
        default:
            pinMode(pin, OUTPUT);
            digitalWrite(pin, val >= 128 ? HIGH : LOW);
    }
}

// ── Tone (buzzer) ─────────────────────────────────────────────────────────────
void tone(int pin, unsigned int freq, unsigned long duration) {
    (void)duration;
    if (freq == 0) { analogWrite(pin, 0); return; }
    analogWrite(pin, 128);  // 50% duty cycle approximation
}
void noTone(int pin) { analogWrite(pin, 0); }

// ── Serial (USART0) ───────────────────────────────────────────────────────────
static void _usart_tx(uint8_t b) {
    while (!(UCSR0A & (1<<UDRE0))) {}
    UDR0 = b;
}

static void _usart_print_str(const char* s) {
    while (*s) _usart_tx((uint8_t)*s++);
}

static void _usart_print_uint(unsigned long n, uint8_t base) {
    char buf[22];
    uint8_t i = 0;
    if (n == 0) { _usart_tx('0'); return; }
    while (n) { buf[i++] = "0123456789ABCDEF"[n % base]; n /= base; }
    while (i--) _usart_tx((uint8_t)buf[i]);
}

static void _usart_print_int(long n, uint8_t base) {
    if (base == DEC && n < 0) { _usart_tx('-'); _usart_print_uint((unsigned long)(-n), base); }
    else _usart_print_uint((unsigned long)n, base);
}

static void _usart_print_float(double f, uint8_t digits) {
    if (f < 0) { _usart_tx('-'); f = -f; }
    long ipart = (long)f;
    _usart_print_int(ipart, DEC);
    if (digits == 0) return;
    _usart_tx('.');
    f -= ipart;
    for (uint8_t d = 0; d < digits; d++) {
        f *= 10.0;
        uint8_t dig = (uint8_t)f;
        _usart_tx('0' + dig);
        f -= dig;
    }
}

// Minimal String class sufficient for echo patterns
class String {
    char _buf[256];
    uint16_t _len;
public:
    String() : _len(0) { _buf[0] = '\0'; }
    String(const char* s) : _len(0) {
        while (*s && _len < 254) _buf[_len++] = *s++;
        _buf[_len] = '\0';
    }
    String(char c) : _len(1) { _buf[0]=c; _buf[1]='\0'; }
    uint16_t length() const { return _len; }
    char operator[](uint16_t i) const { return _buf[i]; }
    String& operator+=(char c) {
        if (_len < 254) { _buf[_len++]=c; _buf[_len]='\0'; }
        return *this;
    }
    String& operator+=(const char* s) {
        while (*s && _len < 254) { _buf[_len++]=*s++; }
        _buf[_len]='\0'; return *this;
    }
    String& operator+=(const String& o) { return *this += o._buf; }
    const char* c_str() const { return _buf; }
    void clear() { _len=0; _buf[0]='\0'; }
    bool equals(const char* s) const { return strcmp(_buf, s)==0; }
};

class HardwareSerial {
    char _rxBuf[64];
    uint8_t _rxHead, _rxTail;
public:
    HardwareSerial() : _rxHead(0), _rxTail(0) {}

    void begin(long baud) {
        uint16_t ubrr = F_CPU / 16 / baud - 1;
        UBRR0H = (uint8_t)(ubrr >> 8);
        UBRR0L = (uint8_t)(ubrr);
        UCSR0B = (1<<TXEN0)|(1<<RXEN0);
        UCSR0C = (1<<UCSZ01)|(1<<UCSZ00);  // 8-bit, 1 stop, no parity
    }

    void print(const char* s)    { _usart_print_str(s); }
    void print(const String& s)  { _usart_print_str(s.c_str()); }
    void print(char c)           { _usart_tx((uint8_t)c); }
    void print(int n, int base=DEC)          { _usart_print_int((long)n, (uint8_t)base); }
    void print(unsigned int n, int base=DEC) { _usart_print_uint((unsigned long)n, (uint8_t)base); }
    void print(long n, int base=DEC)         { _usart_print_int(n, (uint8_t)base); }
    void print(unsigned long n, int base=DEC){ _usart_print_uint(n, (uint8_t)base); }
    void print(double f, int digits=2)       { _usart_print_float(f, (uint8_t)digits); }

    void println()                        { _usart_tx('\r'); _usart_tx('\n'); }
    void println(const char* s)           { print(s); println(); }
    void println(const String& s)         { print(s); println(); }
    void println(char c)                  { print(c); println(); }
    void println(int n, int base=DEC)     { print(n,base); println(); }
    void println(unsigned int n, int b=DEC){ print(n,b); println(); }
    void println(long n, int base=DEC)    { print(n,base); println(); }
    void println(unsigned long n, int b=DEC){ print(n,b); println(); }
    void println(double f, int digits=2)  { print(f,digits); println(); }

    int available() {
        return (UCSR0A & (1<<RXC0)) ? 1 : 0;
    }
    int read() {
        if (!(UCSR0A & (1<<RXC0))) return -1;
        return (int)UDR0;
    }
    void write(uint8_t b) { _usart_tx(b); }
    void flush() {}
    operator bool() { return true; }
};

HardwareSerial Serial;

// ── Wire (I2C/TWI) ────────────────────────────────────────────────────────────
// Uses ATmega328P TWI hardware registers — avr8js AVRTWI handles the callbacks.
#define _TWI_WAIT()  while (!(TWCR & (1<<TWINT))) {}
#define _TWI_STATUS  (TWSR & 0xF8)

class TwoWire {
    uint8_t _rxBuf[32];
    uint8_t _rxLen, _rxIdx;
    uint8_t _addr;

    void _start() {
        TWCR = (1<<TWINT)|(1<<TWSTA)|(1<<TWEN);
        _TWI_WAIT();
    }
    void _stop() {
        TWCR = (1<<TWINT)|(1<<TWEN)|(1<<TWSTO);
        // Brief spin so stop completes before next start
        delayMicroseconds(4);
    }
    uint8_t _write_byte(uint8_t b) {
        TWDR = b;
        TWCR = (1<<TWINT)|(1<<TWEN);
        _TWI_WAIT();
        return _TWI_STATUS;
    }
    uint8_t _read_byte(bool ack) {
        if (ack) TWCR = (1<<TWINT)|(1<<TWEN)|(1<<TWEA);
        else     TWCR = (1<<TWINT)|(1<<TWEN);
        _TWI_WAIT();
        return TWDR;
    }
public:
    TwoWire() : _rxLen(0), _rxIdx(0), _addr(0) {}

    void begin() {
        TWBR = ((F_CPU / 100000UL) - 16) / 2;  // 100 kHz
        TWCR = (1<<TWEN);
    }
    void begin(int sda, int scl) { (void)sda; (void)scl; begin(); }  // ESP32-compat no-op

    void beginTransmission(uint8_t addr) {
        _addr = addr;
        _start();
        _write_byte((addr << 1) | 0);  // SLA+W
    }
    void beginTransmission(int addr) { beginTransmission((uint8_t)addr); }

    void write(uint8_t b)  { _write_byte(b); }
    void write(int b)      { _write_byte((uint8_t)b); }
    void write(const uint8_t* buf, uint8_t len) {
        for (uint8_t i = 0; i < len; i++) _write_byte(buf[i]);
    }

    uint8_t endTransmission(uint8_t stop = 1) {
        if (stop) _stop();
        return 0;
    }

    uint8_t requestFrom(uint8_t addr, uint8_t len) {
        _rxLen = 0; _rxIdx = 0;
        _start();
        _write_byte((addr << 1) | 1);  // SLA+R
        for (uint8_t i = 0; i < len && _rxLen < 32; i++) {
            _rxBuf[_rxLen++] = _read_byte(i < (uint8_t)(len - 1));
        }
        _stop();
        return _rxLen;
    }
    uint8_t requestFrom(int addr, int len) {
        return requestFrom((uint8_t)addr, (uint8_t)len);
    }

    int read() {
        if (_rxIdx < _rxLen) return _rxBuf[_rxIdx++];
        return -1;
    }
    int available() { return _rxLen - _rxIdx; }
    void setClock(uint32_t freq) { TWBR = ((F_CPU / freq) - 16) / 2; }
    void onReceive(void (*cb)(int))   { (void)cb; }
    void onRequest(void (*cb)(void))  { (void)cb; }
};

TwoWire Wire;

// ── SPI (stub — not simulated) ────────────────────────────────────────────────
class SPISettings {
public:
    SPISettings(uint32_t, uint8_t, uint8_t) {}
};
class SPIClass {
public:
    void begin() {}
    void end()   {}
    void beginTransaction(const SPISettings&) {}
    void endTransaction() {}
    uint8_t transfer(uint8_t b) { return b; }
};
SPIClass SPI;

// ── Random ───────────────────────────────────────────────────────────────────
long random(long maxv)           { return (long)(millis() % (unsigned long)maxv); }
long random(long minv, long maxv){ return minv + random(maxv - minv); }
void randomSeed(unsigned long s) { (void)s; }

// ── Pulse / Interrupt stubs ───────────────────────────────────────────────────
unsigned long pulseIn(int pin, int val, unsigned long timeout) { (void)pin;(void)val;(void)timeout; return 0; }
void attachInterrupt(int n, void (*cb)(void), int mode) { (void)n;(void)cb;(void)mode; }
void detachInterrupt(int n) { (void)n; }
void interrupts()   { sei(); }
void noInterrupts() { cli(); }

// ── Misc ──────────────────────────────────────────────────────────────────────
uint8_t shiftIn(int dataPin, int clockPin, int order) {
    uint8_t val = 0;
    for (int i = 0; i < 8; i++) {
        digitalWrite(clockPin, HIGH);
        uint8_t b = (uint8_t)digitalRead(dataPin);
        if (order == MSBFIRST) val = (val<<1)|b; else val |= (b<<i);
        digitalWrite(clockPin, LOW);
    }
    return val;
}
void shiftOut(int dataPin, int clockPin, int order, uint8_t val) {
    for (int i = 0; i < 8; i++) {
        uint8_t b = (order == MSBFIRST) ? ((val >> (7-i))&1) : ((val>>i)&1);
        digitalWrite(dataPin, b);
        digitalWrite(clockPin, HIGH);
        digitalWrite(clockPin, LOW);
    }
}

// ── F() macro (string literals already in flash, no-op here) ─────────────────
#define F(s) (s)

// ── Forward declares ──────────────────────────────────────────────────────────
void setup();
void loop();

"""

    main_wrapper = """
int main(void) {
    _init_timer0();
    setup();
    while (1) {
        loop();
    }
    return 0;
}
"""

    # Strip any #include lines the user wrote that reference headers we mock here.
    # This avoids "file not found" errors for Wire.h, Arduino.h, SPI.h, etc.
    import re
    stripped = re.sub(
        r'^\s*#include\s*[<"][^>"]*(?:Wire|Arduino|SPI|Serial|avr/io|avr/interrupt|util/delay)[^>"]*[>"]\s*$',
        '',
        source_code,
        flags=re.MULTILINE | re.IGNORECASE,
    )

    full_source = minimal_core + stripped + main_wrapper

    with tempfile.TemporaryDirectory() as temp_dir:
        source_file = os.path.join(temp_dir, "sketch.cpp")
        elf_file    = os.path.join(temp_dir, "sketch.elf")
        hex_file    = os.path.join(temp_dir, "sketch.hex")

        with open(source_file, "w") as f:
            f.write(full_source)

        compile_cmd = [
            "avr-gcc", "-Os", "-DF_CPU=16000000L", "-mmcu=atmega328p",
            "-fno-exceptions",
            "-c", source_file, "-o", source_file + ".o",
        ]
        try:
            subprocess.run(compile_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Compilation Failed:\n{e.stderr}")

        link_cmd = [
            "avr-gcc", "-mmcu=atmega328p",
            "-Wl,--gc-sections",
            source_file + ".o", "-o", elf_file,
        ]
        try:
            subprocess.run(link_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Linking Failed:\n{e.stderr}")

        hex_cmd = [
            "avr-objcopy", "-O", "ihex", "-R", ".eeprom", elf_file, hex_file,
        ]
        try:
            subprocess.run(hex_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Objcopy Failed:\n{e.stderr}")

        with open(hex_file, "r") as f:
            return f.read()
