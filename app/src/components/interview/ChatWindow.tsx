import { useRef, useEffect } from 'react';
import { Message } from '../../types';
import { User, Bot } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 rounded-lg" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '300px' }}>
      {messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Start the Interview</p>
          <p className="text-sm mt-1">Ask your first question to begin gathering the history.</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'student' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'student'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'patient'
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {message.role === 'student' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div
              className={`flex-1 rounded-2xl px-5 py-3 ${
                message.role === 'student'
                  ? 'bg-blue-600 text-white ml-12'
                  : message.role === 'patient'
                  ? 'bg-white text-gray-900 border border-gray-200 mr-12'
                  : 'bg-yellow-50 text-yellow-900 border border-yellow-200 mr-12'
              }`}
            >
              <p className="text-base whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
              {message.questionAnalysis && message.role === 'student' && (
                <div className="mt-2 pt-2 border-t border-blue-500/30 text-xs opacity-90">
                  <span className="bg-blue-500/30 px-2 py-0.5 rounded">
                    {message.questionAnalysis.category.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {isLoading && (
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 text-gray-700">
            <Bot className="w-5 h-5" />
          </div>
          <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-5 py-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
