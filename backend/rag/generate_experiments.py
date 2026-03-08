"""
Offline Experiment Content Generator
======================================
Uses the RAG engine to generate complete content for all 15 experiments.
Saves each experiment as a JSON file in backend/data/experiments/.

Usage:
    export GEMINI_API_KEY='your-key-here'
    python -m rag.generate_experiments
"""

import os
import json
import time
from dotenv import load_dotenv  # type: ignore

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from rag.query import RAGEngine  # type: ignore

EXPERIMENTS_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "experiments")

# All 15 experiments with their metadata
EXPERIMENTS = [
    {
        "id": "exp01_led_blinking",
        "topic": "LED Blinking using GPIO on ATmega328P",
        "details": {
            "difficulty": "Beginner",
            "pins_used": ["PB5 (Digital Pin 13)"],
            "registers": ["DDRB", "PORTB"],
            "concepts": ["GPIO output", "delay loops", "bit manipulation"]
        }
    },
    {
        "id": "exp02_push_button",
        "topic": "Push Button Reading and Debouncing on ATmega328P",
        "details": {
            "difficulty": "Beginner",
            "pins_used": ["PD2 (Digital Pin 2)", "PB5 (Digital Pin 13)"],
            "registers": ["DDRD", "PORTD", "PIND", "DDRB", "PORTB"],
            "concepts": ["GPIO input", "internal pull-up resistors", "debounce logic"]
        }
    },
    {
        "id": "exp03_seven_segment",
        "topic": "Driving a 7-Segment Display with ATmega328P",
        "details": {
            "difficulty": "Beginner",
            "pins_used": ["PD0-PD6 (Digital Pins 0-6)"],
            "registers": ["DDRD", "PORTD"],
            "concepts": ["look-up tables", "segment mapping", "multiplexing basics"]
        }
    },
    {
        "id": "exp04_external_interrupts",
        "topic": "External Interrupts INT0 and INT1 on ATmega328P",
        "details": {
            "difficulty": "Intermediate",
            "pins_used": ["PD2 (INT0)", "PD3 (INT1)", "PB5 (LED)"],
            "registers": ["EICRA", "EIMSK", "SREG"],
            "concepts": ["interrupt vectors", "ISR", "rising/falling edge", "sei()/cli()"]
        }
    },
    {
        "id": "exp05_hardware_timers",
        "topic": "Hardware Timers Timer0 and Timer1 in CTC mode on ATmega328P",
        "details": {
            "difficulty": "Intermediate",
            "pins_used": ["PB5 (OC1A output)"],
            "registers": ["TCCR0A", "TCCR0B", "OCR0A", "TCCR1A", "TCCR1B", "OCR1A", "TIMSK1"],
            "concepts": ["CTC mode", "prescaler", "timer overflow", "output compare"]
        }
    },
    {
        "id": "exp06_pwm",
        "topic": "PWM signal generation and LED fading on ATmega328P",
        "details": {
            "difficulty": "Intermediate",
            "pins_used": ["PD6 (OC0A)", "PD5 (OC0B)", "PB1 (OC1A)"],
            "registers": ["TCCR0A", "TCCR0B", "OCR0A", "OCR0B", "TCCR1A", "TCCR1B", "OCR1A"],
            "concepts": ["Fast PWM", "Phase Correct PWM", "duty cycle", "analogWrite"]
        }
    },
    {
        "id": "exp07_adc_potentiometer",
        "topic": "Analog to Digital Conversion ADC with potentiometer on ATmega328P",
        "details": {
            "difficulty": "Upper Intermediate",
            "pins_used": ["PC0 (ADC0/A0)", "PB0-PB5 (LED bar)"],
            "registers": ["ADMUX", "ADCSRA", "ADCL", "ADCH"],
            "concepts": ["ADC channels", "reference voltage", "10-bit resolution", "free running mode"]
        }
    },
    {
        "id": "exp08_temperature_sensor",
        "topic": "LM35 Temperature Sensor reading via ADC on ATmega328P",
        "details": {
            "difficulty": "Upper Intermediate",
            "pins_used": ["PC0 (ADC0)", "PB5 (alarm LED)"],
            "registers": ["ADMUX", "ADCSRA", "ADCL", "ADCH"],
            "concepts": ["ADC voltage conversion", "temperature calibration", "threshold comparison"]
        }
    },
    {
        "id": "exp09_tone_generation",
        "topic": "Tone and square wave generation using timers on ATmega328P",
        "details": {
            "difficulty": "Upper Intermediate",
            "pins_used": ["PB1 (OC1A - buzzer)"],
            "registers": ["TCCR1A", "TCCR1B", "OCR1A"],
            "concepts": ["CTC mode with toggle", "frequency calculation", "musical notes"]
        }
    },
    {
        "id": "exp10_uart_serial",
        "topic": "UART Serial Communication USART on ATmega328P",
        "details": {
            "difficulty": "Advanced",
            "pins_used": ["PD0 (RXD)", "PD1 (TXD)"],
            "registers": ["UBRR0H", "UBRR0L", "UCSR0A", "UCSR0B", "UCSR0C", "UDR0"],
            "concepts": ["baud rate calculation", "frame format", "transmit/receive", "serial monitor"]
        }
    },
    {
        "id": "exp11_spi_shift_register",
        "topic": "SPI Communication with 74HC595 shift register on ATmega328P",
        "details": {
            "difficulty": "Advanced",
            "pins_used": ["PB3 (MOSI)", "PB5 (SCK)", "PB2 (SS)"],
            "registers": ["SPCR", "SPSR", "SPDR", "DDRB"],
            "concepts": ["SPI master mode", "shift register cascading", "clock polarity"]
        }
    },
    {
        "id": "exp12_i2c_twi",
        "topic": "I2C TWI Two Wire Interface protocol on ATmega328P",
        "details": {
            "difficulty": "Advanced",
            "pins_used": ["PC4 (SDA)", "PC5 (SCL)"],
            "registers": ["TWBR", "TWSR", "TWDR", "TWCR"],
            "concepts": ["START/STOP conditions", "address + R/W bit", "ACK/NACK", "clock stretching"]
        }
    },
    {
        "id": "exp13_dc_motor",
        "topic": "DC Motor speed and direction control using H-Bridge and PWM on ATmega328P",
        "details": {
            "difficulty": "Expert",
            "pins_used": ["PD6 (OC0A - PWM)", "PB0 (Direction A)", "PB1 (Direction B)"],
            "registers": ["TCCR0A", "TCCR0B", "OCR0A", "DDRB", "PORTB"],
            "concepts": ["H-Bridge logic", "PWM speed control", "motor braking", "direction switching"]
        }
    },
    {
        "id": "exp14_stepper_motor",
        "topic": "Stepper Motor control with step sequencing on ATmega328P",
        "details": {
            "difficulty": "Expert",
            "pins_used": ["PD4-PD7 (coil outputs)"],
            "registers": ["DDRD", "PORTD"],
            "concepts": ["full step sequence", "half step sequence", "state machine", "rotation speed"]
        }
    },
    {
        "id": "exp15_pid_control",
        "topic": "PID closed-loop control system on ATmega328P",
        "details": {
            "difficulty": "Expert",
            "pins_used": ["PC0 (ADC feedback)", "PD6 (PWM output)"],
            "registers": ["ADMUX", "ADCSRA", "TCCR0A", "OCR0A"],
            "concepts": ["proportional", "integral", "derivative", "error signal", "setpoint", "tuning"]
        }
    },
]


def generate_all_experiments():
    """Generate content for all experiments and save as JSON."""
    os.makedirs(EXPERIMENTS_DIR, exist_ok=True)
    
    print("=" * 60)
    print("  ATmega328P Virtual Lab — Experiment Content Generator")
    print("=" * 60)
    
    try:
        engine = RAGEngine()
    except ValueError as e:
        print(f"❌ {e}")
        return
    
    if engine.has_documents:
        print("✅ Vector DB found — generating RAG-grounded content")
    else:
        print("⚠️  No documents ingested — using Gemini's built-in knowledge")
        print("   (For better results, add datasheets and run: python -m rag.ingest)")
    
    successful = 0
    failed = 0
    
    for i, exp in enumerate(EXPERIMENTS):
        exp_id = exp["id"]
        output_path = os.path.join(EXPERIMENTS_DIR, f"{exp_id}.json")
        
        # Skip if already exists (use --force to regenerate)
        if os.path.exists(output_path):
            print(f"\n[{i+1}/15] ⏭️  {exp_id} — already exists, skipping")
            successful += 1
            continue
        
        print(f"\n[{i+1}/15] 🔄 Generating: {exp['topic']}...")
        
        try:
            content = engine.generate_experiment_content(exp["topic"], exp["details"])
            
            if content:
                # Ensure the ID matches
                content["id"] = exp_id
                
                with open(output_path, "w") as f:
                    json.dump(content, f, indent=2)
                
                print(f"         ✅ Saved to {exp_id}.json")
                successful += 1
            else:
                print(f"         ❌ Failed — no content returned")
                failed += 1
        except Exception as e:
            print(f"         ❌ Error: {e}")
            failed += 1
        
        # Rate limiting — respect Gemini free tier (15 RPM)
        if i < len(EXPERIMENTS) - 1:
            print("         ⏳ Waiting 5s (rate limit)...")
            time.sleep(5)
    
    print("\n" + "=" * 60)
    print(f"  DONE! ✅ {successful} succeeded, ❌ {failed} failed")
    print(f"  📁 Output: {os.path.abspath(EXPERIMENTS_DIR)}")
    print("=" * 60)


if __name__ == "__main__":
    generate_all_experiments()
