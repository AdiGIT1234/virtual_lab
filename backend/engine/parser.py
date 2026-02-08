import re


def _inside_any(start: int, end: int, spans: list[tuple[int, int]]) -> bool:
    """Return True if [start, end) overlaps any of the given spans."""
    for s, e in spans:
        if start < e and end > s:
            return True
    return False


def parse_code(code, gpio):
    """
    Parse a minimal Arduino-like sketch and apply it to the given GPIO instance.

    Supported statements (any whitespace/newlines allowed):
      - pinMode(<pin>, INPUT);
      - pinMode(<pin>, OUTPUT);
      - digitalWrite(<pin>, HIGH);
      - digitalWrite(<pin>, LOW);
      - digitalRead(<pin>);

    Minimal conditional (exact pattern only):
      if (digitalRead(<pin>) == HIGH) {
        digitalWrite(<pin>, HIGH|LOW);
      } else {
        digitalWrite(<pin>, HIGH|LOW);
      }
    """

    if not isinstance(code, str):
        return

    code_str = code

    # -------------------------
    # Regex patterns
    # -------------------------

    pin_mode_pattern = re.compile(
        r"""pinMode\s*
            \(\s*
            (?P<pin>\d+)
            \s*,\s*
            (?P<mode>INPUT|OUTPUT)
            \s*\)
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    digital_write_pattern = re.compile(
        r"""digitalWrite\s*
            \(\s*
            (?P<pin>\d+)
            \s*,\s*
            (?P<value>HIGH|LOW)
            \s*\)
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    digital_read_pattern = re.compile(
        r"""digitalRead\s*
            \(\s*
            (?P<pin>\d+)
            \s*\)
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    if_else_pattern = re.compile(
        r"""if\s*\(\s*digitalRead\s*\(\s*(?P<read_pin>\d+)\s*\)\s*==\s*HIGH\s*\)\s*\{
            \s*digitalWrite\s*\(\s*(?P<if_pin>\d+)\s*,\s*(?P<if_val>HIGH|LOW)\s*\)\s*;\s*\}
            \s*else\s*\{\s*digitalWrite\s*\(\s*(?P<else_pin>\d+)\s*,\s*(?P<else_val>HIGH|LOW)\s*\)\s*;\s*\}
        """,
        re.IGNORECASE | re.VERBOSE | re.DOTALL,
    )

    # Collect if/else block spans so we skip digitalWrite/digitalRead inside them
    if_else_spans = [m.span() for m in if_else_pattern.finditer(code_str)]

    # Build ordered list of (start_pos, action, data)
    actions: list[tuple[int, str, object]] = []

    for m in pin_mode_pattern.finditer(code_str):
        actions.append((m.start(), "pin_mode", m))

    for m in digital_write_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "digital_write", m))

    for m in digital_read_pattern.finditer(code_str):
        if not _inside_any(m.start(), m.end(), if_else_spans):
            actions.append((m.start(), "digital_read", m))

    for m in if_else_pattern.finditer(code_str):
        actions.append((m.start(), "if_else", m))

    actions.sort(key=lambda x: x[0])

    # Execute in source order
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

        elif action_type == "if_else":
            try:
                read_pin = int(match.group("read_pin"))
                if_pin = int(match.group("if_pin"))
                if_val = match.group("if_val").upper()
                else_pin = int(match.group("else_pin"))
                else_val = match.group("else_val").upper()
            except (TypeError, ValueError):
                continue

            result = gpio.digital_read(read_pin)
            if result == 1:  # HIGH
                gpio.digital_write(if_pin, if_val)
            else:
                gpio.digital_write(else_pin, else_val)
