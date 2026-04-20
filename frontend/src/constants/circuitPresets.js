export const CIRCUIT_PRESETS = {
  blink: {
    id: "blink",
    name: "Blink LED",
    description: "Classic Arduino Uno blink on digital pin 13 with series resistor.",
    workspace: [
      {
        id: "led-1",
        type: "LED_RED",
        pin: 13,
        pins: { main: 13 },
        x: 220,
        y: 260,
      },
      {
        id: "res-1",
        type: "RESISTOR",
        pin: 13,
        pins: { main: 13 },
        resistance: 330,
        x: 140,
        y: 260,
      },
      {
        id: "gnd-1",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 80,
        y: 360,
      },
      {
        id: "vcc-1",
        type: "VCC_NODE",
        pin: 19,
        pins: { main: 19 },
        x: 80,
        y: 200,
      },
    ],
    outputs: {
      13: 1,
    },
  },
  button_led: {
    id: "button_led",
    name: "Interactive Button + LED",
    description: "Pressing the button on pin 2 lights up the LED on pin 13.",
    workspace: [
      {
        id: "btn-1",
        type: "BUTTON",
        pin: 2,
        pins: { main: 2 },
        x: 100,
        y: 200,
      },
      {
        id: "led-1",
        type: "LED_RED",
        pin: 13,
        pins: { main: 13 },
        x: 220,
        y: 260,
      },
      {
        id: "res-1",
        type: "RESISTOR",
        pin: 13,
        pins: { main: 13 },
        resistance: 330,
        x: 140,
        y: 260,
      },
      {
        id: "gnd-1",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 80,
        y: 360,
      },
    ],
    outputs: {
      13: 0,
    },
    inputs: {
      2: 0,
    },
  },
  servo_sweep: {
    id: "servo_sweep",
    name: "Servo Sweep",
    description: "A standard hobby servo connected to PWM capable pin 9, sweeping back and forth.",
    workspace: [
      {
        id: "srv-1",
        type: "SERVO",
        pin: 9,
        pins: { main: 9 },
        x: 200,
        y: 150,
      },
      {
        id: "vcc-1",
        type: "VCC_NODE",
        pin: 19,
        pins: { main: 19 },
        x: 150,
        y: 100,
      },
      {
        id: "gnd-1",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 150,
        y: 200,
      },
    ],
    outputs: {
      9: 0.5,
    },
  },
  timer_555_blink: {
    id: "timer_555_blink",
    name: "555 Timer LED Blinker",
    description: "A classic NE555 astable oscillator driving an LED with timing capacitors.",
    workspace: [
      {
        id: "ic-555",
        type: "TIMER_555",
        pin: 3,
        pins: { main: 3 },
        x: 180,
        y: 180,
      },
      {
        id: "led-timer",
        type: "LED_RED",
        pin: 3,
        pins: { main: 3 },
        x: 300,
        y: 180,
      },
      {
        id: "res-timing",
        type: "RESISTOR",
        pin: 7,
        pins: { main: 7 },
        resistance: 10000,
        x: 130,
        y: 120,
      },
      {
        id: "cap-timing",
        type: "CAPACITOR",
        pin: 6,
        pins: { main: 6 },
        x: 130,
        y: 260,
        metadata: { capacitance: 10, unit: "µF" },
      },
      {
        id: "res-discharge",
        type: "RESISTOR",
        pin: 7,
        pins: { main: 7 },
        resistance: 47000,
        x: 60,
        y: 180,
      },
      {
        id: "vcc-timer",
        type: "VCC_NODE",
        pin: 19,
        pins: { main: 19 },
        x: 60,
        y: 80,
      },
      {
        id: "gnd-timer",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 60,
        y: 350,
      },
    ],
    outputs: {
      3: 1,
    },
  },
  npn_switch: {
    id: "npn_switch",
    name: "NPN Transistor Switch",
    description: "An NPN BJT used as a digital switch: MCU pin 9 drives the base, collector powers the LED.",
    workspace: [
      {
        id: "q1",
        type: "NPN_TRANSISTOR",
        pin: 9,
        pins: { main: 9 },
        x: 180,
        y: 200,
      },
      {
        id: "led-q",
        type: "LED_GREEN",
        pin: null,
        pins: { main: null },
        x: 260,
        y: 140,
      },
      {
        id: "res-base",
        type: "RESISTOR",
        pin: 9,
        pins: { main: 9 },
        resistance: 1000,
        x: 100,
        y: 200,
      },
      {
        id: "res-collector",
        type: "RESISTOR",
        pin: null,
        pins: { main: null },
        resistance: 330,
        x: 260,
        y: 200,
      },
      {
        id: "vcc-q",
        type: "VCC_NODE",
        pin: 19,
        pins: { main: 19 },
        x: 60,
        y: 100,
      },
      {
        id: "gnd-q",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 180,
        y: 340,
      },
    ],
    outputs: {
      9: 0,
    },
  },
  buzzer_alarm: {
    id: "buzzer_alarm",
    name: "Buzzer Alarm",
    description: "A piezo buzzer connected to pin 11 with a button trigger on pin 4.",
    workspace: [
      {
        id: "buzz-1",
        type: "BUZZER",
        pin: 11,
        pins: { main: 11 },
        x: 220,
        y: 180,
      },
      {
        id: "btn-alarm",
        type: "BUTTON",
        pin: 4,
        pins: { main: 4 },
        x: 100,
        y: 180,
      },
      {
        id: "res-buzz",
        type: "RESISTOR",
        pin: 11,
        pins: { main: 11 },
        resistance: 100,
        x: 160,
        y: 180,
      },
      {
        id: "gnd-buzz",
        type: "GROUND_NODE",
        pin: 8,
        pins: { main: 8 },
        x: 80,
        y: 320,
      },
    ],
    outputs: {
      11: 0,
    },
    inputs: {
      4: 0,
    },
  },

  // ── Gold Standard Presets ─────────────────────────────────────────────────

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
      {
        id: "oled-1",
        type: "OLED_SSD1306",
        pin: 21,
        pins: { SCL: 22, SDA: 21 },
        x: 240,
        y: 160,
      },
      {
        id: "dht-1",
        type: "DHT22",
        pin: 4,
        pins: { DATA: 4 },
        x: 100,
        y: 160,
      },
      {
        id: "vcc-1",
        type: "VCC_NODE",
        pin: null,
        pins: { main: null },
        x: 60,
        y: 80,
      },
      {
        id: "gnd-1",
        type: "GROUND_NODE",
        pin: null,
        pins: { main: null },
        x: 60,
        y: 340,
      },
    ],
    outputs: {},
    inputs: { 34: 0.5, 35: 0.6 },
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
      { id: "btn-0", type: "BUTTON", pin: 2,  pins: { main: 2  }, x: 60,  y: 200 },
      { id: "btn-1", type: "BUTTON", pin: 3,  pins: { main: 3  }, x: 110, y: 200 },
      { id: "btn-2", type: "BUTTON", pin: 4,  pins: { main: 4  }, x: 160, y: 200 },
      { id: "btn-3", type: "BUTTON", pin: 5,  pins: { main: 5  }, x: 210, y: 200 },
      { id: "btn-4", type: "BUTTON", pin: 6,  pins: { main: 6  }, x: 260, y: 200 },
      { id: "btn-5", type: "BUTTON", pin: 7,  pins: { main: 7  }, x: 310, y: 200 },
      { id: "btn-6", type: "BUTTON", pin: 8,  pins: { main: 8  }, x: 360, y: 200 },
      { id: "btn-7", type: "BUTTON", pin: 9,  pins: { main: 9  }, x: 410, y: 200 },
      { id: "buz-1", type: "BUZZER", pin: 11, pins: { main: 11 }, x: 240, y: 320 },
      { id: "gnd-1", type: "GROUND_NODE", pin: 8, pins: { main: 8 }, x: 80, y: 380 },
    ],
    outputs: { 11: 0 },
    inputs:  { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
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
      {
        id: "tft-1",
        type: "ILI9341_TFT",
        pin: 5,
        pins: { CS: 5, DC: 2, RESET: 4, MOSI: 23, SCK: 18 },
        x: 240,
        y: 150,
      },
      {
        id: "pot-1",
        type: "DIAL",
        pin: 34,
        pins: { main: 34 },
        x: 100,
        y: 200,
      },
      {
        id: "vcc-1",
        type: "VCC_NODE",
        pin: null,
        pins: { main: null },
        x: 60,
        y: 80,
      },
      {
        id: "gnd-1",
        type: "GROUND_NODE",
        pin: null,
        pins: { main: null },
        x: 60,
        y: 340,
      },
    ],
    outputs: {},
    inputs: { 34: 0.5 },
  },
};
