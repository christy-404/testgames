/**
 * Quiz About Emmanuel
 * Multiple choice quiz with Firebase shared leaderboard
 */

(function() {
  'use strict';

  /* ---------- DOM Elements ---------- */
  const nameEntryScreen       = document.getElementById('nameEntryScreen');
  const alreadyPlayedScreen   = document.getElementById('alreadyPlayedScreen');
  const quizContainer         = document.getElementById('quizContainer');
  const resultScreen          = document.getElementById('resultScreen');
  const questionText          = document.getElementById('questionText');
  const answersGrid           = document.getElementById('answersGrid');
  const progressFill          = document.getElementById('progressFill');
  const progressText          = document.getElementById('progressText');
  const resultScore           = document.getElementById('resultScore');
  const resultMessage         = document.getElementById('resultMessage');
  const resultRank            = document.getElementById('resultRank');
  const personalRankDisplay   = document.getElementById('personalRankDisplay');
  const leaderboardList       = document.getElementById('leaderboardList');
  const personalRankOutside   = document.getElementById('personalRankOutside');
  const reviewList            = document.getElementById('reviewList');
  const playerNameInput       = document.getElementById('playerNameInput');
  const startQuizBtn          = document.getElementById('startQuizBtn');
  const nameError             = document.getElementById('nameError');

  /* Already-played screen elements */
  const playedScore           = document.getElementById('playedScore');
  const playedMessage         = document.getElementById('playedMessage');
  const playedRankBadge       = document.getElementById('playedRankBadge');
  const playedPersonalRank    = document.getElementById('playedPersonalRank');
  const playedLeaderboardList = document.getElementById('playedLeaderboardList');
  const playedPersonalRankOutside = document.getElementById('playedPersonalRankOutside');
  const playedReviewList      = document.getElementById('playedReviewList');

  if (!quizContainer) return;

  /* ---------- localStorage (device convenience only) ---------- */
  const LS_PLAYER = 'emmanuelQuizPlayerName';
  const LS_PLAYED = 'emmanuelQuizPlayed';

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
    return db.collection('quizEntries');
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
      if (b.score !== a.score) return b.score - a.score;
      return (a.submittedAt || 0) - (b.submittedAt || 0);
    });
  }

  function getPlayerRank(board, name) {
    const idx = board.findIndex(e => e.name.toLowerCase().trim() === name.toLowerCase().trim());
    return idx >= 0 ? idx + 1 : null;
  }

  /* ---------- Questions ---------- */
  const questions = [
    { question: "What is Emmanuel's favorite food?", answers: ['Pizza','Biriyani','Burgers','Pasta'], correct: 1 },
    { question: "What is Emmanuel's funniest habit?", answers: ['Talking in his sleep','Sleeping at the most random places','Dancing when no one is watching','Singing off-key on purpose'], correct: 1 },
    { question: "What was Emmanuel's favorite subject in school?", answers: ['Mathematics','Science','Physical Education','Art'], correct: 0 },
    { question: "What does Emmanuel want to be when he grows up?", answers: ['Engineer','Commercial Pilot','Teacher','Doctor'], correct: 1 },
    { question: "Which sport does Emmanuel enjoy the most?", answers: ['Football','Basketball','Swimming','Roller Skating'], correct: 3 },
    { question: "What is Emmanuel's favorite color?", answers: ['Blue','Red','Green','Gold'], correct: 2 },
    { question: "What is the name of Emmanuel's favorite video game?", answers: ['FIFA','Minecraft','Fortnite','Roblox'], correct: 3 },
    { question: "Where is Emmanuel's dream vacation destination?", answers: ['THE USA','ENGLAND','SAO PAULO(BRAZIL)','DUBAI(UAE)'], correct: 3 },
    { question: "Who named Emmanuel?", answers: ['His Mom','His brother','His Appa','His Grandparents'], correct: 0 },
    { question: "What is one thing Emmanuel always says?", answers: ['"I am hungry"','"That is not fair"','"Can we play a game?"','"Family is everything"'], correct: 0 }
  ];

  let currentQuestion = 0;
  let score = 0;
  let shuffledQuestions = [];
  let answered = false;
  let playerName = '';
  let userAnswers = [];

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
    alreadyPlayedScreen.style.display = 'none';
    quizContainer.style.display = 'none';
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
    alreadyPlayedScreen.style.display = 'block';
    quizContainer.style.display = 'none';
    resultScreen.style.display = 'none';

    const total = entry.totalQuestions || questions.length;
    const percentage = (entry.score / total) * 100;

    playedScore.textContent = `${entry.score} / ${total}`;
    playedMessage.textContent = getRankMessage(percentage);
    playedRankBadge.textContent = getRankTitle(percentage);

    const all = await fetchAllEntries();
    const board = sortEntries(all);
    const rank = getPlayerRank(board, entry.name);

    if (rank) {
      playedPersonalRank.textContent = `Your Rank: #${rank}`;
      playedPersonalRank.style.display = 'block';
    } else {
      playedPersonalRank.style.display = 'none';
    }

    renderLeaderboardFromBoard(playedLeaderboardList, playedPersonalRankOutside, entry.name, board);
    renderReview(playedReviewList, entry);
  }

  /* ---------- Name entry / start ---------- */
  async function handleStartQuiz() {
    startQuizBtn.disabled = true;
    const rawName = playerNameInput.value.trim();
    if (rawName.length < 2 || rawName.length > 30) {
      if (nameError) {
        nameError.textContent = 'Please enter a valid name (2-30 characters).';
        nameError.style.display = 'block';
      }
      startQuizBtn.disabled = false;
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
    startQuizBtn.disabled = false;
    startQuiz();
  }

  startQuizBtn.addEventListener('click', handleStartQuiz);
  playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleStartQuiz();
  });
  playerNameInput.addEventListener('input', () => {
    if (nameError) {
      nameError.style.display = 'none';
      nameError.textContent = 'Please enter a valid name (2-30 characters).';
    }
  });

  /* ---------- Quiz flow ---------- */
  function startQuiz() {
    currentQuestion = 0;
    score = 0;
    answered = false;
    userAnswers = [];
    shuffledQuestions = shuffleArray(questions).map(q => ({
      ...q,
      answers: [...q.answers]
    }));

    nameEntryScreen.style.display = 'none';
    alreadyPlayedScreen.style.display = 'none';
    quizContainer.style.display = 'block';
    resultScreen.style.display = 'none';

    showQuestion();
  }

  function showQuestion() {
    answered = false;
    const q = shuffledQuestions[currentQuestion];

    const progress = ((currentQuestion) / shuffledQuestions.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = `Question ${currentQuestion + 1} of ${shuffledQuestions.length}`;

    const card = document.getElementById('questionCard');
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px)';

    setTimeout(() => {
      questionText.textContent = q.question;
      answersGrid.innerHTML = '';

      q.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + index)}</span><span class="answer-text">${answer}</span>`;
        btn.addEventListener('click', () => handleAnswer(index, btn));
        answersGrid.appendChild(btn);
      });

      card.style.opacity = '1';
      card.style.transform = 'translateX(0)';
    }, 250);
  }

  function handleAnswer(selectedIndex, btnElement) {
    if (answered) return;
    answered = true;

    const q = shuffledQuestions[currentQuestion];
    const isCorrect = selectedIndex === q.correct;
    const allButtons = answersGrid.querySelectorAll('.answer-btn');

    userAnswers.push({
      question: q.question,
      selectedAnswer: q.answers[selectedIndex],
      selectedIndex: selectedIndex,
      correctAnswer: q.answers[q.correct],
      correctIndex: q.correct,
      isCorrect: isCorrect
    });

    if (isCorrect) {
      score++;
      btnElement.classList.add('correct');
      playTone(660, 0.3, 0.15);
      setTimeout(() => playTone(880, 0.3, 0.15), 100);
    } else {
      btnElement.classList.add('wrong');
      allButtons[q.correct].classList.add('correct');
      playTone(300, 0.4, 0.1);
    }

    allButtons.forEach(btn => btn.disabled = true);

    setTimeout(() => {
      currentQuestion++;
      if (currentQuestion < shuffledQuestions.length) {
        showQuestion();
      } else {
        finishQuiz();
      }
    }, 1500);
  }

  async function finishQuiz() {
    const total = shuffledQuestions.length;
    const percentage = (score / total) * 100;

    const entry = {
      name: playerName,
      nameLower: playerName.toLowerCase().trim(),
      score: score,
      totalQuestions: total,
      answers: userAnswers,
      submittedAt: Date.now()
    };

    await saveEntry(entry);
    markPlayed(playerName);

    const all = await fetchAllEntries();
    const board = sortEntries(all);

    showResults(entry, percentage, board);
  }

  function showResults(entry, percentage, board) {
    quizContainer.style.display = 'none';
    resultScreen.style.display = 'block';

    resultScore.textContent = `${entry.score} / ${entry.totalQuestions}`;
    resultMessage.textContent = getRankMessage(percentage);
    resultRank.textContent = getRankTitle(percentage);

    const rank = getPlayerRank(board, entry.name);
    if (rank) {
      personalRankDisplay.textContent = `Your Rank: #${rank}`;
      personalRankDisplay.style.display = 'block';
    } else {
      personalRankDisplay.style.display = 'none';
    }

    renderReview(reviewList, entry);
    renderLeaderboardFromBoard(leaderboardList, personalRankOutside, entry.name, board);

    if (percentage >= 60) {
      createConfetti();
    }
  }

  /* ---------- Rank text ---------- */
  function getRankMessage(percentage) {
    if (percentage === 100) return 'Perfection! You know Emmanuel better than anyone. Truly a family legend!';
    if (percentage >= 80) return 'Outstanding! You clearly pay attention. Emmanuel is lucky to have you!';
    if (percentage >= 60) return 'Great effort! You know Emmanuel quite well. A few more gatherings and you will be an expert!';
    if (percentage >= 40) return 'Not bad! There is always more to learn about the people we love.';
    return 'Time to spend more quality time with Emmanuel! Every moment is a chance to learn something new.';
  }

  function getRankTitle(percentage) {
    if (percentage === 100) return 'Family Champion';
    if (percentage >= 80) return 'Expert';
    if (percentage >= 60) return 'Family Friend';
    if (percentage >= 40) return 'Acquaintance';
    return 'Need More Family Time';
  }

  /* ---------- Render leaderboard (Top 10 + personal rank) ---------- */
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
      const item = document.createElement('div');
      item.className = `leaderboard-item ${rankClass} ${isCurrent ? 'is-current' : ''}`;
      item.innerHTML = `
        <div class="leaderboard-rank">#${rank}</div>
        <div class="leaderboard-name">${escapeHtml(entry.name)}${isCurrent ? ' <span class="you-badge">You</span>' : ''}</div>
        <div class="leaderboard-score">${entry.score} / ${entry.totalQuestions || questions.length}</div>
      `;
      container.appendChild(item);
    });

    if (playerRank && playerRank > 10) {
      outsideContainer.innerHTML = `<div class="personal-rank-outside-text">Your Rank: <strong>#${playerRank}</strong></div>`;
      outsideContainer.style.display = 'block';
    } else {
      outsideContainer.style.display = 'none';
    }
  }

  /* ---------- Render review ---------- */
  function renderReview(container, entry) {
    container.innerHTML = '';
    const answers = entry.answers || [];

    answers.forEach((a, index) => {
      const item = document.createElement('div');
      item.className = `review-item ${a.isCorrect ? 'review-correct' : 'review-wrong'}`;
      item.innerHTML = `
        <div class="review-header">
          <span class="review-number">${index + 1}</span>
          <span class="review-status">${a.isCorrect ? 'Correct' : 'Incorrect'}</span>
        </div>
        <div class="review-question">${escapeHtml(a.question)}</div>
        <div class="review-answers">
          <div class="review-selected ${a.isCorrect ? 'review-selected-correct' : 'review-selected-wrong'}">
            <span class="review-label">Your answer:</span> ${escapeHtml(a.selectedAnswer)}
          </div>
          ${!a.isCorrect ? `<div class="review-correct-answer"><span class="review-label">Correct answer:</span> ${escapeHtml(a.correctAnswer)}</div>` : ''}
        </div>
      `;
      container.appendChild(item);
    });
  }

  /* ---------- Utilities ---------- */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- Confetti ---------- */
  function createConfetti() {
    const colors = ['#d4af37', '#f0d878', '#a08020', '#ffffff', '#cbd5e1'];
    for (let i = 0; i < 60; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}vw;
        top: -10px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        opacity: ${Math.random() * 0.5 + 0.5};
        animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
        animation-delay: ${Math.random() * 2}s;
        z-index: 1000;
        pointer-events: none;
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 5000);
    }
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

  /* ---------- Kick off ---------- */
  initPage();
})();

