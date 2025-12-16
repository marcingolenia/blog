const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(frequency = 800, duration = 30, volume = 0.1) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gainNode.gain.value = volume;

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

function floppySeek() {
  const steps = 4 + Math.floor(Math.random() * 4); // 4-7 seek steps
  for (let i = 0; i < steps; i++) {
    setTimeout(() => {
      beep(150 + Math.random() * 100, 15, 0.04);
      beep(80 + Math.random() * 40, 20, 0.03);
    }, i * 35); // Rapid succession
  }
  setTimeout(() => {
    beep(200, 30, 0.05);
  }, steps * 35 + 50);
}

function downloadSound() {
  beep(600, 50, 0.06);
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      beep(400 + Math.random() * 200, 20, 0.03);
      if (i % 3 === 0) {
        beep(100, 30, 0.02); // Carriage return sound
      }
    }, 100 + i * 80);
  }
  setTimeout(() => {
    beep(800, 80, 0.05);
    setTimeout(() => beep(1000, 80, 0.05), 100);
  }, 1100);
}

