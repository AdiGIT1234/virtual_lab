import { useState, useRef, useCallback } from 'react';
import { PeripheralSimulator } from './PeripheralSimulator';
import { API_BASE_URL } from '../lib/api';

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

function injectLoopYields(code) {
  const out = [];
  let i = 0;
  while (i < code.length) {
    const loopMatch = /^(while|for)\s*\(/.exec(code.slice(i));
    if (loopMatch) {
      out.push(loopMatch[0]);
      i += loopMatch[0].length;
      let depth = 1;
      while (i < code.length && depth > 0) {
        const ch = code[i];
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
        out.push(ch);
        i++;
      }
      // skip whitespace before '{'
      while (i < code.length && /\s/.test(code[i])) { out.push(code[i]); i++; }
      if (i < code.length && code[i] === '{') {
        out.push('{ await __yield();');
        i++;
        continue;
      }
    }
    out.push(code[i]);
    i++;
  }
  return out.join('');
}

function applyApiSubs(code) {
  let js = code;

  // Strip library includes — handled by shims
  js = js.replace(/^\s*#include\s*[<"][^>"]*[>"]\s*$/gm, '');

  // Strip class instantiations for known display libraries, replaced by shim factories
  // Handles both: `Adafruit_SSD1306 d(args)` and `Adafruit_SSD1306 d = Adafruit_SSD1306(args)`
  js = js.replace(/Adafruit_SSD1306\s+(\w+)\s*(?:=\s*Adafruit_SSD1306\s*)?\([^)]*\)\s*;/g, 'let $1 = __makeAdafruitSSD1306();');
  js = js.replace(/Adafruit_ILI9341\s+(\w+)\s*(?:=\s*Adafruit_ILI9341\s*)?\([^)]*\)\s*;/g, 'let $1 = __makeAdafruitILI9341();');
  // Strip #define constants for display libs
  js = js.replace(/#define\s+\w+\s+[^\n]+/g, '');

  // Wire (I2C) → shim calls
  js = js.replace(/Wire\.begin\s*\([^)]*\)/g, '__wireBegin()');
  js = js.replace(/Wire\.beginTransmission\s*\(([^)]+)\)/g, '__wireBeginTransmission($1)');
  js = js.replace(/Wire\.write\s*\(([^)]+)\)/g, '__wireWrite($1)');
  js = js.replace(/Wire\.endTransmission\s*\([^)]*\)/g, '__wireEndTransmission()');
  js = js.replace(/Wire\.requestFrom\s*\(([^,]+),\s*([^)]+)\)/g, '__wireRequestFrom($1, $2)');
  js = js.replace(/Wire\.read\s*\(\)/g, '__wireRead()');
  js = js.replace(/Wire\.available\s*\(\)/g, '__wireAvailable()');
  js = js.replace(/Wire\.setClock\s*\([^)]*\)/g, '0');

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

  // Add yield to loops so they don't block the event loop.
  // Uses paren-counting so function calls in conditions (e.g. while (digitalRead(x) == LOW))
  // are handled correctly instead of breaking on the first ')'.
  js = injectLoopYields(js);

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

  // ── Strip C++ directives that can't be JS ──────────────────────────────────
  globals = globals
    .replace(/^\s*#include\s*[<"][^>"]*[>"]\s*$/gm, '')   // strip all #includes
    .replace(/#define\s+\w+\s+[^\n]+/g, '');              // strip #defines

  // ── Replace Adafruit class instantiations with shim factories ─────────────
  globals = globals
    .replace(/Adafruit_SSD1306\s+(\w+)\s*(?:=\s*Adafruit_SSD1306\s*)?\([^)]*\)\s*;/g, 'let $1 = __makeAdafruitSSD1306();')
    .replace(/Adafruit_ILI9341\s+(\w+)\s*(?:=\s*Adafruit_ILI9341\s*)?\([^)]*\)\s*;/g, 'let $1 = __makeAdafruitILI9341();');

  // ── Transpile C++ helper function definitions → JS functions ──────────────
  // Handles: void|int|float|... funcName(type arg, ...) { body }
  const CPP_ARG_TYPES = /\b(?:const\s+)?(?:unsigned\s+)?(?:int|long|float|double|bool|boolean|void|char|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|String)\s*\*?\s*/g;
  globals = globals.replace(
    /\b(?:void|int|long|float|double|bool|uint\w*|int\w*|byte|char)\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (_, name, args) => `function ${name}(${args.replace(CPP_ARG_TYPES, '').replace(/,\s*,/g, ',').trim()}) {`
  );

  // ── Apply remaining api substitutions to helper function bodies ───────────
  // (Wire.*, Serial.*, delays inside helper functions in globals)
  globals = applyApiSubs(globals);

  // ── Convert C++ global variable declarations to JS let/const ──────────────
  globals = globals
    .replace(/\b(?:const\s+)?(?:unsigned\s+(?:int|long)|int|long|float|double|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\b(?:unsigned\s+(?:int|long)|int|long|float|double|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+(\w+)\s*;/g, 'let $1 = 0;')
    .replace(/\bbool\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\bbool\s+(\w+)\s*;/g, 'let $1 = false;')
    .replace(/\bchar\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\bString\s+(\w+)\s*=\s*([^;]+);/g, 'let $1 = $2;')
    .replace(/\bString\s+(\w+)\s*;/g, 'let $1 = "";')
    .replace(/\bconst\s+let\b/g, 'const');

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
        if (typeof raw === 'number') return Math.round((raw / 10000) * 4095);
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
        // Push into liveTimeline so SerialMonitor can display it
        setLiveTimeline(prev => {
          const next = [...prev, { time: simTimeRef.current, type: 'SERIAL_PRINT', message: str }];
          if (next.length > 200) next.shift();
          return next;
        });
      },
      // ── Wire (I2C) shims → PeripheralSimulator ───────────────────────────
      __wireBegin() {},
      __wireBeginTransmission(addr) {
        PeripheralSimulator.onTWIConnect(parseInt(addr), true, simTimeRef.current);
      },
      __wireWrite(val) {
        PeripheralSimulator.onTWIByte(parseInt(val) & 0xFF, simTimeRef.current);
      },
      __wireEndTransmission() {},
      __wireRequestFrom(_addr, _len) { return 0; },
      __wireRead() { return 0; },
      __wireAvailable() { return 0; },

      // ── Adafruit_SSD1306 shim (128×64 OLED) ─────────────────────────────
      __makeAdafruitSSD1306() {
        const BUF = new Uint8Array(1024); // 128×8-page pixel buffer
        let cx = 0, cy = 0, textSz = 1, color = 1;
        const CHAR_W = 6, CHAR_H = 8;

        // Minimal 5×7 ASCII font (printable chars 32–126), stored as 5 column bytes
        // Each byte = 8 pixels top-to-bottom, LSB at top
        const FONT5X7 = {
          32:[0,0,0,0,0],33:[0,0,95,0,0],34:[0,7,0,7,0],35:[20,127,20,127,20],
          36:[36,42,127,42,18],37:[35,19,8,100,98],38:[54,73,85,34,80],39:[0,5,3,0,0],
          40:[0,28,34,65,0],41:[0,65,34,28,0],42:[20,8,62,8,20],43:[8,8,62,8,8],
          44:[0,80,48,0,0],45:[8,8,8,8,8],46:[0,96,96,0,0],47:[32,16,8,4,2],
          48:[62,81,73,69,62],49:[0,66,127,64,0],50:[66,97,81,73,70],51:[33,65,73,77,51],
          52:[24,20,18,127,16],53:[39,69,69,69,57],54:[60,74,73,73,48],55:[1,113,9,5,3],
          56:[54,73,73,73,54],57:[6,73,73,41,30],58:[0,54,54,0,0],59:[0,86,54,0,0],
          60:[8,20,34,65,0],61:[20,20,20,20,20],62:[0,65,34,20,8],63:[2,1,81,9,6],
          64:[62,65,93,89,14],65:[126,9,9,9,126],66:[127,73,73,73,54],67:[62,65,65,65,34],
          68:[127,65,65,34,28],69:[127,73,73,73,65],70:[127,9,9,9,1],71:[62,65,65,73,122],
          72:[127,8,8,8,127],73:[0,65,127,65,0],74:[32,64,65,63,1],75:[127,8,20,34,65],
          76:[127,64,64,64,64],77:[127,2,12,2,127],78:[127,4,8,16,127],79:[62,65,65,65,62],
          80:[127,9,9,9,6],81:[62,65,81,33,94],82:[127,9,25,41,70],83:[38,73,73,73,50],
          84:[1,1,127,1,1],85:[63,64,64,64,63],86:[31,32,64,32,31],87:[63,64,56,64,63],
          88:[99,20,8,20,99],89:[7,8,112,8,7],90:[97,81,73,69,67],91:[0,127,65,65,0],
          92:[2,4,8,16,32],93:[0,65,65,127,0],94:[4,2,1,2,4],95:[64,64,64,64,64],
          96:[0,1,2,4,0],97:[32,84,84,84,120],98:[127,68,68,68,56],99:[56,68,68,68,32],
          100:[56,68,68,68,127],101:[56,84,84,84,24],102:[0,8,126,9,2],103:[24,164,164,164,124],
          104:[127,8,4,4,120],105:[0,68,125,64,0],106:[32,64,68,61,0],107:[127,16,40,68,0],
          108:[0,65,127,64,0],109:[124,4,24,4,120],110:[124,8,4,4,120],111:[56,68,68,68,56],
          112:[252,36,36,36,24],113:[24,36,36,36,252],114:[124,8,4,4,8],115:[72,84,84,84,36],
          116:[4,63,68,64,32],117:[60,64,64,32,124],118:[28,32,64,32,28],119:[60,64,48,64,60],
          120:[68,40,16,40,68],121:[4,136,144,96,60],122:[68,100,84,76,68],
          123:[0,8,54,65,0],124:[0,0,127,0,0],125:[0,65,54,8,0],126:[2,1,2,4,2],
        };

        function drawChar(ch) {
          const code = ch.charCodeAt(0);
          const cols = FONT5X7[code] || FONT5X7[63];
          for (let col = 0; col < 5; col++) {
            let colData = cols[col];
            for (let row = 0; row < 8; row++) {
              const bit = (colData >> row) & 1;
              if (!bit) continue;
              for (let sy = 0; sy < textSz; sy++) {
                for (let sx = 0; sx < textSz; sx++) {
                  const px = cx + col * textSz + sx;
                  const py = cy + row * textSz + sy;
                  if (px >= 128 || py >= 64) continue;
                  const page = py >> 3, bit2 = py & 7;
                  const idx = page * 128 + px;
                  if (color) BUF[idx] |= (1 << bit2);
                  else BUF[idx] &= ~(1 << bit2);
                }
              }
            }
          }
          cx += CHAR_W * textSz;
          if (cx >= 128) { cx = 0; cy += CHAR_H * textSz; }
        }

        function drawStr(s) { for (const ch of String(s)) { if (ch === '\n') { cx=0; cy += CHAR_H*textSz; } else drawChar(ch); } }

        return {
          begin(_sw, _addr) {},
          clearDisplay() { BUF.fill(0); cx=0; cy=0; },
          display() { PeripheralSimulator._oledPush(BUF); },
          setTextSize(s) { textSz = Math.max(1, parseInt(s)||1); },
          setTextColor(c) { color = c ? 1 : 0; },
          setCursor(x, y) { cx = parseInt(x)||0; cy = parseInt(y)||0; },
          print(v, digits=2) { drawStr(typeof v==='number'&&!Number.isInteger(v) ? v.toFixed(digits) : String(v??'')); },
          println(v='', digits=2) { drawStr(typeof v==='number'&&!Number.isInteger(v) ? v.toFixed(digits) : String(v??'')); cx=0; cy += CHAR_H*textSz; },
          drawRect(x,y,w,h,c) {
            for(let i=x;i<x+w;i++){setPixel(i,y,c);setPixel(i,y+h-1,c);}
            for(let i=y;i<y+h;i++){setPixel(x,i,c);setPixel(x+w-1,i,c);}
          },
          fillRect(x,y,w,h,c) { for(let px=x;px<x+w;px++)for(let py=y;py<y+h;py++)setPixel(px,py,c); },
        };
        function setPixel(px,py,c) {
          if(px<0||px>=128||py<0||py>=64)return;
          const page=py>>3, bit=py&7, idx=page*128+px;
          if(c)BUF[idx]|=(1<<bit); else BUF[idx]&=~(1<<bit);
        }
      },

      // ── Adafruit_ILI9341 shim (240×320 TFT) ─────────────────────────────
      __makeAdafruitILI9341() {
        const BUF = new Uint16Array(240 * 320);
        let cx = 0, cy = 0, textSz = 1, textColor = 0xFFFF, bgColor = 0x0000;
        const CHAR_W = 6, CHAR_H = 8;

        // Full printable ASCII 32-126 (same as SSD1306 shim)
        const FONT5X7 = {
          32:[0,0,0,0,0],33:[0,0,95,0,0],34:[0,7,0,7,0],35:[20,127,20,127,20],
          36:[36,42,127,42,18],37:[35,19,8,100,98],38:[54,73,85,34,80],39:[0,5,3,0,0],
          40:[0,28,34,65,0],41:[0,65,34,28,0],42:[20,8,62,8,20],43:[8,8,62,8,8],
          44:[0,80,48,0,0],45:[8,8,8,8,8],46:[0,96,96,0,0],47:[32,16,8,4,2],
          48:[62,81,73,69,62],49:[0,66,127,64,0],50:[66,97,81,73,70],51:[33,65,73,77,51],
          52:[24,20,18,127,16],53:[39,69,69,69,57],54:[60,74,73,73,48],55:[1,113,9,5,3],
          56:[54,73,73,73,54],57:[6,73,73,41,30],58:[0,54,54,0,0],59:[0,86,54,0,0],
          60:[8,20,34,65,0],61:[20,20,20,20,20],62:[0,65,34,20,8],63:[2,1,81,9,6],
          64:[62,65,93,89,14],65:[126,9,9,9,126],66:[127,73,73,73,54],67:[62,65,65,65,34],
          68:[127,65,65,34,28],69:[127,73,73,73,65],70:[127,9,9,9,1],71:[62,65,65,73,122],
          72:[127,8,8,8,127],73:[0,65,127,65,0],74:[32,64,65,63,1],75:[127,8,20,34,65],
          76:[127,64,64,64,64],77:[127,2,12,2,127],78:[127,4,8,16,127],79:[62,65,65,65,62],
          80:[127,9,9,9,6],81:[62,65,81,33,94],82:[127,9,25,41,70],83:[38,73,73,73,50],
          84:[1,1,127,1,1],85:[63,64,64,64,63],86:[31,32,64,32,31],87:[63,64,56,64,63],
          88:[99,20,8,20,99],89:[7,8,112,8,7],90:[97,81,73,69,67],91:[0,127,65,65,0],
          92:[2,4,8,16,32],93:[0,65,65,127,0],94:[4,2,1,2,4],95:[64,64,64,64,64],
          96:[0,1,2,4,0],97:[32,84,84,84,120],98:[127,68,68,68,56],99:[56,68,68,68,32],
          100:[56,68,68,68,127],101:[56,84,84,84,24],102:[0,8,126,9,2],103:[24,164,164,164,124],
          104:[127,8,4,4,120],105:[0,68,125,64,0],106:[32,64,68,61,0],107:[127,16,40,68,0],
          108:[0,65,127,64,0],109:[124,4,24,4,120],110:[124,8,4,4,120],111:[56,68,68,68,56],
          112:[252,36,36,36,24],113:[24,36,36,36,252],114:[124,8,4,4,8],115:[72,84,84,84,36],
          116:[4,63,68,64,32],117:[60,64,64,32,124],118:[28,32,64,32,28],119:[60,64,48,64,60],
          120:[68,40,16,40,68],121:[4,136,144,96,60],122:[68,100,84,76,68],
          123:[0,8,54,65,0],124:[0,0,127,0,0],125:[0,65,54,8,0],126:[2,1,2,4,2],
        };

        function rgb565(r,g,b){return((r&0xF8)<<8)|((g&0xFC)<<3)|(b>>3);}
        const ILI9341_BLACK=0x0000,ILI9341_WHITE=0xFFFF,ILI9341_RED=rgb565(255,0,0),
              ILI9341_GREEN=rgb565(0,255,0),ILI9341_BLUE=rgb565(0,0,255),
              ILI9341_CYAN=rgb565(0,255,255),ILI9341_YELLOW=rgb565(255,255,0);

        function setPixel(x,y,c){if(x>=0&&x<240&&y>=0&&y<320)BUF[y*240+x]=c;}

        function drawChar(ch,c){
          const code=ch.charCodeAt(0);
          const cols=(FONT5X7[code]||FONT5X7[63]||[0,0,0,0,0]);
          for(let col=0;col<5;col++){
            const colData=cols[col]||0;
            for(let row=0;row<8;row++){
              const bit=(colData>>row)&1;
              for(let sy=0;sy<textSz;sy++)for(let sx=0;sx<textSz;sx++)
                setPixel(cx+col*textSz+sx, cy+row*textSz+sy, bit?c:bgColor);
            }
          }
          cx+=CHAR_W*textSz;
        }
        function drawStr(s,c){for(const ch of String(s)){if(ch==='\n'){cx=0;cy+=CHAR_H*textSz;}else drawChar(ch,c);}}

        let rot=0;
        return {
          begin(){},
          setRotation(r){rot=parseInt(r)||0;},
          fillScreen(c){BUF.fill(parseInt(c)||0); PeripheralSimulator._tftPush(BUF);},
          fillRect(x,y,w,h,c){c=parseInt(c)||0;for(let px=x;px<x+w;px++)for(let py=y;py<y+h;py++)setPixel(px,py,c);PeripheralSimulator._tftPush(BUF);},
          drawRect(x,y,w,h,c){c=parseInt(c)||0;for(let i=x;i<x+w;i++){setPixel(i,y,c);setPixel(i,y+h-1,c);}for(let i=y;i<y+h;i++){setPixel(x,i,c);setPixel(x+w-1,i,c);}PeripheralSimulator._tftPush(BUF);},
          setCursor(x,y){cx=parseInt(x)||0;cy=parseInt(y)||0;},
          setTextColor(c,bg){textColor=parseInt(c)||0xFFFF;bgColor=bg!==undefined?parseInt(bg)||0:0;},
          setTextSize(s){textSz=Math.max(1,parseInt(s)||1);},
          print(v,digits=2){drawStr(typeof v==='number'&&!Number.isInteger(v)?v.toFixed(digits):String(v??''),textColor);PeripheralSimulator._tftPush(BUF);},
          println(v='',digits=2){drawStr(typeof v==='number'&&!Number.isInteger(v)?v.toFixed(digits):String(v??''),textColor);cx=0;cy+=CHAR_H*textSz;PeripheralSimulator._tftPush(BUF);},
          // expose ILI9341 color constants as shim properties
          ILI9341_BLACK,ILI9341_WHITE,ILI9341_RED,ILI9341_GREEN,ILI9341_BLUE,
          ILI9341_CYAN,ILI9341_YELLOW,
        };
      },

      // ILI9341 color constants referenced as bare identifiers in Arduino code
      ILI9341_BLACK: 0x0000, ILI9341_WHITE: 0xFFFF,
      ILI9341_RED:   0xF800, ILI9341_GREEN: 0x07E0, ILI9341_BLUE: 0x001F,
      ILI9341_CYAN:  0x07FF, ILI9341_YELLOW: 0xFFE0, ILI9341_MAGENTA: 0xF81F,
      ILI9341_ORANGE: 0xFD20,
      // SSD1306 constants
      SSD1306_WHITE: 1, SSD1306_BLACK: 0, SSD1306_INVERSE: 2,
      SSD1306_SWITCHCAPVCC: 2,

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
    await __yield();
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
        const response = await fetch(`${API_BASE_URL}/run-esp32`, {
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

  const setLiveInput = useCallback((pin, normalizedValue) => {
    inputsRef.current[pin] = normalizedValue;
    inputsRef.current[String(pin)] = normalizedValue;
  }, []);

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
    setLiveInput,
  };
}
