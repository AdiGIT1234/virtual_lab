import sys

class AVREmulatorException(Exception):
    pass

class AVRCPU:
    def __init__(self, memory):
        self.mem = memory
        self.pc = 0  # Program Counter (in words)
        self.cycles = 0

    def load_hex(self, hex_content):
        """Parse Intel Hex format and load into flash."""
        for line in hex_content.strip().split('\\n'):
            line = line.strip()
            if not line or not line.startswith(':'): continue
            
            # Parse record
            byte_count = int(line[1:3], 16)
            address = int(line[3:7], 16)
            record_type = int(line[7:9], 16)
            
            if record_type == 0x00:  # Data record
                data = line[9:9+(byte_count*2)]
                for i in range(0, len(data), 2):
                    byte_val = int(data[i:i+2], 16)
                    self.mem.flash[address + (i//2)] = byte_val
                    
            elif record_type == 0x01:  # EOF record
                break

    def step(self):
        """Execute one instruction from Flash Memory."""
        # Read 16-bit instruction word from Flash (address is PC in words)
        opcode_low = self.mem.flash[self.pc * 2]
        opcode_high = self.mem.flash[self.pc * 2 + 1]
        opcode = (opcode_high << 8) | opcode_low
        
        self.pc += 1
        
        # ----------------------------------------------------
        # Basic Instruction Decoder (Proof of Concept)
        # ----------------------------------------------------
        # We'll decode enough basics for a while(1) { PORTB ^= 0xFF; delay(); }
        
        # RJMP: 1100 kkkk kkkk kkkk
        if (opcode & 0xF000) == 0xC000:
            k = opcode & 0x0FFF
            if k & 0x0800: k -= 0x1000  # Sign extend 12 bits
            self.pc = (self.pc + k) & 0xFFFF
            self.cycles += 2
            return

        # OUT A, Rr: 1011 1AAd dddd AAAA
        if (opcode & 0xF800) == 0xB800:
            r = (opcode >> 4) & 0x1F
            a = ((opcode >> 5) & 0x30) | (opcode & 0x0F)
            val = self.mem.read_byte(r)  # Rr
            self.mem.write_byte(0x20 + a, val)  # I/O space starts at 0x20
            self.cycles += 1
            return

        # IN Rd, A: 1011 0AAd dddd AAAA
        if (opcode & 0xF800) == 0xB000:
            d = (opcode >> 4) & 0x1F
            a = ((opcode >> 5) & 0x30) | (opcode & 0x0F)
            val = self.mem.read_byte(0x20 + a)
            self.mem.write_byte(d, val)
            self.cycles += 1
            return

        # LDI Rd, K: 1110 KKKK dddd KKKK (d corresponds to R16-R31, so +16)
        if (opcode & 0xF000) == 0xE000:
            d = 16 + ((opcode >> 4) & 0x0F)
            k = ((opcode >> 4) & 0xF0) | (opcode & 0x0F)
            self.mem.write_byte(d, k)
            self.cycles += 1
            return

        # EOR Rd, Rr: 0010 01rd dddd rrrr
        if (opcode & 0xFC00) == 0x2400:
            r = ((opcode >> 5) & 0x10) | (opcode & 0x0F)
            d = (opcode >> 4) & 0x1F
            res = self.mem.read_byte(d) ^ self.mem.read_byte(r)
            self.mem.write_byte(d, res)
            # Update Zero flag in SREG (Bit 1)
            sreg = self.mem.read_byte(self.mem.SREG_ADDR)
            if res == 0:
                sreg |= 0x02
            else:
                sreg &= ~0x02
            self.mem.write_byte(self.mem.SREG_ADDR, sreg)
            self.cycles += 1
            return

        # RCALL: 1101 kkkk kkkk kkkk
        if (opcode & 0xF000) == 0xD000:
            k = opcode & 0x0FFF
            if k & 0x0800: k -= 0x1000
            
            # Push PC to Stack
            ret_pc = self.pc
            sph = self.mem.get_io("SPH")
            spl = self.mem.get_io("SPL")
            sp = (sph << 8) | spl
            
            self.mem.write_byte(sp, (ret_pc) & 0xFF)
            sp -= 1
            self.mem.write_byte(sp, (ret_pc >> 8) & 0xFF)
            sp -= 1
            
            self.mem.set_io("SPH", (sp >> 8) & 0xFF)
            self.mem.set_io("SPL", sp & 0xFF)
            
            self.pc = (self.pc + k) & 0xFFFF
            self.cycles += 3
            return

        # RET: 1001 0101 0000 1000 
        if opcode == 0x9508:
            sph = self.mem.get_io("SPH")
            spl = self.mem.get_io("SPL")
            sp = ((sph << 8) | spl) + 1
            
            high = self.mem.read_byte(sp)
            sp += 1
            low = self.mem.read_byte(sp)
            
            self.mem.set_io("SPH", (sp >> 8) & 0xFF)
            self.mem.set_io("SPL", sp & 0xFF)
            
            self.pc = (high << 8) | low
            self.cycles += 4
            return

        # SBI A, b: 1001 1010 AAAA Abbb
        if (opcode & 0xFF00) == 0x9A00:
            a = (opcode >> 3) & 0x1F
            b = opcode & 0x07
            val = self.mem.read_byte(0x20 + a)
            self.mem.write_byte(0x20 + a, val | (1 << b))
            self.cycles += 2
            return

        # CBI A, b: 1001 1000 AAAA Abbb
        if (opcode & 0xFF00) == 0x9800:
            a = (opcode >> 3) & 0x1F
            b = opcode & 0x07
            val = self.mem.read_byte(0x20 + a)
            self.mem.write_byte(0x20 + a, val & ~(1 << b))
            self.cycles += 2
            return

        # DEC Rd: 1001 010d dddd 1010
        if (opcode & 0xFE0F) == 0x940A:
            d = (opcode >> 4) & 0x1F
            val = (self.mem.read_byte(d) - 1) & 0xFF
            self.mem.write_byte(d, val)
            sreg = self.mem.read_byte(self.mem.SREG_ADDR)
            if val == 0: sreg |= 0x02
            else: sreg &= ~0x02
            self.mem.write_byte(self.mem.SREG_ADDR, sreg)
            self.cycles += 1
            return

        # BRNE: 1111 01kk kkkk k001
        if (opcode & 0xFC07) == 0xF401:
            k = (opcode >> 3) & 0x7F
            if k & 0x40: k -= 0x80
            sreg = self.mem.read_byte(self.mem.SREG_ADDR)
            if not (sreg & 0x02): # not Zero
                self.pc = (self.pc + k) & 0xFFFF
                self.cycles += 2
            else:
                self.cycles += 1
            return

        # Just ignore unknown ops for the basic emulator loop and increment cycles to avoid crashing entirely on a complex binary
        # print(f"Unknown Opcode at PC {self.pc-1}: {hex(opcode)}")
        self.cycles += 1

