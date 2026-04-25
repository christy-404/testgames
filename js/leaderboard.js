/**
 * Full Quiz Leaderboard
 * Standalone page for viewing complete quiz standings (Firebase real-time)
 */

(function() {
  'use strict';

  const leaderboardList = document.getElementById('fullLeaderboardList');
  const leaderboardEmpty = document.getElementById('leaderboardEmpty');
  const leaderboardStats = document.getElementById('leaderboardStats');
  const entryCountEl = document.getElementById('entryCount');
  const topScoreEl = document.getElementById('topScore');

  if (!leaderboardList) return;

  const LS_PLAYER = 'emmanuelQuizPlayerName';

  function getSavedPlayerName() {
    return localStorage.getItem(LS_PLAYER) || '';
  }

  function sortEntries(entries) {
    return [...entries].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.submittedAt || 0) - (b.submittedAt || 0);
    });
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderLeaderboard(board) {
    const currentPlayer = getSavedPlayerName().toLowerCase().trim();

    if (board.length === 0) {
      leaderboardList.style.display = 'none';
      leaderboardEmpty.style.display = 'block';
      if (leaderboardStats) leaderboardStats.style.display = 'none';
      return;
    }

    leaderboardList.style.display = 'flex';
    leaderboardEmpty.style.display = 'none';
    if (leaderboardStats) leaderboardStats.style.display = 'flex';

    if (entryCountEl) entryCountEl.textContent = board.length;
    if (topScoreEl) topScoreEl.textContent = `${board[0].score} / ${board[0].totalQuestions || 10}`;

    leaderboardList.innerHTML = '';

    board.forEach((entry, index) => {
      const rank = index + 1;
      const isCurrent = currentPlayer && entry.name.toLowerCase().trim() === currentPlayer;
      const rankClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : 'rank-default';
      const totalQuestions = entry.totalQuestions || 10;
      const timeText = formatDate(entry.submittedAt);

      const item = document.createElement('div');
      item.className = `full-leaderboard-item ${rankClass} ${isCurrent ? 'is-current' : ''}`;
      item.style.animationDelay = `${Math.min(index * 0.04, 1.5)}s`;

      item.innerHTML = `
        <div class="lb-rank-col">
          <span class="lb-rank-number">#${rank}</span>
        </div>
        <div class="lb-info-col">
          <div class="lb-name">${escapeHtml(entry.name)}${isCurrent ? ' <span class="you-badge">You</span>' : ''}</div>
          <div class="lb-time">${timeText}</div>
        </div>
        <div class="lb-score-col">
          <span class="lb-score">${entry.score}</span>
          <span class="lb-total">/ ${totalQuestions}</span>
        </div>
      `;

      leaderboardList.appendChild(item);
    });
  }

  // ---- Real-time Firestore listener ----
  if (typeof db !== 'undefined') {
    db.collection('quizEntries').onSnapshot((snap) => {
      const entries = snap.docs.map(d => d.data());
      const board = sortEntries(entries);
      renderLeaderboard(board);
    }, (err) => {
      console.error('Leaderboard snapshot error:', err);
    });
  } else {
    console.error('Firebase db not initialized. Make sure firebase-config.js is loaded.');
  }
})();

