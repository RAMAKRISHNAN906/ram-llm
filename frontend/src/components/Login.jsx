import { useState, useEffect, useRef } from 'react';

const FIXED_USERNAME = 'Ramakrishnan';
const FIXED_PASSWORD = 'Raman@999';

const BUBBLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  size: 18 + Math.random() * 60,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 7 + Math.random() * 10,
  opacity: 0.08 + Math.random() * 0.18,
}));

export default function Login({ onLogin }) {
  const [username, setUsername] = useState(FIXED_USERNAME);
  const [password, setPassword] = useState(FIXED_PASSWORD);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [walkPhase, setWalkPhase] = useState(0);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => setWalkPhase(p => (p + 1) % 8), 200);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === FIXED_USERNAME && password === FIXED_PASSWORD) {
      onLogin();
    } else {
      setError('Incorrect username or password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const isPointing = focusField !== null;
  const legAngles  = [20, 10, 0, -10, -20, -10, 0, 10];
  const ll = legAngles[walkPhase];
  const rl = -legAngles[walkPhase];
  const la = -legAngles[walkPhase] * 0.7;
  const ra = legAngles[walkPhase] * 0.7;
  const bodyY = [0,-2,-3,-2,0,-2,-3,-2][walkPhase];

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
    }}>

      {/* ── Aurora blobs ── */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'-20%', left:'-10%',
          width:600, height:600, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          animation:'auroraA 12s ease-in-out infinite alternate',
        }}/>
        <div style={{
          position:'absolute', bottom:'-15%', right:'-8%',
          width:700, height:700, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
          animation:'auroraB 15s ease-in-out infinite alternate',
        }}/>
        <div style={{
          position:'absolute', top:'40%', left:'35%',
          width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          animation:'auroraC 10s ease-in-out infinite alternate',
        }}/>
      </div>

      {/* ── Floating bubbles ── */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        {BUBBLES.map(b => (
          <div key={b.id} style={{
            position:'absolute', bottom:'-80px',
            left:`${b.left}%`,
            width: b.size, height: b.size,
            borderRadius:'50%',
            background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.12)',
            backdropFilter:'blur(2px)',
            animation:`floatUp ${b.duration}s ${b.delay}s linear infinite`,
            opacity: b.opacity,
          }}/>
        ))}
      </div>

      {/* ── Grid lines ── */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`
          linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)`,
        backgroundSize:'60px 60px',
      }}/>

      {/* ── Main content ── */}
      <div style={{
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        gap:0, position:'relative', width:'100%', maxWidth:860,
        padding:'0 24px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition:'opacity 0.8s ease, transform 0.8s ease',
      }}>

        {/* ── Animated Character ── */}
        <div style={{
          position:'relative', width:200, flexShrink:0,
          transform:`translateY(${isPointing ? -8 : bodyY}px)`,
          transition:'transform 0.2s ease',
          marginRight:-28, zIndex:2,
          filter:'drop-shadow(0 20px 40px rgba(99,102,241,0.5))',
        }}>
          {/* Glow under character */}
          <div style={{
            position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
            width:100, height:20, borderRadius:'50%',
            background:'rgba(99,102,241,0.4)',
            filter:'blur(12px)',
            animation:'glowPulse 2s ease-in-out infinite',
          }}/>

          <svg viewBox="0 0 120 230" width="200" height="310" style={{overflow:'visible'}}>
            <ellipse cx="60" cy="222" rx="28" ry="5" fill="rgba(99,102,241,0.2)"/>

            {/* LEFT LEG */}
            <g transform={`translate(46,148) rotate(${isPointing ? 5 : ll}, 9, 0)`}>
              <rect x="1" y="0" width="15" height="40" rx="7.5" fill="#7eb5d8"/>
              <g transform={`translate(0,37) rotate(${isPointing ? 0 : ll*0.3},7.5,0)`}>
                <rect x="1" y="0" width="15" height="28" rx="7" fill="#9ecce8"/>
                <rect x="-3" y="24" width="20" height="8" rx="4" fill="#e8d5b8"/>
                <ellipse cx="8" cy="30" rx="11" ry="5" fill="#d4b896"/>
              </g>
            </g>

            {/* RIGHT LEG */}
            <g transform={`translate(60,148) rotate(${isPointing ? -5 : rl}, 9, 0)`}>
              <rect x="1" y="0" width="15" height="40" rx="7.5" fill="#6aa5c8"/>
              <g transform={`translate(0,37) rotate(${isPointing ? 0 : rl*0.3},7.5,0)`}>
                <rect x="1" y="0" width="15" height="28" rx="7" fill="#8abcdc"/>
                <rect x="-3" y="24" width="20" height="8" rx="4" fill="#d4b896"/>
                <ellipse cx="8" cy="30" rx="11" ry="5" fill="#c4a886"/>
              </g>
            </g>

            {/* BODY */}
            <rect x="30" y="96" width="60" height="60" rx="16" fill="#f0c040"/>
            <rect x="40" y="96" width="40" height="12" rx="8" fill="#e8b030"/>
            <rect x="36" y="116" width="48" height="3" rx="1.5" fill="#e0a820" opacity="0.5"/>
            <rect x="36" y="123" width="48" height="3" rx="1.5" fill="#e0a820" opacity="0.3"/>
            {/* Belt */}
            <rect x="30" y="148" width="60" height="8" rx="4" fill="#c49030"/>
            <rect x="56" y="149" width="8" height="6" rx="2" fill="#a07020"/>

            {/* LEFT ARM */}
            <g transform={`translate(30,108) rotate(${isPointing ? -75 : la+12}, 7, 0)`}>
              <rect x="0" y="0" width="13" height="38" rx="6.5" fill="#c8844c"/>
              <ellipse cx="6.5" cy="39" rx="7.5" ry="6.5" fill="#b87040"/>
            </g>

            {/* RIGHT ARM - points when focused */}
            <g transform={`translate(77,108) rotate(${isPointing ? -55 : ra-12}, 7, 0)`}>
              <rect x="0" y="0" width="13" height="38" rx="6.5" fill="#c8844c"/>
              <ellipse cx="6.5" cy="39" rx="7.5" ry="6.5" fill="#b87040"/>
              {isPointing && <>
                <rect x="10" y="34" width="12" height="7" rx="3.5" fill="#b07038" transform="rotate(-35,6.5,38)"/>
              </>}
            </g>

            {/* NECK */}
            <rect x="51" y="86" width="18" height="16" rx="7" fill="#c07840"/>

            {/* HEAD */}
            <ellipse cx="60" cy="68" rx="27" ry="29" fill="#c07840"/>
            {/* Afro */}
            <ellipse cx="60" cy="50" rx="32" ry="27" fill="#1a0f06"/>
            <ellipse cx="36" cy="62" rx="15" ry="20" fill="#1a0f06"/>
            <ellipse cx="84" cy="62" rx="15" ry="20" fill="#1a0f06"/>
            <ellipse cx="60" cy="42" rx="26" ry="16" fill="#1a0f06"/>
            <ellipse cx="44" cy="46" rx="12" ry="14" fill="#1a0f06"/>
            <ellipse cx="76" cy="46" rx="12" ry="14" fill="#1a0f06"/>
            {/* Sunglasses */}
            <rect x="39" y="64" width="17" height="11" rx="5" fill="#0d0d1e" opacity="0.95"/>
            <rect x="62" y="64" width="17" height="11" rx="5" fill="#0d0d1e" opacity="0.95"/>
            {/* Lens shine */}
            <ellipse cx="44" cy="67" rx="3" ry="2" fill="rgba(255,255,255,0.2)"/>
            <ellipse cx="67" cy="67" rx="3" ry="2" fill="rgba(255,255,255,0.2)"/>
            <line x1="56" y1="70" x2="62" y2="70" stroke="#222" strokeWidth="2.5"/>
            <line x1="35" y1="68" x2="39" y2="68" stroke="#222" strokeWidth="1.8"/>
            <line x1="79" y1="68" x2="83" y2="68" stroke="#222" strokeWidth="1.8"/>
            {/* Smile */}
            <path d="M49 83 Q60 92 71 83" stroke="#a06030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Earring */}
            <circle cx="33" cy="72" r="3.5" fill="#f0c040"/>
            <circle cx="33" cy="78" r="2" fill="#f0c040"/>
            <line x1="33" y1="75.5" x2="33" y2="76" stroke="#d4a030" strokeWidth="1"/>
          </svg>
        </div>

        {/* ── Login Form ── */}
        <div style={{
          background:'rgba(255,255,255,0.04)',
          backdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:24,
          padding:'44px 48px 40px',
          width:430,
          boxShadow:`
            0 0 0 1px rgba(99,102,241,0.2),
            0 24px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          animation: shake ? 'formShake 0.45s ease' : 'none',
          position:'relative', zIndex:1,
        }}>

          {/* Top glow line */}
          <div style={{
            position:'absolute', top:0, left:'20%', right:'20%', height:2,
            background:'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(139,92,246,0.8), transparent)',
            borderRadius:'0 0 4px 4px',
          }}/>

          {/* Logo + Title */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:64, height:64, borderRadius:18,
              background:'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
              border:'1px solid rgba(99,102,241,0.4)',
              marginBottom:14,
              boxShadow:'0 0 30px rgba(99,102,241,0.3)',
              animation:'logoPulse 3s ease-in-out infinite',
            }}>
              <img src="/logo.png" alt="RAM LLM" style={{ width:46, height:46, objectFit:'contain' }}/>
            </div>
            <h1 style={{
              color:'#fff', fontSize:26, fontWeight:800, margin:'0 0 6px',
              background:'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              letterSpacing:1,
            }}>RAM LLM</h1>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, margin:0 }}>
              Sign in to your local AI
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Username */}
            <div>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:7 }}>
                Username
              </label>
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                background: focusField==='user' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${focusField==='user' ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:12, padding:'12px 16px',
                transition:'all 0.25s',
                boxShadow: focusField==='user' ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
              }}>
                <svg width="16" height="16" fill="none" stroke={focusField==='user'?'#a78bfa':'rgba(255,255,255,0.35)'} strokeWidth="1.8" viewBox="0 0 24 24" style={{flexShrink:0,transition:'stroke 0.25s'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                </svg>
                <input type="text" placeholder="Enter username" value={username}
                  onChange={e=>{setUsername(e.target.value);setError('');}}
                  onFocus={()=>setFocusField('user')} onBlur={()=>setFocusField(null)}
                  style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:14, letterSpacing:0.3 }}/>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:7 }}>
                Password
              </label>
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                background: focusField==='pass' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.06)',
                border:`1.5px solid ${focusField==='pass' ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:12, padding:'12px 16px',
                transition:'all 0.25s',
                boxShadow: focusField==='pass' ? '0 0 20px rgba(99,102,241,0.2)' : 'none',
              }}>
                <svg width="16" height="16" fill="none" stroke={focusField==='pass'?'#a78bfa':'rgba(255,255,255,0.35)'} strokeWidth="1.8" viewBox="0 0 24 24" style={{flexShrink:0,transition:'stroke 0.25s'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <input type={showPass?'text':'password'} placeholder="Enter password" value={password}
                  onChange={e=>{setPassword(e.target.value);setError('');}}
                  onFocus={()=>setFocusField('pass')} onBlur={()=>setFocusField(null)}
                  style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:14, letterSpacing:0.3 }}/>
                <button type="button" onClick={()=>setShowPass(v=>!v)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', padding:0, lineHeight:1 }}>
                  {showPass
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display:'flex', alignItems:'center', gap:8,
                background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:10, padding:'10px 14px',
                animation:'errorIn 0.3s ease',
              }}>
                <svg width="14" height="14" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
                <span style={{ color:'#fca5a5', fontSize:13 }}>{error}</span>
              </div>
            )}

            {/* Sign In Button */}
            <button type="submit"
              onMouseEnter={()=>setHoverBtn(true)} onMouseLeave={()=>setHoverBtn(false)}
              style={{
                marginTop:6, padding:'14px',
                borderRadius:12, border:'none',
                background: hoverBtn
                  ? 'linear-gradient(135deg, #7c3aed, #6366f1, #4f46e5)'
                  : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                color:'#fff', fontWeight:700, fontSize:15,
                cursor:'pointer', letterSpacing:0.5,
                transform: hoverBtn ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoverBtn
                  ? '0 12px 40px rgba(99,102,241,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
                  : '0 6px 24px rgba(99,102,241,0.4)',
                transition:'all 0.25s ease',
                position:'relative', overflow:'hidden',
              }}>
              {/* Shine sweep */}
              <span style={{
                position:'absolute', top:0, left:'-100%', width:'60%', height:'100%',
                background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                animation: hoverBtn ? 'shineSweep 0.6s ease' : 'none',
              }}/>
              Sign In
            </button>
          </form>

          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:11, marginTop:24, marginBottom:0, letterSpacing:0.5 }}>
            RAM LLM · Local AI · Private & Secure
          </p>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: var(--op, 0.12); }
          50%  { transform: translateY(-45vh) scale(1.1); }
          100% { transform: translateY(-100vh) scale(0.8); opacity: 0; }
        }
        @keyframes auroraA {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(6%,8%) scale(1.15); }
        }
        @keyframes auroraB {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(-5%,-6%) scale(1.2); }
        }
        @keyframes auroraC {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(4%,-8%) scale(1.1); }
        }
        @keyframes glowPulse {
          0%,100% { opacity:0.4; transform:translateX(-50%) scaleX(1); }
          50%     { opacity:0.8; transform:translateX(-50%) scaleX(1.3); }
        }
        @keyframes logoPulse {
          0%,100% { box-shadow: 0 0 30px rgba(99,102,241,0.3); }
          50%     { box-shadow: 0 0 50px rgba(139,92,246,0.5); }
        }
        @keyframes formShake {
          0%,100% { transform:translateX(0); }
          20%     { transform:translateX(-12px); }
          40%     { transform:translateX(12px); }
          60%     { transform:translateX(-8px); }
          80%     { transform:translateX(8px); }
        }
        @keyframes errorIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shineSweep {
          from { left:-100%; }
          to   { left:200%; }
        }
      `}</style>
    </div>
  );
}
