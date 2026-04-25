/**
 * Spin the Wheel Challenge
 * Interactive spinning wheel with physics-based animation
 */

(function() {
  'use strict';

  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spinBtn');
  const modal = document.getElementById('resultModal');
  const closeModal = document.getElementById('closeModal');
  const modalCategory = document.getElementById('modalCategory');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');

  if (!canvas || !spinBtn) return;

  // ---- Wheel Configuration ----
  const categories = [
    {
      name: 'Funny Dare',
      color: '#1e3a5f',
      highlight: '#2a5080',
      challenges: [
        'Do your best impression of Emmanuel',
        'Speak in an accent for the next 2 minutes',
        'Try to make Emmanuel laugh in 10 seconds',
        'Do a dramatic reading of the dinner menu'
      ]
    },
    {
      name: 'Family Challenge',
      color: '#2d1b4e',
      highlight: '#3d2a6e',
      challenges: [
        'Say one funny memory with Emmanuel',
        'Tell your funniest family story',
        'Share the best advice you have ever received',
        'Describe your favorite family tradition'
      ]
    },
    {
      name: 'Quick Question',
      color: '#1a3d3d',
      highlight: '#2a5a5a',
      challenges: [
        'What is the kindest thing someone has done for you?',
        'If you could have dinner with anyone, who would it be?',
        'What is your favorite thing about family gatherings?',
        'What are you most grateful for today?'
      ]
    },
    {
      name: 'Compliment Someone',
      color: '#3d2a1a',
      highlight: '#5a3f2a',
      challenges: [
        'Compliment the person to your left',
        'Tell someone why you appreciate them',
        'Give a genuine compliment to Emmanuel',
        'Share what you admire most about the host'
      ]
    },
    {
      name: 'Mini Task',
      color: '#2a1a3d',
      highlight: '#3f2a5a',
      challenges: [
        'Dance for 10 seconds',
        'Sing the chorus of your favorite song',
        'Take a group selfie with everyone at the table',
        'Make a toast to Emmanuel'
      ]
    },
    {
      name: 'Surprise Challenge',
      color: '#3d1a2a',
      highlight: '#5a2a3f',
      challenges: [
        'Share one blessing for Emmanuel',
        'Give Emmanuel a piece of life advice',
        'Predict where Emmanuel will be in 10 years',
        'Teach Emmanuel something new in 30 seconds'
      ]
    }
  ];

  const numSegments = categories.length;
  const arcSize = (2 * Math.PI) / numSegments;
  let currentAngle = 0;
  let isSpinning = false;
  let spinVelocity = 0;
  let spinFriction = 0.985;
  let animationId = null;

  // ---- Canvas Setup ----
  function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth - 40, 500);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
  }

  // ---- Draw Wheel ----
  function drawWheel() {
    const width = parseInt(canvas.style.width);
    const height = parseInt(canvas.style.height);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, width, height);

    // Draw segments
    for (let i = 0; i < numSegments; i++) {
      const angle = currentAngle + i * arcSize;
      const category = categories[i];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.closePath();

      // Gradient for segment
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      grad.addColorStop(0, category.color);
      grad.addColorStop(1, category.highlight);
      ctx.fillStyle = grad;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';

      // Dynamic font sizing to fit within segment
      let fontSize = Math.min(13, Math.max(9, radius / 18));
      ctx.font = `600 ${fontSize}px Montserrat, sans-serif`;
      const maxWidth = (radius - 22) * 0.8;
      const textWidth = ctx.measureText(category.name).width;
      if (textWidth > maxWidth && fontSize > 9) {
        fontSize = Math.max(9, fontSize * (maxWidth / textWidth));
        ctx.font = `600 ${fontSize}px Montserrat, sans-serif`;
      }

      ctx.fillText(category.name, radius - 22, 0);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0e1a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // ---- Spin Physics ----
  function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.style.opacity = '0.6';

    // Random initial velocity
    spinVelocity = (Math.random() * 0.3 + 0.4) * (Math.random() > 0.5 ? 1 : -1);

    // Play start sound
    playTone(440, 0.1, 0.1);

    animate();
  }

  function animate() {
    if (Math.abs(spinVelocity) < 0.002) {
      finishSpin();
      return;
    }

    currentAngle += spinVelocity;
    spinVelocity *= spinFriction;
    drawWheel();
    animationId = requestAnimationFrame(animate);
  }

  function finishSpin() {
    isSpinning = false;
    cancelAnimationFrame(animationId);
    spinBtn.disabled = false;
    spinBtn.style.opacity = '1';

    // Normalize angle
    const normalizedAngle = ((currentAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const pointerAngle = (2 * Math.PI - normalizedAngle + Math.PI / 2) % (2 * Math.PI);
    const winningIndex = Math.floor(pointerAngle / arcSize) % numSegments;
    const category = categories[winningIndex];
    const challenge = category.challenges[Math.floor(Math.random() * category.challenges.length)];

    // Play finish sound
    playTone(880, 0.3, 0.2);
    setTimeout(() => playTone(1100, 0.3, 0.2), 150);

    // Show modal
    modalCategory.textContent = category.name;
    modalCategory.style.color = category.highlight;
    modalTitle.textContent = challenge;
    modalDesc.textContent = 'Take a deep breath and give it your best. The family is cheering you on!';
    modal.classList.add('active');
  }

  // ---- Sound Effect (Web Audio API) ----
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
    } catch (e) {
      // Audio not supported, silently fail
    }
  }

  // ---- Event Listeners ----
  spinBtn.addEventListener('click', spin);

  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // ---- Init ----
  resizeCanvas();
  drawWheel();
  window.addEventListener('resize', debounce(() => {
    resizeCanvas();
    drawWheel();
  }, 150));
})();

