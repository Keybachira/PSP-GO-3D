const T = THREE,
  scene = new T.Scene(),
  cam = new T.PerspectiveCamera(32, 1, 0.1, 200);
cam.position.set(0, 0, 30);
const ren = new T.WebGLRenderer({ antialias: true, alpha: true });
ren.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5) * 1.25, 3));
ren.outputEncoding = T.sRGBEncoding;
ren.toneMapping = T.ACESFilmicToneMapping;
ren.toneMappingExposure = 1.05;
document.body.prepend(ren.domElement);

// environment (studio softboxes)
(function () {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#2a2a34");
  g.addColorStop(0.5, "#16161c");
  g.addColorStop(1, "#050506");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 512);
  x.fillStyle = "#fff";
  [
    [120, 90, 200, 70],
    [560, 60, 260, 60],
    [820, 150, 140, 160],
    [330, 230, 80, 200],
  ].forEach((a) => {
    x.globalAlpha = 0.9;
    x.fillRect(...a);
  });
  x.globalAlpha = 0.6;
  x.fillStyle = "#ff4458";
  x.fillRect(0, 300, 1024, 18);
  const t = new T.CanvasTexture(c);
  t.mapping = T.EquirectangularReflectionMapping;
  t.encoding = T.sRGBEncoding;
  const p = new T.PMREMGenerator(ren);
  scene.environment = p.fromEquirectangular(t).texture;
})();
scene.add(new T.AmbientLight(0xffffff, 0.25));
const dl = new T.DirectionalLight(0xffffff, 0.9);
dl.position.set(-8, 10, 14);
scene.add(dl);
const rim = new T.PointLight(0xff3040, 1.2, 60);
rim.position.set(12, -4, -8);
scene.add(rim);

// materials
const red = new T.MeshPhysicalMaterial({
  color: 0xc5081d,
  metalness: 0.5,
  roughness: 0.3,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
});
const silver = new T.MeshStandardMaterial({
  color: 0xdcdee2,
  metalness: 1,
  roughness: 0.22,
});
const black = new T.MeshPhysicalMaterial({
  color: 0x0b0b0d,
  roughness: 0.35,
  clearcoat: 1,
});
const dark = new T.MeshStandardMaterial({
  color: 0x17171a,
  roughness: 0.5,
  metalness: 0.2,
});

function rr(w, h, r) {
  const s = new T.Shape(),
    x = -w / 2,
    y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function slab(w, h, r, d, b, m) {
  return new T.Mesh(
    new T.ExtrudeGeometry(rr(w, h, r), {
      depth: d,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 8,
      curveSegments: 40,
    }),
    m,
  );
}
function cv(w, h, f) {
  const c = document.createElement("canvas");
  c.width = w * 2;
  c.height = h * 2;
  const x = c.getContext("2d");
  x.scale(2, 2);
  f(x, w, h);
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  t.anisotropy = ren.capabilities.getMaxAnisotropy();
  return t;
}
function plane(w, h, tex, z, flip) {
  const m = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({
      map: tex,
      transparent: true,
      toneMapped: false,
    }),
  );
  m.position.z = z;
  m.userData.pass = 1;
  if (flip) m.rotation.y = Math.PI;
  return m;
}

const psp = new T.Group(),
  inner = new T.Group();
psp.add(inner);
scene.add(psp);
const BT = {};
function reg(id, ...ms) {
  const b = (BT[id] = BT[id] || { m: [], z: [], d: 0, on: 0 });
  ms.forEach((o) => {
    o.userData.id = id;
    b.m.push(o);
    b.z.push(o.position.z);
  });
}

// base
const base = new T.Group();
inner.add(base);
let m = slab(12.6, 6.4, 1.4, 0.6, 0.1, silver);
m.position.z = -0.3;
base.add(m);
m = slab(12.3, 6.1, 1.35, 0.2, 0.08, red);
m.position.z = 0.4;
base.add(m);
m = slab(11.9, 5.8, 1.2, 0.05, 0.05, red);
m.position.z = -0.5;
base.add(m);
// back
const backTex = cv(1200, 600, (x, w, h) => {
  x.clearRect(0, 0, w, h);
  x.fillStyle = "rgba(60,0,8,.85)";
  x.textAlign = "center";
  x.font = "600 44px Arial";
  x.fillText("SONY", w / 2, 150);
  x.strokeStyle = "rgba(60,0,8,.9)";
  x.lineWidth = 14;
  x.lineJoin = "round";
  x.beginPath();
  [
    [-130, 0],
    [10, 0],
    [140, 0],
  ].forEach(() => {});
  x.font = "italic 300 170px Arial";
  x.fillStyle = "rgba(55,0,8,.9)";
  x.fillText("PSP", w / 2, 400);
});
base.add(plane(11, 5.5, backTex, -0.57, true));
[-1, 1].forEach((s) => {
  const g = new T.Mesh(
    new T.TorusGeometry(2.4, 0.16, 16, 48, 1.3),
    new T.MeshPhysicalMaterial({
      color: 0xe0283c,
      roughness: 0.15,
      clearcoat: 1,
      transparent: true,
      opacity: 0.9,
    }),
  );
  g.position.set(s * 4.4, 0.1, -0.6);
  g.rotation.z = s > 0 ? Math.PI - 0.65 : -0.65;
  g.rotation.z =
    (s > 0 ? Math.PI / 2 + 0.0 : -Math.PI / 2) - 0.65 + (s > 0 ? 0 : 0);
  g.rotation.z = s > 0 ? Math.PI - 0.65 - 0 : -0.65;
  g.position.x = s * 2.4;
  g.rotation.z = s < 0 ? Math.PI - 0.65 : -0.65;
  base.add(g);
});

// controls
const zc = 0.7;
// d-pad
const dp = new T.Group();
dp.position.set(-4.3, -1.5, zc);
base.add(dp);
let r = new T.Mesh(new T.TorusGeometry(1.4, 0.11, 16, 64), silver);
r.position.z = 0.02;
dp.add(r);
r = new T.Mesh(
  new T.CylinderGeometry(1.32, 1.32, 0.06, 48),
  new T.MeshStandardMaterial({
    color: 0x8e0516,
    metalness: 0.4,
    roughness: 0.4,
  }),
);
r.rotation.x = Math.PI / 2;
r.position.z = 0.02;
dp.add(r);
[
  [0, 1],
  [0, -1],
  [-1, 0],
  [1, 0],
].forEach(([a, b]) => {
  const k = slab(0.78, 0.78, 0.2, 0.18, 0.06, black);
  k.position.set(a * 0.68, b * 0.68, 0.02);
  dp.add(k);
  reg(b > 0 ? "up" : b < 0 ? "down" : a < 0 ? "left" : "right", k);
  const s = new T.Shape();
  s.moveTo(0, 0.17);
  s.lineTo(0.16, -0.12);
  s.lineTo(-0.16, -0.12);
  const tr = new T.Mesh(
    new T.ShapeGeometry(s),
    new T.MeshBasicMaterial({ color: 0x8a8a90 }),
  );
  tr.position.set(0, 0, 0.29);
  tr.rotation.z = Math.atan2(b, a) - Math.PI / 2;
  k.add(tr);
});
// face buttons
const fb = new T.Group();
fb.position.set(4.3, -1.5, zc);
base.add(fb);
r = new T.Mesh(new T.TorusGeometry(1.55, 0.12, 16, 64), silver);
r.position.z = 0.02;
fb.add(r);
r = new T.Mesh(
  new T.CylinderGeometry(1.46, 1.46, 0.06, 48),
  new T.MeshStandardMaterial({
    color: 0x8e0516,
    metalness: 0.4,
    roughness: 0.4,
  }),
);
r.rotation.x = Math.PI / 2;
r.position.z = 0.02;
fb.add(r);
function sym(t) {
  return cv(128, 128, (x) => {
    x.strokeStyle = "#9a9aa2";
    x.lineWidth = 11;
    x.lineCap = "round";
    x.lineJoin = "round";
    x.beginPath();
    if (t === "o") x.arc(64, 64, 32, 0, 7);
    else if (t === "x") {
      x.moveTo(34, 34);
      x.lineTo(94, 94);
      x.moveTo(94, 34);
      x.lineTo(34, 94);
    } else if (t === "s") x.rect(34, 34, 60, 60);
    else {
      x.moveTo(64, 28);
      x.lineTo(98, 92);
      x.lineTo(30, 92);
      x.closePath();
    }
    x.stroke();
  });
}
[
  ["t", 0, 0.9],
  ["x", 0, -0.9],
  ["s", -0.9, 0],
  ["o", 0.9, 0],
].forEach(([t, a, b]) => {
  const c = new T.Mesh(new T.CylinderGeometry(0.46, 0.5, 0.24, 40), black);
  c.rotation.x = Math.PI / 2;
  c.position.set(a, b, 0.1);
  fb.add(c);
  const p = new T.Mesh(
    new T.PlaneGeometry(0.7, 0.7),
    new T.MeshBasicMaterial({ map: sym(t), transparent: true }),
  );
  p.position.set(a, b, 0.23);
  fb.add(p);
  reg("f" + t, c, p);
});
// analog nub
const an = new T.Group();
an.position.set(-1.6, -2.0, zc);
base.add(an);
r = new T.Mesh(
  new T.TorusGeometry(0.62, 0.1, 16, 40),
  new T.MeshPhysicalMaterial({
    color: 0xa80a1c,
    metalness: 0.5,
    roughness: 0.3,
    clearcoat: 1,
  }),
);
an.add(r);
r = new T.Mesh(new T.CylinderGeometry(0.42, 0.46, 0.14, 40), dark);
r.rotation.x = Math.PI / 2;
r.position.z = 0.04;
an.add(r);
reg("an", r);
const NUB = r;
// select / start
m = slab(1.7, 1.7, 0.8, 0.12, 0.06, black);
m.position.set(0.5, -2.0, zc);
base.add(m);
m.userData.id = "ss";
base.add(
  plane(
    1.3,
    1.3,
    cv(256, 256, (x, w, h) => {
      x.fillStyle = "#ddd";
      x.textAlign = "center";
      x.font = "600 34px Arial";
      x.fillText("SELECT", 128, 100);
      x.fillText("START", 128, 185);
      x.fillRect(50, 126, 156, 3);
    }),
    zc + 0.2,
  )
    .translateX(0.5)
    .translateY(-2.0),
);

// slider
const sl = new T.Group();
inner.add(sl);
m = slab(12.8, 6.6, 2.2, 0.35, 0.12, red);
m.position.z = 0.75;
sl.add(m);
const zt = 1.225;
const bz = plane(
  10,
  5.6,
  cv(1000, 560, (x, w, h) => {
    x.fillStyle = "#050506";
    x.beginPath();
    x.roundRect ? x.roundRect(0, 0, w, h, 50) : x.rect(0, 0, w, h);
    x.fill();
    x.strokeStyle = "#26262c";
    x.lineWidth = 10;
    x.stroke();
    x.textAlign = "center";
    x.strokeStyle = "#f4f4f4";
    x.lineWidth = 4.5;
    x.lineJoin = "round";
    x.lineCap = "round";
    const LG = [
      [
        [2, 56],
        [16, 2],
        [76, 2],
        [68, 30],
        [10, 30],
      ],
      [
        [76, 2],
        [16, 2],
        [12, 26],
        [64, 26],
        [58, 52],
        [0, 52],
      ],
    ];
    [0, 1, 0].forEach((k, i) => {
      x.beginPath();
      LG[k].forEach(([a, b], j) => {
        const X = w / 2 - 150 + i * 112 + a,
          Y = h - 47 + b * 0.6;
        j ? x.lineTo(X, Y) : x.moveTo(X, Y);
      });
      x.stroke();
    });
  }),
  zt,
);
bz.position.y = 0.27;
sl.add(bz);
// screen
const sc = cv(960, 540, () => {}),
  scc = document.createElement("canvas");
scc.width = 1920;
scc.height = 1080;
const sx = scc.getContext("2d");
sx.scale(2, 2);
const stex = new T.CanvasTexture(scc);
stex.encoding = T.sRGBEncoding;
stex.anisotropy = 8;
let scr = 0;
function drawScreen() {
  try {
    drawApp();
  } catch (e) {}
  return;
  const g = sx.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, "#f04a22");
  g.addColorStop(0.55, "#cc2418");
  g.addColorStop(1, "#7c0c10");
  sx.fillStyle = g;
  sx.fillRect(0, 0, 960, 540);
  for (let i = 0; i < 6; i++) {
    sx.beginPath();
    sx.moveTo(0, 300 + i * 14);
    for (let X = 0; X <= 960; X += 20)
      sx.lineTo(X, 300 + i * 14 + Math.sin(X / 140 + i * 0.7) * 38);
    sx.lineTo(960, 540);
    sx.lineTo(0, 540);
    sx.fillStyle = "rgba(255,255,255," + (0.05 + i * 0.012) + ")";
    sx.fill();
  }
  const d = new Date(),
    p = (n) => String(n).padStart(2, "0");
  sx.fillStyle = "#fff";
  sx.textAlign = "right";
  sx.font = "600 28px Arial";
  sx.fillText(
    p(d.getDate()) +
      "/" +
      p(d.getMonth() + 1) +
      "  " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes()),
    880,
    50,
  );
  sx.strokeStyle = "#fff";
  sx.lineWidth = 3;
  sx.strokeRect(892, 28, 44, 22);
  sx.fillStyle = "#fff";
  sx.fillRect(896, 32, 32, 14);
  sx.globalAlpha = 0.9;
  sx.fillRect(100, 150, 80, 56);
  sx.globalAlpha = 1;
  sx.fillStyle = "#fff";
  sx.beginPath();
  sx.arc(450, 185, 32, 0, 7);
  sx.stroke();
  sx.beginPath();
  sx.arc(640, 185, 30, 0, 7);
  sx.fillStyle = "#6a48c8";
  sx.fill();
  sx.fillStyle = "#e9eef7";
  sx.beginPath();
  sx.roundRect
    ? sx.roundRect(290, 140, 130, 70, 24)
    : sx.rect(290, 140, 130, 70);
  sx.fill();
  sx.fillStyle = "#fff";
  sx.textAlign = "center";
  sx.font = "500 22px Arial";
  sx.fillText("Game", 350, 240);
  sx.fillStyle = "#fff";
  sx.fillRect(300, 310, 50, 38);
  sx.textAlign = "left";
  sx.font = "600 34px Arial";
  sx.fillText("Memory Stick™", 380, 330);
  sx.font = "24px Arial";
  sx.fillText("Free Space  60 GB", 380, 368);
  sx.fillRect(380, 382, 520, 2);
  sx.fillRect(300, 440, 56, 44);
  stex.needsUpdate = true;
}
drawScreen();
setInterval(drawScreen, 20000);
const disp = new T.Mesh(
  new T.PlaneGeometry(8.6, 4.9),
  new T.MeshBasicMaterial({ map: stex, toneMapped: false }),
);
disp.position.set(0, 0.47, zt + 0.01);
sl.add(disp);
const glass = new T.Mesh(
  new T.PlaneGeometry(10, 5.6),
  new T.MeshBasicMaterial({
    map: cv(512, 288, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.3, "rgba(255,255,255,0)");
      g.addColorStop(0.38, "rgba(255,255,255,.13)");
      g.addColorStop(0.46, "rgba(255,255,255,0)");
      g.addColorStop(0.7, "rgba(255,255,255,.05)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }),
);
glass.position.set(0, 0.27, zt + 0.02);
sl.add(glass);
// speakers + LED
[-1, 1].forEach((s) => {
  for (let i = 0; i < 4; i++) {
    const h = new T.Mesh(
      new T.CircleGeometry(0.07, 12),
      new T.MeshBasicMaterial({ color: 0x2a0006 }),
    );
    const o = [
      [0, 0.17],
      [0, -0.17],
      [0.17, 0],
      [-0.17, 0],
    ][i];
    h.position.set(s * 5.5 + o[0], 1.7 + o[1], zt + 0.005);
    sl.add(h);
  }
});
const led = new T.Mesh(
  new T.SphereGeometry(0.28, 24, 16),
  new T.MeshPhysicalMaterial({
    color: 0xff2038,
    emissive: 0x600010,
    clearcoat: 1,
    roughness: 0.2,
  }),
);
led.scale.set(1, 1.3, 0.4);
led.position.set(-6.0, -0.1, 1.2);
sl.add(led);

// shadow
const shT = cv(256, 256, (x) => {
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,.65)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
});
const sh = new T.Mesh(
  new T.PlaneGeometry(16, 5),
  new T.MeshBasicMaterial({
    map: shT,
    transparent: true,
    depthWrite: false,
  }),
);
sh.rotation.x = -Math.PI / 2;
sh.position.y = -6.4;
scene.add(sh);

// ---- detalhes extra: parafusos e argola
const bc = base.children,
  scn = sl.children;
[
  [-5.5, -2.3],
  [5.5, -2.3],
  [-5.5, 2.3],
  [5.5, 2.3],
].forEach(([x, y]) => {
  const s = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.1, 16), silver);
  s.rotation.x = Math.PI / 2;
  s.position.set(x, y, -0.12);
  bc[2].add(s);
});
const lug = new T.Mesh(new T.TorusGeometry(0.3, 0.05, 8, 24), silver);
lug.position.set(5.7, -2.6, -0.1);
bc[2].add(lug);
// ---- interior
const pcbM = new T.MeshStandardMaterial({
    color: 0x0e7a43,
    roughness: 0.5,
    metalness: 0.3,
  }),
  gold = new T.MeshStandardMaterial({
    color: 0xd4a64a,
    metalness: 1,
    roughness: 0.3,
  }),
  chipM = new T.MeshStandardMaterial({
    color: 0x1a1a1e,
    roughness: 0.4,
    metalness: 0.4,
  });
const pcb = new T.Group();
pcb.position.z = 0.05;
base.add(pcb);
pcb.add(slab(10.8, 5, 0.5, 0.05, 0.03, pcbM));
[
  [-2.5, 1, 2.2, 1.6],
  [1.2, 1.2, 1.6, 1.6],
  [3.6, -0.4, 1.4, 1.1],
  [-0.5, -1.4, 1.2, 0.8],
  [-4.4, 1.6, 0.9, 0.9],
  [4.4, 1.8, 1, 0.7],
].forEach(([x, y, w, h]) => {
  const c = new T.Mesh(new T.BoxGeometry(w, h, 0.14), chipM);
  c.position.set(x, y, 0.12);
  pcb.add(c);
  const p = new T.Mesh(new T.BoxGeometry(w + 0.15, 0.04, 0.03), gold);
  p.position.set(x, y + h / 2 + 0.1, 0.1);
  pcb.add(p);
});
for (let i = 0; i < 14; i++) {
  const t = new T.Mesh(
    new T.BoxGeometry(0.04, 1 + ((i * 37) % 10) / 7, 0.02),
    gold,
  );
  t.position.set(-4.8 + i * 0.7, -2 + (i % 3) * 0.15, 0.09);
  pcb.add(t);
}
const bat = new T.Group();
bat.position.z = -0.32;
base.add(bat);
bat.add(
  slab(
    5.6,
    3.3,
    0.35,
    0.2,
    0.04,
    new T.MeshStandardMaterial({
      color: 0x35485e,
      metalness: 0.7,
      roughness: 0.35,
    }),
  ),
);
bat.add(
  plane(
    5,
    2.8,
    cv(500, 280, (x) => {
      x.fillStyle = "#e8edf2";
      x.textAlign = "center";
      x.font = "700 38px Arial";
      x.fillText("Li-ion 3.6V", 250, 110);
      x.font = "28px Arial";
      x.fillText("930mAh  PSP-N1000", 250, 165);
    }),
    0.27,
  ),
);
const lcdB = slab(11.4, 6.2, 0.5, 0.04, 0.03, silver);
lcdB.position.z = 0.42;
sl.add(lcdB);
const lcd = slab(
  10.4,
  5.8,
  0.4,
  0.1,
  0.03,
  new T.MeshStandardMaterial({
    color: 0x0a1a3a,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x04102a,
  }),
);
lcd.position.z = 0.52;
sl.add(lcd);
// frente: SONY e microfone
const shell = scn[0];
const sony = plane(
  2,
  0.5,
  cv(256, 64, (x, w, h) => {
    x.fillStyle = "#c9cbd2";
    x.textAlign = "center";
    x.font = "600 34px Georgia,serif";
    x.letterSpacing = "4px";
    x.fillText("SONY", w / 2, 44);
  }),
  0.475,
);
sony.position.y = 3.2;
shell.add(sony);
[
  [-5.45, 2.6, 0x9be34a],
  [-5.2, 2.6, 0xffc830],
  [5.45, 2.6, 0x3aa0ff],
].forEach(([x, y, c]) => {
  const d = new T.Mesh(
    new T.SphereGeometry(0.07, 12, 8),
    new T.MeshBasicMaterial({ color: c, toneMapped: false }),
  );
  d.scale.z = 0.5;
  d.position.set(x, y, 0.49);
  shell.add(d);
});
const ps = plane(
  0.34,
  0.34,
  cv(128, 128, (x) => {
    x.fillStyle = "#fff";
    x.textAlign = "center";
    x.font = "italic 800 78px Arial";
    x.fillText("PS", 64, 88);
  }),
  0.57,
);
ps.position.set(-6.0, -0.1, 0.57);
shell.add(ps);
// borda superior: L/R, Home, volume, música
const strip = plane(
  6,
  0.7,
  cv(900, 105, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#eceef2");
    g.addColorStop(1, "#aeb2ba");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = "#7b7f89";
    x.fillStyle = "#7b7f89";
    x.lineWidth = 3;
    x.textAlign = "center";
    const pill = (cx, w2) => {
      x.beginPath();
      x.roundRect
        ? x.roundRect(cx - w2 / 2, 28, w2, 50, 25)
        : x.rect(cx - w2 / 2, 28, w2, 50);
      x.stroke();
    };
    pill(140, 100);
    x.strokeRect(120, 45, 40, 16);
    x.beginPath();
    x.arc(270, 53, 12, 0, 7);
    x.fill();
    pill(450, 240);
    x.font = "600 26px Arial";
    x.fillText("–   VOL   +", 450, 63);
    x.beginPath();
    x.arc(630, 53, 12, 0, 7);
    x.fill();
    pill(760, 100);
    x.font = "34px Arial";
    x.fillText("♪", 760, 66);
  }),
  0.3,
);
strip.rotation.x = -Math.PI / 2;
strip.position.set(0, 3.31, 0.3);
bc[0].add(strip);
[-1, 1].forEach((s) => {
  const tg = new T.Group();
  tg.position.set(s * 3.9, 3.5, 0.3);
  bc[0].add(tg);
  tg.userData.id = s < 0 ? "L" : "R";
  BT[tg.userData.id] = {
    m: [tg],
    z: [3.5],
    ax: "y",
    d: 0,
    on: 0,
  };
  const tb = slab(2.4, 0.36, 0.16, 0.6, 0.04, silver);
  tb.position.z = -0.3;
  tg.add(tb);
  const cp = slab(0.4, 0.4, 0.12, 0.62, 0.04, black);
  cp.position.set(s * 1.1, 0, -0.31);
  tg.add(cp);
  for (let i = 0; i < 5; i++) {
    const rg = new T.Mesh(new T.BoxGeometry(0.06, 0.03, 0.46), dark);
    rg.position.set(s * (0.2 + i * 0.18), 0.225, 0);
    tg.add(rg);
  }
  const lt = plane(
    0.55,
    0.55,
    cv(64, 64, (x) => {
      x.fillStyle = "#50545e";
      x.textAlign = "center";
      x.font = "800 46px Arial";
      x.fillText(s < 0 ? "L" : "R", 32, 48);
    }),
    0,
  );
  lt.rotation.x = -Math.PI / 2;
  lt.position.set(-s * 0.8, 0.235, 0);
  tg.add(lt);
  const l = plane(
    0.5,
    0.5,
    cv(64, 64, (x) => {
      x.fillStyle = "#6b6f78";
      x.textAlign = "center";
      x.font = "700 44px Arial";
      x.fillText(s < 0 ? "L" : "R", 32, 48);
    }),
    0.3,
  );
  l.rotation.x = -Math.PI / 2;
});
// anéis no analógico
an.add(
  plane(
    0.8,
    0.8,
    cv(128, 128, (x) => {
      x.fillStyle = "#202024";
      x.beginPath();
      x.arc(64, 64, 62, 0, 7);
      x.fill();
      x.strokeStyle = "#4a4a52";
      x.lineWidth = 3;
      for (let r = 14; r < 60; r += 11) {
        x.beginPath();
        x.arc(64, 64, r, 0, 7);
        x.stroke();
      }
    }),
    0.115,
  ),
);
// ecrã Store
function drawStore() {
  sx.fillStyle = "#0b1c3a";
  sx.fillRect(0, 0, 960, 540);
  sx.fillStyle = "#fff";
  sx.textAlign = "left";
  sx.font = "600 26px Arial";
  sx.fillText("PlayStation.Store", 20, 40);
  [
    "New Release",
    "Downloadable Games",
    "View All by Title",
    "Add-ons",
    "Demos",
    "Videos",
    "Themes & Wallpaper",
    "Staff Picks",
  ].forEach((t, i) => {
    sx.fillStyle = i ? "#1f6fc9" : "#2f8ce8";
    sx.fillRect(20, 60 + i * 50, 330, 44);
    sx.fillStyle = "#fff";
    sx.font = "22px Arial";
    sx.fillText(t, 32, 90 + i * 50);
  });
  [
    ["LocoRoco", "#e8e8e8", "#222", 380],
    ["GO! Puzzle", "#4aa0e0", "#fff", 560],
    ["beats", "#f08a2a", "#fff", 740],
  ].forEach(([n, bg, fg, x]) => {
    sx.fillStyle = bg;
    sx.fillRect(x, 60, 170, 110);
    sx.fillStyle = fg;
    sx.textAlign = "center";
    sx.font = "700 26px Arial";
    sx.fillText(n, x + 85, 125);
  });
  sx.fillStyle = "#5a3fa0";
  sx.fillRect(380, 190, 530, 260);
  sx.fillStyle = "#fff";
  sx.font = "700 64px Arial";
  sx.fillText("PATAPON 2", 645, 340);
  sx.textAlign = "left";
  sx.font = "20px Arial";
  sx.fillStyle = "#cfd8e8";
  sx.fillText(
    "Back    Enter                              Terms of Service    Legal",
    20,
    515,
  );
  stex.needsUpdate = true;
}
bScr.onclick = () => {
  scr = 1 - scr;
  bScr.textContent = scr ? "Ecrã: Menu" : "Ecrã: Store";
  drawScreen();
};
bTop.onclick = () => {
  if (exOn) bEx.click();
  auto = false;
  open = false;
  tRx = 1.25;
  tRy = Math.round(tRy / (Math.PI * 2)) * Math.PI * 2;
  tz = 26;
};
// pixel a pixel: grelha LCD, sombra de contacto, flocos na pintura
const gt = cv(4, 4, (x) => {
  x.fillStyle = "rgba(0,0,0,.18)";
  x.fillRect(3, 0, 1, 4);
  x.fillRect(0, 3, 4, 1);
});
gt.wrapS = gt.wrapT = T.RepeatWrapping;
gt.repeat.set(480, 272);
const grid = new T.Mesh(
  new T.PlaneGeometry(8.6, 4.9),
  new T.MeshBasicMaterial({
    map: gt,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }),
);
grid.position.set(0, 0.47, zt + 0.015);
sl.add(grid);
const shd = plane(
  11.8,
  0.9,
  cv(8, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  }),
  0.7,
);
shd.position.y = -3.85;
sl.add(shd);
const fk = cv(256, 256, (x) => {
  x.fillStyle = "#808080";
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = "rgba(255,255,255," + Math.random() * 0.6 + ")";
    x.fillRect(Math.random() * 256, Math.random() * 256, 1.2, 1.2);
  }
});
fk.wrapS = fk.wrapT = T.RepeatWrapping;
red.bumpMap = fk;
red.bumpScale = 0.35;
red.needsUpdate = true;
[
  ["home", -2.07],
  ["vold", -0.6],
  ["volu", 0.6],
  ["note", 2.07],
].forEach(([id, x]) => {
  const b = new T.Mesh(
    new T.BoxGeometry(id === "home" || id === "note" ? 0.7 : 0.62, 0.07, 0.46),
    new T.MeshStandardMaterial({
      color: 0xdde0e6,
      metalness: 0.6,
      roughness: 0.3,
    }),
  );
  b.position.set(x, 3.345, 0.3);
  b.userData.id = id;
  bc[0].add(b);
  BT[id] = { m: [b], z: [b.position.y], ax: "y", d: 0, on: 0 };
});
led.userData.id = "ps";
// contornos (esqueleto)
const edges = [];
[bc[0], bc[1], bc[2], scn[0], lcdB].forEach((o) => {
  const e = new T.LineSegments(
    new T.EdgesGeometry(o.geometry, 30),
    new T.LineBasicMaterial({
      color: 0xff8090,
      transparent: true,
      opacity: 0.75,
    }),
  );
  e.visible = false;
  o.add(e);
  edges.push(e);
});
// partes para desmontar
const parts = [],
  lbs = [],
  vv = new T.Vector3();
let exOn = false,
  exV = 0,
  xrOn = false;
function add(o, off, name, ax, ay) {
  parts.push({ o, z0: o.position.z, off });
  if (name) {
    const a = new T.Object3D();
    a.position.set(ax, ay, 0);
    o.add(a);
    const d = document.createElement("div");
    d.className = "lb";
    d.textContent = name;
    document.body.appendChild(d);
    lbs.push({ a, d });
  }
}
add(bc[2], -4.4, "Tampa traseira", 5.9, -2.2);
add(bc[3], -4.4);
add(bc[4], -4.4);
add(bc[5], -4.4);
add(bat, -2.8, "Bateria", 2.8, 1.2);
add(bc[0], -1.4, "Estrutura prateada", 6.4, 0.5);
add(pcb, 0, "Placa-mãe", 5.4, -2.2);
add(bc[1], 1.4, "Carcaça frontal", 6.1, 2.3);
add(dp, 1.4);
add(fb, 1.4, "Botões e controlos", 1.8, 0);
add(an, 1.4);
add(bc[9], 1.4);
add(bc[10], 1.4);
add(lcdB, 2.8, "Chassis metálico", 5.7, -2.6);
add(lcd, 3.6, "Painel LCD", 5.2, 2.4);
add(scn[0], 4.8, "Ecrã e moldura", 6.4, 0.4);
for (let i = 1; i <= 12; i++)
  add(scn[i], 4.8 + (i == 2 ? 0.05 : i == 3 ? 0.1 : 0));
function setX(on) {
  xrOn = on;
  [red, silver].forEach((m) => {
    m.transparent = on;
    m.opacity = on ? 0.18 : 1;
    m.depthWrite = !on;
    m.needsUpdate = true;
  });
  edges.forEach((e) => (e.visible = on));
  scn[1].material.opacity = on ? 0.3 : 1;
  disp.material.transparent = true;
  disp.material.opacity = on ? 0.5 : 1;
  disp.material.needsUpdate = true;
  bXr.classList.toggle("on", on);
}
bXr.onclick = () => setX(!xrOn);
bEx.onclick = () => {
  exOn = !exOn;
  bEx.classList.toggle("on", exOn);
  bEx.textContent = exOn ? "Montar" : "Desmontar";
  auto = false;
  if (exOn) {
    open = true;
    tRy = Math.round(tRy / (Math.PI * 2)) * Math.PI * 2 - 0.8;
    tRx = 0.3;
    tz = 42;
  } else {
    tz = 30;
    tRy = Math.round(tRy / (Math.PI * 2)) * Math.PI * 2 + 0.3;
    tRx = -0.08;
  }
};
// state
let open = true,
  auto = true,
  ry = 0.35,
  rx = -0.08,
  tRy = 0.35,
  tRx = -0.08,
  slide = 3.9,
  drag = false,
  lx = 0,
  ly = 0,
  idle = 0,
  zoom = 30,
  tz = 30;
const el = ren.domElement;
el.addEventListener("pointerdown", (e) => {
  const hb = pick(e);
  if (hb) {
    heldId = hb;
    hold(hb, 1);
    el.setPointerCapture(e.pointerId);
    return;
  }
  drag = true;
  lx = e.clientX;
  ly = e.clientY;
  auto = false;
  el.setPointerCapture(e.pointerId);
});
el.addEventListener("pointermove", (e) => {
  if (heldId === "an") {
    stick.x = Math.max(-1, Math.min(1, (e.clientX - p0x) / 50));
    stick.y = Math.max(-1, Math.min(1, (e.clientY - p0y) / 50));
    return;
  }
  if (!drag) return;
  tRy += (e.clientX - lx) * 0.01;
  tRx = Math.max(-0.9, Math.min(0.9, tRx + (e.clientY - ly) * 0.008));
  lx = e.clientX;
  ly = e.clientY;
});
el.addEventListener("pointerup", () => {
  drag = false;
  if (heldId) {
    hold(heldId, 0);
    heldId = null;
    stick.x = stick.y = 0;
  }
});
el.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    tz = Math.max(16, Math.min(44, tz + e.deltaY * 0.02));
  },
  { passive: false },
);
bSlide.onclick = () => (open = !open);
bFront.onclick = () => {
  auto = false;
  tRy = Math.round(tRy / (Math.PI * 2)) * Math.PI * 2 + 0.3;
  tRx = -0.08;
};
bBack.onclick = () => {
  auto = false;
  tRy =
    Math.round((tRy - Math.PI) / (Math.PI * 2)) * Math.PI * 2 + Math.PI - 0.3;
  tRx = -0.08;
};
bAuto.onclick = () => (auto = !auto);
function rs() {
  const w = Math.max(200, innerWidth - 48),
    h = Math.max(200, innerHeight - 94);
  ren.setSize(w, h);
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
}
addEventListener("resize", rs);
rs();
// ===== controlos funcionais + sistema do ecrã =====
let sound = true,
  power = true,
  vol = 6,
  bri = 3,
  theme = 0,
  toastT = "",
  toastU = 0,
  fr = 0,
  ft = 0,
  heldId = null,
  p0x = 0,
  p0y = 0,
  lastS = "";
const stick = { x: 0, y: 0 };
const THEMES = [
  ["#f04a22", "#cc2418", "#7c0c10"],
  ["#2f7be8", "#1d4fb0", "#0b1f55"],
  ["#3dbb6a", "#1f8a4a", "#0a3d22"],
  ["#9a5be0", "#6a32b0", "#2a0f55"],
];
const CATS = [
  ["Settings", ["Brilho", "Volume", "Tema"]],
  ["Music", ["Visualizer"]],
  ["Game", ["Snake", "Memory Stick"]],
  ["Network", ["PlayStation Store"]],
];
const A = {
  mode: "xmb",
  cat: 2,
  it: 0,
  snake: null,
  pause: false,
  store: 0,
  t: 0,
};
let actx;
function beep(f, d) {
  if (!sound || !power) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(),
      g = actx.createGain();
    o.type = "square";
    o.frequency.value = f;
    g.gain.value = 0.04 * (vol / 10);
    o.connect(g);
    g.connect(actx.destination);
    o.start();
    o.stop(actx.currentTime + d);
  } catch (e) {}
}
function toast(t) {
  toastT = t;
  toastU = performance.now() + 1600;
}
function newSnake() {
  A.snake = {
    b: [
      [8, 7],
      [7, 7],
      [6, 7],
    ],
    d: [1, 0],
    n: [1, 0],
    f: [20, 7],
    s: 0,
    over: false,
  };
  A.pause = false;
}
function nav(dx, dy) {
  if (A.mode === "xmb") {
    if (dx) {
      A.cat = (A.cat + dx + CATS.length) % CATS.length;
      A.it = 0;
    }
    if (dy) {
      const n = CATS[A.cat][1].length;
      A.it = (A.it + dy + n) % n;
    }
  } else if (A.mode === "snake" && A.snake) {
    const s = A.snake;
    if (dx && s.d[0] === 0) s.n = [dx, 0];
    if (dy && s.d[1] === 0) s.n = [0, dy];
  } else if (A.mode === "store" || scr === 1) {
    A.store = (A.store + dy + 8) % 8;
  }
}
function ok() {
  if (scr === 1) return;
  if (A.mode === "xmb") {
    const it = CATS[A.cat][1][A.it];
    if (it === "Snake") {
      A.mode = "snake";
      newSnake();
    } else if (it === "Visualizer") A.mode = "viz";
    else if (it === "PlayStation Store") {
      scr = 1;
      bScr.textContent = "Ecrã: Menu";
    } else if (it === "Brilho") {
      bri = (bri % 5) + 1;
      toast("Brilho " + bri + "/5");
    } else if (it === "Volume") {
      vol = (vol + 1) % 11;
      toast("Volume " + vol + "/10");
    } else if (it === "Tema") {
      theme = (theme + 1) % 4;
    } else toast("Sem ficheiros");
  } else if (A.mode === "snake" && A.snake.over) newSnake();
}
function back() {
  A.mode = "xmb";
  scr = 0;
  bScr.textContent = "Ecrã: Store";
}
function press(id) {
  if (!power) return;
  const m = {
    up: () => nav(0, -1),
    down: () => nav(0, 1),
    left: () => nav(-1, 0),
    right: () => nav(1, 0),
    fx: ok,
    fo: back,
    fs: () => toast("□ Menu"),
    ft: () => toast("△ Opções"),
    ps: back,
    home: back,
    L: () => toast("L"),
    R: () => toast("R"),
    start: () => {
      if (A.mode === "snake") A.pause = !A.pause;
      else ok();
    },
    select: () => {
      theme = (theme + 1) % 4;
      toast("Tema " + (theme + 1));
    },
    volu: () => {
      vol = Math.min(10, vol + 1);
      toast("Volume " + vol + "/10");
    },
    vold: () => {
      vol = Math.max(0, vol - 1);
      toast("Volume " + vol + "/10");
    },
    note: () => {
      A.mode = "viz";
      scr = 0;
    },
  };
  if (m[id]) {
    m[id]();
    beep(id === "fx" ? 880 : 620, 0.05);
  }
  drawApp();
}
function hold(id, v) {
  const b = BT[id];
  if (b) b.on = v;
  if (v && id !== "an") press(id);
}
const rc = new T.Raycaster(),
  mv = new T.Vector2();
function pick(e) {
  const r = el.getBoundingClientRect();
  mv.set(
    ((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1,
  );
  rc.setFromCamera(mv, cam);
  for (const h of rc.intersectObjects(scene.children, true)) {
    let o = h.object;
    if (o.userData.pass || !o.visible) continue;
    while (o && !o.userData.id) o = o.parent;
    if (!o) return null;
    let id = o.userData.id;
    if (id === "ss") {
      id = o.worldToLocal(h.point.clone()).y > 0 ? "select" : "start";
    }
    p0x = e.clientX;
    p0y = e.clientY;
    return id;
  }
  return null;
}
const KM = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "ft",
  a: "fs",
  s: "fx",
  d: "fo",
  q: "L",
  e: "R",
  Enter: "start",
  Shift: "select",
  h: "home",
  "+": "volu",
  "=": "volu",
  "-": "vold",
};
const kid = (e) => KM[e.key] || KM[e.key.toLowerCase()];
addEventListener("keydown", (e) => {
  const id = kid(e);
  if (!id || (e.repeat && !["up", "down", "left", "right"].includes(id)))
    return;
  e.preventDefault();
  hold(id, 1);
});
addEventListener("keyup", (e) => {
  const id = kid(e);
  if (id) hold(id, 0);
});
function bg() {
  const c = THEMES[theme],
    g = sx.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, c[0]);
  g.addColorStop(0.55, c[1]);
  g.addColorStop(1, c[2]);
  sx.fillStyle = g;
  sx.fillRect(0, 0, 960, 540);
  for (let i = 0; i < 5; i++) {
    sx.beginPath();
    sx.moveTo(0, 330 + i * 16);
    for (let X = 0; X <= 960; X += 20)
      sx.lineTo(
        X,
        330 + i * 16 + Math.sin(X / 140 + i * 0.7 + A.t * 0.03) * 34,
      );
    sx.lineTo(960, 540);
    sx.lineTo(0, 540);
    sx.fillStyle = "rgba(255,255,255," + (0.05 + i * 0.012) + ")";
    sx.fill();
  }
}
function hdr() {
  const d = new Date(),
    p = (n) => String(n).padStart(2, "0");
  sx.fillStyle = "#fff";
  sx.textAlign = "right";
  sx.font = "600 26px Arial";
  sx.fillText(
    p(d.getDate()) +
      "/" +
      p(d.getMonth() + 1) +
      "  " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes()),
    880,
    44,
  );
  sx.strokeStyle = "#fff";
  sx.lineWidth = 3;
  sx.strokeRect(892, 24, 44, 22);
  sx.fillRect(896, 28, 32, 14);
}
function drawXMB() {
  bg();
  hdr();
  sx.textAlign = "center";
  CATS.forEach((c, i) => {
    const s = i === A.cat,
      x = 150 + i * 200,
      w = s ? 110 : 80;
    sx.fillStyle = s ? "#fff" : "rgba(255,255,255,.35)";
    sx.beginPath();
    sx.roundRect
      ? sx.roundRect(x - w / 2, 150 - w / 2, w, w, 18)
      : sx.rect(x - w / 2, 150 - w / 2, w, w);
    sx.fill();
    sx.fillStyle = s ? THEMES[theme][1] : "#fff";
    sx.font = "700 " + (s ? 54 : 38) + "px Arial";
    sx.fillText(c[0][0], x, 150 + (s ? 18 : 13));
    sx.fillStyle = "#fff";
    sx.font = (s ? "600 22px" : "18px") + " Arial";
    sx.fillText(c[0], x, 150 + (s ? 84 : 64));
  });
  CATS[A.cat][1].forEach((t, i) => {
    const s = i === A.it,
      y = 290 + i * 58;
    if (s) {
      sx.fillStyle = "rgba(255,255,255,.22)";
      sx.fillRect(110, y - 34, 740, 50);
    }
    sx.textAlign = "left";
    sx.fillStyle = "#fff";
    sx.font = (s ? "700 32px" : "26px") + " Arial";
    sx.fillText(t, 140, y);
    sx.textAlign = "right";
    sx.font = "24px Arial";
    sx.fillText(
      t === "Brilho"
        ? bri + "/5"
        : t === "Volume"
          ? vol + "/10"
          : t === "Tema"
            ? "#" + (theme + 1)
            : "",
      820,
      y,
    );
  });
}
function drawSnake() {
  if (!A.snake) newSnake();
  const s = A.snake;
  sx.fillStyle = "#11181d";
  sx.fillRect(0, 0, 960, 540);
  sx.fillStyle = "#8fbf5a";
  sx.font = "700 26px Arial";
  sx.textAlign = "left";
  sx.fillText("SNAKE   " + s.s, 24, 48);
  sx.textAlign = "right";
  sx.fillText(A.pause ? "PAUSA" : "", 930, 48);
  sx.strokeStyle = "#2c3b2a";
  sx.lineWidth = 2;
  sx.strokeRect(0, 90, 960, 420);
  s.b.forEach((c, i) => {
    sx.fillStyle = i ? "#8fbf5a" : "#d5f08a";
    sx.fillRect(c[0] * 30 + 2, 90 + c[1] * 30 + 2, 26, 26);
  });
  sx.fillStyle = "#f0624d";
  sx.fillRect(s.f[0] * 30 + 5, 90 + s.f[1] * 30 + 5, 20, 20);
  if (s.over) {
    sx.fillStyle = "rgba(0,0,0,.6)";
    sx.fillRect(0, 90, 960, 420);
    sx.fillStyle = "#fff";
    sx.textAlign = "center";
    sx.font = "700 54px Arial";
    sx.fillText("GAME OVER", 480, 290);
    sx.font = "24px Arial";
    sx.fillText("✕ recomeçar · ○ sair", 480, 340);
  }
}
function drawViz() {
  bg();
  hdr();
  sx.fillStyle = "#fff";
  sx.textAlign = "left";
  sx.font = "600 28px Arial";
  sx.fillText("Music  ·  Vol " + vol, 40, 50);
  for (let i = 0; i < 40; i++) {
    const h =
      20 +
      (Math.sin(A.t * 0.25 + i * 0.5) * 0.5 + 0.5) *
        (40 + vol * 26) *
        (0.6 + Math.sin(i * 1.7 + A.t * 0.1) * 0.3);
    sx.fillStyle = "rgba(255,255,255,.85)";
    sx.fillRect(40 + i * 22, 490 - h, 16, h);
  }
}
function drawStore() {
  sx.fillStyle = "#0b1c3a";
  sx.fillRect(0, 0, 960, 540);
  sx.fillStyle = "#fff";
  sx.textAlign = "left";
  sx.font = "600 26px Arial";
  sx.fillText("PlayStation.Store", 20, 40);
  [
    "New Release",
    "Downloadable Games",
    "View All by Title",
    "Add-ons",
    "Demos",
    "Videos",
    "Themes & Wallpaper",
    "Staff Picks",
  ].forEach((t, i) => {
    sx.fillStyle = i === A.store ? "#4aa8ff" : "#1f6fc9";
    sx.fillRect(20, 60 + i * 50, 330, 44);
    sx.fillStyle = "#fff";
    sx.font = "22px Arial";
    sx.fillText(t, 32, 90 + i * 50);
  });
  [
    ["LocoRoco", "#e8e8e8", "#222", 380],
    ["GO! Puzzle", "#4aa0e0", "#fff", 560],
    ["beats", "#f08a2a", "#fff", 740],
  ].forEach(([n, b2, fg, x]) => {
    sx.fillStyle = b2;
    sx.fillRect(x, 60, 170, 110);
    sx.fillStyle = fg;
    sx.textAlign = "center";
    sx.font = "700 26px Arial";
    sx.fillText(n, x + 85, 125);
  });
  sx.fillStyle = "#5a3fa0";
  sx.fillRect(380, 190, 530, 260);
  sx.fillStyle = "#fff";
  sx.font = "700 64px Arial";
  sx.fillText("PATAPON 2", 645, 340);
  sx.textAlign = "left";
  sx.font = "20px Arial";
  sx.fillStyle = "#cfd8e8";
  sx.fillText("✕ Enter     ○ Back", 20, 515);
}
function drawApp() {
  const md = scr === 1 ? "store" : A.mode;
  if (!power) {
    sx.fillStyle = "#030304";
    sx.fillRect(0, 0, 960, 540);
    stex.needsUpdate = true;
    return;
  }
  disp.material.color.setScalar(0.45 + bri * 0.11);
  if (md === "snake") drawSnake();
  else if (md === "viz") drawViz();
  else if (md === "store") drawStore();
  else drawXMB();
  if (performance.now() < toastU) {
    sx.fillStyle = "rgba(0,0,0,.6)";
    sx.fillRect(330, 470, 300, 44);
    sx.fillStyle = "#fff";
    sx.textAlign = "center";
    sx.font = "600 24px Arial";
    sx.fillText(toastT, 480, 501);
  }
  stex.needsUpdate = true;
}
function tick() {
  if (A.mode === "snake" && A.snake && !A.pause && !A.snake.over && power) {
    const s = A.snake;
    s.d = s.n;
    const h = [s.b[0][0] + s.d[0], s.b[0][1] + s.d[1]];
    if (
      h[0] < 0 ||
      h[0] >= 32 ||
      h[1] < 0 ||
      h[1] >= 14 ||
      s.b.some((c) => c[0] === h[0] && c[1] === h[1])
    ) {
      s.over = true;
      beep(160, 0.3);
    } else {
      s.b.unshift(h);
      if (h[0] === s.f[0] && h[1] === s.f[1]) {
        s.s++;
        beep(990, 0.06);
        s.f = [Math.floor(Math.random() * 32), Math.floor(Math.random() * 14)];
      } else s.b.pop();
    }
  }
  if (Math.hypot(stick.x, stick.y) > 0.6) {
    const dx = Math.abs(stick.x) > Math.abs(stick.y) ? Math.sign(stick.x) : 0,
      dy = dx ? 0 : Math.sign(stick.y),
      k = dx + "," + dy;
    if (k !== lastS) {
      nav(dx, dy);
      lastS = k;
    }
  } else lastS = "";
  A.t++;
  tSl.classList.toggle("on", open);
  drawApp();
}
setInterval(tick, 120);
// painéis
tSl.onclick = () => bSlide.click();
tSn.onclick = () => {
  sound = !sound;
  tSn.classList.toggle("on", sound);
};
tPw.onclick = () => {
  power = !power;
  tPw.classList.toggle("on", power);
  drawApp();
};
tabs.onclick = (e) => {
  const m = e.target.dataset.m;
  if (!m) return;
  [...tabs.children].forEach((b) => b.classList.toggle("on", b === e.target));
  if (m === "apart") {
    if (!exOn) bEx.click();
    return;
  }
  if (exOn) bEx.click();
  setX(m === "xray");
  if (m === "play") {
    open = true;
    auto = false;
    bFront.click();
  } else if (m === "orbit") {
    auto = true;
  } else if (m === "top") bTop.click();
};
const CW = [
  ["Vermelho", 0xc5081d, 0x8e0516],
  ["Preto", 0x131316, 0x0a0a0c],
  ["Pérola", 0xe6e6ec, 0xb8b8c0],
  ["Azul", 0x1d46c0, 0x0f2a78],
];
let cwi = 0;
function setCW(i) {
  cwi = (i + CW.length) % CW.length;
  const c = CW[cwi];
  red.color.setHex(c[1]);
  dp.children[1].material.color.setHex(c[2]);
  fb.children[1].material.color.setHex(c[2]);
  pTxt.textContent = "0" + (cwi + 1) + "/0" + CW.length + " · " + c[0];
}
pPrev.onclick = () => setCW(cwi - 1);
pNext.onclick = () => setCW(cwi + 1);
setCW(0);
const clk = new T.Clock();
(function loop() {
  requestAnimationFrame(loop);
  const t = clk.getElapsedTime();
  if (auto) tRy += 0.004;
  ry += (tRy - ry) * 0.08;
  rx += (tRx - rx) * 0.08;
  zoom += (tz - zoom) * 0.1;
  const asp = cam.aspect,
    fit = asp < 1 ? (zoom / Math.max(asp, 0.55)) * 0.62 + 10 : zoom;
  cam.position.z = fit;
  slide += ((open ? 3.9 : 0.3) - slide) * 0.09;
  shd.material.opacity = Math.min(1, Math.max(0, (slide - 0.5) / 2));
  shd.visible = exV < 0.05;
  grid.position.z = zt + 0.015 + 4.9 * exV;
  sl.position.y = slide;
  inner.position.y = -slide / 2;
  psp.rotation.set(rx, ry, 0);
  psp.position.y = Math.sin(t * 1.2) * 0.25;
  sh.scale.setScalar(1 - Math.sin(t * 1.2) * 0.04);
  exV += ((exOn ? 1 : 0) - exV) * 0.07;
  parts.forEach((p) => (p.o.position.z = p.z0 + p.off * exV));
  for (const k in BT) {
    const b = BT[k];
    b.d += ((b.on ? 1 : 0) - b.d) * 0.4;
    const ax = b.ax || "z";
    b.m.forEach(
      (o, i) => (o.position[ax] = b.z[i] - b.d * (ax === "y" ? 0.14 : 0.1)),
    );
  }
  NUB.position.x += (stick.x * 0.14 - NUB.position.x) * 0.4;
  NUB.position.y += (-stick.y * 0.14 - NUB.position.y) * 0.4;
  fr++;
  if (t - ft > 1) {
    document.getElementById("fps").textContent = fr;
    fr = 0;
    ft = t;
  }
  inner.position.z = -exV * 0.9;
  lbs.forEach((l) => {
    l.a.getWorldPosition(vv);
    vv.project(cam);
    l.d.style.transform =
      "translate(" +
      ((vv.x * 0.5 + 0.5) * el.clientWidth + 36) +
      "px," +
      ((-vv.y * 0.5 + 0.5) * el.clientHeight + 70) +
      "px) translateY(-50%)";
    l.d.style.opacity = exV > 0.8 ? 1 : 0;
  });
  ren.render(scene, cam);
})();
