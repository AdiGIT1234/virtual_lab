import { useState, useRef, useCallback } from 'react';

/**
 * ESP32 simulation engine hook.
 *
 * Unlike useAVR which runs avr8js WASM in the browser, the ESP32 engine
 * uses an interpretive approach: code is sent to the backend, parsed,
 * and a timeline of register snapshots is returned for playback.
 *
 * The hook exposes the same interface as useAVR for seamless switching
 * in SandboxPage.
 */
export function useESP32(_activeMcuId = "esp32") {
  const [cpuState, setCpuState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [liveTimeline, setLiveTimeline] = useState([]);
  const [speedMultiplier, setSpeedMultiplierState] = useState(1);
  const [activeBreakpoints, setActiveBreakpoints] = useState([]);

  const speedRef = useRef(1);
  const playbackRef = useRef(null);
  const timelineRef = useRef([]);
  const playbackIndexRef = useRef(0);
  const breakpointHandlerRef = useRef(() => {});

  /**
   * Run playback loop — steps through timeline snapshots at ~60fps
   * to animate the LogicAnalyzer and component state.
   */
  const runPlayback = useCallback(() => {
    const timeline = timelineRef.current;
    if (!timeline || timeline.length === 0) return;

    const tick = () => {
      const idx = playbackIndexRef.current;
      if (idx >= timeline.length) {
        // Playback complete — hold on last frame
        setIsRunning(false);
        return;
      }

      const step = timeline[idx];
      const registers = step?.registers || {};

      setCpuState({
        registers,
        pc: null,
        cycles: step?.time || 0,
        memory: [],
        sp: 0,
      });

      // Push to live timeline for LogicAnalyzer rendering
      setLiveTimeline((prev) => {
        const next = [...prev, step];
        // Cap at 200 entries like useAVR
        if (next.length > 200) next.shift();
        return next;
      });

      playbackIndexRef.current += Math.max(1, Math.floor(speedRef.current));
      playbackRef.current = requestAnimationFrame(tick);
    };

    playbackRef.current = requestAnimationFrame(tick);
  }, []);

  /**
   * Start simulation: POST code to backend → receive timeline → playback.
   *
   * Uses the same function signature as useAVR.startSimulation for
   * seamless switching, but the hexString param is unused (ESP32 uses
   * interpretive mode only).
   */
  const startSimulation = useCallback(async (codeOrHex, _initialRegisters = {}, inputs = {}, rawCode = null) => {
    // Stop any existing playback
    if (playbackRef.current) {
      cancelAnimationFrame(playbackRef.current);
    }

    const code = rawCode || codeOrHex;

    try {
      const response = await fetch("http://127.0.0.1:8000/run-esp32", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, inputs, mcu: "esp32" }),
      });

      const data = await response.json();

      if (data.timeline && data.timeline.length > 0) {
        timelineRef.current = data.timeline;
        playbackIndexRef.current = 0;

        setLiveTimeline([]);
        setIsRunning(true);

        runPlayback();
      } else {
        // No timeline — just show final state
        if (data.registers) {
          setCpuState({
            registers: data.registers,
            pc: null,
            cycles: 0,
            memory: [],
            sp: 0,
          });
        }
      }

      return data;
    } catch (e) {
      console.error("ESP32 simulation failed:", e);
      setIsRunning(false);
      throw e;
    }
  }, [runPlayback]);

  const stopSimulation = useCallback(() => {
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

  const setBreakpointHandler = useCallback((handler) => {
    breakpointHandlerRef.current = handler || (() => {});
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
  };
}
