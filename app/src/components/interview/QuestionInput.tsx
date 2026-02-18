import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import { Button } from '../common';

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  onEndInterview: () => void;
  disabled?: boolean;
  placeholder?: string;
  showHint?: string;
}

export interface QuestionInputRef {
  focus: () => void;
  clear: () => void;
}

export const QuestionInput = forwardRef<QuestionInputRef, QuestionInputProps>(
  ({
    onSubmit,
    onEndInterview,
    disabled,
    placeholder,
    showHint,
  }, ref) => {
    const [question, setQuestion] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setQuestion(''),
    }));

    const handleSubmit = () => {
      if (question.trim() && !disabled) {
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
        {showHint && (
          <div className="flex items-start gap-2 mb-3 bg-blue-50 border border-blue-200" style={{ padding: '12px' }}>
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{showHint}</p>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Type your next question while waiting...' : (placeholder || 'Type your question...')}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
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
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Click "End" when you've finished gathering the history</span>
        </div>
      </div>
    );
  }
);

QuestionInput.displayName = 'QuestionInput';
