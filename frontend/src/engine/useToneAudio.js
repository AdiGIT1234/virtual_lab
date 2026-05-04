import { useEffect, useRef } from 'react';

// Subscribes to 'avr-tone-change' events dispatched by useAVR and drives a
// Web Audio oscillator. Handles smooth gain fade-in/out to avoid clicks.
export function useToneAudio() {
  const ctxRef  = useRef(null);
  const oscRef  = useRef(null);
  const gainRef = useRef(null);
  const onRef   = useRef(false);

  useEffect(() => {
    const FADE = 0.015; // seconds for gain envelope

    const ensureCtx = () => {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      // Resume if suspended (browser autoplay policy)
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
      return ctxRef.current;
    };

    const ensureOsc = (ctx) => {
      if (!oscRef.current) {
        gainRef.current = ctx.createGain();
        gainRef.current.gain.setValueAtTime(0, ctx.currentTime);
        gainRef.current.connect(ctx.destination);

        oscRef.current = ctx.createOscillator();
        oscRef.current.type = 'square';
        oscRef.current.frequency.setValueAtTime(440, ctx.currentTime);
        oscRef.current.connect(gainRef.current);
        oscRef.current.start();
      }
    };

    const handleTone = (e) => {
      const { freq, active } = e.detail;
      const ctx = ensureCtx();
      ensureOsc(ctx);

      const gain = gainRef.current;
      const osc  = oscRef.current;
      const now  = ctx.currentTime;

      if (active && freq > 20 && freq < 20000) {
        osc.frequency.setTargetAtTime(freq, now, 0.005);
        if (!onRef.current) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0.15, now, FADE);
          onRef.current = true;
        }
      } else {
        if (onRef.current) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0, now, FADE);
          onRef.current = false;
        }
      }
    };

    window.addEventListener('avr-tone-change', handleTone);
    return () => {
      window.removeEventListener('avr-tone-change', handleTone);
      if (oscRef.current)  { oscRef.current.stop();  oscRef.current.disconnect();  oscRef.current  = null; }
      if (gainRef.current) { gainRef.current.disconnect(); gainRef.current = null; }
      if (ctxRef.current)  { ctxRef.current.close(); ctxRef.current = null; }
      onRef.current = false;
    };
  }, []);
}
