const socket = io();

const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username-input');
const form = document.getElementById('chat-form');
const input = document.getElementById('msg');
const fileInput = document.getElementById('file');
const messages = document.getElementById('messages');
const typingStatus = document.getElementById('typing-status');
const emojiPanel = document.getElementById('emoji-panel');
const audio = document.getElementById('ping-sound');
const sendSound = document.getElementById('send-sound');

let username = sessionStorage.getItem("chatUsername");
const userId = Math.random().toString(36).substr(2, 9);

// Login
if (!username) {
  loginScreen.style.display = 'flex';
} else {
  loginScreen.style.display = 'none';
}

loginBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (name) {
    username = name;
    sessionStorage.setItem("chatUsername", name);
    loginScreen.style.display = 'none';
  }
});

// Emoji
emojiPanel.addEventListener('click', (e) => {
  if (e.target.tagName === 'SPAN') {
    input.value += e.target.textContent;
    input.focus();
  }
});

// Typing
let typingTimeout;
input.addEventListener('input', () => {
  socket.emit('typing', { username });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop typing');
  }, 1000);
});

// Send message
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const message = input.value.trim();
  const file = fileInput.files[0];

  if (message || file) {
    const payload = {
      message: message || '',
      userId,
      username,
      time: new Date().toLocaleTimeString(),
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        payload.file = {
          name: file.name,
          type: file.type,
          data: reader.result
        };
        socket.emit('chat message', payload);
        sendSound.play();
      };
      reader.readAsDataURL(file);
    } else {
      socket.emit('chat message', payload);
      sendSound.play();
    }

    input.value = '';
    fileInput.value = '';
    socket.emit('stop typing');
  }
});

// Display message
function displayMessage(data) {
  const item = document.createElement('li');
  if (data.userId === userId) item.classList.add('own');

  let content = `<strong>${data.username}</strong> @ ${data.time}<br>${data.message}`;

  if (data.file) {
    if (data.file.type.startsWith('image/')) {
      content += `<br><img src="${data.file.data}" alt="image">`;
    } else if (data.file.type.startsWith('video/')) {
      content += `<br><video controls style="max-width: 300px;">
                    <source src="${data.file.data}" type="${data.file.type}">
                  </video>`;
    }
  }

  item.innerHTML = content;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;

  if (data.userId !== userId) audio.play();
}

// Receive chat
socket.on('chat message', displayMessage);

// Chat history
socket.on('chat history', (history) => {
  history.forEach(displayMessage);
});

// Typing indicator
socket.on('typing', ({ username }) => {
  typingStatus.textContent = `${username} is typing...`;
});
socket.on('stop typing', () => {
  typingStatus.textContent = '';
});
