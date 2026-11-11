// Planta 3D mobiliada do apartamento (estilo "maquete" vista de cima), girando sozinha.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';

const FLOOR = { quarto: 0xc8a27a, estar: 0xd2ad84, varanda: 0x9c8f86, banho: 0xdfe3e6, cozinha: 0xe7e2da, servico: 0xd9d6d0, circ: 0xcfa982 };

export function createPlan3D(container, planta, { onLabels } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, navigator.maxTouchPoints > 1 ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.1;
  controls.maxPolarAngle = Math.PI * 0.45; controls.minDistance = 6; controls.maxDistance = 30;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 1.4));
  const dl = new THREE.DirectionalLight(0xfff1dd, 2.2); dl.position.set(8, 16, 6); dl.castShadow = true;
  dl.shadow.mapSize.set(1024, 1024); Object.assign(dl.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(dl);

  const amb = planta.ambientes;
  const W = Math.max(...amb.map((a) => a.x + a.w)), D = Math.max(...amb.map((a) => a.z + a.d));
  const root = new THREE.Group(); root.position.set(-W / 2, 0, -D / 2); scene.add(root);

  // base / laje
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.3, D + 0.6), new THREE.MeshStandardMaterial({ color: 0xf5f3ef }));
  base.position.set(W / 2, -0.16, D / 2); base.receiveShadow = true; root.add(base);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.9 });
  const wallTop = new THREE.MeshStandardMaterial({ color: 0x1d1b22 });
  const WH = 1.6, WT = 0.12;
  const wall = (x1, z1, x2, z2, h = WH) => {
    const len = Math.hypot(x2 - x1, z2 - z1); if (len < 0.05) return;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + WT, h, WT), [wallMat, wallMat, wallTop, wallMat, wallMat, wallMat]);
    m.position.set((x1 + x2) / 2, h / 2, (z1 + z2) / 2); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); m.castShadow = true; m.receiveShadow = true; root.add(m);
  };
  const box = (w, h, d, color, x, y, z, opts = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: opts.r ?? 0.7, metalness: opts.m ?? 0, transparent: !!opts.o, opacity: opts.o ?? 1 }));
    m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; root.add(m); return m;
  };
  const cyl = (r, h, color, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), new THREE.MeshStandardMaterial({ color })); m.position.set(x, y + h / 2, z); m.castShadow = true; root.add(m); return m; };

  for (const a of amb) {
    // piso
    const fl = new THREE.Mesh(new THREE.BoxGeometry(a.w - 0.02, 0.04, a.d - 0.02), new THREE.MeshStandardMaterial({ color: FLOOR[a.tipo] ?? 0xcccccc, roughness: 0.8 }));
    fl.position.set(a.x + a.w / 2, 0.02, a.z + a.d / 2); fl.receiveShadow = true; root.add(fl);
    // paredes com "porta" (vão) no meio da parede que dá para a área social
    const h = a.tipo === 'varanda' ? 0.9 : WH;
    const gap = a.tipo === 'circ' || a.tipo === 'estar' ? 0 : 0.85;
    wall(a.x, a.z, a.x + a.w, a.z, h);
    wall(a.x, a.z, a.x, a.z + a.d, h);
    wall(a.x + a.w, a.z, a.x + a.w, a.z + a.d, h);
    if (gap && a.d > 0) { // parede de baixo com vão de porta
      const mid = a.x + a.w / 2;
      wall(a.x, a.z + a.d, mid - gap / 2, a.z + a.d, h);
      wall(mid + gap / 2, a.z + a.d, a.x + a.w, a.z + a.d, h);
    } else if (a.tipo !== 'estar') wall(a.x, a.z + a.d, a.x + a.w, a.z + a.d, h);
    mobiliar(a);
  }

  function mobiliar(a) {
    const cx = a.x + a.w / 2, cz = a.z + a.d / 2;
    switch (a.tipo) {
      case 'quarto': {
        const big = a.w > 3;
        const bw = big ? 1.7 : 1.1;
        box(bw, 0.45, 2.0, 0xe8e6ea, cx, 0, a.z + 1.15);
        box(bw, 0.12, 1.3, 0x7c8aa5, cx, 0.45, a.z + 1.5);
        box(bw * 0.8, 0.15, 0.35, 0xffffff, cx, 0.45, a.z + 0.35);
        box(bw + 0.1, 0.9, 0.12, 0x6b4f3a, cx, 0, a.z + 0.12);
        box(0.45, 0.45, 0.4, 0x8a6a50, cx - bw / 2 - 0.35, 0, a.z + 0.4);
        box(Math.min(a.w - 0.4, 2.2), 2.0, 0.55, 0xd8d2c8, cx, 0, a.z + a.d - 0.4);
        if (big) box(1.4, 0.02, 0.9, 0xb98ad8, cx, 0.05, a.z + 2.6);
        break;
      }
      case 'estar': {
        // sofá em L
        box(2.6, 0.45, 0.9, 0x6d6a75, a.x + 1.6, 0, a.z + a.d - 1.0);
        box(2.6, 0.75, 0.25, 0x5b5862, a.x + 1.6, 0, a.z + a.d - 0.55);
        box(0.9, 0.45, 1.5, 0x6d6a75, a.x + 0.65, 0, a.z + a.d - 2.0);
        box(2.0, 0.02, 1.6, 0xe9e0cf, a.x + 1.8, 0.04, a.z + a.d - 2.2);
        box(0.9, 0.35, 0.6, 0x3a2d24, a.x + 1.8, 0, a.z + a.d - 2.3);
        box(1.8, 0.5, 0.4, 0x2b2a30, a.x + 1.8, 0, a.z + 0.3);
        box(1.5, 0.85, 0.06, 0x111114, a.x + 1.8, 0.65, a.z + 0.25, { m: 0.5, r: 0.2 });
        // mesa de jantar laranja (como no vídeo)
        const mx = a.x + a.w - 1.6, mz = a.z + 1.6;
        cyl(0.75, 0.05, 0xf08a24, mx, 0.72, mz);
        cyl(0.08, 0.72, 0x333333, mx, 0, mz);
        for (let i = 0; i < 6; i++) { const ang = i / 6 * Math.PI * 2; box(0.42, 0.45, 0.42, 0xf3efe8, mx + Math.cos(ang) * 1.05, 0, mz + Math.sin(ang) * 1.05); }
        cyl(0.18, 0.5, 0x2f6b3a, a.x + a.w - 0.3, 0, a.z + a.d - 0.3);
        break;
      }
      case 'cozinha': {
        box(a.w - 0.2, 0.9, 0.6, 0xf2f0ec, cx, 0, a.z + 0.4);
        box(a.w - 0.2, 0.04, 0.62, 0x2c2c32, cx, 0.9, a.z + 0.4);
        box(0.6, 0.9, a.d - 1.2, 0xf2f0ec, a.x + 0.4, 0, cz + 0.4);
        box(0.7, 1.9, 0.7, 0xb8bcc4, a.x + a.w - 0.5, 0, a.z + a.d - 0.5, { m: 0.6, r: 0.3 });
        box(1.4, 0.92, 0.8, 0xf08a24, cx + 0.3, 0, cz + 0.3);
        break;
      }
      case 'banho': {
        box(0.5, 0.8, 0.45, 0xffffff, a.x + 0.4, 0, a.z + 0.35);
        box(0.4, 0.4, 0.55, 0xffffff, a.x + a.w - 0.35, 0, a.z + 0.4);
        box(0.9, 0.02, 0.9, 0xcfd8dc, a.x + 0.55, 0.02, a.z + a.d - 0.55);
        box(0.02, 1.5, 0.9, 0xa5d8ff, a.x + 1.0, 0, a.z + a.d - 0.55, { o: 0.35, r: 0.05 });
        break;
      }
      case 'servico': {
        box(0.6, 0.85, 0.6, 0xe6e6e6, a.x + 0.45, 0, cz);
        box(0.6, 0.85, 0.6, 0xe6e6e6, a.x + 1.1, 0, cz);
        box(0.8, 0.9, 0.5, 0xf2f0ec, a.x + a.w - 0.6, 0, a.z + 0.3);
        break;
      }
      case 'varanda': {
        cyl(0.45, 0.05, 0x3b3640, cx - 0.6, 0.72, cz);
        cyl(0.05, 0.72, 0x333333, cx - 0.6, 0, cz);
        for (const s of [-1, 1]) box(0.42, 0.45, 0.42, 0xf08a24, cx - 0.6 + s * 0.75, 0, cz);
        box(1.6, 0.9, 0.55, 0x3a3640, a.x + a.w - 1.0, 0, a.z + 0.35);
        for (const px of [a.x + 0.35, a.x + a.w - 0.35]) cyl(0.2, 0.7, 0x2f6b3a, px, 0, a.z + a.d - 0.3);
        break;
      }
    }
  }

  // rótulos dos ambientes
  const labelPos = amb.map((a) => ({ nome: a.nome, area: a.area, p: new THREE.Vector3(a.x + a.w / 2 - W / 2, WH + 0.2, a.z + a.d / 2 - D / 2) }));
  const labelLayer = document.createElement('div'); labelLayer.className = 'plan-labels'; container.appendChild(labelLayer);
  const labelEls = labelPos.map((l) => { const e = document.createElement('div'); e.className = 'plan-label'; e.innerHTML = `${l.nome}<b>${l.area.toLocaleString('pt-BR')} m²</b>`; labelLayer.appendChild(e); return e; });

  // Planta 3D própria (arquivo .glb/.gltf exportado do SketchUp, Revit, Blender etc.).
  // Basta preencher `modelo3d` da planta em js/data.js (ex.: 'plantas/P98.glb').
  if (planta.modelo3d) {
    new GLTFLoader().load(planta.modelo3d, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model); const size = box.getSize(new THREE.Vector3());
      const s = Math.max(W, D) / Math.max(size.x, size.z, 0.001);
      model.scale.setScalar(s);
      const b2 = new THREE.Box3().setFromObject(model); const c = b2.getCenter(new THREE.Vector3());
      model.position.sub(new THREE.Vector3(c.x, b2.min.y, c.z));
      model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      root.visible = false; labelLayer.style.display = 'none';
      scene.add(model);
    }, undefined, (err) => console.warn('Não foi possível carregar a planta 3D', planta.modelo3d, err));
  }

  camera.position.set(0, 16, 12);
  controls.target.set(0, 0, 0);

  function resize() { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  let running = true;
  (function tick() {
    if (!running) return; requestAnimationFrame(tick); controls.update();
    const w = container.clientWidth, h = container.clientHeight;
    labelPos.forEach((l, i) => { const p = l.p.clone().project(camera); labelEls[i].style.transform = `translate(${(p.x * 0.5 + 0.5) * w}px, ${(-p.y * 0.5 + 0.5) * h}px) translate(-50%,-50%)`; });
    renderer.render(scene, camera);
  })();
  return {
    toggleSpin() { controls.autoRotate = !controls.autoRotate; return controls.autoRotate; },
    dispose() { running = false; ro.disconnect(); renderer.dispose(); container.innerHTML = ''; },
  };
}

// Planta baixa 2D em SVG (miniatura do painel lateral e das propostas)
export function plantaSVG(planta, { labels = false } = {}) {
  const amb = planta.ambientes;
  const W = Math.max(...amb.map((a) => a.x + a.w)), D = Math.max(...amb.map((a) => a.z + a.d));
  const s = 30;
  const fill = { quarto: '#d9b48a', estar: '#e0bd93', varanda: '#a99d94', banho: '#e6eaee', cozinha: '#efe9e0', servico: '#e2dfd9', circ: '#d8b38c' };
  let out = `<svg viewBox="-6 -6 ${W * s + 12} ${D * s + 12}" class="planta-svg" xmlns="http://www.w3.org/2000/svg">`;
  for (const a of amb) {
    out += `<rect x="${a.x * s}" y="${a.z * s}" width="${a.w * s}" height="${a.d * s}" fill="${fill[a.tipo]}" stroke="#1b1a20" stroke-width="3"/>`;
    if (a.tipo === 'quarto') out += `<rect x="${(a.x + a.w / 2 - 0.7) * s}" y="${(a.z + 0.3) * s}" width="${1.4 * s}" height="${1.9 * s}" rx="4" fill="#f5f5f7" stroke="#9aa" stroke-width="1"/>`;
    if (a.tipo === 'estar') out += `<circle cx="${(a.x + a.w - 1.6) * s}" cy="${(a.z + 1.6) * s}" r="${0.75 * s}" fill="#f08a24"/><rect x="${(a.x + 0.3) * s}" y="${(a.z + a.d - 1.4) * s}" width="${2.8 * s}" height="${0.9 * s}" rx="6" fill="#6d6a75"/>`;
    if (labels) out += `<text x="${(a.x + a.w / 2) * s}" y="${(a.z + a.d / 2) * s}" font-size="13" text-anchor="middle" fill="#1b1a20" font-family="system-ui" font-weight="600">${a.nome}</text>`;
  }
  return out + '</svg>';
}
