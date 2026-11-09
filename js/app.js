import { CONFIG, PLANTAS, CORRETORES, STATUS_VENDA, store, brl, brlCurto, dataBR, horaBR, haQuanto, diasEntre, HOJE, MESES, addDias,
  calcAtraso, cotaAtrasada, encPortaria, chamadosAbertos, chamadoForaPrazo, unidadeLabel, unidadeCurta } from './data.js';
import { ic, esc, fotoEncomenda, qrSVG, barChart, donut, toast, modal } from './ui.js';
import { createMirror } from './building3d.js';
import { createPlan3D, plantaSVG } from './plan3d.js';
import { openResidentApp } from './resident.js';

const D = () => store.d;
const U = (id) => D().units.find((u) => u.id === id);
const R = (id) => D().residentes[id];
const corretor = (id) => CORRETORES.find((c) => c.id === id);
const cliente = (id) => D().clientes.find((c) => c.id === id);
const area = (v) => v.toLocaleString('pt-BR') + ' m²';
const mesAtual = MESES[HOJE.getMonth()];
const ord = (n) => n + 'º';

// ---------------- navegação ----------------
const NAV = [
  { g: 'Vendas' },
  { id: 'espelho', label: 'Espelho 3D', icon: 'cube' },
  { id: 'geral', label: 'Visão geral', icon: 'grid' },
  { id: 'unidades', label: 'Unidades', icon: 'building' },
  { id: 'clientes', label: 'Clientes', icon: 'users' },
  { id: 'propostas', label: 'Propostas', icon: 'file' },
  { g: 'Condomínio' },
  { id: 'portaria', label: 'Portaria', icon: 'box', badge: () => allResidents().reduce((a, r) => a + encPortaria(r).length, 0) },
  { id: 'chamados', label: 'Chamados', icon: 'wrench', badge: () => allResidents().reduce((a, r) => a + chamadosAbertos(r).length, 0), red: true },
  { id: 'financeiro', label: 'Financeiro', icon: 'wallet' },
  { id: 'reservas', label: 'Reservas', icon: 'calendar' },
  { id: 'comunicados', label: 'Comunicados', icon: 'megaphone' },
  { id: 'moradores', label: 'Moradores', icon: 'home' },
  { g: 'Morador' },
  { id: 'app', label: 'App do morador', icon: 'phone' },
];
const BOTTOM = [['espelho', 'Espelho 3D', 'cube'], ['geral', 'Geral', 'grid'], ['unidades', 'Unidades', 'building'], ['clientes', 'Clientes', 'users'], ['mais', 'Mais', 'menu']];
const allResidents = () => Object.values(D().residentes);

function renderNav(route) {
  const sb = document.getElementById('sidebar');
  sb.innerHTML = `<div class="brand"><div class="logo">${ic('building')}</div><div><b>${esc(CONFIG.condominio)}</b><small>CRM · Espelho 3D</small></div></div>` +
    NAV.map((n) => n.g ? `<div class="nav-group">${n.g}</div>` : (() => { const b = n.badge ? n.badge() : 0; return `<button class="nav-item ${route === n.id ? 'on' : ''}" data-go="${n.id}">${ic(n.icon)}${n.label}${b ? `<span class="badge ${n.red ? 'red' : ''}">${b}</span>` : ''}</button>`; })()).join('') +
    `<div class="side-foot"><div class="avatar">PC</div><div style="flex:1;min-width:0"><b style="font-size:13px">Paulo Costa</b><div class="mut" style="font-size:11px">Gestor · ${esc(CONFIG.incorporadora)}</div></div><button class="x" title="Restaurar dados de demonstração" data-act="reset">${ic('refresh')}</button></div>`;
  sb.querySelectorAll('.side-foot svg').forEach((s) => (s.style.cssText = 'width:15px;height:15px'));
  document.getElementById('bottom-nav').innerHTML = BOTTOM.map(([id, l, i]) => `<button data-go="${id}" class="${route === id || (id === 'mais' && !BOTTOM.some((b) => b[0] === route)) ? 'on' : ''}">${ic(i)}${l}</button>`).join('');
}

let route = 'espelho';
function go(r) { if (r === 'app') { openResidentApp(pickDefaultResident(), ctx); return; } if (r === 'mais') { openMore(); return; } if (location.hash === '#' + r) onRoute(); else location.hash = '#' + r; }
let pendingUnit = null;
function pickDefaultResident() { return 'A-501'; }
function onRoute() {
  const r = location.hash.replace(/^#\/?/, '').split('/')[0];
  route = VIEWS[r] || r === 'espelho' ? r : 'espelho';
  const arg = pendingUnit; pendingUnit = null;
  renderNav(route);
  const mv = document.getElementById('mirror-view'), v = document.getElementById('view');
  if (route === 'espelho') {
    v.hidden = true; mv.hidden = false; ensureMirror();
    if (arg) { M.mode = arg.startsWith('c:') ? 'condominio' : M.mode; const id = arg.replace(/^c:/, ''); selectUnit(id, true); }
    renderMirrorUI();
  } else {
    mv.hidden = true; v.hidden = false; v.scrollTop = 0;
    (VIEWS[route] || VIEWS.geral)(v);
  }
}
function rerender() { renderNav(route); if (route === 'espelho') { mirror && mirror.refresh(); renderSide(); renderStageUI(); } else (VIEWS[route] || VIEWS.geral)(document.getElementById('view')); }

function openMore() {
  const items = NAV.filter((n) => n.id && !BOTTOM.some((b) => b[0] === n.id));
  const m = modal('<b>Menu</b>', `<div class="list">${items.map((n) => `<div class="li click" data-go="${n.id}" data-close>${ic(n.icon)}<div class="grow"><b>${n.label}</b></div>${ic('chev')}</div>`).join('')}
    <div class="li click" data-act="reset" data-close>${ic('refresh')}<div class="grow"><b>Restaurar dados de demonstração</b></div></div></div>`);
  m.el.querySelectorAll('.li svg').forEach((s) => (s.style.cssText = 'width:18px;height:18px;color:var(--acc2)'));
}

// ---------------- ESPELHO 3D ----------------
const M = { mode: 'vendas', sub: 'encomendas', torre: 'todas', planta: 'todas', sel: null };
let mirror = null;

function ensureMirror() {
  if (mirror) return;
  const mv = document.getElementById('mirror-view');
  mv.innerHTML = `<div class="stage"><div class="stage-3d" id="stage3d"></div><div class="stage-top" id="stage-top"></div>
    <div class="stage-tools" id="stage-tools"></div><div class="stage-bottom" id="stage-bottom"></div></div><aside class="side" id="side"></aside>`;
  mirror = createMirror(document.getElementById('stage3d'), {
    getUnitVisual, getMarkers,
    onSelect: (id) => selectUnit(id),
    onHover: showTip,
  });
  renderTools();
}

function getUnitVisual(id) {
  const u = U(id);
  const filtered = (M.torre !== 'todas' && u.torre !== M.torre) || (M.planta !== 'todas' && u.planta !== M.planta);
  if (M.mode === 'vendas') return { color: STATUS_VENDA[u.status].cor, intensity: u.status === 'bloqueado' ? 0.5 : 1.15, dim: filtered };
  const r = R(id);
  if (!r) return { color: u.status === 'vendido' ? '#5b5870' : '#22203a', intensity: 0.35, dim: filtered };
  if (M.sub === 'encomendas') { const n = encPortaria(r).length; return n === 0 ? { color: '#ffcf8a', intensity: 0.55, dim: filtered } : { color: n === 1 ? '#22d3ee' : '#a855f7', intensity: 1.4, dim: filtered }; }
  if (M.sub === 'chamados') { const ab = chamadosAbertos(r); if (!ab.length) return { color: '#ffcf8a', intensity: 0.55, dim: filtered }; const late = ab.some(chamadoForaPrazo); return { color: late ? '#ef4444' : '#f5b20b', intensity: 1.4, pulse: late, dim: filtered }; }
  const at = cotaAtrasada(r);
  return at ? { color: '#ef4444', intensity: 1.5, pulse: true, dim: filtered } : { color: '#22c55e', intensity: 0.8, dim: filtered };
}

function getMarkers() {
  if (M.mode !== 'condominio') return [];
  const out = [];
  for (const r of allResidents()) {
    const u = U(r.id);
    if ((M.torre !== 'todas' && u.torre !== M.torre)) continue;
    if (M.sub === 'encomendas') { const n = encPortaria(r).length; if (n) out.push({ id: r.id, cls: n > 1 ? 'enc2' : 'enc', html: `<i>${ic('box')}</i>${unidadeCurta(r.id)}`, title: `${n} encomenda(s)` }); }
    else if (M.sub === 'chamados') { const ab = chamadosAbertos(r); if (ab.length) out.push({ id: r.id, cls: ab.some(chamadoForaPrazo) ? 'chx' : 'ch', html: `<i>${ic('wrench')}</i>${unidadeCurta(r.id)}` }); }
    else { const at = cotaAtrasada(r); if (at) out.push({ id: r.id, cls: 'fin', html: `<i>${ic('wallet')}</i>${calcAtraso(at).dias}d` }); }
  }
  return out;
}

const tipEl = () => document.getElementById('tip');
function showTip(id, e) {
  const t = tipEl();
  if (!id || !e || matchMedia('(hover: none)').matches) { t.hidden = true; return; }
  const u = U(id), r = R(id), p = PLANTAS[u.planta];
  let rows;
  if (M.mode === 'vendas') rows = `<div class="row"><span>${p.nome}</span><span>${area(u.area)}</span></div><div class="row"><span>Valor</span><span>${brl(u.preco, 0)}</span></div><div class="row"><span>Situação</span><span style="color:${STATUS_VENDA[u.status].cor}">${STATUS_VENDA[u.status].label}</span></div>`;
  else if (r) { const at = cotaAtrasada(r); rows = `<div class="row"><span>Morador</span><span>${esc(r.nome)}</span></div><div class="row"><span>Na portaria</span><span>${encPortaria(r).length}</span></div><div class="row"><span>Chamados</span><span>${chamadosAbertos(r).length}</span></div><div class="row"><span>Condomínio</span><span style="color:${at ? 'var(--bad)' : 'var(--ok)'}">${at ? calcAtraso(at).dias + ' dias de atraso' : 'em dia'}</span></div>`; }
  else rows = `<div class="row"><span>${u.status === 'vendido' ? 'Sem morador' : 'À venda'}</span><span></span></div>`;
  t.innerHTML = `<b>${unidadeLabel(id)}</b><div class="mut" style="font-size:11px">${ord(u.andar)} andar · ${u.posicao}</div>${rows}`;
  t.hidden = false;
  const x = Math.min(innerWidth - t.offsetWidth - 10, e.clientX + 16), y = Math.min(innerHeight - t.offsetHeight - 10, e.clientY + 14);
  t.style.left = x + 'px'; t.style.top = y + 'px';
}

function selectUnit(id, focus = false) {
  M.sel = id || null;
  mirror && mirror.select(M.sel);
  if (focus && id) mirror.focusUnit(id);
  renderSide();
  if (id && matchMedia('(max-width: 820px)').matches) setTimeout(() => document.getElementById('side')?.scrollIntoView({ behavior: 'smooth' }), 120);
}

function renderMirrorUI() { renderStageUI(); renderSide(); mirror && mirror.refresh(); }

function renderTools() {
  const el = document.getElementById('stage-tools');
  const L = mirror.lighting;
  el.innerHTML = `<button data-act="m-zoom" data-f="0.8" title="Aproximar">${ic('plus')}</button><button data-act="m-zoom" data-f="1.25" title="Afastar">${ic('minus')}</button>
    <button data-act="m-reset" title="Centralizar">${ic('target')}</button><button data-act="m-rotate" title="Girar">${ic('rotate')}</button>
    <hr style="border:0;border-top:1px solid var(--line2);margin:2px 4px">
    <button data-act="m-light" data-l="dia" class="${L === 'dia' ? 'on' : ''}" title="Dia">${ic('sun')}</button>
    <button data-act="m-light" data-l="entardecer" class="${L === 'entardecer' ? 'on' : ''}" title="Entardecer">${ic('sunset')}</button>
    <button data-act="m-light" data-l="noite" class="${L === 'noite' ? 'on' : ''}" title="Noite">${ic('moon')}</button>`;
}

function renderStageUI() {
  const top = document.getElementById('stage-top'); if (!top) return;
  const torres = CONFIG.torres.length > 1 ? `<select class="select" data-change="m-torre"><option value="todas">Todas as torres</option>${CONFIG.torres.map((t) => `<option value="${t.id}" ${M.torre === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}</select>` : '';
  top.innerHTML = `<div class="l"><div class="seg"><button class="${M.mode === 'vendas' ? 'on' : ''}" data-act="m-mode" data-m="vendas">${ic('chart')}Vendas</button><button class="${M.mode === 'condominio' ? 'on' : ''}" data-act="m-mode" data-m="condominio">${ic('building')}Condomínio</button></div>
    ${M.mode === 'condominio' ? `<div class="seg sub"><button class="${M.sub === 'encomendas' ? 'on' : ''}" data-act="m-sub" data-s="encomendas">${ic('box')}Encomendas</button><button class="${M.sub === 'chamados' ? 'on' : ''}" data-act="m-sub" data-s="chamados">${ic('wrench')}Chamados</button><button class="${M.sub === 'financeiro' ? 'on' : ''}" data-act="m-sub" data-s="financeiro">${ic('wallet')}Financeiro</button></div>` : ''}</div>
    <div class="r">${torres}${M.mode === 'vendas' ? `<select class="select" data-change="m-planta"><option value="todas">Todas as plantas</option>${Object.values(PLANTAS).map((p) => `<option value="${p.id}" ${M.planta === p.id ? 'selected' : ''}>${p.nome} · ${p.area} m²</option>`).join('')}</select>` : ''}</div>`;
  const bottom = document.getElementById('stage-bottom');
  const us = D().units.filter((u) => M.torre === 'todas' || u.torre === M.torre);
  let leg;
  if (M.mode === 'vendas') leg = Object.entries(STATUS_VENDA).map(([k, s]) => `<span><i class="dot" style="background:${s.cor};color:${s.cor}"></i>${s.label} <b>${us.filter((u) => u.status === k).length}</b></span>`).join('');
  else {
    const rs = us.map((u) => R(u.id)).filter(Boolean); const sem = us.length - rs.length;
    if (M.sub === 'encomendas') { const c = (f) => rs.filter((r) => f(encPortaria(r).length)).length; leg = `<span><i class="dot" style="background:#22d3ee;color:#22d3ee"></i>1 encomenda <b>${c((n) => n === 1)}</b></span><span><i class="dot" style="background:#a855f7;color:#a855f7"></i>2 ou mais <b>${c((n) => n > 1)}</b></span><span><i class="dot" style="background:#ffcf8a;color:#ffcf8a"></i>Nada na portaria <b>${c((n) => n === 0)}</b></span><span><i class="dot" style="background:#3a3848"></i>Sem morador <b>${sem}</b></span>`; }
    else if (M.sub === 'chamados') { const late = rs.filter((r) => chamadosAbertos(r).some(chamadoForaPrazo)).length; const open = rs.filter((r) => chamadosAbertos(r).length).length; leg = `<span><i class="dot" style="background:#f5b20b;color:#f5b20b"></i>No prazo <b>${open - late}</b></span><span><i class="dot" style="background:#ef4444;color:#ef4444"></i>Fora do prazo <b>${late}</b></span><span><i class="dot" style="background:#ffcf8a;color:#ffcf8a"></i>Sem chamados <b>${rs.length - open}</b></span><span><i class="dot" style="background:#3a3848"></i>Sem morador <b>${sem}</b></span>`; }
    else { const at = rs.filter((r) => cotaAtrasada(r)).length; leg = `<span><i class="dot" style="background:#22c55e;color:#22c55e"></i>Em dia <b>${rs.length - at}</b></span><span><i class="dot" style="background:#ef4444;color:#ef4444"></i>Em atraso <b>${at}</b></span><span><i class="dot" style="background:#3a3848"></i>Sem morador <b>${sem}</b></span>`; }
  }
  bottom.innerHTML = `<div class="stage-legend">${leg}</div><div class="stage-hint">${M.mode === 'vendas' ? 'Clique em um apartamento para ver a planta, o preço e gerar proposta.' : 'Clique em um apartamento para abrir a ficha do morador.'}</div><div class="stage-credit">Modelo 3D das torres gerado em código · ${CONFIG.torres.length} torre(s), ${D().units.length} unidades</div>`;
}

function stackBar(units) {
  const tot = units.length || 1;
  return `<div class="stack">${Object.entries(STATUS_VENDA).map(([k, s]) => { const n = units.filter((u) => u.status === k).length; return n ? `<i style="width:${n / tot * 100}%;background:${s.cor};color:${s.cor}" title="${s.label}: ${n}"></i>` : ''; }).join('')}</div>`;
}

function espelhoGrid() {
  return CONFIG.torres.filter((t) => M.torre === 'todas' || M.torre === t.id).map((t) => {
    let rows = '';
    for (let f = t.andares; f >= 1; f--) {
      rows += `<div class="fl" style="--n:${t.aptosPorAndar}"><span>${f}º</span>${Array.from({ length: t.aptosPorAndar }, (_, i) => { const u = U(`${t.id}-${f * 100 + i + 1}`); return `<button style="background:${STATUS_VENDA[u.status].cor}" class="${M.sel === u.id ? 'sel' : ''}" data-act="m-pick" data-id="${u.id}" title="${unidadeLabel(u.id)} · ${STATUS_VENDA[u.status].label}">${u.numero}</button>`; }).join('')}</div>`;
    }
    return `${CONFIG.torres.length > 1 ? `<div class="tw">${t.nome}</div>` : ''}<div class="espelho-grid">${rows}</div>`;
  }).join('');
}

function renderSide() {
  const side = document.getElementById('side'); if (!side) return;
  side.innerHTML = M.mode === 'vendas' ? (M.sel ? sideUnidade(U(M.sel)) : sideVendas()) : (M.sel ? sideMorador(U(M.sel)) : sideCondominio());
  side.scrollTop = 0;
}

function sideVendas() {
  const us = D().units; const vend = us.filter((u) => u.status === 'vendido');
  const vgv = us.reduce((a, u) => a + u.preco, 0), vgvV = vend.reduce((a, u) => a + (u.valorVenda || u.preco), 0);
  const fam = Object.keys(D().residentes).length;
  return `<div><div class="eyebrow">Empreendimento · entregue em ${CONFIG.entrega}</div><h3>${esc(CONFIG.condominio)}</h3><div class="mut" style="font-size:12.5px;margin-top:2px">${esc(CONFIG.endereco)} · pronto para morar</div>
    <div style="margin-top:10px"><span class="pill acc">${ic('users')} ${fam} famílias morando</span></div></div>
    <div class="mini-kpis"><div class="mini"><div class="lbl">VGV</div><div class="val">${brlCurto(vgv)}</div><div class="foot">${us.length} unidades</div></div>
    <div class="mini"><div class="lbl">Vendido</div><div class="val">${brlCurto(vgvV)}</div><div class="foot">${Math.round(vgvV / vgv * 100)}% do VGV</div></div>
    <div class="mini"><div class="lbl">À venda</div><div class="val">${us.filter((u) => u.status === 'disponivel').length}</div><div class="foot">de ${us.length}</div></div></div>
    <div class="card"><div class="card-head"><div class="h2">Espelho de vendas</div><span class="mut" style="font-size:11.5px">tabela de ${mesAtual}</span></div>${stackBar(us)}<div style="margin-top:12px">${espelhoGrid()}</div>
    <div class="legend">${Object.values(STATUS_VENDA).map((s) => `<span><i class="dot" style="background:${s.cor}"></i>${s.label}</span>`).join('')}</div></div>
    <div class="mut" style="font-size:12px">${ic('cube')} Clique em um apartamento no prédio ou no espelho para ver os detalhes.</div>`.replace(/<svg class="" /, '<svg style="width:13px;height:13px;vertical-align:-2px" ');
}

function sideUnidade(u) {
  const p = PLANTAS[u.planta]; const st = STATUS_VENDA[u.status];
  const cl = u.clienteId ? cliente(u.clienteId) : null; const r = R(u.id);
  const t = CONFIG.torres.find((x) => x.id === u.torre);
  let extra = '';
  if (u.status === 'vendido') extra = `<div class="card"><div class="h2" style="margin-bottom:8px">Venda</div><div class="list">
      <div class="li"><div class="grow"><small>Comprador</small><b>${esc(r?.nome || u.proprietario || '—')}</b></div><button class="btn sm" data-act="m-ver-morador" data-id="${u.id}">${ic('home')}Ver morador</button></div>
      <div class="li"><div class="grow"><small>Corretor</small><b>${esc(corretor(u.corretorId)?.nome || '—')}</b></div><div style="text-align:right"><small class="mut">Valor</small><b style="display:block">${brl(u.valorVenda || u.preco, 0)}</b></div></div>
      <div class="li"><div class="grow"><small>Data da venda</small><b>${u.dataVenda ? dataBR(u.dataVenda, { year: 'numeric' }) : '—'}</b></div></div></div></div>`;
  if (u.status === 'reservado' && cl) extra = `<div class="card"><div class="h2" style="margin-bottom:8px">Reserva</div><div class="li"><div class="avatar">${cl.nome.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div><div class="grow"><b>${esc(cl.nome)}</b><small>até ${dataBR(u.reservaAte)} · ${esc(corretor(cl.corretorId)?.nome)}</small></div><button class="btn sm" data-act="wa" data-tel="${cl.telefone}" data-msg="Olá ${esc(cl.nome.split(' ')[0])}! Sua reserva do ${unidadeLabel(u.id)} está garantida até ${dataBR(u.reservaAte)}.">${ic('wa')}</button></div>
    <div class="btn-row" style="margin-top:10px"><button class="btn sm" data-act="cancelar-reserva" data-id="${u.id}">Cancelar reserva</button><button class="btn sm green" data-act="vender" data-id="${u.id}">${ic('check')}Confirmar venda</button></div></div>`;
  return `<button class="back" data-act="m-back">${ic('back')} Voltar ao espelho</button>
    <div><div class="eyebrow">${CONFIG.torres.length > 1 ? t.nome + ' · ' : ''}${ord(u.andar)} andar · ${u.posicao}</div>
    <div style="display:flex;align-items:center;gap:10px;justify-content:space-between"><h3>Apto ${u.numero}</h3><span class="pill" style="background:${st.cor}22;color:${st.cor}"><i class="dot" style="background:${st.cor}"></i>${st.label}</span></div>
    <div class="mut" style="font-size:12.5px">${p.nome} · ${area(p.area)} · ${p.vagas} vaga(s)</div></div>
    <div><div class="price">${brl(u.preco, 0)}</div><div class="mut mono" style="font-size:11.5px">${brl(Math.round(u.preco / u.area), 0)}/m² · tabela de ${mesAtual}</div></div>
    <div class="planta-box" data-act="planta3d" data-id="${u.id}">${plantaSVG(p)}<button class="btn sm pri open3d">${ic('cube')}Ver planta em 3D</button></div>
    <div class="specs"><div><b>${p.quartos}</b><small>Quartos</small></div><div><b>${p.suites}</b><small>Suítes</small></div><div><b>${p.vagas}</b><small>Vagas</small></div><div><b>${p.area}</b><small>m²</small></div></div>
    ${u.status === 'disponivel' ? `<button class="btn pri block" data-act="proposta" data-id="${u.id}">${ic('file')}Gerar proposta</button><button class="btn block" data-act="reservar" data-id="${u.id}">${ic('clock')}Reservar</button>` : ''}
    ${u.status === 'bloqueado' ? `<div class="card mut" style="font-size:12.5px">Unidade bloqueada pela incorporadora (permuta / uso interno).</div><button class="btn block" data-act="desbloquear" data-id="${u.id}">Liberar para venda</button>` : ''}
    ${extra}`;
}

function condStats() {
  const rs = allResidents();
  const enc = rs.flatMap(encPortaria); const antigas = enc.filter((e) => diasEntre(e.chegou) >= 3).length;
  const ch = rs.flatMap(chamadosAbertos); const late = ch.filter(chamadoForaPrazo).length;
  const atr = rs.filter((r) => cotaAtrasada(r));
  const res = D().reservas.filter((r) => new Date(r.data) >= addDias(HOJE, -1)).length;
  return { rs, enc, antigas, ch, late, atr, inad: atr.length / rs.length * 100, res };
}

function sideCondominio() {
  const s = condStats();
  const pend = s.rs.map((r) => ({ r, e: encPortaria(r).length, c: chamadosAbertos(r), a: cotaAtrasada(r) })).filter((x) => x.e || x.c.length || x.a)
    .sort((a, b) => (b.a ? 3 : 0) + b.c.length * 2 + b.e - ((a.a ? 3 : 0) + a.c.length * 2 + a.e));
  return `<div><div class="eyebrow">Condomínio · entregue em ${CONFIG.entrega}</div><h3>${esc(CONFIG.condominio)}</h3><div class="mut" style="font-size:12.5px;margin-top:2px">Síndica ${esc(CONFIG.sindico)} · ${s.rs.length} unidades com morador</div></div>
    <div class="mini-kpis two">
      <div class="mini cyan"><div class="lbl">${ic('box')}Na portaria</div><div class="val">${s.enc.length}</div><div class="foot">${s.antigas} há +3 dias</div></div>
      <div class="mini amber"><div class="lbl">${ic('wrench')}Chamados abertos</div><div class="val">${s.ch.length}</div><div class="foot">${s.late} fora do prazo</div></div>
      <div class="mini red"><div class="lbl">${ic('wallet')}Inadimplência</div><div class="val">${s.inad.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</div><div class="foot">${s.atr.length} unidades</div></div>
      <div class="mini"><div class="lbl">${ic('calendar')}Reservas</div><div class="val">${s.res}</div><div class="foot">próximos 7 dias</div></div></div>
    <div class="card"><div class="card-head"><div class="h2">Pendências por apartamento</div><span class="mut" style="font-size:11.5px">${pend.length}</span></div><div class="list">
    ${pend.slice(0, 14).map(({ r, e, c, a }) => `<div class="li click" data-act="m-pick" data-id="${r.id}"><div class="avatar" style="width:30px;height:30px;font-size:11px">${r.iniciais}</div><div class="grow"><b>${unidadeCurta(r.id)} · ${esc(r.nome)}</b><small>${[e ? `${e} na portaria` : '', c.length ? `${c.length} chamado${c.some(chamadoForaPrazo) ? ' (fora do prazo)' : ''}` : '', a ? `${calcAtraso(a).dias} dias de atraso` : ''].filter(Boolean).join(' · ')}</small></div>${a ? '<span class="pill bad">atraso</span>' : c.length ? '<span class="pill warn">chamado</span>' : '<span class="pill cyan">portaria</span>'}</div>`).join('')}</div></div>`.replace(/<svg class="" /g, '<svg style="width:12px;height:12px" ');
}

function sideMorador(u) {
  const r = R(u.id); const p = PLANTAS[u.planta];
  const back = `<button class="back" data-act="m-back">${ic('back')} Voltar ao condomínio</button>`;
  if (!r) return `${back}<div><div class="eyebrow">${ord(u.andar)} andar · ${u.posicao}</div><h3>Apto ${u.numero}</h3></div>
    <div class="card">${u.status === 'vendido' ? `<b>Sem morador</b><p class="mut" style="font-size:12.5px">Vendido para ${esc(u.proprietario || '—')}. Ainda não se mudou.</p>` : `<b>Unidade à venda</b><p class="mut" style="font-size:12.5px">${p.nome} · ${area(p.area)} · ${brl(u.preco, 0)}</p><button class="btn pri sm" data-act="m-ver-venda" data-id="${u.id}">${ic('chart')}Ver no modo Vendas</button>`}</div>`;
  const enc = encPortaria(r); const ch = chamadosAbertos(r); const at = cotaAtrasada(r); const atx = at ? calcAtraso(at) : null;
  const ret = r.encomendas.filter((e) => e.status === 'retirada');
  const ultA = r.consumo.agua.at(-1), ultG = r.consumo.gas.at(-1);
  return `${back}
  <div><div class="eyebrow">${CONFIG.torres.length > 1 ? 'Torre ' + u.torre + ' · ' : ''}${ord(u.andar)} andar · ${u.posicao} · desde ${r.desde}</div>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3>Apto ${u.numero}</h3><span class="pill acc">${r.tipo}</span></div>
  <div class="mut" style="font-size:12.5px">${p.nome} · ${area(p.area)} · ${enc.length} encomenda(s) na portaria</div></div>
  <div class="card"><div style="display:flex;gap:12px;align-items:center"><div class="avatar lg">${r.iniciais}</div><div><div class="mut" style="font-size:11px">mora desde ${r.desde}</div><b style="font-size:16px">${esc(r.nome)}</b><div class="mut" style="font-size:12px">${r.moradores} moradores · ${r.pets} pet${r.pets === 1 ? '' : 's'} · vaga ${r.vaga}</div></div></div>
    <div class="contact"><span>${ic('call')} ${r.telefone}</span><span>${ic('mail')} ${r.email}</span></div>
    <div class="btn-row"><button class="btn wa" data-act="wa" data-tel="${r.telefone}" data-msg="Olá ${esc(r.nome.split(' ')[0])}, aqui é da administração do ${esc(CONFIG.condominio)}.">${ic('wa')}WhatsApp</button><button class="btn" data-act="m-focus" data-id="${u.id}">${ic('building')}Ver no prédio</button></div></div>
  <div class="mini-kpis"><div class="mini cyan"><div class="lbl">Portaria</div><div class="val">${enc.length}</div><div class="foot">${enc[0] ? enc[0].local.replace('Portaria · ', '') : 'nada'}</div></div>
    <div class="mini amber"><div class="lbl">Chamados</div><div class="val">${ch.length}</div><div class="foot">${ch.some(chamadoForaPrazo) ? 'fora do prazo' : ch.length ? 'no prazo' : '—'}</div></div>
    <div class="mini ${at ? 'red' : ''}"><div class="lbl">${at ? 'Em atraso' : 'Condomínio'}</div><div class="val" style="font-size:${at ? 14 : 17}px">${at ? brl(atx.total) : 'Em dia'}</div><div class="foot">${at ? atx.dias + ' dias' : 'sem pendências'}</div></div></div>
  <div class="li click card" style="padding:12px" data-act="app-morador" data-id="${u.id}"><span style="color:var(--acc2)">${ic('phone')}</span><div class="grow"><b>Ver o app do morador</b><small>O que ${esc(r.nome.split(' ')[0])} vê no celular: encomendas com QR, boletos e avisos</small></div>${ic('chev')}</div>
  <div class="card"><div class="card-head"><div class="h2">Encomendas na portaria <small>${enc.length}</small></div></div>
    ${enc.length ? enc.map((e) => `<div class="li"><div class="foto sm">${fotoEncomenda(e)}</div><div class="grow"><b>${esc(e.transportadora)}</b><small>${esc(e.descricao)}<br>Chegou ${haQuanto(e.chegou)} · ${esc(e.codigo)} · ${esc(e.local.replace('Portaria · ', ''))}</small></div></div>
      <div class="btn-row" style="margin:-2px 0 8px"><button class="btn sm green" data-act="entregar" data-id="${e.id}" data-u="${u.id}">${ic('check')}Entregar</button><button class="btn sm wa" data-act="avisar" data-id="${e.id}" data-u="${u.id}">${ic('wa')}${e.avisado ? 'Avisar de novo' : 'Avisar no WhatsApp'}</button></div>`).join('') : '<div class="mut" style="font-size:12.5px">Nada na portaria.</div>'}
    ${ret.length ? `<div class="mut" style="font-size:11.5px;margin-top:6px">Retiradas recentemente: ${ret.slice(0, 2).map((e) => `${esc(e.transportadora)} (${dataBR(e.retiradaEm)}, ${esc(e.retiradaPor)})`).join(' · ')}</div>` : ''}</div>
  <div class="card"><div class="card-head"><div class="h2">Contas de ${at ? at.mes : mesAtual}</div><button class="btn sm" data-act="cotas" data-id="${u.id}">Cotações</button></div>
    ${at ? `<div class="alert"><div style="font-size:12px;color:#fecaca;display:flex;gap:6px;align-items:center">${ic('alert')} Cota de ${at.mes} em atraso · ${atx.dias} dias</div><div class="val">${brl(atx.total)}</div>
      <div class="mono" style="font-size:11px;color:#fecaca">${brl(at.valor)} + multa de 2% (${brl(atx.multa)}) + juros de ${atx.dias} dias (${brl(atx.juros)})</div>
      <div class="btn-row" style="margin-top:10px"><button class="btn sm pri" data-act="pix" data-id="${u.id}">${ic('pix')}2ª via com Pix</button><button class="btn sm" data-act="pagar" data-id="${u.id}">${ic('check')}Marcar pago</button></div>
      <button class="btn sm wa" style="margin-top:8px;width:100%;justify-content:center" data-act="cobrar" data-id="${u.id}">${ic('wa')}Cobrar no WhatsApp</button></div>` : `<div class="pill ok">${ic('check')} Tudo em dia</div>`}
    <div class="mini-kpis" style="margin-top:10px"><div class="mini"><div class="lbl">${ic('drop')}Água</div><div class="val" style="font-size:14px">${brl(ultA.v * r.consumo.tarifaAgua)}</div><div class="foot">${String(ultA.v).replace('.', ',')} m³ · média ${String(r.consumo.mediaAgua).replace('.', ',')}</div></div>
    <div class="mini"><div class="lbl">${ic('flame')}Gás</div><div class="val" style="font-size:14px">${brl(ultG.v * r.consumo.tarifaGas)}</div><div class="foot">${String(ultG.v).replace('.', ',')} m³ · média ${String(r.consumo.mediaGas).replace('.', ',')}</div></div>
    <div class="mini"><div class="lbl">${ic('wallet')}Cota</div><div class="val" style="font-size:14px">${brl(r.cotas[0].valor)}</div><div class="foot">vence ${dataBR(r.cotas[0].vencimento)}</div></div></div>
    <div class="list" style="margin-top:8px">${r.cotas.slice(0, 4).map((c) => `<div class="li"><div class="grow"><b>Cota de ${c.mes}</b><small>vencimento ${dataBR(c.vencimento)}</small></div><b>${brl(c.status === 'atrasado' ? calcAtraso(c).total : c.valor)}</b>${cotaPill(c)}</div>`).join('')}</div></div>
  <div class="card"><div class="card-head"><div class="h2">Chamados <small>${ch.length} em aberto</small></div><button class="btn sm" data-act="novo-chamado" data-u="${u.id}">${ic('plus')}Novo</button></div>
    ${r.chamados.length ? r.chamados.map((c) => chamadoRow(c)).join('') : '<div class="mut" style="font-size:12.5px">Nenhum chamado.</div>'}</div>
  <div class="card"><div class="h2" style="margin-bottom:12px">Histórico</div><div class="timeline">${r.historico.slice().reverse().map((h) => `<div><b>${esc(h.texto)}</b><small>${dataBR(h.data, { year: 'numeric' })}</small></div>`).join('')}</div></div>
  <button class="btn block wa" data-act="wa" data-tel="${r.telefone}" data-msg="${esc(resumoWhats(r))}">${ic('send')}Enviar resumo pronto para o WhatsApp</button>`
    .replace(/<span>(<svg class="" )/g, '<span>$1style="width:13px;height:13px;vertical-align:-2px" ').replace(/<div class="lbl">(<svg class="" )/g, '<div class="lbl">$1style="width:12px;height:12px" ');
}

function resumoWhats(r) {
  const enc = encPortaria(r), at = cotaAtrasada(r), ch = chamadosAbertos(r);
  return `Olá ${r.nome.split(' ')[0]}! Resumo do ${unidadeLabel(r.id)}:\n` + (enc.length ? `• ${enc.length} encomenda(s) na portaria (${enc.map((e) => e.transportadora).join(', ')})\n` : '') +
    (at ? `• Cota de ${at.mes} em aberto: ${brl(calcAtraso(at).total)}\n` : '') + (ch.length ? `• Chamado em andamento: ${ch[0].titulo}\n` : '') + `Qualquer dúvida, estamos à disposição. ${CONFIG.condominio}`;
}

const cotaPill = (c) => c.status === 'pago' ? '<span class="pill ok">Pago</span>' : c.status === 'atrasado' ? `<span class="pill bad">Atrasado ${calcAtraso(c).dias}d</span>` : '<span class="pill gray">A vencer</span>';

function chamadoRow(c, showUnit = false) {
  const h = Math.round((Date.now() - new Date(c.abertoEm)) / 36e5); const late = chamadoForaPrazo(c);
  const st = c.status === 'concluido' ? '<span class="pill ok">Concluído</span>' : c.status === 'andamento' ? '<span class="pill acc">Em andamento</span>' : '<span class="pill warn">Aberto</span>';
  return `<div class="li"><div class="grow"><small class="mono">${c.id} · ${esc(c.categoria)}${showUnit ? ' · ' + unidadeCurta(c.unidade) : ''}</small><b>${esc(c.titulo)}</b><small>${st} ${c.status !== 'concluido' ? (late ? `<span class="bad">fora do prazo há ${Math.max(1, h - c.prazoH)} h</span>` : `<span class="mut">prazo em ${c.prazoH - h} h</span>`) : `<span class="mut">${dataBR(c.concluidoEm || c.abertoEm)}</span>`}</small></div>
    ${c.status === 'aberto' ? `<button class="btn sm" data-act="ch-iniciar" data-id="${c.id}" data-u="${c.unidade}">Iniciar</button>` : ''}${c.status !== 'concluido' ? `<button class="btn sm green" data-act="ch-concluir" data-id="${c.id}" data-u="${c.unidade}">Concluir</button>` : ''}</div>`;
}

// ---------------- ações ----------------
const ACTIONS = {
  reset() { const m = modal('<b style="font-size:16px">Restaurar dados de demonstração?</b>', `<p class="mut">Tudo o que você alterou (entregas, pagamentos, propostas, chamados) volta ao estado inicial.</p><div class="btn-row"><button class="btn" data-close>Cancelar</button><button class="btn red" id="rst">Restaurar</button></div>`); m.el.querySelector('#rst').onclick = () => { m.close(); store.reset(); toast('Dados restaurados'); rerender(); }; },
  'm-mode'(d) { if (M.mode !== d.m) { M.sel = null; mirror.select(null); } M.mode = d.m; renderMirrorUI(); },
  'm-sub'(d) { M.sub = d.s; renderMirrorUI(); },
  'm-pick'(d) { selectUnit(d.id, true); },
  'm-back'() { selectUnit(null); mirror.reset(); },
  'm-focus'(d) { mirror.focusUnit(d.id); if (matchMedia('(max-width: 820px)').matches) document.querySelector('.stage').scrollIntoView({ behavior: 'smooth' }); },
  'm-zoom'(d) { mirror.zoom(+d.f); },
  'm-reset'() { mirror.reset(); },
  'm-rotate'(d, el) { const on = !el.classList.contains('on'); el.classList.toggle('on', on); mirror.setAutoRotate(on); },
  'm-light'(d) { mirror.setLighting(d.l); renderTools(); },
  'm-ver-morador'(d) { M.mode = 'condominio'; renderMirrorUI(); selectUnit(d.id); },
  'm-ver-venda'(d) { M.mode = 'vendas'; renderMirrorUI(); selectUnit(d.id); },
  planta3d(d) { openPlanta3D(d.id); },
  proposta(d) { openProposta(d.id); },
  reservar(d) { openReserva(d.id); },
  desbloquear(d) { U(d.id).status = 'disponivel'; save('Unidade liberada para venda'); },
  'cancelar-reserva'(d) { const u = U(d.id); u.status = 'disponivel'; u.clienteId = null; save('Reserva cancelada'); },
  vender(d) { venderUnidade(d.id); },
  wa(d) { openWhats(d.tel, d.msg); },
  entregar(d) { const r = R(d.u); const e = r.encomendas.find((x) => x.id === d.id); e.status = 'retirada'; e.retiradaEm = new Date().toISOString(); e.retiradaPor = r.nome.split(' ')[0]; save(`Encomenda ${e.codigo} entregue para o ${unidadeCurta(d.u)}`); },
  avisar(d) { const r = R(d.u); const e = r.encomendas.find((x) => x.id === d.id); e.avisado = true; store.save(); openWhats(r.telefone, `Olá ${r.nome.split(' ')[0]}! Chegou uma encomenda ${e.transportadora} para o ${unidadeLabel(d.u)}. Está em ${e.local}. Código de retirada: ${e.pin}. ${CONFIG.condominio}`); rerender(); },
  pagar(d) { const r = R(d.id); const at = cotaAtrasada(r); if (!at) return; const t = calcAtraso(at).total; at.status = 'pago'; at.pagoEm = new Date().toISOString(); at.valorPago = t; r.historico.push({ data: new Date().toISOString(), texto: `Pagou a cota de ${at.mes} (${brl(t)})` }); save('Pagamento registrado'); },
  pix(d) { openPix(d.id); },
  cobrar(d) { const r = R(d.id); const at = cotaAtrasada(r); const x = calcAtraso(at); openWhats(r.telefone, `Olá ${r.nome.split(' ')[0]}, tudo bem? Consta em aberto a cota de ${at.mes} do ${unidadeLabel(r.id)}, com ${x.dias} dias de atraso. Valor atualizado: ${brl(x.total)}. Posso te enviar a 2ª via com Pix? ${CONFIG.condominio}`); },
  cotas(d) { openCotas(d.id); },
  'ch-iniciar'(d) { const c = R(d.u).chamados.find((x) => x.id === d.id); c.status = 'andamento'; save(`Chamado ${c.id} iniciado`); },
  'ch-concluir'(d) { const c = R(d.u).chamados.find((x) => x.id === d.id); c.status = 'concluido'; c.concluidoEm = new Date().toISOString(); save(`Chamado ${c.id} concluído`); },
  'novo-chamado'(d) { openNovoChamado(d.u); },
  'app-morador'(d) { openResidentApp(d.id, ctx); },
  'copiar-prop'(d) { navigator.clipboard?.writeText(d.msg).then(() => toast('Resumo copiado'), () => toast('Não foi possível copiar')); },
  'go-unit'(d) { pendingUnit = `${d.c ? 'c:' : ''}${d.id}`; go('espelho'); },
  'prop-status'(d) { const p = D().propostas.find((x) => x.id === d.id); p.status = d.s; if (d.s === 'aprovada') venderUnidade(p.unidadeId, p.clienteId, p.valorFinal); else save('Proposta atualizada'); },
  'prop-ver'(d) { openPropostaDoc(d.id); },
  'novo-cliente'() { openNovoCliente(); },
  'lead'(d) { openLead(d.id); },
  'lead-move'(d) { const c = cliente(d.id); c.etapa = d.e; save(`${c.nome.split(' ')[0]} movido para ${ETAPAS.find((x) => x.id === d.e).label}`); },
  'nova-encomenda'() { openNovaEncomenda(); },
  'visit'(d) { const v = D().visitantes[+d.i]; v.status = d.s; if (d.s === 'no_predio') v.hora = horaBR(new Date()); save(d.s === 'saiu' ? 'Saída registrada' : 'Entrada liberada'); },
  'novo-visitante'() { openNovoVisitante(); },
  'nova-reserva'() { openNovaReserva(); },
  'reserva-status'(d) { D().reservas.find((x) => x.id === d.id).status = d.s; save('Reserva atualizada'); },
  'novo-comunicado'() { openNovoComunicado(); },
  'port-filter'(d) { portFilter = d.f; rerender(); },
};
function save(msg) { store.save(); if (msg) toast(msg); rerender(); }

function openWhats(tel, msg) {
  const n = String(tel || '').replace(/\D/g, ''); const url = `https://wa.me/${n ? '55' + n : ''}?text=${encodeURIComponent(msg || '')}`;
  const m = modal(`<b style="font-size:16px">Mensagem para o WhatsApp</b><div class="mut" style="font-size:12px">${esc(tel || 'sem telefone')}</div>`, `<textarea class="input" id="wa-msg" rows="6">${esc(msg || '')}</textarea>
    <div class="btn-row" style="margin-top:12px"><button class="btn" id="wa-copy">Copiar mensagem</button><a class="btn wa" id="wa-go" href="${url}" target="_blank" rel="noopener" style="text-decoration:none;color:#fff">${ic('wa')}Abrir no WhatsApp</a></div>`);
  const ta = m.el.querySelector('#wa-msg'); const a = m.el.querySelector('#wa-go');
  ta.addEventListener('input', () => (a.href = `https://wa.me/${n ? '55' + n : ''}?text=${encodeURIComponent(ta.value)}`));
  m.el.querySelector('#wa-copy').onclick = async () => { try { await navigator.clipboard.writeText(ta.value); toast('Mensagem copiada'); } catch { ta.select(); toast('Selecione e copie a mensagem'); } };
  a.addEventListener('click', () => setTimeout(() => m.close(), 300));
}

function venderUnidade(id, clienteId, valor) {
  const u = U(id); u.status = 'vendido'; u.dataVenda = new Date().toISOString(); u.valorVenda = valor || u.preco; u.semMorador = true;
  const c = cliente(clienteId || u.clienteId); if (c) { c.etapa = 'fechado'; u.proprietario = c.nome; u.corretorId = c.corretorId; }
  save(`${unidadeLabel(id)} vendido 🎉`);
}

// delegação de eventos
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const fn = ACTIONS[a.dataset.act]; if (fn) { e.preventDefault(); fn(a.dataset, a); }
});
document.addEventListener('change', (e) => {
  const c = e.target.closest('[data-change]'); if (!c) return;
  if (c.dataset.change === 'm-torre') { M.torre = c.value; mirror.focusTower(c.value); renderMirrorUI(); }
  if (c.dataset.change === 'm-planta') { M.planta = c.value; mirror.refresh(); }
  if (c.dataset.change === 'un-filter') { unFilter[c.name] = c.value; renderUnidadesTable(); }
});
document.addEventListener('input', (e) => { const c = e.target.closest('[data-input]'); if (!c) return; if (c.dataset.input === 'un-q') { unFilter.q = c.value; renderUnidadesTable(); } if (c.dataset.input === 'port-q') { portQ = c.value; renderPortGrid(); } });

// ---------------- modais ----------------
function openPlanta3D(id) {
  const u = U(id), p = PLANTAS[u.planta];
  let plan;
  const m = modal(`<div class="eyebrow" style="margin:0">${esc(CONFIG.condominio)} · Apto ${u.numero}</div><b style="font-size:17px">${p.nome} · ${p.area} m²</b>`,
    `<div class="plan-wrap" style="margin:-18px"><div class="plan-stage" id="plan-stage"></div><div class="plan-side">
      <div class="btn-row" style="margin-bottom:14px"><button class="btn sm" id="spin">${ic('rotate')}Parar giro</button></div>
      <div class="h2" style="margin-bottom:6px">Ambientes</div><div class="list">${p.ambientes.map((a) => `<div class="li"><div class="grow">${a.nome}</div><b class="mono">${a.area.toLocaleString('pt-BR')} m²</b></div>`).join('')}
      <div class="li"><div class="grow"><b>Área privativa</b></div><b class="mono">${p.area} m²</b></div></div>
      <div class="price" style="font-size:24px;margin-top:14px">${brl(u.preco, 0)}</div><div class="mut mono" style="font-size:11px">${brl(Math.round(u.preco / u.area), 0)}/m²</div>
      ${u.status === 'disponivel' ? `<button class="btn pri block" style="margin-top:12px" data-act="proposta" data-id="${u.id}" data-close>${ic('file')}Gerar proposta</button>` : ''}
      <div class="mut" style="font-size:11px;margin-top:12px">Arraste para girar · role para aproximar. Mobiliário ilustrativo.</div></div></div>`,
    { wide: true, onClose: () => plan && plan.dispose() });
  plan = createPlan3D(m.el.querySelector('#plan-stage'), p);
  m.el.querySelector('#spin').onclick = (e) => { const on = plan.toggleSpin(); e.currentTarget.innerHTML = `${ic('rotate')}${on ? 'Parar giro' : 'Girar'}`; };
}

function clienteOptions(sel) { return D().clientes.filter((c) => c.etapa !== 'fechado').map((c) => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.nome)} · ${esc(c.origem)}</option>`).join(''); }

function openProposta(id) {
  const u = U(id);
  const m = modal(`<b style="font-size:16px">Gerar proposta · ${unidadeLabel(id)}</b>`, `<form class="form" id="fp">
    <label>Cliente<select class="input" name="cliente">${clienteOptions(D().clientes.find((c) => c.interesse === id)?.id)}<option value="__novo">+ Novo cliente…</option></select></label>
    <label id="novo-nome" hidden>Nome do novo cliente<input class="input" name="nome" placeholder="Nome completo"></label>
    <div class="two"><label>Valor de tabela<input class="input" value="${brl(u.preco, 0)}" disabled></label><label>Desconto (%)<input class="input" type="number" name="desc" value="3" min="0" max="15" step="0.5"></label></div>
    <div class="two"><label>Entrada (%)<input class="input" type="number" name="entrada" value="20" min="0" max="100"></label><label>Parcelas<input class="input" type="number" name="parc" value="60" min="1" max="240"></label></div>
    <label>Corretor<select class="input" name="corretor">${CORRETORES.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('')}</select></label>
    <div class="card" style="padding:12px" id="resumo"></div>
    <button class="btn pri block">${ic('file')}Salvar proposta</button></form>`);
  const f = m.el.querySelector('#fp');
  const calc = () => { const d = +f.desc.value || 0; const vf = Math.round(u.preco * (1 - d / 100)); const ent = vf * (+f.entrada.value || 0) / 100; const parc = (vf - ent) / (+f.parc.value || 1);
    m.el.querySelector('#resumo').innerHTML = `<div class="mut" style="font-size:12px">Valor final</div><div class="price" style="font-size:24px">${brl(vf, 0)}</div><div class="mono mut" style="font-size:11.5px">Entrada ${brl(ent, 0)} + ${f.parc.value}x de ${brl(parc)}</div>`; return vf; };
  f.addEventListener('input', calc); calc();
  f.cliente.addEventListener('change', () => (m.el.querySelector('#novo-nome').hidden = f.cliente.value !== '__novo'));
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    let cid = f.cliente.value;
    if (cid === '__novo') { if (!f.nome.value.trim()) return f.nome.focus(); cid = 'cl' + Date.now(); D().clientes.push({ id: cid, nome: f.nome.value.trim(), telefone: '', origem: 'Plantão', etapa: 'proposta', corretorId: f.corretor.value, interesse: id, criado: new Date().toISOString(), orcamento: u.preco, temperatura: 'quente' }); }
    const c = cliente(cid); c.etapa = 'proposta'; c.interesse = id;
    const num = 'PR-' + (412 + D().propostas.length);
    D().propostas.unshift({ id: num, clienteId: cid, unidadeId: id, valorTabela: u.preco, desconto: +f.desc.value, valorFinal: calc(), status: 'enviada', data: new Date().toISOString(), corretorId: f.corretor.value, entrada: +f.entrada.value, parcelas: +f.parc.value });
    m.close(); save(`Proposta ${num} criada para ${c.nome.split(' ')[0]}`); openPropostaDoc(num);
  });
}

function openPropostaDoc(pid) {
  const p = D().propostas.find((x) => x.id === pid); const u = U(p.unidadeId); const c = cliente(p.clienteId); const pl = PLANTAS[u.planta];
  const ent = p.valorFinal * p.entrada / 100;
  const msg = `Olá ${c.nome.split(' ')[0]}! Segue a proposta ${p.id} do ${unidadeLabel(u.id)} (${pl.nome}, ${pl.area} m²) no ${CONFIG.condominio}: valor ${brl(p.valorFinal, 0)} com ${p.desconto}% de desconto, entrada de ${brl(ent, 0)} + ${p.parcelas}x de ${brl((p.valorFinal - ent) / p.parcelas)}.`;
  modal(`<b style="font-size:16px">Proposta ${p.id}</b>`, `<div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
    <div><div class="eyebrow">Cliente</div><b style="font-size:16px">${esc(c.nome)}</b><div class="mut" style="font-size:12px">${esc(corretor(p.corretorId)?.nome || '')} · ${dataBR(p.data, { year: 'numeric' })}</div>
    <div class="eyebrow" style="margin-top:14px">Unidade</div><b>${unidadeLabel(u.id)}</b><div class="mut" style="font-size:12px">${pl.nome} · ${pl.area} m² · ${ord(u.andar)} andar · ${u.posicao}</div>
    <div class="list" style="margin-top:10px"><div class="li"><div class="grow">Tabela</div><span class="mono">${brl(p.valorTabela, 0)}</span></div><div class="li"><div class="grow">Desconto</div><span class="mono">${p.desconto}%</span></div>
    <div class="li"><div class="grow">Entrada (${p.entrada}%)</div><span class="mono">${brl(ent, 0)}</span></div><div class="li"><div class="grow">Saldo</div><span class="mono">${p.parcelas}x ${brl((p.valorFinal - ent) / p.parcelas)}</span></div></div>
    <div class="price" style="margin-top:8px">${brl(p.valorFinal, 0)}</div></div>
    <div class="planta-box" style="cursor:default">${plantaSVG(pl, { labels: true })}</div></div>
    <div class="btn-row" style="margin-top:16px"><button class="btn" data-act="copiar-prop" data-msg="${esc(msg)}">Copiar resumo</button><button class="btn wa" data-act="wa" data-tel="${c.telefone}" data-msg="${esc(msg)}">${ic('wa')}Enviar no WhatsApp</button></div>`, { wide: false });
}

function openReserva(id) {
  const m = modal(`<b style="font-size:16px">Reservar ${unidadeLabel(id)}</b>`, `<form class="form" id="fr"><label>Cliente<select class="input" name="cliente">${clienteOptions()}</select></label>
    <label>Reservar por (dias)<input class="input" type="number" name="dias" value="3" min="1" max="15"></label><button class="btn pri block">${ic('clock')}Confirmar reserva</button></form>`);
  m.el.querySelector('#fr').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; const u = U(id); u.status = 'reservado'; u.clienteId = f.cliente.value; u.corretorId = cliente(f.cliente.value).corretorId; u.reservaAte = addDias(new Date(), +f.dias.value).toISOString(); cliente(f.cliente.value).interesse = id; m.close(); save(`${unidadeLabel(id)} reservado`); });
}

function openPix(id) {
  const r = R(id); const at = cotaAtrasada(r); const x = calcAtraso(at);
  const code = `00020126580014BR.GOV.BCB.PIX0136${'condominio-' + CONFIG.condominio.toLowerCase().replace(/\W/g, '')}520400005303986540${x.total.toFixed(2).length}${x.total.toFixed(2)}5802BR5913${CONFIG.condominio.slice(0, 13)}6009FLORIPA62140510${at.id.replace(/\W/g, '').slice(-10)}6304A1B2`;
  modal(`<b style="font-size:16px">2ª via com Pix · ${unidadeLabel(id)}</b>`, `<div style="text-align:center"><div class="mut" style="font-size:12px">Cota de ${at.mes} · ${x.dias} dias de atraso</div><div class="price" style="margin:4px 0 12px">${brl(x.total)}</div>
    <div class="qr">${qrSVG(code)}</div><div class="mut" style="font-size:11px;margin:10px 0 6px">Pix copia e cola (demonstração)</div><div class="pix-code">${code}</div>
    <div class="btn-row" style="margin-top:12px"><button class="btn" id="cp">Copiar código</button><button class="btn wa" data-act="wa" data-tel="${r.telefone}" data-msg="${esc(`Olá ${r.nome.split(' ')[0]}! Segue a 2ª via da cota de ${at.mes} (${brl(x.total)}). Pix copia e cola: ${code}`)}">${ic('wa')}Enviar ao morador</button></div></div>`)
    .el.querySelector('#cp').onclick = () => { navigator.clipboard?.writeText(code); toast('Código Pix copiado'); };
}

function openCotas(id) {
  const r = R(id);
  modal(`<b style="font-size:16px">Cotas condominiais · ${unidadeLabel(id)}</b>`, `<div class="list">${r.cotas.map((c) => `<div class="li"><div class="grow"><b>Cota de ${c.mes} ${c.ano}</b><small>vencimento ${dataBR(c.vencimento, { year: 'numeric' })}${c.pagoEm ? ' · pago em ' + dataBR(c.pagoEm) : ''}</small></div><b class="mono">${brl(c.status === 'atrasado' ? calcAtraso(c).total : (c.valorPago || c.valor))}</b>${cotaPill(c)}</div>`).join('')}</div>
    <div class="mut" style="font-size:11.5px;margin-top:10px">Composição: taxa ordinária + fundo de reserva (10%). Atrasos: multa de 2% + juros de 1% ao mês pro rata.</div>`);
}

function openNovoChamado(uid) {
  const m = modal('<b style="font-size:16px">Novo chamado</b>', `<form class="form" id="fc">
    <label>Unidade<select class="input" name="u">${allResidents().map((r) => `<option value="${r.id}" ${r.id === uid ? 'selected' : ''}>${unidadeLabel(r.id)} · ${esc(r.nome)}</option>`).join('')}</select></label>
    <label>Título<input class="input" name="t" required placeholder="Ex.: Vazamento no banheiro"></label>
    <div class="two"><label>Categoria<select class="input" name="c">${['Hidráulica', 'Elétrica', 'Portaria', 'Convivência', 'Manutenção', 'Garagem', 'Limpeza'].map((x) => `<option>${x}</option>`).join('')}</select></label>
    <label>Prazo (horas)<input class="input" type="number" name="p" value="48"></label></div><button class="btn pri block">Abrir chamado</button></form>`);
  m.el.querySelector('#fc').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; const r = R(f.u.value); D().ultimoChamado++;
    r.chamados.unshift({ id: `CH-${String(HOJE.getDate()).padStart(2, '0')}${String(HOJE.getMonth() + 1).padStart(2, '0')}-${String(D().ultimoChamado).padStart(3, '0')}`, unidade: r.id, titulo: f.t.value, categoria: f.c.value, abertoEm: new Date().toISOString(), prazoH: +f.p.value, status: 'aberto', comentarios: [] });
    m.close(); save('Chamado aberto'); });
}

function openNovaEncomenda() {
  const m = modal('<b style="font-size:16px">Registrar encomenda</b>', `<form class="form" id="fe">
    <label>Unidade<select class="input" name="u">${allResidents().map((r) => `<option value="${r.id}">${unidadeLabel(r.id)} · ${esc(r.nome)}</option>`).join('')}</select></label>
    <div class="two"><label>Transportadora<select class="input" name="t">${['Amazon', 'Mercado Livre', 'Shopee', 'Magalu', 'Correios', 'iFood', 'Americanas'].map((x) => `<option>${x}</option>`).join('')}</select></label>
    <label>Tipo<select class="input" name="k"><option value="caixa">Caixa</option><option value="envelope">Envelope</option><option value="saco">Pacote plástico</option><option value="sacola">Sacola</option></select></label></div>
    <label>Local<input class="input" name="l" value="Portaria · armário A-01"></label>
    <label>Foto<input class="input" type="file" accept="image/*" capture="environment"></label>
    <label style="display:flex;gap:8px;align-items:center;color:var(--txt)"><input type="checkbox" name="w" checked> Avisar o morador no WhatsApp</label>
    <button class="btn pri block">${ic('box')}Registrar</button></form>`);
  m.el.querySelector('#fe').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; const r = R(f.u.value);
    const enc = { id: 'E-' + Date.now(), unidade: r.id, transportadora: f.t.value, tipo: f.k.value, descricao: `${f.t.value} ${f.k.options[f.k.selectedIndex].text.toLowerCase()}`, local: f.l.value, chegou: new Date().toISOString(), codigo: 'ENC-' + (1100 + Math.floor(Math.random() * 800)), status: 'portaria', avisado: f.w.checked, pin: String(1000 + Math.floor(Math.random() * 9000)) };
    r.encomendas.unshift(enc); m.close(); save('Encomenda registrada');
    if (f.w.checked) openWhats(r.telefone, `Olá ${r.nome.split(' ')[0]}! Chegou uma encomenda ${enc.transportadora} para o ${unidadeLabel(r.id)}. Código de retirada: ${enc.pin}.`); });
}

function openNovoVisitante() {
  const m = modal('<b style="font-size:16px">Novo visitante / prestador</b>', `<form class="form" id="fv"><label>Nome<input class="input" name="n" required></label>
    <div class="two"><label>Tipo<select class="input" name="t"><option>Visitante</option><option>Prestador</option><option>Entregador</option></select></label><label>Destino<select class="input" name="d">${allResidents().map((r) => `<option value="${r.id}">${unidadeCurta(r.id)}</option>`).join('')}</select></label></div>
    <label>Documento<input class="input" name="doc" placeholder="RG / CPF (opcional)"></label><button class="btn pri block">Liberar entrada</button></form>`);
  m.el.querySelector('#fv').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; D().visitantes.unshift({ nome: f.n.value, tipo: f.t.value, destino: f.d.value, hora: horaBR(new Date()), status: 'no_predio', doc: f.doc.value || '—' }); m.close(); save('Entrada registrada'); });
}

function openNovaReserva() {
  const m = modal('<b style="font-size:16px">Nova reserva</b>', `<form class="form" id="fr2"><label>Espaço<select class="input" name="e">${ESPACOS.map((x) => `<option>${x.nome}</option>`).join('')}</select></label>
    <label>Unidade<select class="input" name="u">${allResidents().map((r) => `<option value="${r.id}">${unidadeLabel(r.id)} · ${esc(r.nome)}</option>`).join('')}</select></label>
    <div class="two"><label>Data<input class="input" type="date" name="d" required value="${addDias(new Date(), 2).toISOString().slice(0, 10)}"></label><label>Horário<input class="input" name="h" value="19h às 23h"></label></div><button class="btn pri block">Reservar</button></form>`);
  m.el.querySelector('#fr2').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; D().reservas.push({ id: 'R' + Date.now(), espaco: f.e.value, unidade: f.u.value, morador: R(f.u.value).nome, data: new Date(f.d.value + 'T12:00').toISOString(), hora: f.h.value, status: 'confirmada' }); m.close(); save('Reserva criada'); });
}

function openNovoComunicado() {
  const m = modal('<b style="font-size:16px">Novo comunicado</b>', `<form class="form" id="fm"><label>Título<input class="input" name="t" required></label><label>Mensagem<textarea class="input" name="x" rows="4" required></textarea></label>
    <label>Etiqueta<select class="input" name="g"><option>Aviso</option><option>Novo</option><option>Regra</option><option>Evento</option></select></label><button class="btn pri block">${ic('megaphone')}Publicar no mural</button></form>`);
  m.el.querySelector('#fm').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; D().comunicados.unshift({ id: 'M' + Date.now(), titulo: f.t.value, texto: f.x.value, autor: 'Administração', data: new Date().toISOString(), tag: f.g.value }); m.close(); save('Comunicado publicado'); });
}

function openNovoCliente() {
  const m = modal('<b style="font-size:16px">Novo cliente</b>', `<form class="form" id="fcl"><label>Nome<input class="input" name="n" required></label><div class="two"><label>Telefone<input class="input" name="t" placeholder="(48) 99999-9999"></label>
    <label>Origem<select class="input" name="o">${['Instagram', 'Site', 'Indicação', 'Plantão', 'Portal imobiliário', 'WhatsApp'].map((x) => `<option>${x}</option>`).join('')}</select></label></div>
    <div class="two"><label>Interesse<select class="input" name="i">${D().units.filter((u) => u.status === 'disponivel').map((u) => `<option value="${u.id}">${unidadeLabel(u.id)} · ${brlCurto(u.preco)}</option>`).join('')}</select></label>
    <label>Corretor<select class="input" name="c">${CORRETORES.map((c) => `<option value="${c.id}">${c.nome}</option>`).join('')}</select></label></div><button class="btn pri block">Adicionar ao funil</button></form>`);
  m.el.querySelector('#fcl').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; D().clientes.unshift({ id: 'cl' + Date.now(), nome: f.n.value, telefone: f.t.value, origem: f.o.value, etapa: 'novo', corretorId: f.c.value, interesse: f.i.value, criado: new Date().toISOString(), orcamento: U(f.i.value).preco, temperatura: 'quente' }); m.close(); save('Cliente adicionado'); });
}

function openLead(id) {
  const c = cliente(id); const u = U(c.interesse);
  modal(`<b style="font-size:16px">${esc(c.nome)}</b>`, `<div class="list"><div class="li"><div class="grow"><small>Interesse</small><b>${unidadeLabel(u.id)} · ${PLANTAS[u.planta].nome}</b></div><button class="btn sm" data-act="go-unit" data-id="${u.id}" data-close>${ic('cube')}Ver no 3D</button></div>
    <div class="li"><div class="grow"><small>Orçamento</small><b>${brl(c.orcamento, 0)}</b></div><div class="grow"><small>Origem</small><b>${esc(c.origem)}</b></div></div>
    <div class="li"><div class="grow"><small>Corretor</small><b>${esc(corretor(c.corretorId).nome)}</b></div><div class="grow"><small>Desde</small><b>${dataBR(c.criado)}</b></div></div></div>
    <div class="eyebrow" style="margin-top:14px">Mover para</div><div class="btn-row">${ETAPAS.map((e) => `<button class="btn sm ${c.etapa === e.id ? 'pri' : ''}" data-act="lead-move" data-id="${c.id}" data-e="${e.id}" data-close>${e.label}</button>`).join('')}</div>
    <div class="btn-row" style="margin-top:12px">${c.telefone ? `<button class="btn wa" data-act="wa" data-tel="${c.telefone}" data-msg="Olá ${esc(c.nome.split(' ')[0])}! Aqui é da ${esc(CONFIG.incorporadora)}, sobre o ${esc(CONFIG.condominio)}.">${ic('wa')}WhatsApp</button>` : ''}${u.status === 'disponivel' ? `<button class="btn pri" data-act="proposta" data-id="${u.id}" data-close>${ic('file')}Gerar proposta</button>` : ''}</div>`);
}

// ---------------- VIEWS ----------------
const ETAPAS = [{ id: 'novo', label: 'Novos', cor: '#64748b' }, { id: 'contato', label: 'Em contato', cor: '#06b6d4' }, { id: 'visita', label: 'Visita', cor: '#8b5cf6' }, { id: 'proposta', label: 'Proposta', cor: '#f5b20b' }, { id: 'fechado', label: 'Fechado', cor: '#22c55e' }];
const ESPACOS = [{ nome: 'Salão de festas', cap: 80, icon: 'heart' }, { nome: 'Churrasqueira', cap: 30, icon: 'flame' }, { nome: 'Espaço gourmet', cap: 20, icon: 'home' }, { nome: 'Brinquedoteca', cap: 15, icon: 'toy' }, { nome: 'Academia', cap: 12, icon: 'bolt' }];
let unFilter = { q: '', status: 'todos', torre: 'todas', planta: 'todas' };
let portFilter = 'todas', portQ = '';

const kpi = (lbl, val, foot, icon, glow) => `<div class="card kpi" style="--glow:${glow || 'rgba(139,92,246,.25)'}"><div class="ico">${ic(icon)}</div><div class="lbl">${lbl}</div><div class="val">${val}</div><div class="foot">${foot}</div></div>`;

const VIEWS = {
  geral(v) {
    const us = D().units, vend = us.filter((u) => u.status === 'vendido');
    const vgv = us.reduce((a, u) => a + u.preco, 0), vgvV = vend.reduce((a, u) => a + (u.valorVenda || u.preco), 0);
    const s = condStats(); const ranking = CORRETORES.map((c) => ({ c, n: us.filter((u) => u.status === 'vendido' && u.corretorId === c.id).length, v: us.filter((u) => u.status === 'vendido' && u.corretorId === c.id).reduce((a, u) => a + (u.valorVenda || 0), 0) })).sort((a, b) => b.v - a.v);
    const fun = ETAPAS.map((e) => ({ ...e, n: D().clientes.filter((c) => c.etapa === e.id).length })); const maxF = Math.max(...fun.map((f) => f.n), 1);
    v.innerHTML = `<div class="eyebrow">${esc(CONFIG.incorporadora)}</div><h1 class="h1">Visão geral</h1><p class="sub">${mesAtual} de ${HOJE.getFullYear()} · 1 empreendimento · ${us.length} unidades</p>
    <div class="kpis">${kpi('VGV lançado', brlCurto(vgv), `${us.length} unidades`, 'building')}${kpi('VGV vendido', brlCurto(vgvV), `${vend.length} unidades · ${Math.round(vgvV / vgv * 100)}%`, 'chart', 'rgba(34,197,94,.22)')}
      ${kpi('Disponíveis', us.filter((u) => u.status === 'disponivel').length, `${us.filter((u) => u.status === 'reservado').length} reservadas`, 'key', 'rgba(245,178,11,.22)')}${kpi('Propostas ativas', D().propostas.filter((p) => ['enviada', 'em_analise'].includes(p.status)).length, 'aguardando resposta', 'file', 'rgba(236,72,153,.22)')}
      ${kpi('Inadimplência', s.inad.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%', `${s.atr.length} unidades em atraso`, 'wallet', 'rgba(239,68,68,.25)')}${kpi('Na portaria', s.enc.length, `${s.antigas} paradas há +3 dias`, 'box', 'rgba(34,211,238,.22)')}</div>
    <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);margin-bottom:14px" id="g1">
      <div class="card"><div class="card-head"><div class="h2">Vendas por mês <small>unidades · últimos 11 meses</small></div></div>${barChart(D().vendasMes, { highlightLast: true })}</div>
      <div class="card"><div class="card-head"><div class="h2">Funil de clientes</div><button class="btn sm" data-go="clientes">Abrir</button></div><div class="funnel">${fun.map((f) => `<div class="row"><span>${f.label}</span><div class="bar" style="width:${Math.max(6, f.n / maxF * 100)}%;background:linear-gradient(90deg,${f.cor}aa,${f.cor})"></div><b>${f.n}</b></div>`).join('')}</div>
      <div class="mut" style="font-size:12px;margin-top:12px">Conversão: ${Math.round(fun[4].n / D().clientes.length * 100)}% dos leads viraram venda</div></div></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
      <div class="card"><div class="card-head"><div class="h2">Empreendimentos</div></div><div class="li click" data-go="espelho"><div class="grow"><b>${esc(CONFIG.condominio)}</b><small>${CONFIG.torres.length} torres · entregue em ${CONFIG.entrega} · pronto para morar</small></div>${ic('chev')}</div>${stackBar(us)}
        <div class="legend">${Object.entries(STATUS_VENDA).map(([k, s]) => `<span><i class="dot" style="background:${s.cor}"></i>${s.label} <b>${us.filter((u) => u.status === k).length}</b></span>`).join('')}</div></div>
      <div class="card rank"><div class="card-head"><div class="h2">Ranking de corretores</div></div><div class="list">${ranking.map((r, i) => `<div class="li"><span class="pos">${i + 1}</span><div class="avatar" style="width:30px;height:30px;font-size:11px;background:${r.c.cor}">${r.c.foto}</div><div class="grow"><b>${r.c.nome}</b><small>${r.n} vendas</small></div><b class="mono">${brlCurto(r.v)}</b></div>`).join('')}</div></div>
      <div class="card"><div class="card-head"><div class="h2">Condomínio hoje</div><button class="btn sm" data-act="m-mode-cond">${ic('cube')}Ver no 3D</button></div><div class="mini-kpis two">
        <div class="mini cyan"><div class="lbl">Portaria</div><div class="val">${s.enc.length}</div></div><div class="mini amber"><div class="lbl">Chamados</div><div class="val">${s.ch.length}</div></div>
        <div class="mini red"><div class="lbl">Em atraso</div><div class="val">${brlCurto(s.atr.reduce((a, r) => a + calcAtraso(cotaAtrasada(r)).total, 0))}</div></div><div class="mini"><div class="lbl">Reservas</div><div class="val">${s.res}</div></div></div></div></div>`;
    fixIcons(v);
    if (matchMedia('(max-width: 820px)').matches) v.querySelector('#g1').style.gridTemplateColumns = '1fr';
  },

  unidades(v) {
    const us = D().units; const disp = us.filter((u) => u.status === 'disponivel').length;
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Unidades <span>tabela de ${mesAtual}</span></h1><p class="sub">${us.length} de ${us.length} unidades</p></div></div>
    <div class="card" style="margin-bottom:14px"><div class="eyebrow">Disponíveis para venda</div><div style="font-size:30px;font-weight:800;margin-bottom:10px">${disp} <span class="mut" style="font-size:18px;font-weight:400">de ${us.length}</span></div>${stackBar(us)}
      <div class="legend">${Object.entries(STATUS_VENDA).map(([k, s]) => `<span><i class="dot" style="background:${s.cor}"></i>${s.label} <b>${us.filter((u) => u.status === k).length}</b></span>`).join('')}</div></div>
    <div class="card"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><input class="input" style="max-width:260px" placeholder="Buscar por apto, cliente…" data-input="un-q" value="${esc(unFilter.q)}">
      <select class="select" name="status" data-change="un-filter"><option value="todos">Todas as situações</option>${Object.entries(STATUS_VENDA).map(([k, s]) => `<option value="${k}" ${unFilter.status === k ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
      ${CONFIG.torres.length > 1 ? `<select class="select" name="torre" data-change="un-filter"><option value="todas">Todas as torres</option>${CONFIG.torres.map((t) => `<option value="${t.id}" ${unFilter.torre === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}</select>` : ''}
      <select class="select" name="planta" data-change="un-filter"><option value="todas">Todas as plantas</option>${Object.values(PLANTAS).map((p) => `<option value="${p.id}" ${unFilter.planta === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></div>
      <div class="table-wrap" id="un-table"></div></div>`;
    renderUnidadesTable();
  },

  clientes(v) {
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">Funil de vendas</div><h1 class="h1">Clientes <span>${D().clientes.length} leads</span></h1><p class="sub">Arraste os cards entre as etapas (no celular, toque no card).</p></div><button class="btn pri" data-act="novo-cliente">${ic('plus')}Novo cliente</button></div>
    <div class="kanban">${ETAPAS.map((e) => { const cs = D().clientes.filter((c) => c.etapa === e.id); return `<div class="col" data-etapa="${e.id}"><div class="col-head"><span style="display:flex;gap:7px;align-items:center"><i class="dot" style="background:${e.cor};box-shadow:0 0 8px ${e.cor}"></i>${e.label}</span><span class="pill">${cs.length}</span></div>
      ${cs.map((c) => { const u = U(c.interesse); const co = corretor(c.corretorId); return `<div class="lead" draggable="true" data-lead="${c.id}" data-act="lead" data-id="${c.id}"><b>${esc(c.nome)}</b><span class="mut">${unidadeLabel(u.id)} · ${brlCurto(c.orcamento)}</span>
        <div class="meta"><span class="pill ${c.temperatura === 'quente' ? 'bad' : c.temperatura === 'morno' ? 'warn' : 'cyan'}">${c.temperatura}</span><span>${esc(c.origem)}</span><div class="avatar" style="width:22px;height:22px;font-size:9px;background:${co.cor}" title="${co.nome}">${co.foto}</div></div></div>`; }).join('')}</div>`; }).join('')}</div>`;
    let dragId = null;
    v.querySelectorAll('.lead').forEach((l) => l.addEventListener('dragstart', (e) => { dragId = l.dataset.lead; e.dataTransfer.effectAllowed = 'move'; }));
    v.querySelectorAll('.col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('over'); if (dragId) ACTIONS['lead-move']({ id: dragId, e: col.dataset.etapa }); });
    });
  },

  propostas(v) {
    const ps = D().propostas; const ST = { enviada: ['Enviada', '#06b6d4', 'cyan'], em_analise: ['Em análise', '#f5b20b', 'warn'], aprovada: ['Aprovada', '#22c55e', 'ok'], recusada: ['Recusada', '#64748b', 'gray'] };
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Propostas <span>comerciais</span></h1><p class="sub">Gere propostas a partir do Espelho 3D ou da tela de Unidades.</p></div><button class="btn pri" data-go="espelho">${ic('cube')}Abrir espelho</button></div>
    <div class="card" style="margin-bottom:14px"><div class="eyebrow">Total registrado</div><div style="font-size:30px;font-weight:800;margin-bottom:10px">${ps.length} propostas <span class="mut" style="font-size:16px;font-weight:400">· ${brlCurto(ps.reduce((a, p) => a + p.valorFinal, 0))}</span></div>
      <div class="stack">${Object.entries(ST).map(([k, s]) => { const n = ps.filter((p) => p.status === k).length; return n ? `<i style="width:${n / ps.length * 100}%;background:${s[1]};color:${s[1]}"></i>` : ''; }).join('')}</div>
      <div class="legend">${Object.entries(ST).map(([k, s]) => `<span><i class="dot" style="background:${s[1]}"></i>${s[0]} <b>${ps.filter((p) => p.status === k).length}</b></span>`).join('')}</div></div>
    <div class="card table-wrap"><table class="t"><thead><tr><th>Nº</th><th>Cliente</th><th>Unidade</th><th>Valor tabela</th><th>Desconto</th><th>Valor final</th><th>Situação</th><th>Data</th><th></th></tr></thead><tbody>
    ${ps.map((p) => `<tr><td class="mono">${p.id}</td><td><b>${esc(cliente(p.clienteId)?.nome)}</b></td><td>${unidadeLabel(p.unidadeId)}</td><td class="mono">${brl(p.valorTabela, 0)}</td><td><span class="bar-mini"><i style="width:${p.desconto * 20}%"></i></span> ${p.desconto}%</td><td class="mono"><b>${brl(p.valorFinal, 0)}</b></td>
      <td><span class="pill ${ST[p.status][2]}">${ST[p.status][0]}</span></td><td class="mut">${dataBR(p.data)}</td>
      <td><div class="btn-row" style="flex-wrap:nowrap"><button class="btn sm" data-act="prop-ver" data-id="${p.id}">Ver</button>${['enviada', 'em_analise'].includes(p.status) ? `<button class="btn sm green" data-act="prop-status" data-id="${p.id}" data-s="aprovada">Aprovar</button><button class="btn sm" data-act="prop-status" data-id="${p.id}" data-s="recusada">Recusar</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>`;
  },

  portaria(v) {
    const s = condStats(); const hoje = (iso) => new Date(iso).toDateString() === new Date().toDateString();
    const allE = allResidents().flatMap((r) => r.encomendas);
    const lockers = Array.from({ length: 24 }, (_, i) => { const code = `${'ABC'[Math.floor(i / 8)]}-${String(i % 8 + 1).padStart(2, '0')}`; const e = s.enc.find((x) => x.local.includes(code)); return `<i class="${e ? (diasEntre(e.chegou) >= 3 ? 'old' : 'on') : ''}" title="${e ? unidadeCurta(e.unidade) : 'livre'}">${code}</i>`; }).join('');
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)} · turno de hoje: Joaquim (06h–14h)</div><h1 class="h1">Portaria <span>encomendas e visitantes</span></h1></div><div class="btn-row"><button class="btn" data-act="novo-visitante">${ic('door')}Novo visitante</button><button class="btn pri" data-act="nova-encomenda">${ic('camera')}Registrar encomenda</button></div></div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);margin-bottom:14px" id="pg">
      <div class="card" style="background:linear-gradient(135deg,#2a1b52,#16122a 60%);overflow:hidden"><div class="eyebrow">Na portaria agora</div><div style="display:flex;align-items:baseline;gap:10px"><span style="font-size:46px;font-weight:800">${s.enc.length}</span><span class="mut">volumes · ${new Set(s.enc.map((e) => e.unidade)).size} apartamentos esperando retirada</span></div>
        <div class="mini-kpis" style="grid-template-columns:repeat(4,1fr);margin-top:12px"><div class="mini"><div class="lbl">Chegaram hoje</div><div class="val">${allE.filter((e) => hoje(e.chegou)).length}</div></div><div class="mini"><div class="lbl">Entregues hoje</div><div class="val">${allE.filter((e) => e.retiradaEm && hoje(e.retiradaEm)).length}</div></div>
        <div class="mini"><div class="lbl">Paradas +3 dias</div><div class="val warn">${s.antigas}</div></div><div class="mini"><div class="lbl">Visitantes no prédio</div><div class="val">${D().visitantes.filter((x) => x.status === 'no_predio').length}</div></div></div></div>
      <div class="card"><div class="card-head"><div class="h2">Armários inteligentes</div><span class="mut" style="font-size:11.5px">ocupados ${s.enc.filter((e) => /armário/.test(e.local)).length}/24</span></div><div class="lockers">${lockers}</div>
        <div class="legend"><span><i class="dot" style="background:var(--cyan)"></i>ocupado</span><span><i class="dot" style="background:#f97316"></i>parado há +3 dias</span></div></div></div>
    <div class="card" style="margin-bottom:14px"><div class="card-head" style="flex-wrap:wrap"><div class="h2">Correspondências <small>com foto da portaria</small></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg sub">${[['todas', 'Todas'], ['antigas', 'Paradas +3 dias'], ['sem_aviso', 'Sem aviso'], ['retiradas', 'Retiradas']].map(([k, l]) => `<button class="${portFilter === k ? 'on' : ''}" data-act="port-filter" data-f="${k}">${l}</button>`).join('')}</div><input class="input" style="width:200px" placeholder="Apto, nome ou código" data-input="port-q" value="${esc(portQ)}"></div></div>
      <div class="enc-grid" id="enc-grid"></div></div>
    <div class="card"><div class="card-head"><div class="h2">Visitantes e prestadores <small>de hoje</small></div></div><div class="table-wrap"><table class="t"><thead><tr><th>Nome</th><th>Tipo</th><th>Destino</th><th>Documento</th><th>Hora</th><th>Situação</th><th></th></tr></thead><tbody>
      ${D().visitantes.map((x, i) => `<tr><td><b>${esc(x.nome)}</b></td><td>${x.tipo}</td><td>${unidadeCurta(x.destino)}</td><td class="mono mut">${esc(x.doc)}</td><td class="mono">${x.hora}</td><td>${{ aguardando: '<span class="pill warn">Aguardando</span>', no_predio: '<span class="pill cyan">No prédio</span>', saiu: '<span class="pill gray">Saiu</span>', agendado: '<span class="pill acc">Agendado</span>' }[x.status]}</td>
      <td>${x.status === 'aguardando' || x.status === 'agendado' ? `<button class="btn sm green" data-act="visit" data-i="${i}" data-s="no_predio">Liberar</button>` : x.status === 'no_predio' ? `<button class="btn sm" data-act="visit" data-i="${i}" data-s="saiu">Registrar saída</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div>`;
    if (matchMedia('(max-width: 820px)').matches) { v.querySelector('#pg').style.gridTemplateColumns = '1fr'; v.querySelector('#pg .mini-kpis').style.gridTemplateColumns = '1fr 1fr'; }
    renderPortGrid();
  },

  chamados(v) {
    const all = allResidents().flatMap((r) => r.chamados); const ab = all.filter((c) => c.status !== 'concluido');
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Chamados <span>manutenção e ocorrências</span></h1></div><button class="btn pri" data-act="novo-chamado">${ic('plus')}Novo chamado</button></div>
    <div class="kpis">${kpi('Em aberto', ab.filter((c) => c.status === 'aberto').length, 'aguardando início', 'clock', 'rgba(245,178,11,.22)')}${kpi('Em andamento', ab.filter((c) => c.status === 'andamento').length, 'com equipe', 'wrench')}${kpi('Fora do prazo', ab.filter(chamadoForaPrazo).length, 'SLA estourado', 'alert', 'rgba(239,68,68,.25)')}${kpi('Concluídos', all.filter((c) => c.status === 'concluido').length, 'nos últimos 30 dias', 'check', 'rgba(34,197,94,.22)')}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))"><div class="card"><div class="h2" style="margin-bottom:8px">Em aberto</div>${ab.sort((a, b) => chamadoForaPrazo(b) - chamadoForaPrazo(a)).map((c) => chamadoRow(c, true)).join('') || '<div class="mut">Nenhum chamado aberto 🎉</div>'}</div>
    <div class="card"><div class="h2" style="margin-bottom:8px">Concluídos</div>${all.filter((c) => c.status === 'concluido').slice(0, 12).map((c) => chamadoRow(c, true)).join('')}</div></div>`;
    fixIcons(v);
  },

  financeiro(v) {
    const rs = allResidents(); const atr = rs.filter((r) => cotaAtrasada(r));
    const prev = rs.reduce((a, r) => a + r.cotas[0].valor, 0); const atrasoT = atr.reduce((a, r) => a + calcAtraso(cotaAtrasada(r)).total, 0);
    const hist = Array.from({ length: 6 }, (_, i) => { const idx = 5 - i; const m = new Date(HOJE.getFullYear(), HOJE.getMonth() - idx - 1, 1); return { mes: MESES[m.getMonth()].slice(0, 3), v: +(rs.reduce((a, r) => a + (r.cotas[idx + 1]?.status === 'pago' ? r.cotas[idx + 1].valor : 0), 0) / 1000).toFixed(1) }; });
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Financeiro <span>cotas e inadimplência</span></h1></div></div>
    <div class="kpis">${kpi('Arrecadação prevista', brlCurto(prev), `cotas de ${mesAtual}`, 'wallet')}${kpi('Recebido no mês anterior', brlCurto(rs.reduce((a, r) => a + (r.cotas[1]?.status === 'pago' ? r.cotas[1].valor : 0), 0)), 'cotas pagas', 'check', 'rgba(34,197,94,.22)')}
      ${kpi('Em atraso', brl(atrasoT), `${atr.length} unidades`, 'alert', 'rgba(239,68,68,.25)')}${kpi('Inadimplência', (atr.length / rs.length * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%', 'meta: abaixo de 5%', 'chart', 'rgba(245,178,11,.22)')}</div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">
      <div class="card"><div class="card-head"><div class="h2">Inadimplentes</div></div><div class="list">${atr.sort((a, b) => calcAtraso(cotaAtrasada(b)).dias - calcAtraso(cotaAtrasada(a)).dias).map((r) => { const c = cotaAtrasada(r), x = calcAtraso(c); return `<div class="li"><div class="avatar" style="width:30px;height:30px;font-size:11px">${r.iniciais}</div><div class="grow"><b>${unidadeCurta(r.id)} · ${esc(r.nome)}</b><small>cota de ${c.mes} · <span class="bad">${x.dias} dias</span></small></div><b class="mono">${brl(x.total)}</b>
        <button class="btn sm wa" data-act="cobrar" data-id="${r.id}" title="Cobrar">${ic('wa')}</button><button class="btn sm" data-act="pix" data-id="${r.id}" title="2ª via">${ic('pix')}</button><button class="btn sm green" data-act="pagar" data-id="${r.id}" title="Marcar pago">${ic('check')}</button></div>`; }).join('') || '<div class="mut">Ninguém em atraso 🎉</div>'}</div></div>
      <div class="card"><div class="card-head"><div class="h2">Arrecadação <small>R$ mil · últimos 6 meses</small></div></div>${barChart(hist, { color: ['#15803d', '#4ade80'] })}</div></div>`;
  },

  reservas(v) {
    const rs = D().reservas.slice().sort((a, b) => new Date(a.data) - new Date(b.data));
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Reservas <span>áreas comuns</span></h1></div><button class="btn pri" data-act="nova-reserva">${ic('plus')}Nova reserva</button></div>
    <div class="kpis">${ESPACOS.map((e) => kpi(e.nome, rs.filter((r) => r.espaco === e.nome && new Date(r.data) >= addDias(HOJE, -1)).length, `até ${e.cap} pessoas`, e.icon)).join('')}</div>
    <div class="card"><div class="h2" style="margin-bottom:8px">Próximas reservas</div><div class="list">${rs.map((r) => `<div class="li"><div class="ico" style="width:42px;text-align:center"><b style="font-size:18px;display:block">${new Date(r.data).getDate()}</b><small class="mut">${MESES[new Date(r.data).getMonth()].slice(0, 3)}</small></div><div class="grow"><b>${esc(r.espaco)}</b><small>${unidadeCurta(r.unidade)} · ${esc(r.morador)} · ${esc(r.hora)}</small></div>
      ${r.status === 'confirmada' ? '<span class="pill ok">Confirmada</span>' : r.status === 'pendente' ? `<span class="pill warn">Pendente</span><button class="btn sm green" data-act="reserva-status" data-id="${r.id}" data-s="confirmada">Aprovar</button>` : '<span class="pill gray">Cancelada</span>'}
      ${r.status !== 'cancelada' ? `<button class="btn sm" data-act="reserva-status" data-id="${r.id}" data-s="cancelada">Cancelar</button>` : ''}</div>`).join('')}</div></div>`;
  },

  comunicados(v) {
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Comunicados <span>mural do condomínio</span></h1><p class="sub">Tudo o que for publicado aparece no app do morador.</p></div><button class="btn pri" data-act="novo-comunicado">${ic('plus')}Novo comunicado</button></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${D().comunicados.map((c) => `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><span class="pill acc">${esc(c.tag)}</span><span class="mut" style="font-size:12px">${haQuanto(c.data)}</span></div><h3 style="margin:12px 0 6px;font-size:17px">${esc(c.titulo)}</h3><p class="mut" style="margin:0 0 10px;line-height:1.5">${esc(c.texto)}</p><small class="mut">por ${esc(c.autor)}</small></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><div class="h2" style="margin-bottom:8px">Documentos</div><div class="list">${D().documentos.map((d) => `<div class="li">${ic('doc')}<div class="grow"><b>${esc(d.nome)}</b><small>${d.tipo} · ${d.tam}</small></div><button class="btn sm">Baixar</button></div>`).join('')}</div></div>`;
    fixIcons(v);
  },

  moradores(v) {
    const rs = allResidents();
    v.innerHTML = `<div class="head-row"><div><div class="eyebrow">${esc(CONFIG.condominio)}</div><h1 class="h1">Moradores <span>${rs.length} unidades ocupadas</span></h1></div></div>
    <div class="card table-wrap"><table class="t"><thead><tr><th>Unidade</th><th>Morador</th><th>Tipo</th><th>Moradores</th><th>Vaga</th><th>Telefone</th><th>Portaria</th><th>Chamados</th><th>Condomínio</th><th></th></tr></thead><tbody>
    ${rs.sort((a, b) => a.id.localeCompare(b.id)).map((r) => { const at = cotaAtrasada(r); return `<tr class="click" data-act="go-unit" data-id="${r.id}" data-c="1"><td class="mono"><b>${unidadeCurta(r.id)}</b></td><td><div style="display:flex;gap:8px;align-items:center"><div class="avatar" style="width:26px;height:26px;font-size:10px">${r.iniciais}</div>${esc(r.nome)}</div></td><td>${r.tipo}</td><td>${r.moradores} · ${r.pets} pet</td><td class="mono">${r.vaga}</td><td class="mono">${r.telefone}</td>
      <td>${encPortaria(r).length ? `<span class="pill cyan">${encPortaria(r).length}</span>` : '<span class="mut">—</span>'}</td><td>${chamadosAbertos(r).length ? `<span class="pill warn">${chamadosAbertos(r).length}</span>` : '<span class="mut">—</span>'}</td>
      <td>${at ? `<span class="pill bad">${calcAtraso(at).dias}d atraso</span>` : '<span class="pill ok">em dia</span>'}</td><td><button class="btn sm" data-act="app-morador" data-id="${r.id}">${ic('phone')}App</button></td></tr>`; }).join('')}</tbody></table></div>`;
  },
};
ACTIONS['m-mode-cond'] = () => { M.mode = 'condominio'; go('espelho'); };

function fixIcons(root) { root.querySelectorAll('.li > svg, .grow svg').forEach((s) => (s.style.cssText = 'width:16px;height:16px;flex:none;color:var(--acc2)')); }

function renderUnidadesTable() {
  const el = document.getElementById('un-table'); if (!el) return;
  const q = unFilter.q.toLowerCase();
  const list = D().units.filter((u) => (unFilter.status === 'todos' || u.status === unFilter.status) && (unFilter.torre === 'todas' || u.torre === unFilter.torre) && (unFilter.planta === 'todas' || u.planta === unFilter.planta))
    .filter((u) => { if (!q) return true; const nome = R(u.id)?.nome || u.proprietario || cliente(u.clienteId)?.nome || ''; return (u.numero + ' ' + u.id + ' ' + nome).toLowerCase().includes(q); });
  const maxP = Math.max(...D().units.map((u) => u.preco));
  el.innerHTML = `<table class="t"><thead><tr><th>Unidade</th>${CONFIG.torres.length > 1 ? '<th>Torre</th>' : ''}<th>Andar</th><th>Planta</th><th>Área</th><th>Vagas</th><th>Posição</th><th>Valor</th><th>R$/m²</th><th>Situação</th><th>Cliente</th></tr></thead><tbody>
  ${list.map((u) => { const s = STATUS_VENDA[u.status]; const nome = R(u.id)?.nome || u.proprietario || cliente(u.clienteId)?.nome || ''; return `<tr class="click" data-act="go-unit" data-id="${u.id}"><td class="mono"><b>${u.numero}</b></td>${CONFIG.torres.length > 1 ? `<td>${u.torre}</td>` : ''}<td>${ord(u.andar)}</td><td>${PLANTAS[u.planta].nome}</td><td>${u.area} m²</td><td>${PLANTAS[u.planta].vagas}</td><td>${u.posicao}</td>
    <td class="mono"><span class="bar-mini"><i style="width:${u.preco / maxP * 100}%"></i></span> ${brl(u.preco, 0)}</td><td class="mono mut">${brl(Math.round(u.preco / u.area), 0)}</td><td><span class="pill" style="background:${s.cor}22;color:${s.cor}"><i class="dot" style="background:${s.cor}"></i>${s.label}</span></td><td>${esc(nome) || '<span class="mut">—</span>'}</td></tr>`; }).join('')}</tbody></table>
  ${list.length ? '' : '<div class="mut" style="padding:20px;text-align:center">Nenhuma unidade encontrada.</div>'}`;
}

function renderPortGrid() {
  const el = document.getElementById('enc-grid'); if (!el) return;
  let list = allResidents().flatMap((r) => r.encomendas.map((e) => ({ ...e, r })));
  list = portFilter === 'retiradas' ? list.filter((e) => e.status === 'retirada').sort((a, b) => new Date(b.retiradaEm) - new Date(a.retiradaEm)).slice(0, 24) : list.filter((e) => e.status === 'portaria');
  if (portFilter === 'antigas') list = list.filter((e) => diasEntre(e.chegou) >= 3);
  if (portFilter === 'sem_aviso') list = list.filter((e) => !e.avisado);
  const q = portQ.toLowerCase(); if (q) list = list.filter((e) => (e.unidade + e.r.nome + e.codigo + e.transportadora).toLowerCase().includes(q));
  if (portFilter !== 'retiradas') list.sort((a, b) => new Date(b.chegou) - new Date(a.chegou));
  el.innerHTML = list.map((e) => { const old = diasEntre(e.chegou) >= 3 && e.status === 'portaria'; return `<div class="enc-card"><div class="foto">${fotoEncomenda(e)}<span class="tag pill ${old ? 'warn' : 'cyan'}" style="backdrop-filter:blur(6px)">${unidadeCurta(e.unidade)}</span></div>
    <div class="body"><div style="display:flex;justify-content:space-between;gap:6px"><b>${esc(e.transportadora)}</b><span class="mut" style="font-size:11.5px">${e.status === 'retirada' ? 'retirada ' + haQuanto(e.retiradaEm) : haQuanto(e.chegou)}</span></div>
    <span class="mut">${esc(e.r.nome)} · ${esc(e.local.replace('Portaria · ', ''))}</span><span class="mono mut" style="font-size:11px">${e.codigo}${e.avisado ? ' · avisado ✓' : ''}${e.status === 'retirada' ? ' · por ' + esc(e.retiradaPor) : ''}</span>
    ${e.status === 'portaria' ? `<div class="btn-row" style="margin-top:6px"><button class="btn sm wa" data-act="avisar" data-id="${e.id}" data-u="${e.unidade}">${ic('wa')}Avisar</button><button class="btn sm green" data-act="entregar" data-id="${e.id}" data-u="${e.unidade}">${ic('check')}Entregar</button></div>` : ''}</div></div>`; }).join('') || '<div class="mut">Nada por aqui.</div>';
}

// contexto compartilhado com o app do morador
const ctx = { store, save: (msg) => save(msg), openWhats, rerender };

window.addEventListener('hashchange', onRoute);
onRoute();
