import { useRef, useEffect, useCallback } from 'react';
import { Message } from '../../types';
import { User, Bot, MessageSquareWarning, Volume2 } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  ttsEnabled?: boolean;
}

export function ChatWindow({ messages, isLoading, ttsEnabled }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageId = useRef<string | null>(null);

  // Speak text using Web Speech API
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') || // macOS
      v.name.includes('Google') ||
      v.name.includes('Microsoft') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  // Manual play button handler
  const handlePlayMessage = useCallback((text: string) => {
    speakText(text);
  }, [speakText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Auto-speak new patient messages if TTS is enabled
    if (ttsEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === 'patient' &&
        lastMessage.id !== lastSpokenMessageId.current
      ) {
        speakText(lastMessage.content);
        lastSpokenMessageId.current = lastMessage.id;
      }
    }
  }, [messages, ttsEnabled, speakText]);

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
              className={`max-w-[80%] rounded-2xl ${
                message.role === 'student'
                  ? 'bg-blue-600 text-white'
                  : message.role === 'patient'
                  ? 'bg-white text-gray-900 border border-gray-200 group'
                  : 'bg-yellow-50 text-yellow-900 border border-yellow-200'
              }`}
              style={{ padding: '16px 24px' }}
            >
              <div className="flex items-start gap-2">
                <p className="text-base whitespace-pre-wrap leading-relaxed break-words flex-1">{message.content}</p>
                {message.role === 'patient' && (
                  <button
                    onClick={() => handlePlayMessage(message.content)}
                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Read aloud"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {message.questionAnalysis && message.role === 'student' && (
                <div className="mt-2 pt-2 border-t border-blue-500/30 text-xs opacity-90">
                  <span className="bg-blue-500/30 px-2 py-0.5 rounded">
                    {message.questionAnalysis.category.replace('_', ' ')}
                  </span>
                </div>
              )}
              {message.debugMarker === 'would_trigger_mapping' && message.role === 'student' && (
                <div className="mt-2 pt-2 border-t border-orange-400/50 text-xs flex items-center gap-1.5">
                  <MessageSquareWarning className="w-3.5 h-3.5 text-orange-300" />
                  <span className="text-orange-200">Hypothesis mapping prompt would fire here</span>
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
          <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl" style={{ padding: '16px 24px' }}>
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
