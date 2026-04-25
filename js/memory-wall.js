/**
 * Memory Wall
 * Guests leave messages that persist in browser storage
 */

(function() {
  'use strict';

  const form = document.getElementById('memoryForm');
  const nameInput = document.getElementById('memoryName');
  const messageInput = document.getElementById('memoryMessage');
  const wall = document.getElementById('memoryWall');
  const emptyState = document.getElementById('memoryEmpty');

  if (!form || !wall) return;

  const STORAGE_KEY = 'emmanuel_memory_wall';

  // ---- Load Messages ----
  function loadMessages() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // ---- Save Messages ----
  function saveMessages(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save to localStorage');
    }
  }

  // ---- Get Initials ----
  function getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // ---- Format Date ----
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ---- Create Memory Card ----
  function createMemoryCard(memory, index) {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.style.animationDelay = (index * 0.1) + 's';
    card.innerHTML = `
      <div class="memory-card-header">
        <div class="memory-avatar">${getInitials(memory.name)}</div>
        <div>
          <div class="memory-author">${escapeHtml(memory.name)}</div>
          <div class="memory-date">${formatDate(memory.date)}</div>
        </div>
      </div>
      <p class="memory-text">${escapeHtml(memory.message)}</p>
    `;
    return card;
  }

  // ---- Escape HTML ----
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Render Wall ----
  function renderWall() {
    const messages = loadMessages();

    // Clear wall except empty state
    Array.from(wall.children).forEach(child => {
      if (child.id !== 'memoryEmpty') {
        child.remove();
      }
    });

    if (messages.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      // Show newest first
      [...messages].reverse().forEach((memory, index) => {
        wall.appendChild(createMemoryCard(memory, index));
      });
    }
  }

  // ---- Add Memory ----
  function addMemory(name, message) {
    const messages = loadMessages();
    messages.push({
      name: name.trim(),
      message: message.trim(),
      date: new Date().toISOString()
    });
    saveMessages(messages);
    renderWall();

    // Scroll to the new memory
    setTimeout(() => {
      const firstCard = wall.querySelector('.memory-card');
      if (firstCard) {
        firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Play sound
    playTone(523, 0.2, 0.1);
    setTimeout(() => playTone(659, 0.2, 0.1), 100);
    setTimeout(() => playTone(784, 0.3, 0.1), 200);
  }

  // ---- Form Submit ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    addMemory(name, message);
    form.reset();
    nameInput.focus();
  });

  // ---- Sound ----
  function playTone(freq, duration, volume) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // ---- Init ----
  renderWall();
})();

