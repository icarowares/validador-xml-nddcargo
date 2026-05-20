export interface FormaConstituicaoEntry {
  codigo: string;   // ex: "101-5"
  descricao: string;
}

// Natureza Jurídica (IBGE / RFB) aceita pelo layout NDD Cargo
export const FORMAS_CONSTITUICAO: FormaConstituicaoEntry[] = [
  // ── Administração Pública (1xx) ──────────────────────────────────────────────
  { codigo: '101-5', descricao: 'Órgão Público do Poder Executivo Federal' },
  { codigo: '102-3', descricao: 'Órgão Público do Poder Executivo Estadual ou do Distrito Federal' },
  { codigo: '103-1', descricao: 'Órgão Público do Poder Executivo Municipal' },
  { codigo: '104-0', descricao: 'Órgão Público do Poder Legislativo Federal' },
  { codigo: '105-8', descricao: 'Órgão Público do Poder Legislativo Estadual ou do Distrito Federal' },
  { codigo: '106-6', descricao: 'Órgão Público do Poder Legislativo Municipal' },
  { codigo: '107-4', descricao: 'Órgão Público do Poder Judiciário Federal' },
  { codigo: '108-2', descricao: 'Órgão Público do Poder Judiciário Estadual' },
  { codigo: '110-4', descricao: 'Autarquia Federal' },
  { codigo: '111-2', descricao: 'Autarquia Estadual ou do Distrito Federal' },
  { codigo: '112-0', descricao: 'Autarquia Municipal' },
  { codigo: '113-9', descricao: 'Fundação Federal' },
  { codigo: '114-7', descricao: 'Fundação Estadual ou do Distrito Federal' },
  { codigo: '115-5', descricao: 'Fundação Municipal' },
  { codigo: '116-3', descricao: 'Órgão Público Autônomo Federal' },
  { codigo: '117-1', descricao: 'Órgão Público Autônomo Estadual ou do Distrito Federal' },
  { codigo: '118-0', descricao: 'Órgão Público Autônomo Municipal' },
  { codigo: '119-8', descricao: 'Comissão Polinacional' },
  { codigo: '120-1', descricao: 'Fundo Público' },
  { codigo: '121-0', descricao: 'Associação Pública' },

  // ── Entidades Empresariais (2xx) ─────────────────────────────────────────────
  { codigo: '201-1', descricao: 'Empresa Pública' },
  { codigo: '203-8', descricao: 'Sociedade de Economia Mista' },
  { codigo: '204-6', descricao: 'Sociedade Anônima Aberta' },
  { codigo: '205-4', descricao: 'Sociedade Anônima Fechada' },
  { codigo: '206-2', descricao: 'Sociedade Empresária Limitada' },
  { codigo: '207-0', descricao: 'Sociedade Empresária em Nome Coletivo' },
  { codigo: '208-9', descricao: 'Sociedade Empresária em Comandita Simples' },
  { codigo: '209-7', descricao: 'Sociedade Empresária em Comandita por Ações' },
  { codigo: '212-7', descricao: 'Sociedade em Conta de Participação' },
  { codigo: '213-5', descricao: 'Empresário (Individual)' },
  { codigo: '214-3', descricao: 'Cooperativa' },
  { codigo: '215-1', descricao: 'Consórcio de Sociedades' },
  { codigo: '216-0', descricao: 'Grupo de Sociedades' },
  { codigo: '217-8', descricao: 'Estabelecimento, no Brasil, de Sociedade Estrangeira' },
  { codigo: '219-4', descricao: 'Estabelecimento, no Brasil, de Empresa Binacional Argentino-Brasileira' },
  { codigo: '221-6', descricao: 'Empresa Domiciliada no Exterior' },
  { codigo: '222-4', descricao: 'Clube/Fundo de Investimento' },
  { codigo: '223-2', descricao: 'Sociedade Simples Pura' },
  { codigo: '224-0', descricao: 'Sociedade Simples Limitada' },
  { codigo: '225-9', descricao: 'Sociedade Simples em Nome Coletivo' },
  { codigo: '226-7', descricao: 'Sociedade Simples em Comandita Simples' },
  { codigo: '227-5', descricao: 'Empresa Binacional' },
  { codigo: '228-3', descricao: 'Consórcio de Empregadores' },
  { codigo: '229-1', descricao: 'Consórcio Simples' },
  { codigo: '230-5', descricao: 'Empresa Individual de Responsabilidade Limitada (de Natureza Empresária)' },
  { codigo: '231-3', descricao: 'Empresa Individual de Responsabilidade Limitada (de Natureza Simples)' },

  // ── Entidades sem Fins Lucrativos (3xx) ──────────────────────────────────────
  { codigo: '303-4', descricao: 'Serviço Notarial e Registral (Cartório)' },
  { codigo: '306-9', descricao: 'Fundação Privada' },
  { codigo: '307-7', descricao: 'Serviço Social Autônomo' },
  { codigo: '308-5', descricao: 'Condomínio Edilício' },
  { codigo: '310-7', descricao: 'Comissão de Conciliação Prévia' },
  { codigo: '311-5', descricao: 'Entidade de Mediação e Arbitragem' },
  { codigo: '312-3', descricao: 'Partido Político' },
  { codigo: '313-1', descricao: 'Entidade Sindical' },
  { codigo: '320-4', descricao: 'Estabelecimento, no Brasil, de Fundação ou Associação Estrangeiras' },
  { codigo: '321-2', descricao: 'Fundação ou Associação domiciliada no exterior' },
  { codigo: '322-0', descricao: 'Organização Religiosa' },
  { codigo: '323-9', descricao: 'Comunidade Indígena' },
  { codigo: '324-7', descricao: 'Fundo Privado' },
  { codigo: '399-9', descricao: 'Associação Privada' },

  // ── Pessoas Físicas (4xx) ────────────────────────────────────────────────────
  { codigo: '401-4', descricao: 'Empresa Individual Imobiliária' },
  { codigo: '408-1', descricao: 'Contribuinte Individual' },
  { codigo: '409-0', descricao: 'Candidato a Cargo Político Eletivo' },

  // ── Organizações Internacionais e Outras (5xx) ───────────────────────────────
  { codigo: '501-0', descricao: 'Organização Internacional' },
  { codigo: '502-9', descricao: 'Representação Diplomática Estrangeira' },
  { codigo: '503-7', descricao: 'Outras Instituições Extraterritoriais' },
];

/** Set de códigos válidos para lookup O(1) */
export const VALID_FORMA_CONSTITUICAO = new Set(FORMAS_CONSTITUICAO.map(e => e.codigo));

/** Grupos para exibição na subpágina */
export interface GrupoForma {
  prefixo: string;
  nome: string;
  entradas: FormaConstituicaoEntry[];
}

const GRUPOS_DEF: { prefixo: string; nome: string; min: number; max: number }[] = [
  { prefixo: '1xx', nome: 'Administração Pública',                          min: 100, max: 199 },
  { prefixo: '2xx', nome: 'Entidades Empresariais',                         min: 200, max: 299 },
  { prefixo: '3xx', nome: 'Entidades sem Fins Lucrativos',                  min: 300, max: 399 },
  { prefixo: '4xx', nome: 'Pessoas Físicas',                                min: 400, max: 499 },
  { prefixo: '5xx', nome: 'Organizações Internacionais e Outras',           min: 500, max: 599 },
];

export const GRUPOS_FORMA: GrupoForma[] = GRUPOS_DEF.map(g => ({
  prefixo: g.prefixo,
  nome: g.nome,
  entradas: FORMAS_CONSTITUICAO.filter(e => {
    const n = parseInt(e.codigo.replace('-', ''), 10);
    // o número sem dígito verificador para fins de agrupamento
    const base = parseInt(e.codigo.split('-')[0], 10);
    return base >= g.min && base <= g.max;
  }),
}));
