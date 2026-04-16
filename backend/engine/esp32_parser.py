"""
ESP32 Arduino code parser.

Extends the ATmega parser approach for ESP32-specific functions:
  - ledcAttach(pin, freq, resolution)
  - ledcWrite(pin, duty)
  - dacWrite(pin, value)
  - touchRead(pin)
  - Standard: pinMode, digitalWrite, digitalRead, analogRead, delay, Serial
"""

import re


# -------------------------
# Regex patterns
# -------------------------

pin_mode_pattern = re.compile(
    r"""pinMode\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<mode>INPUT|OUTPUT|INPUT_PULLUP|INPUT_PULLDOWN)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

digital_write_pattern = re.compile(
    r"""digitalWrite\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<value>HIGH|LOW)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

digital_read_pattern = re.compile(
    r"""digitalRead\s*\(\s*(?P<pin>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

analog_read_pattern = re.compile(
    r"""analogRead\s*\(\s*(?P<pin>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

analog_write_pattern = re.compile(
    r"""analogWrite\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<value>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

ledc_attach_pattern = re.compile(
    r"""ledcAttach\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<freq>\d+)\s*,\s*(?P<resolution>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

ledc_write_pattern = re.compile(
    r"""ledcWrite\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<duty>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

dac_write_pattern = re.compile(
    r"""dacWrite\s*\(\s*(?P<pin>\d+)\s*,\s*(?P<value>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

touch_read_pattern = re.compile(
    r"""touchRead\s*\(\s*(?P<pin>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

delay_pattern = re.compile(
    r"""delay\s*\(\s*(?P<ms>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

serial_begin_pattern = re.compile(
    r"""Serial\.begin\s*\(\s*(?P<baud>\d+)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

serial_print_pattern = re.compile(
    r"""Serial\.(?P<method>print|println)\s*\(\s*(?P<msg>.*?)\s*\)""",
    re.IGNORECASE | re.VERBOSE,
)

if_else_pattern = re.compile(
    r"""if\s*\(\s*(?P<rtype>digitalRead|analogRead|touchRead)\s*\(\s*(?P<read_pin>\d+)\s*\)\s*(?P<operator>==|>|<|>=|<=)\s*(?P<cond_val>[A-Z0-9]+)\s*\)\s*\{
        \s*(?P<if_action>digitalWrite|analogWrite|ledcWrite|dacWrite)\s*\(\s*(?P<if_pin>\d+)\s*,\s*(?P<if_val>[A-Z0-9]+)\s*\)\s*;\s*\}
        \s*else\s*\{\s*(?P<else_action>digitalWrite|analogWrite|ledcWrite|dacWrite)\s*\(\s*(?P<else_pin>\d+)\s*,\s*(?P<else_val>[A-Z0-9]+)\s*\)\s*;\s*\}
    """,
    re.IGNORECASE | re.VERBOSE | re.DOTALL,
)


def _inside_any(start: int, end: int, spans: list) -> bool:
    """Return True if [start, end) overlaps any of the given spans."""
    for s, e in spans:
        if start < e and end > s:
            return True
    return False


def parse_esp32_code(code, gpio):
    """
    Sequential parser / executor for ESP32 Arduino-like code.

    Supported:
      - pinMode(pin, INPUT|OUTPUT|INPUT_PULLUP|INPUT_PULLDOWN)
      - digitalWrite(pin, HIGH|LOW)
      - digitalRead(pin)
      - analogRead(pin)
      - analogWrite(pin, value)  — compatibility shim
      - ledcAttach(pin, freq, resolution)
      - ledcWrite(pin, duty)
      - dacWrite(pin, value)
      - touchRead(pin)
      - delay(ms)
      - Serial.begin(baud), Serial.print(), Serial.println()
      - if/else conditional blocks
    """

    if not isinstance(code, str):
        return

    code_str = code

    # Collect if/else spans to avoid double-processing
    if_else_spans = [m.span() for m in if_else_pattern.finditer(code_str)]

    # Build ordered action list
    actions = []

    for m in pin_mode_pattern.finditer(code_str):
        actions.append((m.start(), "pin_mode", m))

    for m in digital_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "digital_write", m))

    for m in digital_read_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "digital_read", m))

    for m in analog_read_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "analog_read", m))

    for m in analog_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "analog_write", m))

    for m in ledc_attach_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "ledc_attach", m))

    for m in ledc_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "ledc_write", m))

    for m in dac_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "dac_write", m))

    for m in touch_read_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "touch_read", m))

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

        elif action_type == "digital_read":
            try:
                pin = int(match.group("pin"))
            except (TypeError, ValueError):
                continue
            gpio.digital_read(pin)

        elif action_type == "analog_read":
            try:
                pin = int(match.group("pin"))
            except (TypeError, ValueError):
                continue
            gpio.analog_read(pin)

        elif action_type == "analog_write":
            try:
                pin = int(match.group("pin"))
                value = int(match.group("value"))
            except (TypeError, ValueError):
                continue
            gpio.analog_write(pin, value)

        elif action_type == "ledc_attach":
            try:
                pin = int(match.group("pin"))
                freq = int(match.group("freq"))
                resolution = int(match.group("resolution"))
            except (TypeError, ValueError):
                continue
            gpio.ledc_attach(pin, freq, resolution)

        elif action_type == "ledc_write":
            try:
                pin = int(match.group("pin"))
                duty = int(match.group("duty"))
            except (TypeError, ValueError):
                continue
            gpio.ledc_write(pin, duty)

        elif action_type == "dac_write":
            try:
                pin = int(match.group("pin"))
                value = int(match.group("value"))
            except (TypeError, ValueError):
                continue
            gpio.dac_write(pin, value)

        elif action_type == "touch_read":
            try:
                pin = int(match.group("pin"))
            except (TypeError, ValueError):
                continue
            gpio.touch_read(pin)

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
                read_pin = int(match.group("read_pin"))

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

            if rtype == "digitalread":
                result = gpio.digital_read(read_pin)
            elif rtype == "analogread":
                result = gpio.analog_read(read_pin)
            elif rtype == "touchread":
                result = gpio.touch_read(read_pin)
            else:
                result = 0

            condition_met = False
            if operator == "==":
                condition_met = result == cond_val
            elif operator == ">":
                condition_met = result > cond_val
            elif operator == "<":
                condition_met = result < cond_val
            elif operator == ">=":
                condition_met = result >= cond_val
            elif operator == "<=":
                condition_met = result <= cond_val

            if condition_met:
                _execute_action(gpio, if_action, if_pin, if_val)
            else:
                _execute_action(gpio, else_action, else_pin, else_val)

        elif action_type == "serial_begin":
            try:
                baud = int(match.group("baud"))
            except (TypeError, ValueError):
                continue
            gpio.serial_begin(baud)

        elif action_type == "serial_print":
            method = match.group("method").lower()
            raw_msg = match.group("msg")

            if (raw_msg.startswith('"') and raw_msg.endswith('"')) or \
               (raw_msg.startswith("'") and raw_msg.endswith("'")):
                msg = raw_msg[1:-1]
            else:
                msg = raw_msg

            if method == "println":
                msg += "\n"

            gpio.serial_print(msg)


def _execute_action(gpio, action, pin, value):
    """Helper to execute a write action from an if/else block."""
    action_lower = action.lower()
    if action_lower == "digitalwrite":
        gpio.digital_write(pin, value)
    elif action_lower == "analogwrite":
        gpio.analog_write(pin, int(value))
    elif action_lower == "ledcwrite":
        gpio.ledc_write(pin, int(value))
    elif action_lower == "dacwrite":
        gpio.dac_write(pin, int(value))
