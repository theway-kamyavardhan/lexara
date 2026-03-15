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

  // ─── 11. Result card helper ──────────────────────────────────────────────
  function _showResultCard(original, simplified) {
    const card = _shadowRoot && _shadowRoot.getElementById("lexara-result-card");
    if (!card) return;
    if (!simplified) { card.style.display = "none"; return; }
    card.style.display = "block";
    const origEl = _shadowRoot.getElementById("lexara-result-orig");
    const simpEl = _shadowRoot.getElementById("lexara-result-simp");
    if (origEl) origEl.textContent = original || "";
    if (simpEl) simpEl.textContent = simplified;
  }

  // ─── 12. Widget HTML ──────────────────────────────────────────────────────
  const WIDGET_CSS = `
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
      width: 300px;
      background: rgba(15,15,20,0.96);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 0;
      box-shadow: 0 24px 60px rgba(0,0,0,0.5);
      backdrop-filter: blur(24px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      overflow: hidden;
      transform-origin: bottom right;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
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

    #lexara-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }

    .lexara-btn {
      width: 100%; padding: 10px 14px; border-radius: 12px; border: none;
      text-align: left; cursor: pointer; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; gap: 10px;
      transition: background 0.15s, transform 0.1s;
      color: rgba(255,255,255,0.9);
    }
    .lexara-btn:active { transform: scale(0.97); }
    .lexara-btn.blue  { background: rgba(0,113,227,0.2); }
    .lexara-btn.blue:hover  { background: rgba(0,113,227,0.35); }
    .lexara-btn.purple { background: rgba(110,58,240,0.2); }
    .lexara-btn.purple:hover { background: rgba(110,58,240,0.35); }
    .lexara-btn.teal  { background: rgba(20,184,166,0.2); }
    .lexara-btn.teal:hover  { background: rgba(20,184,166,0.35); }
    .lexara-btn.green { background: rgba(52,211,153,0.15); }
    .lexara-btn.green:hover { background: rgba(52,211,153,0.30); }
    .lexara-btn.gray  { background: rgba(255,255,255,0.07); }
    .lexara-btn.gray:hover  { background: rgba(255,255,255,0.12); }

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
      margin: 0 12px 12px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.10);
      font-size: 12px;
    }
    .lexara-result-section {
      padding: 10px 12px;
    }
    .lexara-result-section + .lexara-result-section {
      border-top: 1px solid rgba(255,255,255,0.07);
    }
    .lexara-result-label {
      font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; margin-bottom: 5px;
    }
    .lexara-result-label.orig  { color: rgba(255,255,255,0.35); }
    .lexara-result-label.simp  { color: #34d399; }
    .lexara-result-text {
      color: rgba(255,255,255,0.80); line-height: 1.6;
      white-space: pre-wrap; word-break: break-word;
    }
    #lexara-result-orig-section { background: rgba(255,255,255,0.03); }
    #lexara-result-simp-section { background: rgba(52,211,153,0.07); }  
  `;

  const WIDGET_HTML = `
    <style>${WIDGET_CSS}</style>

    <button id="lexara-fab" title="Lexara Accessibility">♿</button>

    <div id="lexara-panel" class="hidden">
      <div id="lexara-header">
        <span>⚡ Lexara Accessibility</span>
        <span id="lexara-badge">v1.0</span>
      </div>

      <div id="lexara-body">
        <button class="lexara-btn blue"  id="lexara-tts-sel-btn">🔊 Read Selected Text</button>
        <button class="lexara-btn blue"  id="lexara-tts-auto-btn">🎯 Read Question (Auto)</button>
        <button class="lexara-btn green" id="lexara-simplify-btn">✨ Simplify Selected Text</button>
        <button class="lexara-btn purple" id="lexara-font-btn">🔤 Dyslexia Font: OFF</button>
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
      if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
      if (_dyslexicStyleEl) { _dyslexicStyleEl.remove(); _dyslexicStyleEl = null; }
      if (_shadowHost)  { _shadowHost.remove(); _shadowHost = null; }
      if (_observer)    { _observer.disconnect(); _observer = null; }
      _open = false; _dyslexicActive = false; _panel = null; _fab = null; _status = null;
      console.info("Lexara Plugin: destroyed.");
    },

    /** Programmatically invoke TTS on any text string. */
    speak(text, language) { return _tts(text, language); },

    /** Programmatically invoke OCR on a File object. */
    scanFile(file) { return _ocr(file); },

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
