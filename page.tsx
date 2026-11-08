"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string; id: string };
type Chat = { id: string; title: string; messages: Message[]; updatedAt: number };

const starterPrompts = [
  { icon: "⌘", title: "Write code", text: "Create a responsive modern landing page in HTML, CSS and JavaScript." },
  { icon: "✦", title: "Explain something", text: "Explain artificial intelligence in simple words." },
  { icon: "↗", title: "Build a plan", text: "Make me a practical weekly learning plan for web development." },
  { icon: "文", title: "Urdu assistant", text: "Assalam o alaikum! Roman Urdu mein mera AI assistant ban kar baat karo." },
];

function renderText(text: string) {
  // Lightweight markdown-like rendering: code blocks and inline code are kept readable.
  const chunks = text.split(/```([\w+-]*)\n([\s\S]*?)```/g);
  return chunks.map((chunk, i) => {
    if (i % 3 === 2) return <pre className="codeblock" key={i}><code>{chunk}</code></pre>;
    if (i % 3 === 1) return null;
    return chunk.split(/(`[^`]+`)/g).map((piece, j) =>
      piece.startsWith("`") && piece.endsWith("`")
        ? <code className="inline-code" key={`${i}-${j}`}>{piece.slice(1, -1)}</code>
        : <span key={`${i}-${j}`}>{piece}</span>
    );
  });
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ab-agent-chats");
      if (saved) {
        const parsed: Chat[] = JSON.parse(saved);
        if (parsed.length) { setChats(parsed); setActiveId(parsed[0].id); return; }
      }
    } catch {}
    const initial: Chat = { id: crypto.randomUUID(), title: "New chat", messages: [], updatedAt: Date.now() };
    setChats([initial]); setActiveId(initial.id);
  }, []);

  useEffect(() => {
    if (chats.length) localStorage.setItem("ab-agent-chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, busy]);

  function newChat() {
    const chat: Chat = { id: crypto.randomUUID(), title: "New chat", messages: [], updatedAt: Date.now() };
    setChats(prev => [chat, ...prev]); setActiveId(chat.id); setInput("");
    setNotice("");
  }

  async function sendMessage(value = input) {
    const text = value.trim();
    if (!text || busy) return;
    let chatId = activeId;
    if (!chatId || !activeChat) {
      const fresh: Chat = { id: crypto.randomUUID(), title: "New chat", messages: [], updatedAt: Date.now() };
      setChats(prev => [fresh, ...prev]); setActiveId(fresh.id); chatId = fresh.id;
    }
    const userMessage: Message = { role: "user", content: text, id: crypto.randomUUID() };
    const prior = activeChat?.messages || [];
    const nextMessages = [...prior, userMessage];
    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c, messages: nextMessages, title: c.messages.length ? c.title : text.slice(0, 38), updatedAt: Date.now()
    } : c));
    setInput(""); setBusy(true); setNotice("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      const assistantMessage: Message = { role: "assistant", content: data.answer, id: crypto.randomUUID() };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...nextMessages, assistantMessage], updatedAt: Date.now() } : c));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setNotice(msg);
    } finally { setBusy(false); textareaRef.current?.focus(); }
  }

  function deleteChat(id: string) {
    const remaining = chats.filter(c => c.id !== id);
    if (!remaining.length) {
      const fresh: Chat = { id: crypto.randomUUID(), title: "New chat", messages: [], updatedAt: Date.now() };
      setChats([fresh]); setActiveId(fresh.id);
    } else { setChats(remaining); if (activeId === id) setActiveId(remaining[0].id); }
  }

  return <main className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
      <div className="brand-row">
        <div className="brand-mark">AB</div>
        <div className="brand-name">AB <span>Agent</span></div>
        <button className="icon-btn sidebar-toggle" title="Collapse sidebar" onClick={() => setSidebarOpen(false)}>‹</button>
      </div>
      <button className="new-chat" onClick={newChat}><span>＋</span> New chat <kbd>⌘ K</kbd></button>
      <div className="side-label">YOUR CHATS</div>
      <div className="chat-list">
        {chats.map(chat => <div className={`chat-item ${chat.id === activeId ? "selected" : ""}`} key={chat.id}>
          <button className="chat-select" onClick={() => { setActiveId(chat.id); setNotice(""); }}>{chat.title}</button>
          <button className="delete-chat" title="Delete chat" onClick={() => deleteChat(chat.id)}>×</button>
        </div>)}
      </div>
      <div className="sidebar-bottom">
        <div className="profile">
          <div className="avatar">AB</div><div><b>AB Agent</b><small>Personal AI assistant</small></div>
        </div>
        <div className="privacy-note">Your chats stay in this browser.</div>
      </div>
    </aside>

    <section className="main-panel">
      <header className="topbar">
        <div className="top-left">
          {!sidebarOpen && <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">☰</button>}
          <span className="mobile-brand">AB Agent</span>
          <div className="model-pill"><span className="status-dot"></span> AI Assistant <span className="pill-chevron">⌄</span></div>
        </div>
        <div className="top-right"><span className="powered">POWERED BY VERCEL AI GATEWAY</span><div className="top-avatar">AB</div></div>
      </header>

      <div className={`conversation ${messages.length === 0 ? "empty" : ""}`}>
        {messages.length === 0 ? <div className="welcome">
          <div className="welcome-orb"><div className="orb-inner">AB</div><span className="orb-spark">✦</span></div>
          <div className="eyebrow">YOUR PERSONAL AI</div>
          <h1>How can I help<br/><span>you today?</span></h1>
          <p>Ask anything, build something, or solve a problem.<br/>I’m AB Agent — ready when you are.</p>
          <div className="starter-grid">
            {starterPrompts.map(p => <button className="starter-card" key={p.title} onClick={() => sendMessage(p.text)}>
              <span className="starter-icon">{p.icon}</span><span><b>{p.title}</b><small>{p.text}</small></span><span className="starter-arrow">↗</span>
            </button>)}
          </div>
        </div> : <div className="message-list">
          {messages.map(m => <div className={`message-row ${m.role}`} key={m.id}>
            {m.role === "assistant" && <div className="message-avatar">AB</div>}
            <div className="message-content">
              {m.role === "user" ? <div className="user-bubble">{m.content}</div> : <div className="assistant-text">{renderText(m.content)}</div>}
            </div>
          </div>)}
          {busy && <div className="message-row assistant"><div className="message-avatar">AB</div><div className="typing"><span></span><span></span><span></span><small>AB Agent is thinking…</small></div></div>}
          <div ref={bottomRef}/>
        </div>}
      </div>

      <div className="composer-wrap">
        {notice && <div className="error-notice"><span>⚠</span> {notice} <button onClick={() => setNotice("")}>×</button></div>}
        <div className="composer">
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Message AB Agent… ask me anything or write code"
            rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }} />
          <div className="composer-tools"><div className="composer-hint"><span>↵</span> send <span className="hint-divider">·</span> shift + ↵ new line</div>
            <button className={`send-btn ${input.trim() ? "ready" : ""}`} disabled={!input.trim() || busy} onClick={() => sendMessage()} title="Send message">{busy ? <span className="spinner"/> : "↑"}</button>
          </div>
        </div>
        <div className="disclaimer">AB Agent can make mistakes. Check important information. <span>Built with care ✦</span></div>
      </div>
    </section>
  </main>;
}
