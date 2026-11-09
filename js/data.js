// Dados de demonstração do CRM. Tudo é gerado de forma determinística (mesma semente),
// e as ações do usuário ficam salvas no localStorage do navegador.

export const CONFIG = {
  condominio: 'Residencial Vista Mar',
  incorporadora: 'Aurora Incorporadora',
  endereco: 'Av. Atlântica, 1200 · Orla',
  entrega: 'mar/2026',
  sindico: 'Helena Duarte',
  // Modelo 3D parametrizado: troque aqui o nº de torres, andares e aptos por andar.
  torres: [
    { id: 'A', nome: 'Torre A', andares: 8, aptosPorAndar: 4 },
    { id: 'B', nome: 'Torre B', andares: 8, aptosPorAndar: 4 },
  ],
  cotaBase: 1421.20,
  multa: 0.02,
  jurosMes: 0.01,
};

export const PLANTAS = {
  P98: {
    id: 'P98', nome: '3 quartos (1 suíte)', area: 98, modelo3d: null, // ex.: 'plantas/P98.glb'
    quartos: 3, suites: 1, vagas: 2, banheiros: 2,
    // Ambientes no plano 10 x 9,8 m (x, z, largura, profundidade), origem no canto superior esquerdo
    ambientes: [
      { nome: 'Suíte', area: 11.6, x: 0, z: 0, w: 3.4, d: 3.4, tipo: 'quarto' },
      { nome: 'Banho da suíte', area: 3.4, x: 3.4, z: 0, w: 1.6, d: 2.0, tipo: 'banho' },
      { nome: 'Quarto 2', area: 8.9, x: 5.0, z: 0, w: 2.5, d: 3.2, tipo: 'quarto' },
      { nome: 'Quarto 3', area: 9.1, x: 7.5, z: 0, w: 2.5, d: 3.2, tipo: 'quarto' },
      { nome: 'Circulação', area: 4.5, x: 3.4, z: 2.0, w: 1.6, d: 1.4, tipo: 'circ' },
      { nome: 'Banho social', area: 3.6, x: 0, z: 3.4, w: 2.0, d: 1.6, tipo: 'banho' },
      { nome: 'Cozinha', area: 10.3, x: 0, z: 5.0, w: 3.4, d: 3.0, tipo: 'cozinha' },
      { nome: 'Área de serviço', area: 3.2, x: 0, z: 8.0, w: 3.4, d: 1.8, tipo: 'servico' },
      { nome: 'Estar / Jantar', area: 27.4, x: 3.4, z: 3.4, w: 6.6, d: 4.4, tipo: 'estar' },
      { nome: 'Varanda gourmet', area: 10.4, x: 3.4, z: 7.8, w: 6.6, d: 2.0, tipo: 'varanda' },
    ],
  },
  P74: {
    id: 'P74', nome: '2 quartos (1 suíte)', area: 74, modelo3d: null, // ex.: 'plantas/P74.glb'
    quartos: 2, suites: 1, vagas: 1, banheiros: 2,
    ambientes: [
      { nome: 'Suíte', area: 10.8, x: 0, z: 0, w: 3.4, d: 3.2, tipo: 'quarto' },
      { nome: 'Banho da suíte', area: 3.2, x: 3.4, z: 0, w: 1.6, d: 2.0, tipo: 'banho' },
      { nome: 'Quarto 2', area: 8.4, x: 5.0, z: 0, w: 3.0, d: 2.8, tipo: 'quarto' },
      { nome: 'Banho social', area: 3.0, x: 3.4, z: 2.0, w: 1.6, d: 1.6, tipo: 'banho' },
      { nome: 'Cozinha', area: 8.6, x: 0, z: 3.2, w: 2.8, d: 3.0, tipo: 'cozinha' },
      { nome: 'Área de serviço', area: 2.6, x: 0, z: 6.2, w: 2.8, d: 1.4, tipo: 'servico' },
      { nome: 'Estar / Jantar', area: 22.0, x: 2.8, z: 3.6, w: 5.2, d: 4.0, tipo: 'estar' },
      { nome: 'Varanda', area: 6.8, x: 2.8, z: 7.6, w: 5.2, d: 1.6, tipo: 'varanda' },
    ],
  },
};

// ---------- utilidades ----------
let seed = 20261109;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const randInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));

export const HOJE = new Date(); HOJE.setHours(12, 0, 0, 0);
export const addDias = (d, n) => new Date(new Date(d).getTime() + n * 864e5);
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const NOMES = ['Rafael Tavares', 'Mariana Lopes', 'Carlos Menezes', 'Juliana Ribeiro', 'Felipe Nogueira', 'Beatriz Almeida', 'Gustavo Carvalho', 'Larissa Pinto', 'Thiago Moura', 'Camila Fontes', 'Rodrigo Sales', 'Patrícia Gomes', 'André Barros', 'Fernanda Rocha', 'Vinícius Prado', 'Natália Martins', 'Bruno Teixeira', 'Isabela Cardoso', 'Leonardo Dias', 'Aline Castro', 'Marcelo Freitas', 'Renata Vieira', 'Eduardo Cunha', 'Gabriela Souza', 'Daniel Araújo', 'Letícia Ramos', 'Pedro Henrique Lima', 'Sofia Mendes', 'Lucas Batista', 'Vanessa Lacerda', 'Otávio Reis', 'Priscila Duarte', 'Henrique Farias', 'Tatiane Moreira', 'Matheus Correia', 'Carolina Pires', 'Joaquim Azevedo', 'Elaine Monteiro', 'Ricardo Peixoto', 'Bianca Leal', 'Samuel Brito', 'Débora Campos', 'Fábio Rezende', 'Luana Siqueira', 'Caio Fernandes', 'Mônica Viana', 'Igor Matos', 'Jéssica Andrade'];
const PRIM = ['Ana', 'Bruno', 'Clara', 'Davi', 'Elisa', 'Fabrício', 'Giovana', 'Hugo', 'Ingrid', 'João', 'Karina', 'Luís', 'Melissa', 'Nicolas', 'Olívia', 'Paulo', 'Raquel', 'Sérgio', 'Talita', 'Vitor'];
const SOBR = ['Moraes', 'Cavalcanti', 'Rangel', 'Bastos', 'Quintela', 'Arruda', 'Bezerra', 'Lacerda', 'Tavora', 'Esteves', 'Guimarães', 'Pacheco', 'Sampaio'];
const nomeLead = (i) => `${PRIM[i % PRIM.length]} ${SOBR[(i * 5 + 3) % SOBR.length]}`;
export const CORRETORES = [
  { id: 'c1', nome: 'Paulo Costa', foto: 'PC', cor: '#8b5cf6' },
  { id: 'c2', nome: 'Ana Ferraz', foto: 'AF', cor: '#ec4899' },
  { id: 'c3', nome: 'Diego Lemos', foto: 'DL', cor: '#06b6d4' },
  { id: 'c4', nome: 'Marina Queiroz', foto: 'MQ', cor: '#f59e0b' },
  { id: 'c5', nome: 'Júlio Antunes', foto: 'JA', cor: '#22c55e' },
];
const TRANSPORTADORAS = [
  { nome: 'Amazon', tipo: 'envelope' }, { nome: 'Mercado Livre', tipo: 'caixa' }, { nome: 'Shopee', tipo: 'saco' },
  { nome: 'Magalu', tipo: 'caixa' }, { nome: 'Correios', tipo: 'envelope' }, { nome: 'iFood', tipo: 'sacola' }, { nome: 'Americanas', tipo: 'caixa' },
];
const CHAMADOS_TIPOS = [
  { titulo: 'Vazamento no cano da cozinha', cat: 'Hidráulica', prazoH: 24 },
  { titulo: 'Lâmpada queimada no corredor', cat: 'Elétrica', prazoH: 48 },
  { titulo: 'Interfone sem áudio', cat: 'Portaria', prazoH: 48 },
  { titulo: 'Barulho após 22h no andar de cima', cat: 'Convivência', prazoH: 72 },
  { titulo: 'Infiltração no teto do banheiro', cat: 'Hidráulica', prazoH: 48 },
  { titulo: 'Portão da garagem lento', cat: 'Manutenção', prazoH: 72 },
  { titulo: 'Vaga ocupada por outro morador', cat: 'Garagem', prazoH: 24 },
];

// ---------- geração ----------
function gerar() {
  seed = 20261109;
  const units = [];
  const residentes = {};
  const clientes = [];
  let nomeIdx = 1;

  for (const t of CONFIG.torres) {
    for (let f = 1; f <= t.andares; f++) {
      for (let n = 1; n <= t.aptosPorAndar; n++) {
        const planta = (n === 1 || n === t.aptosPorAndar) ? 'P98' : 'P74';
        const area = PLANTAS[planta].area;
        const frente = n <= Math.ceil(t.aptosPorAndar / 2);
        const m2 = 14200 + f * 160 + (frente ? 650 : 0) + (t.id === 'B' ? -300 : 0);
        const preco = Math.round((area * m2) / 1000) * 1000;
        const num = f * 100 + n;
        units.push({
          id: `${t.id}-${num}`, torre: t.id, andar: f, pos: n, numero: String(num), planta, area, preco,
          posicao: frente ? 'Frente mar' : 'Fundos', status: 'disponivel', clienteId: null, corretorId: null,
        });
      }
    }
  }

  // Distribui status de vendas (≈ 55% vendido, 10% reservado, 5% bloqueado)
  for (const u of units) {
    const r = rnd();
    u.status = r < 0.55 ? 'vendido' : r < 0.65 ? 'reservado' : r < 0.70 ? 'bloqueado' : 'disponivel';
  }
  const destaque = units.find((u) => u.id === 'A-501');
  destaque.status = 'vendido';
  units.find((u) => u.id === 'A-801').status = 'disponivel';
  units.find((u) => u.id === 'A-702').status = 'disponivel';

  // Moradores para unidades vendidas
  for (const u of units.filter((x) => x.status === 'vendido')) {
    const semMorador = u.id !== 'A-501' && rnd() < 0.15;
    const corretor = pick(CORRETORES);
    u.corretorId = corretor.id;
    const nome = u.id === 'A-501' ? NOMES[0] : NOMES[1 + ((nomeIdx++ - 1) % (NOMES.length - 1))];
    const mesVenda = randInt(0, 10);
    const dataVenda = addDias(HOJE, -(30 * (mesVenda + 1) + randInt(0, 25)));
    u.dataVenda = dataVenda.toISOString();
    u.valorVenda = Math.round(u.preco * (1 - randInt(0, 5) / 100));
    if (semMorador) { u.semMorador = true; u.proprietario = nome; continue; }

    const r = {
      id: u.id, nome, iniciais: nome.split(' ').map((p) => p[0]).slice(0, 2).join(''),
      telefone: `(48) 9${randInt(8000, 9999)}-${randInt(1000, 9999)}`,
      email: nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '.') + '@exemplo.com.br',
      moradores: randInt(1, 4), pets: randInt(0, 2), vaga: `G${randInt(1, 2)}-${randInt(10, 40)}`,
      desde: `${MES_CURTO[randInt(2, 8)]}/2026`, tipo: rnd() < 0.8 ? 'proprietário' : 'inquilino',
      encomendas: [], chamados: [], cotas: [], historico: [], consumo: null,
    };
    // Encomendas
    const qtdEnc = rnd() < 0.55 ? 0 : rnd() < 0.7 ? 1 : randInt(2, 3);
    for (let i = 0; i < qtdEnc; i++) r.encomendas.push(novaEncomenda(u, i));
    for (let i = 0; i < randInt(1, 3); i++) {
      const e = novaEncomenda(u, 10 + i); e.status = 'retirada'; e.retiradaEm = addDias(HOJE, -randInt(1, 20)).toISOString();
      e.retiradaPor = rnd() < 0.7 ? nome.split(' ')[0] : 'Ana (diarista)'; r.encomendas.push(e);
    }
    // Chamados
    if (rnd() < 0.3) r.chamados.push(novoChamado(u, pick(CHAMADOS_TIPOS), randInt(2, 70)));
    if (rnd() < 0.4) { const c = novoChamado(u, pick(CHAMADOS_TIPOS), randInt(80, 300)); c.status = 'concluido'; r.chamados.push(c); }
    // Cotas
    const atrasado = rnd() < 0.07;
    r.cotas = gerarCotas(atrasado ? randInt(5, 45) : 0);
    // Consumo
    r.consumo = gerarConsumo();
    r.historico = [
      { data: u.dataVenda, texto: `Comprou com ${corretor.nome}` },
      { data: addDias(new Date(u.dataVenda), 20).toISOString(), texto: 'Assinou o contrato de compra e venda' },
      { data: new Date(2026, 2, 15).toISOString(), texto: 'Recebeu as chaves' },
      { data: new Date(2026, 3, 2).toISOString(), texto: 'Cadastro de moradores e vaga atualizado' },
    ];
    residentes[u.id] = r;
  }

  // Ajustes do morador de destaque (exatamente como no vídeo)
  const raf = residentes['A-501'];
  Object.assign(raf, { moradores: 4, pets: 1, vaga: 'G1-14', desde: 'jul/2026', tipo: 'proprietário', telefone: '(48) 99176-5694' });
  raf.encomendas = [
    { ...novaEncomenda(destaque, 0), transportadora: 'Amazon', tipo: 'envelope', descricao: 'Amazon envelope', local: 'Portaria · prateleira P2', chegou: addDias(HOJE, -0.15).toISOString(), codigo: 'ENC-1043' },
    { ...novaEncomenda(destaque, 1), transportadora: 'Mercado Livre', tipo: 'caixa', descricao: 'Caixa pequena · para Rafael', local: 'Portaria · armário A-07', chegou: addDias(HOJE, -0.5).toISOString(), codigo: 'ENC-1041' },
    { ...novaEncomenda(destaque, 2), transportadora: 'Amazon', tipo: 'envelope', descricao: 'Amazon envelope', local: 'Portaria', status: 'retirada', chegou: addDias(HOJE, -8).toISOString(), retiradaEm: addDias(HOJE, -7).toISOString(), retiradaPor: 'Ana' },
  ];
  raf.chamados = [{ ...novoChamado(destaque, CHAMADOS_TIPOS[0], 26), id: 'CH-2611-018' }];
  raf.cotas = gerarCotas(24);

  // Clientes (funil de vendas)
  const etapas = ['novo', 'contato', 'visita', 'proposta', 'fechado'];
  const origens = ['Instagram', 'Site', 'Indicação', 'Plantão', 'Portal imobiliário', 'WhatsApp'];
  for (let i = 0; i < 26; i++) {
    const nome = nomeLead(i);
    const etapa = i < 7 ? 'novo' : i < 13 ? 'contato' : i < 18 ? 'visita' : i < 23 ? 'proposta' : 'fechado';
    const disp = units.filter((u) => u.status !== 'vendido');
    const interesse = pick(disp);
    clientes.push({
      id: 'cl' + i, nome, telefone: `(48) 9${randInt(8000, 9999)}-${randInt(1000, 9999)}`, origem: pick(origens), etapa,
      corretorId: pick(CORRETORES).id, interesse: interesse.id, criado: addDias(HOJE, -randInt(1, 60)).toISOString(),
      orcamento: Math.round(interesse.preco * (0.9 + rnd() * 0.2) / 1000) * 1000, temperatura: pick(['quente', 'morno', 'frio']),
    });
  }
  // Reservados ligados a clientes
  units.filter((u) => u.status === 'reservado').forEach((u, i) => { const c = clientes[13 + (i % 10)]; u.clienteId = c.id; u.corretorId = c.corretorId; u.reservaAte = addDias(HOJE, randInt(1, 6)).toISOString(); });

  // Propostas
  const propostas = [];
  const stProp = ['enviada', 'enviada', 'em_analise', 'em_analise', 'aprovada', 'aprovada', 'recusada'];
  clientes.filter((c) => c.etapa === 'proposta' || c.etapa === 'fechado').slice(0, 7).forEach((c, i) => {
    const u = units.find((x) => x.id === c.interesse);
    const desc = randInt(0, 5);
    propostas.push({ id: 'PR-' + (412 + i), clienteId: c.id, unidadeId: u.id, valorTabela: u.preco, desconto: desc, valorFinal: Math.round(u.preco * (1 - desc / 100)), status: stProp[i], data: addDias(HOJE, -randInt(0, 14)).toISOString(), corretorId: c.corretorId, entrada: 20, parcelas: 60 });
  });

  // Visitantes
  const visitantes = [
    { nome: 'Entregador iFood', tipo: 'Entregador', destino: 'A-302', hora: '11:42', status: 'aguardando', doc: '—' },
    { nome: 'Gustavo Carvalho', tipo: 'Visitante', destino: 'B-604', hora: '10:15', status: 'no_predio', doc: 'RG ··· 4421' },
    { nome: 'Clima Frio Ar-Condicionado', tipo: 'Prestador', destino: 'A-702', hora: '09:30', status: 'no_predio', doc: 'CNPJ ··· 0001' },
    { nome: 'Joana Martins (diarista)', tipo: 'Prestador', destino: 'A-501', hora: '08:05', status: 'saiu', doc: 'RG ··· 1180' },
    { nome: 'Técnico Vivo Fibra', tipo: 'Prestador', destino: 'B-203', hora: '14:00', status: 'agendado', doc: '—' },
  ];

  // Reservas de áreas comuns
  const reservas = [
    { id: 'R1', espaco: 'Brinquedoteca', unidade: 'A-501', morador: 'Rafael Tavares', data: addDias(HOJE, 1).toISOString(), hora: '15h às 17h', status: 'confirmada' },
    { id: 'R2', espaco: 'Salão de festas', unidade: 'B-402', morador: '', data: addDias(HOJE, 3).toISOString(), hora: '19h às 23h', status: 'confirmada' },
    { id: 'R3', espaco: 'Churrasqueira', unidade: 'A-304', morador: '', data: addDias(HOJE, 5).toISOString(), hora: '12h às 17h', status: 'pendente' },
    { id: 'R4', espaco: 'Espaço gourmet', unidade: 'B-701', morador: '', data: addDias(HOJE, 0).toISOString(), hora: '20h às 23h', status: 'confirmada' },
  ];
  reservas.forEach((r) => { if (!r.morador) r.morador = residentes[r.unidade]?.nome || 'Morador'; });

  const comunicados = [
    { id: 'M1', titulo: 'Assembleia geral ordinária', texto: 'Dia 20/11 às 19h30 no salão de festas. Pauta: previsão orçamentária 2027 e regimento interno.', autor: CONFIG.sindico, data: addDias(HOJE, -2).toISOString(), tag: 'Novo' },
    { id: 'M2', titulo: 'Limpeza das caixas d’água', texto: 'Quinta-feira, das 8h às 14h. Haverá interrupção do abastecimento.', autor: 'Administração', data: addDias(HOJE, -5).toISOString(), tag: 'Aviso' },
    { id: 'M3', titulo: 'Nova regra de encomendas', texto: 'Volumes parados há mais de 7 dias serão devolvidos ao remetente.', autor: 'Portaria', data: addDias(HOJE, -11).toISOString(), tag: 'Regra' },
  ];

  const documentos = [
    { nome: 'Convenção do condomínio', tipo: 'PDF', tam: '1,2 MB' },
    { nome: 'Regimento interno', tipo: 'PDF', tam: '640 KB' },
    { nome: 'Ata da última assembleia', tipo: 'PDF', tam: '310 KB' },
    { nome: 'Previsão orçamentária 2026', tipo: 'XLSX', tam: '88 KB' },
    { nome: 'Manual do proprietário', tipo: 'PDF', tam: '4,8 MB' },
  ];

  const vendasMes = [3, 5, 2, 6, 4, 3, 5, 2, 4, 3, 2].map((v, i) => ({ mes: MES_CURTO[(HOJE.getMonth() - 10 + i + 12) % 12], v }));

  return { units, residentes, clientes, propostas, visitantes, reservas, comunicados, documentos, vendasMes, ultimoChamado: 30 };

  function novaEncomenda(u, i) {
    const t = pick(TRANSPORTADORAS);
    return {
      id: `E-${u.id}-${i}-${randInt(100, 999)}`, unidade: u.id, transportadora: t.nome, tipo: t.tipo,
      descricao: `${t.nome} ${t.tipo}`, local: `Portaria · ${rnd() < 0.5 ? 'armário ' + pick(['A', 'B', 'C']) + '-' + String(randInt(1, 12)).padStart(2, '0') : 'prateleira P' + randInt(1, 4)}`,
      chegou: addDias(HOJE, -rnd() * 5).toISOString(), codigo: 'ENC-' + randInt(1000, 1099), status: 'portaria', avisado: rnd() < 0.5,
      pin: String(randInt(1000, 9999)),
    };
  }
  function novoChamado(u, tipo, horasAtras) {
    const aberto = addDias(HOJE, -horasAtras / 24);
    return { id: `CH-${randInt(2600, 2699)}-${String(randInt(1, 99)).padStart(3, '0')}`, unidade: u.id, titulo: tipo.titulo, categoria: tipo.cat, abertoEm: aberto.toISOString(), prazoH: tipo.prazoH, status: 'aberto', comentarios: [] };
  }
  function gerarCotas(diasAtraso) {
    const cotas = [];
    const valores = [1239.0, 1239.0, 1347.04, 1423.88, CONFIG.cotaBase, 1418.58];
    for (let i = 5; i >= 0; i--) {
      // i=0 é o mês corrente (a vencer), i=1 o mês anterior...
      const venc = new Date(HOJE.getFullYear(), HOJE.getMonth() - i, 10, 12);
      const mesRef = venc;
      const c = { id: `COTA-${mesRef.getFullYear()}-${mesRef.getMonth() + 1}`, mes: MESES[mesRef.getMonth()], ano: mesRef.getFullYear(), valor: valores[5 - i] ?? CONFIG.cotaBase, vencimento: venc.toISOString(), status: 'pago', pagoEm: addDias(venc, -randInt(0, 4)).toISOString() };
      if (venc > HOJE) { c.status = 'a_vencer'; delete c.pagoEm; }
      cotas.push(c);
    }
    cotas.reverse(); // mais recente primeiro
    if (diasAtraso > 0) {
      // a cota vencida mais recente fica em atraso
      const c = cotas.find((x) => x.status === 'pago');
      c.status = 'atrasado'; delete c.pagoEm; c.vencimento = addDias(HOJE, -diasAtraso).toISOString(); c.valor = CONFIG.cotaBase;
    }
    return cotas;
  }
  function gerarConsumo() {
    const agua = [], gas = [];
    for (let i = 7; i >= 0; i--) {
      const m = MES_CURTO[(HOJE.getMonth() - i - 1 + 24) % 12];
      agua.push({ mes: m, v: +(8 + rnd() * 6).toFixed(1) });
      gas.push({ mes: m, v: +(2 + rnd() * 3).toFixed(1) });
    }
    return { agua, gas, mediaAgua: 10.8, mediaGas: 3.5, tarifaAgua: 12.40, tarifaGas: 9.80 };
  }
}

// ---------- store com persistência ----------
const KEY = 'crm-condominio-v1';
export const store = (() => {
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch { data = null; }
  if (!data || data.versao !== 4) { data = gerar(); data.versao = 4; }
  return {
    get d() { return data; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} },
    reset() { localStorage.removeItem(KEY); data = gerar(); data.versao = 4; this.save(); },
  };
})();

// ---------- regras de negócio ----------
export const brl = (v, dec = 2) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const brlCurto = (v) => v >= 1e6 ? 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi' : v >= 1e3 ? 'R$ ' + (v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mil' : brl(v);
export const dataBR = (iso, opt = {}) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', ...opt });
export const horaBR = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const diasEntre = (a, b = HOJE) => Math.floor((new Date(b) - new Date(a)) / 864e5);
export const haQuanto = (iso) => {
  const h = (Date.now() - new Date(iso)) / 36e5;
  if (h < 1) return `há ${Math.max(1, Math.round(h * 60))} min`;
  if (h < 24) return `há ${Math.round(h)} h`;
  const d = Math.round(h / 24); return d === 1 ? 'ontem' : `há ${d} dias`;
};

export function calcAtraso(cota) {
  const dias = Math.max(0, diasEntre(cota.vencimento));
  const multa = +(cota.valor * CONFIG.multa).toFixed(2);
  const juros = +(cota.valor * CONFIG.jurosMes * dias / 30).toFixed(2);
  return { dias, multa, juros, total: +(cota.valor + multa + juros).toFixed(2) };
}
export const cotaAtrasada = (r) => r?.cotas.find((c) => c.status === 'atrasado');
export const encPortaria = (r) => (r?.encomendas || []).filter((e) => e.status === 'portaria');
export const chamadosAbertos = (r) => (r?.chamados || []).filter((c) => c.status !== 'concluido');
export const chamadoForaPrazo = (c) => c.status !== 'concluido' && (Date.now() - new Date(c.abertoEm)) / 36e5 > c.prazoH;
export const unidadeLabel = (id) => { const [t, n] = id.split('-'); return CONFIG.torres.length > 1 ? `Apto ${n} · Torre ${t}` : `Apto ${n}`; };
export const unidadeCurta = (id) => { const [t, n] = id.split('-'); return CONFIG.torres.length > 1 ? `${t}-${n}` : n; };

export const STATUS_VENDA = {
  disponivel: { label: 'Disponível', cor: '#22c55e' },
  reservado: { label: 'Reservado', cor: '#f5b20b' },
  vendido: { label: 'Vendido', cor: '#ef4444' },
  bloqueado: { label: 'Bloqueado', cor: '#64748b' },
};
