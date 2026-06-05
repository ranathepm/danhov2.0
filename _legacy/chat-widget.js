(function () {
  'use strict';

  const API = '/api/chat';
  const WELCOME = "Welcome to DANHOV. I'm your personal jewelry advisor — here to help you find a piece that speaks to your soul. What are you looking for today?";

  let msgs = [];
  let isOpen = false;
  let isLoading = false;

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* Floating button */
    #dnh-btn {
      position: fixed; bottom: 32px; right: 32px;
      width: 62px; height: 62px; border-radius: 50%;
      background: #AC3438; border: none; cursor: pointer;
      z-index: 99999; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 28px rgba(172,52,56,0.4);
      transition: transform 0.22s ease, box-shadow 0.22s ease;
    }
    #dnh-btn:hover { transform: scale(1.1); box-shadow: 0 6px 36px rgba(172,52,56,0.5); }
    @keyframes dnh-pulse {
      0%,100% { box-shadow: 0 4px 28px rgba(172,52,56,0.4); }
      50% { box-shadow: 0 4px 40px rgba(172,52,56,0.75), 0 0 0 10px rgba(172,52,56,0.12); }
    }
    #dnh-btn { animation: dnh-pulse 2.8s ease-in-out 1.5s 3; }
    #dnh-btn-label {
      position: absolute; bottom: 70px; right: 0;
      background: #1a1410; color: #faf6f1;
      font-family: 'Jost', sans-serif; font-size: 11px;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 5px 10px; border-radius: 4px; white-space: nowrap;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s; transform: translateY(4px);
    }
    #dnh-btn:hover #dnh-btn-label { opacity: 1; transform: translateY(0); }

    /* Chat window */
    #dnh-win {
      position: fixed; bottom: 108px; right: 32px;
      width: 370px; max-height: 560px;
      background: #faf6f1; border-radius: 16px;
      box-shadow: 0 12px 56px rgba(0,0,0,0.18);
      z-index: 99998; display: flex; flex-direction: column;
      overflow: hidden; font-family: 'Jost', sans-serif;
      transform: scale(0.9) translateY(20px); opacity: 0; pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1), opacity 0.22s ease;
    }
    #dnh-win.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }

    /* Header */
    .dnh-hdr {
      background: #1a1410; padding: 16px 18px;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .dnh-hdr-left { display: flex; align-items: center; gap: 10px; }
    .dnh-avatar {
      width: 34px; height: 34px; border-radius: 50%; background: #AC3438;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; color: #fff; flex-shrink: 0;
    }
    .dnh-title { display: flex; flex-direction: column; }
    .dnh-title-name {
      font-family: 'Cormorant Garamond', serif; font-size: 15px;
      color: #faf6f1; font-weight: 500; letter-spacing: 0.1em;
    }
    .dnh-title-sub { font-size: 10px; color: #8a7f76; letter-spacing: 0.06em; text-transform: uppercase; }
    .dnh-close {
      background: none; border: none; cursor: pointer; color: #6a5f57;
      font-size: 18px; line-height: 1; padding: 4px; transition: color 0.15s;
    }
    .dnh-close:hover { color: #faf6f1; }

    /* Messages */
    .dnh-msgs {
      flex: 1; overflow-y: auto; padding: 18px 14px;
      display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth;
    }
    .dnh-msgs::-webkit-scrollbar { width: 3px; }
    .dnh-msgs::-webkit-scrollbar-thumb { background: #d4c9c0; border-radius: 2px; }
    .dnh-msg {
      max-width: 86%; padding: 10px 14px; border-radius: 12px;
      font-size: 13.5px; line-height: 1.6;
    }
    .dnh-msg.ai {
      background: #fff; color: #1a1410;
      border-bottom-left-radius: 3px; align-self: flex-start;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    .dnh-msg.user {
      background: #AC3438; color: #fff;
      border-bottom-right-radius: 3px; align-self: flex-end;
    }

    /* Typing dots */
    .dnh-typing {
      display: flex; align-items: center; gap: 5px; padding: 10px 14px;
      background: #fff; border-radius: 12px; border-bottom-left-radius: 3px;
      align-self: flex-start; box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    }
    .dnh-typing span {
      width: 6px; height: 6px; background: #AC3438; border-radius: 50%;
      animation: dnh-dot 1.2s infinite;
    }
    .dnh-typing span:nth-child(2) { animation-delay: 0.2s; }
    .dnh-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes dnh-dot {
      0%,60%,100% { transform: translateY(0); opacity: 0.35; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* Quick prompts */
    .dnh-quick {
      display: flex; flex-wrap: wrap; gap: 5px; padding: 0 14px 10px; flex-shrink: 0;
    }
    .dnh-qbtn {
      background: none; border: 1px solid #ddd4ca; border-radius: 20px;
      padding: 5px 11px; font-size: 11.5px; color: #5a4e47; cursor: pointer;
      font-family: 'Jost', sans-serif; transition: all 0.15s; white-space: nowrap;
    }
    .dnh-qbtn:hover { border-color: #AC3438; color: #AC3438; background: rgba(172,52,56,0.04); }

    /* Input row */
    .dnh-foot {
      padding: 10px 14px; border-top: 1px solid #ece6df;
      display: flex; gap: 8px; align-items: center;
      background: #faf6f1; flex-shrink: 0;
    }
    #dnh-input {
      flex: 1; border: 1px solid #d4c9c0; border-radius: 22px;
      padding: 9px 15px; font-size: 13.5px; font-family: 'Jost', sans-serif;
      background: #fff; color: #1a1410; outline: none; transition: border-color 0.15s;
    }
    #dnh-input:focus { border-color: #AC3438; }
    #dnh-input::placeholder { color: #b4a89d; }
    #dnh-send {
      width: 38px; height: 38px; border-radius: 50%; background: #AC3438;
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s, transform 0.15s;
    }
    #dnh-send:hover { background: #8B2A2D; transform: scale(1.07); }
    #dnh-send:disabled { background: #ccc4ba; cursor: default; transform: none; }

    /* ── Contextual trigger buttons ─────────────────────────── */
    .dnh-trigger {
      display: inline-flex; align-items: center; gap: 8px;
      background: transparent; border: 1px solid rgba(172,52,56,0.45);
      color: #AC3438; padding: 11px 22px; border-radius: 2px;
      font-family: 'Jost', sans-serif; font-size: 12px;
      letter-spacing: 0.1em; text-transform: uppercase;
      cursor: pointer; transition: all 0.2s; user-select: none;
    }
    .dnh-trigger:hover { background: #AC3438; color: #fff; border-color: #AC3438; }
    .dnh-trigger svg { flex-shrink: 0; }

    /* AI advisor panel strip (used in listing pages & homepage) */
    .dnh-panel {
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
      background: rgba(172,52,56,0.1); border: 1px solid rgba(172,52,56,0.28);
      border-radius: 6px; padding: 18px 26px; margin: 16px 0;
    }
    .dnh-panel-copy { flex: 1; }
    .dnh-panel-copy strong {
      display: block; font-family: 'Cormorant Garamond', serif;
      font-size: 17px; color: #faf6f1; margin-bottom: 3px; font-style: italic;
    }
    .dnh-panel-copy span {
      font-family: 'Jost', sans-serif; font-size: 12.5px; color: #a09890; line-height: 1.5;
    }

    /* Inline "Ask AI" link style (small) */
    .dnh-inline-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: #AC3438; font-family: 'Jost', sans-serif; font-size: 12px;
      letter-spacing: 0.07em; text-transform: uppercase; cursor: pointer;
      border: none; background: none; padding: 0; transition: opacity 0.15s;
    }
    .dnh-inline-link:hover { opacity: 0.7; }

    @media (max-width: 480px) {
      #dnh-win { right: 0; left: 0; bottom: 0; width: 100%; border-radius: 16px 16px 0 0; max-height: 72vh; }
      #dnh-btn { bottom: 20px; right: 20px; }
      .dnh-panel { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `;
  document.head.appendChild(style);

  // ── Build floating button ────────────────────────────────────────────────────
  const btn = document.createElement('button');
  btn.id = 'dnh-btn';
  btn.setAttribute('aria-label', 'Open AI Jewelry Advisor');
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L13.4 8.4L20 10L13.4 11.6L12 18L10.6 11.6L4 10L10.6 8.4L12 2Z" fill="white"/>
      <circle cx="19" cy="19" r="1.8" fill="white" opacity="0.55"/>
      <circle cx="5.5" cy="17" r="1.1" fill="white" opacity="0.35"/>
    </svg>
    <span id="dnh-btn-label">AI Advisor</span>
  `;
  document.body.appendChild(btn);

  // ── Build chat window ────────────────────────────────────────────────────────
  const win = document.createElement('div');
  win.id = 'dnh-win';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'DANHOV AI Jewelry Advisor');
  win.innerHTML = `
    <div class="dnh-hdr">
      <div class="dnh-hdr-left">
        <div class="dnh-avatar">✦</div>
        <div class="dnh-title">
          <span class="dnh-title-name">DANHOV</span>
          <span class="dnh-title-sub">AI Jewelry Advisor</span>
        </div>
      </div>
      <button class="dnh-close" aria-label="Close chat">✕</button>
    </div>
    <div class="dnh-msgs" id="dnh-msgs"></div>
    <div class="dnh-quick" id="dnh-quick">
      <button class="dnh-qbtn" data-q="What makes DANHOV rings special?">What makes DANHOV special?</button>
      <button class="dnh-qbtn" data-q="Help me find the perfect engagement ring">Find an engagement ring</button>
      <button class="dnh-qbtn" data-q="What metals are available?">Available metals</button>
      <button class="dnh-qbtn" data-q="Can I get a custom size?">Custom sizing</button>
    </div>
    <div class="dnh-foot">
      <input id="dnh-input" type="text" placeholder="Ask anything about our jewelry…" autocomplete="off"/>
      <button id="dnh-send" aria-label="Send message">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M1.5 7.5H13.5M13.5 7.5L8.5 2.5M13.5 7.5L8.5 12.5" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(win);

  const msgsEl  = document.getElementById('dnh-msgs');
  const inputEl = document.getElementById('dnh-input');
  const sendEl  = document.getElementById('dnh-send');
  const quickEl = document.getElementById('dnh-quick');
  const closeEl = win.querySelector('.dnh-close');

  // ── Render ───────────────────────────────────────────────────────────────────
  function render(typing) {
    msgsEl.innerHTML = '';
    msgs.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'dnh-msg ' + (m.role === 'user' ? 'user' : 'ai');
      d.textContent = m.content;
      msgsEl.appendChild(d);
    });
    if (typing) {
      var t = document.createElement('div');
      t.className = 'dnh-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      msgsEl.appendChild(t);
    }
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  // ── Context detection ────────────────────────────────────────────────────────
  function getCtx() {
    var path = window.location.pathname;
    var style = new URLSearchParams(window.location.search).get('style');
    if (style) return 'Viewing product style: ' + style;
    if (path.includes('engagement')) return 'Browsing engagement rings';
    if (path.includes('wedding'))    return 'Browsing wedding bands';
    if (path.includes('fine'))       return 'Browsing fine jewelry';
    if (path.includes('mens'))       return "Browsing men's jewelry";
    return 'On the DANHOV homepage';
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function send(text) {
    text = (text || '').trim();
    if (!text || isLoading) return;
    isLoading = true;
    sendEl.disabled = true;
    msgs.push({ role: 'user', content: text });
    quickEl.style.display = 'none';
    render(true);
    try {
      var r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs, context: getCtx() }),
      });
      var data = await r.json();
      msgs.push({ role: 'assistant', content: data.content || "I'm sorry, I couldn't process that. Please try again." });
    } catch (_) {
      msgs.push({ role: 'assistant', content: "I'm having trouble connecting right now. Please contact us at care@danhov.com for assistance." });
    }
    isLoading = false;
    sendEl.disabled = false;
    render(false);
    inputEl.focus();
  }

  // ── Open / close ─────────────────────────────────────────────────────────────
  function open(preText) {
    isOpen = true;
    win.classList.add('open');
    if (msgs.length === 0) {
      msgs.push({ role: 'assistant', content: WELCOME });
      render(false);
    }
    if (preText) inputEl.value = preText;
    setTimeout(function () { inputEl.focus(); }, 280);
  }
  function close() {
    isOpen = false;
    win.classList.remove('open');
  }

  // ── Events ───────────────────────────────────────────────────────────────────
  btn.addEventListener('click', function () { isOpen ? close() : open(); });
  closeEl.addEventListener('click', close);

  sendEl.addEventListener('click', function () { send(inputEl.value); inputEl.value = ''; });
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(inputEl.value); inputEl.value = ''; }
  });

  quickEl.addEventListener('click', function (e) {
    var b = e.target.closest('.dnh-qbtn');
    if (b) send(b.dataset.q);
  });

  // Auto-wire any element with data-dnh attribute
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-dnh]');
    if (el) { e.preventDefault(); open(el.dataset.dnh || ''); }
  });

  // ── Public API ───────────────────────────────────────────────────────────────
  window.DanhovAI = { open: open, close: close, send: send };
})();
