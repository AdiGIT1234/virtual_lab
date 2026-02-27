class AVRMemory:
    """
    ATmega328P Memory Architecture layout:
    - 32 General Purpose Working Registers (0x0000 - 0x001F)
    - 64 I/O Registers (0x0020 - 0x005F) 
      -> This includes PORTB/C/D, DDRB/C/D, PINB/C/D, TCCR0A, etc.
    - 160 Ext I/O Registers (0x0060 - 0x00FF)
    - 2048 bytes Internal SRAM (0x0100 - 0x08FF)
    """

    def __init__(self):
        # The entire data space: 32 GPRs + 64 IO + 160 Ext IO + 2048 SRAM = 2304 bytes.
        # We'll allocate 0x0900 (2304 bytes) for the full mapped data space.
        self.data_space = [0x00] * 0x0900
        
        # Flash Program Memory (32 KB = 16K x 16-bit instructions)
        # Addressed by words (16-bit), so we'll store 16-bit integers
        self.flash = [0x0000] * 16384

        # Important Special Function Registers mapping (Offsets in SRAM data space)
        self.IO_ADDR = {
            "PINB": 0x23, "DDRB": 0x24, "PORTB": 0x25,
            "PINC": 0x26, "DDRC": 0x27, "PORTC": 0x28,
            "PIND": 0x29, "DDRD": 0x2A, "PORTD": 0x2B,
            
            "TIFR0": 0x35, "TIFR1": 0x36, "TIFR2": 0x37,
            "PCIFR": 0x3B, "EIFR": 0x3C, "EIMSK": 0x3D,
            "GPIOR0": 0x3E, "EECR": 0x3F, "EEDR": 0x40, "EEARL": 0x41, "EEARH": 0x42,
            "GTCCR": 0x43, "TCCR0A": 0x44, "TCCR0B": 0x45, "TCNT0": 0x46, "OCR0A": 0x47, "OCR0B": 0x48,
            
            "MCUCR": 0x55, "MCUSR": 0x54,
            "SPMCSR": 0x57,
            "WDTCSR": 0x60, "CLKPR": 0x61,
            "PRR": 0x64,
            "OSCCAL": 0x66,
            "PCICR": 0x68,
            "EICRA": 0x69,
            "PCMSK0": 0x6B, "PCMSK1": 0x6C, "PCMSK2": 0x6D,
            "TIMSK0": 0x6E, "TIMSK1": 0x6F, "TIMSK2": 0x70,
            
            "ADCL": 0x78, "ADCH": 0x79, "ADCSRA": 0x7A, "ADCSRB": 0x7B, "ADMUX": 0x7C, "DIDR0": 0x7E,
            "TCCR1A": 0x80, "TCCR1B": 0x81, "TCCR1C": 0x82, 
            "TCNT1L": 0x84, "TCNT1H": 0x85, 
            "OCR1AL": 0x88, "OCR1AH": 0x89, "OCR1BL": 0x8A, "OCR1BH": 0x8B,
            "ICR1L": 0x86, "ICR1H": 0x87,
            
            "TCCR2A": 0xB0, "TCCR2B": 0xB1, "TCNT2": 0xB2, "OCR2A": 0xB3, "OCR2B": 0xB4,
            "ASSR": 0xB6,
            
            "TWBR": 0xB8, "TWSR": 0xB9, "TWAR": 0xBA, "TWDR": 0xBB, "TWCR": 0xBC, "TWAMR": 0xBD,
            
            "UCSR0A": 0xC0, "UCSR0B": 0xC1, "UCSR0C": 0xC2, "UBRR0L": 0xC4, "UBRR0H": 0xC5, "UDR0": 0xC6
        }

        # Status Register SREG (0x3F in IO space = 0x5F in Absolute memory)
        self.SREG_ADDR = 0x5F
        
        # Stack Pointer Registers SPL/SPH
        self.SPL_ADDR = 0x5D
        self.SPH_ADDR = 0x5E
        
        # Set default stack pointer to top of RAM (0x08FF)
        self.write_byte(self.SPH_ADDR, 0x08)
        self.write_byte(self.SPL_ADDR, 0xFF)

    def read_byte(self, address) -> int:
        if 0 <= address < len(self.data_space):
            return self.data_space[address]
        return 0

    def write_byte(self, address, value: int):
        if 0 <= address < len(self.data_space):
            self.data_space[address] = value & 0xFF
            
    def read_word(self, address) -> int:
        low = self.read_byte(address)
        high = self.read_byte(address + 1)
        return (high << 8) | low

    def write_word(self, address, value: int):
        self.write_byte(address, value & 0xFF)
        self.write_byte(address + 1, (value >> 8) & 0xFF)

    def get_io(self, name: str) -> int:
        addr = self.IO_ADDR.get(name)
        if addr is not None:
            return self.read_byte(addr)
        return 0

    def set_io(self, name: str, value: int):
        addr = self.IO_ADDR.get(name)
        if addr is not None:
            self.write_byte(addr, value)

    def load_hex(self, intel_hex_lines):
        # Implementation to parse Intel HEX file format and load into self.flash
        pass
