/* ============================================
   CHATBOT BRIGADA DE INCÊNDIO — SCRIPT PREMIUM
   ============================================ */

const chat = document.getElementById("chat");
const mensagem = document.getElementById("mensagem");
const btnEnviar = document.getElementById("btnEnviar");
const btnLimpar = document.getElementById("btnLimpar");
const typingIndicator = document.getElementById("typingIndicator");
const quickReplies = document.getElementById("quickReplies");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const toastContainer = document.getElementById("toastContainer");

const API_URL = "https://chatbot-brigada-incendio-o5mv.onrender.com/chat";

const mensagemInicial =
  "Olá! Sou um assistente especializado em Brigada de Incêndio em Empresas. Posso ajudar com dúvidas sobre prevenção, evacuação, extintores, classes de incêndio e procedimentos básicos de emergência.";

const KEYWORDS = [
  "EXTINTOR", "EXTINTORES",
  "EVACUAÇÃO", "EVACUAR",
  "CLASSE A", "CLASSE B", "CLASSE C", "CLASSE D", "CLASSE K",
  "INCÊNDIO", "FOGO",
  "PREVENÇÃO", "PREVENIR",
  "EMERGÊNCIA",
  "ROTA DE FUGA", "SAÍDA DE EMERGÊNCIA",
  "BRIGADA", "BRIGADISTA",
  "ÁGUA", "PÓ QUÍMICO", "CO2", "DIOXIDO DE CARBONO",
  "ALARME", "SIRENE"
];

/* ---- Utilitários ---- */
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightKeywords(text) {
  let html = escapeHtml(text);
  KEYWORDS.forEach(kw => {
    const regex = new RegExp(`(${kw})`, "gi");
    html = html.replace(regex, '<span class="keyword-highlight">$1</span>');
  });
  return html;
}

/* ---- Ripple Effect ---- */
function createRipple(event, button) {
  const circle = document.createElement("span");
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  circle.style.width = circle.style.height = `${size}px`;
  circle.style.left = `${event.clientX - rect.left - size / 2}px`;
  circle.style.top = `${event.clientY - rect.top - size / 2}px`;
  circle.classList.add("ripple");
  const existing = button.getElementsByClassName("ripple");
  if (existing.length > 0) existing[0].remove();
  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

/* ---- Toast Notification ---- */
function showToast(title, message, actionText = null, actionCallback = null) {
  toastContainer.innerHTML = "";
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;
  if (actionText && actionCallback) {
    const btn = document.createElement("button");
    btn.className = "toast-action";
    btn.textContent = actionText;
    btn.addEventListener("click", () => {
      actionCallback();
      hideToast();
    });
    toast.appendChild(btn);
  }
  toastContainer.appendChild(toast);
  toastContainer.classList.add("visible");
}

function hideToast() {
  toastContainer.classList.remove("visible");
  setTimeout(() => { toastContainer.innerHTML = ""; }, 300);
}

/* ---- Status de Conexão ---- */
async function checkConnection() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(API_URL, { method: "OPTIONS", signal: controller.signal });
    clearTimeout(timeout);
    setOnline();
  } catch {
    setOffline();
  }
}

function setOnline() {
  statusDot.className = "status-dot online";
  statusText.textContent = "Online";
}

function setOffline() {
  statusDot.className = "status-dot offline";
  statusText.textContent = "Offline";
}

/* ---- Adicionar Mensagem ---- */
function adicionarMensagem(texto, tipo, useTypewriter = false) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", tipo);

  const avatar = document.createElement("div");
  avatar.classList.add("message-avatar");
  avatar.setAttribute("aria-hidden", "true");

  if (tipo === "bot") {
    avatar.classList.add("bot-avatar");
    avatar.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>`;
  } else {
    avatar.classList.add("user-avatar");
    avatar.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`;
  }

  const content = document.createElement("div");
  content.classList.add("message-content");

  const textDiv = document.createElement("div");
  textDiv.classList.add("message-text");

  const timeDiv = document.createElement("div");
  timeDiv.classList.add("message-time");
  timeDiv.textContent = getCurrentTime();

  content.appendChild(textDiv);
  content.appendChild(timeDiv);

  if (tipo === "user") {
    wrapper.appendChild(content);
    wrapper.appendChild(avatar);
    textDiv.textContent = texto;
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(content);
    if (useTypewriter) {
      typewriterEffect(textDiv, texto, 12);
    } else {
      textDiv.innerHTML = highlightKeywords(texto);
    }
  }

  chat.appendChild(wrapper);
  scrollToBottom();
}

/* ---- Efeito Máquina de Escrever ---- */
function typewriterEffect(element, text, speed = 12) {
  let i = 0;
  element.textContent = "";
  element.classList.add("typing");

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      scrollToBottom();
      setTimeout(type, speed);
    } else {
      element.classList.remove("typing");
      element.innerHTML = highlightKeywords(text);
    }
  }
  type();
}

/* ---- Scroll para o Fundo ---- */
function scrollToBottom() {
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

/* ---- Typing Indicator ---- */
function showTyping() {
  typingIndicator.classList.remove("hidden");
  scrollToBottom();
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
}

/* ---- Quick Replies ---- */
function setupQuickReplies() {
  quickReplies.querySelectorAll(".quick-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const question = chip.dataset.question;
      if (question) {
        mensagem.value = question;
        enviarMensagem();
      }
    });
  });
}

function hideQuickReplies() {
  quickReplies.style.display = "none";
}

function showQuickReplies() {
  quickReplies.style.display = "flex";
}

/* ---- Enviar Mensagem ---- */
async function enviarMensagem() {
  const texto = mensagem.value.trim();

  if (texto === "") {
    showToast("Atenção", "Digite uma pergunta antes de enviar.");
    return;
  }

  adicionarMensagem(texto, "user");
  mensagem.value = "";
  hideQuickReplies();
  showTyping();
  await checkConnection();

  try {
    const resposta = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mensagem: texto })
    });

    const dados = await resposta.json();
    hideTyping();

    if (!resposta.ok) {
      adicionarMensagem(dados.erro || "Erro ao processar a mensagem.", "bot", true);
      return;
    }

    adicionarMensagem(dados.resposta, "bot", true);

  } catch (erro) {
    hideTyping();
    setOffline();
    adicionarMensagem(
      "Erro ao conectar com o backend. Verifique se o servidor Python está em execução.",
      "bot",
      true
    );
    showToast(
      "Erro de Conexão",
      "Não foi possível conectar ao servidor backend.",
      "Tentar novamente",
      () => { enviarMensagem(); }
    );
    console.error(erro);
  }
}

/* ---- Limpar Conversa ---- */
function limparConversa() {
  chat.innerHTML = "";
  adicionarMensagem(mensagemInicial, "bot");
  showQuickReplies();
  quickReplies.style.display = "flex";
  chat.appendChild(quickReplies);
  scrollToBottom();
}

/* ---- Event Listeners ---- */
btnEnviar.addEventListener("click", (e) => {
  createRipple(e, btnEnviar);
  enviarMensagem();
});

btnLimpar.addEventListener("click", (e) => {
  createRipple(e, btnLimpar);
  limparConversa();
});

mensagem.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    enviarMensagem();
  }
});

/* ---- Inicialização ---- */
function init() {
  setupQuickReplies();
  checkConnection();
  setInterval(checkConnection, 30000);

  // Define timestamp da mensagem inicial
  const initialMsg = chat.querySelector(".message.bot");
  if (initialMsg) {
    const timeEl = initialMsg.querySelector(".message-time");
    if (timeEl) timeEl.textContent = getCurrentTime();
  }
}

init();
