from experiments.led_basic import LED_BASIC_EXPERIMENT
from engine.experiment_runner import ExperimentRunner
from engine.validator import Validator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

from engine.gpio import GPIO
from engine.parser import parse_code

# -------------------------
# App initialization
# -------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

    # Create virtual GPIO
    gpio = GPIO()

    # Inject any provided input signals before running the code
    if payload.inputs:
        for pin, value in payload.inputs.items():
            gpio.set_input(pin, value)

    # Parse & execute code on virtual hardware
    parse_code(payload.code, gpio)

    # Read-only snapshot of GPIO registers (copies, not references)
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
        "led": gpio.read_led(),
        "button": "HIGH" if gpio.digital_read(2) == 1 else "LOW",
        "registers": registers,
        "validation": experiment_result,
    }

