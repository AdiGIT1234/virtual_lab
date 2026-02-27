import { CPU, avrInstruction, AVRIOPort, portBConfig, AVRTimer, timer0Config } from 'avr8js';
import fs from 'fs';

const cpu = new CPU(new Uint16Array(100));
console.log("tick:", typeof cpu.tick);
console.log("execute:", typeof cpu.execute);
console.log("avrInstruction:", typeof avrInstruction);

// also let's check how AVRTimer gets ticked.
console.log("AVRTimer keys:", Object.keys(AVRTimer.prototype));
