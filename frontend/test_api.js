import { CPU, avrInstruction, AVRIOPort, AVRTimer } from 'avr8js';

const cpu = new CPU(new Uint16Array(100));
console.log("tick:", typeof cpu.tick);
console.log("execute:", typeof cpu.execute);
console.log("avrInstruction:", typeof avrInstruction);

// Also let's check how AVRIOPort gets mounted
console.log("AVRIOPort keys:", Object.keys(AVRIOPort.prototype));

// Check how AVRTimer gets ticked.
console.log("AVRTimer keys:", Object.keys(AVRTimer.prototype));
