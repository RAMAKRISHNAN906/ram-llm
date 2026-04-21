export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
      {/* Robot logo */}
      <img
        src="/logo.png"
        alt="RAM LLM Logo"
        className="w-11 h-11 object-contain flex-shrink-0 drop-shadow-lg"
      />
      {/* Name */}
      <div>
        <h1 className="text-white font-bold text-lg leading-none tracking-wide">RAM LLM</h1>
        <p className="text-xs text-indigo-400 mt-0.5">Local AI</p>
      </div>
    </div>
  );
}

