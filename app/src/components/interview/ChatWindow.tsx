import { useRef, useEffect, useCallback, useState } from 'react';
import { Message } from '../../types';
import { User, Bot, MessageSquareWarning, Volume2, Loader2 } from 'lucide-react';

const API_URL = '/api';

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  ttsEnabled?: boolean;
  patientSex?: 'male' | 'female';
}

export function ChatWindow({ messages, isLoading, ttsEnabled, patientSex }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingTTS, setLoadingTTS] = useState<string | null>(null);

  // Speak text using ElevenLabs API
  const speakText = useCallback(async (text: string, messageId?: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingMessageId(null);

    if (messageId) {
      setLoadingTTS(messageId);
    }

    try {
      const response = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, patientSex }),
      });

      if (!response.ok) {
        console.error('TTS request failed:', response.status);
        // Fall back to browser TTS
        fallbackBrowserTTS(text);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      if (messageId) {
        setPlayingMessageId(messageId);
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setPlayingMessageId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        URL.revokeObjectURL(audioUrl);
        setPlayingMessageId(null);
        audioRef.current = null;
        // Fall back to browser TTS
        fallbackBrowserTTS(text);
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      // Fall back to browser TTS
      fallbackBrowserTTS(text);
    } finally {
      setLoadingTTS(null);
    }
  }, [patientSex]);

  // Fallback to browser TTS if ElevenLabs fails
  const fallbackBrowserTTS = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Try to find a voice matching the patient's gender
    let preferredVoice;
    if (patientSex === 'male') {
      // Look for male voices
      preferredVoice = voices.find(v =>
        v.name.includes('Daniel') ||
        v.name.includes('Alex') ||
        v.name.includes('Fred') ||
        (v.name.includes('Google') && v.name.includes('Male'))
      );
    } else {
      // Default to female voices
      preferredVoice = voices.find(v =>
        v.name.includes('Samantha') ||
        v.name.includes('Victoria') ||
        v.name.includes('Karen') ||
        (v.name.includes('Google') && v.name.includes('Female'))
      );
    }
    // Fallback to any English voice if gender-specific not found
    if (!preferredVoice) {
      preferredVoice = voices.find(v => v.lang.startsWith('en'));
    }
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [patientSex]);

  // Manual play button handler
  const handlePlayMessage = useCallback((text: string, messageId: string) => {
    speakText(text, messageId);
  }, [speakText]);

  // Stop playback
  const handleStopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setPlayingMessageId(null);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Auto-speak new patient messages if TTS is enabled
    if (ttsEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === 'patient' &&
        lastMessage.id !== lastSpokenMessageId.current
      ) {
        speakText(lastMessage.content, lastMessage.id);
        lastSpokenMessageId.current = lastMessage.id;
      }
    }
  }, [messages, ttsEnabled, speakText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

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
                    onClick={() =>
                      playingMessageId === message.id
                        ? handleStopPlayback()
                        : handlePlayMessage(message.content, message.id)
                    }
                    disabled={loadingTTS === message.id}
                    className={`flex-shrink-0 p-1.5 rounded-full transition-all ${
                      playingMessageId === message.id
                        ? 'bg-blue-100 text-blue-600'
                        : loadingTTS === message.id
                        ? 'bg-gray-100 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100'
                    }`}
                    title={playingMessageId === message.id ? 'Stop' : 'Read aloud'}
                  >
                    {loadingTTS === message.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : playingMessageId === message.id ? (
                      <Volume2 className="w-4 h-4 animate-pulse" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
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
