// Ícones, ilustrações (fotos das encomendas), QR do Pix, gráficos e utilidades de interface.

const P = {
  cube: '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  building: '<rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1M10 22v-4h4v4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14.5c2.4.2 4 1.8 4.5 4.5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  wallet: '<rect x="2" y="5" width="20" height="15" rx="2.5"/><path d="M2 10h20M16 15h2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  megaphone: '<path d="m3 11 15-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6M18 8a3 3 0 0 1 0 6"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx=".5"/><rect x="12" y="8" width="3" height="10" rx=".5"/><rect x="17" y="5" width="3" height="13" rx=".5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sunset: '<path d="M12 10V2M5 10l1.4 1.4M2 18h2M20 18h2M17.6 11.4 19 10M22 22H2M16 18a4 4 0 0 0-8 0M16 6l-4 4-4-4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  back: '<path d="m15 18-6-6 6-6"/>', chev: '<path d="m9 18 6-6-6-6"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  wa: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.3-1.3-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  pix: '<path d="m12 2 4.2 4.2-4.2 4.2-4.2-4.2zM12 13.6l4.2 4.2L12 22l-4.2-4.2zM2 12l4.2-4.2 4.2 4.2-4.2 4.2zM13.6 12l4.2-4.2L22 12l-4.2 4.2z"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 6-10 7L2 6"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  drop: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0z"/>', flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.5 1.3 2.7 2.5 2.7z"/>',
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>', doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.6v16.8a.6.6 0 0 1-.8.6L5 20V5.6a1 1 0 0 1 .8-1L12.2 3a.6.6 0 0 1 .8.6z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  toy: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>', vote: '<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5z"/><path d="M22 19H2"/>',
  car: '<path d="M5 17h14M6 17v2M18 17v2M3 13l2-6a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 7l2 6v4H3z"/><circle cx="7.5" cy="13.5" r="1"/><circle cx="16.5" cy="13.5" r="1"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.8 1.2 2.6 2.6 0 0 0-2.7-1.8A3.5 3.5 0 0 1 5 11c1 0 2.6-1 4-1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
export const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// hash simples para variar as ilustrações de forma estável
const h = (s) => { let x = 2166136261; for (const c of String(s)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0); };

// "Foto" da encomenda: ilustração em SVG de um volume na prateleira da portaria
export function fotoEncomenda(e) {
  const k = h(e.id);
  const bgs = [['#3b3a40', '#1d1c22'], ['#4a3f36', '#221c18'], ['#2e3a44', '#151b21'], ['#3e3446', '#1c1722']];
  const [b1, b2] = bgs[k % bgs.length];
  const id = 'g' + k;
  let obj = '';
  const t = e.tipo;
  if (t === 'caixa') {
    obj = `<g transform="translate(${70 + (k % 20)} 78) rotate(${(k % 9) - 4})">
      <path d="M0 30 L60 8 L130 26 L70 50 Z" fill="#d9a066"/><path d="M0 30 L70 50 L70 112 L0 92 Z" fill="#b97d43"/><path d="M70 50 L130 26 L130 88 L70 112 Z" fill="#a46c37"/>
      <path d="M30 19 L100 40 L100 52 L30 31Z" fill="#e8d6b0" opacity=".9"/><rect x="18" y="58" width="34" height="18" fill="#fff" opacity=".85" transform="skewY(16)"/>
      <path d="M8 62 L44 74" stroke="#7a4f27" stroke-width="2"/></g>`;
  } else if (t === 'envelope') {
    const c = e.transportadora === 'Amazon' ? '#f3f1ec' : '#f2d77a';
    obj = `<g transform="translate(${55 + (k % 25)} 70) rotate(${(k % 13) - 6} 75 55)">
      <rect width="160" height="105" rx="8" fill="${c}"/><path d="M0 8 L80 58 L160 8" fill="none" stroke="#00000022" stroke-width="3"/>
      <rect x="18" y="62" width="62" height="28" rx="3" fill="#fff" stroke="#0002"/><rect x="24" y="68" width="40" height="4" fill="#333"/><rect x="24" y="76" width="30" height="3" fill="#777"/>
      ${e.transportadora === 'Amazon' ? '<path d="M100 82 q20 10 40 0" stroke="#f59e0b" stroke-width="4" fill="none"/>' : ''}</g>`;
  } else if (t === 'saco') {
    obj = `<g transform="translate(${60 + (k % 25)} 64)"><path d="M10 20 Q0 70 15 120 L150 120 Q165 70 150 18 Q80 0 10 20Z" fill="#ee4d2d"/><path d="M30 40 Q80 30 130 42" stroke="#fff6" stroke-width="5" fill="none"/>
      <rect x="45" y="62" width="70" height="34" rx="4" fill="#fff"/><rect x="52" y="70" width="44" height="4" fill="#333"/><rect x="52" y="78" width="30" height="3" fill="#888"/></g>`;
  } else {
    obj = `<g transform="translate(${80 + (k % 20)} 50)"><path d="M10 40 L120 40 L112 150 L18 150Z" fill="#c8a27a"/><path d="M40 40 Q65 0 90 40" stroke="#8a6a4a" stroke-width="6" fill="none"/>
      <circle cx="65" cy="95" r="20" fill="#ea1d2c"/><text x="65" y="101" font-size="16" text-anchor="middle" fill="#fff" font-family="system-ui" font-weight="800">i</text></g>`;
  }
  return `<svg viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient>
    <radialGradient id="${id}l" cx=".3" cy="0" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="300" height="225" fill="url(#${id})"/><rect y="180" width="300" height="45" fill="#00000055"/><rect y="178" width="300" height="4" fill="#ffffff18"/>
    <ellipse cx="150" cy="195" rx="100" ry="10" fill="#0006"/>${obj}<rect width="300" height="225" fill="url(#${id}l)"/>
    <text x="290" y="215" font-size="10" text-anchor="end" fill="#fff8" font-family="monospace">${e.codigo || ''}</text></svg>`;
}

// QR "de demonstração" (padrão visual de QR com marcadores, gerado a partir do texto)
export function qrSVG(text, size = 29) {
  let s = h(text);
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  let cells = '';
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#000"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#000"/>`;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const inF = (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
    if (!inF && rnd() < 0.5) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-1 -1 ${size + 2} ${size + 2}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${size + 2}" height="${size + 2}" fill="#fff"/><g fill="#000">${cells}</g>${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}</svg>`;
}

// Gráfico de barras com brilho
export function barChart(data, { h: H = 190, color = ['#7c3aed', '#c084fc'], avg = null, unit = '', highlightLast = false } = {}) {
  const W = 560, pad = 26, max = Math.max(...data.map((d) => d.v), avg || 0) * 1.15 || 1;
  const bw = (W - pad * 2) / data.length;
  const gid = 'bc' + Math.random().toString(36).slice(2, 7);
  let bars = '';
  data.forEach((d, i) => {
    const bh = (d.v / max) * (H - 40); const x = pad + i * bw + bw * 0.22; const y = H - 22 - bh;
    const last = highlightLast && i === data.length - 1;
    bars += `<rect x="${x}" y="${y}" width="${bw * 0.56}" height="${bh}" rx="6" fill="url(#${gid})" ${last ? 'stroke="#fff" stroke-width="1.5"' : ''} filter="url(#${gid}f)"/>`;
    bars += `<text x="${x + bw * 0.28}" y="${y - 6}" text-anchor="middle" style="fill:#d8d2ee;font-weight:600">${String(d.v).replace('.', ',')}${unit}</text>`;
    bars += `<text x="${x + bw * 0.28}" y="${H - 6}" text-anchor="middle">${d.mes}</text>`;
  });
  const avgLine = avg ? `<line x1="${pad}" x2="${W - pad}" y1="${H - 22 - (avg / max) * (H - 40)}" y2="${H - 22 - (avg / max) * (H - 40)}" stroke="#fff" stroke-dasharray="5 5" opacity=".55"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color[1]}"/><stop offset="1" stop-color="${color[0]}"/></linearGradient>
    <filter id="${gid}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${[0.25, 0.5, 0.75].map((f) => `<line x1="${pad}" x2="${W - pad}" y1="${(H - 22) * f + 8}" y2="${(H - 22) * f + 8}" stroke="#ffffff10"/>`).join('')}${bars}${avgLine}</svg>`;
}

export function donut(parts, size = 120, stroke = 16) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1; const r = (size - stroke) / 2; const c = 2 * Math.PI * r; let off = 0;
  const segs = parts.map((p) => { const len = (p.v / total) * c; const s = `<circle r="${r}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="${p.cor}" stroke-width="${stroke}" stroke-dasharray="${len - 2} ${c - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})" style="filter:drop-shadow(0 0 6px ${p.cor}88)"/>`; off += len; return s; }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${segs}</svg>`;
}

export function toast(msg, icon = 'check') {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `<span style="color:var(--acc2)">${ic(icon)}</span>${esc(msg)}`;
  el.querySelector('svg').style.cssText = 'width:16px;height:16px';
  document.getElementById('toasts').appendChild(el); setTimeout(() => el.remove(), 2800);
}

export function modal(title, body, { wide = false, onClose } = {}) {
  const root = document.getElementById('modal-root');
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><div class="modal-head"><div>${title}</div><button class="x" data-close>${ic('x')}</button></div><div class="modal-body">${body}</div></div>`;
  const close = () => { bg.remove(); onClose && onClose(); };
  bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  root.appendChild(bg);
  bg.querySelector('[data-close] svg').style.cssText = 'width:16px;height:16px';
  return { el: bg, close };
}
