JavaScript

const API_URL = "/api/chat";

let chats = JSON.parse(localStorage.getItem("nexa_chats") || "[]");
let currentChat = [];
let busy = false;

const input = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const sendBtn = document.getElementById("sendBtn");

function saveChats() {
  localStorage.setItem("nexa_chats", JSON.stringify(chats));
}

function renderHistory() {
  const history = document.getElementById("history");
  history.innerHTML = "";

  chats.forEach((chat, index) => {
    const btn = document.createElement("button");
    btn.textContent = "💬 " + (chat.title || "New Chat");
    btn.onclick = () => openChat(index);
    history.appendChild(btn);
  });
}

function renderMessage(role, text) {
  welcome.style.display = "none";

  const row = document.createElement("div");
  row.className = "message " + role;

  const icon = document.createElement("div");
  icon.className = "message-icon";
  icon.textContent = role === "user" ? "👤" : "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  if (role === "user") {
    row.appendChild(bubble);
    row.appendChild(icon);
  } else {
    row.appendChild(icon);
    row.appendChild(bubble);
  }

  messages.appendChild(row);
  document.getElementById("chatArea").scrollTop =
    document.getElementById("chatArea").scrollHeight;
}

function displayAll() {
  messages.innerHTML = "";
  if (currentChat.length === 0) {
    welcome.style.display = "block";
    return;
  }
  currentChat.forEach(m => renderMessage(m.role, m.text));
}

function newChat() {
  currentChat = [];
  displayAll();
  input.focus();
}

function openChat(index) {
  currentChat = chats[index].messages.map(m => ({...m}));
  displayAll();
}

function clearChat() {
  if (!confirm("क्या आप वर्तमान चैट साफ करना चाहते हैं?")) return;
  newChat();
}

function saveCurrentChat() {
  if (!currentChat.length) return;

  const title = currentChat.find(m => m.role === "user")?.text
    .slice(0, 35) || "New Chat";

  const existing = chats.findIndex(c =>
    c.messages === currentChat
  );

  if (existing >= 0) {
    chats[existing].messages = [...currentChat];
    chats[existing].title = title;
  } else {
    chats.unshift({
      title,
      messages: [...currentChat]
    });
  }

  chats = chats.slice(0, 30);
  saveChats();
  renderHistory();
}

async function sendMessage() {
  const text = input.value.trim();

  if (!text || busy) return;

  busy = true;
  sendBtn.disabled = true;

  currentChat.push({role: "user", text});
  renderMessage("user", text);

  input.value = "";

  const loading = document.createElement("div");
  loading.className = "message bot";
  loading.innerHTML = '<div class="message-icon">✦</div><div class="bubble">NEXA सोच रहा है... ⏳</div>';
  messages.appendChild(loading);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        message: text,
        history: currentChat.slice(-12)
      })
    });

    if (!response.ok) {
      throw new Error("API Error: " + response.status);
    }

    const data = await response.json();
    const answer = data.reply || data.answer || data.response;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("API से जवाब नहीं मिला");
    }

    loading.remove();
    currentChat.push({role: "assistant", text: answer});
    renderMessage("bot", answer);
    saveCurrentChat();

  } catch (error) {
    loading.remove();
    const errorText = "माफ कीजिए! AI सर्वर से कनेक्शन नहीं हो पाया। API और Backend चेक करें।";
    renderMessage("bot", errorText);
    console.error(error);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

function handleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function askSuggestion(text) {
  input.value = text;
  sendMessage();
}

function showChat() {
  newChat();
  document.querySelectorAll(".side-item").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".side-item")[0].classList.add("active");
  toggleSidebar(false);
}

function showGK() {
  input.value = "मुझे चार विकल्पों के साथ 5 सामान्य ज्ञान के सवाल पूछो। एक बार में एक सवाल पूछना।";
  sendMessage();
  toggleSidebar(false);
}

function showVoice() {
  startVoice();
  toggleSidebar(false);
}

function toggleSidebar(force) {
  const side = document.getElementById("sidebar");
  if (typeof force === "boolean") {
    side.classList.toggle("open", force);
  } else {
    side.classList.toggle("open");
  }
}

function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("आपके ब्राउज़र में Voice Input उपलब्ध नहीं है। Chrome में खोलकर देखें।");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = event => {
    input.value = event.results[0][0].transcript;
    input.focus();
  };

  recognition.onerror = () => {
    alert("आवाज पहचानने में समस्या हुई। दोबारा कोशिश करें।");
  };

  recognition.start();
}

renderHistory();
displayAll();

