<div align="center">

<br/>

```
 ███████╗███╗   ███╗██████╗ ███████╗██████╗ ███████╗██╗  ██╗
 ██╔════╝████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔════╝╚██╗██╔╝
 █████╗  ██╔████╔██║██████╔╝█████╗  ██║  ██║█████╗   ╚███╔╝ 
 ██╔══╝  ██║╚██╔╝██║██╔══██╗██╔══╝  ██║  ██║██╔══╝   ██╔██╗ 
 ███████╗██║ ╚═╝ ██║██████╔╝███████╗██████╔╝███████╗██╔╝ ██╗
 ╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝
          V I R T U A L   L A B   ·   E D U C A T I O N
```

**Simulate real embedded hardware in your browser.**  
No soldering iron. No oscilloscope. No hardware required.

<br/>

[![Live Demo](https://img.shields.io/badge/▶_LIVE_DEMO-virtual--lab--zeta--six.vercel.app-00F2FF?style=for-the-badge&logoColor=black)](https://virtual-lab-zeta-six.vercel.app)

<br/>

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)

<br/>

| 🧪 Experiments | 🔌 Components | 📋 Circuit Presets | 🤖 MCUs |
|:-:|:-:|:-:|:-:|
| **15** | **100+** | **16** | **2** |
| ATmega328P labs | Sensors, displays, motors | Ready-to-run circuits | Arduino Uno + ESP32 |

</div>

---

## What is this?

Embedex Virtual Lab is a **browser-based embedded systems simulator** built for engineering students. You write real AVR/Arduino C code, hit Run, and watch the simulation execute live — register states update, LEDs glow, servos sweep, and serial output streams in real time.

No hardware, no setup, no compromise.

```
 You write this:                     You see this:
 ────────────────────                ─────────────────────────────────
 void setup() {                      [Pin 13 LED glowing green]
   pinMode(13, OUTPUT);              [PORTB register: bit 5 = 1]
 }                                   [PWM waveform on logic analyzer]
 void loop() {                       [Serial monitor: "Hello AVR!"]
   digitalWrite(13, HIGH);
   delay(500);
   digitalWrite(13, LOW);
   delay(500);
 }
```

---

## Features

### ⚡ True AVR Simulation
Your code compiles with **real avr-gcc** and runs on an **avr8js** CPU emulator — not a software approximation. Timer interrupts, USART, SPI, I2C, ADC, EEPROM, Watchdog — all wired to real ATmega328P hardware registers.

### 🔌 Visual Wiring Sandbox
Drag components onto a workplane, click any Arduino or ESP32 pin, and drag a wire to any component terminal. The circuit solves resistance networks, propagates logic levels, and drives component visuals in real time.

```
MCU pin → Resistor → LED   ←  LED dims proportionally to PWM duty cycle
MCU pin → Servo            ←  Shaft sweeps to exact angle from OCR1A value
MCU pin → 7-Segment        ←  Displays the digit your code writes to PORTD
```

### 🧊 3D ARLab
Switch from the 2D sandbox to a full 3D lab view powered by Three.js. Components appear as accurate 3D models on a breadboard. Wires route in 3D space between component pins.

### 🤖 Embedex AI — Socratic Tutor
The built-in chatbot **refuses to give you the answer**. It gives hints one register at a time, asks what you've tried, and guides you toward the solution. Powered by Groq (llama-3.1-8b-instant) + ChromaDB RAG over ATmega328P and ESP32 datasheets.

> **Student:** "Give me the code for LED blinking"  
> **Embedex:** "What have you tried so far? Which register controls pin direction on Port B?"

### 📚 15 Structured Experiments
Each experiment has Theory → Pre-Test → Procedure → Code → Simulation → Post-Test. Code is **locked by default**. Score **10/10 on the pre-test** to unlock the solution. The chatbot gives hints in between.

| Level | Experiment | Concepts |
|-------|-----------|---------|
| 1 | LED Blinking | DDRx, PORTx, `_delay_ms` |
| 2 | Push Button & Debouncing | PINx, pull-ups, debounce |
| 3 | 7-Segment Display | Port masking, lookup tables |
| 4 | External Interrupts | INT0/INT1, EICRA, EIMSK, ISR |
| 5 | Timer0 Normal Mode | TCCR0B, TIMSK0, overflow ISR |
| 6 | Timer1 CTC Mode | OCR1A, WGM12, 1Hz precision |
| 7 | Fast PWM / LED Fade | Timer0 Fast PWM, OCR0A |
| 8 | Phase Correct PWM | Timer1, ICR1, servo control |
| 9 | ADC Polling | ADMUX, ADCSRA, 10-bit reads |
| 10 | UART Transmit | UBRR0, UCSR0B, UDR0 |
| 11 | UART Receive (ISR) | RXCIE0, echo pattern |
| 12 | SPI Master | SPCR, SPDR, SPIF |
| 13 | I²C / TWI Master | TWBR, TWCR, START/STOP |
| 14 | EEPROM Read/Write | `eeprom_read_byte`, persistent data |
| 15 | Watchdog Timer | `wdt_enable`, WDTO_2S, safe reset |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌─────────────┐  │
│  │  React / Vite│   │   avr8js     │  │  Three.js   │  │
│  │  Sandbox UI  │──▶│  AVR CPU     │  │  3D ARLab   │  │
│  │  Wiring      │   │  Emulator    │  │             │  │
│  │  Components  │   │  (WASM)      │  │             │  │
│  └──────┬───────┘   └──────────────┘  └─────────────┘  │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │ fetch (compile + validate)
          ▼
┌─────────────────────────────────────────────────────────┐
│                  RENDER (FastAPI + Docker)               │
│                                                         │
│  ┌───────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  avr-gcc      │  │  RAG Engine │  │  Admin API   │  │
│  │  Compiler     │  │  Groq +     │  │  Supabase    │  │
│  │  (native)     │  │  ChromaDB   │  │  queries     │  │
│  └───────────────┘  └─────────────┘  └──────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                     SUPABASE                            │
│   profiles · experiments · saved_experiments            │
│   quiz_attempts · feedback · chat_sessions              │
└─────────────────────────────────────────────────────────┘
```

**Key design decision:** The browser runs the actual simulation (avr8js). The backend only compiles code to hex and handles authentication/persistence. This means zero simulation latency after compile.

---

## Getting Started

### Option A — One command (Docker)

```bash
git clone https://github.com/AdiGIT1234/virtual_lab.git
cd virtual_lab

# Copy and fill in environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up
```

→ Frontend: http://localhost:5173  
→ Backend: http://localhost:8000

### Option B — Manual setup

**Prerequisites:** Node.js 18+, Python 3.12+, avr-gcc

```bash
git clone https://github.com/AdiGIT1234/virtual_lab.git
cd virtual_lab

# Start everything
./start.sh
```

Or separately:

```bash
# Terminal 1 — Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### `frontend/.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000        # backend URL
```

### `backend/.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-key               # for AI chatbot
ADMIN_EMAILS=your@email.com              # comma-separated admin emails
FRONTEND_ORIGINS=http://localhost:5173   # CORS allowed origins
ENV=development                          # set to "production" to disable /docs
```

> **Get keys:** [Supabase Dashboard](https://supabase.com) → Project Settings → API  
> **Get Groq key:** [console.groq.com](https://console.groq.com) — free tier is sufficient

---

## Database Setup

Run these three SQL migrations **in order** in the Supabase SQL editor:

```
backend/migrations/003_base_tables.sql   ← run FIRST (profiles, saved_experiments)
backend/migrations/001_quiz_and_progress.sql
backend/migrations/002_feedback.sql
```

Then run these two targeted queries to enable admin features:

```sql
-- Required for upsert to work
ALTER TABLE public.saved_experiments
  ADD CONSTRAINT IF NOT EXISTS saved_experiments_user_exp_unique
  UNIQUE (user_id, experiment_id);

-- Required for admin activity/feedback tabs
DROP POLICY IF EXISTS "profiles_service_read" ON public.profiles;
CREATE POLICY "profiles_service_read"
  ON public.profiles FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "saved_exp_service_read" ON public.saved_experiments;
CREATE POLICY "saved_exp_service_read"
  ON public.saved_experiments FOR SELECT TO service_role USING (true);
```

---

## RAG / AI Setup (optional but recommended)

The chatbot works without datasheets but gives much better answers with them.

```bash
cd backend

# 1. Place PDF datasheets in data/datasheets/
#    - ATmega328P datasheet (atmega.pdf)
#    - ESP32 technical reference (esp32.pdf)
#    The experiment hint codes are already included (lab_experiment_codes.txt)

# 2. Run ingestion (builds the ChromaDB vector store)
source venv/bin/activate
python -m rag.ingest

# Output: ✅ INGESTION COMPLETE! — 1446 chunks stored
```

The RAG engine warms up automatically in a background thread when the server starts. First chatbot request is instant.

---

## Deployment

The project deploys automatically via the included `render.yaml`:

```yaml
# render.yaml — pushes to GitHub → auto-deploys to Render
runtime: docker          # full Ubuntu with avr-gcc
dockerfilePath: ./backend/Dockerfile
```

Frontend deploys to Vercel automatically on every push to `main`.

**Required Render environment variables** (set in Render Dashboard → Environment):
```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
GROQ_API_KEY, ADMIN_EMAILS, FRONTEND_ORIGINS, ENV=production
```

---

## Project Structure

```
virtual_lab/
├── frontend/                    # React + Vite
│   └── src/
│       ├── components/          # UI components
│       │   ├── ArduinoUnoBoard.jsx   # Interactive SVG board
│       │   ├── WiringCanvas.jsx      # Wire routing engine
│       │   ├── LibraryComponents.jsx # 100+ sensor/display components
│       │   └── arlab/               # Three.js 3D lab
│       ├── engine/              # Simulation engines
│       │   ├── useAVR.js            # ATmega328P (avr8js)
│       │   ├── useESP32.js          # ESP32 (JS interpreter)
│       │   └── PeripheralSimulator.js  # I2C/SPI/NeoPixel/LCD
│       ├── pages/               # Route pages
│       └── constants/           # MCU definitions, pin layouts
│
├── backend/                     # FastAPI + Python
│   ├── engine/                  # Python simulation engine
│   │   ├── compiler.py          # avr-gcc wrapper + Arduino mock
│   │   ├── gpio.py              # GPIO simulation
│   │   └── parser.py            # Arduino code parser
│   ├── rag/                     # AI chatbot
│   │   ├── ingest.py            # PDF → ChromaDB ingestion
│   │   └── query.py             # RAG query engine (Groq)
│   ├── services/
│   │   └── admin_portal.py      # Admin dashboard API
│   ├── data/
│   │   ├── experiments/         # 15 experiment JSON files
│   │   └── datasheets/          # PDF datasheets + hint codes
│   ├── migrations/              # Supabase SQL migrations
│   ├── main.py                  # FastAPI app
│   └── Dockerfile               # Docker build (includes avr-gcc)
│
├── docker-compose.yml           # Local dev orchestration
├── render.yaml                  # Render deployment config
└── start.sh                     # One-command local start
```

---

## API Reference

All backend endpoints — test at `http://localhost:8000/docs` in development.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server status + avr-gcc availability |
| `GET` | `/api/experiments` | List all 15 experiments |
| `GET` | `/api/experiments/{id}` | Full experiment with pretest/posttest |
| `POST` | `/run-experiment` | Compile + simulate ATmega328P code |
| `POST` | `/run-esp32` | Simulate ESP32 Arduino code |
| `POST` | `/api/chat` | RAG-powered chatbot (hint mode) |
| `POST` | `/api/feedback` | Submit experiment feedback |
| `GET` | `/api/admin/*` | Admin dashboard (requires auth token) |

---

## License & IP Notice

This repository is **source-available for reference only**.

- ❌ No forks, copies, or derivative works
- ❌ No pull requests — external contributions are not accepted at this time
- ❌ No commercial use
- ✅ You may read the code and run it locally for personal/educational use

All original source code, simulation logic, experiment content, and design is the intellectual property of the author. Patent pending.

---

<div align="center">

<br/>

**Built for students, by a student.**

*Embedex Virtual Lab is open source and free forever.*  
*If it helped you learn embedded systems, give it a ⭐*

<br/>

[![GitHub Stars](https://img.shields.io/github/stars/AdiGIT1234/virtual_lab?style=social)](https://github.com/AdiGIT1234/virtual_lab)

<br/>

`> SYSTEM INIT COMPLETE — AWAITING USER INPUT_`

</div>
