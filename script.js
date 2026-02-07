/* ===== Canvas ===== */
const bg = document.getElementById("bg");
const bctx = bg.getContext("2d");

const pCanvas = document.getElementById("particles");
const pctx = pCanvas.getContext("2d");

/* ===== UI Scale (CSSの --ui-scale と連動) ===== */
function getUIScale() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--ui-scale").trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 1;
}
let UI_SCALE = getUIScale();

resize();
window.addEventListener("resize", resize);

/* ===== Mouse ===== */
const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* ===== Resize ===== */
function resize() {
  bg.width = pCanvas.width = innerWidth;
  bg.height = pCanvas.height = innerHeight;

  // CSS側のスケール変更にも追随（手動で変えた時用）
  UI_SCALE = getUIScale();
}

/* ===== 虹グラデーション霧 ===== */
const fogs = [];
function initFogs() {
  fogs.length = 0;
  for (let i = 0; i < 6; i++) {
    fogs.push({
      x: Math.random() * innerWidth,
      y: innerHeight * 0.3 + Math.random() * innerHeight * 0.4,
      r: (500 + Math.random() * 300) * UI_SCALE,   // ← スケール
      hue: i * 60
    });
  }
}
initFogs();

function drawRainbowFog() {
  bctx.clearRect(0, 0, bg.width, bg.height);
  bctx.globalCompositeOperation = "lighter";

  fogs.forEach(f => {
    const dx = mouse.x - f.x;
    const dy = mouse.y - f.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // マウスの影響範囲も拡大
    const influenceRadius = 300 * UI_SCALE;
    const influence = Math.max(0, influenceRadius - dist) * 0.15;

    const gx = f.x + dx * influence * 0.01;
    const gy = f.y + dy * influence * 0.01;

    const grad = bctx.createRadialGradient(
      gx, gy, f.r * 0.1,
      gx, gy, f.r
    );

    grad.addColorStop(0,   `hsla(${f.hue},100%,60%,0.20)`);
    grad.addColorStop(0.5, `hsla(${f.hue + 20},100%,55%,0.08)`);
    grad.addColorStop(1,   `hsla(${f.hue + 40},100%,45%,0)`);

    bctx.fillStyle = grad;
    bctx.beginPath();
    bctx.arc(gx, gy, f.r, 0, Math.PI * 2);
    bctx.fill();
  });

  bctx.globalCompositeOperation = "screen";
}

/* ===== ワイヤーフレーム球体 ===== */
const spherePoints = [];
let SPHERE_RADIUS_BASE = 330; // base
const SPHERE_DETAIL = 18;
let sphereRot = 0;

/* 球体点生成 */
for (let i = 0; i <= SPHERE_DETAIL; i++) {
  const lat = Math.PI * (i / SPHERE_DETAIL - 0.5);
  for (let j = 0; j < SPHERE_DETAIL * 2; j++) {
    const lon = 2 * Math.PI * j / (SPHERE_DETAIL * 2);
    spherePoints.push({
      x: Math.cos(lat) * Math.cos(lon),
      y: Math.sin(lat),
      z: Math.cos(lat) * Math.sin(lon)
    });
  }
}

function drawSphere() {
  const cx = bg.width / 2;
  const cy = bg.height / 2;
  const SPHERE_RADIUS = SPHERE_RADIUS_BASE * UI_SCALE; // ← スケール

  bctx.save();

  const grad = bctx.createLinearGradient(0, 0, bg.width, bg.height);
  grad.addColorStop(0,   "hsla(0,100%,60%,0.7)");
  grad.addColorStop(0.2, "hsla(180,100%,60%,0.7)");
  grad.addColorStop(0.4, "hsla(300,100%,60%,0.7)");
  grad.addColorStop(0.6, "hsla(120,100%,60%,0.7)");
  grad.addColorStop(0.8, "hsla(60,100%,60%,0.7)");
  grad.addColorStop(1,   "hsla(240,100%,60%,0.7)");

  // 線も点も虹色で描く（← ここが重要）
  bctx.strokeStyle = grad;
  bctx.fillStyle = grad;
  bctx.lineWidth = 1.5;

  spherePoints.forEach(p => {
    const rotX = p.x * Math.cos(sphereRot) - p.z * Math.sin(sphereRot);
    const rotZ = p.x * Math.sin(sphereRot) + p.z * Math.cos(sphereRot);

    const scale = 1 / (1.5 - rotZ);
    const x = cx + rotX * SPHERE_RADIUS * scale;
    const y = cy + p.y * SPHERE_RADIUS * scale;

    bctx.beginPath();
    bctx.arc(x, y, 1.2 * UI_SCALE, 0, Math.PI * 2); // 点サイズも拡大
    bctx.fill();
    bctx.stroke();
  });

  bctx.restore();
  sphereRot -= 0.001;
}

/* ===== 幾何学ネットワーク ===== */
const nodes = [];
let NODE_COUNT_BASE = 60;
let LINK_DIST_BASE = 140;

function initNodes() {
  nodes.length = 0;
  const NODE_COUNT = Math.round(NODE_COUNT_BASE * Math.sqrt(UI_SCALE)); // 増やしすぎ防止
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: (1.5 + Math.random() * 1.5) * UI_SCALE
    });
  }
}
initNodes();

function drawNetwork() {
  pctx.clearRect(0, 0, pCanvas.width, pCanvas.height);

  const LINK_DIST = LINK_DIST_BASE * UI_SCALE;

  nodes.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;

    if (n.x < 0 || n.x > innerWidth) n.vx *= -1;
    if (n.y < 0 || n.y > innerHeight) n.vy *= -1;
  });

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < LINK_DIST) {
        const alpha = 1 - dist / LINK_DIST;
        pctx.strokeStyle = `rgba(160,200,255,${alpha * 0.25})`;
        pctx.lineWidth = 1.0;
        pctx.beginPath();
        pctx.moveTo(a.x, a.y);
        pctx.lineTo(b.x, b.y);
        pctx.stroke();
      }
    }
  }

  nodes.forEach(n => {
    const dx = n.x - mouse.x;
    const dy = n.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < LINK_DIST) {
      const alpha = 1 - dist / LINK_DIST;
      pctx.strokeStyle = `rgba(0,255,255,${alpha * 0.35})`;
      pctx.lineWidth = 0.8;
      pctx.beginPath();
      pctx.moveTo(n.x, n.y);
      pctx.lineTo(mouse.x, mouse.y);
      pctx.stroke();
    }
  });

  nodes.forEach(n => {
    pctx.beginPath();
    pctx.fillStyle = "rgba(255,255,255,0.6)";
    pctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    pctx.fill();
  });
}

/* ===== Animation ===== */
function animate() {
  drawRainbowFog();
  drawSphere();
  drawNetwork();
  requestAnimationFrame(animate);
}
animate();

/* ===== 任意：CSSの --ui-scale を変更したら背景も再初期化したい場合 =====
   例: --ui-scale を動的に変えたいとき
*/
window.addEventListener("keydown", (e) => {
  if (e.key === "r") { // rで再生成
    UI_SCALE = getUIScale();
    initFogs();
    initNodes();
  }
});
