import { CPU, AVRIOPort, AVRTimer, portBConfig, timer0Config } from "avr8js";
import fs from "fs";

const PROGRAM_WORDS = 16384;
const HEX_PATH = new URL("../backend/out.hex", import.meta.url);

function loadHex(source, target) {
  for (const line of source.split("\n")) {
    if (line[0] === ":" && line.substr(7, 2) === "00") {
      const bytes = parseInt(line.substr(1, 2), 16);
      const addr = parseInt(line.substr(3, 4), 16);
      for (let i = 0; i < bytes; i += 1) {
        target[addr + i] = parseInt(line.substr(9 + i * 2, 2), 16);
      }
    }
  }
}

function bootstrapCpu(source) {
  const cpu = new CPU(new Uint16Array(PROGRAM_WORDS));
  loadHex(source, new Uint8Array(cpu.progBytes.buffer));
  return cpu;
}

function runTicks(cpu, cycles = 1000) {
  let executed = 0;
  while (executed < cycles) {
    cpu.tick();
    executed += 1;
  }
  return executed;
}

export function main() {
  let hexSource = "";
  try {
    hexSource = fs.readFileSync(HEX_PATH, "utf8");
  } catch (error) {
    console.warn("No compiled HEX found at", HEX_PATH.pathname, error.message);
    return;
  }

  const cpu = bootstrapCpu(hexSource);
  const portB = new AVRIOPort(cpu, portBConfig);
  new AVRTimer(cpu, timer0Config);

  const ticks = runTicks(cpu, 5000);
  console.log(`Executed ${ticks} cycles. PORTB pins:`, Array.from(portB.pinState));
}

main();
