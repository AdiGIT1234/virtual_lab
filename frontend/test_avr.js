/* eslint-disable no-unused-vars */
import { CPU, avrInstruction, AVRIOPort, portBConfig } from 'avr8js';
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

for(let i=0; i<3000000; i++) {
  avrInstruction(cpu);
  if (i % 250000 === 0) console.log("Cycles:", cpu.cycles, "PORTB:", cpu.data[0x25]);
}
