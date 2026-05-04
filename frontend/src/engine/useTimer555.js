import { useEffect, useRef } from 'react';
import { useCircuitStore } from '../state/useCircuitStore';

// Drives a 555 timer component in astable mode.
// Finds TIMER_555 in workspace, reads Ra/Rb from connected resistors and C from capacitors,
// then runs a JS timer that toggles setOutputLevel on the component's pin.
//
// Frequency: f = 1.44 / ((Ra + 2*Rb) * C)
// High time:  t_H = 0.693 * (Ra + Rb) * C
// Low time:   t_L = 0.693 * Rb * C
//
// Component convention (matches the preset's wire graph):
//   - Largest resistor = Ra (discharge path, pin 7)
//   - Smaller resistor = Rb (timing, between pin 7 and VCC)
//   - Capacitor C (between pin 2/6 and GND)

export function useTimer555() {
  const components   = useCircuitStore(s => s.components);
  const setOutputLevel = useCircuitStore(s => s.setOutputLevel);
  const hiTimerRef   = useRef(null);
  const loTimerRef   = useRef(null);

  useEffect(() => {
    const timer = components.find(c => c.type === 'TIMER_555');
    if (!timer) return;

    const resistors  = components.filter(c => c.type === 'RESISTOR');
    const capacitors = components.filter(c => c.type === 'CAPACITOR');

    if (resistors.length === 0 || capacitors.length === 0) {
      // No RC network — static HIGH (555 output stays on)
      setOutputLevel(timer.pin, 1);
      return;
    }

    // Sort resistors descending by value; Ra is the discharge resistor (larger)
    const sorted = [...resistors].sort((a, b) => (b.resistance || 0) - (a.resistance || 0));
    const Ra = sorted[0]?.resistance  || 47000;
    const Rb = sorted[1]?.resistance  || Ra;

    // Capacitance: convert from whatever unit the metadata stores
    const capMeta = capacitors[0]?.metadata || {};
    let C = capMeta.capacitance || 10;
    const unit = (capMeta.unit || 'µF').toLowerCase();
    if (unit.includes('nf'))       C *= 1e-9;
    else if (unit.includes('pf'))  C *= 1e-12;
    else                           C *= 1e-6;  // default µF

    const tHigh = Math.max(10, Math.round(693 * (Ra + Rb) * C));  // ms
    const tLow  = Math.max(10, Math.round(693 * Rb * C));          // ms
    const pin   = timer.pin;

    let state = true;
    setOutputLevel(pin, 1);

    const scheduleHigh = () => {
      hiTimerRef.current = setTimeout(() => {
        state = false;
        setOutputLevel(pin, 0);
        scheduleLow();
      }, tHigh);
    };

    const scheduleLow = () => {
      loTimerRef.current = setTimeout(() => {
        state = true;
        setOutputLevel(pin, 1);
        scheduleHigh();
      }, tLow);
    };

    scheduleHigh();

    return () => {
      clearTimeout(hiTimerRef.current);
      clearTimeout(loTimerRef.current);
    };
  }, [components, setOutputLevel]);
}
