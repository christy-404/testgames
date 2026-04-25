/**
 * Photo Guess Game
 * Guests guess the story behind childhood photos
 */

(function() {
  'use strict';

  const photoImage = document.getElementById('photoImage');
  const photoPlaceholder = document.getElementById('photoPlaceholder');
  const photoQuestion = document.getElementById('photoQuestion');
  const guessInput = document.getElementById('guessInput');
  const guessBtn = document.getElementById('guessBtn');
  const revealBtn = document.getElementById('revealBtn');
  const answerOverlay = document.getElementById('answerOverlay');
  const answerReveal = document.getElementById('answerReveal');
  const answerStory = document.getElementById('answerStory');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const photoCounter = document.getElementById('photoCounter');

  if (!photoImage) return;

  // ---- Photo Data ----
  // To add real photos: place images in ../assets/images/ and update the src paths below.
  const photos = [
    {
      src: '../assets/images/photo1.jpg',
      question: 'How old was Emmanuel in this photo?',
      answer: 'He was 3 years old',
      story: 'This was taken during his first birthday party at grandma\'s house. He had just discovered how much he loved cake!'
    },
    {
      src: '../assets/images/photo2.jpg',
      question: 'What event was this photo taken at?',
      answer: 'Family vacation to the beach',
      story: 'The family took a trip to the coast that summer. Emmanuel refused to leave the water until sunset.'
    },
    {
      src: '../assets/images/photo3.jpg',
      question: 'What is Emmanuel doing in this picture?',
      answer: 'His first day of school',
      story: 'He was so excited he woke up at 5 AM and had his backpack ready hours before it was time to leave.'
    },
    {
      src: '../assets/images/photo4.jpg',
      question: 'What happened right after this photo was taken?',
      answer: 'He fell into a mud puddle',
      story: 'He was running to show off his new shoes and found the only mud puddle in the entire park. Classic Emmanuel!'
    },
    {
      src: '../assets/images/photo5.jpg',
      question: 'Who is Emmanuel with in this photo?',
      answer: 'His favorite cousin',
      story: 'These two are inseparable. Every family gathering, you will find them plotting their next adventure together.'
    }
  ];

  let currentIndex = 0;
  let revealed = false;

  // ---- Show Photo ----
  function showPhoto(index) {
    currentIndex = index;
    revealed = false;
    answerOverlay.classList.remove('active');
    guessInput.value = '';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    revealBtn.style.display = 'inline-flex';

    const photo = photos[index];
    photoQuestion.textContent = photo.question;
    photoCounter.textContent = `${index + 1} / ${photos.length}`;

    // Check if image exists by trying to load it
    const img = new Image();
    img.onload = () => {
      photoImage.src = photo.src;
      photoImage.style.display = 'block';
      photoPlaceholder.style.display = 'none';
    };
    img.onerror = () => {
      photoImage.style.display = 'none';
      photoPlaceholder.style.display = 'flex';
    };
    img.src = photo.src;

    // Update nav buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === photos.length - 1;

    // Animate card
    const card = document.getElementById('photoCard');
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 150);
  }

  // ---- Reveal Answer ----
  function revealAnswer() {
    if (revealed) return;
    revealed = true;

    const photo = photos[currentIndex];
    answerReveal.textContent = photo.answer;
    answerStory.textContent = photo.story;
    answerOverlay.classList.add('active');

    guessInput.disabled = true;
    guessBtn.disabled = true;
    revealBtn.style.display = 'none';

    playTone(523, 0.15, 0.1);
    setTimeout(() => playTone(659, 0.15, 0.1), 100);
    setTimeout(() => playTone(784, 0.2, 0.1), 200);
  }

  // ---- Handle Guess ----
  function handleGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    const photo = photos[currentIndex];
    const answer = photo.answer.toLowerCase();

    // Simple check if guess contains key words from answer
    const keywords = answer.split(' ').filter(w => w.length > 3);
    const match = keywords.some(kw => guess.includes(kw));

    if (match) {
      guessInput.style.borderColor = '#22c55e';
      playTone(880, 0.3, 0.15);
      setTimeout(() => {
        revealAnswer();
        guessInput.style.borderColor = '';
      }, 500);
    } else {
      guessInput.style.borderColor = '#ef4444';
      playTone(300, 0.3, 0.1);
      setTimeout(() => {
        guessInput.style.borderColor = '';
        revealAnswer();
      }, 600);
    }
  }

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

  // ---- Event Listeners ----
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) showPhoto(currentIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < photos.length - 1) showPhoto(currentIndex + 1);
  });

  revealBtn.addEventListener('click', revealAnswer);
  guessBtn.addEventListener('click', handleGuess);

  guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleGuess();
  });

  // Keyboard nav
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      showPhoto(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
      showPhoto(currentIndex + 1);
    }
  });

  // ---- Init ----
  showPhoto(0);
})();

