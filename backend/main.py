from experiments.led_basic import LED_BASIC_EXPERIMENT
from engine.experiment_runner import ExperimentRunner
from engine.validator import Validator
from engine.clock import VirtualClock   # ✅ Added
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

from engine.gpio import GPIO
from engine.parser import parse_code
from engine.compiler import compile_code

# -------------------------
# App initialization
# -------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Models
# -------------------------
class CodeInput(BaseModel):
    code: str
    inputs: Optional[Dict[int, int]] = None


# -------------------------
# Routes
# -------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}


@app.post("/run-experiment")
def run_experiment(payload: CodeInput):
    print("RECEIVED CODE:")
    print(payload.code)

    # ✅ Create virtual clock
    clock = VirtualClock()

    # ✅ Inject clock into GPIO
    gpio = GPIO(clock=clock)

    # Inject external input signals (if any)
    inputs = payload.inputs
    if inputs is not None:
        for pin, value in inputs.items():
            gpio.set_input(pin, value)

    # Parse & execute code on virtual hardware
    parse_code(payload.code, gpio)

    # Compile the code to verifiable Intel Hex using avr-gcc toolchain!
    hex_output = ""
    hex_error = ""
    try:
        hex_output = compile_code(payload.code)
    except Exception as e:
        hex_error = str(e)

    # Snapshot registers
    registers = {
        "DDRB": list(gpio.DDRB),
        "DDRC": list(gpio.DDRC),
        "DDRD": list(gpio.DDRD),
        "PORTB": list(gpio.PORTB),
        "PORTC": list(gpio.PORTC),
        "PORTD": list(gpio.PORTD),
        "PINB": list(gpio.PINB),
        "PINC": list(gpio.PINC),
        "PIND": list(gpio.PIND),
    }

    # ✅ Capture timeline
    timeline = gpio.timeline

    # Validation
    validator = Validator(gpio)
    runner = ExperimentRunner(LED_BASIC_EXPERIMENT, validator)
    experiment_result = runner.run()

    return {
        "experiment": {
            "id": LED_BASIC_EXPERIMENT["id"],
            "title": LED_BASIC_EXPERIMENT["title"],
            "description": LED_BASIC_EXPERIMENT["description"],
        },
        "led": gpio.read_led(),  # Final state
        "button": "HIGH" if gpio.digital_read(2) == 1 else "LOW",
        "registers": registers,
        "timeline": timeline,  # ✅ New
        "validation": experiment_result,
        "hex": hex_output,
        "hex_error": hex_error
    }
