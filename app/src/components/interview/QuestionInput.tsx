import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Send, HelpCircle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../common';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  onEndInterview: () => void;
  disabled?: boolean;
  placeholder?: string;
  showHint?: string;
  voiceInputEnabled?: boolean;
  ttsEnabled?: boolean;
  onToggleVoiceInput?: (enabled: boolean) => void;
  onToggleTTS?: (enabled: boolean) => void;
}

export interface QuestionInputRef {
  focus: () => void;
  clear: () => void;
}

// Check if browser supports speech recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const speechRecognitionSupported = !!SpeechRecognition;

export const QuestionInput = forwardRef<QuestionInputRef, QuestionInputProps>(
  ({
    onSubmit,
    onEndInterview,
    disabled,
    placeholder,
    showHint,
    voiceInputEnabled = false,
    ttsEnabled = false,
    onToggleVoiceInput,
    onToggleTTS,
  }, ref) => {
    const [question, setQuestion] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setQuestion(''),
    }));

    // Initialize speech recognition
    useEffect(() => {
      if (!speechRecognitionSupported || !voiceInputEnabled) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setQuestion(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied. Please enable in browser settings.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Try again.');
        } else {
          setSpeechError(`Error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      };
    }, [voiceInputEnabled]);

    const toggleListening = () => {
      if (!recognitionRef.current) return;

      setSpeechError(null);

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          setSpeechError('Failed to start voice input');
        }
      }
    };

    const handleSubmit = () => {
      if (question.trim() && !disabled) {
        // Stop listening if active
        if (isListening && recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
        }
        onSubmit(question.trim());
        setQuestion('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Voice settings toggles */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          {speechRecognitionSupported && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={voiceInputEnabled}
                onChange={(e) => onToggleVoiceInput?.(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <Mic className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">Voice Input</span>
            </label>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => onToggleTTS?.(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">Read Responses Aloud</span>
          </label>
        </div>

        {showHint && (
          <div className="flex items-start gap-2 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{showHint}</p>
          </div>
        )}

        {speechError && (
          <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <MicOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{speechError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Listening... speak your question'
                  : disabled
                    ? 'Type your next question while waiting...'
                    : (placeholder || 'Type your question...')
              }
              rows={2}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isListening ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {isListening && (
              <div className="absolute right-3 top-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-600 font-medium">Recording</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {voiceInputEnabled && speechRecognitionSupported && (
              <Button
                variant={isListening ? 'primary' : 'outline'}
                onClick={toggleListening}
                disabled={disabled}
                className={`h-12 w-12 p-0 ${isListening ? 'bg-red-600 hover:bg-red-700' : ''}`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={disabled || !question.trim()}
              className="h-12"
            >
              <Send className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              onClick={onEndInterview}
              disabled={disabled}
              className="text-sm"
            >
              End
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            {voiceInputEnabled && speechRecognitionSupported
              ? 'Press mic to speak, Enter to send'
              : 'Press Enter to send, Shift+Enter for new line'}
          </span>
          <span>Click "End" when you've finished gathering the history</span>
        </div>
      </div>
    );
  }
);

QuestionInput.displayName = 'QuestionInput';
