from dotenv import load_dotenv  # type: ignore
load_dotenv()  # loads backend/.env automatically

from experiments.led_basic import LED_BASIC_EXPERIMENT  # type: ignore
from engine.experiment_runner import ExperimentRunner  # type: ignore
from engine.validator import Validator  # type: ignore
from engine.clock import VirtualClock  # type: ignore
from fastapi import FastAPI, HTTPException, Header  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore

from typing import Dict, Optional, Any, List
import json
import os
import glob
from pydantic import BaseModel, Field 
from services.admin_portal import (  # type: ignore
    ensure_admin_email,
    fetch_all_profiles,
    fetch_admin_stats,
    delete_user_by_id,
    fetch_user_from_token,
    fetch_all_experiments,
    update_experiment_in_db,
    fetch_user_activity,
)

from engine.gpio import GPIO  # type: ignore
from engine.parser import parse_code  # type: ignore
from engine.compiler import compile_code  # type: ignore
from engine.esp32_gpio import ESP32GPIO  # type: ignore
from engine.esp32_parser import parse_esp32_code  # type: ignore
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

# RAG engine (lazy-loaded — only initialized when first chatbot request arrives)
_rag_engine = None

def get_rag_engine():
    """Lazy-load the RAG engine so the server starts even without GROQ_API_KEY."""
    global _rag_engine
    if _rag_engine is None:
        from rag.query import RAGEngine  # type: ignore
        _rag_engine = RAGEngine()
    return _rag_engine

# -------------------------
# App initialization
# -------------------------
allowed_origins_env = os.getenv("FRONTEND_ORIGINS", "*")
if allowed_origins_env.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

# Ensure local Vite dev server is always allowed during development
for dev_origin in [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5174", "http://127.0.0.1:5174",
    "http://localhost:5175", "http://127.0.0.1:5175",
    "http://localhost:3000",
]:
    if dev_origin not in allowed_origins and "*" not in allowed_origins:
        allowed_origins.append(dev_origin)


app = FastAPI(
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENV") != "production" else None,
)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Models
# -------------------------
class CodeInput(BaseModel):
    code: str = Field(...,max_length=50000) #limit to 50k characters
    inputs: Optional[Dict[int, int]] = None

class ESP32CodeInput(BaseModel):
    code: str = Field(...,max_length=50000) #limit to 50k characters
    inputs: Optional[Dict[int, int]] = None
    mcu: Optional[str] = "esp32"

class ChatInput(BaseModel):
    message: str
    context: Optional[str] = None  # e.g. 'sandbox' or 'experiment'




# -------------------------
# Routes
# -------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/health")
def health():
    import shutil
    avr_ok = shutil.which("avr-gcc") is not None
    return {
        "status": "ok",
        "avr_gcc": avr_ok,
        "avr_gcc_path": shutil.which("avr-gcc") or "not found",
    }

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
@limiter.limit("10/minute")
def run_experiment(payload: CodeInput, request:Request):
    #print("RECEIVED CODE:")
    #print(payload.code)

    # Create virtual clock
    clock = VirtualClock()

    # Inject clock into GPIO
    gpio = GPIO(clock=clock)

    # Inject external input signals (if any)
    inputs = payload.inputs
    if inputs is not None:
        for pin, value in inputs.items():
            gpio.set_input(pin, value)

    # Parse & execute code on virtual hardware
    parse_code(payload.code, gpio)

    # Compile the code to verifiable Intel Hex using avr-gcc toolchain
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

    # Capture timeline
    timeline = gpio.timeline

    # Validation — only run LED experiment validation if the code looks like LED blinking.
    # For all other experiments the simulator relies on hex/WASM execution, not register inspection.
    code_lower = payload.code.lower()
    is_led_experiment = (
        ("pb5" in code_lower or "pin 13" in code_lower or "pinmode(13" in code_lower)
        and ("ddrb" in code_lower or "pinmode" in code_lower)
    )

    if is_led_experiment:
        validator = Validator(gpio)
        runner = ExperimentRunner(LED_BASIC_EXPERIMENT, validator)
        experiment_result = runner.run()
        experiment_meta = {
            "id": LED_BASIC_EXPERIMENT["id"],
            "title": LED_BASIC_EXPERIMENT["title"],
            "description": LED_BASIC_EXPERIMENT["description"],
        }
    else:
        experiment_result = {"passed": None, "results": {}, "feedback": []}
        experiment_meta = {"id": None, "title": None, "description": None}

    return {
        "experiment": experiment_meta,
        "led": gpio.read_led(),  # Final state from register simulation
        "button": "HIGH" if gpio.digital_read(2) == 1 else "LOW",
        "registers": registers,
        "timeline": timeline,
        "validation": experiment_result,
        "hex": hex_output,
        "hex_error": hex_error
    }


@app.post("/run-esp32")
@limiter.limit("10/minute")
def run_esp32_experiment(payload: ESP32CodeInput, request:Request):
    """Run ESP32 Arduino code through the interpretive simulator."""
    #print("[ESP32] RECEIVED CODE:")
    #print(payload.code)

    clock = VirtualClock()
    gpio = ESP32GPIO(clock=clock)

    # Inject external input signals
    inputs = payload.inputs
    if inputs is not None:
        for pin, value in inputs.items():
            gpio.set_input(int(pin), value)

    # Parse & execute code on virtual ESP32 GPIO
    parse_esp32_code(payload.code, gpio)

    # Snapshot flat-GPIO registers
    registers = {
        "GPIO_DIR": list(gpio.DDR),
        "GPIO_OUT": list(gpio.PORT),
        "GPIO_IN": list(gpio.PIN),
        "ADC": list(gpio.ADC_VALUES),
        "DAC": list(gpio.DAC_VALUES),
        "PWM": list(gpio.PWM_VALUES),
        "LEDC_DUTY": list(gpio.LEDC_DUTY),
        "TOUCH": dict(gpio.TOUCH_VALUES),
    }

    timeline = gpio.timeline

    return {
        "registers": registers,
        "timeline": timeline,
        "led": gpio.read_led(),
        "hex": "",
        "hex_error": "",
    }


# -------------------------
# Chatbot (RAG-powered)
# -------------------------
@app.post("/api/chat")
@limiter.limit("10/minute")
def chat(payload: ChatInput, request:Request):
    """RAG-powered chatbot for ATmega328P questions."""
    try:
        engine = get_rag_engine()
        result = engine.ask(payload.message, context_mode=payload.context or "chatbot")
        
        answer = result.get("answer", "")
        # Check if the answer itself contains an error (e.g. from Gemini quota)
        if "Error generating response:" in answer:
            error_lower = answer.lower()
            if "429" in answer or "quota" in error_lower:
                return {
                    "answer": "⏳ I'm temporarily unavailable due to API rate limits. Please try again in a minute or two!",
                    "sources": [],
                    "has_context": False
                }
            return {
                "answer": "😕 I had trouble generating a response. Please try rephrasing your question.",
                "sources": [],
                "has_context": False
            }
        
        return {
            "answer": answer,
            "sources": result.get("sources", []),
            "has_context": result.get("has_context", False)
        }
    except ValueError as e:
        # GROQ_API_KEY not set
        return {
            "answer": "🔑 The AI assistant is not configured yet. Please set the GROQ_API_KEY in the backend .env file.",
            "sources": [],
            "has_context": False
        }
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return {
                "answer": "⏳ I'm temporarily unavailable due to API rate limits. Please try again in a minute or two!",
                "sources": [],
                "has_context": False
            }
        return {
            "answer": "😕 Something went wrong. Please try again shortly.",
            "sources": [],
            "has_context": False
        }




@app.get("/api/admin/users")
async def list_admin_users(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    access_token = authorization.split(" ", 1)[1]
    supabase_user = await fetch_user_from_token(access_token)
    ensure_admin_email(supabase_user.get("email"))
    profiles = await fetch_all_profiles()
    return {"users": profiles}


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, authorization: Optional[str] = Header(default=None)):
    """Permanently delete a user account. Requires admin token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    access_token = authorization.split(" ", 1)[1]
    supabase_user = await fetch_user_from_token(access_token)
    ensure_admin_email(supabase_user.get("email"))
    await delete_user_by_id(user_id)
    return {"deleted": user_id}


@app.get("/api/admin/stats")
async def admin_stats(authorization: Optional[str] = Header(default=None)):
    """Return aggregate user stats for the admin dashboard."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    access_token = authorization.split(" ", 1)[1]
    supabase_user = await fetch_user_from_token(access_token)
    ensure_admin_email(supabase_user.get("email"))
    stats = await fetch_admin_stats()
    return stats
@app.get("/api/admin/experiments")
async def list_admin_experiments(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    access_token = authorization.split(" ", 1)[1]
    supabase_user = await fetch_user_from_token(access_token)
    ensure_admin_email(supabase_user.get("email"))
    exps = await fetch_all_experiments()
    return {"experiments": exps}


@app.get("/api/admin/activity")
async def admin_user_activity(authorization: Optional[str] = Header(default=None)):
    """Return saved_experiments rows with user name/institute for activity tab."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    access_token = authorization.split(" ", 1)[1]
    supabase_user = await fetch_user_from_token(access_token)
    ensure_admin_email(supabase_user.get("email"))
    rows = await fetch_user_activity()
    return {"activity": rows}


@app.patch("/api/admin/experiments/{exp_id}")
async def admin_update_experiment(exp_id: str, payload: Dict[str, Any], authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    access_token = authorization.split(" ", 1)[1]
    supabase_user = await fetch_user_from_token(access_token)
    ensure_admin_email(supabase_user.get("email"))
    updated = await update_experiment_in_db(exp_id, payload)
    return {"updated": updated}
