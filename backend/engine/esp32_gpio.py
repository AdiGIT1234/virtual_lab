"""
ESP32 GPIO simulation engine.

Unlike the ATmega328P which uses port-based registers (PORTB/C/D),
the ESP32 uses a flat GPIO array (GPIO 0-39). This class models the
ESP32-WROOM-32 DevKit V1 (30-pin) variant.

Key differences from ATmega GPIO:
  - Flat GPIO numbering (0-39) instead of port-based
  - 3.3V logic (not 5V)
  - 12-bit ADC (0-4095) instead of 10-bit
  - LEDC PWM controller (16 channels) instead of timer-based analogWrite
  - DAC output on GPIO25 and GPIO26
  - Touch sensing on 10 pins
  - Input-only pins: GPIO 34, 35, 36, 39
  - Flash SPI pins: GPIO 6-11 (unusable)
"""


class ESP32GPIO:
    """Minimal simulation of ESP32 GPIO for the Virtual Lab sandbox."""

    # Total GPIO count on ESP32
    GPIO_COUNT = 40

    # Pins that are input-only (no output driver, no pull-ups)
    INPUT_ONLY_PINS = frozenset({34, 35, 36, 39})

    # Pins connected to internal SPI flash — do not use
    FLASH_SPI_PINS = frozenset({6, 7, 8, 9, 10, 11})

    # Strapping pins — affect boot mode
    STRAPPING_PINS = frozenset({0, 2, 5, 12, 15})

    # ADC1 channels (work alongside WiFi)
    ADC1_PINS = {32: 4, 33: 5, 34: 6, 35: 7, 36: 0, 39: 3}

    # ADC2 channels (disabled when WiFi active)
    ADC2_PINS = {0: 1, 2: 2, 4: 0, 12: 5, 13: 4, 14: 6, 15: 3, 25: 8, 26: 9, 27: 7}

    # DAC pins
    DAC_PINS = {25: 1, 26: 2}  # gpio: dac_channel

    # Touch-capable pins
    TOUCH_PINS = frozenset({0, 2, 4, 12, 13, 14, 15, 27, 32, 33})

    # All GPIO pins exposed on 30-pin DevKit V1
    DEVKIT_PINS = frozenset({
        0, 1, 2, 3, 4, 5,
        12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 23, 25, 26, 27,
        32, 33, 34, 35, 36, 39
    })

    def __init__(self, clock=None):
        self.clock = clock

        # Direction: 0=INPUT, 1=OUTPUT for each GPIO
        self.DDR = [0] * self.GPIO_COUNT

        # Output register (what code writes)
        self.PORT = [0] * self.GPIO_COUNT

        # Input register (external signals / reads)
        self.PIN = [0] * self.GPIO_COUNT

        # Analog-to-Digital values (12-bit: 0-4095)
        self.ADC_VALUES = [0] * self.GPIO_COUNT

        # DAC output values (8-bit: 0-255)
        self.DAC_VALUES = [0] * self.GPIO_COUNT

        # LEDC PWM state
        self.LEDC_CHANNELS = [None] * 16  # 16 channels
        self.LEDC_PIN_MAP = {}  # gpio -> channel
        self.LEDC_DUTY = [0] * self.GPIO_COUNT  # duty per pin

        # Touch sensor values (simulated: 0 = touched, high = untouched)
        self.TOUCH_VALUES = {pin: 50 for pin in self.TOUCH_PINS}

        # PWM values (0-255 scale for compatibility with ATmega component rendering)
        self.PWM_VALUES = [0] * self.GPIO_COUNT

        # Timeline for LogicAnalyzer
        self.timeline = []
        self.timeline.append({
            "time": 0,
            "type": "INIT",
            "registers": self._snapshot()
        })

    # -------------------------
    # GPIO configuration
    # -------------------------
    def pin_mode(self, pin: int, mode: str):
        if pin < 0 or pin >= self.GPIO_COUNT:
            return
        if pin in self.FLASH_SPI_PINS:
            return  # silently ignore flash pins
        if mode.upper() == "OUTPUT" and pin in self.INPUT_ONLY_PINS:
            return  # input-only pins cannot be set as output

        self.DDR[pin] = 1 if mode.upper() == "OUTPUT" else 0

        if self.clock:
            self.timeline.append({
                "time": self.clock.now(),
                "type": "MODE",
                "pin": pin,
                "mode": mode.upper(),
                "registers": self._snapshot()
            })

    # -------------------------
    # Digital output
    # -------------------------
    def digital_write(self, pin: int, value):
        if pin < 0 or pin >= self.GPIO_COUNT:
            return
        if pin in self.FLASH_SPI_PINS or pin in self.INPUT_ONLY_PINS:
            return

        if self.DDR[pin] == 1:
            val = 1 if (value == "HIGH" or value == 1) else 0
            self.PORT[pin] = val
            self.PIN[pin] = val  # reflect back on read

            if self.clock:
                self.timeline.append({
                    "time": self.clock.now(),
                    "type": "WRITE",
                    "pin": pin,
                    "value": "HIGH" if val else "LOW",
                    "registers": self._snapshot()
                })

    # -------------------------
    # Digital input
    # -------------------------
    def digital_read(self, pin: int) -> int:
        if pin < 0 or pin >= self.GPIO_COUNT:
            return 0
        if self.DDR[pin] == 0:
            return self.PIN[pin]
        return self.PORT[pin]

    def set_input(self, pin: int, value):
        """Set an external input signal (from UI buttons, sensors, etc.)."""
        if pin < 0 or pin >= self.GPIO_COUNT:
            return

        # Digital input
        if isinstance(value, bool) or value in (0, 1):
            if self.DDR[pin] == 0:
                self.PIN[pin] = 1 if value else 0

        # Analog input (12-bit)
        if isinstance(value, int) and pin in (
            set(self.ADC1_PINS.keys()) | set(self.ADC2_PINS.keys())
        ):
            self.ADC_VALUES[pin] = max(0, min(4095, value))

    # -------------------------
    # Analog read (12-bit ADC)
    # -------------------------
    def analog_read(self, pin: int) -> int:
        if pin in self.ADC1_PINS or pin in self.ADC2_PINS:
            return self.ADC_VALUES[pin]
        return 0

    # -------------------------
    # LEDC PWM
    # -------------------------
    def ledc_attach(self, pin: int, freq: int = 5000, resolution: int = 8):
        """ledcAttach(pin, freq, resolution) — Arduino ESP32 Core 3.x API."""
        if pin < 0 or pin >= self.GPIO_COUNT:
            return
        if pin in self.INPUT_ONLY_PINS or pin in self.FLASH_SPI_PINS:
            return

        # Find next free channel
        channel = None
        for i, ch in enumerate(self.LEDC_CHANNELS):
            if ch is None:
                channel = i
                break
        if channel is None:
            channel = 0  # fallback to channel 0

        self.LEDC_CHANNELS[channel] = {
            "pin": pin,
            "freq": freq,
            "resolution": resolution,
        }
        self.LEDC_PIN_MAP[pin] = channel
        self.DDR[pin] = 1  # LEDC implies output

    def ledc_write(self, pin: int, duty: int):
        """ledcWrite(pin, duty) — Arduino ESP32 Core 3.x API."""
        if pin not in self.LEDC_PIN_MAP:
            return

        channel = self.LEDC_PIN_MAP[pin]
        ch_config = self.LEDC_CHANNELS[channel]
        if ch_config is None:
            return

        max_duty = (1 << ch_config["resolution"]) - 1
        clamped = max(0, min(max_duty, duty))
        self.LEDC_DUTY[pin] = clamped

        # Normalize to 0-255 for component rendering compatibility
        self.PWM_VALUES[pin] = int((clamped / max(max_duty, 1)) * 255)

        # Also set PORT to reflect digital state
        self.PORT[pin] = 1 if clamped > 0 else 0

        if self.clock:
            self.timeline.append({
                "time": self.clock.now(),
                "type": "LEDC_WRITE",
                "pin": pin,
                "duty": clamped,
                "pwm_normalized": self.PWM_VALUES[pin],
                "registers": self._snapshot()
            })

    # -------------------------
    # DAC output (8-bit, GPIO25 & GPIO26 only)
    # -------------------------
    def dac_write(self, pin: int, value: int):
        if pin not in self.DAC_PINS:
            return
        clamped = max(0, min(255, value))
        self.DAC_VALUES[pin] = clamped
        self.DDR[pin] = 1
        self.PORT[pin] = 1 if clamped > 0 else 0
        self.PWM_VALUES[pin] = clamped  # reuse PWM for rendering

        if self.clock:
            self.timeline.append({
                "time": self.clock.now(),
                "type": "DAC_WRITE",
                "pin": pin,
                "value": clamped,
                "registers": self._snapshot()
            })

    # -------------------------
    # Touch read (capacitive sensing)
    # -------------------------
    def touch_read(self, pin: int) -> int:
        if pin in self.TOUCH_PINS:
            return self.TOUCH_VALUES.get(pin, 50)
        return 0

    def set_touch_value(self, pin: int, value: int):
        """Set simulated touch sensor value from UI."""
        if pin in self.TOUCH_PINS:
            self.TOUCH_VALUES[pin] = max(0, min(100, value))

    # -------------------------
    # analogWrite compatibility shim
    # -------------------------
    def analog_write(self, pin: int, value: int):
        """
        analogWrite() is NOT natively supported on ESP32.
        We provide a compatibility shim: auto-attach LEDC and write.
        """
        if pin not in self.LEDC_PIN_MAP:
            self.ledc_attach(pin, 5000, 8)
        self.ledc_write(pin, value)

    # -------------------------
    # Serial operations
    # -------------------------
    def serial_begin(self, baud_rate: int):
        if self.clock:
            self.timeline.append({
                "time": self.clock.now(),
                "type": "SERIAL_BEGIN",
                "baud": baud_rate,
                "registers": self._snapshot()
            })

    def serial_print(self, message: str):
        if self.clock:
            self.timeline.append({
                "time": self.clock.now(),
                "type": "SERIAL_PRINT",
                "message": message,
                "registers": self._snapshot()
            })

    # -------------------------
    # UI helper
    # -------------------------
    def read_led(self):
        """Check built-in LED (GPIO2 on most ESP32 DevKit boards)."""
        return "ON" if self.PORT[2] == 1 else "OFF"

    def _snapshot(self):
        """
        Create a register snapshot compatible with the frontend.
        Uses a flat GPIO model instead of port-based registers.
        """
        return {
            "GPIO_DIR": list(self.DDR),
            "GPIO_OUT": list(self.PORT),
            "GPIO_IN": list(self.PIN),
            "ADC": list(self.ADC_VALUES),
            "DAC": list(self.DAC_VALUES),
            "PWM": list(self.PWM_VALUES),
            "LEDC_DUTY": list(self.LEDC_DUTY),
            "TOUCH": dict(self.TOUCH_VALUES),
        }
