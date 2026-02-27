const profiles = [
  {
    name: "Budi Santoso",
    age: 24,
    photo: "img/profile_budi.webp",
    bg: "linear-gradient(135deg,#FFD6E0,#FFABBA)",
    wa: "#",
    hobi: "Suka main game 🎮",
  },
  {
    name: "Rizky Pratama",
    age: 26,
    photo: "img/profile_rizky.webp",
    bg: "linear-gradient(135deg,#D6F5FF,#A8E6FF)",
    wa: "#",
    hobi: "Pecinta buku 📚",
  },
  {
    name: "Dimas Arya",
    age: 23,
    photo: "img/profile_dimas.webp",
    bg: "linear-gradient(135deg,#E8FFDB,#C8F5A0)",
    wa: "#",
    hobi: "Hobi masak 👨‍🍳 & traveling ✈️",
  },
  {
    name: "Aldi Firmansyah",
    age: 27,
    photo: "img/profile_aldi.webp",
    bg: "linear-gradient(135deg,#FFF3CC,#FFE680)",
    wa: "#",
    hobi: "Ngopi tiap hari ☕",
  },
  {
    name: "Anomali",
    age: 19,
    photo: "img/fotoku.webp",
    bg: "linear-gradient(135deg,#FFD6F5,#FF99E8)",
    wa: "6283835993907",
    hobi: "Tidur adalah hobi 😴",
  },
];

let userName = "";
let currentIdx = 0;
let isDragging = false;
let startX = 0;
let currentX = 0;
let cardEl = null;
let tooltipTimeout = null;

// Simpan referensi handler aktif agar bisa dihapus saat kartu berganti
let activeOnMove = null;
let activeOnEnd = null;
let activeOnMoveTouchRef = null;
let activeOnEndTouchRef = null;

function startApp() {
  const val = document.getElementById("nameInput").value.trim();
  if (!val) {
    document.getElementById("nameInput").style.borderColor = "var(--rose)";
    document.getElementById("nameInput").placeholder =
      "Nama tidak boleh kosong!";
    return;
  }
  userName = val;
  showScreen("swipe");
  document.getElementById("greetText").textContent = `Hai, ${userName}! 👋`;
  buildDots();
  renderCard();
}

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function buildDots() {
  const wrap = document.getElementById("dots");
  wrap.innerHTML = "";
  profiles.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.id = `dot-${i}`;
    wrap.appendChild(d);
  });
}

function updateDots() {
  profiles.forEach((_, i) => {
    const d = document.getElementById(`dot-${i}`);
    if (i < currentIdx) {
      d.className = "dot done";
    } else if (i === currentIdx) {
      d.className = "dot active";
    } else {
      d.className = "dot";
    }
  });
}

function renderCard() {
  const area = document.getElementById("cardArea");
  // Remove old card
  const old = area.querySelector(".card");
  if (old) old.remove();

  const p = profiles[currentIdx];
  const card = document.createElement("div");
  card.className = "card";
  card.id = "currentCard";
  card.innerHTML = `
    <img src="${p.photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;display:block;" draggable="false">
    <div class="card-info">
      <div class="card-name">${p.name}</div>
      <div class="card-age">${p.age} tahun • ${p.hobi}</div>
    </div>
    <div class="stamp stamp-nope" id="stampNope">NOPE</div>
    <div class="stamp stamp-like" id="stampLike">SUKA</div>
  `;

  // Card entrance animation
  card.style.opacity = "0";
  card.style.transform = "scale(.9) translateY(20px)";
  area.insertBefore(card, area.firstChild);

  requestAnimationFrame(() => {
    card.style.transition =
      "opacity .3s, transform .4s cubic-bezier(.175,.885,.32,1.275)";
    card.style.opacity = "1";
    card.style.transform = "scale(1) translateY(0)";
    setTimeout(() => {
      card.style.transition = "";
      setupDrag(card, currentIdx);
    }, 400);
  });

  cardEl = card;
  updateDots();
}

function setupDrag(card, cardIndex) {
  // === HAPUS handler lama dari kartu sebelumnya ===
  if (activeOnMove) window.removeEventListener("mousemove", activeOnMove);
  if (activeOnEnd) window.removeEventListener("mouseup", activeOnEnd);
  if (activeOnMoveTouchRef)
    window.removeEventListener("touchmove", activeOnMoveTouchRef);
  if (activeOnEndTouchRef)
    window.removeEventListener("touchend", activeOnEndTouchRef);

  const isFinal = cardIndex === profiles.length - 1;
  let localDragX = 0;

  function onStart(e) {
    isDragging = true;
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    localDragX = 0;
    card.style.transition = "none";
  }

  function onMove(e) {
    if (!isDragging) return;
    localDragX = (e.touches ? e.touches[0].clientX : e.clientX) - startX;

    let dx = localDragX;

    const rot = dx * 0.08;
    card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;

    const nope = card.querySelector("#stampNope");
    const like = card.querySelector("#stampLike");

    if (dx < -20) {
      nope.style.opacity = Math.min(1, Math.abs(dx) / 80);
      like.style.opacity = 0;
    } else if (dx > 20) {
      like.style.opacity = Math.min(1, dx / 80);
      nope.style.opacity = 0;
    } else {
      nope.style.opacity = 0;
      like.style.opacity = 0;
    }
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;

    const threshold = 80;
    const dx = localDragX;
    localDragX = 0;

    if (!isFinal && dx < -threshold) {
      // Kartu 1-4: geser kiri jauh = reject
      dismissCard(card, -1);
    } else if (!isFinal && dx > threshold) {
      // Kartu 1-4: geser kanan jauh → snapback + pesan tidak cocok
      showTooltip("Orang ini tidak cocok dengan anda 😅 Geser ke kiri!", true);
      snapToCenter(card);
    } else if (isFinal && dx > threshold) {
      // Kartu 5: geser kanan jauh = match!
      dismissCard(card, 1);
    } else if (isFinal && dx < -15) {
      // Kartu 5: geser kiri → snapback + pesan paling cocok
      showTooltip(
        "Orang ini paling cocok dengan anda! ❤️ Geser ke kanan!",
        false,
      );
      snapToCenter(card);
    } else {
      snapToCenter(card);
    }
  }

  // Simpan referensi handler baru
  activeOnMove = onMove;
  activeOnEnd = onEnd;
  activeOnMoveTouchRef = onMove;
  activeOnEndTouchRef = onEnd;

  card.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);
  card.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd);
}

function snapToCenter(card) {
  const nope = card.querySelector("#stampNope");
  const like = card.querySelector("#stampLike");
  if (nope) nope.style.opacity = 0;
  if (like) like.style.opacity = 0;
  // Pakai inline style langsung — tidak bisa di-override oleh 'transition: none' dari onStart
  card.style.transition = "transform .45s cubic-bezier(.175,.885,.32,1.275)";
  card.style.transform = "translateX(0) rotate(0deg)";
  card.addEventListener("transitionend", function cleanup() {
    card.style.transition = "";
    card.removeEventListener("transitionend", cleanup);
  });
}

function showTooltip(msg, isWarning) {
  const tt = document.getElementById("tooltip");
  tt.textContent = msg;
  tt.style.background = isWarning
    ? "rgba(255,77,109,.9)"
    : "rgba(123,47,190,.9)";
  tt.classList.add("show");
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => tt.classList.remove("show"), 2500);
}

function dismissCard(card, dir) {
  const isFinal = currentIdx === profiles.length - 1;
  card.style.transition = "transform .5s cubic-bezier(.4,0,1,1), opacity .5s";
  card.style.transform = `translateX(${dir * 600}px) rotate(${dir * 30}deg)`;
  card.style.opacity = "0";

  setTimeout(() => {
    card.remove();
    currentIdx++;
    if (isFinal) {
      showMatch();
    } else {
      renderCard();
    }
  }, 500);
}

function showMatch() {
  showScreen("match");
  const p = profiles[profiles.length - 1];
  document.getElementById("matchAvatar").innerHTML =
    `<img src="${p.photo}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;display:block;" draggable="false">`;
  document.getElementById("matchNameCard").textContent = p.name;
  document.getElementById("matchAgeCard").textContent = p.age + " tahun";
  document.getElementById("matchName").textContent = p.name;
  document.getElementById("matchDesc").textContent =
    `${userName} & ${p.name} — memang sudah takdir dari semesta 🌟`;
  document.getElementById("waBtn").href =
    `https://wa.me/${p.wa}?text=${encodeURIComponent(`Hallo ${p.name}! Sepertinya kita cocok nihhh!!!`)}`;

  // Confetti
  spawnConfetti();
}

function spawnConfetti() {
  const wrap = document.getElementById("confetti");
  const colors = [
    "#FF4D6D",
    "#FFCB47",
    "#7B2FBE",
    "#25D366",
    "#FF99E8",
    "#A8E6FF",
  ];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement("div");
    c.className = "confetti-piece";
    c.style.cssText = `
      left: ${Math.random() * 100}%;
      top: -20px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      animation-duration: ${2 + Math.random() * 3}s;
      animation-delay: ${Math.random() * 1.5}s;
    `;
    wrap.appendChild(c);
  }
}
