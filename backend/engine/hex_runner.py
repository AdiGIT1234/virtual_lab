from engine.avr_cpu import AVRCPU
from engine.avr_memory import AVRMemory

class HexRunner:
    """
    Executes compiled AVR Intel HEX files directly in our Python-based Emulation engine.
    Extracts UI-compatible timelines by monitoring memory boundaries.
    """
    def __init__(self, hex_content: str):
        self.mem = AVRMemory()
        self.cpu = AVRCPU(self.mem)
        self.cpu.load_hex(hex_content)
        self.timeline = []

        # We'll snapshot every N cycles or specific I/O triggers so the CPU doesn't blow up browser memory
        self.snapshot_interval = 1000 
        
        # Safe execution limits for the web backend (don't hang the server)
        self.MAX_CYCLES = 50000 

    def run(self):
        print("--- STARTING AVR NATIVE EMULATION ---")
        
        while self.cpu.cycles < self.MAX_CYCLES:
            old_pc = self.cpu.pc
            self.cpu.step()
            
            # If we trap ourselves (infinite loop like `rjmp .`), break out to avoid hanging
            if self.cpu.pc == old_pc:
                break
                
            # Periodically snapshot IO state for our visual timeline!
            if self.cpu.cycles % self.snapshot_interval == 0:
                self._capture_snapshot()
                
        # Final snapshot
        self._capture_snapshot()
        print(f"--- EMULATION COMPLETED IN {self.cpu.cycles} CYCLES ---")
        return self.timeline

    def _capture_snapshot(self):
        # We need to map AVRMemory raw bytes back to the frontend's timeline expectations
        
        # Read raw PORT byte
        portb = self.mem.read_byte(self.mem.IO_ADDR["PORTB"])
        portc = self.mem.read_byte(self.mem.IO_ADDR["PORTC"])
        portd = self.mem.read_byte(self.mem.IO_ADDR["PORTD"])
        
        # Convert byte (0x0F) -> array [1, 1, 1, 1, 0, 0, 0, 0] for the UI
        def to_bits(val):
            return [(val >> i) & 1 for i in range(8)]
            
        registers = {
            "DDRB": to_bits(self.mem.read_byte(self.mem.IO_ADDR["DDRB"])),
            "PORTB": to_bits(portb),
            "PINB": to_bits(portb), # simplificaiton: PIN = PORT for outputs
            
            "DDRC": to_bits(self.mem.read_byte(self.mem.IO_ADDR["DDRC"])),
            "PORTC": to_bits(portc),
            "PINC": to_bits(portc),
            
            "DDRD": to_bits(self.mem.read_byte(self.mem.IO_ADDR["DDRD"])),
            "PORTD": to_bits(portd),
            "PIND": to_bits(portd),
            
            "PWM": [0]*20  # Placeholder for PWM mapping if applicable
        }
        
        self.timeline.append({
            "time": self.cpu.cycles,
            "registers": registers
        })
