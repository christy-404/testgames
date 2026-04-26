/**
 * Reaction Time Challenge
 * Test your reflexes with Firebase shared leaderboard
 */

(function() {
  'use strict';

  /* ---------- DOM Elements ---------- */
  const nameEntryScreen       = document.getElementById('nameEntryScreen');
  const alreadyPlayedScreen   = document.getElementById('alreadyPlayedScreen');
  const gameContainer         = document.getElementById('gameContainer');
  const resultScreen          = document.getElementById('resultScreen');
  const rulesSection          = document.getElementById('rulesSection');

  const playerNameInput       = document.getElementById('playerNameInput');
  const startGameBtn          = document.getElementById('startGameBtn');
  const nameError             = document.getElementById('nameError');

  const reactionGameArea      = document.getElementById('reactionGameArea');
  const reactionStartBtn      = document.getElementById('reactionStartBtn');
  const reactionStatusText    = document.getElementById('reactionStatusText');
  const reactionStatusSub     = document.getElementById('reactionStatusSub');
  const reactionStatusIcon    = document.getElementById('reactionStatusIcon');

  const resultTime            = document.getElementById('resultTime');
  const resultTitle           = document.getElementById('resultTitle');
  const resultMessage         = document.getElementById('resultMessage');
  const resultRank            = document.getElementById('resultRank');
  const performanceTitle      = document.getElementById('performanceTitle');
  const personalRankDisplay   = document.getElementById('personalRankDisplay');
  const leaderboardList       = document.getElementById('leaderboardList');
  const personalRankOutside   = document.getElementById('personalRankOutside');

  /* Already-played screen elements */
  const playedReactionTime    = document.getElementById('playedReactionTime');
  const playedMessage         = document.getElementById('playedMessage');
  const playedRankBadge       = document.getElementById('playedRankBadge');
  const playedPersonalRank    = document.getElementById('playedPersonalRank');
  const playedLeaderboardList = document.getElementById('playedLeaderboardList');
  const playedPersonalRankOutside = document.getElementById('playedPersonalRankOutside');

  if (!gameContainer) return;

  /* ---------- localStorage ---------- */
  const LS_PLAYER = 'emmanuelReactionPlayerName';
  const LS_PLAYED = 'emmanuelReactionPlayed';

  function getSavedPlayerName() {
    return localStorage.getItem(LS_PLAYER) || '';
  }

  function markPlayed(name) {
    localStorage.setItem(LS_PLAYED, 'true');
    localStorage.setItem(LS_PLAYER, name);
  }

  function hasPlayed() {
    return localStorage.getItem(LS_PLAYED) === 'true';
  }

  /* ---------- Firestore helpers ---------- */
  function entriesRef() {
    return db.collection('reactionTimeEntries');
  }

  async function fetchAllEntries() {
    try {
      const snap = await entriesRef().get();
      return snap.docs.map(d => d.data());
    } catch (e) {
      console.error('fetchAllEntries error:', e);
      return [];
    }
  }

  async function checkNameExists(name) {
    try {
      const nameLower = name.toLowerCase().trim();
      const snap = await entriesRef().where('nameLower', '==', nameLower).limit(1).get();
      if (snap.empty) return null;
      return snap.docs[0].data();
    } catch (e) {
      console.error('checkNameExists error:', e);
      return null;
    }
  }

  async function saveEntry(entry) {
    try {
      await entriesRef().add(entry);
    } catch (e) {
      console.error('saveEntry error:', e);
    }
  }

  function sortEntries(entries) {
    return [...entries].sort((a, b) => {
      if (a.status === 'success' && b.status !== 'success') return -1;
      if (a.status !== 'success' && b.status === 'success') return 1;
      if (a.status === 'success' && b.status === 'success') {
        return (a.reactionTime || Infinity) - (b.reactionTime || Infinity);
      }
      return (a.submittedAt || 0) - (b.submittedAt || 0);
    });
  }

  function getPlayerRank(board, name) {
    const idx = board.findIndex(e => e.name.toLowerCase().trim() === name.toLowerCase().trim());
    return idx >= 0 ? idx + 1 : null;
  }

  /* ---------- Game State ---------- */
  let gameState = 'idle';
  let startTime = 0;
  let timeoutId = null;
  let playerName = '';

  /* ---------- Icons SVG ---------- */
  const icons = {
    idle: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    waiting: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    ready: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
    tooEarly: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    result: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>'
  };

  function setGameState(state) {
    gameState = state;
    reactionGameArea.className = 'reaction-game-area state-' + state;

    switch(state) {
      case 'idle':
        reactionStatusText.textContent = 'Press Start';
        reactionStatusSub.textContent = 'When the screen turns gold, tap as fast as you can';
        reactionStatusIcon.innerHTML = icons.idle;
        reactionStartBtn.style.display = 'inline-flex';
        reactionStartBtn.disabled = false;
        reactionStartBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Start Challenge';
        break;
      case 'waiting':
        reactionStatusText.textContent = 'WAIT...';
        reactionStatusSub.textContent = 'Get ready...';
        reactionStatusIcon.innerHTML = icons.waiting;
        reactionStartBtn.style.display = 'none';
        break;
      case 'ready':
        reactionStatusText.textContent = 'TAP NOW!';
        reactionStatusSub.textContent = 'As fast as you can!';
        reactionStatusIcon.innerHTML = icons.ready;
        playTone(880, 0.15, 0.2);
        break;
      case 'too-early':
        reactionStatusText.textContent = 'TOO EARLY';
        reactionStatusSub.textContent = 'You clicked before the signal';
        reactionStatusIcon.innerHTML = icons.tooEarly;
        reactionStartBtn.style.display = 'inline-flex';
        reactionStartBtn.disabled = false;
        reactionStartBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Try Again';
        break;
    }
  }

  /* ---------- Page init ---------- */
  async function initPage() {
    if (hasPlayed()) {
      const savedName = getSavedPlayerName();
      if (savedName) {
        const entry = await checkNameExists(savedName);
        if (entry) {
          await showAlreadyPlayed(entry);
        } else {
          showNameEntry();
          if (playerNameInput) playerNameInput.value = savedName;
        }
      } else {
        showNameEntry();
      }
    } else {
      showNameEntry();
    }
  }

  function showNameEntry() {
    nameEntryScreen.style.display = 'block';
    rulesSection.style.display = 'block';
    alreadyPlayedScreen.style.display = 'none';
    gameContainer.style.display = 'none';
    resultScreen.style.display = 'none';
    if (playerNameInput) {
      playerNameInput.value = '';
    }
    if (nameError) {
      nameError.style.display = 'none';
      nameError.textContent = 'Please enter a valid name (2-30 characters).';
    }
    if (playerNameInput) playerNameInput.focus();
  }

  async function showAlreadyPlayed(entry) {
    nameEntryScreen.style.display = 'none';
    rulesSection.style.display = 'none';
    alreadyPlayedScreen.style.display = 'block';
    gameContainer.style.display = 'none';
    resultScreen.style.display = 'none';

    const isSuccess = entry.status === 'success';

    if (isSuccess && entry.reactionTime != null) {
      playedReactionTime.textContent = entry.reactionTime + ' ms';
      playedRankBadge.textContent = getPerformanceTitle(entry.reactionTime);
      playedMessage.textContent = getPerformanceMessage(entry.reactionTime);
    } else {
      playedReactionTime.textContent = 'FAIL';
      playedRankBadge.textContent = 'Too Early';
      playedMessage.textContent = 'You clicked before the signal. Patience is key!';
    }

    const all = await fetchAllEntries();
    const board = sortEntries(all);
    const rank = getPlayerRank(board, entry.name);

    if (rank) {
      playedPersonalRank.textContent = 'Your Rank: #' + rank;
      playedPersonalRank.style.display = 'block';
    } else {
      playedPersonalRank.style.display = 'none';
    }

    renderLeaderboardFromBoard(playedLeaderboardList, playedPersonalRankOutside, entry.name, board);
  }

  /* ---------- Name entry / start ---------- */
  async function handleStartGame() {
    startGameBtn.disabled = true;
    const rawName = playerNameInput.value.trim();
    if (rawName.length < 2 || rawName.length > 30) {
      if (nameError) {
        nameError.textContent = 'Please enter a valid name (2-30 characters).';
        nameError.style.display = 'block';
      }
      startGameBtn.disabled = false;
      return;
    }

    const existing = await checkNameExists(rawName);
    if (existing) {
      markPlayed(rawName);
      await showAlreadyPlayed(existing);
      return;
    }

    if (nameError) nameError.style.display = 'none';
    playerName = rawName;
    startGameBtn.disabled = false;
    startGame();
  }

  startGameBtn.addEventListener('click', handleStartGame);
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleStartGame();
  });
  playerNameInput.addEventListener('input', () => {
    if (nameError) {
      nameError.style.display = 'none';
      nameError.textContent = 'Please enter a valid name (2-30 characters).';
    }
  });

  /* ---------- Game flow ---------- */
  function startGame() {
    nameEntryScreen.style.display = 'none';
    rulesSection.style.display = 'none';
    alreadyPlayedScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    resultScreen.style.display = 'none';
    setGameState('idle');
  }

  function beginGame() {
    if (gameState !== 'idle' && gameState !== 'too-early') return;
    setGameState('waiting');

    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    timeoutId = setTimeout(() => {
      setGameState('ready');
      startTime = performance.now();
    }, delay);
  }

  function handleInteraction() {
    if (gameState === 'waiting') {
      clearTimeout(timeoutId);
      setGameState('too-early');
      playTone(200, 0.4, 0.1);
      saveAndShowResult(null, 'too-early');
    } else if (gameState === 'ready') {
      const reactionTime = Math.round(performance.now() - startTime);
      saveAndShowResult(reactionTime, 'success');
    }
  }

  async function saveAndShowResult(reactionTime, status) {
    const entry = {
      name: playerName,
      nameLower: playerName.toLowerCase().trim(),
      reactionTime: status === 'success' ? reactionTime : null,
      status: status,
      submittedAt: Date.now()
    };

    let board = [];
    try {
      await Promise.race([
        saveEntry(entry),
        new Promise((_, reject) => setTimeout(() => reject(new Error('save timeout')), 8000))
      ]);
      markPlayed(playerName);

      const all = await Promise.race([
        fetchAllEntries(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('fetch timeout')), 8000))
      ]);
      board = sortEntries(all);
    } catch (e) {
      console.error('Firebase error in saveAndShowResult:', e);
      markPlayed(playerName);
    }

    if (status === 'too-early') {
      setTimeout(() => {
        showResults(entry, board);
      }, 1500);
    } else {
      showResults(entry, board);
    }
  }

  function showResults(entry, board) {
    gameContainer.style.display = 'none';
    resultScreen.style.display = 'block';

    const isSuccess = entry.status === 'success' && entry.reactionTime != null;

    if (isSuccess) {
      resultTime.textContent = entry.reactionTime + ' ms';
      resultTitle.textContent = 'Your Reaction Time';
      resultMessage.textContent = getPerformanceMessage(entry.reactionTime);
      performanceTitle.textContent = getPerformanceTitle(entry.reactionTime);
      resultRank.textContent = getPerformanceTitle(entry.reactionTime);

      if (entry.reactionTime <= 250) {
        createConfetti();
      }
    } else {
      resultTime.textContent = 'FAIL';
      resultTitle.textContent = 'Too Early';
      resultMessage.textContent = 'You clicked before the signal. Patience is key!';
      performanceTitle.textContent = 'Too Early';
      resultRank.textContent = 'Failed';
    }

    const rank = getPlayerRank(board, entry.name);
    if (rank) {
      personalRankDisplay.textContent = 'Your Rank: #' + rank;
      personalRankDisplay.style.display = 'block';
    } else {
      personalRankDisplay.style.display = 'none';
    }

    renderLeaderboardFromBoard(leaderboardList, personalRankOutside, entry.name, board);
  }

  /* ---------- Performance Titles ---------- */
  function getPerformanceTitle(ms) {
    if (ms == null) return 'Too Early';
    if (ms < 180) return 'Are you Spider-Man?';
    if (ms <= 250) return 'Elite Reflexes';
    if (ms <= 350) return 'Respectable';
    return 'Bro was buffering';
  }

  function getPerformanceMessage(ms) {
    if (ms == null) return 'You clicked before the signal. Patience is key!';
    if (ms < 180) return 'Superhuman reflexes! Your reaction time is absolutely incredible.';
    if (ms <= 250) return 'Outstanding! You have elite-level reflexes.';
    if (ms <= 350) return 'Solid performance! Your reflexes are respectable.';
    return 'Better luck next time! Keep practicing those reflexes.';
  }

  /* ---------- Render Leaderboard ---------- */
  function renderLeaderboardFromBoard(container, outsideContainer, currentName, board) {
    const top10 = board.slice(0, 10);
    const currentNameLower = currentName.toLowerCase().trim();
    const playerRank = getPlayerRank(board, currentName);

    container.innerHTML = '';

    if (top10.length === 0) {
      container.innerHTML = '<div class="leaderboard-empty">No entries yet. Be the first!</div>';
      outsideContainer.style.display = 'none';
      return;
    }

    top10.forEach((entry, index) => {
      const rank = index + 1;
      const isCurrent = entry.name.toLowerCase().trim() === currentNameLower;
      const rankClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : 'rank-default';
      const scoreText = entry.status === 'success' && entry.reactionTime != null ? entry.reactionTime + ' ms' : 'Fail';
      const item = document.createElement('div');
      item.className = 'leaderboard-item ' + rankClass + (isCurrent ? ' is-current' : '');
      item.innerHTML =
        '<div class="leaderboard-rank">#' + rank + '</div>' +
        '<div class="leaderboard-name">' + escapeHtml(entry.name) + (isCurrent ? ' <span class="you-badge">You</span>' : '') + '</div>' +
        '<div class="leaderboard-score">' + scoreText + '</div>';
      container.appendChild(item);
    });

    if (playerRank && playerRank > 10) {
      outsideContainer.innerHTML = '<div class="personal-rank-outside-text">Your Rank: <strong>#' + playerRank + '</strong></div>';
      outsideContainer.style.display = 'block';
    } else {
      outsideContainer.style.display = 'none';
    }
  }

  /* ---------- Event Listeners ---------- */
  reactionStartBtn.addEventListener('click', beginGame);

  reactionGameArea.addEventListener('mousedown', (e) => {
    if (e.button === 0) handleInteraction();
  });

  reactionGameArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInteraction();
  }, { passive: false });

  /* ---------- Utilities ---------- */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------- Sound ---------- */
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

  /* ---------- Confetti ---------- */
  function createConfetti() {
    const colors = ['#d4af37', '#f0d878', '#a08020', '#ffffff', '#cbd5e1'];
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText =
        'position:fixed;' +
        'width:' + (Math.random() * 8 + 4) + 'px;' +
        'height:' + (Math.random() * 8 + 4) + 'px;' +
        'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
        'left:' + (Math.random() * 100) + 'vw;' +
        'top:-10px;' +
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';' +
        'opacity:' + (Math.random() * 0.5 + 0.5) + ';' +
        'animation:confettiFall ' + (Math.random() * 3 + 2) + 's linear forwards;' +
        'animation-delay:' + (Math.random() * 2) + 's;' +
        'z-index:1000;' +
        'pointer-events:none;';
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 5000);
    }
  }

  /* ---------- Kick off ---------- */
  initPage();
})();

