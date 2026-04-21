import { useState } from 'react';
import Logo from './Logo';

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-border h-full">
      <Logo />

      {/* New Chat Button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors duration-150 shadow-md shadow-accent/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs text-slate-500 text-center mt-6 px-2">
            No conversations yet. Start chatting!
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-1 rounded-xl transition-colors duration-100 ${
              conv.id === activeId
                ? 'bg-surface border border-border'
                : 'hover:bg-surface/60'
            }`}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Chat title button */}
            <button
              onClick={() => onSelect(conv.id)}
              className={`flex-1 text-left px-3 py-2.5 text-sm truncate min-w-0 ${
                conv.id === activeId ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              <span className="mr-2 opacity-50">💬</span>
              {conv.title}
            </button>

            {/* Delete button — visible on hover or active */}
            {(hoveredId === conv.id || conv.id === activeId) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                title="Delete chat"
                className="flex-shrink-0 mr-2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-slate-600 text-center">RAM LLM · Local AI</p>
      </div>
    </aside>
  );
}
