class GPIO:
    """
    Minimal simulation of Arduino-style GPIO for digital pins 0–13 and analog A0–A5.

    Pin mapping (Arduino Uno style):
    - Digital 0–7  -> PORTD, bits 0–7
    - Digital 8–13 -> PORTB, bits 0–5 (13 is PB5 – on-board LED)
    - Analog A0–A5 -> PORTC, bits 0–5 (PC0–PC5)
    """

    # Map Arduino pin numbers to (port_name, bit_index)
    # Digital 0–13, Analog A0–A5 as 14–19
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
        # PORTC: analog A0–A5 (pins 14–19) -> PC0–PC5
        14: ("C", 0),  # A0
        15: ("C", 1),  # A1
        16: ("C", 2),  # A2
        17: ("C", 3),  # A3
        18: ("C", 4),  # A4
        19: ("C", 5),  # A5
    }

    def __init__(self):
        # Data Direction Registers (0 = input, 1 = output)
        self.DDRB = [0] * 8
        self.DDRC = [0] * 8
        self.DDRD = [0] * 8

        # Output registers
        self.PORTB = [0] * 8
        self.PORTC = [0] * 8
        self.PORTD = [0] * 8

        # Input registers (external signals)
        self.PINB = [0] * 8
        self.PINC = [0] * 8
        self.PIND = [0] * 8

    def _get_registers(self, pin):
        """
        Return (ddr, port, pin_reg, bit_index) for a given Arduino digital pin.
        """
        mapping = self._PIN_MAP.get(pin)
        if mapping is None:
            return None, None, None, None

        port_name, bit = mapping
        if port_name == "B":
            return self.DDRB, self.PORTB, self.PINB, bit
        elif port_name == "C":
            return self.DDRC, self.PORTC, self.PINC, bit
        elif port_name == "D":
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

        # Only OUTPUT pins can be written
        if ddr[bit] == 1:
            port[bit] = 1 if value.upper() == "HIGH" else 0

    # -------------------------
    # Input operations
    # -------------------------
    def set_input(self, pin, value):
        """
        Simulate an external signal on an INPUT pin.
        value: 1 (HIGH) or 0 (LOW)
        """
        ddr, _, pin_reg, bit = self._get_registers(pin)
        if ddr is None or pin_reg is None:
            return

        # Only valid for INPUT pins
        if ddr[bit] == 0:
            pin_reg[bit] = 1 if value else 0

    def digital_read(self, pin):
        ddr, port, pin_reg, bit = self._get_registers(pin)
        if ddr is None:
            return 0

        # INPUT pins read from PIN register
        if ddr[bit] == 0:
            return pin_reg[bit]

        # OUTPUT pins read back from PORT register
        return port[bit]

    # -------------------------
    # UI helper (unchanged)
    # -------------------------
    def read_led(self):
        # On-board LED is connected to digital 13 -> PB5.
        return "ON" if self.PORTB[5] == 1 else "OFF"
