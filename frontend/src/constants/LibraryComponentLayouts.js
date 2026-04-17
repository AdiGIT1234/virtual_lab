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
  NEOPIXEL_RING: Lib.NeopixelRing,
  STEPPER_MOTOR: Lib.StepperMotor,
  NEOPIXEL_PIXEL: Lib.NeopixelPixel,
  IR_RECEIVER: Lib.IrReceiver,
  IR_REMOTE: Lib.IrRemote,
  DS1307_RTC: Lib.Ds1307Rtc,
  MICROSD_MODULE: Lib.MicroSdModule,
  SHIFT_REGISTER: Lib.ShiftRegister,
  RELAY_MODULE: Lib.RelayModule,
  LED_MATRIX: Lib.LedMatrix8x8,
};

export const LIBRARY_TERMINAL_LAYOUTS = {
  BUZZER: [
    { id: "sig", x: 20, y: 82 },
    { id: "gnd", x: 56, y: 82 }
  ],
  LCD1602: ["vss","vdd","rs","e","d4","d5","d6","d7","led+","led-"].map((id, i) => ({ id, x: 9 + i*12, y: 100 })), // Note: y=100 from component
  LCD2004: ["vss","vdd","rs","e","d4","d5","d6","d7","led+","led-"].map((id, i) => ({ id, x: 9 + i*12, y: 100 })),
  OLED_SSD1306: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 15 + i*16, y: 95 })),
  ILI9341_TFT: ["vcc","gnd","cs","rst","dc","mosi","sck","led"].map((id, i) => ({ id, x: 10 + i*13, y: 142 })),
  DHT22: ["vcc","data","gnd"].map((id, i) => ({ id, x: 13 + i*20, y: 84 })),
  NTC_SENSOR: [
    { id: "t1", x: 15, y: 74 },
    { id: "t2", x: 35, y: 74 }
  ],
  PHOTORESISTOR: [
    { id: "l1", x: 15, y: 74 },
    { id: "l2", x: 35, y: 74 }
  ],
  PIR_SENSOR: ["vcc","out","gnd"].map((id, i) => ({ id, x: 14 + i*24, y: 84 })),
  MPU6050: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 10 + i*21, y: 60 })),
  HC_SR04: ["vcc","trig","echo","gnd"].map((id, i) => ({ id, x: 20 + i*23, y: 60 })),
  FLAME_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*16, y: 84 })),
  GAS_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*20, y: 94 })),
  HEARTBEAT_SENSOR: ["vcc","sig","gnd"].map((id, i) => ({ id, x: 12 + i*23, y: 84 })),
  SOUND_SENSOR: ["aout","dout","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*18, y: 84 })),
  HX711_LOAD_CELL: ["e+","e-","a+","a-","dt","sck","vcc","gnd"].map((id, i) => ({ id, x: 9 + i*11, y: 84 })),
  HX711_MODULE: ["e+","e-","a+","a-","dt","sck","vcc","gnd"].map((id, i) => ({ id, x: 9 + i*11, y: 84 })),
  MEMBRANE_KEYPAD: [1,2,3,4,5,6,7,8].map(i => ({ id: `p${i}`, x: 84, y: 15 + i*13 })),
  ROTARY_ENCODER: ["clk","dt","sw","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*11, y: 84 })),
  ANALOG_JOYSTICK: ["vrx","vry","sw","vcc","gnd"].map((id, i) => ({ id, x: 10 + i*16, y: 90 })),
  DIP_SWITCH_8: [
    ...[1,2,3,4,5,6,7,8].map(i => ({ id: i.toString(), x: 3 + i*11, y: 58 })),
    { id: "com", x: 105, y: 58 }
  ],
  SLIDE_SWITCH: [
    { id: "1", x: 12, y: 50 },
    { id: "2", x: 27, y: 50 },
    { id: "3", x: 43, y: 50 }
  ],
  NEOPIXEL_RING: ["5v","din","gnd"].map((id, i) => ({ id, x: 25 + i*20, y: 84 })),
  STEPPER_MOTOR: ["a+","a-","b+","b-"].map((id, i) => ({ id, x: 20 + i*16, y: 84 })),
  NEOPIXEL_PIXEL: ["5v","din","gnd"].map((id, i) => ({ id, x: 10 + i*15, y: 50 })),
  IR_RECEIVER: ["out","vcc","gnd"].map((id, i) => ({ id, x: 12 + i*13, y: 64 })),
  IR_REMOTE: [],
  DS1307_RTC: ["vcc","gnd","scl","sda"].map((id, i) => ({ id, x: 15 + i*20, y: 84 })),
  MICROSD_MODULE: ["vcc","gnd","miso","mosi","sck","cs"].map((id, i) => ({ id, x: 8 + i*13, y: 70 })),
  SHIFT_REGISTER: [
    ...["vcc","q0","ds","oe","stcp","shcp","mr","q7'"].map((id, i) => ({ id, x: 10, y: 15 + i*11 })),
    ...["q7","q6","q5","q4","q3","q2","q1","gnd"].map((id, i) => ({ id, x: 90, y: 15 + i*11 }))
  ],
  RELAY_MODULE: [
    ...["in","vcc","gnd"].map((id, i) => ({ id, x: 15 + i*16, y: 94 })),
    ...["com","no","nc"].map((id, i) => ({ id, x: 60 + i*12, y: 94 }))
  ],
  LED_MATRIX: [
    ...[0,1,2,3,4,5,6,7].map(i => ({ id: `c${i}`, x: 12 + i*9, y: 5 })),
    ...[0,1,2,3,4,5,6,7].map(i => ({ id: `r${i}`, x: 12 + i*9, y: 85 }))
  ]
};
