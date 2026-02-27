import { auto } from 'avr8js'; // Wait, auto doesn't exist
// Let's import CPU
import { CPU, AVRIOPort, portBConfig, AVRTimer, timer0Config } from 'avr8js';
import fs from 'fs';

function loadHex(source, target) {
  for (const line of source.split('\n')) {
    if (line[0] === ':' && line.substr(7, 2) === '00') {
      const bytes = parseInt(line.substr(1, 2), 16);
      const addr = parseInt(line.substr(3, 4), 16);
      for (let i = 0; i < bytes; i++) {
        target[addr + i] = parseInt(line.substr(9 + i * 2, 2), 16);
      }
    }
  }
}

const hex = fs.readFileSync('../backend/out.hex', 'utf8');
const cpu = new CPU(new Uint16Array(16384));
loadHex(hex, new Uint8Array(cpu.progBytes.buffer));
const portB = new AVRIOPort(cpu, portBConfig);
const timer0 = new AVRTimer(cpu, timer0Config); // Timer will listen to CPU ticks

let ticks = 0;
for(let i=0; i<3000000; i++) {
  // avrInstruction just executes instructions
  // Let's see if cpu.tick() works! Wait, cpu.tick doesn't exist? Earlier output: `[ ... ] function undefined undefined`
  // Ah! `console.log(Object.keys(cpu), typeof cpu.tick, typeof cpu.step, typeof cpu.execute)` -> `typeof cpu.tick` was `undefined`.
  // Wait, let's just log it.
}
console.log(typeof cpu.tick, typeof cpu.step, typeof cpu.execute, typeof cpu.tick);
