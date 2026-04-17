class PeripheralSimulatorEngine {
  constructor() {
    this.components = new Map();
    // I2C State
    this.twiAddress = null;
    // SPI State
    this.spiActive = false;
    // Fast IO State
    this.ioPins = new Array(20).fill(0);
    // Pin Timing trackers for WS2812 decoding
    this.pinLastToggledAt = new Array(20).fill(0);
  }

  registerComponent(id, type, config) {
    this.components.set(id, { type, config, state: {} });
    if (type === "OLED_SSD1306") {
      this.components.get(id).state = {
        buffer: new Uint8Array(1024),
        page: 0,
        col: 0,
        isCommand: false,
        address: config.address || 0x3C
      };
    } else if (type === "LCD1602") {
      this.components.get(id).state = {
        buffer: new Array(32).fill(" "),
        cursorPos: 0,
        pins: config.pins
      };
    } else if (type === "NEOPIXEL") {
      this.components.get(id).state = {
        pin: config.pin,
        buffer: new Uint8Array(config.length * 3),
        activeByte: 0,
        activeBit: 0,
        activeLed: 0,
      };
    }
  }

  unregisterComponent(id) {
    this.components.delete(id);
  }

  onTWIConnect(addr, write, cycles) {
    this.twiAddress = addr;
    // SSD1306: Wait for commands or data
    for (const [id, comp] of this.components.entries()) {
      if (comp.type === "OLED_SSD1306" && comp.state.address === addr) {
        // Reset command/data flag for next byte determining control byte
        comp.state.awaitingControlByte = true;
      }
    }
  }

  onTWIByte(value, cycles) {
    for (const [id, comp] of this.components.entries()) {
      if (comp.type === "OLED_SSD1306" && comp.state.address === this.twiAddress) {
        if (comp.state.awaitingControlByte) {
          comp.state.isCommand = (value === 0x00); // 0x00 is Command, 0x40 is Data
          comp.state.awaitingControlByte = false;
        } else if (comp.state.isCommand) {
          // Parse SSD1306 Commands
          const cmd = value;
          if (cmd >= 0xB0 && cmd <= 0xB7) {
            comp.state.page = cmd & 0x0F; // Page Start Address
          } else if ((cmd & 0xF0) === 0x00) {
            comp.state.col = (comp.state.col & 0xF0) | (cmd & 0x0F); // Lower Column
          } else if ((cmd & 0xF0) === 0x10) {
            comp.state.col = (comp.state.col & 0x0F) | ((cmd & 0x0F) << 4); // Upper Column
          }
           // Trigger render callback if a major command happens like clear? Not necessary, data draws.
        } else {
          // Parse SSD1306 Data
          const idx = comp.state.page * 128 + comp.state.col;
          if (idx < 1024) {
            comp.state.buffer[idx] = value;
            comp.state.col++;
            if (comp.state.col >= 128) {
               // Typical addressing wraps or we handle horizontal/page addressing modes.
               // Simple page mode wrap for logic:
               comp.state.col = 0;
            }
          }
          if (comp.config.onRenderTarget) comp.config.onRenderTarget(comp.state.buffer);
        }
      }
    }
  }

  onSPIByte(value, cycles) {
    // Implement SPI parsing (TFT, Matrix)
  }

  onPortChange(portChar, newValue, oldValue, cycles) {
    // Break port byte into pin changes
    let changedBits = newValue ^ oldValue;
    if (changedBits === 0) return;

    // Map to Arduino Pins
    let basePinOffset = 0;
    if (portChar === 'D') basePinOffset = 0;   // D0-D7
    else if (portChar === 'B') basePinOffset = 8; // D8-D13
    else if (portChar === 'C') basePinOffset = 14; // A0-A5
    else return;

    for (let bit = 0; bit < 8; bit++) {
      if ((changedBits & (1 << bit)) !== 0) {
        const pinValue = (newValue & (1 << bit)) !== 0 ? 1 : 0;
        const arduinoPinIndex = basePinOffset + bit;
        this.ioPins[arduinoPinIndex] = pinValue;
        
        // Notify components dependent on this pin
        this.checkPinTriggers(arduinoPinIndex.toString(), pinValue, cycles);
        
        this.pinLastToggledAt[arduinoPinIndex] = cycles;
      }
    }
  }

  getPinVal(mappedPinStr) {
    // Expects mappedPinStr like "12", "A0"
    let index = parseInt(mappedPinStr, 10);
    if (isNaN(index)) {
      if (mappedPinStr === "A0") index = 14;
      else if (mappedPinStr === "A1") index = 15;
      else if (mappedPinStr === "A2") index = 16;
      else if (mappedPinStr === "A3") index = 17;
      else if (mappedPinStr === "A4") index = 18;
      else if (mappedPinStr === "A5") index = 19;
    }
    return this.ioPins[index] || 0;
  }

  checkPinTriggers(pinStr, val, cycles) {
    for (const [id, comp] of this.components.entries()) {
      if (comp.type === "LCD1602") {
        if (comp.state.pins.e === pinStr && val === 0) {
          // Falling edge of EN - clock in data!
          const rs = this.getPinVal(comp.state.pins.rs);
          
          let data = 0;
          if (comp.state.pins.d4) {
             // 4-bit mode (strobe happens twice holding half, simplifies here by ignoring high/low sequence for a quick standard trace)
             // A real robust 4-bit parser tracks flip/flop states.
             data |= (this.getPinVal(comp.state.pins.d4) << 4);
             data |= (this.getPinVal(comp.state.pins.d5) << 5);
             data |= (this.getPinVal(comp.state.pins.d6) << 6);
             data |= (this.getPinVal(comp.state.pins.d7) << 7);
             if (comp.state.nibbleWaiting) {
               data = (comp.state.nibbleWaiting) | (data >> 4);
               comp.state.nibbleWaiting = null;
             } else {
               comp.state.nibbleWaiting = data; 
               continue; 
             }
          }
          
          if (rs === 0) {
            // Command
            if (data === 0x01) {
              comp.state.buffer.fill(" ");
              comp.state.cursorPos = 0;
            } else if ((data & 0x80) !== 0) {
              // Set DDRAM address
              const addr = data & 0x7F;
              // Row 0 starts at 0x00, Row 1 at 0x40
              comp.state.cursorPos = addr >= 0x40 ? 16 + (addr - 0x40) : addr;
            }
          } else {
            // Data
            if (comp.state.cursorPos < 32) {
              comp.state.buffer[comp.state.cursorPos] = String.fromCharCode(data);
              comp.state.cursorPos++;
            }
          }
          if (comp.config.onRenderTarget) comp.config.onRenderTarget(comp.state.buffer);
        }
      } else if (comp.type === "NEOPIXEL") {
        if (comp.state.pin === pinStr) {
          const delta = cycles - this.pinLastToggledAt[parseInt(pinStr, 10)];
          
          if (val === 0) { // Falling edge -> End of High pulse (encodes data)
            if (delta > 3 && delta < 18) { // Valid data pulse (8 cycles = bit 0, ~14 cycles = bit 1)
               const bit = delta >= 10 ? 1 : 0;
               comp.state.activeByte = (comp.state.activeByte << 1) | bit;
               comp.state.activeBit++;
               
               if (comp.state.activeBit >= 8) {
                  // Push byte depending on WS2812 GRB layout
                  const bufIdx = comp.state.activeLed * 3;
                  if (bufIdx + 2 < comp.state.buffer.length) { // safety
                     // For simplistic mapping without full GRB tracking locally we just write linear
                     const rawByteIndex = Math.floor(comp.state.activeBit / 8) - 1; // 0, 1, 2
                     // Wait, activeBit rolls over!
                  }
                  
                  // Simpler tracking:
                  const ledParamIdx = comp.state.activeBit === 8 ? 1 : (comp.state.activeBit === 16 ? 0 : 2); // GRB -> 0:G, 1:R, 2:B mapping approximation
                  // Actually let's just index linearly:
                  const channel = Math.floor((comp.state.activeBit - 1) / 8); 
                  comp.state.buffer[comp.state.activeLed * 3 + channel] = comp.state.activeByte;
                  
                  if (comp.state.activeBit >= 24) {
                     comp.state.activeLed++;
                     comp.state.activeBit = 0;
                  }
                  comp.state.activeByte = 0;
               }
            }
          } else { // Rising edge -> Check for reset pulse beforehand
            // Reset pulse must be > 50us (800 cycles)
            if (delta > 800) {
               comp.state.activeLed = 0;
               comp.state.activeBit = 0;
               comp.state.activeByte = 0;
               if (comp.config.onRenderTarget) comp.config.onRenderTarget(comp.state.buffer);
            }
          }
        }
      }
    }
  }
}

export const PeripheralSimulator = new PeripheralSimulatorEngine();

if (typeof window !== 'undefined') {
  window.onTWIConnect = (addr, write, cycles) => PeripheralSimulator.onTWIConnect(addr, write, cycles);
  window.onTWIByte = (value, cycles) => PeripheralSimulator.onTWIByte(value, cycles);
  window.onSPIByte = (value, cycles) => PeripheralSimulator.onSPIByte(value, cycles);
  window.onPortChange = (portChar, newVal, oldVal, cycles) => PeripheralSimulator.onPortChange(portChar, newVal, oldVal, cycles);
}
