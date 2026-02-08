"""
Validation engine for the virtual lab. Inspects GPIO state after code execution.
"""


class Validator:
    """
    Validates GPIO state. Accepts a GPIO instance after parse_code has run.
    Does not parse code or depend on FastAPI/frontend.
    """

    # Arduino pin -> (port_name, bit_index), same as GPIO
    _PIN_MAP = {
        0: ("D", 0),
        1: ("D", 1),
        2: ("D", 2),
        3: ("D", 3),
        4: ("D", 4),
        5: ("D", 5),
        6: ("D", 6),
        7: ("D", 7),
        8: ("B", 0),
        9: ("B", 1),
        10: ("B", 2),
        11: ("B", 3),
        12: ("B", 4),
        13: ("B", 5),
    }

    def __init__(self, gpio):
        self._gpio = gpio

    def led_is_on(self) -> bool:
        """Return True if the on-board LED (pin 13) is HIGH."""
        return self._gpio.read_led() == "ON"

    def pin_is_output(self, pin: int) -> bool:
        """Return True if the pin is configured as OUTPUT."""
        mapping = self._PIN_MAP.get(pin)
        if mapping is None:
            return False

        port_name, bit = mapping
        ddr = self._gpio.DDRB if port_name == "B" else self._gpio.DDRD
        return ddr[bit] == 1
