import * as Lib from '../components/LibraryComponents';

export const LIBRARY_COMPONENTS_MAP = {
  BUZZER: Lib.Buzzer,
  LCD1602: Lib.Lcd1602,
  LCD2004: Lib.Lcd1602, // Reusing 1602 visual temporarily
  OLED_SSD1306: Lib.OledSSD1306,
  ILI9341_TFT: Lib.Ili9341Tft,
  DHT22: Lib.Dht22,
  NTC_SENSOR: Lib.NtcSensor,
  PHOTORESISTOR: Lib.Photoresistor,
  PIR_SENSOR: Lib.PirSensor,
  MPU6050: Lib.Mpu6050,
  HC_SR04: Lib.HcSr04,
  FLAME_SENSOR: Lib.FlameSensor,
  GAS_SENSOR: Lib.GasSensor,
  HEARTBEAT_SENSOR: Lib.HeartbeatSensor,
  SOUND_SENSOR: Lib.SoundSensor,
  HX711_LOAD_CELL: Lib.LoadCellHx711,
  HX711_MODULE: Lib.LoadCellHx711,
  MEMBRANE_KEYPAD: Lib.MembraneKeypad,
  ROTARY_ENCODER: Lib.RotaryEncoder,
  ANALOG_JOYSTICK: Lib.AnalogJoystick,
  DIP_SWITCH_8: Lib.DipSwitch8,
  SLIDE_SWITCH: Lib.SlideSwitch,
  NEOPIXEL_MATRIX: Lib.NeopixelMatrix,
  NEOPIXEL_RING: Lib.NeopixelRing,
  NEOPIXEL_RING_12: Lib.NeopixelRing,
  NEOPIXEL_RING_16: Lib.NeopixelRing,
  NEOPIXEL_RING_24: Lib.NeopixelRing,
  STEPPER_MOTOR: Lib.StepperMotor,
  NEOPIXEL_PIXEL: Lib.NeopixelPixel,
  IR_RECEIVER: Lib.IrReceiver,
  IR_REMOTE: Lib.IrRemote,
  DS1307_RTC: Lib.Ds1307Rtc,
  MICROSD_MODULE: Lib.MicroSdModule,
  SHIFT_REGISTER: Lib.ShiftRegister,
  RELAY_MODULE: Lib.RelayModule,
  LED_MATRIX: Lib.LedMatrix8x8,
  LED_BAR_GRAPH: Lib.LedBarGraph,
  EPAPER_BASIC: Lib.EPaperDisplay,
  ANALOG_TV: Lib.AnalogTV,
  LOGIC_AND: Lib.LogicGateIC,
  LOGIC_OR: Lib.LogicGateIC,
  LOGIC_NOT: Lib.LogicGateIC,
  LOGIC_NAND: Lib.LogicGateIC,
  LOGIC_NOR: Lib.LogicGateIC,
  LOGIC_XOR: Lib.LogicGateIC,
  LOGIC_DFLIPFLOP: Lib.LogicGateIC,
  DC_MOTOR:       Lib.DcMotor,
  L298N_DRIVER:   Lib.L298nDriver,
  NMOSFET:        Lib.MosfetIC,
  PMOSFET:        Lib.MosfetIC,
  OPTOCOUPLER:    Lib.OptocouplerIC,
  TTP223_TOUCH:    Lib.Ttp223Touch,
  SW420_VIBRATION: Lib.Sw420Vibration,
  RAIN_SENSOR:     Lib.RainSensorComp,
  MAX30102_PULSE:  Lib.Max30102,
  TCS34725_COLOR:  Lib.Tcs34725Color,
  HC05_BLUETOOTH:  Lib.Hc05Bluetooth,
  RC522_RFID:      Lib.Rc522Rfid,
  AA_BATTERY:       Lib.AaBattery,
  BENCH_PSU:        Lib.BenchPsu,
  BUCK_CONVERTER:   Lib.BuckConverter,
  LM7805_REG:       Lib.Lm7805Reg,
  FUNCTION_GENERATOR: Lib.FunctionGenerator,
  USB_CONNECTOR:    Lib.UsbConnector,
  BARREL_JACK:      Lib.BarrelJack,
  SCREW_TERMINAL_2: Lib.ScrewTerminal2,
  SCREW_TERMINAL_3: Lib.ScrewTerminal3,
  SEVEN_SEG:        Lib.SevenSegDisplay,
};

export const LIBRARY_TERMINAL_LAYOUTS = {
  // Pin x/y values must exactly match the <Pin cx cy> coordinates in LibraryComponents.jsx SVGs.
  // For pins inside <g transform="translate(0, N)">, add N to the y value.
  BUZZER: [
    { id: "SIG", x: 24, y: 84 },
    { id: "GND", x: 56, y: 84 }
  ],
  // LCD1602: 16-pin header in <g transform="translate(0,118)">, Pin y=5 → actual y=123
  // Functional pins: vss(i=0), vdd(i=1), rs(i=3), e(i=5), d4(i=10)..d7(i=13), led+(i=14), led-(i=15)
  LCD1602: [
    { id: "vss",  x: 10,  y: 123 },
    { id: "vdd",  x: 23,  y: 123 },
    { id: "rs",   x: 49,  y: 123 },
    { id: "e",    x: 75,  y: 123 },
    { id: "d4",   x: 140, y: 123 },
    { id: "d5",   x: 153, y: 123 },
    { id: "d6",   x: 166, y: 123 },
    { id: "d7",   x: 179, y: 123 },
    { id: "led+", x: 192, y: 123 },
    { id: "led-", x: 205, y: 123 },
  ],
  LCD2004: [
    { id: "vss",  x: 10,  y: 123 },
    { id: "vdd",  x: 23,  y: 123 },
    { id: "rs",   x: 49,  y: 123 },
    { id: "e",    x: 75,  y: 123 },
    { id: "d4",   x: 140, y: 123 },
    { id: "d5",   x: 153, y: 123 },
    { id: "d6",   x: 166, y: 123 },
    { id: "d7",   x: 179, y: 123 },
    { id: "led+", x: 192, y: 123 },
    { id: "led-", x: 205, y: 123 },
  ],
  // OLED: 4-pin header in <g transform="translate(0,118)">, Pin y=5 → actual y=123, x=18+i*25
  OLED_SSD1306: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 18 + i*25, y: 123 })),
  // ILI9341: 8-pin header in <g transform="translate(0,172)">, Pin y=5 → actual y=177, x=10+i*16
  ILI9341_TFT: ["vcc","gnd","cs","rst","dc","mosi","sck","led"].map((id, i) => ({ id, x: 10 + i*16, y: 177 })),
  // EPAPER: 8-pin header in <g transform="translate(0,104)">, Pin y=5 → actual y=109, x=11+i*21
  EPAPER_BASIC: ["vcc","gnd","sck","mosi","cs","dc","rst","busy"].map((id, i) => ({ id, x: 11 + i*21, y: 109 })),
  DHT22: ["vcc","data","gnd"].map((id, i) => ({ id, x: 16 + i*18, y: 98 })),
  NTC_SENSOR: [
    { id: "t1", x: 18, y: 82 },
    { id: "t2", x: 36, y: 82 }
  ],
  PHOTORESISTOR: [
    { id: "l1", x: 14, y: 82 },
    { id: "l2", x: 40, y: 82 }
  ],
  PIR_SENSOR: ["vcc","out","gnd"].map((id, i) => ({ id, x: 18 + i*22, y: 90 })),
  MPU6050: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 11 + i*22, y: 64 })),
  HC_SR04: ["vcc","trig","echo","gnd"].map((id, i) => ({ id, x: 15 + i*28, y: 65 })),
  FLAME_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*18, y: 90 })),
  GAS_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 12 + i*20, y: 100 })),
  HEARTBEAT_SENSOR: ["vcc","sig","gnd"].map((id, i) => ({ id, x: 14 + i*24, y: 89 })),
  SOUND_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 11 + i*19, y: 90 })),
  HX711_LOAD_CELL: ["e+","e-","a+","a-","dt","sck","vcc","gnd"].map((id, i) => ({ id, x: 9 + i*11, y: 90 })),
  HX711_MODULE: ["e+","e-","a+","a-","dt","sck","vcc","gnd"].map((id, i) => ({ id, x: 9 + i*11, y: 90 })),
  // Keypad: 8 pins on the right edge at x=92, y=10+i*14 (i=0..7)
  MEMBRANE_KEYPAD: [1,2,3,4,5,6,7,8].map(i => ({ id: `p${i}`, x: 92, y: 10 + (i - 1) * 14 })),
  ROTARY_ENCODER: ["clk","dt","sw","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*12, y: 90 })),
  ANALOG_JOYSTICK: ["vrx","vry","sw","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*17, y: 96 })),
  DIP_SWITCH_8: [
    ...[1,2,3,4,5,6,7,8].map(i => ({ id: i.toString(), x: 13 + (i - 1)*13, y: 50 })),
    { id: "com", x: 110, y: 60 }
  ],
  SLIDE_SWITCH: [
    { id: "1", x: 14, y: 52 },
    { id: "2", x: 30, y: 52 },
    { id: "3", x: 46, y: 52 }
  ],
  // NeopixelMatrix: W=62, H=78; pins at x≈8/27/45, y=76
  NEOPIXEL_MATRIX:  [{ id: "5v", x: 8, y: 76 }, { id: "din", x: 27, y: 76 }, { id: "gnd", x: 45, y: 76 }],
  // NeopixelRing: pins in <g transform="translate(0,114)">, Pin y=5 → actual y=119, x=28+i*32
  NEOPIXEL_RING:    ["5v","din","gnd"].map((id, i) => ({ id, x: 28 + i*32, y: 119 })),
  NEOPIXEL_RING_12: ["5v","din","gnd"].map((id, i) => ({ id, x: 28 + i*32, y: 119 })),
  NEOPIXEL_RING_16: ["5v","din","gnd"].map((id, i) => ({ id, x: 28 + i*32, y: 119 })),
  NEOPIXEL_RING_24: ["5v","din","gnd"].map((id, i) => ({ id, x: 28 + i*32, y: 119 })),
  STEPPER_MOTOR: ["a+","a-","b+","b-"].map((id, i) => ({ id, x: 20 + i*18, y: 90 })),
  // NeopixelPixel: pins in <g transform="translate(0,52)">, Pin y=5 → actual y=57, x=10+i*18
  NEOPIXEL_PIXEL: ["5v","din","gnd"].map((id, i) => ({ id, x: 10 + i*18, y: 57 })),
  IR_RECEIVER: ["out","vcc","gnd"].map((id, i) => ({ id, x: 12 + i*15, y: 70 })),
  IR_REMOTE: [],
  DS1307_RTC: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 12 + i*23, y: 90 })),
  MICROSD_MODULE: ["vcc","gnd","miso","mosi","sck","cs"].map((id, i) => ({ id, x: 8 + i*14, y: 75 })),
  SHIFT_REGISTER: [
    ...["vcc","q0","ds","oe","stcp","shcp","mr","q7'"].map((id, i) => ({ id, x: 12, y: 18 + i*10 })),
    ...["q7","q6","q5","q4","q3","q2","q1","gnd"].map((id, i) => ({ id, x: 98, y: 18 + i*10 }))
  ],
  RELAY_MODULE: [
    ...["in","vcc","gnd"].map((id, i) => ({ id, x: 16 + i*18, y: 98 })),
    ...["com","no","nc"].map((id, i) => ({ id, x: 58 + i*14, y: 98 }))
  ],
  LED_MATRIX: [
    ...[0,1,2,3,4,5,6,7].map(i => ({ id: `c${i}`, x: 13 + i*10, y: 5 })),
    ...[0,1,2,3,4,5,6,7].map(i => ({ id: `r${i}`, x: 13 + i*10, y: 89 }))
  ],
  LED_BAR_GRAPH: ["1","2","3","4","5","6","7","8","9","10"].map((id, i) => ({ id, x: 11 + i*14, y: 50 })),
  ANALOG_TV: ["video", "gnd"].map((id, i) => ({ id, x: 50 + i*60, y: 170 })),
  // 2-input gates: in1 and in2 on left, out on right
  LOGIC_AND:  [{ id: "in1", x: 0, y: 22 }, { id: "in2", x: 0, y: 48 }, { id: "out", x: 90, y: 35 }],
  LOGIC_OR:   [{ id: "in1", x: 0, y: 22 }, { id: "in2", x: 0, y: 48 }, { id: "out", x: 90, y: 35 }],
  LOGIC_NAND: [{ id: "in1", x: 0, y: 22 }, { id: "in2", x: 0, y: 48 }, { id: "out", x: 90, y: 35 }],
  LOGIC_NOR:  [{ id: "in1", x: 0, y: 22 }, { id: "in2", x: 0, y: 48 }, { id: "out", x: 90, y: 35 }],
  LOGIC_XOR:  [{ id: "in1", x: 0, y: 22 }, { id: "in2", x: 0, y: 48 }, { id: "out", x: 90, y: 35 }],
  // NOT gate: single input
  LOGIC_NOT:  [{ id: "in1", x: 0, y: 35 }, { id: "out", x: 90, y: 35 }],
  // D Flip-Flop: d + clk on left, q + qn on right
  LOGIC_DFLIPFLOP: [{ id: "d", x: 0, y: 22 }, { id: "clk", x: 0, y: 48 }, { id: "q", x: 90, y: 22 }, { id: "qn", x: 90, y: 48 }],
  DC_MOTOR: [
    { id: "m+", x: 22, y: 86 },
    { id: "m-", x: 58, y: 86 },
  ],
  L298N_DRIVER: [
    { id: "ena",  x: 0,   y: 20 },
    { id: "in1",  x: 0,   y: 38 },
    { id: "in2",  x: 0,   y: 56 },
    { id: "in3",  x: 0,   y: 74 },
    { id: "in4",  x: 0,   y: 92 },
    { id: "enb",  x: 0,   y: 110 },
    { id: "vcc",  x: 120, y: 20 },
    { id: "gnd",  x: 120, y: 38 },
    { id: "out1", x: 120, y: 74 },
    { id: "out2", x: 120, y: 92 },
  ],
  NMOSFET: [{ id: "g", x: 15, y: 75 }, { id: "d", x: 30, y: 75 }, { id: "s", x: 45, y: 75 }],
  PMOSFET: [{ id: "g", x: 15, y: 75 }, { id: "d", x: 30, y: 75 }, { id: "s", x: 45, y: 75 }],
  OPTOCOUPLER: [
    { id: "ano",  x: 0,  y: 22 },
    { id: "cat",  x: 0,  y: 58 },
    { id: "col",  x: 60, y: 22 },
    { id: "emit", x: 60, y: 58 },
  ],
  TTP223_TOUCH: [
    { id: "vcc", x: 12, y: 68 }, { id: "io", x: 34, y: 68 }, { id: "gnd", x: 56, y: 68 },
  ],
  SW420_VIBRATION: [
    { id: "vcc", x: 12, y: 68 }, { id: "dout", x: 34, y: 68 }, { id: "gnd", x: 56, y: 68 },
  ],
  RAIN_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*20, y: 88 })),
  MAX30102_PULSE: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 10 + i*18, y: 82 })),
  TCS34725_COLOR: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 10 + i*18, y: 82 })),
  HC05_BLUETOOTH: ["vcc","gnd","txd","rxd","state","en"].map((id, i) => ({ id, x: 10 + i*16, y: 78 })),
  RC522_RFID: ["sda","sck","mosi","miso","irq","gnd","rst","3v3"].map((id, i) => ({ id, x: 8 + i*13, y: 68 })),
  AA_BATTERY: [{ id: "pos", x: 14, y: 5 }, { id: "neg", x: 14, y: 88 }],
  BENCH_PSU: [{ id: "v+", x: 20, y: 78 }, { id: "v-", x: 50, y: 78 }, { id: "gnd", x: 80, y: 78 }],
  BUCK_CONVERTER: [
    { id: "vin+", x: 0, y: 26 }, { id: "vin-", x: 0, y: 52 },
    { id: "vout+", x: 90, y: 26 }, { id: "vout-", x: 90, y: 52 },
  ],
  LM7805_REG: [{ id: "in", x: 15, y: 75 }, { id: "gnd", x: 30, y: 75 }, { id: "out", x: 45, y: 75 }],
  FUNCTION_GENERATOR: [{ id: "sig", x: 20, y: 78 }, { id: "gnd", x: 70, y: 78 }],
  USB_CONNECTOR: ["vbus","dm","dp","gnd"].map((id, i) => ({ id, x: 10 + i*15, y: 60 })),
  BARREL_JACK: [{ id: "pos", x: 14, y: 58 }, { id: "gnd", x: 34, y: 58 }],
  SCREW_TERMINAL_2: [{ id: "t1", x: 12, y: 48 }, { id: "t2", x: 28, y: 48 }],
  SCREW_TERMINAL_3: [{ id: "t1", x: 10, y: 48 }, { id: "t2", x: 27, y: 48 }, { id: "t3", x: 44, y: 48 }],
  // 7-segment: 8 pin stubs at y=108 matching the SevenSegDisplay SVG
  SEVEN_SEG: ['a','b','c','d','e','f','g','dp'].map((id, i) => ({ id, x: 9 + i * 10, y: 108 })),
};
