from dotenv import load_dotenv  # type: ignore
load_dotenv()  # loads backend/.env automatically

from experiments.led_basic import LED_BASIC_EXPERIMENT  # type: ignore
from engine.experiment_runner import ExperimentRunner  # type: ignore
from engine.validator import Validator  # type: ignore
from engine.clock import VirtualClock  # type: ignore
from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import Dict, Optional
import json
import os
import glob

from engine.gpio import GPIO  # type: ignore
from engine.parser import parse_code  # type: ignore
from engine.compiler import compile_code  # type: ignore

# RAG engine (lazy-loaded — only initialized when first chatbot request arrives)
_rag_engine = None

def get_rag_engine():
    """Lazy-load the RAG engine so the server starts even without GEMINI_API_KEY."""
    global _rag_engine
    if _rag_engine is None:
        from rag.query import RAGEngine  # type: ignore
        _rag_engine = RAGEngine()
    return _rag_engine

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

class ChatInput(BaseModel):
    message: str
    context: Optional[str] = None  # e.g. 'sandbox' or 'experiment'


# -------------------------
# Routes
# -------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/api/experiments")
def get_experiments():
    """Returns a summarized list of all available experiments."""
    data_dir = os.path.join(os.path.dirname(__file__), "data", "experiments")
    if not os.path.exists(data_dir):
        return {"experiments": []}
    
    experiments = []
    for file_path in sorted(glob.glob(os.path.join(data_dir, "*.json"))):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                exp_data = json.load(f)
                experiments.append({
                    "id": exp_data.get("id"),
                    "title": exp_data.get("title"),
                    "difficulty": exp_data.get("difficulty"),
                    "aim": exp_data.get("aim")
                })
            except Exception as e:
                pass
    return {"experiments": experiments}

@app.get("/api/experiments/{experiment_id}")
def get_experiment_details(experiment_id: str):
    """Returns the full JSON data (theory, quizzes, procedure) for a given experiment ID."""
    data_dir = os.path.join(os.path.dirname(__file__), "data", "experiments")
    
    for path in glob.glob(os.path.join(data_dir, "*.json")):
        with open(path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if data.get("id") == experiment_id:
                    return data
            except:
                pass
                
    raise HTTPException(status_code=404, detail="Experiment not found")


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


# -------------------------
# Chatbot (RAG-powered)
# -------------------------
@app.post("/api/chat")
def chat(payload: ChatInput):
    """RAG-powered chatbot for ATmega328P questions."""
    try:
        engine = get_rag_engine()
        result = engine.ask(payload.message, context_mode=payload.context or "chatbot")
        return {
            "answer": result["answer"],
            "sources": result["sources"],
            "has_context": result["has_context"]
        }
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
