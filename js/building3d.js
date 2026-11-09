// Espelho 3D: torres residenciais modernas modeladas em código (Three.js), com materiais PBR,
// vidro com reflexo, interiores iluminados, brises de madeira, varandas com guarda-corpo de vidro,
// paisagismo, rua e cidade ao fundo. Iluminação dia / entardecer / noite.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/postprocessing/OutputPass.js';
import { RoomEnvironment } from '../vendor/environments/RoomEnvironment.js';
import { mergeGeometries } from '../vendor/utils/BufferGeometryUtils.js';
import { CONFIG } from './data.js';

const FH = 3.1;        // pé-direito de piso a piso
const LOBBY_H = 5.4;   // térreo com pé-direito duplo
const APT_W = 7.6;     // largura de cada apartamento na fachada
const CORE_W = 3.4;    // circulação vertical envidraçada
const DEPTH = 14;
const BALC = 1.8;      // profundidade das varandas
const TOWER_GAP = 36;

const LIGHTS = {
  noite: { top: 0x04050d, mid: 0x0d0b22, bottom: 0x2a1838, sunDir: [-0.4, 0.5, -0.6], sunGlow: 0.0, hemi: 0.16, hemiSky: 0x5a6aa8, sun: 0.35, sunColor: 0x9fb3ff, env: 0.07, interior: 1.25, cityWin: 0.75, cityBase: 0x0c0d14, exposure: 1.0, bloom: 0.62, night: 1, fog: [0x0c0a1a, 110, 520], stars: 1 },
  entardecer: { top: 0x223062, mid: 0x9a5a7a, bottom: 0xffa15a, sunDir: [0.75, 0.12, 0.55], sunGlow: 1.0, hemi: 0.5, hemiSky: 0xffc9a0, sun: 1.8, sunColor: 0xffa66b, env: 0.4, interior: 0.9, cityWin: 0.35, cityBase: 0x2a2530, exposure: 1.0, bloom: 0.42, night: 0.45, fog: [0x8a5a6a, 140, 560], stars: 0.1 },
  dia: { top: 0x2f6fc4, mid: 0x7fb0e6, bottom: 0xdcecff, sunDir: [0.55, 0.75, 0.45], sunGlow: 0.5, hemi: 0.75, hemiSky: 0xcfe3ff, sun: 2.1, sunColor: 0xfff2e0, env: 0.55, interior: 0.7, cityWin: 0.04, cityBase: 0x8d939e, exposure: 0.92, bloom: 0.18, night: 0, fog: [0xc4d8ee, 170, 620], stars: 0 },
};

// ---------------- texturas procedurais ----------------
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
const noise = (g, w, h, a, base) => { const id = g.getImageData(0, 0, w, h); const d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * a; d[i] = base[0] + n; d[i + 1] = base[1] + n; d[i + 2] = base[2] + n; d[i + 3] = 255; } g.putImageData(id, 0, 0); };

const TEX = {};
function makeTextures() {
  // reboco / porcelanato claro com juntas sutis
  TEX.plaster = canvasTex(512, 512, (g, w, h) => {
    noise(g, w, h, 14, [232, 226, 214]);
    g.strokeStyle = 'rgba(120,110,95,0.18)'; g.lineWidth = 2;
    for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let x = 0; x <= w; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,80,70,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 80, 2 + Math.random() * 60); }
  }, { repeat: [0.25, 0.25] });
  // madeira / terracota dos brises
  TEX.wood = canvasTex(256, 512, (g, w, h) => {
    noise(g, w, h, 10, [168, 92, 52]);
    for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(${60 + Math.random() * 40},${25 + Math.random() * 20},10,${0.08 + Math.random() * 0.14})`; g.fillRect(x, 0, 1 + Math.random() * 2, h); }
    for (let i = 0; i < 12; i++) { g.strokeStyle = 'rgba(80,35,15,0.25)'; g.beginPath(); const x = Math.random() * w; g.ellipse(x, Math.random() * h, 3 + Math.random() * 5, 20 + Math.random() * 30, 0, 0, Math.PI * 2); g.stroke(); }
  }, { repeat: [1, 1] });
  // concreto das lajes
  TEX.concrete = canvasTex(256, 256, (g, w, h) => noise(g, w, h, 18, [236, 234, 228]), { repeat: [2, 2] });
  // grama
  TEX.grass = canvasTex(256, 256, (g, w, h) => {
    noise(g, w, h, 30, [52, 92, 44]);
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${90 + Math.random() * 70},${30 + Math.random() * 30},0.5)`; g.fillRect(Math.random() * w, Math.random() * h, 1, 3); }
  }, { repeat: [6, 6] });
  // piso externo (placas)
  TEX.paving = canvasTex(256, 256, (g, w, h) => {
    noise(g, w, h, 16, [176, 170, 160]);
    g.strokeStyle = 'rgba(70,65,60,0.5)'; g.lineWidth = 2;
    for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let y = 0; y < h; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
  }, { repeat: [24, 24] });
  // asfalto
  TEX.asphalt = canvasTex(256, 256, (g, w, h) => noise(g, w, h, 22, [44, 44, 48]), { repeat: [60, 60] });
  // deck de madeira
  TEX.deck = canvasTex(256, 256, (g, w, h) => {
    noise(g, w, h, 12, [150, 104, 70]);
    for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(50,30,15,0.5)'; g.fillRect(0, y, w, 2); }
  }, { repeat: [4, 4] });

  // interiores iluminados (tons de cinza; a cor da situação tinge o emissive)
  TEX.interiors = [0, 1, 2, 3].map((v) => canvasTex(256, 256, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#e8e8e8'); bg.addColorStop(0.18, '#bdbdbd'); bg.addColorStop(0.7, '#8a8a8a'); bg.addColorStop(1, '#4a4a4a');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // luminária / sanca
    const lx = 60 + v * 45;
    const rg = g.createRadialGradient(lx, 30, 4, lx, 30, 90); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.fillRect(0, 10, w, 4);
    // quadro na parede
    g.fillStyle = 'rgba(40,40,40,0.55)'; g.fillRect(150 - v * 25, 80, 46, 34);
    // sofá / móveis
    g.fillStyle = 'rgba(20,20,20,0.75)'; g.fillRect(30 + v * 12, 170, 120, 40); g.fillRect(30 + v * 12, 150, 120, 22);
    g.fillStyle = 'rgba(30,30,30,0.6)'; g.fillRect(180, 186, 50, 30);
    // planta
    g.fillStyle = 'rgba(15,15,15,0.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(214 - v * 5, 140 + i * 6, 6, 16, (i - 3) * 0.4, 0, Math.PI * 2); g.fill(); }
    // cortina de um lado
    const cx = v % 2 ? 0 : w - 56;
    for (let x = 0; x < 56; x += 7) { g.fillStyle = x % 14 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.15)'; g.fillRect(cx + x, 0, 7, h); }
    // piso
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 220, w, 36);
  }));
  // lobby
  TEX.lobby = canvasTex(512, 128, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#fff2d8'); bg.addColorStop(1, '#6b5038'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let x = 30; x < w; x += 70) { const r = g.createRadialGradient(x, 8, 2, x, 8, 40); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }
    g.fillStyle = 'rgba(30,20,10,0.6)'; g.fillRect(200, 80, 110, 30); g.fillRect(380, 60, 14, 60);
  });
  // janelas da cidade ao fundo
  TEX.city = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 4; y < h; y += 9) for (let x = 3; x < w; x += 8) {
      if (Math.random() < 0.42) { const warm = Math.random() < 0.72; g.fillStyle = warm ? `rgba(255,${185 + Math.random() * 50 | 0},${110 + Math.random() * 60 | 0},${0.35 + Math.random() * 0.65})` : `rgba(185,215,255,${0.3 + Math.random() * 0.5})`; g.fillRect(x, y, 5, 6); }
    }
  }, { repeat: [2, 3] });
  TEX.cityColor = canvasTex(128, 256, (g, w, h) => {
    noise(g, w, h, 20, [150, 150, 158]);
    for (let y = 4; y < h; y += 9) for (let x = 3; x < w; x += 8) { g.fillStyle = 'rgba(40,55,75,0.85)'; g.fillRect(x, y, 5, 6); }
  }, { repeat: [2, 3] });
  // brilho de poste no chão
  TEX.glow = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,190,120,0.9)'); r.addColorStop(0.4, 'rgba(255,160,90,0.3)'); r.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
}

// ---------------- construtor com mesclagem de geometrias ----------------
class Builder {
  constructor() { this.buckets = new Map(); }
  add(geo, mat, x = 0, y = 0, z = 0, ry = 0, rx = 0, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0)), new THREE.Vector3(sx, sy, sz));
    const g = geo.clone().applyMatrix4(m);
    if (g.index) { /* ok */ }
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(g);
  }
  box(w, h, d, mat, x, y, z, ry = 0) { this.add(BOX, mat, x, y, z, ry, 0, w, h, d); }
  build(parent, { shadows = true } = {}) {
    const meshes = [];
    for (const [mat, geos] of this.buckets) {
      const norm = geos.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; });
      const merged = mergeGeometries(norm, false);
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = shadows && !mat.transparent; mesh.receiveShadow = shadows;
      parent.add(mesh); meshes.push(mesh);
    }
    return meshes;
  }
}
const BOX = new THREE.BoxGeometry(1, 1, 1);
// UV em escala real (metros) para as texturas não esticarem
function worldUV(geo, scale = 1) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    if (ay > 0.5) uv.setXY(i, p.getX(i) * scale, p.getZ(i) * scale);
    else if (ax > 0.5) uv.setXY(i, p.getZ(i) * scale, p.getY(i) * scale);
    else uv.setXY(i, p.getX(i) * scale, p.getY(i) * scale);
  }
  uv.needsUpdate = true; return geo;
}

export function createMirror(container, { onHover, onSelect, getUnitVisual, getMarkers } = {}) {
  if (!TEX.plaster) makeTextures();
  const isMobile = matchMedia('(max-width: 820px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.6 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = 'mirror-canvas';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 1200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 14; controls.maxDistance = 230;
  controls.autoRotateSpeed = 0.5;

  // ---------- céu com sol / lua ----------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunGlow: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize((modelMatrix*vec4(position,1.)).xyz); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; uniform float sunGlow; varying vec3 vP;
      void main(){ float h = clamp(vP.y, 0., 1.); vec3 c = h < .22 ? mix(bottom, mid, h/.22) : mix(mid, top, pow((h-.22)/.78, .6));
      float s = max(dot(vP, normalize(sunDir)), 0.); c += vec3(1.,.75,.5) * (pow(s, 600.)*3. + pow(s, 12.)*.35) * sunGlow; gl_FragColor = vec4(c, 1.); }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), skyMat));
  const sp = [];
  for (let i = 0; i < 1400; i++) { const t = Math.random() * Math.PI * 2, p = Math.random() * 0.5 + 0.12; sp.push(Math.cos(t) * Math.cos(p) * 850, Math.sin(p) * 850, Math.sin(t) * Math.cos(p) * 850); }
  const starsGeo = new THREE.BufferGeometry(); starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false, transparent: true, fog: false });
  scene.add(new THREE.Points(starsGeo, starsMat));

  // ---------- luzes ----------
  const hemi = new THREE.HemisphereLight(0xbcc8ff, 0x2a2420, 0.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.castShadow = true; sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 400 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // ---------- materiais ----------
  const M = {
    plaster: new THREE.MeshStandardMaterial({ map: TEX.plaster, color: 0xe6e1d8, roughness: 0.82, emissive: 0x6b4a2c, emissiveIntensity: 0 }),
    slab: new THREE.MeshStandardMaterial({ map: TEX.concrete, color: 0xf6f4ef, roughness: 0.7, emissive: 0x5a4028, emissiveIntensity: 0 }),
    wood: new THREE.MeshStandardMaterial({ map: TEX.wood, color: 0xffffff, roughness: 0.6, emissive: 0x7a3812, emissiveIntensity: 0 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 0.35, metalness: 0.8 }),
    darkStone: new THREE.MeshStandardMaterial({ color: 0x2e2c2b, roughness: 0.4, metalness: 0.1 }),
    railGlass: new THREE.MeshPhysicalMaterial({ color: 0xbfe0ea, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.28, envMapIntensity: 1.4, depthWrite: false }),
    coreGlass: new THREE.MeshPhysicalMaterial({ color: 0x1b2a33, roughness: 0.05, metalness: 0.3, clearcoat: 1, emissive: 0xcfe8ff, emissiveMap: TEX.interiors[2], emissiveIntensity: 0.5 }),
    lobbyGlass: new THREE.MeshPhysicalMaterial({ color: 0x1f1a14, roughness: 0.05, metalness: 0.2, clearcoat: 1, emissive: 0xffffff, emissiveMap: TEX.lobby, emissiveIntensity: 1 }),
    downlight: new THREE.MeshBasicMaterial({ color: 0xffd9a8 }),
    led: new THREE.MeshBasicMaterial({ color: 0xffc98a }),
    grass: new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 }),
    paving: new THREE.MeshStandardMaterial({ map: TEX.paving, color: 0x9a948c, roughness: 0.9 }),
    deck: new THREE.MeshStandardMaterial({ map: TEX.deck, roughness: 0.75 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xe9e5dc, roughness: 0.6 }),
    water: new THREE.MeshPhysicalMaterial({ color: 0x0f7f99, roughness: 0.02, metalness: 0, clearcoat: 1, emissive: 0x13c6e8, emissiveIntensity: 0.2, envMapIntensity: 1.6 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.9 }),
    leaf: [0x2f5a2a, 0x3b6b2f, 0x284f2c, 0x4a7a35].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true })),
    hedge: new THREE.MeshStandardMaterial({ color: 0x2c4f28, roughness: 0.95 }),
    planter: new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5 }),
    solar: new THREE.MeshStandardMaterial({ color: 0x1b2a4a, roughness: 0.2, metalness: 0.6 }),
    paint: new THREE.MeshBasicMaterial({ color: 0xd8d4c4 }),
    curb: new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.8 }),
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ map: TEX.asphalt, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const towers = CONFIG.torres;
  const totalW = (towers.length - 1) * TOWER_GAP;
  const pickables = [], blockers = [];
  const unitMeshes = {}, towerGroups = {};
  const uplights = [];
  const B = new Builder();

  // ---------- lote: piso, gramados, piscina, árvores ----------
  const lotW = totalW + 80, lotD = 86, lotZ = 4;
  B.add(worldUV(new THREE.BoxGeometry(lotW, 0.25, lotD), 0.08), M.paving, 0, 0.125, lotZ);
  const lawn = (w, d, x, z) => B.add(worldUV(new THREE.BoxGeometry(w, 0.32, d), 0.12), M.grass, x, 0.16, z);
  lawn(16, lotD - 10, -lotW / 2 + 10, lotZ); lawn(16, lotD - 10, lotW / 2 - 10, lotZ); lawn(lotW - 40, 12, 0, lotZ - lotD / 2 + 8);
  if (towers.length > 1) lawn(TOWER_GAP - 24, 12, 0, -10);
  // sebe no perímetro frontal
  for (const sx of [-1, 1]) B.box(lotW / 2 - 8, 1.1, 1.2, M.hedge, sx * (lotW / 4 + 4), 0.8, lotZ + lotD / 2 - 1);
  // piscina com deck
  const poolZ = 24;
  B.add(worldUV(new THREE.BoxGeometry(24, 0.3, 12), 0.25), M.deck, 0, 0.3, poolZ);
  B.box(17, 0.42, 7.4, M.stone, 0, 0.3, poolZ);
  const water = new THREE.Mesh(new THREE.BoxGeometry(16, 0.06, 6.4), M.water); water.position.set(0, 0.52, poolZ); scene.add(water);
  for (let i = 0; i < 4; i++) { const x = -6 + i * 4; B.box(0.8, 0.25, 2, M.white, x, 0.6, poolZ + 4.6, 0); B.box(0.8, 0.5, 0.6, M.white, x, 0.85, poolZ + 5.4, 0); }
  // árvores
  const ico = new THREE.IcosahedronGeometry(1, 1), cyl = new THREE.CylinderGeometry(0.12, 0.2, 1, 8);
  const tree = (x, z, s = 1) => {
    const h = (3 + Math.random() * 2) * s;
    B.add(cyl, M.trunk, x, h / 2 + 0.2, z, 0, 0, s, h, s);
    const lm = M.leaf[(Math.random() * 4) | 0];
    for (let i = 0; i < 4; i++) { const r = (1.3 + Math.random() * 0.9) * s; B.add(ico, lm, x + (Math.random() - 0.5) * 1.6 * s, h + 0.4 + Math.random() * 1.4 * s, z + (Math.random() - 0.5) * 1.6 * s, Math.random() * 3, Math.random(), r, r * 0.85, r); }
  };
  for (let i = 0; i < 7; i++) { tree(-lotW / 2 + 6 + (i % 2) * 6, lotZ - lotD / 2 + 10 + i * 10, 0.9 + Math.random() * 0.4); tree(lotW / 2 - 6 - (i % 2) * 6, lotZ - lotD / 2 + 10 + i * 10, 0.9 + Math.random() * 0.4); }
  for (let i = 0; i < 8; i++) tree(-lotW / 2 + 16 + i * (lotW - 32) / 7, lotZ - lotD / 2 + 6, 1.1);
  for (let x = -200; x <= 200; x += 14) if (Math.abs(x) > 8) tree(x, lotZ + lotD / 2 + 3.2, 0.8); // árvores da calçada
  // palmeiras perto da piscina
  const palm = (x, z) => { const h = 7; B.add(cyl, M.trunk, x, h / 2, z, 0, 0.05, 1.2, h, 1.2); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; B.add(BOX, M.leaf[1], x + Math.cos(a) * 1.4, h + 0.1, z + Math.sin(a) * 1.4, -a, 0.35, 3.2, 0.08, 0.7); } };
  palm(-13, poolZ - 3); palm(13, poolZ - 3); palm(-13, poolZ + 4); palm(13, poolZ + 4);
  // balizadores (luz de caminho)
  const bollards = [];
  for (let i = 0; i < 10; i++) { for (const sx of [-1, 1]) { const x = sx * 5, z = lotZ + lotD / 2 - 4 - i * 3.2; if (Math.abs(z - poolZ) < 7) continue; B.box(0.18, 0.8, 0.18, M.metal, x, 0.65, z); bollards.push([x, z]); } }
  const bollardHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), M.led, bollards.length);
  bollards.forEach(([x, z], i) => bollardHeads.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 1.0, z))); scene.add(bollardHeads);

  // ---------- rua, calçada, postes, carros ----------
  const roadZ = lotZ + lotD / 2 + 12;
  B.box(2000, 0.25, 6, M.paving, 0, 0.125, lotZ + lotD / 2 + 3);
  B.box(2000, 0.3, 0.3, M.curb, 0, 0.15, lotZ + lotD / 2 + 6);
  for (let x = -400; x <= 400; x += 8) B.box(3.5, 0.02, 0.18, M.paint, x, 0.03, roadZ);
  const lampHeads = [], lampGlows = [];
  const glowMat = new THREE.MeshBasicMaterial({ map: TEX.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
  for (let x = -210; x <= 210; x += 21) {
    const z = lotZ + lotD / 2 + 5.2;
    B.box(0.16, 7, 0.16, M.metal, x, 3.5, z); B.box(0.12, 0.12, 2, M.metal, x, 7, z + 0.9);
    B.box(0.5, 0.12, 0.9, M.metal, x, 6.95, z + 1.7); lampHeads.push([x, 6.88, z + 1.7]);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), glowMat); gl.rotation.x = -Math.PI / 2; gl.position.set(x, 0.06, z + 2.5); scene.add(gl); lampGlows.push(gl);
  }
  const lampLight = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.04, 0.8), M.led, lampHeads.length);
  lampHeads.forEach(([x, y, z], i) => lampLight.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, y, z))); scene.add(lampLight);
  const carColors = [0xe8e8e8, 0x1d1f24, 0x8a1c1c, 0x3a5a7a, 0x9a9a9a, 0x2a2a2a, 0xd6cfc0];
  const carMats = carColors.map((c) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.6, roughness: 0.3, clearcoat: 1 }));
  const carGlass = new THREE.MeshPhysicalMaterial({ color: 0x111418, roughness: 0.05, metalness: 0.5, clearcoat: 1 });
  [-60, -48, -21, 16, 30, 55, 70, 92].forEach((x, i) => { const z = roadZ + (i % 2 ? 3 : -3.6); const mm = carMats[i % carMats.length];
    B.box(4.4, 0.8, 1.85, mm, x, 0.65, z); B.box(2.4, 0.62, 1.7, carGlass, x - 0.2, 1.35, z); B.box(2.2, 0.06, 1.6, mm, x - 0.2, 1.68, z);
    for (const dx of [-1.4, 1.4]) for (const dz of [-0.95, 0.95]) B.add(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14), M.darkStone, x + dx, 0.34, z + dz, 0, Math.PI / 2); });

  // ---------- torres ----------
  towers.forEach((t, ti) => {
    const g = new THREE.Group(); g.position.x = -totalW / 2 + ti * TOWER_GAP; scene.add(g); towerGroups[t.id] = g;
    const TB = new Builder();
    const perSide = Math.ceil(t.aptosPorAndar / 2);
    const W = perSide * APT_W + CORE_W;
    const bodyD = DEPTH - BALC * 2;
    const topY = LOBBY_H + t.andares * FH;

    // embasamento e térreo envidraçado
    TB.box(W + 6, 0.5, DEPTH + 6, M.darkStone, 0, 0.25, 0);
    const lob = new THREE.Mesh(new THREE.BoxGeometry(W - 3, LOBBY_H - 0.8, DEPTH - 5), M.lobbyGlass); lob.position.y = 0.5 + (LOBBY_H - 0.8) / 2; g.add(lob);
    for (let x = -W / 2 + 0.8; x <= W / 2 - 0.7; x += (W - 1.6) / 4) for (const sz of [-1, 1]) TB.add(new THREE.CylinderGeometry(0.32, 0.32, LOBBY_H - 0.5, 16), M.white, x, 0.5 + (LOBBY_H - 0.5) / 2, sz * (DEPTH / 2 - 1.2));
    for (let x = -(W - 3) / 2; x <= (W - 3) / 2 + 0.01; x += 1.6) TB.box(0.07, LOBBY_H - 0.8, 0.07, M.metal, x, 0.5 + (LOBBY_H - 0.8) / 2, (DEPTH - 5) / 2 + 0.03);
    // marquise com fita de LED
    TB.box(10, 0.3, 4.4, M.slab, 0, 4.0, DEPTH / 2 + 1.4); TB.box(9.6, 0.06, 0.1, M.led, 0, 3.84, DEPTH / 2 + 3.5);
    TB.box(0.25, 3.8, 0.25, M.metal, -4.6, 1.9, DEPTH / 2 + 3.3); TB.box(0.25, 3.8, 0.25, M.metal, 4.6, 1.9, DEPTH / 2 + 3.3);

    // corpo recuado (as varandas ficam dentro da projeção das lajes)
    const body = worldUV(new THREE.BoxGeometry(W - 0.4, t.andares * FH, bodyD), 0.25);
    TB.add(body, M.plaster, 0, LOBBY_H + t.andares * FH / 2, 0);

    // lajes com borda fina
    for (let f = 0; f <= t.andares; f++) {
      const y = LOBBY_H + f * FH;
      TB.box(W + 0.3, 0.3, DEPTH + 0.3, M.slab, 0, y + 0.15 - (f === 0 ? 0 : 0), 0);
    }

    // posição de cada apto na fachada
    const aptX = (idx) => -W / 2 + APT_W / 2 + idx * APT_W + (idx >= perSide / 2 ? CORE_W : 0);
    const finXs = new Set();
    for (let idx = 0; idx < perSide; idx++) { finXs.add(+(aptX(idx) - APT_W / 2).toFixed(3)); finXs.add(+(aptX(idx) + APT_W / 2).toFixed(3)); }
    // brises verticais de madeira (divisórias das varandas) e paredes de canto
    const finH = t.andares * FH + 0.3;
    for (const dir of [1, -1]) for (const fx of finXs) {
      const corner = Math.abs(Math.abs(fx) - W / 2) < 0.01;
      const x = corner ? fx - Math.sign(fx) * 0.3 : fx;
      if (corner) TB.add(worldUV(new THREE.BoxGeometry(0.6, finH, BALC + 0.3), 0.25), M.plaster, x, LOBBY_H + finH / 2, dir * (bodyD / 2 + BALC / 2 + 0.15));
      else TB.add(worldUV(new THREE.BoxGeometry(0.45, finH + 1.2, BALC + 0.5), 0.5), M.wood, x, LOBBY_H + (finH + 1.2) / 2, dir * (bodyD / 2 + BALC / 2 + 0.25));
    }

    // circulação central envidraçada (frente)
    const coreH = t.andares * FH + 3;
    const core = new THREE.Mesh(new THREE.BoxGeometry(CORE_W - 0.5, coreH, 0.3), M.coreGlass); core.position.set(0, LOBBY_H + coreH / 2, DEPTH / 2 - 0.2); g.add(core);
    for (let f = 0; f <= t.andares + 1; f++) TB.box(CORE_W - 0.45, 0.32, 0.36, M.metal, 0, LOBBY_H + f * FH - 0.1, DEPTH / 2 - 0.18);
    for (const sx of [-1, 0, 1]) TB.box(0.06, coreH, 0.34, M.metal, sx * (CORE_W - 0.5) / 2, LOBBY_H + coreH / 2, DEPTH / 2 - 0.15);
    TB.box(CORE_W - 0.5, 0.3, bodyD / 2 + 0.3, M.plaster, 0, LOBBY_H + coreH, DEPTH / 4);

    // brises de madeira nas empenas
    for (const sx of [-1, 1]) for (let k = -5; k <= 5; k++) TB.box(0.14, t.andares * FH, 0.32, M.wood, sx * (W / 2 - 0.04), LOBBY_H + t.andares * FH / 2, k * 0.42);

    // apartamentos
    for (let f = 1; f <= t.andares; f++) {
      const y0 = LOBBY_H + (f - 1) * FH + 0.3;  // piso acabado
      const ph = FH - 0.3;                      // altura livre até a laje de cima
      for (let n = 1; n <= t.aptosPorAndar; n++) {
        const id = `${t.id}-${f * 100 + n}`;
        const front = n <= perSide;
        const idx = front ? n - 1 : n - perSide - 1;
        const dir = front ? 1 : -1;
        const cx = front ? aptX(idx) : -aptX(idx);
        const ry = front ? 0 : Math.PI;
        const zFace = dir * (bodyD / 2 + 0.02);
        const k = (f * 7 + n * 3 + ti) % 4;
        const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x182026, metalness: 0.15, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, emissive: 0xffffff, emissiveMap: TEX.interiors[k], envMapIntensity: 1 });
        const panes = [];
        // pano de vidro piso-teto (porta de correr da varanda)
        const gw = APT_W - 1.0, gh = ph - 0.15;
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), glassMat);
        pane.position.set(cx, y0 + gh / 2, zFace); pane.rotation.y = ry; g.add(pane); panes.push(pane);
        // caixilhos
        for (let m = 0; m <= 4; m++) TB.box(0.07, gh, 0.1, M.metal, cx - gw / 2 + m * gw / 4, y0 + gh / 2, zFace + dir * 0.03);
        TB.box(gw, 0.08, 0.1, M.metal, cx, y0 + gh, zFace + dir * 0.03); TB.box(gw, 0.08, 0.12, M.metal, cx, y0 + 0.04, zFace + dir * 0.04);
        // guarda-corpo de vidro na borda da laje + corrimão
        const rz = dir * (DEPTH / 2 + 0.05);
        TB.box(gw + 0.3, 1.05, 0.03, M.railGlass, cx, y0 + 0.55, rz);
        TB.box(gw + 0.3, 0.05, 0.08, M.metal, cx, y0 + 1.08, rz);
        // luz embutida no forro da varanda
        TB.add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), M.downlight, cx - gw / 4, y0 + ph - 0.02, dir * (bodyD / 2 + BALC / 2));
        TB.add(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), M.downlight, cx + gw / 4, y0 + ph - 0.02, dir * (bodyD / 2 + BALC / 2));
        // floreira com planta em algumas varandas
        if ((f + n) % 2 === 0) { const px = cx + (front ? 1 : -1) * (gw / 2 - 0.5); TB.box(0.7, 0.5, 0.5, M.planter, px, y0 + 0.25, dir * (DEPTH / 2 - 0.4)); TB.add(ico, M.leaf[(f + n) % 4], px, y0 + 0.75, dir * (DEPTH / 2 - 0.4), f, 0, 0.45, 0.42, 0.4); }
        // janela na empena para os aptos de ponta
        let sideNormal = null;
        if (idx === 0 || idx === perSide - 1) {
          const sx = Math.sign(cx);
          const sz = dir * (bodyD / 2 - 1.8);
          const sw = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6), glassMat);
          sw.position.set(sx * (W / 2 - 0.19), y0 + 1.5, sz); sw.rotation.y = sx * Math.PI / 2; g.add(sw); panes.push(sw);
          const fx = sx * (W / 2 - 0.12);
          TB.box(0.16, 0.08, 2.16, M.metal, fx, y0 + 2.34, sz); TB.box(0.16, 0.08, 2.16, M.metal, fx, y0 + 0.66, sz);
          TB.box(0.16, 1.76, 0.08, M.metal, fx, y0 + 1.5, sz - 1.04); TB.box(0.16, 1.76, 0.08, M.metal, fx, y0 + 1.5, sz + 1.04); TB.box(0.16, 1.6, 0.05, M.metal, fx, y0 + 1.5, sz);
          TB.box(0.4, 0.06, 2.4, M.white, sx * (W / 2 - 0.05), y0 + 0.6, sz);
          sideNormal = new THREE.Vector3(sx, 0, 0);
        }
        panes.forEach((p) => { p.userData.unitId = id; pickables.push(p); });
        const anchor = new THREE.Vector3(cx, y0 + ph + 0.4, dir * (DEPTH / 2 + 0.3)).add(g.position);
        const center = new THREE.Vector3(cx, y0 + gh / 2, zFace + dir * 0.06).add(g.position);
        unitMeshes[id] = { mat: glassMat, panes, anchor, center, size: [gw, gh], ry, normal: new THREE.Vector3(0, 0, dir), sideNormal, tower: t.id };
      }
    }

    // cobertura: guarda-corpo, casa de máquinas, pérgola, placas solares
    TB.box(W + 0.3, 1.1, 0.04, M.railGlass, 0, topY + 0.85, DEPTH / 2 + 0.1); TB.box(W + 0.3, 1.1, 0.04, M.railGlass, 0, topY + 0.85, -DEPTH / 2 - 0.1);
    for (const sx of [-1, 1]) TB.box(0.04, 1.1, DEPTH + 0.3, M.railGlass, sx * (W / 2 + 0.1), topY + 0.85, 0);
    TB.add(worldUV(new THREE.BoxGeometry(7, 3.4, 6), 0.25), M.plaster, 0, topY + 2.0, -2.5);
    for (let i = 0; i < 4; i++) TB.add(BOX, M.solar, -2.4 + i * 1.6, topY + 3.9, -2.5, 0, -0.35, 1.4, 0.06, 2.2);
    for (const sx of [-1, 1]) for (const sz of [0, 1]) TB.box(0.2, 2.8, 0.2, M.wood, sx * (W / 2 - 2), topY + 1.7, 2 + sz * 4);
    for (let i = 0; i < 12; i++) TB.box(0.12, 0.25, 5, M.wood, -W / 2 + 2 + i * (W - 4) / 11, topY + 3.15, 4);
    TB.add(worldUV(new THREE.BoxGeometry(W - 3, 0.1, 5.4), 0.25), M.deck, 0, topY + 0.35, 4);
    if (towers.length > 1) { const s = makeLabelSprite(t.nome); s.position.set(0, topY + 6, -2.5); s.scale.set(7, 1.75, 1); g.add(s); }

    const meshes = TB.build(g, { shadows: true });
    blockers.push(...meshes);

    // luz de fachada (uplight)
    for (const sx of [-0.35, 0.35]) {
      const sl = new THREE.SpotLight(0xffb070, 0, 70, Math.PI / 7, 0.7, 1.4);
      sl.position.set(g.position.x + sx * W, 0.6, DEPTH / 2 + 9);
      sl.target.position.set(g.position.x + sx * W, topY * 0.75, DEPTH / 2);
      scene.add(sl, sl.target); uplights.push(sl);
    }
  });
  B.build(scene, { shadows: true });

  // ---------- cidade ao fundo ----------
  const cityMat = new THREE.MeshStandardMaterial({ map: TEX.cityColor, color: 0x8d939e, roughness: 0.6, metalness: 0.2, emissive: 0xffffff, emissiveMap: TEX.city, emissiveIntensity: 1 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 });
  const cityGeo = new THREE.BoxGeometry(1, 1, 1); cityGeo.translate(0, 0.5, 0);
  const N = 300, city = new THREE.InstancedMesh(cityGeo, [cityMat, cityMat, roofMat, roofMat, cityMat, cityMat], N);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0, guard = 0;
  while (k < N && guard++ < 20000) {
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 260;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > -20 && r < 230) continue;
    const w = 10 + Math.random() * 18, d = 10 + Math.random() * 18, h = 12 + Math.pow(Math.random(), 1.7) * (r < 200 ? 55 : 95);
    m4.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.round(Math.random()) * 0.1, 0)), new THREE.Vector3(w, h, d));
    city.setMatrixAt(k, m4); col.setHSL(0.6 + Math.random() * 0.1, 0.05 + Math.random() * 0.08, 0.5 + Math.random() * 0.35); city.setColorAt(k, col); k++;
  }
  city.count = k; city.receiveShadow = true; scene.add(city);

  // ---------- moldura de seleção ----------
  const selMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sel = new THREE.Group(); scene.add(sel); sel.visible = false;
  const selBars = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(BOX, selMat); sel.add(m); return m; });

  // ---------- pós-processamento ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.88);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  // ---------- marcadores HTML ----------
  const markerLayer = document.createElement('div'); markerLayer.className = 'marker-layer'; container.appendChild(markerLayer);
  let markerEls = {};

  let lighting = 'noite', selected = null, hoverId = null, towerFocus = 'todas';
  const tmpV = new THREE.Vector3();

  function setLighting(name) {
    lighting = name; const L = LIGHTS[name];
    skyMat.uniforms.top.value.set(L.top); skyMat.uniforms.mid.value.set(L.mid); skyMat.uniforms.bottom.value.set(L.bottom);
    skyMat.uniforms.sunDir.value.set(...L.sunDir); skyMat.uniforms.sunGlow.value = L.sunGlow;
    scene.fog = new THREE.Fog(...L.fog);
    hemi.intensity = L.hemi; hemi.color.set(L.hemiSky);
    sun.intensity = L.sun; sun.color.set(L.sunColor); sun.position.set(...L.sunDir.map((v) => v * 180)); sun.target.position.set(0, 0, 0);
    scene.environmentIntensity = L.env;
    cityMat.emissiveIntensity = L.cityWin; cityMat.color.set(L.cityBase); starsMat.opacity = L.stars;
    renderer.toneMappingExposure = L.exposure; bloom.strength = L.bloom;
    const nt = L.night;
    M.led.color.setScalar(0.15 + nt * 0.85).multiply(new THREE.Color(0xffc98a));
    M.downlight.color.setScalar(0.2 + nt * 0.8).multiply(new THREE.Color(0xffe0b8));
    M.lobbyGlass.emissiveIntensity = 0.25 + nt * 0.75; M.coreGlass.emissiveIntensity = 0.1 + nt * 0.55;
    M.water.emissiveIntensity = 0.05 + nt * 0.55;
    M.plaster.emissiveIntensity = nt * 0.12; M.slab.emissiveIntensity = nt * 0.1; M.wood.emissiveIntensity = nt * 0.15;
    glowMat.opacity = nt; lampGlows.forEach((gl) => (gl.visible = nt > 0.05));
    uplights.forEach((u) => (u.intensity = nt * 220));
    refresh();
  }

  function refresh() {
    const L = LIGHTS[lighting];
    for (const [id, u] of Object.entries(unitMeshes)) {
      const v = getUnitVisual ? getUnitVisual(id) : { color: '#ffd9a0', intensity: 1 };
      u.mat.emissive.set(v.color);
      u.mat.userData.base = (v.intensity ?? 1) * L.interior * (v.dim ? 0.1 : 1);
      u.mat.userData.pulse = !!v.pulse;
    }
    buildMarkers();
  }

  function buildMarkers() {
    markerLayer.innerHTML = ''; markerEls = {};
    for (const mk of (getMarkers ? getMarkers() : [])) {
      const el = document.createElement('button'); el.className = 'mk ' + (mk.cls || ''); el.innerHTML = mk.html; el.title = mk.title || '';
      el.addEventListener('click', (e) => { e.stopPropagation(); select(mk.id, true); });
      markerLayer.appendChild(el); markerEls[mk.id] = el;
    }
  }

  function select(id, emit = false) {
    selected = id;
    const u = id && unitMeshes[id];
    if (u) {
      const [w, h] = u.size, th = 0.12;
      sel.position.copy(u.center); sel.rotation.y = u.ry;
      selBars[0].scale.set(w + th * 2, th, th); selBars[0].position.set(0, h / 2 + th / 2, 0.1);
      selBars[1].scale.set(w + th * 2, th, th); selBars[1].position.set(0, -h / 2 - th / 2, 0.1);
      selBars[2].scale.set(th, h, th); selBars[2].position.set(-w / 2 - th / 2, 0, 0.1);
      selBars[3].scale.set(th, h, th); selBars[3].position.set(w / 2 + th / 2, 0, 0.1);
      sel.visible = true;
    } else sel.visible = false;
    if (emit && onSelect) onSelect(id);
  }

  function focusTower(tid) {
    towerFocus = tid;
    const target = new THREE.Vector3(); let dist;
    if (tid === 'todas') { target.set(0, 16, 0); dist = towers.length > 1 ? 100 : 74; }
    else { target.set(towerGroups[tid].position.x, 15, 0); dist = 70; }
    animateCam(target, dist);
  }
  function focusUnit(id) { const u = unitMeshes[id]; if (!u) return; animateCam(u.center.clone(), 40, u.normal); }

  let camAnim = null;
  function animateCam(target, dist, normal) {
    const fromT = controls.target.clone(), fromP = camera.position.clone();
    const dirV = normal ? normal.clone().add(new THREE.Vector3(0.5 * Math.sign(normal.z || 1), 0.22, 0)).normalize() : camera.position.clone().sub(controls.target).normalize();
    camAnim = { t: 0, fromT, fromP, toT: target, toP: target.clone().add(dirV.multiplyScalar(dist)) };
  }

  camera.position.set(towers.length > 1 ? 64 : 44, 24, 92);
  controls.target.set(0, 16, 0);

  // ---------- interação ----------
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const pickList = () => pickables.concat(blockers);
  let downPos = null;
  function pickAt(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(pickList(), false).filter((h) => !h.object.material.transparent);
    const h = hits[0]; return h && h.object.userData.unitId ? h.object.userData.unitId : null;
  }
  renderer.domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; controls.autoRotate = false; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downPos) return; const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]); downPos = null;
    if (moved > 6) return; select(pickAt(e), true);
  });
  let lastMove = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const now = performance.now(); if (now - lastMove < 50) return; lastMove = now;
    const id = pickAt(e);
    if (id !== hoverId) { hoverId = id; renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; }
    onHover && onHover(id, e);
  });
  renderer.domElement.addEventListener('pointerleave', () => { hoverId = null; onHover && onHover(null); });

  // ---------- loop ----------
  function resize() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();

  let running = true, t0 = performance.now();
  function tick(now) {
    if (!running) return;
    requestAnimationFrame(tick);
    if (container.offsetParent === null || document.querySelector('.modal-bg, .res-bg')) { t0 = now; return; }
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
    if (camAnim) {
      camAnim.t = Math.min(1, camAnim.t + dt * 1.3); const e = 1 - Math.pow(1 - camAnim.t, 3);
      controls.target.lerpVectors(camAnim.fromT, camAnim.toT, e); camera.position.lerpVectors(camAnim.fromP, camAnim.toP, e);
      if (camAnim.t >= 1) camAnim = null;
    }
    controls.update();
    const pulse = 0.5 + 0.5 * Math.sin(now / 280);
    for (const [id, u] of Object.entries(unitMeshes)) {
      let i = u.mat.userData.base ?? 1;
      if (u.mat.userData.pulse) i *= 0.55 + pulse * 0.8;
      if (id === hoverId) i *= 1.7;
      if (id === selected) i = Math.max(i, 1) * (1.2 + pulse * 0.5);
      u.mat.emissiveIntensity = i;
    }
    selMat.color.setScalar(0.7 + pulse * 0.6);
    const w = container.clientWidth, h = container.clientHeight;
    for (const [id, el] of Object.entries(markerEls)) {
      const u = unitMeshes[id]; if (!u) continue;
      const toCam = tmpV.copy(camera.position).sub(u.anchor).normalize();
      const facing = toCam.dot(u.normal) > 0.05 || (u.sideNormal && toCam.dot(u.sideNormal) > 0.2);
      const p = u.anchor.clone().project(camera);
      if (!facing || p.z > 1) { el.style.display = 'none'; continue; }
      el.style.display = ''; el.style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px, ${(-p.y * 0.5 + 0.5) * h}px) translate(-50%, -100%)`;
    }
    composer.render();
  }
  requestAnimationFrame(tick);
  setLighting('noite');

  return {
    setLighting, refresh, select: (id) => select(id, false), focusTower, focusUnit,
    get lighting() { return lighting; },
    setAutoRotate(v) { controls.autoRotate = v; },
    zoom(f) { const d = camera.position.clone().sub(controls.target).multiplyScalar(f); const len = d.length(); if (len < controls.minDistance || len > controls.maxDistance) return; camera.position.copy(controls.target).add(d); },
    reset() { focusTower(towerFocus); },
    dispose() { running = false; ro.disconnect(); renderer.dispose(); container.innerHTML = ''; },
  };
}

function makeLabelSprite(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,16,36,0.85)'; g.beginPath(); g.roundRect(4, 4, 248, 56, 16); g.fill();
  g.strokeStyle = 'rgba(167,139,250,0.9)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#fff'; g.font = '600 30px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false }));
}
