class VlabRelayModule extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 50px;
          height: 35px;
          position: relative;
        }
        svg {
          width: 100%;
          height: 100%;
        }
      </style>
      <svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
        <!-- PCB Base -->
        <rect x="10" y="5" width="80" height="60" rx="3" fill="#1b5e20" />
        <rect x="10" y="5" width="80" height="60" rx="3" fill="none" stroke="#2e7d32" stroke-width="1.5" />
        
        <!-- Mounting Holes -->
        <circle cx="15" cy="10" r="2.5" fill="#111" />
        <circle cx="15" cy="60" r="2.5" fill="#111" />
        <circle cx="85" cy="10" r="2.5" fill="#111" />
        <circle cx="85" cy="60" r="2.5" fill="#111" />

        <!-- Blue Songle Relay -->
        <rect x="35" y="10" width="40" height="50" rx="2" fill="#1565c0" />
        <rect x="35" y="10" width="40" height="50" rx="2" fill="none" stroke="#0d47a1" stroke-width="1" />
        <text x="55" y="25" fill="#fff" font-family="sans-serif" font-size="6" font-weight="bold" text-anchor="middle">SONGLE</text>
        <text x="55" y="35" fill="#e0e0e0" font-family="sans-serif" font-size="4" text-anchor="middle">10A 250VAC</text>
        <text x="55" y="42" fill="#e0e0e0" font-family="sans-serif" font-size="4" text-anchor="middle">10A 30VDC</text>
        <text x="55" y="53" fill="#fff" font-family="sans-serif" font-size="5" text-anchor="middle">SRD-05VDC</text>

        <!-- Screw Terminals (NO, COM, NC) on right -->
        <rect x="75" y="15" width="15" height="40" fill="#2e7d32" /> <!-- Green block -->
        <!-- Terminal screws -->
        <circle cx="82.5" cy="22.5" r="3" fill="#9e9e9e" />
        <line x1="80.5" y1="22.5" x2="84.5" y2="22.5" stroke="#424242" stroke-width="1" />
        <circle cx="82.5" cy="35" r="3" fill="#9e9e9e" />
        <line x1="80.5" y1="35" x2="84.5" y2="35" stroke="#424242" stroke-width="1" />
        <circle cx="82.5" cy="47.5" r="3" fill="#9e9e9e" />
        <line x1="80.5" y1="47.5" x2="84.5" y2="47.5" stroke="#424242" stroke-width="1" />

        <!-- Header Pins (IN, GND, VCC) on left -->
        <rect x="8" y="20" width="8" height="30" fill="#212121" /> <!-- Black plastic base -->
        <!-- Plated pins sticking out -->
        <rect x="0" y="23" width="8" height="2" fill="#bdbdbd" />
        <rect x="0" y="34" width="8" height="2" fill="#bdbdbd" />
        <rect x="0" y="45" width="8" height="2" fill="#bdbdbd" />

        <!-- Optocoupler + SMD Resistors / Transistor on left side of PCB -->
        <rect x="22" y="20" width="8" height="10" fill="#000" /> <!-- PC817 Optocoupler -->
        <circle cx="24" cy="22" r="1.5" fill="#424242" />
        
        <rect x="23" y="40" width="3" height="5" fill="#000" /> <!-- SMD Diode -->
        <rect x="23" y="48" width="5" height="5" fill="#000" /> <!-- SMD Transistor S8050 -->
        <rect x="28" y="25" width="2" height="4" fill="#000" /> <!-- Resistor -->
        <rect x="28" y="32" width="2" height="4" fill="#000" /> <!-- Resistor -->

        <!-- LEDs (Power and Status) -->
        <circle cx="20" cy="50" r="1.5" fill="#c62828" /> <!-- Power LED (Red) -->
        <circle cx="20" cy="45" r="1.5" fill="#2e7d32" /> <!-- Status LED (Green) -->

        <!-- Silkscreen text -->
        <text x="17" y="25.5" fill="#fff" font-family="monospace" font-size="3" font-weight="bold">IN</text>
        <text x="17" y="36.5" fill="#fff" font-family="monospace" font-size="3" font-weight="bold">GND</text>
        <text x="17" y="47.5" fill="#fff" font-family="monospace" font-size="3" font-weight="bold">VCC</text>
      </svg>
    `;
  }
}

if (!customElements.get("vlab-relay-module")) {
  customElements.define("vlab-relay-module", VlabRelayModule);
}
