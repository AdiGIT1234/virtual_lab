import os
import subprocess
import tempfile

def compile_code(source_code: str) -> str:
    """
    Compiles Arduino-like C++ code using avr-gcc into an Intel HEX string.
    
    Includes a minimal Arduino.h mock to support setup(), loop(), pinMode(), digitalWrite(), etc.
    """
    
    # We will wrap the user code with a minimal Arduino core implementation
    # to support the exact syntax they are using in the web editor without needing the full 20MB Arduino core.
    
    minimal_core = """
#include <avr/io.h>
#include <util/delay.h>

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1

void pinMode(int pin, int mode) {
    if (pin >= 0 && pin <= 7) {
        if (mode == OUTPUT) DDRD |= (1 << pin);
        else DDRD &= ~(1 << pin);
    } else if (pin >= 8 && pin <= 13) {
        if (mode == OUTPUT) DDRB |= (1 << (pin - 8));
        else DDRB &= ~(1 << (pin - 8));
    } else if (pin >= 14 && pin <= 19) {
        if (mode == OUTPUT) DDRC |= (1 << (pin - 14));
        else DDRC &= ~(1 << (pin - 14));
    }
}

void digitalWrite(int pin, int val) {
    if (pin >= 0 && pin <= 7) {
        if (val == HIGH) PORTD |= (1 << pin);
        else PORTD &= ~(1 << pin);
    } else if (pin >= 8 && pin <= 13) {
        if (val == HIGH) PORTB |= (1 << (pin - 8));
        else PORTB &= ~(1 << (pin - 8));
    } else if (pin >= 14 && pin <= 19) {
        if (val == HIGH) PORTC |= (1 << (pin - 14));
        else PORTC &= ~(1 << (pin - 14));
    }
}

int digitalRead(int pin) {
    if (pin >= 0 && pin <= 7) return (PIND & (1 << pin)) ? HIGH : LOW;
    if (pin >= 8 && pin <= 13) return (PINB & (1 << (pin - 8))) ? HIGH : LOW;
    if (pin >= 14 && pin <= 19) return (PINC & (1 << (pin - 14))) ? HIGH : LOW;
    return LOW;
}

void delay(unsigned long ms) {
    while(ms--) {
        _delay_ms(1);
    }
}

// Forward declare user functions
void setup();
void loop();

// Dummy Serial object for compatibility
class SerialMock {
public:
    void begin(long baud) {}
    void print(const char* str) {}
    void println(const char* str) {}
};
SerialMock Serial;

"""
    
    main_wrapper = """
int main(void) {
    setup();
    while (1) {
        loop();
    }
    return 0;
}
"""

    full_source = minimal_core + source_code + main_wrapper

    with tempfile.TemporaryDirectory() as temp_dir:
        source_file = os.path.join(temp_dir, "sketch.cpp")
        elf_file = os.path.join(temp_dir, "sketch.elf")
        hex_file = os.path.join(temp_dir, "sketch.hex")
        
        with open(source_file, "w") as f:
            f.write(full_source)
            
        # 1. Compile to ELF
        # -Os: optimize for size
        # -DF_CPU=16000000L: 16 MHz clock
        # -mmcu=atmega328p: target MCU
        compile_cmd = [
            "avr-gcc", "-Os", "-DF_CPU=16000000L", "-mmcu=atmega328p",
            "-c", source_file, "-o", source_file + ".o"
        ]
        
        try:
            subprocess.run(compile_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Compilation Failed:\\n{e.stderr}")
            
        # 2. Link object to ELF
        link_cmd = [
            "avr-gcc", "-mmcu=atmega328p", source_file + ".o", "-o", elf_file
        ]
        
        try:
            subprocess.run(link_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Linking Failed:\\n{e.stderr}")
            
        # 3. Extract HEX
        hex_cmd = [
            "avr-objcopy", "-O", "ihex", "-R", ".eeprom", elf_file, hex_file
        ]
        
        try:
            subprocess.run(hex_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Objcopy Failed:\\n{e.stderr}")
            
        # Read the generated hex
        with open(hex_file, "r") as f:
            hex_content = f.read()
            
        return hex_content
