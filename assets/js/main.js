const slides = Array.from(document.querySelectorAll(".slide"));
const slidesWrap = document.getElementById("slides");
const pager = document.getElementById("pager");
const musicBtn = document.getElementById("musicBtn");
const swipeHint = document.getElementById("swipeHint");

let current = 0;
let locked = false;
let startY = 0;
let audioContext;
let masterGain;
let musicTimer;
let isPlaying = false;

const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];

slides.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `跳转到第 ${index + 1} 页`);
  dot.addEventListener("click", () => goTo(index));
  pager.appendChild(dot);
});

const dots = Array.from(pager.children);

function update() {
  slidesWrap.style.transform = `translate3d(0, ${current * -100}%, 0)`;
  slides.forEach((slide, index) => slide.classList.toggle("is-active", index === current));
  dots.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
  if (current > 0) {
    swipeHint.classList.add("is-hidden");
  }
}

function goTo(index) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  if (next === current || locked) return;

  current = next;
  locked = true;
  update();
  window.setTimeout(() => {
    locked = false;
  }, 760);
}

function nextPage() {
  goTo(current + 1);
}

function prevPage() {
  goTo(current - 1);
}

function createTone(frequency, time, duration) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.055, time + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.08);
}

function scheduleMusic() {
  if (!isPlaying || !audioContext) return;

  const now = audioContext.currentTime;
  notes.forEach((note, index) => {
    createTone(note, now + index * 0.9, 0.78);
    createTone(note / 2, now + index * 0.9, 1.1);
  });

  musicTimer = window.setTimeout(scheduleMusic, notes.length * 900);
}

async function startMusic() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(audioContext.destination);
  }

  await audioContext.resume();
  isPlaying = true;
  musicBtn.classList.add("is-playing");
  musicBtn.setAttribute("aria-label", "暂停背景音乐");
  musicBtn.setAttribute("aria-pressed", "true");
  scheduleMusic();
}

function stopMusic() {
  isPlaying = false;
  window.clearTimeout(musicTimer);
  musicBtn.classList.remove("is-playing");
  musicBtn.setAttribute("aria-label", "播放背景音乐");
  musicBtn.setAttribute("aria-pressed", "false");
  if (masterGain && audioContext) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    window.setTimeout(() => audioContext.suspend(), 120);
  }
}

musicBtn.addEventListener("click", () => {
  if (isPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
});

document.addEventListener(
  "touchstart",
  (event) => {
    startY = event.touches[0].clientY;
  },
  { passive: true }
);

document.addEventListener(
  "touchend",
  (event) => {
    const endY = event.changedTouches[0].clientY;
    const distance = endY - startY;
    if (Math.abs(distance) < 42) return;
    if (distance < 0) nextPage();
    if (distance > 0) prevPage();
  },
  { passive: true }
);

document.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) < 20) return;
    if (event.deltaY > 0) nextPage();
    if (event.deltaY < 0) prevPage();
  },
  { passive: true }
);

document.addEventListener("keydown", (event) => {
  if (["ArrowDown", "PageDown", " "].includes(event.key)) nextPage();
  if (["ArrowUp", "PageUp"].includes(event.key)) prevPage();
});

update();
