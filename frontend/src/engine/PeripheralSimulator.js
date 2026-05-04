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
        page: 0, col: 0,
        pageStart: 0, pageEnd: 7,
        colStart: 0, colEnd: 127,
        addrMode: 0,          // 0=horizontal, 1=vertical, 2=page
        isCommand: false,
        multiByteCmd: null,   // tracks multi-byte command state
        multiBytePending: 0,
        address: config.address || 0x3C,
      };
    } else if (type === "LCD1602") {
      this.components.get(id).state = {
        buffer: new Array(32).fill(" "),
        cursorPos: 0,
        nibbleWaiting: null,  // explicit null so first EN pulse is correctly handled
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
    } else if (type === "TFT_ILI9341") {
      this.components.get(id).state = {
        buffer: new Uint16Array(320 * 240), // 16-bit RGB565 pixels
        pins: config.pins, // cs, dc, rst, etc.
        isCommand: false,
        activeCommand: null,
        dataIdx: 0,
        colStart: 0, colEnd: 239,
        pageStart: 0, pageEnd: 319,
        cursorX: 0, cursorY: 0,
        highByte: null
      };
    } else if (type === "EPAPER_BASIC") {
      this.components.get(id).state = {
        buffer: new Uint8Array(4736),
        pins: config.pins,
        isCommand: false,
        activeCommand: null,
        dataIdx: 0,
        cursorX: 0, cursorY: 0,
        updatePending: false,
      };
    } else if (type === "KEYPAD") {
      this.components.get(id).state = {
        pins: config.pins, // e.g., ["8","9","10","11", "4","5","6","7"] (R1-R4, C1-C4)
        activeNode: null // e.g. "r2c3" 
      };
    }
  }

  unregisterComponent(id) {
    this.components.delete(id);
  }

  // ── Input actuation hooks ────────────────────────────────────────────────

  setButtonState(pin, pressed) {
    pin = String(pin);
    if (typeof window !== 'undefined' && window.setExternalPin) {
      window.setExternalPin(pin, pressed);
    }
    const idx = parseInt(pin, 10);
    if (!isNaN(idx) && idx < this.ioPins.length) {
      this.ioPins[idx] = pressed ? 1 : 0;
    }
  }

  setAnalogValue(pin, normalizedValue) {
    // normalizedValue: 0.0 – 1.0
    pin = String(pin);
    const idx = parseInt(pin, 10);
    if (!isNaN(idx) && idx < this.ioPins.length) {
      this.ioPins[idx] = Math.max(0, Math.min(1, normalizedValue));
    }
    if (typeof window !== 'undefined' && window.__esp32AnalogInputs) {
      window.__esp32AnalogInputs[pin] = normalizedValue;
    }
  }

  setSensorData(compId, data) {
    const comp = this.components.get(compId);
    if (comp) {
      comp.sensorData = { ...(comp.sensorData || {}), ...data };
      if (comp.config?.onSensorData) comp.config.onSensorData(comp.sensorData);
    }
  }

  onTWIConnect(addr) {
    this.twiAddress = addr;
    // SSD1306: Wait for commands or data
    for (const [_id, comp] of this.components.entries()) {
      if (comp.type === "OLED_SSD1306" && comp.state.address === addr) {
        // Reset command/data flag for next byte determining control byte
        comp.state.awaitingControlByte = true;
      }
    }
  }

  onTWIByte(value) {
    for (const [_id, comp] of this.components.entries()) {
      if (comp.type === "OLED_SSD1306" && comp.state.address === this.twiAddress) {
        const s = comp.state;

        // First byte after I2C address is the SSD1306 control byte:
        //   0x00 → command stream, 0x40 → data stream,
        //   0x80 → single command, 0xC0 → single data
        if (s.awaitingControlByte) {
          s.isCommand = (value & 0x40) === 0; // bit 6 = 0 means command
          s.awaitingControlByte = false;
          continue;
        }

        if (s.isCommand) {
          // ── Multi-byte command state machine ────────────────────────────
          if (s.multiByteCmd !== null) {
            if (s.multiByteCmd === 0x20) {
              s.addrMode = value & 0x03; // 0=horiz, 1=vert, 2=page
            } else if (s.multiByteCmd === 0x21) {
              if (s.multiBytePending === 1) { s.colStart = value & 0x7F; s.col = s.colStart; }
              else                          { s.colEnd   = value & 0x7F; }
            } else if (s.multiByteCmd === 0x22) {
              if (s.multiBytePending === 1) { s.pageStart = value & 0x07; s.page = s.pageStart; }
              else                          { s.pageEnd   = value & 0x07; }
            }
            s.multiBytePending--;
            if (s.multiBytePending <= 0) s.multiByteCmd = null;
            continue;
          }

          // ── Single-byte and initiating multi-byte commands ───────────────
          const cmd = value;
          if (cmd === 0x20) { s.multiByteCmd = 0x20; s.multiBytePending = 1; }  // set addr mode
          else if (cmd === 0x21) { s.multiByteCmd = 0x21; s.multiBytePending = 2; } // col addr
          else if (cmd === 0x22) { s.multiByteCmd = 0x22; s.multiBytePending = 2; } // page addr
          else if (cmd >= 0xB0 && cmd <= 0xB7) { s.page = cmd & 0x07; }            // page start (page mode)
          else if ((cmd & 0xF0) === 0x00)       { s.col = (s.col & 0xF0) | (cmd & 0x0F); }   // col lower nibble
          else if ((cmd & 0xF0) === 0x10)       { s.col = (s.col & 0x0F) | ((cmd & 0x0F) << 4); } // col upper
          else if (cmd === 0x2E || cmd === 0x2F) { /* scroll off/on — ignore */ }
          else if (cmd === 0xAE) { /* display off */ }
          else if (cmd === 0xAF) { /* display on — trigger render */ if (comp.config.onRenderTarget) comp.config.onRenderTarget(s.buffer); }
          // Remaining commands (contrast, charge pump, etc.) accepted but ignored
        } else {
          // ── Data write ───────────────────────────────────────────────────
          const idx = s.page * 128 + s.col;
          if (idx >= 0 && idx < 1024) s.buffer[idx] = value;

          // Advance position depending on addressing mode
          if (s.addrMode === 0) {
            // Horizontal: col → page
            s.col++;
            if (s.col > s.colEnd) {
              s.col = s.colStart;
              s.page = (s.page >= s.pageEnd) ? s.pageStart : s.page + 1;
            }
          } else if (s.addrMode === 1) {
            // Vertical: page → col
            s.page++;
            if (s.page > s.pageEnd) {
              s.page = s.pageStart;
              s.col = (s.col >= s.colEnd) ? s.colStart : s.col + 1;
            }
          } else {
            // Page: col only (wraps within page)
            s.col++;
            if (s.col >= 128) s.col = 0;
          }

          if (comp.config.onRenderTarget) comp.config.onRenderTarget(s.buffer);
        }
      }
    }
  }

  onSPIByte(value) {
    for (const [_id, comp] of this.components.entries()) {
      if (comp.type === "TFT_ILI9341") {
        if (this.getPinVal(comp.state.pins.cs) !== 0) continue; // Ignore if CS is High

        const isCommand = this.getPinVal(comp.state.pins.dc) === 0;
        
        if (isCommand) {
          comp.state.activeCommand = value;
          comp.state.dataIdx = 0;
        } else {
          switch (comp.state.activeCommand) {
            case 0x2A: // CASET (Column Address Set)
              if (comp.state.dataIdx === 0) comp.state.highByte = value;
              else if (comp.state.dataIdx === 1) comp.state.colStart = (comp.state.highByte << 8) | value;
              else if (comp.state.dataIdx === 2) comp.state.highByte = value;
              else if (comp.state.dataIdx === 3) {
                  comp.state.colEnd = (comp.state.highByte << 8) | value;
                  comp.state.cursorX = comp.state.colStart;
              }
              comp.state.dataIdx++;
              break;
            case 0x2B: // PASET (Page Address Set)
              if (comp.state.dataIdx === 0) comp.state.highByte = value;
              else if (comp.state.dataIdx === 1) comp.state.pageStart = (comp.state.highByte << 8) | value;
              else if (comp.state.dataIdx === 2) comp.state.highByte = value;
              else if (comp.state.dataIdx === 3) {
                  comp.state.pageEnd = (comp.state.highByte << 8) | value;
                  comp.state.cursorY = comp.state.pageStart;
              }
              comp.state.dataIdx++;
              break;
            case 0x2C: // RAMWR (Memory Write)
            case 0x3C: // RAMWR (Memory Write Continue)
              if (comp.state.dataIdx % 2 === 0) {
                 comp.state.highByte = value;
              } else {
                 const color = (comp.state.highByte << 8) | value;
                 const idx = comp.state.cursorY * 240 + comp.state.cursorX; // 240 width typical portrait
                 if (idx < comp.state.buffer.length) {
                    comp.state.buffer[idx] = color;
                 }
                 comp.state.cursorX++;
                 if (comp.state.cursorX > comp.state.colEnd || comp.state.cursorX >= 240) {
                    comp.state.cursorX = comp.state.colStart;
                    comp.state.cursorY++;
                    if (comp.state.cursorY > comp.state.pageEnd || comp.state.cursorY >= 320) {
                       comp.state.cursorY = comp.state.pageStart;
                    }
                 }
                 // Simple throttling logic so we don't trigger 60Hz rerenders on every sub-pixel!
                 // React will fetch via interval or we can trigger roughly every N scanlines.
              }
              comp.state.dataIdx++;
              break;
          }
        }
      } else if (comp.type === "EPAPER_BASIC") {
        if (this.getPinVal(comp.state.pins.cs) !== 0) continue; // CS High

        const isCommand = this.getPinVal(comp.state.pins.dc) === 0;
        
        if (isCommand) {
          comp.state.activeCommand = value;
          comp.state.dataIdx = 0;
          if (value === 0x20 || value === 0x12) {
             // Master Update Activation / Display Refresh
             comp.state.updatePending = true;
          }
        } else {
          if (comp.state.activeCommand === 0x24) { // Read/Write RAM
             if (comp.state.dataIdx < comp.state.buffer.length) {
                comp.state.buffer[comp.state.dataIdx] = value;
             }
             comp.state.dataIdx++;
          }
        }
      }
    }
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

  cpuWriteFlatGPIO(gpioArray, cycles) {
    if (!gpioArray) return;
    for (let index = 0; index < gpioArray.length; index++) {
      const pinValue = gpioArray[index];
      // ESP32 Pins can be 0-39
      if (this.ioPins[index] !== pinValue) {
        this.ioPins[index] = pinValue;
        this.checkPinTriggers(index.toString(), pinValue, cycles);
        this.pinLastToggledAt[index] = cycles;
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
    for (const [_id, comp] of this.components.entries()) {
      if (comp.type === "LCD1602") {
        if (String(comp.state.pins.e) === String(pinStr) && val === 0) {
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
        if (String(comp.state.pin) === String(pinStr)) {
          const delta = cycles - this.pinLastToggledAt[parseInt(pinStr, 10)];
          
          if (val === 0) { // Falling edge -> End of High pulse (encodes data)
            if (delta > 3 && delta < 18) { // Valid data pulse (8 cycles = bit 0, ~14 cycles = bit 1)
               const bit = delta >= 10 ? 1 : 0;
               comp.state.activeByte = (comp.state.activeByte << 1) | bit;
               comp.state.activeBit++;
               
               if (comp.state.activeBit >= 8) {
                  // Push byte depending on WS2812 GRB layout
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
      } else if (comp.type === "KEYPAD") {
        if (comp.state.activeNode) {
           const rowIdx = parseInt(comp.state.activeNode.charAt(1), 10); // 1-4
           const colIdx = parseInt(comp.state.activeNode.charAt(3), 10); // 1-4
           const rowPin = comp.state.pins[rowIdx - 1];
           const colPin = comp.state.pins[colIdx + 3];

           if (rowPin === pinStr && typeof window !== 'undefined' && window.setExternalPin) {
               window.setExternalPin(colPin, val === 1);
           }
        }
      }
    }
  }

  // Called by ESP32 display shims to push rendered framebuffers directly
  _oledPush(buf) {
    for (const [, comp] of this.components.entries()) {
      if (comp.type === "OLED_SSD1306" && comp.config.onRenderTarget) {
        comp.state.buffer = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        comp.config.onRenderTarget(comp.state.buffer);
      }
    }
  }

  _tftPush(buf) {
    for (const [, comp] of this.components.entries()) {
      if (comp.type === "TFT_ILI9341") {
        comp.state.buffer = buf instanceof Uint16Array ? buf : new Uint16Array(buf);
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
