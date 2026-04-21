export default function LoadingDots() {
  return (
    <div className="flex items-center gap-3 px-1 py-0.5">
      {/* Atom / neural orbit animation */}
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        {/* Core pulsing nucleus */}
        <span style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 7, height: 7,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #e0e7ff, #818cf8)',
          boxShadow: '0 0 8px 3px #6366f155',
          animation: 'nucPulse 1.6s ease-in-out infinite',
          zIndex: 3,
        }} />

        {/* Orbit ring 1 — horizontal */}
        <span style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 32, height: 12,
          marginTop: -6, marginLeft: -16,
          borderRadius: '50%',
          border: '1.5px solid #818cf870',
          animation: 'orbit1 1.8s linear infinite',
          zIndex: 1,
        }}>
          {/* Electron on ring 1 */}
          <span style={{
            position: 'absolute',
            top: -3, left: '50%',
            width: 6, height: 6,
            marginLeft: -3,
            borderRadius: '50%',
            background: '#a78bfa',
            boxShadow: '0 0 6px 2px #a78bfa88',
          }} />
        </span>

        {/* Orbit ring 2 — tilted 60° */}
        <span style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 32, height: 12,
          marginTop: -6, marginLeft: -16,
          borderRadius: '50%',
          border: '1.5px solid #60a5fa60',
          animation: 'orbit2 2.2s linear infinite',
          zIndex: 1,
        }}>
          <span style={{
            position: 'absolute',
            top: -3, left: '50%',
            width: 6, height: 6,
            marginLeft: -3,
            borderRadius: '50%',
            background: '#60a5fa',
            boxShadow: '0 0 6px 2px #60a5fa88',
          }} />
        </span>

        {/* Orbit ring 3 — tilted 120° */}
        <span style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 32, height: 12,
          marginTop: -6, marginLeft: -16,
          borderRadius: '50%',
          border: '1.5px solid #f472b660',
          animation: 'orbit3 2.6s linear infinite',
          zIndex: 1,
        }}>
          <span style={{
            position: 'absolute',
            top: -3, left: '50%',
            width: 6, height: 6,
            marginLeft: -3,
            borderRadius: '50%',
            background: '#f472b6',
            boxShadow: '0 0 6px 2px #f472b688',
          }} />
        </span>
      </div>

      {/* Waveform bars */}
      <div className="flex items-center gap-[3px]">
        {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5].map((h, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 3,
              borderRadius: 4,
              background: `linear-gradient(180deg, #a78bfa, #60a5fa)`,
              animation: `wave 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
              height: 18 * h,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes nucPulse {
          0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
          50%       { transform: translate(-50%,-50%) scale(1.5); opacity: 0.6; }
        }
        @keyframes orbit1 {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(60deg)  rotateX(70deg); }
          to   { transform: rotate(420deg) rotateX(70deg); }
        }
        @keyframes orbit3 {
          from { transform: rotate(120deg) rotateX(70deg) rotateY(30deg); }
          to   { transform: rotate(480deg) rotateX(70deg) rotateY(30deg); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50%       { transform: scaleY(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
