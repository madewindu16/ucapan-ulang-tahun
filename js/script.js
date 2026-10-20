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
  if (id === "game") initGame();
}

const GIFTS_NEEDED = 4;
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
  const cols = ["#ff4d6d", "#f5b94a", "#ff9ab0", "#c9202c", "#e86f8a"];
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
  const cols = ["#ff4d6d", "#f5b94a", "#ff9ab0", "#c9202c", "#e86f8a", "#f7c6d0"];
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
const PCOL = ["#ffa9ba", "#ff7a93", "#e8344f", "#f7c6d0"];
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

// ---------- Game: cocokkan kartu + kartu gosok ----------
const GAME_PAIRS = [
  { img: "assets/img/foto1.jpg", fb: "assets/img/lily.png", msg: "Kamu alasan aku senyum tanpa sadar ♡" },
  { img: "assets/img/foto2.jpg", fb: "assets/img/ceri.png", msg: "Di sebelah kamu, semuanya terasa lebih tenang." },
  { img: "assets/img/foto3.jpg", fb: "assets/img/buket.png", msg: "Terima kasih sudah sabar sama aku." },
  { img: "assets/img/foto4.jpg", fb: "assets/img/balon.png", msg: "Aku suka caramu tertawa." },
  { img: "assets/img/foto5.jpg", fb: "assets/img/kue.png", msg: "Apa pun yang terjadi, aku bakal ada buat kamu." },
  { img: "assets/img/foto6.jpg", fb: "assets/img/kupu-kupu.png", msg: "Aku sayang kamu, banget ♡" },
];

let gLock = false;
let gFirst = null;
let gMatched = 0;

function initGame() {
  const box = $("#cards");
  box.innerHTML = "";
  gLock = false;
  gFirst = null;
  gMatched = 0;
  $("#gcount").textContent = `0/${GAME_PAIRS.length}`;
  $("#gmsg").textContent = "Cari pasangan yang sama ♡";
  $("#scratch").classList.remove("on");
  const deck = GAME_PAIRS.flatMap((p, i) => [i, i]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  deck.forEach((k) => {
    const c = document.createElement("button");
    c.className = "card";
    c.dataset.k = k;
    c.setAttribute("aria-label", "Kartu");
    c.innerHTML =
      '<span class="in">' +
        '<span class="face bk"><span class="cov">♡</span><img class="fr" src="assets/img/frame-polaroid.png" alt=""></span>' +
        '<span class="face front"><img class="ph" alt=""><img class="fr" src="assets/img/frame-polaroid.png" alt=""></span>' +
      '</span>';
    const img = c.querySelector(".ph");
    img.src = GAME_PAIRS[k].img;
    img.onerror = () => {
      if (!img.dataset.d) {
        img.dataset.d = 1;
        img.src = GAME_PAIRS[k].fb;
      }
    };
    c.addEventListener("click", () => flipCard(c));
    box.appendChild(c);
  });
}

function flipCard(c) {
  if (gLock || c.classList.contains("flip")) return;
  c.classList.add("flip");
  if (!gFirst) {
    gFirst = c;
    return;
  }
  const a = gFirst;
  const b = c;
  gFirst = null;
  gLock = true;
  if (a.dataset.k === b.dataset.k) {
    setTimeout(() => {
      a.classList.add("done");
      b.classList.add("done");
      gLock = false;
      gMatched++;
      $("#gcount").textContent = `${gMatched}/${GAME_PAIRS.length}`;
      const m = $("#gmsg");
      m.classList.remove("pop");
      void m.offsetWidth;
      m.textContent = GAME_PAIRS[a.dataset.k].msg;
      m.classList.add("pop");
      if (gMatched === GAME_PAIRS.length) setTimeout(winGame, 900);
    }, 450);
  } else {
    setTimeout(() => {
      a.classList.remove("flip");
      b.classList.remove("flip");
      gLock = false;
    }, 850);
  }
}

function winGame() {
  $("#gmsg").textContent = "Semua pasangan ketemu! ♡";
  gameConfetti(true);
  setTimeout(() => {
    $("#scratch").classList.add("on");
    setupScratch();
  }, 1400);
}

const scv = $("#sc-cv");
const scx = scv.getContext("2d");
let scratching = false;
let scStrokes = 0;
let scDone = false;

function setupScratch() {
  const card = $("#sc-card");
  const w = card.clientWidth;
  const h = card.clientHeight;
  scv.width = w;
  scv.height = h;
  scv.classList.remove("clear");
  scDone = false;
  scStrokes = 0;
  fillInvite();
  $("#sc-hint").textContent = "Gosok kartunya";
  scx.globalCompositeOperation = "source-over";
  const g = scx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#c9ccd1");
  g.addColorStop(0.5, "#f3f4f6");
  g.addColorStop(1, "#b7bcc4");
  scx.fillStyle = g;
  scx.fillRect(0, 0, w, h);
  scx.fillStyle = "#8a909966";
  scx.font = "600 18px serif";
  scx.textAlign = "center";
  for (let y = 26; y < h; y += 34) {
    for (let x = (y / 34) % 2 ? 20 : 50; x < w; x += 60) {
      scx.fillText("♡", x, y);
    }
  }
  scx.fillStyle = "#5d636d";
  scx.font = "600 20px serif";
  scx.fillText("GOSOK DI SINI", w / 2, h / 2 + 6);
}

function scratchAt(e) {
  const r = scv.getBoundingClientRect();
  const x = (e.clientX - r.left) * scv.width / r.width;
  const y = (e.clientY - r.top) * scv.height / r.height;
  scx.globalCompositeOperation = "destination-out";
  scx.beginPath();
  scx.arc(x, y, 26, 0, 7);
  scx.fill();
  if (++scStrokes % 12 === 0) checkScratch();
}

scv.addEventListener("pointerdown", (e) => {
  scratching = true;
  scv.setPointerCapture(e.pointerId);
  scratchAt(e);
});
scv.addEventListener("pointermove", (e) => {
  if (scratching) scratchAt(e);
});
["pointerup", "pointercancel"].forEach((t) =>
  scv.addEventListener(t, () => (scratching = false)),
);

function checkScratch() {
  if (scDone) return;
  const d = scx.getImageData(0, 0, scv.width, scv.height).data;
  let clear = 0;
  let n = 0;
  for (let i = 3; i < d.length; i += 64) {
    n++;
    if (d[i] < 40) clear++;
  }
  if (clear / n > 0.5) {
    scDone = true;
    scv.classList.add("clear");
    $("#sc-hint").textContent = "Ada undangan buat kamu ♡";
    $("#iv-actions").classList.add("on");
    gameConfetti(false);
  }
}

function gameConfetti(big) {
  const cv = $("#gameconf");
  const c = cv.getContext("2d");
  cv.width = cv.offsetWidth;
  cv.height = cv.offsetHeight;
  const cols = ["#ff4d6d", "#f5b94a", "#ff9ab0", "#c9202c", "#e86f8a"];
  const ps = Array.from({ length: big ? 150 : 70 }, () => ({
    x: Math.random() * cv.width,
    y: -20 - Math.random() * cv.height * 0.5,
    w: 6 + Math.random() * 6,
    h: 10 + Math.random() * 8,
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    r: Math.random() * 6,
    vr: -0.2 + Math.random() * 0.4,
    col: cols[Math.floor(Math.random() * cols.length)],
  }));
  let t = 0;
  (function f() {
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
    if (++t < 240) requestAnimationFrame(f);
    else c.clearRect(0, 0, cv.width, cv.height);
  })();
}

// ---------- Undangan makan malam ----------
const DINNER = {
  tanggal: "2026-10-24",
  jam: "19:00",
  tempat: "[nama tempat]",
  alamat: "",
  catatan: "Pakai baju favoritmu, sisanya biar aku yang urus ♡",
};

function fillInvite() {
  const d = DINNER.tanggal ? new Date(`${DINNER.tanggal}T${DINNER.jam || "19:00"}`) : null;
  const ok = !!d && !isNaN(d);
  $("#iv-date").textContent = ok
    ? d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "[tanggal]";
  $("#iv-time").textContent = DINNER.jam || "[jam]";
  $("#iv-place").textContent = DINNER.tempat;
  $("#iv-note").textContent = DINNER.catatan;

  $("#iv-stamp").classList.remove("on");
  $("#iv-actions").classList.remove("on");
  const yes = $("#iv-yes");
  yes.disabled = false;
  yes.textContent = "Aku mau ♡";

  const cal = $("#iv-cal");
  cal.style.display = ok ? "" : "none";
  if (ok) {
    const p = (n) => String(n).padStart(2, "0");
    const f = (x) => `${x.getFullYear()}${p(x.getMonth() + 1)}${p(x.getDate())}T${p(x.getHours())}${p(x.getMinutes())}00`;
    const end = new Date(d.getTime() + 2 * 3600 * 1000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "SUMMARY:Makan malam berdua ♡",
      `DTSTART:${f(d)}`,
      `DTEND:${f(end)}`,
      `LOCATION:${DINNER.tempat}${DINNER.alamat ? ", " + DINNER.alamat : ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    cal.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  }
}

$("#iv-yes").addEventListener("click", (e) => {
  e.target.disabled = true;
  e.target.textContent = "Sampai ketemu ♡";
  $("#iv-stamp").classList.add("on");
  $("#sc-hint").textContent = "Yeay! Aku tunggu ya ♡";
  gameConfetti(true);
});
