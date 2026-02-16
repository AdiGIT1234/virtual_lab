class VirtualClock:
    def __init__(self):
        self._time_ms = 0

    def now(self) -> int:
        return self._time_ms

    def advance(self, ms: int):
        if ms < 0:
            raise ValueError("Virtual time cannot go backwards")
        self._time_ms += ms
