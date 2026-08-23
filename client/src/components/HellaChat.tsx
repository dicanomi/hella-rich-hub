import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  HELLA_CHAT_FALLBACK,
  HELLA_CHAT_STARTERS,
  HellaChatAnswer,
  findHellaChatAnswer,
} from '../data/hellaChatKnowledge';
import { HellaChatMark } from './HellaChatMark';

type ChatMessage = {
  id: number;
  role: 'hella.rich' | 'you';
  answer?: HellaChatAnswer;
  text?: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    role: 'hella.rich',
    text: "Hello, I'm hella.rich. Ask away.",
  },
];

function ChatMark() {
  return (
    <span className="hella-chat-mark" aria-hidden="true">
      <HellaChatMark />
    </span>
  );
}

function ChatBubble({ message, onContact }: { message: ChatMessage; onContact: () => void }) {
  const isUser = message.role === 'you';

  return (
    <div className={`hella-chat-message ${isUser ? 'hella-chat-message--user' : ''}`}>
      <div className="hella-chat-speaker">{message.role}</div>
      {message.text && <p>{message.text}</p>}
      {message.answer?.answer.map((line) => <p key={line}>{line}</p>)}
      {message.answer?.links?.length ? (
        <div className="hella-chat-links" aria-label="Related links">
          {message.answer.links.map((link) => link.action === 'contact' ? (
            <button key={link.label} type="button" onClick={onContact}>
              {link.label}
            </button>
          ) : (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HellaChat({ onContact }: { onContact: () => void }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 160);
    }
  }, [open]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, open]);

  const ask = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const answer = findHellaChatAnswer(trimmed);
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'you', text: trimmed },
      answer
        ? { id: Date.now() + 1, role: 'hella.rich', answer }
        : { id: Date.now() + 1, role: 'hella.rich', text: HELLA_CHAT_FALLBACK },
    ]);
    setQuestion('');
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  const openChat = () => {
    setClosing(false);
    setOpen(true);
  };

  const closeChat = () => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 170);
  };

  const openContact = () => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      onContact();
    }, 170);
  };

  return (
    <section className={`hella-chat ${open ? 'hella-chat--open' : ''}`} aria-label="hella.chat">
      {!open ? (
        <button className="hella-chat-closed" type="button" onClick={openChat} aria-label="Open hella.chat" aria-expanded="false">
          <ChatMark />
          <span>hella.chat</span>
          <span className="hella-chat-toggle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11l5-5 5 5" />
            </svg>
          </span>
        </button>
      ) : (
        <div className={`hella-chat-panel ${closing ? 'hella-chat-panel--closing' : ''}`} role="dialog" aria-modal="false" aria-label="Chat with hella.rich">
          <div className="hella-chat-head">
            <ChatMark />
            <button className="hella-chat-close" type="button" onClick={closeChat} aria-label="Close hella.chat" aria-expanded="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </button>
          </div>

          <div className="hella-chat-log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={message.id} ref={index === messages.length - 1 ? lastMessageRef : undefined}>
                <ChatBubble message={message} onContact={openContact} />
              </div>
            ))}
          </div>

          <div className="hella-chat-starters" aria-label="Suggested questions">
            {HELLA_CHAT_STARTERS.map((starter) => (
              <button key={starter} type="button" onClick={() => ask(starter)}>
                {starter}
              </button>
            ))}
          </div>

          <form className="hella-chat-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="hella-chat-input">Ask hella.chat</label>
            <input
              id="hella-chat-input"
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask"
              autoComplete="off"
            />
            <button type="submit" aria-label="Send message">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 11l5-5 5 5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
