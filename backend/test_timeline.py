
from engine.gpio import GPIO
from engine.clock import VirtualClock

clock = VirtualClock()
gpio = GPIO(clock=clock)

gpio.pin_mode(13, "OUTPUT")
gpio.digital_write(13, "HIGH")

print(f"Timeline length: {len(gpio.timeline)}")
print(f"First event: {gpio.timeline[0]['type']}") # Should be INIT
print(f"Last event: {gpio.timeline[-1]['type']}") # Should be WRITE
print(f"Last event registers type: {type(gpio.timeline[-1]['registers'])}")
print(f"PORTB in last event: {gpio.timeline[-1]['registers']['PORTB']}")
