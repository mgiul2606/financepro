import { useState, useRef, FormEvent } from 'react';
import { Send, Mic } from 'lucide-react';
import { Button } from '@/core/components/atomic/Button';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Scrivi il tuo messaggio...',
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-neutral-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all"
            style={{ maxHeight: '150px', minHeight: '48px' }}
          />
          <button
            type="button"
            className="absolute right-3 bottom-3 text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Messaggio vocale (prossimamente)"
            disabled
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!message.trim() || disabled}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Invia
        </Button>
      </div>
      <div className="mt-2 text-xs text-neutral-500">
        <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-xs">
          Enter
        </kbd>{' '}
        per inviare,{' '}
        <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded text-xs">
          Shift + Enter
        </kbd>{' '}
        per andare a capo
      </div>
    </form>
  );
};
