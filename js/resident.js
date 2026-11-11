// App do morador: como o morador vê o condomínio no celular.
import { CONFIG, PLANTAS, brl, dataBR, haQuanto, HOJE, MESES, addDias, calcAtraso, cotaAtrasada, encPortaria, chamadosAbertos, chamadoForaPrazo, unidadeLabel } from './data.js';
import { ic, esc, fotoEncomenda, qrSVG, barChart, toast } from './ui.js';

export function openResidentApp(unitId, ctx) {
  const D = () => ctx.store.d;
  let id = unitId;
  const R = () => D().residentes[id];
  let screen = 'home', tab = 'retirar', chTab = 'aberto';

  const bg = document.createElement('div'); bg.className = 'res-bg';
  bg.innerHTML = `<div class="phone"><div class="phone-in"><div class="res-top"><span style="display:flex;gap:6px;align-items:center">${ic('phone')} App do morador</span>
    <span style="display:flex;gap:10px;align-items:center"><select class="select" id="res-pick" style="padding:3px 6px;font-size:11px;max-width:130px"></select><button data-x>${ic('x')} Fechar</button></span></div><div class="res-scroll" id="res-scroll"></div></div></div>`;
  document.body.appendChild(bg);
  bg.querySelectorAll('.res-top svg').forEach((s) => (s.style.cssText = 'width:14px;height:14px'));
  const pick = bg.querySelector('#res-pick');
  pick.innerHTML = Object.values(D().residentes).sort((a, b) => a.id.localeCompare(b.id)).map((r) => `<option value="${r.id}" ${r.id === id ? 'selected' : ''}>${r.id} · ${esc(r.nome.split(' ')[0])}</option>`).join('');
  pick.onchange = () => { id = pick.value; screen = 'home'; render(); };
  const close = () => { bg.remove(); ctx.rerender(); };
  bg.addEventListener('click', (e) => {
    if (e.target === bg || e.target.closest('[data-x]')) return close();
    const a = e.target.closest('[data-r]'); if (!a) return;
    const d = a.dataset;
    switch (d.r) {
      case 'go': screen = d.s; if (d.t) tab = d.t; render(); break;
      case 'tab': tab = d.t; render(); break;
      case 'chtab': chTab = d.t; render(); break;
      case 'qr': showQR(d.id); break;
      case 'pix': showPix(); break;
      case 'japaguei': { const at = cotaAtrasada(R()); if (at) { at.status = 'pago'; at.pagoEm = new Date().toISOString(); at.valorPago = calcAtraso(at).total; R().historico.push({ data: new Date().toISOString(), texto: `Informou pagamento da cota de ${at.mes} pelo app` }); ctx.store.save(); toast('Pagamento informado. A administração vai conferir.'); render(); } break; }
      case 'novo-ch': novoChamado(); break;
      case 'reservar': reservar(d.e); break;
      case 'quitacao': toast('Declaração de quitação disponível quando estiver em dia', 'doc'); break;
      case 'doc': toast('Download iniciado (demonstração)', 'doc'); break;
    }
  });

  const head = (t) => `<button class="back" data-r="go" data-s="home" style="margin:4px 0 8px">${ic('back')} Início</button><div class="res-h">${t}</div>`;
  const firstName = () => R().nome.split(' ')[0];
  const saud = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  const SCREENS = {
    home() {
      const r = R(); const enc = encPortaria(r); const at = cotaAtrasada(r); const ch = chamadosAbertos(r);
      const tiles = [
        ['correspondencias', 'Correspondências', 'box', '#06b6d4', '#155e75', enc.length, 'cyan'], ['financeiro', 'Financeiro', 'wallet', '#ef4444', '#7f1d1d', at ? 1 : 0, ''],
        ['chamados', 'Chamados', 'wrench', '#f59e0b', '#78350f', ch.length, 'warn'], ['reservas', 'Reservas', 'calendar', '#8b5cf6', '#4c1d95', D().reservas.filter((x) => x.unidade === id && x.status !== 'cancelada').length, 'acc'],
        ['unidade', 'Minha unidade', 'home', '#64748b', '#1e293b', 0], ['reunioes', 'Reuniões', 'vote', '#64748b', '#1e293b', 0],
        ['mural', 'Mural', 'megaphone', '#a855f7', '#581c87', D().comunicados.filter((c) => new Date(c.data) > addDias(HOJE, -7)).length, 'acc'], ['documentos', 'Documentos', 'doc', '#64748b', '#1e293b', 0], ['consumo', 'Consumo', 'drop', '#0ea5e9', '#0c4a6e', 0],
      ];
      return `<div class="res-hello"><div class="avatar">${r.iniciais}</div><div style="flex:1"><b>${esc(CONFIG.condominio)}</b><small>Apto ${id.split('-')[1]}${CONFIG.torres.length > 1 ? ' · Torre ' + id[0] : ''} · ${r.tipo}</small></div><span style="position:relative">${ic('bell')}<i style="position:absolute;top:-4px;right:-4px;width:9px;height:9px;border-radius:50%;background:var(--bad)"></i></span></div>
      <div class="res-h">${saud()}, ${esc(firstName())}</div>
      <div class="res-card portaria" data-r="go" data-s="correspondencias" style="cursor:pointer"><div style="display:flex;justify-content:space-between;font-size:11.5px"><span class="mut">${ic('box')} Na portaria agora</span><span style="color:var(--acc2)">Ver todas</span></div>
        <div style="display:flex;align-items:baseline;gap:8px;margin:4px 0 10px"><b style="font-size:30px">${enc.length}</b><span style="font-size:12.5px">${enc.length === 1 ? 'correspondência' : 'correspondências'} para retirar</span></div>
        ${enc.length ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${enc.slice(0, 2).map((e) => `<div class="foto" style="aspect-ratio:4/3">${fotoEncomenda(e)}<div style="position:absolute;left:0;right:0;bottom:0;padding:6px 8px;background:linear-gradient(transparent,#000c);font-size:11px"><b>${esc(e.transportadora)}</b><br><span class="mut">${esc(e.local.replace('Portaria · ', ''))} · ${haQuanto(e.chegou)}</span></div></div>`).join('')}</div>` : '<div class="mut" style="font-size:12px">Nada esperando por você 🎉</div>'}</div>
      <div class="res-two">${at ? `<div class="res-alert red" data-r="go" data-s="financeiro"><span style="font-size:11px">${ic('wallet')} Condomínio</span><b>Atrasado</b><span class="mut" style="color:#fecaca">${calcAtraso(at).dias} dias · cota de ${at.mes}</span><b style="margin-top:auto;font-size:17px">${brl(calcAtraso(at).total)}</b></div>`
        : `<div class="res-alert ok" data-r="go" data-s="financeiro"><span style="font-size:11px">${ic('wallet')} Condomínio</span><b>Em dia</b><span class="mut">próxima: ${dataBR(r.cotas[0].vencimento)}</span><b style="margin-top:auto;font-size:17px">${brl(r.cotas[0].valor)}</b></div>`}
        ${ch.length ? `<div class="res-alert amber" data-r="go" data-s="chamados"><span style="font-size:11px">${ic('wrench')} Chamado</span><b>${esc(ch[0].titulo)}</b><span style="color:#fed7aa">${chamadoForaPrazo(ch[0]) ? 'fora do prazo há ' + Math.max(1, Math.round((Date.now() - new Date(ch[0].abertoEm)) / 36e5 - ch[0].prazoH)) + ' h' : 'no prazo'}</span><span class="pill warn" style="margin-top:auto;align-self:flex-start">${ch[0].status === 'andamento' ? 'Em andamento' : 'Aberto'}</span></div>`
        : `<div class="res-alert ok" data-r="go" data-s="chamados"><span style="font-size:11px">${ic('wrench')} Chamados</span><b>Nenhum aberto</b><span class="mut">Precisa de algo? Abra um chamado.</span></div>`}</div>
      <div class="res-grid">${tiles.map(([s, l, i, c1, c2, n, cls]) => `<button class="res-tile" data-r="go" data-s="${s}" style="--c1:${c1};--c2:${c2}"><span class="ic">${ic(i)}</span>${l}${n ? `<span class="n ${cls}">${n}</span>` : ''}</button>`).join('')}</div>
      <div class="eyebrow">Em breve</div>
      ${D().reservas.filter((x) => x.unidade === id && new Date(x.data) >= addDias(HOJE, -1) && x.status !== 'cancelada').map((x) => `<div class="res-item"><span class="ic">${ic('calendar')}</span><div class="grow"><b>${esc(x.espaco)}</b><small>${dataBR(x.data)} · ${esc(x.hora)}</small></div><span class="pill ok">${x.status === 'confirmada' ? 'Confirmada' : 'Pendente'}</span></div>`).join('')}
      ${D().comunicados.slice(0, 1).map((c) => `<div class="res-item" data-r="go" data-s="mural"><span class="ic">${ic('megaphone')}</span><div class="grow"><b>${esc(c.titulo)}</b><small>${haQuanto(c.data)} · ${esc(c.autor)}</small></div><span class="pill acc">${esc(c.tag)}</span></div>`).join('')}`;
    },

    correspondencias() {
      const r = R(); const pend = encPortaria(r); const ret = r.encomendas.filter((e) => e.status === 'retirada');
      const list = tab === 'retirar' ? pend : ret;
      return head(`Correspondências apto ${id.split('-')[1]}`) + `<div class="res-tabs"><button class="${tab === 'retirar' ? 'on' : ''}" data-r="tab" data-t="retirar">Para retirar ${pend.length}</button><button class="${tab === 'retiradas' ? 'on' : ''}" data-r="tab" data-t="retiradas">Retiradas ${ret.length}</button></div>
      ${list.map((e) => `<div class="res-item" ${e.status === 'portaria' ? `data-r="qr" data-id="${e.id}" style="cursor:pointer"` : ''}><div class="foto sm">${fotoEncomenda(e)}</div><div class="grow"><b>${esc(e.descricao)}</b>
        ${e.status === 'portaria' ? `<span class="pill cyan" style="margin:3px 0">Aguardando retirada</span><small>${ic('calendar')} ${dataBR(e.chegou, { year: 'numeric' })} ${new Date(e.chegou).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small><small>${esc(e.local)}</small>`
        : `<span class="pill ok" style="margin:3px 0">Entregue</span><small>Entregue para ${esc(e.retiradaPor)} · ${dataBR(e.retiradaEm)}</small><small>Portaria</small>`}</div>${e.status === 'portaria' ? ic('chev') : ''}</div>`).join('') || '<div class="mut" style="text-align:center;padding:30px 0">Nada por aqui.</div>'}
      ${tab === 'retirar' && pend.length ? `<div class="mut" style="font-size:11.5px;display:flex;gap:6px;margin-top:8px">${ic('qr')} Na portaria, mostre o QR do app ou diga o código de 4 números.</div>` : ''}`;
    },

    financeiro() {
      const r = R(); const at = cotaAtrasada(r); const x = at ? calcAtraso(at) : null;
      return head('Financeiro') + (at ? `<div class="res-card" style="background:linear-gradient(160deg,rgba(239,68,68,.35),rgba(80,20,40,.4));border-color:rgba(239,68,68,.45)"><span class="pill bad">${ic('alert')} Em atraso</span>
        <div style="font-size:32px;font-weight:800;margin:8px 0 2px">${brl(x.total)}</div><div style="font-size:11.5px;color:#fecaca">Cota de ${at.mes} · venceu em ${dataBR(at.vencimento)} · ${x.dias} dias · com multa e juros</div>
        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin-top:12px"><button class="btn pri" data-r="pix">${ic('pix')}Pagar com Pix</button><button class="btn" data-r="japaguei">Já paguei</button></div></div>`
        : `<div class="res-card" style="background:linear-gradient(160deg,rgba(34,197,94,.25),rgba(20,60,40,.3))"><span class="pill ok">${ic('check')} Tudo em dia</span><div style="font-size:28px;font-weight:800;margin:8px 0 2px">${brl(r.cotas[0].valor)}</div><div class="mut" style="font-size:12px">Próxima cota vence em ${dataBR(r.cotas[0].vencimento)}</div></div>`) +
        `<div class="res-two"><div class="res-item" data-r="quitacao" style="margin:0;flex-direction:column;align-items:flex-start">${ic('doc')}<b>Declaração de quitação</b><small>Sai quando estiver em dia</small></div><div class="res-item" style="margin:0;flex-direction:column;align-items:flex-start">${ic('chart')}<b>Prestação de contas</b><small>Balancete de ${MESES[(HOJE.getMonth() + 11) % 12]}</small></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 8px"><b>Cotas condominiais</b><small class="mut">vencem todo dia 10</small></div>
        ${r.cotas.map((c) => `<div class="res-item"><div class="grow"><b>Cota de ${c.mes}</b><small>Vencimento ${dataBR(c.vencimento, { year: 'numeric' })}</small></div><div style="text-align:right"><b>${brl(c.status === 'atrasado' ? calcAtraso(c).total : (c.valorPago || c.valor))}</b>${c.status === 'pago' ? '<span class="pill ok">Pago</span>' : c.status === 'atrasado' ? `<span class="pill bad">Atrasado ${calcAtraso(c).dias} dias</span>` : '<span class="pill gray">A vencer</span>'}</div></div>`).join('')}`;
    },

    chamados() {
      const r = R(); const ab = r.chamados.filter((c) => c.status !== 'concluido'), co = r.chamados.filter((c) => c.status === 'concluido');
      const list = chTab === 'aberto' ? ab : co;
      return head(`Chamados apto ${id.split('-')[1]}`) + `<div class="res-item" data-r="novo-ch" style="cursor:pointer;background:linear-gradient(135deg,rgba(139,92,246,.35),rgba(139,92,246,.1));border-color:rgba(139,92,246,.4)"><span class="ic" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--acc)">${ic('camera')}</span><div class="grow"><b>Registrar um chamado</b><small>Com foto, resolve mais rápido</small></div>${ic('chev')}</div>
      <div class="res-tabs"><button class="${chTab === 'aberto' ? 'on' : ''}" data-r="chtab" data-t="aberto">Em aberto ${ab.length}</button><button class="${chTab === 'concluido' ? 'on' : ''}" data-r="chtab" data-t="concluido">Concluídos ${co.length}</button></div>
      ${list.map((c) => `<div class="res-item"><span style="width:44px;height:44px;border-radius:10px;background:linear-gradient(160deg,#334155,#0f172a);display:grid;place-items:center;flex:none">${ic('wrench')}</span><div class="grow"><small class="mono">${c.id} · ${esc(c.categoria)}</small><b>${esc(c.titulo)}</b>
        <small>${c.status === 'concluido' ? '<span class="pill ok">Concluído</span>' : `<span class="pill warn">${c.status === 'andamento' ? 'Em andamento' : 'Aberto'}</span> ${chamadoForaPrazo(c) ? '<span class="bad">fora do prazo</span>' : '<span class="mut">no prazo</span>'}`}</small></div></div>`).join('') || '<div class="mut" style="text-align:center;padding:30px 0">Nada por aqui.</div>'}`;
    },

    reservas() {
      const ESP = [['Salão de festas', 'heart'], ['Churrasqueira', 'flame'], ['Espaço gourmet', 'home'], ['Brinquedoteca', 'toy'], ['Academia', 'bolt']];
      const minhas = D().reservas.filter((x) => x.unidade === id);
      return head('Reservas') + `<div class="eyebrow">Minhas reservas</div>${minhas.map((x) => `<div class="res-item"><div class="grow"><b>${esc(x.espaco)}</b><small>${dataBR(x.data)} · ${esc(x.hora)}</small></div><span class="pill ${x.status === 'confirmada' ? 'ok' : x.status === 'pendente' ? 'warn' : 'gray'}">${x.status}</span></div>`).join('') || '<div class="mut" style="font-size:12px;margin-bottom:10px">Nenhuma reserva.</div>'}
      <div class="eyebrow" style="margin-top:14px">Reservar um espaço</div>${ESP.map(([n, i]) => `<div class="res-item" data-r="reservar" data-e="${n}" style="cursor:pointer">${ic(i)}<div class="grow"><b>${n}</b><small>Disponível ${dataBR(addDias(HOJE, 2))}</small></div>${ic('chev')}</div>`).join('')}`;
    },

    unidade() {
      const r = R(); const u = D().units.find((x) => x.id === id); const p = PLANTAS[u.planta];
      return head(`Minha unidade`) + `<div class="res-card"><b style="font-size:18px">${unidadeLabel(id)}</b><div class="mut" style="font-size:12px">${p.nome} · ${p.area} m² · ${u.andar}º andar · ${u.posicao}</div></div>
      <div class="res-item">${ic('users')}<div class="grow"><b>${r.moradores} moradores</b><small>Titular: ${esc(r.nome)}</small></div></div><div class="res-item">${ic('paw')}<div class="grow"><b>${r.pets} pet${r.pets === 1 ? '' : 's'}</b><small>cadastrados</small></div></div>
      <div class="res-item">${ic('car')}<div class="grow"><b>Vaga ${r.vaga}</b><small>garagem coberta</small></div></div><div class="res-item">${ic('key')}<div class="grow"><b>Chaves recebidas</b><small>${dataBR(new Date(2026, 2, 15).toISOString(), { year: 'numeric' })}</small></div></div>`;
    },

    reunioes() {
      return head('Reuniões') + `<div class="res-card" style="background:linear-gradient(160deg,rgba(139,92,246,.3),rgba(60,20,90,.3))"><span class="pill acc">Próxima</span><b style="display:block;font-size:17px;margin:8px 0 4px">Assembleia geral ordinária</b><div class="mut" style="font-size:12px">20/11 às 19h30 · salão de festas</div><div class="mut" style="font-size:12px;margin-top:6px">Pauta: previsão orçamentária 2027 e regimento interno.</div>
        <button class="btn pri block" style="margin-top:12px" onclick="this.textContent='Presença confirmada ✓';this.disabled=true">Confirmar presença</button></div>
        <div class="res-item">${ic('doc')}<div class="grow"><b>Ata da última assembleia</b><small>PDF · 310 KB</small></div></div>`;
    },

    mural() { return head('Mural') + D().comunicados.map((c) => `<div class="res-card"><div style="display:flex;justify-content:space-between"><span class="pill acc">${esc(c.tag)}</span><small class="mut">${haQuanto(c.data)}</small></div><b style="display:block;margin:8px 0 4px;font-size:15px">${esc(c.titulo)}</b><div class="mut" style="font-size:12.5px;line-height:1.5">${esc(c.texto)}</div><small class="mut" style="display:block;margin-top:8px">${esc(c.autor)}</small></div>`).join(''); },

    documentos() { return head('Documentos') + D().documentos.map((d) => `<div class="res-item" data-r="doc" style="cursor:pointer">${ic('doc')}<div class="grow"><b>${esc(d.nome)}</b><small>${d.tipo} · ${d.tam}</small></div>${ic('chev')}</div>`).join(''); },

    consumo() {
      const c = R().consumo; const ua = c.agua[c.agua.length - 1], ug = c.gas[c.gas.length - 1];
      const block = (nome, icon, data, media, tarifa, cor) => { const last = data[data.length - 1]; const diff = ((last.v - media) / media * 100); return `<div class="res-card"><div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:6px;align-items:center;font-size:12px">${ic(icon)} ${nome}</span><span class="pill ${diff > 0 ? 'warn' : 'ok'}">${diff > 0 ? '+' : ''}${diff.toFixed(0)}% vs. prédio</span></div>
        <div style="font-size:28px;font-weight:800;margin:6px 0 0">${String(last.v).replace('.', ',')}<small style="font-size:13px;font-weight:500" class="mut"> m³ em ${last.mes}</small></div><div class="mut" style="font-size:11.5px">sua média · a do prédio é ${String(media).replace('.', ',')} m³ · ${brl(last.v * tarifa)}</div>
        ${barChart(data, { h: 150, color: cor, avg: media, highlightLast: true })}<div class="mut" style="font-size:11px;display:flex;gap:12px"><span><i class="dot" style="background:${cor[1]}"></i> Seu apto</span><span>- - Média do prédio</span></div></div>`; };
      return head('Consumo') + block('Água', 'drop', c.agua, c.mediaAgua, c.tarifaAgua, ['#0369a1', '#38bdf8']) + block('Gás', 'flame', c.gas, c.mediaGas, c.tarifaGas, ['#b45309', '#fbbf24']) +
        `<div class="mut" style="font-size:11px;display:flex;gap:6px">${ic('alert')} Água e gás de cada mês entram na cota do mês seguinte (água ${brl(c.tarifaAgua)}/m³, gás ${brl(c.tarifaGas)}/m³).</div>`;
    },
  };

  function showQR(eid) {
    const e = R().encomendas.find((x) => x.id === eid);
    const scroll = bg.querySelector('#res-scroll');
    scroll.innerHTML = `<button class="back" data-r="go" data-s="correspondencias" style="margin:4px 0 8px">${ic('back')} Correspondências</button><div class="res-h">Retirar na portaria</div>
      <div class="foto" style="margin-bottom:12px">${fotoEncomenda(e)}</div><b>${esc(e.descricao)}</b><div class="mut" style="font-size:12px;margin-bottom:14px">${esc(e.local)} · ${esc(e.codigo)}</div>
      <div class="qr" style="width:200px">${qrSVG(e.id + e.pin)}</div><div class="mut" style="text-align:center;font-size:12px;margin:12px 0 6px">ou diga o código</div><div class="pin">${e.pin}</div>`;
    fix();
  }
  function showPix() {
    const at = cotaAtrasada(R()); const x = calcAtraso(at); const code = `00020126580014BR.GOV.BCB.PIX0136condominio${id}${at.id}5204000053039865406${x.total.toFixed(2)}5802BR`;
    bg.querySelector('#res-scroll').innerHTML = `<button class="back" data-r="go" data-s="financeiro" style="margin:4px 0 8px">${ic('back')} Financeiro</button><div class="res-h">Pagar com Pix</div>
      <div style="text-align:center"><div class="mut" style="font-size:12px">Cota de ${at.mes} · com multa e juros</div><div style="font-size:30px;font-weight:800;margin:4px 0 14px">${brl(x.total)}</div><div class="qr">${qrSVG(code)}</div>
      <div class="pix-code" style="margin-top:12px">${code}</div><button class="btn pri block" style="margin-top:12px" id="cp">Copiar código Pix</button><button class="btn block" style="margin-top:8px" data-r="japaguei">Já paguei</button></div>`;
    bg.querySelector('#cp').onclick = () => { navigator.clipboard?.writeText(code); toast('Código Pix copiado'); };
    fix();
  }
  function novoChamado() {
    bg.querySelector('#res-scroll').innerHTML = `<button class="back" data-r="go" data-s="chamados" style="margin:4px 0 8px">${ic('back')} Chamados</button><div class="res-h">Novo chamado</div>
      <form class="form" id="rf"><label>O que aconteceu?<input class="input" name="t" required placeholder="Ex.: Lâmpada do corredor queimada"></label><label>Categoria<select class="input" name="c">${['Hidráulica', 'Elétrica', 'Portaria', 'Convivência', 'Manutenção', 'Garagem', 'Limpeza'].map((x) => `<option>${x}</option>`).join('')}</select></label>
      <label>Foto<input class="input" type="file" accept="image/*" capture="environment"></label><button class="btn pri block">Enviar chamado</button></form>`;
    bg.querySelector('#rf').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; D().ultimoChamado++;
      R().chamados.unshift({ id: `CH-${String(HOJE.getDate()).padStart(2, '0')}${String(HOJE.getMonth() + 1).padStart(2, '0')}-${String(D().ultimoChamado).padStart(3, '0')}`, unidade: id, titulo: f.t.value, categoria: f.c.value, abertoEm: new Date().toISOString(), prazoH: 48, status: 'aberto', comentarios: [] });
      ctx.store.save(); toast('Chamado enviado para a administração'); screen = 'chamados'; chTab = 'aberto'; render(); });
    fix();
  }
  function reservar(espaco) {
    bg.querySelector('#res-scroll').innerHTML = `<button class="back" data-r="go" data-s="reservas" style="margin:4px 0 8px">${ic('back')} Reservas</button><div class="res-h">${esc(espaco)}</div>
      <form class="form" id="rr"><label>Data<input class="input" type="date" name="d" required value="${addDias(new Date(), 2).toISOString().slice(0, 10)}"></label><label>Horário<select class="input" name="h"><option>10h às 14h</option><option>15h às 17h</option><option>19h às 23h</option></select></label><button class="btn pri block">Solicitar reserva</button></form>`;
    bg.querySelector('#rr').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; D().reservas.push({ id: 'R' + Date.now(), espaco, unidade: id, morador: R().nome, data: new Date(f.d.value + 'T12:00').toISOString(), hora: f.h.value, status: 'pendente' }); ctx.store.save(); toast('Reserva solicitada'); screen = 'reservas'; render(); });
    fix();
  }

  function fix() {
    bg.querySelectorAll('#res-scroll svg:not(.chart):not([viewBox^="0 0 300"]):not([viewBox^="-1"])').forEach((s) => { if (!s.closest('.ic') && !s.closest('.foto') && !s.closest('.qr')) s.style.cssText = 'width:15px;height:15px;flex:none;vertical-align:-3px'; });
  }
  function render() { const sc = bg.querySelector('#res-scroll'); sc.innerHTML = SCREENS[screen](); sc.scrollTop = 0; fix(); }
  render();
}
