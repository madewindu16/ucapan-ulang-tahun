const YT_ID = "ISI_ID_VIDEO_YOUTUBE"; // youtube.com/watch?v=XXXX -> XXXX

const $ = (s) => document.querySelector(s);

function show(id) {
  document
    .querySelectorAll(".scene")
    .forEach((s) => s.classList.toggle("active", s.id === id));
  $("#yt").src =
    id === "song"
      ? `https://www.youtube.com/embed/${YT_ID}?rel=0`
      : "about:blank";
  closeViewer();
  syncMusic(id);
  if (id === "cake") relight();
  if (id === "flower") startPetals();
  else stopPetals();
}

const GIFTS_NEEDED = 3;
const opened = new Set();

function updateCake() {
  const it = $("#cake-item");
  const ok = opened.size >= GIFTS_NEEDED;
  it.classList.toggle("locked", !ok);
  it.classList.toggle("ready", ok);
  $("#lockinfo .lock-label").textContent = ok
    ? "One more thing…"
    : `${opened.size}/${GIFTS_NEEDED}`;
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-go]");
  if (!b) return;
  if (b.classList.contains("locked")) {
    b.classList.add("shake");
    $("#lockinfo .lock-label").textContent = "Buka semua hadiah dulu";
    setTimeout(() => {
      b.classList.remove("shake");
      updateCake();
    }, 1800);
    return;
  }
  if (b.classList.contains("item") && b.dataset.go !== "cake") {
    opened.add(b.dataset.go);
    updateCake();
  }
  show(b.dataset.go);
});
updateCake();

// buka segel -> hero
$("#seal").addEventListener("click", () => {
  startMusic();
  $("#env").classList.add("open");
  setTimeout(() => show("hero"), 1000);
});

// foto belum ada -> pakai gambar cadangan
function fb(img) {
  if (img.dataset.fb && !img.dataset.done) {
    img.dataset.done = 1;
    img.src = img.dataset.fb;
  }
}
document.querySelectorAll("img[data-fb]").forEach((img) => {
  img.addEventListener("error", () => fb(img));
  if (img.complete && !img.naturalWidth) fb(img);
});

// ---------- Viewer foto + pesan ----------
const pols = [...document.querySelectorAll("#memories .pol")];
let cur = 0;

function openViewer(i) {
  cur = (i + pols.length) % pols.length;
  const p = pols[cur];
  $("#vimg").src = p.querySelector("img").src;
  $("#vmsg").textContent = p.dataset.msg;
  $("#viewer").classList.add("on");
  $("#viewer").setAttribute("aria-hidden", "false");
}

function closeViewer() {
  $("#viewer").classList.remove("on");
  $("#viewer").setAttribute("aria-hidden", "true");
}

pols.forEach((p, i) => {
  p.addEventListener("click", () => openViewer(i));
  p.addEventListener("keydown", (e) => {
    if (e.key === "Enter") openViewer(i);
  });
});
$("#vx").onclick = closeViewer;
$("#vp").onclick = () => openViewer(cur - 1);
$("#vnx").onclick = () => openViewer(cur + 1);
$("#viewer").addEventListener("click", (e) => {
  if (e.target.id === "viewer") closeViewer();
});
document.addEventListener("keydown", (e) => {
  if (!$("#viewer").classList.contains("on")) return;
  if (e.key === "Escape") closeViewer();
  if (e.key === "ArrowLeft") openViewer(cur - 1);
  if (e.key === "ArrowRight") openViewer(cur + 1);
});

// ---------- Musik latar ----------
const bgm = $("#bgm");
const muteBtn = $("#mute");
let started = false;
let wantMusic = false;

function setMuteUI() {
  muteBtn.classList.toggle("on", !bgm.paused);
  muteBtn.classList.toggle("off", bgm.paused);
  muteBtn.setAttribute(
    "aria-label",
    bgm.paused ? "Nyalakan musik" : "Matikan musik",
  );
}

function playMusic() {
  bgm.play().then(
    () => {
      muteBtn.removeAttribute("title");
      setMuteUI();
    },
    (error) => {
      bgm.pause();
      wantMusic = false;
      muteBtn.title = "Musik tidak dapat diputar. Pastikan assets/audio/lagu.mp3 tersedia.";
      console.warn("Musik latar gagal diputar:", error);
      setMuteUI();
    },
  );
}

function startMusic() {
  started = true;
  wantMusic = true;
  muteBtn.hidden = false;
  bgm.volume = 0.6;
  playMusic();
  setMuteUI();
}

muteBtn.addEventListener("click", () => {
  wantMusic = !wantMusic;
  if (wantMusic) playMusic();
  else bgm.pause();
  setMuteUI();
});
bgm.addEventListener("play", setMuteUI);
bgm.addEventListener("pause", setMuteUI);

function syncMusic(id) {
  if (!started) return;
  const quiet = id === "song" || id === "cake";
  muteBtn.hidden = quiet;
  if (quiet) bgm.pause();
  else if (wantMusic && bgm.paused) playMusic();
}

// ---------- Video YouTube (modal) ----------
const VIDEO_URL = "https://www.youtube.com/watch?v=ISI_ID_VIDEO";

const ytId = (url) =>
  url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1] ||
  url.trim();

function openVideo() {
  $("#vyt").src = `https://www.youtube.com/embed/${ytId(VIDEO_URL)}?autoplay=1&rel=0&playsinline=1`;
  $("#vmodal").classList.add("on");
  $("#vmodal").setAttribute("aria-hidden", "false");
  if (started) bgm.pause();
}

function closeVideo() {
  $("#vmodal").classList.remove("on");
  $("#vmodal").setAttribute("aria-hidden", "true");
  $("#vyt").src = "about:blank";
  if (started && wantMusic) playMusic();
}

$("#vid-btn").addEventListener("click", openVideo);
$("#vmx").addEventListener("click", closeVideo);
$("#vmodal").addEventListener("click", (e) => {
  if (e.target.id === "vmodal") closeVideo();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#vmodal").classList.contains("on")) {
    closeVideo();
  }
});

// ---------- Kue + tiup lilin ----------
const candles = [...document.querySelectorAll("#cake .candle")];
let finished = false;
let confettiRaf;
let finishTimer;
let candleTimers = [];

function relight() {
  clearTimeout(finishTimer);
  finishTimer = undefined;
  candleTimers.forEach(clearTimeout);
  candleTimers = [];
  finished = false;
  candles.forEach((c) => c.classList.remove("out"));
  $("#cake").classList.remove("done");
  cancelAnimationFrame(confettiRaf);
  const cv = $("#confetti");
  cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
}

function blowOut() {
  if (finished) return;
  finished = true;
  candleTimers = candles.map((c, i) =>
    setTimeout(() => c.classList.add("out"), i * 220),
  );
  finishTimer = setTimeout(finish, candles.length * 220 + 900);
}

function finish() {
  finishTimer = undefined;
  $("#cake").classList.add("done");
  confetti();
  if (started && wantMusic) {
    muteBtn.hidden = false;
    playMusic();
  }
}

$("#blow").addEventListener("click", blowOut);
$("#relight").addEventListener("click", () => {
  relight();
});

function confetti() {
  const cv = $("#confetti");
  const c = cv.getContext("2d");
  cv.width = cv.offsetWidth;
  cv.height = cv.offsetHeight;
  const cols = ["#ff4d6d", "#ffd27a", "#fff", "#ff9ab0", "#c9202c"];
  const ps = Array.from({ length: 140 }, () => ({
    x: Math.random() * cv.width,
    y: -20 - Math.random() * cv.height * 0.6,
    w: 6 + Math.random() * 6,
    h: 10 + Math.random() * 8,
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    r: Math.random() * 6,
    vr: -0.2 + Math.random() * 0.4,
    col: cols[Math.floor(Math.random() * cols.length)],
  }));
  let t = 0;
  (function frame() {
    c.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.col;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    });
    if (++t < 260) confettiRaf = requestAnimationFrame(frame);
    else {
      c.clearRect(0, 0, cv.width, cv.height);
      confettiRaf = undefined;
    }
  })();
}

// ---------- Kado pembuka di halaman Gifts ----------
const giftsScene = $("#gifts");
const giftBox = $("#giftbox");
let boxOpened = false;

giftBox.addEventListener("click", () => {
  if (boxOpened) return;
  boxOpened = true;
  $("#gift-hint").style.opacity = 0;
  giftBox.classList.add("shake");
  setTimeout(() => {
    const r = giftBox.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2);
    $("#giftwrap").classList.add("gone");
    giftsScene.classList.add("opened");
  }, 650);
});

function burst(cx, cy) {
  const cv = $("#gconf");
  const c = cv.getContext("2d");
  cv.width = cv.offsetWidth;
  cv.height = cv.offsetHeight;
  const R = cv.getBoundingClientRect();
  cx -= R.left;
  cy -= R.top;
  const cols = ["#ff4d6d", "#ffd27a", "#ffffff", "#ff9ab0", "#c9202c", "#f7c6d0"];
  const ps = Array.from({ length: 170 }, () => {
    const a = (-90 + (Math.random() - 0.5) * 140) * Math.PI / 180;
    const v = 7 + Math.random() * 13;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      col: cols[Math.floor(Math.random() * cols.length)],
      life: 1,
    };
  });
  let t = 0;
  (function frame() {
    c.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => {
      p.vy += 0.28;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (t > 120) p.life -= 0.02;
      c.save();
      c.globalAlpha = Math.max(p.life, 0);
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.col;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    });
    if (++t < 260) requestAnimationFrame(frame);
    else c.clearRect(0, 0, cv.width, cv.height);
  })();
}

// ---------- Halaman Flower ----------
const PUJIAN = [
  "You are kind to everyone you meet.",
  "You are capable of achieving whatever you dream.",
  "You are strong, even when things get difficult.",
  "You are thoughtful and always remember the little things.",
  "And so much more. Happy birthday.",
];
const bloomBtn = $("#bloom");
const fcard = $("#fcard");
const fdots = $("#fdots");
const petalBox = $("#petals");
const PCOL = ["#ffb3c1", "#ff7a93", "#e8344f", "#ffe3e8"];
const rnd = (a, b) => a + Math.random() * (b - a);
let fi = 0;
let petalTimer = null;

PUJIAN.forEach(() => fdots.appendChild(document.createElement("i")));

function petal(cls, vars, x, y) {
  const p = document.createElement("span");
  p.className = `petal ${cls}`;
  p.style.cssText = `left:${x}px;top:${y}px;--s:${rnd(10, 20)}px;--c:${PCOL[Math.floor(Math.random() * PCOL.length)]};${vars}`;
  p.addEventListener("animationend", () => p.remove());
  petalBox.appendChild(p);
}

function startPetals() {
  stopPetals();
  petalTimer = setInterval(() => {
    if (petalBox.childElementCount > 24) return;
    petal(
      "fall",
      `--sw:${rnd(-60, 60)}px;--rot:${rnd(180, 540)}deg;--dur:${rnd(7, 12)}s`,
      rnd(0, petalBox.clientWidth),
      -20,
    );
  }, 650);
}

function stopPetals() {
  clearInterval(petalTimer);
  petalTimer = null;
  petalBox.replaceChildren();
}

function burstPetals() {
  const b = bloomBtn.getBoundingClientRect();
  const c = petalBox.getBoundingClientRect();
  const x = b.left - c.left + b.width / 2;
  const y = b.top - c.top + b.height * 0.3;
  for (let i = 0; i < 16; i++) {
    const d = rnd(-1, 1);
    petal(
      "burst",
      `--ux:${d * rnd(40, 110)}px;--uy:${-rnd(60, 140)}px;--dx:${d * rnd(90, 220)}px;--dy:${rnd(120, 260)}px;--rot:${rnd(-360, 360)}deg`,
      x,
      y,
    );
  }
}

bloomBtn.addEventListener("click", () => {
  fcard.classList.remove("hint", "show");
  void fcard.offsetWidth;
  fcard.textContent = PUJIAN[fi];
  fcard.classList.add("show");
  [...fdots.children].forEach((dot, i) => {
    dot.classList.toggle("on", i === fi);
    if (i === fi) dot.classList.add("seen");
  });
  fi = (fi + 1) % PUJIAN.length;
  bloomBtn.classList.remove("pop");
  void bloomBtn.offsetWidth;
  bloomBtn.classList.add("pop");
  burstPetals();
});
