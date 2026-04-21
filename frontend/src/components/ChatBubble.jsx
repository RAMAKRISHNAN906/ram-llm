import { memo } from 'react';
import LoadingDots from './LoadingDots';

function formatText(text) {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

const ChatBubble = memo(function ChatBubble({ message }) {
  const isUser = message.role === 'user';
  const isEmpty = !message.content && !message.loading;

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-5`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-md ${
          isUser
            ? 'bg-accent text-white shadow-accent/30'
            : 'bg-slate-700 text-indigo-300 shadow-black/30'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
          isUser
            ? 'bg-user-bubble text-white rounded-tr-sm'
            : 'bg-ai-bubble text-slate-200 rounded-tl-sm border border-border'
        }`}
      >
        {message.loading || (isEmpty && !message.retryInfo) ? (
          <LoadingDots />
        ) : message.retryInfo ? (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <svg className="w-3.5 h-3.5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {message.retryInfo}
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="ai-content">
            {/* Skip heavy formatting while streaming — plain text is faster */}
            {message.streaming
              ? <span className="whitespace-pre-wrap">{message.content}</span>
              : <span dangerouslySetInnerHTML={{ __html: formatText(message.content) }} />
            }
            {message.streaming && (
              <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatBubble;
