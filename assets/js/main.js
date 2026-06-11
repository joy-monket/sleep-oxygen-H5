const slides = Array.from(document.querySelectorAll(".slide"));
const slidesWrap = document.getElementById("slides");
const pager = document.getElementById("pager");
const musicBtn = document.getElementById("musicBtn");
const swipeHint = document.getElementById("swipeHint");
const bgm = document.getElementById("bgm");
const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loaderBar");
const loaderPercent = document.getElementById("loaderPercent");

let current = 0;
let locked = false;
let startY = 0;
let isPlaying = false;

slides.forEach((_, index) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.setAttribute("aria-label", `跳转到第 ${index + 1} 页`);
  dot.addEventListener("click", () => goTo(index));
  pager.appendChild(dot);
});

const dots = Array.from(pager.children);

function setLoadingProgress(value) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  loaderBar.style.width = `${percent}%`;
  loaderPercent.textContent = `${percent}%`;
}

function collectImageSources() {
  return slides
    .map((slide) => {
      const img = slide.querySelector("img");
      return img?.dataset.src || img?.getAttribute("src");
    })
    .filter(Boolean);
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

async function preparePage() {
  const sources = collectImageSources();
  let finished = 0;

  setLoadingProgress(6);
  await Promise.all(
    sources.map((src) =>
      preloadImage(src).then(() => {
        finished += 1;
        setLoadingProgress(6 + (finished / sources.length) * 94);
      })
    )
  );

  sources.forEach((_, index) => loadSlide(index));
  setLoadingProgress(100);
  window.setTimeout(() => {
    loader.classList.add("is-hidden");
  }, 260);
}

function loadSlide(index) {
  const img = slides[index]?.querySelector("img");
  if (!img || img.src || !img.dataset.src) return;
  img.src = img.dataset.src;
  img.removeAttribute("data-src");
}

function preloadAround(index) {
  [index, index + 1, index + 2].forEach(loadSlide);
}

function update() {
  preloadAround(current);
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

async function startMusic() {
  bgm.volume = 0.45;
  await bgm.play();
  isPlaying = true;
  musicBtn.classList.add("is-playing");
  musicBtn.setAttribute("aria-label", "暂停背景音乐");
  musicBtn.setAttribute("aria-pressed", "true");
}

function stopMusic() {
  isPlaying = false;
  bgm.pause();
  musicBtn.classList.remove("is-playing");
  musicBtn.setAttribute("aria-label", "播放背景音乐");
  musicBtn.setAttribute("aria-pressed", "false");
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
preparePage();
