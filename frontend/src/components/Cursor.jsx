import { useEffect, useRef, useState } from 'react';

export default function Cursor() {
  const dotRef    = useRef(null);
  const ringRef   = useRef(null);
  const glowRef   = useRef(null);
  const trailsRef = useRef([]);
  const pos       = useRef({ x: -200, y: -200 });
  const ring      = useRef({ x: -200, y: -200 });
  const glow      = useRef({ x: -200, y: -200 });
  const [clicking, setClicking]   = useState(false);
  const [hovering, setHovering]   = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };

      // Spawn trail particle
      spawnTrail(e.clientX, e.clientY);
    };

    const onDown = () => setClicking(true);
    const onUp   = () => setClicking(false);

    const onOver = (e) => {
      const tag = e.target.tagName.toLowerCase();
      const role = e.target.getAttribute('role');
      if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'textarea' || role === 'button') {
        setHovering(true);
      } else {
        setHovering(false);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
    };
  }, []);

  // Trail particles pool
  const trailPool = useRef([]);
  const spawnTrail = (x, y) => {
    const el = document.createElement('div');
    const size = 4 + Math.random() * 6;
    const hue  = 230 + Math.random() * 60; // indigo-purple range
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:99997;
      width:${size}px; height:${size}px; border-radius:50%;
      background:hsla(${hue},80%,70%,0.7);
      left:${x - size/2}px; top:${y - size/2}px;
      transform:scale(1); opacity:1;
      transition:transform 0.5s ease, opacity 0.5s ease;
      box-shadow: 0 0 ${size*2}px hsla(${hue},80%,70%,0.4);
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `scale(0) translate(${(Math.random()-0.5)*20}px, ${(Math.random()-0.5)*20}px)`;
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), 500);
  };

  // Smooth lag animation loop
  useEffect(() => {
    let raf;
    const loop = () => {
      // Ring lags behind cursor
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;

      // Glow lags more
      glow.current.x += (pos.current.x - glow.current.x) * 0.06;
      glow.current.y += (pos.current.y - glow.current.y) * 0.06;

      if (dotRef.current) {
        dotRef.current.style.left  = `${pos.current.x}px`;
        dotRef.current.style.top   = `${pos.current.y}px`;
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`;
        ringRef.current.style.top  = `${ring.current.y}px`;
      }
      if (glowRef.current) {
        glowRef.current.style.left = `${glow.current.x}px`;
        glowRef.current.style.top  = `${glow.current.y}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ringSize  = hovering ? 44 : clicking ? 16 : 32;
  const dotSize   = clicking ? 4  : 7;

  return (
    <>
      {/* Outer glow blob (slowest) */}
      <div ref={glowRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:99996,
        width:80, height:80, borderRadius:'50%',
        transform:'translate(-50%,-50%)',
        background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        transition:'width 0.3s, height 0.3s',
        filter:'blur(8px)',
      }}/>

      {/* Ring (medium lag) */}
      <div ref={ringRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:99998,
        width: ringSize, height: ringSize,
        borderRadius:'50%',
        border: hovering
          ? '2px solid rgba(167,139,250,0.9)'
          : '1.5px solid rgba(99,102,241,0.7)',
        transform:'translate(-50%,-50%)',
        transition:'width 0.25s cubic-bezier(.34,1.56,.64,1), height 0.25s cubic-bezier(.34,1.56,.64,1), border-color 0.2s',
        boxShadow: hovering
          ? '0 0 16px rgba(167,139,250,0.4), inset 0 0 8px rgba(167,139,250,0.1)'
          : '0 0 10px rgba(99,102,241,0.3)',
        backdropFilter: hovering ? 'blur(2px)' : 'none',
        animation:'ringRotate 3s linear infinite',
      }}>
        {/* Orbiting dot on ring */}
        <div style={{
          position:'absolute', top:-3, left:'50%', marginLeft:-3,
          width:6, height:6, borderRadius:'50%',
          background: hovering ? '#a78bfa' : '#6366f1',
          boxShadow:`0 0 8px ${hovering ? '#a78bfa' : '#6366f1'}`,
          transition:'background 0.2s',
        }}/>
      </div>

      {/* Center dot (instant) */}
      <div ref={dotRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:99999,
        width: dotSize, height: dotSize,
        borderRadius:'50%',
        background: hovering
          ? 'radial-gradient(circle, #e0d7ff, #a78bfa)'
          : 'radial-gradient(circle, #fff, #6366f1)',
        transform:'translate(-50%,-50%)',
        transition:'width 0.15s, height 0.15s, background 0.2s',
        boxShadow: hovering
          ? '0 0 12px #a78bfa, 0 0 4px #fff'
          : '0 0 8px #6366f1, 0 0 3px #fff',
      }}/>

      <style>{`
        * { cursor: none !important; }
        @keyframes ringRotate {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>
    </>
  );
}
