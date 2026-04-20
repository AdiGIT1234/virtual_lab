import { useState, useRef, useCallback } from 'react';
import { PeripheralSimulator } from './PeripheralSimulator';

// ─── Arduino C++ → async JS transpiler ────────────────────────────────────────

function extractFunctionBody(code, funcName) {
  const pattern = new RegExp(`void\\s+${funcName}\\s*\\(\\s*\\)\\s*\\{`);
  const match = pattern.exec(code);
  if (!match) return '';

  let depth = 1;
  let i = match.index + match[0].length;
  const start = i;

  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }

  return code.slice(start, i - 1);
}

const TYPE_STRIP = /\b(?:const\s+)?(?:unsigned\s+(?:int|long)|int|long|float|double|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)/g;
const BOOL_STRIP = /\bbool\s+(\w+)/g;
const CHAR_STRIP = /\bchar\s+(\w+)/g;
const STRING_STRIP = /\bString\s+(\w+)/g;

function stripTypes(code) {
  return code
    .replace(TYPE_STRIP, 'let $1')
    .replace(BOOL_STRIP, 'let $1')
    .replace(CHAR_STRIP, 'let $1')
    .replace(STRING_STRIP, 'let $1')
    .replace(/\bconst\s+let\b/g, 'const');
}

function applyApiSubs(code) {
  let js = code;

  // Serial
  js = js.replace(/Serial\.println\s*\(([^;]*?)\)/g, '__serialPrint($1, true)');
  js = js.replace(/Serial\.print\s*\(([^;]*?)\)/g, '__serialPrint($1, false)');
  js = js.replace(/Serial\.begin\s*\([^)]*\)/g, '0');

  // GPIO
  js = js.replace(/digitalWrite\s*\(([^,]+),\s*([^)]+)\)/g, '__digitalWrite($1, $2)');
  js = js.replace(/digitalRead\s*\(([^)]+)\)/g, '__digitalRead($1)');
  js = js.replace(/analogWrite\s*\(([^,]+),\s*([^)]+)\)/g, '__analogWrite($1, $2)');
  js = js.replace(/analogRead\s*\(([^)]+)\)/g, '__analogRead($1)');

  // ESP32-specific
  js = js.replace(/ledcAttach\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, '__ledcAttach($1, $2, $3)');
  js = js.replace(/ledcWrite\s*\(([^,]+),\s*([^)]+)\)/g, '__ledcWrite($1, $2)');
  js = js.replace(/dacWrite\s*\(([^,]+),\s*([^)]+)\)/g, '__dacWrite($1, $2)');
  js = js.replace(/touchRead\s*\(([^)]+)\)/g, '__touchRead($1)');

  // Timing — must come before any other delay-bearing substitutions
  js = js.replace(/delayMicroseconds\s*\(([^)]+)\)/g, 'await __delay(Math.max(0,($1)/1000))');
  js = js.replace(/\bdelay\s*\(([^)]+)\)/g, 'await __delay($1)');
  js = js.replace(/millis\s*\(\)/g, '__millis()');
  js = js.replace(/micros\s*\(\)/g, '__micros()');

  // Pin modes
  js = js.replace(/pinMode\s*\(([^,]+),\s*([^)]+)\)/g, '__pinMode($1, $2)');

  // Constants
  js = js.replace(/\bHIGH\b/g, '1');
  js = js.replace(/\bLOW\b/g, '0');
  js = js.replace(/\bINPUT_PULLUP\b/g, '"INPUT_PULLUP"');
  js = js.replace(/\bINPUT\b/g, '"INPUT"');
  js = js.replace(/\bOUTPUT\b/g, '"OUTPUT"');

  // Strip C++ types inside function bodies
  js = stripTypes(js);

  // Add yield to loops so they don't block the event loop
  js = js.replace(/while\s*\(([^)]*)\)\s*\{/g, (_, cond) => `while (${cond}) { await __yield();`);
  js = js.replace(/for\s*\(([^)]*)\)\s*\{/g, (_, init) => `for (${init}) { await __yield();`);

  return js;
}

function transpileArduinoToJs(code) {
  // Strip comments
  const cleaned = code
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const setupBody = extractFunctionBody(cleaned, 'setup');
  const loopBody  = extractFunctionBody(cleaned, 'loop');

  // Global declarations: everything before setup/loop
  let globals = cleaned
    .replace(/void\s+setup\s*\(\s*\)[\s\S]*/, '')
    .trim();

  // Convert C++ global variable declarations to JS let/const
  globals = globals
    .replace(/\b(?:const\s+)?(?:unsigned\s+(?:int|long)|int|long|float|double|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\b(?:unsigned\s+(?:int|long)|int|long|float|double|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*;/g, 'let $1 = 0;')
    .replace(/\bbool\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\bbool\s+(\w+)\s*;/g, 'let $1 = false;')
    .replace(/\bchar\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\bString\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\bString\s+(\w+)\s*;/g, 'let $1 = "";')
    .replace(/\bconst\s+let\b/g, 'const')
    // Remove any leftover C++ function-like definitions (e.g. void helper() { ... })
    .replace(/void\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\}/g, '');

  return {
    globals,
    setupBody: applyApiSubs(setupBody),
    loopBody:  applyApiSubs(loopBody),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useESP32(_activeMcuId = "esp32") {
  const [cpuState, setCpuState]               = useState(null);
  const [isRunning, setIsRunning]             = useState(false);
  const [liveTimeline, setLiveTimeline]       = useState([]);
  const [speedMultiplier, setSpeedMultiplierState] = useState(1);
  const [activeBreakpoints, setActiveBreakpoints]  = useState([]);

  const speedRef       = useRef(1);
  const runningRef     = useRef(false);
  const gpioRef        = useRef(new Array(40).fill(0));
  const pwmRef         = useRef(new Array(40).fill(0));
  const inputsRef      = useRef({});
  const simTimeRef     = useRef(0);
  const wallStartRef   = useRef(0);

  // Playback fallback refs (for backend timeline mode)
  const playbackRef     = useRef(null);
  const timelineRef     = useRef([]);
  const playbackIdxRef  = useRef(0);

  // ── helpers ──────────────────────────────────────────────────────────────

  const pushSnapshot = useCallback((registers) => {
    setCpuState({ registers, pc: null, cycles: simTimeRef.current, memory: [], sp: 0 });
    setLiveTimeline(prev => {
      const next = [...prev, { time: simTimeRef.current, type: 'SNAPSHOT', registers }];
      if (next.length > 200) next.shift();
      return next;
    });
    // Dispatch to window for SandboxPage's setOutputsFromRegisters effect
    if (typeof window !== 'undefined') {
      window.__esp32Registers = registers;
    }
  }, []);

  const buildRegisters = useCallback(() => ({
    GPIO_OUT: [...gpioRef.current],
    PWM:      [...pwmRef.current],
  }), []);

  // ── Quantum JS Runtime ────────────────────────────────────────────────────

  const startQuantumRuntime = useCallback(async (code, inputs) => {
    gpioRef.current   = new Array(40).fill(0);
    pwmRef.current    = new Array(40).fill(0);
    inputsRef.current = { ...inputs };
    simTimeRef.current  = 0;
    wallStartRef.current = Date.now();

    const { globals, setupBody, loopBody } = transpileArduinoToJs(code);

    const shimEnv = {
      __digitalWrite(pin, val) {
        pin = parseInt(pin);
        if (isNaN(pin) || pin < 0 || pin > 39) return;
        gpioRef.current[pin] = val ? 1 : 0;
        pwmRef.current[pin]  = val ? 255 : 0;
        pushSnapshot(buildRegisters());
        PeripheralSimulator.cpuWriteFlatGPIO(gpioRef.current, simTimeRef.current);
      },
      __digitalRead(pin) {
        pin = parseInt(pin);
        return inputsRef.current[pin] ? 1 : 0;
      },
      __analogWrite(pin, val) {
        pin = parseInt(pin);
        if (isNaN(pin)) return;
        const duty = Math.max(0, Math.min(255, parseInt(val) || 0));
        pwmRef.current[pin]  = duty;
        gpioRef.current[pin] = duty > 0 ? 1 : 0;
        pushSnapshot(buildRegisters());
      },
      __analogRead(pin) {
        pin = parseInt(pin);
        const raw = inputsRef.current[pin];
        if (typeof raw === 'number') return Math.round(raw * 4095);
        return 2048;
      },
      __ledcAttach(pin, _freq, _resolution) { void pin; },
      __ledcWrite(pin, duty) {
        pin = parseInt(pin);
        if (isNaN(pin)) return;
        const normalized = Math.max(0, Math.min(255, parseInt(duty) || 0));
        pwmRef.current[pin]  = normalized;
        gpioRef.current[pin] = normalized > 0 ? 1 : 0;
        pushSnapshot(buildRegisters());
      },
      __dacWrite(pin, val) {
        pin = parseInt(pin);
        if (isNaN(pin)) return;
        const dacVal = Math.max(0, Math.min(255, parseInt(val) || 0));
        pwmRef.current[pin]  = dacVal;
        gpioRef.current[pin] = dacVal > 0 ? 1 : 0;
        pushSnapshot(buildRegisters());
      },
      __touchRead(pin) {
        return inputsRef.current[`touch_${parseInt(pin)}`] ?? 50;
      },
      __pinMode(_pin, _mode) {},
      __delay(ms) {
        simTimeRef.current += parseFloat(ms) || 0;
        const wallMs = (parseFloat(ms) || 0) / Math.max(0.1, speedRef.current);
        return new Promise(r => setTimeout(r, wallMs));
      },
      __yield() { return new Promise(r => setTimeout(r, 0)); },
      __millis() { return simTimeRef.current; },
      __micros() { return simTimeRef.current * 1000; },
      __serialPrint(val, newline) {
        const str = String(val ?? '') + (newline ? '\n' : '');
        if (typeof window !== 'undefined' && window.onSerialOutput) {
          window.onSerialOutput(str);
        }
      },
      Math, parseInt, parseFloat, String, Array, isNaN, Number, Object,
    };

    const shimKeys = Object.keys(shimEnv);
    const shimVals = Object.values(shimEnv);

    const script = `
"use strict";
${globals}

async function __setup() {
  ${setupBody}
}

async function __loop() {
  while (__isRunning()) {
    ${loopBody}
  }
}

return { __setup, __loop };
`;

    // eslint-disable-next-line no-new-func
    const factory = new Function(...shimKeys, '__isRunning', script);
    const { __setup, __loop } = factory(...shimVals, () => runningRef.current);

    await __setup();
    if (runningRef.current) {
      // Don't await — let the loop run in the background
      __loop().catch(err => {
        if (runningRef.current) console.warn('[Quantum Runtime] loop error:', err);
      });
    }
  }, [pushSnapshot, buildRegisters]);

  // ── Backend timeline fallback ─────────────────────────────────────────────

  const runPlayback = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || timeline.length === 0) return;

    const tick = () => {
      const idx = playbackIdxRef.current;
      if (idx >= timeline.length) {
        setIsRunning(false);
        return;
      }

      const step = timeline[idx];
      const registers = step?.registers || {};

      if (registers.GPIO_OUT) {
        PeripheralSimulator.cpuWriteFlatGPIO(registers.GPIO_OUT, step?.time || 0);
      }

      setCpuState({ registers, pc: null, cycles: step?.time || 0, memory: [], sp: 0 });
      setLiveTimeline(prev => {
        const next = [...prev, step];
        if (next.length > 200) next.shift();
        return next;
      });

      if (typeof window !== 'undefined') window.__esp32Registers = registers;

      playbackIdxRef.current += Math.max(1, Math.floor(speedRef.current));
      playbackRef.current = requestAnimationFrame(tick);
    };

    playbackRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Main entry point ──────────────────────────────────────────────────────

  const startSimulation = useCallback(async (codeOrHex, _initialRegisters = {}, inputs = {}, rawCode = null) => {
    // Stop previous run
    runningRef.current = false;
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
      playbackRef.current = null;
    }
    await new Promise(r => setTimeout(r, 30));

    const code = rawCode || codeOrHex;
    setLiveTimeline([]);

    try {
      runningRef.current = true;
      setIsRunning(true);
      await startQuantumRuntime(code, inputs);
      return { timeline: [], registers: buildRegisters() };
    } catch (err) {
      console.warn('[useESP32] Quantum runtime failed, falling back to backend:', err.message);
      runningRef.current = false;

      // Backend fallback
      try {
        const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || "http://127.0.0.1:8000";
        const response = await fetch(`${apiBase}/run-esp32`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, inputs, mcu: "esp32" }),
        });
        const data = await response.json();

        if (data.timeline && data.timeline.length > 0) {
          timelineRef.current     = data.timeline;
          playbackIdxRef.current  = 0;
          runningRef.current      = true;
          setIsRunning(true);
          runPlayback();
        } else if (data.registers) {
          setCpuState({ registers: data.registers, pc: null, cycles: 0, memory: [], sp: 0 });
        }

        return data;
      } catch (backendErr) {
        console.error('[useESP32] Backend fallback also failed:', backendErr);
        setIsRunning(false);
        throw backendErr;
      }
    }
  }, [startQuantumRuntime, buildRegisters, runPlayback]);

  const stopSimulation = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
      playbackRef.current = null;
    }
  }, []);

  const updateSpeedMultiplier = useCallback((value) => {
    speedRef.current = value;
    setSpeedMultiplierState(value);
  }, []);

  const updateBreakpoints = useCallback((list) => {
    setActiveBreakpoints(list);
  }, []);

  const setBreakpointHandler = useCallback((_handler) => {}, []);

  return {
    startSimulation,
    stopSimulation,
    isRunning,
    cpuState,
    liveTimeline,
    speedMultiplier,
    setSpeedMultiplier: updateSpeedMultiplier,
    activeBreakpoints,
    setBreakpoints: updateBreakpoints,
    setBreakpointHandler,
  };
}
