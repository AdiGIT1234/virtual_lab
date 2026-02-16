import { useState } from "react";

const PIN_LAYOUT = [
  { num: 1, arduino: null },
  { num: 2, arduino: 0 },
  { num: 3, arduino: 1 },
  { num: 4, arduino: 2 },
  { num: 5, arduino: 3 },
  { num: 6, arduino: 4 },
  { num: 7, arduino: null },
  { num: 8, arduino: null },
  { num: 9, arduino: null },
  { num: 10, arduino: null },
  { num: 11, arduino: 5 },
  { num: 12, arduino: 6 },
  { num: 13, arduino: 7 },
  { num: 14, arduino: 8 },

  { num: 15, arduino: 9 },
  { num: 16, arduino: 10 },
  { num: 17, arduino: 11 },
  { num: 18, arduino: 12 },
  { num: 19, arduino: 13 },
  { num: 20, arduino: null },
  { num: 21, arduino: null },
  { num: 22, arduino: null },
  { num: 23, arduino: null },
  { num: 24, arduino: null },
  { num: 25, arduino: null },
  { num: 26, arduino: null },
  { num: 27, arduino: null },
  { num: 28, arduino: null }
];

function App() {
  const [code, setCode] = useState(`pinMode(13, OUTPUT);
digitalWrite(13, HIGH);
delay(1000);
digitalWrite(13, LOW);`);

  const [registers, setRegisters] = useState(null);
  const [ledOn, setLedOn] = useState(false);
  const [inputs, setInputs] = useState({});

  const runCode = async () => {
    const response = await fetch("http://127.0.0.1:8000/run-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, inputs })
    });

    const data = await response.json();
    setRegisters(data.registers);

    setLedOn(false);

    (data.timeline || []).forEach(event => {
      setTimeout(() => {
        if (event.pin === 13) {
          setLedOn(event.value === "HIGH");
        }
      }, event.time);
    });
  };

  const getPinState = (arduinoPin) => {
    if (!registers || arduinoPin == null) return false;

    if (arduinoPin <= 7)
      return registers.PORTD[arduinoPin] === 1;

    if (arduinoPin <= 13)
      return registers.PORTB[arduinoPin - 8] === 1;

    return false;
  };

  const toggleInput = (arduinoPin) => {
    if (arduinoPin == null) return;

    setInputs(prev => ({
      ...prev,
      [arduinoPin]: prev[arduinoPin] ? 0 : 1
    }));
  };

  const renderPin = (pin, index) => {
    const left = index < 14;
    const y = 30 + (left ? index : index - 14) * 22;

    const active =
      pin.arduino === 13
        ? ledOn
        : getPinState(pin.arduino);

    return (
      <div key={pin.num}>
        <div
          onClick={() => toggleInput(pin.arduino)}
          style={{
            position: "absolute",
            top: y,
            left: left ? -24 : 284,
            width: 24,
            height: 8,
            backgroundColor: active ? "#00ff66" : "#bbb",
            cursor: pin.arduino != null ? "pointer" : "default"
          }}
        />

        <div
          style={{
            position: "absolute",
            top: y - 8,
            left: left ? -50 : 320,
            fontSize: 10,
            color: "#aaa"
          }}
        >
          {pin.num}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>ATmega328P – 28 Pin DIP</h2>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={4}
        style={{ width: "100%", fontFamily: "monospace" }}
      />

      <br /><br />
      <button onClick={runCode}>Run</button>

      <div style={{ marginTop: 60, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            width: 280,
            height: 380,
            background: "#1a1a1a",
            borderRadius: 10,
            boxShadow: "0 0 30px rgba(0,0,0,0.8)"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -12,
              left: "50%",
              transform: "translateX(-50%)",
              width: 60,
              height: 24,
              backgroundColor: "#111",
              borderRadius: "0 0 50px 50px"
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 10,
              left: 0,
              right: 0,
              textAlign: "center",
              color: "white",
              fontWeight: "bold"
            }}
          >
            ATmega328P
          </div>

          {PIN_LAYOUT.map((pin, index) => renderPin(pin, index))}
        </div>
      </div>
    </div>
  );
}

export default App;
