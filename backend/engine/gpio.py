class GPIO:
    """
    Minimal simulation of Arduino-style GPIO for digital pins 0–13 and analog A0–A5.
    """

    # Arduino pin → (PORT, bit)
    _PIN_MAP = {
        # PORTD: digital 0–7
        0: ("D", 0),
        1: ("D", 1),
        2: ("D", 2),
        3: ("D", 3),
        4: ("D", 4),
        5: ("D", 5),
        6: ("D", 6),
        7: ("D", 7),
        # PORTB: digital 8–13
        8: ("B", 0),
        9: ("B", 1),
        10: ("B", 2),
        11: ("B", 3),
        12: ("B", 4),
        13: ("B", 5),
        # PORTC: analog A0–A5 (14–19)
        14: ("C", 0),
        15: ("C", 1),
        16: ("C", 2),
        17: ("C", 3),
        18: ("C", 4),
        19: ("C", 5),
    }

    def __init__(self, clock=None):
        self.clock = clock

        # Data Direction Registers
        self.DDRB = [0] * 8
        self.DDRC = [0] * 8
        self.DDRD = [0] * 8

        # Output registers
        self.PORTB = [0] * 8
        self.PORTC = [0] * 8
        self.PORTD = [0] * 8

        self.PINB = [0] * 8
        self.PINC = [0] * 8
        self.PIND = [0] * 8

        # Analog to Digital values (0-1023) mapped to pins 14-19 (A0-A5)
        self.ADC_VALUES = [0] * 6

        # Standard PWM values (0-255) for all pins
        self.PWM_VALUES = [0] * 20

        self.timeline = []
        # Initial snapshot at time 0
        self.timeline.append({
            "time": 0,
            "type": "INIT",
            "registers": self._snapshot()
        })

    # -------------------------
    # Internal helper
    # -------------------------
    def _get_registers(self, pin: int):
        mapping = self._PIN_MAP.get(pin)
        if mapping is None:
            return None, None, None, None

        port, bit = mapping
        if port == "B":
            return self.DDRB, self.PORTB, self.PINB, bit
        if port == "C":
            return self.DDRC, self.PORTC, self.PINC, bit
        if port == "D":
            return self.DDRD, self.PORTD, self.PIND, bit

        return None, None, None, None

    # -------------------------
    # GPIO configuration
    # -------------------------
    def pin_mode(self, pin: int, mode: str):
        ddr, _, _, bit = self._get_registers(pin)
        if ddr is None or bit is None:
            return
        
        import typing
        ddr_list = typing.cast(list[int], ddr)
        b = typing.cast(int, bit)
        ddr_list[b] = 1 if mode.upper() == "OUTPUT" else 0
        
        if self.clock:
            self.timeline.append({
                "time": self.clock.now(),
                "type": "MODE",
                "pin": pin,
                "mode": mode,
                "registers": self._snapshot()
            })

    # -------------------------
    # Output operations
    # -------------------------
    def digital_write(self, pin: int, value: str):
        ddr, port, _, bit = self._get_registers(pin)
        if ddr is None or port is None or bit is None:
            return

        import typing
        ddr_list = typing.cast(list[int], ddr)
        port_list = typing.cast(list[int], port)
        b = typing.cast(int, bit)

        if ddr_list[b] == 1:
            port_list[b] = 1 if value == "HIGH" else 0

            if self.clock:
                self.timeline.append({
                    "time": self.clock.now(),
                    "type": "WRITE",
                    "pin": pin,
                    "value": value,
                    "registers": self._snapshot()
                })

    # -------------------------
    # Input operations
    # -------------------------
    def set_input(self, pin: int, value: bool | int):
        # Handle regular digital set
        if isinstance(value, bool) or value in (0, 1):
            ddr, _, pin_reg, bit = self._get_registers(pin)
            if ddr and pin_reg and bit is not None:
                import typing
                ddr_list = typing.cast(list[int], ddr)
                pin_list = typing.cast(list[int], pin_reg)
                b = typing.cast(int, bit)
                if ddr_list[b] == 0:
                    pin_list[b] = 1 if value else 0

        # Handle analog 10-bit set
        if isinstance(value, int) and pin >= 14 and pin <= 19:
            adc_idx = pin - 14
            self.ADC_VALUES[adc_idx] = max(0, min(1023, value))

    def analog_read(self, pin: int) -> int:
        if pin >= 14 and pin <= 19:
            return self.ADC_VALUES[pin - 14]
        return 0

    def analog_write(self, pin: int, value: int):
        ddr, _, _, bit = self._get_registers(pin)
        if ddr is None or bit is None:
            return

        import typing
        ddr_list = typing.cast(list[int], ddr)
        b = typing.cast(int, bit)
        if ddr_list[b] == 1:
            self.PWM_VALUES[pin] = max(0, min(255, value))
            
            if self.clock:
                self.timeline.append({
                    "time": self.clock.now(),
                    "type": "A_WRITE",
                    "pin": pin,
                    "value": self.PWM_VALUES[pin],
                    "registers": self._snapshot()
                })

    def digital_read(self, pin: int) -> int:
        ddr, port, pin_reg, bit = self._get_registers(pin)
        if ddr is None or port is None or pin_reg is None or bit is None:
            return 0

        import typing
        ddr_list = typing.cast(list[int], ddr)
        port_list = typing.cast(list[int], port)
        pin_list = typing.cast(list[int], pin_reg)
        b = typing.cast(int, bit)

        if ddr_list[b] == 0:
            return pin_list[b]

        return port_list[b]

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
        return "ON" if self.PORTB[5] == 1 else "OFF"

    def _snapshot(self):
        return {
            "DDRB": list(self.DDRB),
            "DDRC": list(self.DDRC),
            "DDRD": list(self.DDRD),
            "PORTB": list(self.PORTB),
            "PORTC": list(self.PORTC),
            "PORTD": list(self.PORTD),
            "PINB": list(self.PINB),
            "PINC": list(self.PINC),
            "PIND": list(self.PIND),
            "ADC": list(self.ADC_VALUES),
            "PWM": list(self.PWM_VALUES)
        }
