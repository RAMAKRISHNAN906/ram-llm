import { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import Cursor from './components/Cursor';

let nextId = 1;
const uid = () => `${Date.now()}-${nextId++}`;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function createConversation() {
  return { id: uid(), title: 'New Chat', messages: [] };
}

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Batching refs — accumulate tokens, flush to state via rAF
  const tokenBufferRef = useRef('');
  const rafRef = useRef(null);
  const aiMsgIdRef = useRef(null);
  const convIdRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouchDevice(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const flushTokens = useCallback(() => {
    const tokens = tokenBufferRef.current;
    if (!tokens) return;
    tokenBufferRef.current = '';
    const msgId = aiMsgIdRef.current;
    const cId = convIdRef.current;
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== cId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, content: m.content + tokens } : m
              ),
            }
      )
    );
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      flushTokens();
    });
  }, [flushTokens]);

  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const messages = activeConv?.messages ?? [];

  // Safety: if active chat has no streaming message but isLoading is stuck, reset it
  const activeHasStreaming = messages.some((m) => m.streaming);
  const effectiveLoading = isLoading && activeHasStreaming;

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleDelete = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const startNewChat = useCallback(() => {
    const conv = createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setIsLoading(false);           // reset any stuck loading state
    tokenBufferRef.current = '';   // clear any pending tokens
  }, []);

  const handleSend = useCallback(
    async (prompt) => {
      if (isLoading) return;

      let convId = activeId;
      if (!convId) {
        const conv = createConversation();
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        convId = conv.id;
      }

      const userMsg = { id: uid(), role: 'user', content: prompt };
      const aiMsgId = uid();
      aiMsgIdRef.current = aiMsgId;
      convIdRef.current = convId;
      tokenBufferRef.current = '';

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const isFirst = c.messages.length === 0;
          return {
            ...c,
            title: isFirst ? prompt.slice(0, 36) + (prompt.length > 36 ? '…' : '') : c.title,
            messages: [
              ...c.messages,
              userMsg,
              { id: aiMsgId, role: 'assistant', content: '', streaming: true },
            ],
          };
        })
      );

      setIsLoading(true);

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Safety: force-clear streaming if it stalls for 60s
      const stallTimer = setTimeout(() => {
        flushTokens();
        setConversations((prev) =>
          prev.map((c) =>
            c.id !== convId
              ? c
              : { ...c, messages: c.messages.map((m) => m.id === aiMsgId ? { ...m, streaming: false } : m) }
          )
        );
        setIsLoading(false);
      }, 60000);

      try {
        const res = await fetch(`${API_BASE_URL}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messages.filter((m) => !m.streaming).map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: prompt },
            ],
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          let details = '';
          try {
            details = await res.text();
          } catch {
            details = '';
          }
          throw new Error(
            `Backend unavailable (${res.status}). ${details || 'Check Render deployment and API URL.'}`
          );
        }

        if (!res.body) {
          throw new Error('Backend returned an empty response body.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') { streamDone = true; break; }

            try {
              const data = JSON.parse(payload);

              if (data.error) {
                // Flush any pending tokens first
                flushTokens();
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id !== convId
                      ? c
                      : {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === aiMsgId
                              ? { ...m, content: `⚠️ ${data.error}`, streaming: false }
                              : m
                          ),
                        }
                  )
                );
                break;
              }

              if (data.info) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id !== convId
                      ? c
                      : {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === aiMsgId ? { ...m, content: '', retryInfo: data.info } : m
                          ),
                        }
                  )
                );
                continue;
              }

              if (data.token) {
                // Accumulate token, flush via rAF (batched)
                tokenBufferRef.current += data.token;
                if (/[.!?\n]$/.test(data.token) || tokenBufferRef.current.length > 40) {
                  flushTokens();
                  continue;
                }
                scheduleFlush();
              }
            } catch {
              // skip malformed
            }
          }
        }

        // Final flush
        flushTokens();

      } catch (err) {
        flushTokens();
        // AbortError = user clicked stop → don't show error, just stop cleanly
        if (err.name !== 'AbortError') {
          setConversations((prev) =>
            prev.map((c) =>
              c.id !== convId
                ? c
                : {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMsgId
                        ? { ...m, content: `⚠️ ${err.message}. Check cloud backend connection.`, streaming: false }
                        : m
                    ),
                  }
            )
          );
        }
      } finally {
        clearTimeout(stallTimer);
        // Mark streaming done
        setConversations((prev) =>
          prev.map((c) =>
            c.id !== convId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, streaming: false, retryInfo: null } : m
                  ),
                }
          )
        );
        setIsLoading(false);
      }
    },
    [activeId, isLoading, scheduleFlush, flushTokens]
  );

  if (!loggedIn) return <>{!isTouchDevice && <Cursor />}<Login onLogin={() => setLoggedIn(true)} /></>;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {!isTouchDevice && <Cursor />}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-slate-300 shadow-md"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 fixed md:relative z-40 h-full w-[84vw] max-w-[320px] md:w-auto`}
      >
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => { setActiveId(id); setIsLoading(false); setSidebarOpen(false); }}
          onDelete={handleDelete}
          onNew={() => { startNewChat(); setSidebarOpen(false); }}
        />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      <ChatWindow messages={messages} onSend={handleSend} onStop={handleStop} isLoading={effectiveLoading} />
    </div>
  );
}
