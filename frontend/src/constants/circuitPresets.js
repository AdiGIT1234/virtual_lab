export const CIRCUIT_PRESETS = {
  blink: {
    id: "blink",
    name: "Blink LED",
    description: "Classic Arduino Uno blink on digital pin 13 with series resistor.",
    mcu: "atmega328p",
    starterCode: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}`,
    workspace: [
      { id: "led-1",  type: "LED_RED",      pin: 13, pins: { main: 13 }, x: 380, y: 240 },
      { id: "res-1",  type: "RESISTOR",      pin: 13, pins: { main: 13 }, resistance: 330, x: 240, y: 240 },
      { id: "gnd-1",  type: "GROUND_NODE",   pin: null, pins: { main: null }, x: 480, y: 360 },
    ],
    wires: [
      { id: "blink-w1", source: "mcu::13",   target: "res-1::t1",   bends: [], color: "#fbbf24" },
      { id: "blink-w2", source: "res-1::t2", target: "led-1::main", bends: [], color: "#ff4444" },
      { id: "blink-w3", source: "led-1::main", target: "gnd-1::main", bends: [], color: "#333" },
    ],
    outputs: { 13: 1 },
    arlabPositions: {
      "res-1": { pos: [0.175, 0.085, -0.065], rot: [0, 0, 0] },
      "led-1": { pos: [0.675, 0.10, 0],       rot: [0, 0, 0] },
      "gnd-1": { pos: [0.875, 0.01, 0.24],    rot: [0, 0, 0] },
    },
  },

  button_led: {
    id: "button_led",
    name: "Interactive Button + LED",
    description: "Pressing the button on pin 2 lights up the LED on pin 13.",
    mcu: "atmega328p",
    starterCode: `void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  if (digitalRead(2) == LOW) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
}`,
    workspace: [
      { id: "btn-1",  type: "BUTTON",        pin: 2,  pins: { main: 2  }, x: 120, y: 240 },
      { id: "led-1",  type: "LED_RED",        pin: 13, pins: { main: 13 }, x: 380, y: 240 },
      { id: "res-1",  type: "RESISTOR",       pin: 13, pins: { main: 13 }, resistance: 330, x: 240, y: 240 },
      { id: "gnd-1",  type: "GROUND_NODE",    pin: null, pins: { main: null }, x: 480, y: 360 },
    ],
    wires: [
      { id: "btnled-w1", source: "mcu::2",    target: "btn-1::main",  bends: [], color: "#4dabf7" },
      { id: "btnled-w2", source: "mcu::13",   target: "res-1::t1",    bends: [], color: "#fbbf24" },
      { id: "btnled-w3", source: "res-1::t2", target: "led-1::main",  bends: [], color: "#ff4444" },
      { id: "btnled-w4", source: "led-1::main", target: "gnd-1::main", bends: [], color: "#333" },
    ],
    outputs: { 13: 0 },
    inputs:  { 2: 0 },
    arlabPositions: {
      "btn-1": { pos: [-0.175, 0.085, 0],      rot: [0, 0, 0] },
      "led-1": { pos: [0.675,  0.10,  0],      rot: [0, 0, 0] },
      "res-1": { pos: [0.275,  0.085, -0.065], rot: [0, 0, 0] },
      "gnd-1": { pos: [0.875,  0.01,  0.24],   rot: [0, 0, 0] },
    },
  },

  servo_sweep: {
    id: "servo_sweep",
    name: "Servo Sweep",
    description: "A standard hobby servo connected to PWM capable pin 9, sweeping back and forth.",
    mcu: "atmega328p",
    starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
}

void loop() {
  for (int pos = 0; pos <= 180; pos++) {
    myServo.write(pos);
    delay(15);
  }
  for (int pos = 180; pos >= 0; pos--) {
    myServo.write(pos);
    delay(15);
  }
}`,
    workspace: [
      { id: "srv-1",  type: "SERVO",       pin: 9,  pins: { main: 9  }, x: 320, y: 200 },
      { id: "vcc-1",  type: "VCC_NODE",    pin: null, pins: { main: null }, x: 180, y: 130 },
      { id: "gnd-1",  type: "GROUND_NODE", pin: null, pins: { main: null }, x: 180, y: 300 },
    ],
    wires: [
      { id: "servo-w1", source: "mcu::9",    target: "srv-1::main",  bends: [], color: "#ff6600" },
      { id: "servo-w2", source: "vcc-1::main", target: "srv-1::main", bends: [], color: "#dc2626" },
    ],
    outputs: { 9: 0.5 },
    arlabPositions: {
      "srv-1": { pos: [0.575, 0.085, 0],    rot: [0, Math.PI/2, 0] },
      "vcc-1": { pos: [0.0,   0.01, -0.24], rot: [0, 0, 0] },
      "gnd-1": { pos: [0.0,   0.01,  0.24], rot: [0, 0, 0] },
    },
  },

  timer_555_blink: {
    id: "timer_555_blink",
    name: "555 Timer LED Blinker",
    description: "A classic NE555 astable oscillator driving an LED with timing capacitors.",
    mcu: "atmega328p",
    starterCode: `// 555 Timer Astable Circuit — no MCU code required.
// The NE555 oscillates autonomously at ~1 Hz with:
//   Ra = 47 kΩ, Rb = 10 kΩ, C = 10 µF
// f ≈ 1.44 / ((Ra + 2*Rb) * C) ≈ 1.07 Hz

void setup() {}
void loop() {}`,
    workspace: [
      { id: "ic-555",       type: "TIMER_555",  pin: 3,  pins: { main: 3  }, x: 240, y: 200 },
      { id: "led-timer",    type: "LED_RED",     pin: 3,  pins: { main: 3  }, x: 400, y: 200 },
      { id: "res-timing",   type: "RESISTOR",    pin: 7,  pins: { main: 7  }, resistance: 10000, x: 160, y: 130 },
      { id: "cap-timing",   type: "CAPACITOR",   pin: 6,  pins: { main: 6  }, x: 160, y: 290, metadata: { capacitance: 10, unit: "µF" } },
      { id: "res-discharge",type: "RESISTOR",    pin: 7,  pins: { main: 7  }, resistance: 47000, x: 80,  y: 200 },
      { id: "vcc-timer",    type: "VCC_NODE",    pin: null, pins: { main: null }, x: 80, y: 80  },
      { id: "gnd-timer",    type: "GROUND_NODE", pin: null, pins: { main: null }, x: 80, y: 380 },
    ],
    wires: [
      { id: "t555-w1", source: "ic-555::out",      target: "led-timer::main",   bends: [], color: "#fbbf24" },
      { id: "t555-w2", source: "ic-555::vcc",      target: "vcc-timer::main",   bends: [], color: "#dc2626" },
      { id: "t555-w3", source: "ic-555::gnd",      target: "gnd-timer::main",   bends: [], color: "#333"    },
      { id: "t555-w4", source: "ic-555::disch",    target: "res-discharge::t1", bends: [], color: "#888"    },
      { id: "t555-w5", source: "res-discharge::t2", target: "res-timing::t1",   bends: [], color: "#888"    },
      { id: "t555-w6", source: "res-timing::t2",   target: "vcc-timer::main",   bends: [], color: "#dc2626" },
      { id: "t555-w7", source: "ic-555::thres",    target: "cap-timing::t1",    bends: [], color: "#888"    },
      { id: "t555-w8", source: "ic-555::trig",     target: "cap-timing::t1",    bends: [], color: "#888"    },
      { id: "t555-w9", source: "cap-timing::t2",   target: "gnd-timer::main",   bends: [], color: "#333"    },
    ],
    outputs: { 3: 1 },
    arlabPositions: {
      "ic-555":        { pos: [0.475, 0.085, 0],      rot: [0, 0, 0] },
      "led-timer":     { pos: [0.875, 0.10,  0],      rot: [0, 0, 0] },
      "res-timing":    { pos: [0.175, 0.085, -0.115], rot: [0, 0, 0] },
      "cap-timing":    { pos: [0.175, 0.085,  0.115], rot: [0, 0, 0] },
      "res-discharge": { pos: [0.075, 0.085, -0.065], rot: [0, 0, 0] },
      "vcc-timer":     { pos: [0.0,   0.01,  -0.24],  rot: [0, 0, 0] },
      "gnd-timer":     { pos: [0.0,   0.01,   0.24],  rot: [0, 0, 0] },
    },
  },

  npn_switch: {
    id: "npn_switch",
    name: "NPN Transistor Switch",
    description: "An NPN BJT used as a digital switch: MCU pin 9 drives the base, collector powers the LED.",
    mcu: "atmega328p",
    starterCode: `void setup() {
  pinMode(9, OUTPUT);
}

void loop() {
  digitalWrite(9, HIGH);   // Transistor on — LED lights
  delay(1000);
  digitalWrite(9, LOW);    // Transistor off — LED off
  delay(1000);
}`,
    workspace: [
      { id: "q1",            type: "NPN_TRANSISTOR", pin: 9,   pins: { main: 9   }, x: 260, y: 220 },
      { id: "led-q",         type: "LED_GREEN",       pin: null, pins: { main: null }, x: 380, y: 150 },
      { id: "res-base",      type: "RESISTOR",        pin: 9,   pins: { main: 9   }, resistance: 1000, x: 150, y: 220 },
      { id: "res-collector", type: "RESISTOR",        pin: null, pins: { main: null }, resistance: 330, x: 380, y: 220 },
      { id: "vcc-q",         type: "VCC_NODE",        pin: null, pins: { main: null }, x: 80, y: 100 },
      { id: "gnd-q",         type: "GROUND_NODE",     pin: null, pins: { main: null }, x: 260, y: 360 },
    ],
    wires: [
      { id: "npn-w1", source: "mcu::9",              target: "res-base::t1",      bends: [], color: "#4dabf7" },
      { id: "npn-w2", source: "res-base::t2",         target: "q1::b",             bends: [], color: "#4dabf7" },
      { id: "npn-w3", source: "q1::c",                target: "res-collector::t1", bends: [], color: "#ff4444" },
      { id: "npn-w4", source: "res-collector::t2",    target: "led-q::main",       bends: [], color: "#ff4444" },
      { id: "npn-w5", source: "led-q::main",          target: "vcc-q::main",       bends: [], color: "#dc2626" },
      { id: "npn-w6", source: "q1::e",                target: "gnd-q::main",       bends: [], color: "#333"    },
    ],
    outputs: { 9: 0 },
    arlabPositions: {
      "q1":            { pos: [0.375, 0.085, 0],       rot: [0, 0, 0] },
      "led-q":         { pos: [0.725, 0.10,  0],       rot: [0, 0, 0] },
      "res-base":      { pos: [0.175, 0.085, -0.065],  rot: [0, 0, 0] },
      "res-collector": { pos: [0.575, 0.085, -0.115],  rot: [0, 0, 0] },
      "vcc-q":         { pos: [0.0,   0.01,  -0.24],   rot: [0, 0, 0] },
      "gnd-q":         { pos: [0.0,   0.01,   0.24],   rot: [0, 0, 0] },
    },
  },

  buzzer_alarm: {
    id: "buzzer_alarm",
    name: "Buzzer Alarm",
    description: "A piezo buzzer connected to pin 11 with a button trigger on pin 4.",
    mcu: "atmega328p",
    starterCode: `void setup() {
  pinMode(4, INPUT_PULLUP);
  pinMode(11, OUTPUT);
}

void loop() {
  if (digitalRead(4) == LOW) {
    tone(11, 1000);    // 1 kHz alarm
  } else {
    noTone(11);
  }
}`,
    workspace: [
      { id: "buzz-1",   type: "BUZZER",       pin: 11, pins: { main: 11 }, x: 340, y: 200 },
      { id: "btn-alarm",type: "BUTTON",        pin: 4,  pins: { main: 4  }, x: 140, y: 200 },
      { id: "res-buzz", type: "RESISTOR",      pin: 11, pins: { main: 11 }, resistance: 100, x: 240, y: 200 },
      { id: "gnd-buzz", type: "GROUND_NODE",   pin: null, pins: { main: null }, x: 440, y: 320 },
    ],
    wires: [
      { id: "buzz-w1", source: "mcu::4",       target: "btn-alarm::main", bends: [], color: "#4dabf7" },
      { id: "buzz-w2", source: "mcu::11",      target: "res-buzz::t1",    bends: [], color: "#fbbf24" },
      { id: "buzz-w3", source: "res-buzz::t2", target: "buzz-1::sig",     bends: [], color: "#fbbf24" },
      { id: "buzz-w4", source: "buzz-1::gnd",  target: "gnd-buzz::main",  bends: [], color: "#333"    },
    ],
    outputs: { 11: 0 },
    inputs:  { 4: 0 },
    arlabPositions: {
      "buzz-1":    { pos: [0.675, 0.085, 0],      rot: [0, 0, 0] },
      "btn-alarm": { pos: [-0.175, 0.085, 0],     rot: [0, 0, 0] },
      "res-buzz":  { pos: [0.375, 0.085, -0.065], rot: [0, 0, 0] },
      "gnd-buzz":  { pos: [0.875, 0.01,  0.24],   rot: [0, 0, 0] },
    },
  },

  // ── ESP32 / Gold Standard Presets ─────────────────────────────────────────

  smart_oled_weather: {
    id: "smart_oled_weather",
    name: "Smart OLED Weather Station",
    description: "ESP32 reads temperature & humidity from a DHT22 and displays live readings on a 128×64 OLED over I2C.",
    mcu: "esp32",
    starterCode: `#include <Wire.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// DHT22 on GPIO4 (simulated via analogRead)
#define DHT_PIN 4
float temperature = 0.0;
float humidity = 0.0;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  Serial.println("Weather Station Ready");
}

void loop() {
  // Simulate sensor readings via analog inputs
  int rawTemp = analogRead(34);
  int rawHum  = analogRead(35);
  temperature = (rawTemp / 4095.0) * 50.0;  // 0–50 °C
  humidity    = (rawHum  / 4095.0) * 100.0; // 0–100 %RH

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("== Weather Station ==");
  display.setCursor(0, 18);
  display.print("Temp:  ");
  display.print(temperature, 1);
  display.println(" C");
  display.setCursor(0, 34);
  display.print("Humid: ");
  display.print(humidity, 1);
  display.println(" %");
  display.display();

  Serial.print("T="); Serial.print(temperature); Serial.print(" H="); Serial.println(humidity);
  delay(1000);
}`,
    workspace: [
      { id: "oled-1", type: "OLED_SSD1306", pin: 21, pins: { SCL: 22, SDA: 21 }, x: 360, y: 160 },
      { id: "dht-1",  type: "DHT22",        pin: 4,  pins: { DATA: 4 },           x: 160, y: 160 },
      { id: "vcc-1",  type: "VCC_NODE",     pin: null, pins: { main: null },       x: 80,  y: 80  },
      { id: "gnd-1",  type: "GROUND_NODE",  pin: null, pins: { main: null },       x: 80,  y: 340 },
    ],
    wires: [
      { id: "oled-w1", source: "mcu::22",    target: "oled-1::scl",  bends: [], color: "#4dabf7" },
      { id: "oled-w2", source: "mcu::21",    target: "oled-1::sda",  bends: [], color: "#fbbf24" },
      { id: "oled-w3", source: "mcu::4",     target: "dht-1::data",  bends: [], color: "#22d3ee" },
      { id: "oled-w4", source: "vcc-1::main", target: "oled-1::vcc", bends: [], color: "#dc2626" },
      { id: "oled-w5", source: "gnd-1::main", target: "oled-1::gnd", bends: [], color: "#333"    },
      { id: "oled-w6", source: "vcc-1::main", target: "dht-1::vcc",  bends: [], color: "#dc2626" },
      { id: "oled-w7", source: "gnd-1::main", target: "dht-1::gnd",  bends: [], color: "#333"    },
    ],
    outputs: {},
    inputs: { 34: 0.5, 35: 0.6 },
    arlabPositions: {
      "oled-1": { pos: [0.475, 0.085, 0],     rot: [0, 0, 0] },
      "dht-1":  { pos: [-0.175, 0.085, 0],    rot: [0, 0, 0] },
      "vcc-1":  { pos: [0.0,   0.01, -0.24],  rot: [0, 0, 0] },
      "gnd-1":  { pos: [0.0,   0.01,  0.24],  rot: [0, 0, 0] },
    },
  },

  piano_keyboard: {
    id: "piano_keyboard",
    name: "Piano Keyboard",
    description: "8 tactile buttons on an ATmega328P drive a piezo buzzer to play musical notes — press any key to hear a tone.",
    mcu: "atmega328p",
    starterCode: `#define BUZZER_PIN 11

// C4 to C5 note frequencies (Hz)
const int NOTE_FREQ[] = { 262, 294, 330, 349, 392, 440, 494, 523 };
const int BTN_PINS[]  = { 2, 3, 4, 5, 6, 7, 8, 9 };

void setup() {
  for (int i = 0; i < 8; i++) {
    pinMode(BTN_PINS[i], INPUT_PULLUP);
  }
  pinMode(BUZZER_PIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  bool anyPressed = false;
  for (int i = 0; i < 8; i++) {
    if (digitalRead(BTN_PINS[i]) == LOW) {
      tone(BUZZER_PIN, NOTE_FREQ[i], 150);
      Serial.print("Note: "); Serial.println(NOTE_FREQ[i]);
      anyPressed = true;
      delay(160);
      break;
    }
  }
  if (!anyPressed) {
    noTone(BUZZER_PIN);
  }
}`,
    workspace: [
      { id: "btn-0", type: "BUTTON", pin: 2,  pins: { main: 2  }, x: 80,  y: 220 },
      { id: "btn-1", type: "BUTTON", pin: 3,  pins: { main: 3  }, x: 130, y: 220 },
      { id: "btn-2", type: "BUTTON", pin: 4,  pins: { main: 4  }, x: 180, y: 220 },
      { id: "btn-3", type: "BUTTON", pin: 5,  pins: { main: 5  }, x: 230, y: 220 },
      { id: "btn-4", type: "BUTTON", pin: 6,  pins: { main: 6  }, x: 280, y: 220 },
      { id: "btn-5", type: "BUTTON", pin: 7,  pins: { main: 7  }, x: 330, y: 220 },
      { id: "btn-6", type: "BUTTON", pin: 8,  pins: { main: 8  }, x: 380, y: 220 },
      { id: "btn-7", type: "BUTTON", pin: 9,  pins: { main: 9  }, x: 430, y: 220 },
      { id: "buz-1", type: "BUZZER", pin: 11, pins: { main: 11 }, x: 260, y: 360 },
      { id: "gnd-1", type: "GROUND_NODE", pin: null, pins: { main: null }, x: 480, y: 360 },
    ],
    wires: [
      { id: "piano-w0",  source: "mcu::2",    target: "btn-0::main", bends: [], color: "#4dabf7" },
      { id: "piano-w1",  source: "mcu::3",    target: "btn-1::main", bends: [], color: "#4dabf7" },
      { id: "piano-w2",  source: "mcu::4",    target: "btn-2::main", bends: [], color: "#4dabf7" },
      { id: "piano-w3",  source: "mcu::5",    target: "btn-3::main", bends: [], color: "#4dabf7" },
      { id: "piano-w4",  source: "mcu::6",    target: "btn-4::main", bends: [], color: "#4dabf7" },
      { id: "piano-w5",  source: "mcu::7",    target: "btn-5::main", bends: [], color: "#4dabf7" },
      { id: "piano-w6",  source: "mcu::8",    target: "btn-6::main", bends: [], color: "#4dabf7" },
      { id: "piano-w7",  source: "mcu::9",    target: "btn-7::main", bends: [], color: "#4dabf7" },
      { id: "piano-w8",  source: "mcu::11",   target: "buz-1::sig",  bends: [], color: "#fbbf24" },
      { id: "piano-w9",  source: "buz-1::gnd", target: "gnd-1::main", bends: [], color: "#333"   },
    ],
    outputs: { 11: 0 },
    inputs:  { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    arlabPositions: {
      "btn-0": { pos: [-0.375, 0.085, 0], rot: [0, 0, 0] },
      "btn-1": { pos: [-0.325, 0.085, 0], rot: [0, 0, 0] },
      "btn-2": { pos: [-0.275, 0.085, 0], rot: [0, 0, 0] },
      "btn-3": { pos: [-0.225, 0.085, 0], rot: [0, 0, 0] },
      "btn-4": { pos: [-0.175, 0.085, 0], rot: [0, 0, 0] },
      "btn-5": { pos: [-0.125, 0.085, 0], rot: [0, 0, 0] },
      "btn-6": { pos: [-0.075, 0.085, 0], rot: [0, 0, 0] },
      "btn-7": { pos: [-0.025, 0.085, 0], rot: [0, 0, 0] },
      "buz-1": { pos: [0.425,  0.085, 0], rot: [0, 0, 0] },
      "gnd-1": { pos: [0.875,  0.01,  0.24], rot: [0, 0, 0] },
    },
  },

  industrial_dashboard: {
    id: "industrial_dashboard",
    name: "Industrial Dashboard",
    description: "ESP32 reads a potentiometer and displays a live gauge on an ILI9341 TFT — showcasing color fills, text, and real-time updates.",
    mcu: "esp32",
    starterCode: `#include <SPI.h>
#include <Adafruit_ILI9341.h>

#define TFT_CS  5
#define TFT_DC  2
#define TFT_RST 4
Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

#define POT_PIN 34

int lastBarWidth = 0;

void drawGaugeLabel(const char* label, int value) {
  tft.fillRect(0, 100, 240, 60, ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 110);
  tft.print(label);
  tft.setCursor(120, 110);
  tft.print(value);
  tft.print("%");
}

void setup() {
  Serial.begin(115200);
  tft.begin();
  tft.setRotation(1);
  tft.fillScreen(ILI9341_BLACK);

  tft.setTextColor(ILI9341_CYAN);
  tft.setTextSize(3);
  tft.setCursor(20, 20);
  tft.println("INDUSTRIAL");
  tft.setCursor(30, 55);
  tft.println("DASHBOARD");

  tft.drawRect(10, 170, 220, 30, ILI9341_WHITE);
}

void loop() {
  int raw   = analogRead(POT_PIN);
  int pct   = raw * 100 / 4095;
  int barW  = (raw * 216) / 4095;

  if (barW != lastBarWidth) {
    tft.fillRect(12, 172, 216, 26, ILI9341_BLACK);
    uint16_t barColor = pct < 33 ? ILI9341_GREEN : (pct < 66 ? ILI9341_YELLOW : ILI9341_RED);
    tft.fillRect(12, 172, barW, 26, barColor);
    drawGaugeLabel("Load:", pct);
    lastBarWidth = barW;
    Serial.print("Load: "); Serial.print(pct); Serial.println("%");
  }
  delay(50);
}`,
    workspace: [
      { id: "tft-1", type: "ILI9341_TFT", pin: 5,  pins: { CS: 5, DC: 2, RESET: 4, MOSI: 23, SCK: 18 }, x: 340, y: 160 },
      { id: "pot-1", type: "DIAL",         pin: 34, pins: { main: 34 },                                   x: 140, y: 200 },
      { id: "vcc-1", type: "VCC_NODE",     pin: null, pins: { main: null },                                x: 80,  y: 80  },
      { id: "gnd-1", type: "GROUND_NODE",  pin: null, pins: { main: null },                                x: 80,  y: 340 },
    ],
    wires: [
      { id: "dash-w1", source: "mcu::5",    target: "tft-1::cs",    bends: [], color: "#4dabf7" },
      { id: "dash-w2", source: "mcu::2",    target: "tft-1::dc",    bends: [], color: "#22d3ee" },
      { id: "dash-w3", source: "mcu::4",    target: "tft-1::rst",   bends: [], color: "#fbbf24" },
      { id: "dash-w4", source: "mcu::23",   target: "tft-1::mosi",  bends: [], color: "#ff6600" },
      { id: "dash-w5", source: "mcu::18",   target: "tft-1::sck",   bends: [], color: "#ff6600" },
      { id: "dash-w6", source: "mcu::34",   target: "pot-1::main",  bends: [], color: "#888"    },
      { id: "dash-w7", source: "vcc-1::main", target: "tft-1::vcc", bends: [], color: "#dc2626" },
      { id: "dash-w8", source: "gnd-1::main", target: "tft-1::gnd", bends: [], color: "#333"    },
    ],
    outputs: {},
    inputs: { 34: 0.5 },
    arlabPositions: {
      "tft-1": { pos: [0.475, 0.085, 0],     rot: [0, 0, 0] },
      "pot-1": { pos: [-0.175, 0.085, 0],    rot: [0, 0, 0] },
      "vcc-1": { pos: [0.0,   0.01, -0.24],  rot: [0, 0, 0] },
      "gnd-1": { pos: [0.0,   0.01,  0.24],  rot: [0, 0, 0] },
    },
  },

  max30102_heartrate: {
    id: "max30102_heartrate",
    name: "Heart Rate Monitor (MAX30102)",
    description: "ATmega328P reads BPM and SpO2 from a MAX30102 pulse oximeter over I2C (Wire) and prints live readings to Serial.",
    mcu: "atmega328p",
    starterCode: `#include <Wire.h>

#define MAX30102_ADDR 0x57
#define REG_INTR_ENABLE1 0x02
#define REG_FIFO_CONFIG  0x08
#define REG_MODE_CONFIG  0x09
#define REG_SPO2_CONFIG  0x0A
#define REG_LED1_PA      0x0C
#define REG_LED2_PA      0x0D
#define REG_FIFO_DATA    0x07

void writeReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MAX30102_ADDR);
  Wire.write(reg); Wire.write(val);
  Wire.endTransmission();
}

uint32_t readFifoSample(bool readRed) {
  Wire.beginTransmission(MAX30102_ADDR);
  Wire.write(REG_FIFO_DATA);
  Wire.endTransmission(false);
  Wire.requestFrom(MAX30102_ADDR, 6);
  uint32_t r = 0, ir = 0;
  for (int i = 0; i < 3; i++) r  = (r  << 8) | Wire.read();
  for (int i = 0; i < 3; i++) ir = (ir << 8) | Wire.read();
  return readRed ? r : ir;
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  writeReg(REG_MODE_CONFIG,  0x03); // SpO2 mode
  writeReg(REG_SPO2_CONFIG,  0x27); // 100 sps, 411us pulse, 16-bit ADC
  writeReg(REG_LED1_PA,      0x24); // Red LED ~7 mA
  writeReg(REG_LED2_PA,      0x24); // IR  LED ~7 mA
  writeReg(REG_FIFO_CONFIG,  0x4F); // FIFO average 4, rollover, FIFO almost full=15
  Serial.println("MAX30102 Heart Rate + SpO2 Monitor");
}

void loop() {
  uint32_t ir  = readFifoSample(false);
  uint32_t red = readFifoSample(true);

  // Simple threshold check: finger present if IR > 50000
  if (ir > 50000) {
    // Estimate BPM and SpO2 from raw values (simplified)
    int bpm  = map(constrain(ir, 50000, 110000), 50000, 110000, 55, 105);
    int spo2 = map(constrain(red, 30000, 90000), 30000, 90000, 94, 100);
    Serial.print("BPM: "); Serial.print(bpm);
    Serial.print("  SpO2: "); Serial.print(spo2); Serial.println("%");
  } else {
    Serial.println("No finger detected");
  }
  delay(500);
}`,
    workspace: [
      { id: "max-1", type: "MAX30102_PULSE", pin: 18, pins: { SDA: 18, SCL: 19 }, x: 340, y: 200 },
      { id: "vcc-1", type: "VCC_NODE",     pin: null, pins: { main: null },       x: 80,  y: 80  },
      { id: "gnd-1", type: "GROUND_NODE",  pin: null, pins: { main: null },       x: 80,  y: 360 },
    ],
    wires: [
      { id: "max-w1", source: "mcu::18",     target: "max-1::sda",   bends: [], color: "#fbbf24" },
      { id: "max-w2", source: "mcu::19",     target: "max-1::scl",   bends: [], color: "#4dabf7" },
      { id: "max-w3", source: "vcc-1::main", target: "max-1::vcc",   bends: [], color: "#dc2626" },
      { id: "max-w4", source: "gnd-1::main", target: "max-1::gnd",   bends: [], color: "#333"    },
    ],
    outputs: {},
    inputs: {},
    arlabPositions: {
      "max-1": { pos: [0.35, 0.085, 0],     rot: [0, 0, 0] },
      "vcc-1": { pos: [0.55, 0.01, -0.16],  rot: [0, 0, 0] },
      "gnd-1": { pos: [0.55, 0.01,  0.16],  rot: [0, 0, 0] },
    },
  },

  tcs34725_color: {
    id: "tcs34725_color",
    name: "Color Sensor (TCS34725)",
    description: "ATmega328P reads RGBC values from a TCS34725 over I2C and prints hex color codes to Serial.",
    mcu: "atmega328p",
    starterCode: `#include <Wire.h>

#define TCS34725_ADDR  0x29
#define CMD_BIT        0x80
#define REG_ENABLE     0x00
#define REG_ID         0x12
#define REG_STATUS     0x13
#define REG_CDATAL     0x14

void writeReg(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(TCS34725_ADDR);
  Wire.write(CMD_BIT | reg); Wire.write(val);
  Wire.endTransmission();
}

uint16_t readWord(uint8_t reg) {
  Wire.beginTransmission(TCS34725_ADDR);
  Wire.write(CMD_BIT | reg);
  Wire.endTransmission(false);
  Wire.requestFrom(TCS34725_ADDR, 2);
  uint16_t lo = Wire.read();
  uint16_t hi = Wire.read();
  return (hi << 8) | lo;
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  writeReg(REG_ENABLE, 0x03); // PON + AEN
  delay(50);
  Serial.println("TCS34725 Color Sensor Ready");
}

void loop() {
  uint16_t c = readWord(REG_CDATAL);
  uint16_t r = readWord(0x16);
  uint16_t g = readWord(0x18);
  uint16_t b = readWord(0x1A);

  // Scale to 0-255
  uint8_t R8 = c > 0 ? (uint8_t)((uint32_t)r * 255 / c) : 0;
  uint8_t G8 = c > 0 ? (uint8_t)((uint32_t)g * 255 / c) : 0;
  uint8_t B8 = c > 0 ? (uint8_t)((uint32_t)b * 255 / c) : 0;

  Serial.print("R="); Serial.print(R8);
  Serial.print(" G="); Serial.print(G8);
  Serial.print(" B="); Serial.print(B8);
  Serial.print("  #");
  if (R8 < 16) Serial.print("0"); Serial.print(R8, HEX);
  if (G8 < 16) Serial.print("0"); Serial.print(G8, HEX);
  if (B8 < 16) Serial.print("0"); Serial.println(B8, HEX);
  delay(500);
}`,
    workspace: [
      { id: "tcs-1", type: "TCS34725_COLOR", pin: 18, pins: { SDA: 18, SCL: 19 }, x: 340, y: 200 },
      { id: "vcc-1", type: "VCC_NODE",     pin: null, pins: { main: null },       x: 80,  y: 80  },
      { id: "gnd-1", type: "GROUND_NODE",  pin: null, pins: { main: null },       x: 80,  y: 360 },
    ],
    wires: [
      { id: "tcs-w1", source: "mcu::18",     target: "tcs-1::sda",   bends: [], color: "#fbbf24" },
      { id: "tcs-w2", source: "mcu::19",     target: "tcs-1::scl",   bends: [], color: "#4dabf7" },
      { id: "tcs-w3", source: "vcc-1::main", target: "tcs-1::vcc",   bends: [], color: "#dc2626" },
      { id: "tcs-w4", source: "gnd-1::main", target: "tcs-1::gnd",   bends: [], color: "#333"    },
    ],
    outputs: {},
    inputs: {},
    arlabPositions: {
      "tcs-1": { pos: [0.35, 0.085, 0],     rot: [0, 0, 0] },
      "vcc-1": { pos: [0.55, 0.01, -0.16],  rot: [0, 0, 0] },
      "gnd-1": { pos: [0.55, 0.01,  0.16],  rot: [0, 0, 0] },
    },
  },

  hc05_bluetooth: {
    id: "hc05_bluetooth",
    name: "Bluetooth Terminal (HC-05)",
    description: "ATmega328P echoes Serial data through an HC-05 Bluetooth module — type in the panel to send to the MCU, watch its replies.",
    mcu: "atmega328p",
    starterCode: `// HC-05 uses hardware Serial (pins 0=RX, 1=TX) at 9600 baud
// In this simulation, the HC-05 panel relays serial bytes directly.

String inputBuffer = "";

void setup() {
  Serial.begin(9600);
  Serial.println("Bluetooth Terminal Ready");
  Serial.println("Type a message and press Enter...");
}

void loop() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\\n') {
      Serial.print("Echo: ");
      Serial.println(inputBuffer);
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }
}`,
    workspace: [
      { id: "bt-1",  type: "HC05_BLUETOOTH", pin: 1,   pins: { TXD: 1, RXD: 0 },  x: 340, y: 200 },
      { id: "vcc-1", type: "VCC_NODE",        pin: null, pins: { main: null },      x: 80,  y: 80  },
      { id: "gnd-1", type: "GROUND_NODE",     pin: null, pins: { main: null },      x: 80,  y: 360 },
    ],
    wires: [
      { id: "bt-w1", source: "mcu::1",      target: "bt-1::rxd",    bends: [], color: "#22d3ee" },
      { id: "bt-w2", source: "mcu::0",      target: "bt-1::txd",    bends: [], color: "#fbbf24" },
      { id: "bt-w3", source: "vcc-1::main", target: "bt-1::vcc",    bends: [], color: "#dc2626" },
      { id: "bt-w4", source: "gnd-1::main", target: "bt-1::gnd",    bends: [], color: "#333"    },
    ],
    outputs: {},
    inputs: {},
    arlabPositions: {
      "bt-1":  { pos: [0.35, 0.085, 0],    rot: [0, 0, 0] },
      "vcc-1": { pos: [0.55, 0.01, -0.16], rot: [0, 0, 0] },
      "gnd-1": { pos: [0.55, 0.01,  0.16], rot: [0, 0, 0] },
    },
  },

  seven_seg_counter: {
    id: "seven_seg_counter",
    name: "7-Segment Counter",
    description: "ATmega328P counts 0–9 on a common-cathode 7-segment display, cycling every 800 ms.",
    mcu: "atmega328p",
    starterCode: `// Common-cathode 7-segment: HIGH = segment ON
// Pins: a=2 b=3 c=4 d=5 e=6 f=7 g=8
const byte SEGS[10][7] = {
  {1,1,1,1,1,1,0}, // 0
  {0,1,1,0,0,0,0}, // 1
  {1,1,0,1,1,0,1}, // 2
  {1,1,1,1,0,0,1}, // 3
  {0,1,1,0,0,1,1}, // 4
  {1,0,1,1,0,1,1}, // 5
  {1,0,1,1,1,1,1}, // 6
  {1,1,1,0,0,0,0}, // 7
  {1,1,1,1,1,1,1}, // 8
  {1,1,1,1,0,1,1}, // 9
};
const int PINS[7] = {2, 3, 4, 5, 6, 7, 8};
int digit = 0;

void setup() {
  for (int i = 0; i < 7; i++) pinMode(PINS[i], OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int s = 0; s < 7; s++) digitalWrite(PINS[s], SEGS[digit][s]);
  Serial.print("Digit: "); Serial.println(digit);
  digit = (digit + 1) % 10;
  delay(800);
}`,
    workspace: [
      { id: "seg-1", type: "SEVEN_SEG", pin: 2, pins: { a:2, b:3, c:4, d:5, e:6, f:7, g:8 }, x: 300, y: 200 },
      { id: "gnd-1", type: "GROUND_NODE", pin: null, pins: { main: null }, x: 480, y: 360 },
    ],
    wires: [
      { id: "seg-wa", source: "mcu::2", target: "seg-1::a", bends: [], color: "#ff4444" },
      { id: "seg-wb", source: "mcu::3", target: "seg-1::b", bends: [], color: "#fbbf24" },
      { id: "seg-wc", source: "mcu::4", target: "seg-1::c", bends: [], color: "#22c55e" },
      { id: "seg-wd", source: "mcu::5", target: "seg-1::d", bends: [], color: "#4dabf7" },
      { id: "seg-we", source: "mcu::6", target: "seg-1::e", bends: [], color: "#a78bfa" },
      { id: "seg-wf", source: "mcu::7", target: "seg-1::f", bends: [], color: "#f97316" },
      { id: "seg-wg", source: "mcu::8", target: "seg-1::g", bends: [], color: "#fb7185" },
    ],
    outputs: { 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0 },
    inputs: {},
    arlabPositions: {
      "seg-1": { pos: [0.35, 0.085, 0],   rot: [0, 0, 0] },
      "gnd-1": { pos: [0.60, 0.01, 0.20], rot: [0, 0, 0] },
    },
  },

  dc_motor_control: {
    id: "dc_motor_control",
    name: "DC Motor + L298N",
    description: "ATmega328P drives a DC motor via an L298N H-bridge — alternates forward/reverse at varying speeds.",
    mcu: "atmega328p",
    starterCode: `#define ENA 3   // PWM speed (pin 3 = OC2B)
#define IN1 4   // direction bit 1
#define IN2 5   // direction bit 2

void setup() {
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  Serial.begin(9600);
  Serial.println("DC Motor Control Ready");
}

void setMotor(int dir, int speed) {
  analogWrite(ENA, speed);
  if (dir > 0)      { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  }
  else if (dir < 0) { digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH); }
  else              { digitalWrite(IN1, LOW);   digitalWrite(IN2, LOW);  }
}

void loop() {
  Serial.println("Forward 75%");
  setMotor(1, 192);
  delay(2000);

  Serial.println("Stop");
  setMotor(0, 0);
  delay(500);

  Serial.println("Reverse 50%");
  setMotor(-1, 128);
  delay(2000);

  Serial.println("Stop");
  setMotor(0, 0);
  delay(500);

  Serial.println("Forward 100%");
  setMotor(1, 255);
  delay(1000);

  Serial.println("Brake");
  setMotor(0, 0);
  delay(1000);
}`,
    workspace: [
      { id: "l298-1", type: "L298N_DRIVER", pin: 3,  pins: { ena: 3, in1: 4, in2: 5, enb: null, in3: null, in4: null, vcc: null, gnd: null }, x: 280, y: 180 },
      { id: "mot-1",  type: "DC_MOTOR",     pin: null, pins: { "m+": null, "m-": null, ena: 3 }, x: 440, y: 200 },
      { id: "vcc-1",  type: "VCC_NODE",     pin: null, pins: { main: null }, x: 80, y: 80  },
      { id: "gnd-1",  type: "GROUND_NODE",  pin: null, pins: { main: null }, x: 80, y: 360 },
    ],
    wires: [
      { id: "mot-w1", source: "mcu::3",      target: "l298-1::ena",  bends: [], color: "#fbbf24" },
      { id: "mot-w2", source: "mcu::4",      target: "l298-1::in1",  bends: [], color: "#4dabf7" },
      { id: "mot-w3", source: "mcu::5",      target: "l298-1::in2",  bends: [], color: "#22d3ee" },
      { id: "mot-w4", source: "vcc-1::main", target: "l298-1::vcc",  bends: [], color: "#dc2626" },
      { id: "mot-w5", source: "gnd-1::main", target: "l298-1::gnd",  bends: [], color: "#333"    },
      { id: "mot-w6", source: "l298-1::out1", target: "mot-1::m+",   bends: [], color: "#ff4444" },
      { id: "mot-w7", source: "l298-1::out2", target: "mot-1::m-",   bends: [], color: "#111"    },
    ],
    outputs: { 3: 0, 4: 0, 5: 0 },
    inputs: {},
    arlabPositions: {
      "l298-1": { pos: [0.20, 0.085, 0],    rot: [0, 0, 0] },
      "mot-1":  { pos: [0.55, 0.085, 0],    rot: [0, 0, 0] },
      "vcc-1":  { pos: [0.0,  0.01, -0.20], rot: [0, 0, 0] },
      "gnd-1":  { pos: [0.0,  0.01,  0.20], rot: [0, 0, 0] },
    },
  },
};
