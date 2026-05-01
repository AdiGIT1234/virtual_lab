import re

# -------------------------
# delay pattern
# -------------------------
delay_pattern = re.compile(
    r"""delay\s*\(\s*(?P<ms>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

# -------------------------
# AVR port/bit name maps
# -------------------------
# Named bit aliases (PB0..PB7, PC0..PC7, PD0..PD7) -> bit index
_AVR_BIT_NAMES: dict[str, int] = {}
for _port in "BCD":
    for _bit in range(8):
        _AVR_BIT_NAMES[f"P{_port}{_bit}"] = _bit
# Also accept plain integers as bit positions

# Register -> (gpio attribute name, is_ddr, port_letter)
_AVR_REGISTER_MAP = {
    "DDRB":  ("DDRB",  True,  "B"),
    "DDRC":  ("DDRC",  True,  "C"),
    "DDRD":  ("DDRD",  True,  "D"),
    "PORTB": ("PORTB", False, "B"),
    "PORTC": ("PORTC", False, "C"),
    "PORTD": ("PORTD", False, "D"),
}

# AVR direct register bit-op pattern: REG op= (1<<BIT) or REG op= (1<<PXN)
# Supports |=, &= ~, ^=
_avr_reg_set_pattern = re.compile(
    r"""(?P<reg>DDR[BCD]|PORT[BCD])\s*\|=\s*\(\s*1\s*<<\s*(?P<bit>[PBCDb-d]?\d)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)
_avr_reg_clr_pattern = re.compile(
    r"""(?P<reg>DDR[BCD]|PORT[BCD])\s*&=\s*~\s*\(\s*1\s*<<\s*(?P<bit>[PBCDb-d]?\d)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)
_avr_reg_tog_pattern = re.compile(
    r"""(?P<reg>DDR[BCD]|PORT[BCD])\s*\^=\s*\(\s*1\s*<<\s*(?P<bit>[PBCDb-d]?\d)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)


def _resolve_avr_bit(bit_str: str) -> int | None:
    """Resolve a bit name like PB5, PC3, 5, etc. to an integer bit index."""
    bit_str = bit_str.strip().upper()
    if bit_str in _AVR_BIT_NAMES:
        return _AVR_BIT_NAMES[bit_str]
    try:
        return int(bit_str)
    except ValueError:
        return None


def _apply_avr_reg_op(gpio, reg_name: str, bit: int, op: str) -> None:
    """Apply |=, &=~, or ^= to an AVR register bit in the gpio state."""
    reg_name = reg_name.upper()
    info = _AVR_REGISTER_MAP.get(reg_name)
    if info is None:
        return
    attr_name, is_ddr, _ = info
    reg_list: list[int] = getattr(gpio, attr_name)
    if bit < 0 or bit >= len(reg_list):
        return
    if op == "set":
        reg_list[bit] = 1
    elif op == "clr":
        reg_list[bit] = 0
    elif op == "tog":
        reg_list[bit] ^= 1
    if gpio.clock:
        gpio.timeline.append({
            "time": gpio.clock.now(),
            "type": "REG_WRITE",
            "reg": reg_name,
            "bit": bit,
            "op": op,
            "registers": gpio._snapshot()
        })

def _inside_any(start: int, end: int, spans: list[tuple[int, int]]) -> bool:
    """Return True if [start, end) overlaps any of the given spans."""
    for s, e in spans:
        if start < e and end > s:
            return True
    return False


def parse_code(code, gpio):
    """
    Sequential parser / executor for a minimal Arduino-like language.

    Supported:
      - pinMode(pin, INPUT|OUTPUT)
      - digitalWrite(pin, HIGH|LOW)
      - digitalRead(pin)
      - delay(ms)
      - if (digitalRead(pin) == HIGH) { digitalWrite(...) } else { digitalWrite(...) }
      - DDRB |= (1<<PB5), PORTB |= (1<<5), PORTB &= ~(1<<PB5), PORTB ^= (1<<5)  [AVR direct register writes]
    """

    if not isinstance(code, str):
        return

    code_str = code

    # -------------------------
    # Regex patterns
    # -------------------------

    pin_mode_pattern = re.compile(
        r"""pinMode\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<mode>INPUT|OUTPUT)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    digital_write_pattern = re.compile(
        r"""digitalWrite\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<value>HIGH|LOW)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    analog_write_pattern = re.compile(
        r"""analogWrite\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<value>\d+)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    digital_read_pattern = re.compile(
        r"""digitalRead\s*\(\s*(?P<pin>\d+)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    analog_read_pattern = re.compile(
        r"""analogRead\s*\(\s*(?P<pin>[A-Z]*\d+)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    if_else_pattern = re.compile(
        r"""if\s*\(\s*(?P<rtype>digitalRead|analogRead)\s*\(\s*(?P<read_pin>[A-Z]*\d+)\s*\)\s*(?P<operator>==|>|<|>=|<=)\s*(?P<cond_val>[A-Z0-9]+)\s*\)\s*\{
            \s*(?P<if_action>digitalWrite|analogWrite)\s*\(\s*(?P<if_pin>\d+)\s*,\s*(?P<if_val>[A-Z0-9]+)\s*\)\s*;\s*\}
            \s*else\s*\{\s*(?P<else_action>digitalWrite|analogWrite)\s*\(\s*(?P<else_pin>\d+)\s*,\s*(?P<else_val>[A-Z0-9]+)\s*\)\s*;\s*\}
        """,
        re.IGNORECASE | re.VERBOSE | re.DOTALL,
    )

    serial_begin_pattern = re.compile(
        r"""Serial\.begin\s*\(\s*(?P<baud>\d+)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    serial_print_pattern = re.compile(
        r"""Serial\.(?P<method>print|println)\s*\(\s*(?P<msg>.*?)\s*\)""",
        re.IGNORECASE | re.VERBOSE,
    )

    # -------------------------
    # Collect if/else spans
    # -------------------------
    if_else_spans = [m.span() for m in if_else_pattern.finditer(code_str)]

    # -------------------------
    # Build ordered action list
    # -------------------------
    import typing
    actions: list[tuple[int, str, typing.Any]] = []

    for m in pin_mode_pattern.finditer(code_str):
        actions.append((m.start(), "pin_mode", m))

    for m in digital_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "digital_write", m))

    for m in analog_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "analog_write", m))

    for m in digital_read_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "digital_read", m))

    for m in analog_read_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "analog_read", m))

    for m in delay_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "delay", m))

    for m in if_else_pattern.finditer(code_str):
        actions.append((m.start(), "if_else", m))

    for m in serial_begin_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "serial_begin", m))

    for m in serial_print_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "serial_print", m))

    # AVR direct register writes (bare-metal style: DDRB |= (1<<PB5) etc.)
    for m in _avr_reg_set_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "avr_reg_set", m))

    for m in _avr_reg_clr_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "avr_reg_clr", m))

    for m in _avr_reg_tog_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "avr_reg_tog", m))

    actions.sort(key=lambda x: x[0])

    # -------------------------
    # Execute in source order
    # -------------------------
    for _, action_type, match in actions:

        if action_type == "pin_mode":
            try:
                pin = int(match.group("pin"))
                mode = match.group("mode").upper()
            except (TypeError, ValueError):
                continue
            gpio.pin_mode(pin, mode)

        elif action_type == "digital_write":
            try:
                pin = int(match.group("pin"))
                value = match.group("value").upper()
            except (TypeError, ValueError):
                continue
            gpio.digital_write(pin, value)

        elif action_type == "analog_write":
            try:
                pin = int(match.group("pin"))
                value = int(match.group("value"))
            except (TypeError, ValueError):
                continue
            gpio.analog_write(pin, value)

        elif action_type == "digital_read":
            try:
                pin = int(match.group("pin"))
            except (TypeError, ValueError):
                continue
            gpio.digital_read(pin)

        elif action_type == "delay":
            try:
                ms = int(match.group("ms"))
            except (TypeError, ValueError):
                continue

            if gpio.clock:
                gpio.clock.advance(ms)

        elif action_type == "if_else":
            try:
                rtype = match.group("rtype").lower()
                read_pin_str = match.group("read_pin")
                if read_pin_str.upper().startswith("A"):
                    read_pin = int(read_pin_str[1:]) + 14
                else:
                    read_pin = int(read_pin_str)
                    
                operator = match.group("operator")
                cond_val_str = match.group("cond_val").upper()
                cond_val = 1 if cond_val_str == "HIGH" else (0 if cond_val_str == "LOW" else int(cond_val_str))
                
                if_action = match.group("if_action").lower()
                if_pin = int(match.group("if_pin"))
                if_val_str = match.group("if_val").upper()
                if_val = if_val_str if if_action == "digitalwrite" else int(if_val_str)

                else_action = match.group("else_action").lower()
                else_pin = int(match.group("else_pin"))
                else_val_str = match.group("else_val").upper()
                else_val = else_val_str if else_action == "digitalwrite" else int(else_val_str)
            except (TypeError, ValueError):
                continue

            result = gpio.digital_read(read_pin) if rtype == "digitalread" else gpio.analog_read(read_pin)
            
            condition_met = False
            if operator == "==": condition_met = result == cond_val
            elif operator == ">": condition_met = result > cond_val
            elif operator == "<": condition_met = result < cond_val
            elif operator == ">=": condition_met = result >= cond_val
            elif operator == "<=": condition_met = result <= cond_val

            if condition_met:
                if if_action == "digitalwrite": gpio.digital_write(if_pin, if_val)
                else: gpio.analog_write(if_pin, if_val)
            else:
                if else_action == "digitalwrite": gpio.digital_write(else_pin, else_val)
                else: gpio.analog_write(else_pin, else_val)

        elif action_type == "serial_begin":
            try:
                baud = int(match.group("baud"))
            except (TypeError, ValueError):
                continue
            gpio.serial_begin(baud)

        elif action_type == "serial_print":
            method = match.group("method").lower()
            raw_msg = match.group("msg")
            
            # Simple string unquoting (remove leading/trailing " or ')
            if (raw_msg.startswith('"') and raw_msg.endswith('"')) or (raw_msg.startswith("'") and raw_msg.endswith("'")):
                msg = raw_msg[1:-1]
            else:
                # E.g. a number variable or random token... we'll just treat it as a string literal for now
                msg = raw_msg

            if method == "println":
                msg += "\n"

            gpio.serial_print(msg)

        elif action_type in ("avr_reg_set", "avr_reg_clr", "avr_reg_tog"):
            try:
                reg_name = match.group("reg").upper()
                bit_str = match.group("bit")
                bit = _resolve_avr_bit(bit_str)
                if bit is None:
                    continue
                op_map = {"avr_reg_set": "set", "avr_reg_clr": "clr", "avr_reg_tog": "tog"}
                _apply_avr_reg_op(gpio, reg_name, bit, op_map[action_type])
            except (TypeError, ValueError, AttributeError):
                continue
