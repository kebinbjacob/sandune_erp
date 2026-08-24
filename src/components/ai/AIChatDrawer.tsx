'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ChatMessage } from '@/lib/ai/aiEngine';
import styles from './AIChat.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize initial greeting once
  useEffect(() => {
    if (messages.length === 0) {
      const displayName = user?.employees?.name || user?.email?.split('@')[0] || 'there';
      setMessages([
        {
          id: 'init_welcome',
          sender: 'assistant',
          text: `👋 Hi **${displayName}**! I'm your SanDune ERP Assistant.\n\nI can help you navigate modules, check pending approvals, query tasks, summarize projects/staff, or draft formal emails.\n\nWhat would you like to do?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedPrompts: [
            '🔔 Check Pending Approvals',
            '📋 Show My Tasks',
            '🏗️ Active Projects',
            '⏰ Daily Attendance',
            '✉️ Draft an Email',
          ],
        },
      ]);
    }
  }, [user, messages.length]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages,
          currentRoute: pathname,
          userRole: user?.role,
          userName: user?.employees?.name || user?.email?.split('@')[0],
          userEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        throw new Error(data.error || 'Failed to process response');
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: `⚠️ Sorry, I encountered an issue: ${err.message || 'Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleCopyEmail = (emailText: string, id: string) => {
    navigator.clipboard.writeText(emailText);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2500);
  };

  if (!isOpen) return null;

  // Active suggested chips based on latest assistant message or defaults
  const latestAssistant = [...messages].reverse().find(m => m.sender === 'assistant');
  const activeChips = latestAssistant?.suggestedPrompts || [
    '🔔 Pending Approvals',
    '📋 Show Tasks',
    '⏰ Attendance',
    '🏗️ Projects',
    '✉️ Compose Email',
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.aiAvatar}>✨</div>
            <div className={styles.headerInfo}>
              <h3>
                SanDune AI Assistant <span className={styles.statusDot} />
              </h3>
              <div className={styles.currentContextBadge}>
                📍 Context: {pathname === '/' ? 'Dashboard' : pathname}
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.headerBtn} onClick={clearChat} title="Clear conversation">
              🧹 Clear
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close Assistant">
              ✕
            </button>
          </div>
        </div>

        {/* Suggested Quick Action Chips */}
        <div className={styles.chipsBar}>
          {activeChips.map((chip, idx) => (
            <button
              key={idx}
              className={styles.chip}
              onClick={() => handleSendMessage(chip.replace(/^[^\w\s]+/, '').trim())}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className={styles.messagesContainer}>
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${
                msg.sender === 'user' ? styles.userRow : styles.assistantRow
              }`}
            >
              {msg.sender === 'assistant' && <div className={`${styles.msgAvatar} ${styles.assistantAvatar}`}>✨</div>}

              <div
                className={`${styles.bubble} ${
                  msg.sender === 'user' ? styles.userBubble : styles.assistantBubble
                }`}
              >
                <div className={styles.msgText}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {/* Render Specialized Action Cards */}
                {msg.actionCard && (
                  <div className={styles.actionCard}>
                    <div className={styles.actionCardHeader}>
                      <span>{msg.actionCard.title}</span>
                    </div>

                    {/* 1. Approvals Card */}
                    {msg.actionCard.type === 'approvals' && msg.actionCard.approvalsData && (
                      <div className={styles.cardList}>
                        {msg.actionCard.approvalsData.leaveRequests.slice(0, 3).map(lr => (
                          <div key={lr.id} className={styles.cardListItem}>
                            <div>
                              <strong>{lr.employeeName}</strong>: {lr.leaveType} ({lr.days} days)
                              <div style={{ color: '#94a3b8', fontSize: '11px' }}>{lr.reason}</div>
                            </div>
                            <span className={`${styles.itemBadge} ${styles.badgePending}`}>Pending</span>
                          </div>
                        ))}

                        {msg.actionCard.approvalsData.expenses.slice(0, 2).map(ex => (
                          <div key={ex.id} className={styles.cardListItem}>
                            <div>
                              <strong>{ex.employeeName}</strong>: ${ex.amount.toLocaleString()} ({ex.category})
                              <div style={{ color: '#94a3b8', fontSize: '11px' }}>{ex.description}</div>
                            </div>
                            <span className={`${styles.itemBadge} ${styles.badgePending}`}>Pending</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Tasks Card */}
                    {msg.actionCard.type === 'tasks' && msg.actionCard.tasksData && (
                      <div className={styles.cardList}>
                        {msg.actionCard.tasksData.slice(0, 4).map(t => (
                          <div key={t.id} className={styles.cardListItem}>
                            <div>
                              <strong>{t.title}</strong>
                              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                                Due: {t.dueDate} • Assigned: {t.assignedTo}
                              </div>
                            </div>
                            <span
                              className={`${styles.itemBadge} ${
                                t.priority === 'High' || t.priority === 'Urgent'
                                  ? styles.badgeHigh
                                  : styles.badgePending
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Entity Summary Card */}
                    {msg.actionCard.type === 'summary' && msg.actionCard.summaryData && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {msg.actionCard.summaryData.subtitle && (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {msg.actionCard.summaryData.subtitle}
                          </div>
                        )}
                        <div className={styles.metricsGrid}>
                          {msg.actionCard.summaryData.metrics.map((m, mi) => (
                            <div key={mi} className={styles.metricBox}>
                              <div className={styles.metricLabel}>{m.label}</div>
                              <div className={styles.metricValue}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Email Composer Card */}
                    {msg.actionCard.type === 'email' && msg.actionCard.emailData && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#93c5fd' }}>
                          <strong>Subject:</strong> {msg.actionCard.emailData.subject}
                        </div>
                        <div className={styles.emailPreviewBox}>
                          {msg.actionCard.emailData.body}
                        </div>
                        <div className={styles.emailActions}>
                          <button
                            className={`${styles.emailBtn} ${styles.copyBtn}`}
                            onClick={() =>
                              handleCopyEmail(
                                `Subject: ${msg.actionCard?.emailData?.subject}\n\n${msg.actionCard?.emailData?.body}`,
                                msg.id
                              )
                            }
                          >
                            {copiedEmailId === msg.id ? '✅ Copied!' : '📋 Copy Email'}
                          </button>
                          <a
                            href={msg.actionCard.emailData.mailtoUrl}
                            className={`${styles.emailBtn} ${styles.sendBtn}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ✉️ Open in Mail Client
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Direct Navigation Button if route provided */}
                    {msg.actionCard.route && (
                      <Link
                        href={msg.actionCard.route}
                        className={styles.navLinkBtn}
                        onClick={onClose}
                      >
                        {msg.actionCard.routeLabel || `Go to ${msg.actionCard.title}`} &rarr;
                      </Link>
                    )}
                  </div>
                )}

                <div className={styles.msgTime}>{msg.timestamp}</div>
              </div>

              {msg.sender === 'user' && <div className={`${styles.msgAvatar} ${styles.userAvatar}`}>👤</div>}
            </div>
          ))}

          {loading && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={`${styles.msgAvatar} ${styles.assistantAvatar}`}>✨</div>
              <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                <div className={styles.typingIndicator}>
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                  <div className={styles.typingDot} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <button
            onClick={() => {
              const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
              if (!SpeechRecognition) {
                alert("Voice recognition is not supported in this browser.");
                return;
              }
              const recognition = new SpeechRecognition();
              recognition.continuous = false;
              recognition.interimResults = true;
              recognition.onstart = () => setInputValue("Listening...");
              recognition.onresult = (e: any) => {
                const transcript = Array.from(e.results)
                  .map((r: any) => r[0].transcript)
                  .join('');
                setInputValue(transcript);
              };
              recognition.onend = () => {
                // Focus the input to let the user review or send
                inputRef.current?.focus();
              };
              recognition.start();
            }}
            className={`${styles.sendSubmitBtn} ${styles.micBtn}`}
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            aria-label="Use voice input"
            title="Click to speak"
          >
            🎤
          </button>
          
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about menus, approvals, tasks, or use voice..."
            className={styles.inputField}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || inputValue === "Listening..." || loading}
            className={styles.sendSubmitBtn}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
