'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, RotateCcw, Bot, User as UserIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'grok';
  content: string;
  id: string;
}

const SUGGESTED_PROMPTS = [
  "What's trending on the timeline right now?",
  "Summarize today's top posts",
  "Is AI taking over social media?",
  "Why is everyone arguing today?",
];

export default function GrokPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: 'user', content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/grok/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulated += chunk;
        setStreamingText(accumulated);
      }

      setMessages(prev => [...prev, { role: 'grok', content: accumulated, id: Date.now().toString() }]);
      setStreamingText('');
    } catch (err) {
      setMessages(prev => [...prev, { role: 'grok', content: 'Error connecting to Grok. Try again!', id: Date.now().toString() }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="grok-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Grok</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>AI by xAI • Experimental</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setStreamingText(''); }}
            style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '99px', padding: '0.4rem 0.85rem', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={13} /> New chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {messages.length === 0 && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', paddingTop: '3rem' }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <Sparkles size={32} color="white" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>Hello, I'm Grok</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: 380, margin: '0 auto 2rem' }}>
              Your slightly sarcastic AI assistant. Ask me anything — current events, timeline analysis, or just chat.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400, margin: '0 auto' }}>
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                  className="grok-prompt-btn"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
              >
                <div className="grok-bubble" style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'grok'
                    ? 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                    : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {msg.role === 'grok' ? <Sparkles size={16} color="white" /> : <UserIcon size={16} color="white" />}
                </div>
                <div style={{
                  maxWidth: '75%',
                  padding: '0.85rem 1.25rem',
                  borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
                    : 'var(--card-bg)',
                  border: msg.role === 'grok' ? '1px solid var(--card-border)' : 'none',
                  color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.95rem',
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
            >
              <div className="grok-bubble" style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <div style={{
                maxWidth: '75%', padding: '0.85rem 1.25rem',
                borderRadius: '4px 18px 18px 18px',
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '0.95rem',
              }}>
                {streamingText || <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1s infinite 0.2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1s infinite 0.4s' }} />
                </span>}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--card-border)',
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <div className="grok-input-shell" style={{
          maxWidth: 700, margin: '0 auto',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '16px', padding: '0.75rem 1rem',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Grok anything..."
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--foreground)', fontFamily: 'inherit', fontSize: '0.95rem',
              resize: 'none', lineHeight: '1.5', maxHeight: '120px',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: input.trim() && !isStreaming ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'rgba(124,58,237,0.2)',
              border: 'none', cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
          Grok is an experimental AI. Responses are simulated and for entertainment only.
        </p>
      </div>

      <style>{`
        .grok-prompt-btn:hover { background: rgba(124,58,237,0.15) !important; border-color: rgba(124,58,237,0.4) !important; transform: translateY(-1px); }
        @keyframes pulse { 0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
