const getColor = (digit) => {
  const colors = ["#000000", "#964B00", "#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#EE82EE", "#808080", "#FFFFFF"];
  return colors[digit] || "#999";
};

const getMultiplierColor = (multiplier) => {
  const multipliers = ["#000000", "#964B00", "#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#EE82EE", "#808080", "#FFFFFF", "#FFD700", "#C0C0C0"];
  const power = Math.floor(Math.log10(multiplier));
  if (power === -1) return multipliers[10]; // Gold
  if (power === -2) return multipliers[11]; // Silver
  return multipliers[power] || "#999";
};

const formatValue = (val) => {
  if (val >= 1000000) return (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + "MΩ";
  if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + "kΩ";
  return val + "Ω";
};

const Resistor = ({ resistance = 220 }) => {
  const str = Math.round(resistance).toString();
  const digit1 = parseInt(str[0]) || 0;
  const digit2 = parseInt(str[1]) || 0;
  const multiplier = Math.pow(10, str.length - 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        color: '#eef4fb', 
        fontFamily: "'JetBrains Mono', monospace", 
        fontSize: '11px', 
        fontWeight: 'bold',
        marginBottom: '6px', 
        background: 'rgba(15, 23, 42, 0.85)', 
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '3px 10px', 
        borderRadius: '99px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        letterSpacing: '0.02em',
        textTransform: 'uppercase'
      }}>
        {formatValue(resistance)}
      </div>
      <svg width="100" height="30" viewBox="0 0 100 30" style={{ filter: "drop-shadow(0px 6px 8px rgba(0,0,0,0.6))" }}>
        {/* Metal Leads with Gradient */}
        <defs>
          <linearGradient id="leadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#94a3b8' }} />
            <stop offset="50%" style={{ stopColor: '#f1f5f9' }} />
            <stop offset="100%" style={{ stopColor: '#475569' }} />
          </linearGradient>
        </defs>
        <line x1="0" y1="15" x2="30" y2="15" stroke="url(#leadGrad)" strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="15" x2="100" y2="15" stroke="url(#leadGrad)" strokeWidth="4" strokeLinecap="round" />
        
        {/* Resistor Body Base */}
        <rect x="25" y="4" width="50" height="22" fill="#d4a373" rx="6" stroke="#4a3b2c" strokeWidth="0.5" />
        
        {/* 3D Core Shading */}
        <rect x="25" y="4" width="50" height="6" fill="rgba(255,255,255,0.25)" rx="6" />
        <rect x="25" y="22" width="50" height="4" fill="rgba(0,0,0,0.3)" rx="6" />

        {/* Dynamic Color Bands */}
        <rect x="34" y="4" width="5" height="22" fill={getColor(digit1)} />
        <rect x="44" y="4" width="5" height="22" fill={getColor(digit2)} />
        <rect x="54" y="4" width="5" height="22" fill={getMultiplierColor(multiplier)} />
        {/* Tolerance - Gold (5%) */}
        <rect x="66" y="4" width="4" height="22" fill="#cfb53b" />
        
        {/* Highlight over bands */}
        <rect x="25" y="4" width="50" height="4" fill="rgba(255,255,255,0.15)" rx="2" />
      </svg>
    </div>
  );
};

export default Resistor;
