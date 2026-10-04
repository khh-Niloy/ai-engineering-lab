'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './customer.module.css';

export default function ClientPage({ customerId, initialConversations }: { customerId: string, initialConversations: any[] }) {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].conversation_id : null
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          conversationId: activeConversation,
          message: userMessage,
        })
      });
      
      if (res.ok) {
        const reply = await res.json();
        setMessages(prev => [...prev, reply]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.backButton}>← Back</Link>
          <h2>Conversations</h2>
        </div>
        <div className={styles.conversationList}>
          {initialConversations.map(conv => (
            <button 
              key={conv.conversation_id}
              className={`${styles.conversationItem} ${activeConversation === conv.conversation_id ? styles.active : ''}`}
              onClick={() => setActiveConversation(conv.conversation_id)}
            >
              {conv.summary || 'New Conversation'}
            </button>
          ))}
          {initialConversations.length === 0 && (
            <p className={styles.empty}>No conversations yet.</p>
          )}
        </div>
      </aside>

      <main className={styles.chatArea}>
        {activeConversation ? (
          <>
            <div className={styles.messagesContainer}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userWrapper : styles.aiWrapper}`}>
                  <div className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.aiMsg}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.aiWrapper}`}>
                  <div className={`${styles.message} ${styles.aiMsg} ${styles.typing}`}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className={styles.inputArea}>
              <input 
                type="text" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className={styles.input}
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage} 
                className={styles.sendBtn}
                disabled={!inputValue.trim() || isLoading}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noActive}>
            <p>Select a conversation to start chatting.</p>
          </div>
        )}
      </main>
    </div>
  );
}
