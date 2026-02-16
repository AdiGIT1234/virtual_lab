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
        self.timeline = []

        # Data Direction Registers
        self.DDRB = [0] * 8
        self.DDRC = [0] * 8
        self.DDRD = [0] * 8

        # Output registers
        self.PORTB = [0] * 8
        self.PORTC = [0] * 8
        self.PORTD = [0] * 8

        # Input registers
        self.PINB = [0] * 8
        self.PINC = [0] * 8
        self.PIND = [0] * 8

    # -------------------------
    # Internal helper
    # -------------------------
    def _get_registers(self, pin):
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
    def pin_mode(self, pin, mode):
        ddr, _, _, bit = self._get_registers(pin)
        if ddr is None:
            return
        ddr[bit] = 1 if mode.upper() == "OUTPUT" else 0

    # -------------------------
    # Output operations
    # -------------------------
    def digital_write(self, pin, value):
        ddr, port, _, bit = self._get_registers(pin)
        if ddr is None or port is None:
            return

        if ddr[bit] == 1:
            port[bit] = 1 if value == "HIGH" else 0

            if self.clock:
                self.timeline.append({
                    "time": self.clock.now(),
                    "pin": pin,
                    "value": value,
                })

    # -------------------------
    # Input operations
    # -------------------------
    def set_input(self, pin, value):
        ddr, _, pin_reg, bit = self._get_registers(pin)
        if ddr is None:
            return

        if ddr[bit] == 0:
            pin_reg[bit] = 1 if value else 0

    def digital_read(self, pin):
        ddr, port, pin_reg, bit = self._get_registers(pin)
        if ddr is None:
            return 0

        if ddr[bit] == 0:
            return pin_reg[bit]

        return port[bit]

    # -------------------------
    # UI helper
    # -------------------------
    def read_led(self):
        return "ON" if self.PORTB[5] == 1 else "OFF"
