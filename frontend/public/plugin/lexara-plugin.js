/*!
 * Lexara Accessibility Plugin v1.0
 * Embeddable widget for exam platforms, LMS, and CBT systems.
 * Drop-in: <script src="https://lexara.vercel.app/plugin/lexara-plugin.js" data-api-key="YOUR_KEY"></script>
 *
 * Architecture:
 *  - Pure vanilla JS, zero dependencies, no React
 *  - Shadow DOM for complete CSS isolation from the host page
 *  - All API calls proxied through the Lexara Next.js gateway (/api/v1/*)
 *  - MutationObserver watches for script-tag removal → auto-destroys widget
 */

(function (window, document) {
  "use strict";

  // ─── 1. Self-locate the script tag ────────────────────────────────────────
  const _scriptTag = document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  // Derive apiBase from the script's own origin so it works on localhost AND Vercel
  const _scriptOrigin = _scriptTag
    ? new URL(_scriptTag.src, location.href).origin
    : location.origin;

  const _dataApiKey = _scriptTag ? _scriptTag.getAttribute("data-api-key") : null;
  const _dataApiBase = _scriptTag ? _scriptTag.getAttribute("data-api-base") : null;

  // ─── 2. Internal state ────────────────────────────────────────────────────
  let _config = {
    apiKey: _dataApiKey || "",
    apiBase: _dataApiBase || `${_scriptOrigin}/api/v1`,
  };

  let _shadowHost = null;
  let _shadowRoot = null;
  let _panel = null;
  let _fab = null;
  let _open = false;
  let _dyslexicActive = false;
  let _dyslexicStyleEl = null;
  let _currentAudio = null;
  let _observer = null;
  let _status = null;

  let _autoMode      = false;     // overlay visible?
  let _questions     = [];        // NodeList of question elements
  let _qIndex        = 0;         // current question index
  let _autoObserver  = null;      // IntersectionObserver for auto-scroll watch
  let _autoDyslexicOn = false;    // dyslexic font active in reading mode?
  let _autoBoldOn    = false;     // bold active in reading mode?

  // ─── 3. API helper ────────────────────────────────────────────────────────
  async function _apiCall(path, options = {}) {
    if (!_config.apiKey) throw new Error("Lexara: no API key set.");
    const url = `${_config.apiBase}${path}`;
    const headers = Object.assign({ "x-api-key": _config.apiKey }, options.headers || {});
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `API error ${res.status}`);
    }
    return res.json();
  }

  // ─── 4. TTS ───────────────────────────────────────────────────────────────
  async function _tts(text, language) {
    if (!text || !text.trim()) {
      _setStatus("⚠️ No text to read.");
      return;
    }
    _setStatus("🔊 Generating audio…");
    try {
      if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
      const data = await _apiCall("/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), language: language || "en" }),
      });
      // audio_url is a path like /static/abc.mp3 — prepend the origin
      const audioSrc = data.audio_url.startsWith("http")
        ? data.audio_url
        : `${_scriptOrigin}${data.audio_url}`;
      _currentAudio = new Audio(audioSrc);
      _currentAudio.onplay  = () => _setStatus("▶️ Playing…");
      _currentAudio.onended = () => _setStatus("✅ Done.");
      _currentAudio.onerror = () => _setStatus("❌ Audio playback error.");
      _currentAudio.play();
    } catch (e) {
      _setStatus("❌ " + e.message);
    }
  }

  // ─── 5. OCR ───────────────────────────────────────────────────────────────
  async function _ocr(file) {
    _setStatus("🔍 Extracting text…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await _apiCall("/ocr", { method: "POST", body: fd });
      _setStatus(`✅ Extracted ${data.count ?? 0} page(s).`);
      return data;
    } catch (e) {
      _setStatus("❌ " + e.message);
    }
  }

  // ─── 6. Health ────────────────────────────────────────────────────────────
  async function _health() {
    _setStatus("⏳ Checking API…");
    try {
      // health is public — call without auth header
      const res = await fetch(`${_config.apiBase}/health`);
      const data = await res.json();
      _setStatus(res.ok ? `✅ ${data.status}` : "❌ Gateway unreachable");
    } catch {
      _setStatus("❌ Cannot reach API.");
    }
  }

  // ─── 7. Simplify ──────────────────────────────────────────────────────────
  async function _simplify(text) {
    if (!text || !text.trim()) {
      _setStatus("⚠️ Highlight some text first.");
      return;
    }
    if (text.length > 2000) {
      _setStatus("⚠️ Text too long (max 2000 chars).");
      return;
    }
    _setStatus("✨ Simplifying…");
    _showResultCard(null, null); // clear previous
    try {
      const data = await _apiCall("/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      _setStatus("✅ Simplified!");
      _showResultCard(data.original_text, data.simplified_text);
    } catch (e) {
      _setStatus("❌ " + e.message);
    }
  }

  // ─── 8. Dyslexia font toggle ──────────────────────────────────────────────
  function _toggleDyslexicFont() {
    _dyslexicActive = !_dyslexicActive;
    if (_dyslexicActive) {
      _dyslexicStyleEl = document.createElement("style");
      _dyslexicStyleEl.id = "__lexara_dyslexic__";
      _dyslexicStyleEl.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&display=swap');
        * { font-family: 'Lexend', sans-serif !important;
            letter-spacing: 0.07em !important;
            line-height: 1.9 !important; }
      `;
      document.head.appendChild(_dyslexicStyleEl);
      _setStatus("🔤 Dyslexia font ON");
    } else {
      const el = document.getElementById("__lexara_dyslexic__");
      if (el) el.remove();
      _dyslexicStyleEl = null;
      _setStatus("🔤 Dyslexia font OFF");
    }
    // Update button label
    const btn = _shadowRoot && _shadowRoot.getElementById("lexara-font-btn");
    if (btn) btn.textContent = _dyslexicActive ? "🔤 Dyslexia Font: ON" : "🔤 Dyslexia Font: OFF";
  }

  // ─── 9. Get selected / auto-detected question text ───────────────────────
  function _getExamText() {
    const sel = window.getSelection ? window.getSelection().toString().trim() : "";
    if (sel) return sel;
    // Auto-detect common exam question selectors
    const selectors = [
      ".question", ".exam-question", ".question-text",
      "[data-question]", ".mcq-question", ".q-text",
      "p", "li"
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText && el.innerText.trim().length > 10) {
        return el.innerText.trim().slice(0, 500);
      }
    }
    return "";
  }

  // ─── 10. Status bar helper ─────────────────────────────────────────────────
  function _setStatus(msg) {
    if (_status) {
      _status.textContent = msg;
      _status.style.opacity = "1";
      clearTimeout(_status._timer);
      _status._timer = setTimeout(() => { if (_status) _status.style.opacity = "0"; }, 4000);
    }
  }

  // ─── 11. Auto Simplify Mode ─────────────────────────────────────────────

  /** Scan host page for all question elements */
  function _detectQuestions() {
    const selectors = [
      ".question", ".exam-question", ".question-text",
      "[data-question]", ".mcq-question", ".q-text",
      ".question-item", ".quiz-question",
    ];
    for (const s of selectors) {
      const found = Array.from(document.querySelectorAll(s))
        .filter(el => el.innerText && el.innerText.trim().length > 20);
      // Deduplicate: remove elements that are ancestors of another element in the list
      const deduped = found.filter(el =>
        !found.some(other => other !== el && el.contains(other))
      );
      if (deduped.length) return deduped;
    }
    // Fallback: paragraphs/list-items with substantial content (80+ chars, question-like)
    const all = Array.from(document.querySelectorAll("p, li"))
      .filter(el => {
        const t = (el.innerText || "").trim();
        // Must be 80+ chars. Skip pure navigation, headers, button-like text.
        return t.length > 80 && t.split(" ").length > 8;
      });
    // Further deduplicate by removing elements contained inside another match
    return all
      .filter(el => !all.some(other => other !== el && other.contains(el)))
      .slice(0, 10);
  }

  /** Update the overlay nav counter and button states */
  function _autoUpdateNav() {
    if (!_shadowRoot) return;
    const counter   = _shadowRoot.getElementById("lexara-auto-counter");
    const prevBtn   = _shadowRoot.getElementById("lexara-auto-prev");
    const nextBtn   = _shadowRoot.getElementById("lexara-auto-next");
    if (counter) counter.textContent = `Question ${_qIndex + 1} of ${_questions.length}`;
    if (prevBtn) prevBtn.disabled = _qIndex === 0;
    if (nextBtn) nextBtn.disabled = _qIndex === _questions.length - 1;
  }

  /** Simplify and display question at index idx */
  async function _autoShowQuestion(idx) {
    if (!_questions.length) return;
    idx = Math.max(0, Math.min(idx, _questions.length - 1));
    _qIndex = idx;
    _autoUpdateNav();
    const el = _questions[idx];
    const text = (el.innerText || el.textContent || "").trim().slice(0, 2000);
    if (!text) return;

    // Scroll host page to the question element
    el.scrollIntoView && el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Update overlay content
    const origEl = _shadowRoot && _shadowRoot.getElementById("lexara-auto-orig-text");
    const simpEl = _shadowRoot && _shadowRoot.getElementById("lexara-auto-simp-text");
    const statusEl = _shadowRoot && _shadowRoot.getElementById("lexara-auto-status");
    if (origEl) origEl.textContent = text;
    if (simpEl) simpEl.textContent = "";
    if (statusEl) statusEl.textContent = "✨ Simplifying…";

    try {
      const data = await _apiCall("/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (simpEl) simpEl.textContent = data.simplified_text || "";
      if (statusEl) statusEl.textContent = "";
    } catch (e) {
      if (statusEl) statusEl.textContent = "❌ " + e.message;
    }
  }

  /** Navigate prev / next */
  function _autoNavigate(dir) {
    _autoShowQuestion(_qIndex + dir);
  }

  /** Open the Exam Reading Mode overlay */
  function _startAutoMode() {
    _autoMode = true;
    _questions = _detectQuestions();
    _qIndex = 0;

    const overlay = _shadowRoot && _shadowRoot.getElementById("lexara-auto-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
    }
    _autoUpdateNav();
    _updateAutoFontStyles();
    _stopAutoAudio();

    if (!_questions.length) {
      const statusEl = _shadowRoot && _shadowRoot.getElementById("lexara-auto-status");
      if (statusEl) statusEl.textContent = "⚠️ No questions detected on this page.";
      return;
    }

    // Optional: watch questions scrolling into view
    if ("IntersectionObserver" in window) {
      _autoObserver = new IntersectionObserver((entries) => {
        if (!_autoMode) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = _questions.indexOf(entry.target);
            if (idx !== -1 && idx !== _qIndex) {
              _qIndex = idx;
              _autoUpdateNav();
            }
          }
        }
      }, { threshold: 0.6 });
      _questions.forEach(q => _autoObserver.observe(q));
    }

    _autoShowQuestion(0);
  }

  /** Close the Exam Reading Mode overlay */
  function _closeAutoMode() {
    _autoMode = false;
    _stopAutoAudio();
    const overlay = _shadowRoot && _shadowRoot.getElementById("lexara-auto-overlay");
    if (overlay) overlay.classList.add("hidden");
    if (_autoObserver) { _autoObserver.disconnect(); _autoObserver = null; }
  }

  /** Update font classes in reading mode */
  function _updateAutoFontStyles() {
    if (!_shadowRoot) return;
    const simpText = _shadowRoot.getElementById("lexara-auto-simp-text");
    if (simpText) {
      simpText.classList.toggle("dyslexic-mode", _autoDyslexicOn);
      simpText.classList.toggle("bold-mode", _autoBoldOn);
    }
    const fontBtn = _shadowRoot.getElementById("lexara-auto-font-btn");
    const boldBtn = _shadowRoot.getElementById("lexara-auto-bold-btn");
    if (fontBtn) fontBtn.textContent = _autoDyslexicOn ? "Dyslexic Font: ON" : "Dyslexic Font: OFF";
    if (boldBtn) boldBtn.textContent = _autoBoldOn ? "Bold: ON" : "Bold: OFF";
  }

  // ── Audio for Exam Reading Mode ──
  let _autoAudioEl = null;
  function _stopAutoAudio() {
    if (_autoAudioEl) {
      _autoAudioEl.pause();
      _autoAudioEl = null;
    }
    const playBtn = _shadowRoot && _shadowRoot.getElementById("lexara-auto-play-btn");
    if (playBtn) {
      playBtn.textContent = "▶ Play Audio";
      playBtn.classList.remove("active");
    }
  }

  async function _toggleAutoAudio(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const playBtn = _shadowRoot.getElementById("lexara-auto-play-btn");
    const simpText = _shadowRoot.getElementById("lexara-auto-simp-text");
    const statusEl = _shadowRoot.getElementById("lexara-auto-status");

    // If already playing, stop it
    if (_autoAudioEl && !_autoAudioEl.paused) {
      _stopAutoAudio();
      return;
    }

    const t = simpText && simpText.textContent ? simpText.textContent.trim() : "";
    if (!t || t.startsWith("Processing")) return;

    try {
      if (statusEl) statusEl.textContent = "Generating audio...";
      playBtn.textContent = "⏳ Loading...";
      playBtn.classList.add("active");

      const r = await _apiCall("/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, language: "en" })
      });
      const data = r;
      if (!data.audio_url) throw new Error("No URL returned");

      if (statusEl) statusEl.textContent = "Playing audio...";
      
      const audioUrl = data.audio_url.startsWith("http")
        ? data.audio_url
        : `${_config.apiBase.replace(/\/api\/v1\/?$/, "")}${data.audio_url}`;
      
      _autoAudioEl = new Audio(audioUrl);
      
      _autoAudioEl.addEventListener("ended", () => {
        if (statusEl) statusEl.textContent = "";
        _stopAutoAudio();
      });
      _autoAudioEl.addEventListener("error", () => {
        if (statusEl) statusEl.textContent = "Audio playback failed.";
        _stopAutoAudio();
      });

      _autoAudioEl.play();
      playBtn.textContent = "⏸ Stop Audio";
    } catch (e) {
      if (statusEl) statusEl.textContent = "Error playing audio.";
      _stopAutoAudio();
    }
  }

  // ─── 12. Result card helper ──────────────────────────────────────────────
  function _showResultCard(original, simplified) {
    const card = _shadowRoot && _shadowRoot.getElementById("lexara-result-card");
    if (!card) return;
    if (!simplified) {
      card.style.display = "none";
      _panel && _panel.classList.remove("expanded");
      return;
    }
    card.style.display = "block";
    // Expand panel width for comfortable reading
    _panel && _panel.classList.add("expanded");
    const origEl = _shadowRoot.getElementById("lexara-result-orig");
    const simpEl = _shadowRoot.getElementById("lexara-result-simp");
    if (origEl) origEl.textContent = original || "";
    if (simpEl) simpEl.textContent = simplified;
    // Scroll to show the result card
    setTimeout(() => { card.scrollIntoView && card.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 100);
  }

  // ─── 13. Widget HTML ──────────────────────────────────────────────────────
  
  // We compute the base font URL dynamically so the plugin works from anywhere
  const _fontsBase = _config.apiBase.replace(/\/api\/v1\/?$/, "") + "/fonts";

  const WIDGET_CSS = `
    @font-face {
      font-family: "OpenDyslexic";
      src: url("${_fontsBase}/OpenDyslexic-Regular.otf") format("opentype");
    }
    @font-face {
      font-family: "OpenDyslexicBold";
      src: url("${_fontsBase}/OpenDyslexic-Bold.otf") format("opentype");
    }

    :host { all: initial; }

    #lexara-fab {
      position: fixed; bottom: 28px; right: 28px; z-index: 2147483647;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #0071e3, #6e3af0);
      border: none; cursor: pointer; box-shadow: 0 4px 24px rgba(0,113,227,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; transition: transform 0.2s, box-shadow 0.2s;
      color: #fff; font-family: sans-serif;
    }
    #lexara-fab:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(0,113,227,0.7); }

    #lexara-panel {
      position: fixed; bottom: 96px; right: 28px; z-index: 2147483646;
      width: 320px;
      max-height: 85vh;
      overflow-y: auto;
      background: rgba(15,15,20,0.96);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 0;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      backdrop-filter: blur(24px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      overflow-x: hidden;
      transform-origin: bottom right;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s, width 0.3s ease;
    }
    #lexara-panel.expanded { width: 420px; }
    #lexara-panel.hidden { transform: scale(0.6) translateY(30px); opacity: 0; pointer-events: none; }

    #lexara-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    #lexara-header span { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; color: rgba(255,255,255,0.8); }
    #lexara-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 99px;
      background: rgba(0,113,227,0.25); color: #60a5fa;
      border: 1px solid rgba(0,113,227,0.4); font-weight: 600;
    }

    #lexara-body { padding: 16px 16px 8px; display: flex; flex-direction: column; gap: 12px; }

    .lexara-group-label {
      font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; color: rgba(255,255,255,0.35);
      margin-top: 8px; margin-bottom: -4px;
    }
    .lexara-group-label:first-child { margin-top: 0; }

    .lexara-btn {
      width: 100%; height: 52px; padding: 0 16px; border-radius: 12px; border: none;
      text-align: left; cursor: pointer; font-size: 16px; font-weight: 600;
      display: flex; align-items: center; gap: 12px;
      transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
      color: rgba(255,255,255,0.9);
    }
    .lexara-btn:active { transform: scale(0.97); }
    .lexara-btn.blue  { background: rgba(0,113,227,0.2); }
    .lexara-btn.blue:hover  { background: rgba(0,113,227,0.35); box-shadow: 0 4px 12px rgba(0,113,227,0.2); }
    .lexara-btn.purple { background: rgba(110,58,240,0.2); }
    .lexara-btn.purple:hover { background: rgba(110,58,240,0.35); box-shadow: 0 4px 12px rgba(110,58,240,0.2); }
    .lexara-btn.teal  { background: rgba(20,184,166,0.2); }
    .lexara-btn.teal:hover  { background: rgba(20,184,166,0.35); box-shadow: 0 4px 12px rgba(20,184,166,0.2); }
    .lexara-btn.green { background: rgba(52,211,153,0.15); }
    .lexara-btn.green:hover { background: rgba(52,211,153,0.30); box-shadow: 0 4px 12px rgba(52,211,153,0.2); }
    .lexara-btn.orange { background: rgba(251,146,60,0.18); }
    .lexara-btn.orange:hover { background: rgba(251,146,60,0.34); box-shadow: 0 4px 12px rgba(251,146,60,0.2); }
    .lexara-btn.gray  { background: rgba(255,255,255,0.07); }
    .lexara-btn.gray:hover  { background: rgba(255,255,255,0.12); box-shadow: 0 4px 12px rgba(255,255,255,0.05); }

    #lexara-file-input { display: none; }

    #lexara-status {
      font-size: 11px; padding: 6px 12px 10px;
      color: rgba(255,255,255,0.45); text-align: center;
      transition: opacity 0.4s;
      min-height: 22px;
    }

    #lexara-footer {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 8px 12px;
      display: flex; align-items: center; gap-6;
      font-size: 10px; color: rgba(255,255,255,0.25);
      justify-content: center; gap: 6px;
    }
    #lexara-footer a { color: rgba(0,113,227,0.7); text-decoration: none; }

    /* ── Result card (Simplify output) ── */
    #lexara-result-card {
      display: none;
      margin: 0 12px 14px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.12);
      font-size: 14px;
      animation: lexara-fadein 0.3s ease;
    }
    @keyframes lexara-fadein {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .lexara-result-section {
      padding: 14px 16px;
    }
    .lexara-result-section + .lexara-result-section {
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .lexara-result-label {
      font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
      text-transform: uppercase; margin-bottom: 8px;
    }
    .lexara-result-label.orig  { color: rgba(255,255,255,0.35); }
    .lexara-result-label.simp  { color: #34d399; }
    /* Original text — muted, smaller */
    #lexara-result-orig-section .lexara-result-text {
      font-size: 12px;
      color: rgba(255,255,255,0.50);
      line-height: 1.65;
      letter-spacing: 0.01em;
      white-space: pre-wrap; word-break: break-word;
    }
    /* Simplified text — large, spaced, easy to read */
    #lexara-result-simp-section .lexara-result-text {
      font-size: 15px;
      font-weight: 500;
      color: rgba(255,255,255,0.92);
      line-height: 1.85;
      letter-spacing: 0.025em;
      white-space: pre-wrap; word-break: break-word;
    }
    #lexara-result-orig-section { background: rgba(255,255,255,0.03); }
    #lexara-result-simp-section { background: rgba(52,211,153,0.08); }  

    /* ── Exam Reading Mode overlay ── */
    #lexara-auto-overlay {
      position: fixed; inset: 0; z-index: 2147483645;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.78);
      backdrop-filter: blur(8px);
      transition: opacity 0.25s;
      padding: 24px;
    }
    #lexara-auto-overlay.hidden {
      display: none;
    }

    #lexara-auto-card {
      width: min(1600px, 95vw);
      height: 90vh;
      display: flex; flex-direction: column;
      background: rgba(14,16,22,0.98);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 28px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.8);
      backdrop-filter: blur(24px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      animation: lexara-zoom 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes lexara-zoom {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    #lexara-auto-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 32px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
    #lexara-auto-title {
      font-size: 14px; font-weight: 800; letter-spacing: 0.1em;
      text-transform: uppercase; color: #34d399;
    }
    #lexara-auto-controls {
      display: flex; align-items: center; gap: 8px;
    }
    .lexara-auto-toggle-btn {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 700;
      padding: 6px 12px; border-radius: 99px; cursor: pointer;
      text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.15s;
    }
    .lexara-auto-toggle-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .lexara-auto-toggle-btn.active {
      background: rgba(110,58,240,0.25); border-color: rgba(110,58,240,0.5);
      color: #c4b5fd;
    }
    
    #lexara-auto-play-btn {
      font-size: 33px;
      padding: 18px 36px;
      border-radius: 100px;
      margin-right: 20px;
      background: rgba(0,113,227,0.2);
      border-color: rgba(0,113,227,0.5);
      color: #fff;
    }
    #lexara-auto-play-btn:hover { background: rgba(0,113,227,0.4); transform: scale(1.05); }
    #lexara-auto-play-btn.active { background: rgba(110,58,240,0.6); color: #fff; }

    #lexara-auto-counter {
      font-size: 14px; color: rgba(255,255,255,0.40); font-weight: 600;
      margin-left: 14px;
    }
    #lexara-auto-close {
      background: rgba(255,255,255,0.1); border: none; color: #fff;
      border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
      font-size: 18px; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    #lexara-auto-close:hover { background: rgba(255,80,80,0.35); }

    #lexara-auto-body { 
      padding: 40px 50px; 
      overflow-y: auto; 
      flex-grow: 1; 
    }

    /* Original — collapsible, muted */
    #lexara-auto-orig-wrap {
      margin-bottom: 30px;
    }
    #lexara-auto-orig-toggle {
      display: flex; align-items: center; gap: 10px; cursor: pointer;
      font-size: 13px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: rgba(255,255,255,0.40);
      margin-bottom: 12px; user-select: none; border: none; background: none;
      padding: 0;
    }
    #lexara-auto-orig-toggle:hover { color: rgba(255,255,255,0.65); }
    #lexara-auto-orig-text {
      font-size: 15px; color: rgba(255,255,255,0.45);
      line-height: 1.8; letter-spacing: 0.01em;
      padding: 16px 20px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      white-space: pre-wrap; word-break: break-word;
    }
    #lexara-auto-orig-text.collapsed { display: none; }

    /* Simplified — main, large, dyslexia-optimised */
    #lexara-auto-simp-label {
      font-size: 13px; font-weight: 800; letter-spacing: 0.15em;
      text-transform: uppercase; color: #34d399; margin-bottom: 16px;
    }
    #lexara-auto-simp-text {
      font-size: 28px;
      font-weight: 400;
      color: rgba(255,255,255,0.95);
      line-height: 1.9;
      letter-spacing: 0.02em;
      white-space: pre-wrap; word-break: break-word;
      padding: 40px 60px;
      background: rgba(52,211,153,0.06);
      border: 1px solid rgba(52,211,153,0.15);
      border-radius: 20px;
      min-height: 120px;
      transition: all 0.2s ease;
      max-width: 1400px;
      margin: 0 auto;
    }
    #lexara-auto-simp-text.dyslexic-mode {
      font-family: "OpenDyslexic", sans-serif;
    }
    #lexara-auto-simp-text.bold-mode {
      font-weight: 700;
    }
    #lexara-auto-simp-text.dyslexic-mode.bold-mode {
      font-family: "OpenDyslexicBold", sans-serif;
      font-weight: normal; /* The font itself is bold */
    }

    #lexara-auto-status {
      font-size: 15px; color: rgba(255,255,255,0.50);
      padding: 12px 0; text-align: center;
    }

    #lexara-auto-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 32px;
      border-top: 1px solid rgba(255,255,255,0.06);
      gap: 16px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
    .lexara-auto-nav {
      padding: 14px 28px; border-radius: 14px; border: none;
      font-size: 17px; font-weight: 700; cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      color: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .lexara-auto-nav:active { transform: scale(0.96); }
    .lexara-auto-nav:disabled { opacity: 0.3; cursor: not-allowed; }
    #lexara-auto-prev { background: rgba(255,255,255,0.10); }
    #lexara-auto-prev:not(:disabled):hover { background: rgba(255,255,255,0.20); }
    #lexara-auto-next { background: rgba(0,113,227,0.6); }
    #lexara-auto-next:not(:disabled):hover { background: rgba(0,113,227,0.85); }
    #lexara-auto-exit {
      background: rgba(239,68,68,0.15); color: rgba(255,255,255,0.7);
      font-size: 15px; padding: 12px 24px;
    }
    #lexara-auto-exit:hover { background: rgba(239,68,68,0.30); color: #fff; }
  `;

  const WIDGET_HTML = `
    <style>${WIDGET_CSS}</style>

    <button id="lexara-fab" title="Lexara Accessibility">♿</button>

    <!-- ── Exam Reading Mode overlay ── -->
    <div id="lexara-auto-overlay" class="hidden">
      <div id="lexara-auto-card">
        <div id="lexara-auto-header">
          <span id="lexara-auto-title">📖 Exam Reading Mode</span>
          <div id="lexara-auto-controls">
            <button class="lexara-auto-toggle-btn" id="lexara-auto-play-btn">▶ Play Audio</button>
            <button class="lexara-auto-toggle-btn" id="lexara-auto-font-btn">Dyslexic Font: OFF</button>
            <button class="lexara-auto-toggle-btn" id="lexara-auto-bold-btn">Bold: OFF</button>
            <span id="lexara-auto-counter">Question 1 of 1</span>
          </div>
          <button id="lexara-auto-close" title="Close">✕</button>
        </div>
        <div id="lexara-auto-body">
          <div id="lexara-auto-orig-wrap">
            <button id="lexara-auto-orig-toggle">▶ Original Question</button>
            <div id="lexara-auto-orig-text" class="collapsed"></div>
          </div>
          <div id="lexara-auto-simp-label">✨ Simplified Version</div>
          <div id="lexara-auto-simp-text"></div>
          <div id="lexara-auto-status"></div>
        </div>
        <div id="lexara-auto-footer">
          <button class="lexara-auto-nav" id="lexara-auto-prev">← Previous</button>
          <button class="lexara-auto-nav" id="lexara-auto-exit">✕ Close Reading Mode</button>
          <button class="lexara-auto-nav" id="lexara-auto-next">Next →</button>
        </div>
      </div>
    </div>

    <div id="lexara-panel" class="hidden">
      <div id="lexara-header">
        <span>⚡ Lexara Accessibility</span>
        <span id="lexara-badge">v1.0</span>
      </div>

      <div id="lexara-body">
        <div class="lexara-group-label">Reading Tools</div>
        <button class="lexara-btn blue"  id="lexara-tts-sel-btn">🔊 Read Selected Text</button>
        <button class="lexara-btn blue"  id="lexara-tts-auto-btn">🎯 Read Question (Auto)</button>
        
        <div class="lexara-group-label">AI Assistance</div>
        <button class="lexara-btn green" id="lexara-simplify-btn">✨ Simplify Selected Text</button>
        <button class="lexara-btn orange" id="lexara-auto-mode-btn">📖 Exam Reading Mode</button>
        
        <div class="lexara-group-label">Accessibility</div>
        <button class="lexara-btn purple" id="lexara-font-btn">🔤 Dyslexia Font: OFF</button>
        
        <div class="lexara-group-label">Utilities</div>
        <button class="lexara-btn teal"  id="lexara-ocr-btn">📄 OCR Scanner</button>
        <button class="lexara-btn gray"  id="lexara-health-btn">🌐 Check API Status</button>
        <input  type="file" id="lexara-file-input" accept=".pdf,.png,.jpg,.jpeg,.webp" />
      </div>

      <div id="lexara-status"></div>

      <!-- ── Simplify result card ── -->
      <div id="lexara-result-card">
        <div class="lexara-result-section" id="lexara-result-orig-section">
          <div class="lexara-result-label orig">Original</div>
          <div class="lexara-result-text" id="lexara-result-orig"></div>
        </div>
        <div class="lexara-result-section" id="lexara-result-simp-section">
          <div class="lexara-result-label simp">✨ Simplified</div>
          <div class="lexara-result-text" id="lexara-result-simp"></div>
        </div>
      </div>

      <div id="lexara-footer">
        Powered by <a href="https://github.com/theway-kamyavardhan/lexara" target="_blank">Lexara Air</a>
      </div>
    </div>
  `;

  // ─── 11. Build widget ─────────────────────────────────────────────────────
  function _buildWidget() {
    _shadowHost = document.createElement("div");
    _shadowHost.id = "__lexara_plugin_host__";
    _shadowHost.style.cssText = "all:initial;position:fixed;z-index:2147483647;";
    document.body.appendChild(_shadowHost);

    _shadowRoot = _shadowHost.attachShadow({ mode: "open" });
    _shadowRoot.innerHTML = WIDGET_HTML;

    _fab    = _shadowRoot.getElementById("lexara-fab");
    _panel  = _shadowRoot.getElementById("lexara-panel");
    _status = _shadowRoot.getElementById("lexara-status");

    // Toggle panel
    _fab.addEventListener("click", () => {
      _open = !_open;
      _panel.classList.toggle("hidden", !_open);
      _fab.textContent = _open ? "✕" : "♿";
    });

    // Read selected text
    _shadowRoot.getElementById("lexara-tts-sel-btn").addEventListener("click", () => {
      const t = window.getSelection ? window.getSelection().toString().trim() : "";
      if (t) _tts(t);
      else _setStatus("⚠️ Highlight some text first, then click.");
    });

    // Auto-detect question text
    _shadowRoot.getElementById("lexara-tts-auto-btn").addEventListener("click", () => {
      const t = _getExamText();
      if (t) _tts(t);
      else _setStatus("⚠️ No question text detected on page.");
    });

    // Simplify selected text
    _shadowRoot.getElementById("lexara-simplify-btn").addEventListener("click", () => {
      const t = window.getSelection ? window.getSelection().toString().trim() : "";
      _simplify(t || _getExamText());
    });

    // Dyslexia font
    _shadowRoot.getElementById("lexara-font-btn").addEventListener("click", _toggleDyslexicFont);

    // OCR — triggers hidden file input
    _shadowRoot.getElementById("lexara-ocr-btn").addEventListener("click", () => {
      _shadowRoot.getElementById("lexara-file-input").click();
    });

    _shadowRoot.getElementById("lexara-file-input").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) _ocr(f);
      e.target.value = "";
    });

    // Health check
    _shadowRoot.getElementById("lexara-health-btn").addEventListener("click", _health);

    // ── Exam Reading Mode ──
    _shadowRoot.getElementById("lexara-auto-mode-btn").addEventListener("click", () => {
      // close widget panel first for clarity
      _open = false;
      _panel.classList.add("hidden");
      _fab.textContent = "♿";
      _startAutoMode();
    });

    // Close overlay (✕ header button)
    _shadowRoot.getElementById("lexara-auto-close").addEventListener("click", _closeAutoMode);

    // Close overlay (footer button)
    _shadowRoot.getElementById("lexara-auto-exit").addEventListener("click", _closeAutoMode);

    // Previous / Next question
    _shadowRoot.getElementById("lexara-auto-prev").addEventListener("click", () => _autoNavigate(-1));
    _shadowRoot.getElementById("lexara-auto-next").addEventListener("click", () => _autoNavigate(+1));

    // Toggle collapse on original-question section
    _shadowRoot.getElementById("lexara-auto-orig-toggle").addEventListener("click", () => {
      const origText   = _shadowRoot.getElementById("lexara-auto-orig-text");
      const toggleBtn  = _shadowRoot.getElementById("lexara-auto-orig-toggle");
      if (!origText) return;
      const collapsed = origText.classList.toggle("collapsed");
      toggleBtn.textContent = (collapsed ? "▶" : "▼") + " Original Question";
    });

    // Font toggles in reading mode
    const autoFontBtn = _shadowRoot.getElementById("lexara-auto-font-btn");
    const autoBoldBtn = _shadowRoot.getElementById("lexara-auto-bold-btn");
    autoFontBtn.addEventListener("click", () => {
      _autoDyslexicOn = !_autoDyslexicOn;
      autoFontBtn.classList.toggle("active", _autoDyslexicOn);
      _updateAutoFontStyles();
    });
    autoBoldBtn.addEventListener("click", () => {
      _autoBoldOn = !_autoBoldOn;
      autoBoldBtn.classList.toggle("active", _autoBoldOn);
      _updateAutoFontStyles();
    });
    
    // Play Audio toggle
    _shadowRoot.getElementById("lexara-auto-play-btn").addEventListener("click", _toggleAutoAudio);

    // ESC key closes overlay
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && _autoMode) _closeAutoMode();
    });
  }

  // ─── 12. Script-removal watchdog ─────────────────────────────────────────
  function _watchScriptRemoval() {
    if (!_scriptTag) return;
    _observer = new MutationObserver(() => {
      if (!document.contains(_scriptTag)) {
        _plugin.destroy();
      }
    });
    _observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ─── 13. Public API ───────────────────────────────────────────────────────
  const _plugin = {
    /**
     * Manually initialise (or re-configure) the plugin.
     * Called automatically on page load if data-api-key is present.
     */
    init(config) {
      if (config) {
        if (config.apiKey)  _config.apiKey  = config.apiKey;
        if (config.apiBase) _config.apiBase = config.apiBase;
      }
      if (!_config.apiKey) {
        console.warn("Lexara Plugin: no API key provided. Pass data-api-key on the <script> tag.");
      }
      if (!_shadowHost) {
        _buildWidget();
        _watchScriptRemoval();
        console.info(`%cLexara Plugin ✓ loaded — API: ${_config.apiBase}`, "color:#0071e3;font-weight:bold");
      }
      return this;
    },

    /** Tear down everything — called when the <script> tag is removed. */
    destroy() {
      _closeAutoMode();
      if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
      if (_dyslexicStyleEl) { _dyslexicStyleEl.remove(); _dyslexicStyleEl = null; }
      if (_shadowHost)  { _shadowHost.remove(); _shadowHost = null; }
      if (_observer)    { _observer.disconnect(); _observer = null; }
      _open = false; _dyslexicActive = false; _panel = null; _fab = null; _status = null;
      _questions = []; _qIndex = 0;
      console.info("Lexara Plugin: destroyed.");
    },

    /** Programmatically invoke TTS on any text string. */
    speak(text, language) { return _tts(text, language); },

    /** Programmatically invoke OCR on a File object. */
    scanFile(file) { return _ocr(file); },

    /** Launch Exam Reading Mode — auto-detects and simplifies questions. */
    startAutoSimplifyMode() { return _startAutoMode(); },

    /** Close Exam Reading Mode overlay. */
    stopAutoSimplifyMode() { return _closeAutoMode(); },

    /** Returns the current config. */
    getConfig() { return Object.assign({}, _config); },
  };

  // ─── 14. Expose globally ──────────────────────────────────────────────────
  window.LexaraPlugin = _plugin;

  // ─── 15. Auto-init on DOM ready ───────────────────────────────────────────
  function _autoInit() {
    if (_dataApiKey) {
      _plugin.init();
    } else {
      console.warn("Lexara Plugin: add data-api-key attribute to the <script> tag to auto-initialise.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _autoInit);
  } else {
    _autoInit();
  }

}(window, document));
