export interface AtividadePrincipalEntry {
  codigo: number;
  descricao: string;
}

// Seções CNAE (divisões) aceitas pelo layout NDD Cargo
export const ATIVIDADES_PRINCIPAIS: AtividadePrincipalEntry[] = [
  // ── A — Agricultura, Pecuária, Produção Florestal, Pesca e Aqüicultura ───────
  {  codigo:  1, descricao: 'AGRICULTURA, PECUÁRIA E SERVIÇOS RELACIONADOS' },
  {  codigo:  2, descricao: 'PRODUÇÃO FLORESTAL' },
  {  codigo:  3, descricao: 'PESCA E AQÜICULTURA' },

  // ── B — Indústrias Extrativas ────────────────────────────────────────────────
  {  codigo:  5, descricao: 'EXTRAÇÃO DE CARVÃO MINERAL' },
  {  codigo:  6, descricao: 'EXTRAÇÃO DE PETRÓLEO E GÁS NATURAL' },
  {  codigo:  7, descricao: 'EXTRAÇÃO DE MINERAIS METÁLICOS' },
  {  codigo:  8, descricao: 'EXTRAÇÃO DE MINERAIS NÃO-METÁLICOS' },
  {  codigo:  9, descricao: 'ATIVIDADES DE APOIO À EXTRAÇÃO DE MINERAIS' },

  // ── C — Indústrias de Transformação ─────────────────────────────────────────
  { codigo: 10, descricao: 'FABRICAÇÃO DE PRODUTOS ALIMENTÍCIOS' },
  { codigo: 11, descricao: 'FABRICAÇÃO DE BEBIDAS' },
  { codigo: 12, descricao: 'FABRICAÇÃO DE PRODUTOS DO FUMO' },
  { codigo: 13, descricao: 'FABRICAÇÃO DE PRODUTOS TÊXTEIS' },
  { codigo: 14, descricao: 'CONFECÇÃO DE ARTIGOS DO VESTUÁRIO E ACESSÓRIOS' },
  { codigo: 15, descricao: 'PREPARAÇÃO DE COUROS E FABRICAÇÃO DE ARTEFATOS DE COURO, ARTIGOS PARA VIAGEM E CALÇADOS' },
  { codigo: 16, descricao: 'FABRICAÇÃO DE PRODUTOS DE MADEIRA' },
  { codigo: 17, descricao: 'FABRICAÇÃO DE CELULOSE, PAPEL E PRODUTOS DE PAPEL' },
  { codigo: 18, descricao: 'IMPRESSÃO E REPRODUÇÃO DE GRAVAÇÕES' },
  { codigo: 19, descricao: 'FABRICAÇÃO DE COQUE, DE PRODUTOS DERIVADOS DO PETRÓLEO E DE BIOCOMBUSTÍVEIS' },
  { codigo: 20, descricao: 'FABRICAÇÃO DE PRODUTOS QUÍMICOS' },
  { codigo: 21, descricao: 'FABRICAÇÃO DE PRODUTOS FARMOQUÍMICOS E FARMACÊUTICOS' },
  { codigo: 22, descricao: 'FABRICAÇÃO DE PRODUTOS DE BORRACHA E DE MATERIAL PLÁSTICO' },
  { codigo: 23, descricao: 'FABRICAÇÃO DE PRODUTOS DE MINERAIS NÃO-METÁLICOS' },
  { codigo: 24, descricao: 'METALURGIA' },
  { codigo: 25, descricao: 'FABRICAÇÃO DE PRODUTOS DE METAL, EXCETO MÁQUINAS E EQUIPAMENTOS' },
  { codigo: 26, descricao: 'FABRICAÇÃO DE EQUIPAMENTOS DE INFORMÁTICA, PRODUTOS ELETRÔNICOS E ÓPTICOS' },
  { codigo: 27, descricao: 'FABRICAÇÃO DE MÁQUINAS, APARELHOS E MATERIAIS ELÉTRICOS' },
  { codigo: 28, descricao: 'FABRICAÇÃO DE MÁQUINAS E EQUIPAMENTOS' },
  { codigo: 29, descricao: 'FABRICAÇÃO DE VEÍCULOS AUTOMOTORES, REBOQUES E CARROCERIAS' },
  { codigo: 30, descricao: 'FABRICAÇÃO DE OUTROS EQUIPAMENTOS DE TRANSPORTE, EXCETO VEÍCULOS AUTOMOTORES' },
  { codigo: 31, descricao: 'FABRICAÇÃO DE MÓVEIS' },
  { codigo: 32, descricao: 'FABRICAÇÃO DE PRODUTOS DIVERSOS' },
  { codigo: 33, descricao: 'MANUTENÇÃO, REPARAÇÃO E INSTALAÇÃO DE MÁQUINAS E EQUIPAMENTOS' },

  // ── D — Eletricidade e Gás ───────────────────────────────────────────────────
  { codigo: 35, descricao: 'ELETRICIDADE, GÁS E OUTRAS UTILIDADES' },

  // ── E — Água, Esgoto e Resíduos ──────────────────────────────────────────────
  { codigo: 36, descricao: 'CAPTAÇÃO, TRATAMENTO E DISTRIBUIÇÃO DE ÁGUA' },
  { codigo: 37, descricao: 'ESGOTO E ATIVIDADES RELACIONADAS' },
  { codigo: 38, descricao: 'COLETA, TRATAMENTO E DISPOSIÇÃO DE RESÍDUOS; RECUPERAÇÃO DE MATERIAIS' },
  { codigo: 39, descricao: 'DESCONTAMINAÇÃO E OUTROS SERVIÇOS DE GESTÃO DE RESÍDUOS' },

  // ── F — Construção ───────────────────────────────────────────────────────────
  { codigo: 41, descricao: 'CONSTRUÇÃO DE EDIFÍCIOS' },
  { codigo: 42, descricao: 'OBRAS DE INFRA-ESTRUTURA' },
  { codigo: 43, descricao: 'SERVIÇOS ESPECIALIZADOS PARA CONSTRUÇÃO' },

  // ── G — Comércio e Reparação de Veículos ─────────────────────────────────────
  { codigo: 45, descricao: 'COMÉRCIO E REPARAÇÃO DE VEÍCULOS AUTOMOTORES E MOTOCICLETAS' },
  { codigo: 46, descricao: 'COMÉRCIO POR ATACADO, EXCETO VEÍCULOS AUTOMOTORES E MOTOCICLETAS' },
  { codigo: 47, descricao: 'COMÉRCIO VAREJISTA' },

  // ── H — Transporte, Armazenagem e Correio ────────────────────────────────────
  { codigo: 49, descricao: 'TRANSPORTE TERRESTRE' },
  { codigo: 50, descricao: 'TRANSPORTE AQUAVIÁRIO' },
  { codigo: 51, descricao: 'TRANSPORTE AÉREO' },
  { codigo: 52, descricao: 'ARMAZENAMENTO E ATIVIDADES AUXILIARES DOS TRANSPORTES' },
  { codigo: 53, descricao: 'CORREIO E OUTRAS ATIVIDADES DE ENTREGA' },

  // ── I — Alojamento e Alimentação ─────────────────────────────────────────────
  { codigo: 55, descricao: 'ALOJAMENTO' },
  { codigo: 56, descricao: 'ALIMENTAÇÃO' },

  // ── J — Informação e Comunicação ─────────────────────────────────────────────
  { codigo: 58, descricao: 'EDIÇÃO E EDIÇÃO INTEGRADA À IMPRESSÃO' },
  { codigo: 59, descricao: 'ATIVIDADES CINEMATOGRÁFICAS, PRODUÇÃO DE VÍDEOS E DE PROGRAMAS DE TELEVISÃO; GRAVAÇÃO DE SOM E EDIÇÃO DE MÚSICA' },
  { codigo: 60, descricao: 'ATIVIDADES DE RÁDIO E DE TELEVISÃO' },
  { codigo: 61, descricao: 'TELECOMUNICAÇÕES' },
  { codigo: 62, descricao: 'ATIVIDADES DOS SERVIÇOS DE TECNOLOGIA DA INFORMAÇÃO' },
  { codigo: 63, descricao: 'ATIVIDADES DE PRESTAÇÃO DE SERVIÇOS DE INFORMAÇÃO' },

  // ── K — Atividades Financeiras e de Seguros ───────────────────────────────────
  { codigo: 64, descricao: 'ATIVIDADES DE SERVIÇOS FINANCEIROS' },
  { codigo: 65, descricao: 'SEGUROS, RESSEGUROS, PREVIDÊNCIA COMPLEMENTAR E PLANOS DE SAÚDE' },
  { codigo: 66, descricao: 'ATIVIDADES AUXILIARES DOS SERVIÇOS FINANCEIROS, SEGUROS, PREVIDÊNCIA COMPLEMENTAR E PLANOS DE SAÚDE' },

  // ── L — Atividades Imobiliárias ──────────────────────────────────────────────
  { codigo: 68, descricao: 'ATIVIDADES IMOBILIÁRIAS' },

  // ── M — Atividades Profissionais, Científicas e Técnicas ──────────────────────
  { codigo: 69, descricao: 'ATIVIDADES JURÍDICAS, DE CONTABILIDADE E DE AUDITORIA' },
  { codigo: 70, descricao: 'ATIVIDADES DE SEDES DE EMPRESAS E DE CONSULTORIA EM GESTÃO EMPRESARIAL' },
  { codigo: 71, descricao: 'SERVIÇOS DE ARQUITETURA E ENGENHARIA; TESTES E ANÁLISES TÉCNICAS' },
  { codigo: 72, descricao: 'PESQUISA E DESENVOLVIMENTO CIENTÍFICO' },
  { codigo: 73, descricao: 'PUBLICIDADE E PESQUISA DE MERCADO' },
  { codigo: 74, descricao: 'OUTRAS ATIVIDADES PROFISSIONAIS, CIENTÍFICAS E TÉCNICAS' },
  { codigo: 75, descricao: 'ATIVIDADES VETERINÁRIAS' },

  // ── N — Atividades Administrativas e Serviços Complementares ─────────────────
  { codigo: 77, descricao: 'ALUGUÉIS NÃO-IMOBILIÁRIOS E GESTÃO DE ATIVOS INTANGÍVEIS NÃO-FINANCEIROS' },
  { codigo: 78, descricao: 'SELEÇÃO, AGENCIAMENTO E LOCAÇÃO DE MÃO-DE-OBRA' },
  { codigo: 79, descricao: 'AGÊNCIAS DE VIAGENS, OPERADORES TURÍSTICOS E SERVIÇOS DE RESERVAS' },
  { codigo: 80, descricao: 'ATIVIDADES DE VIGILÂNCIA, SEGURANÇA E INVESTIGAÇÃO' },
  { codigo: 81, descricao: 'SERVIÇOS PARA EDIFÍCIOS E ATIVIDADES PAISAGÍSTICAS' },
  { codigo: 82, descricao: 'SERVIÇOS DE ESCRITÓRIO, DE APOIO ADMINISTRATIVO E OUTROS SERVIÇOS PRESTADOS ÀS EMPRESAS' },

  // ── O — Administração Pública ────────────────────────────────────────────────
  { codigo: 84, descricao: 'ADMINISTRAÇÃO PÚBLICA, DEFESA E SEGURIDADE SOCIAL' },

  // ── P — Educação ─────────────────────────────────────────────────────────────
  { codigo: 85, descricao: 'EDUCAÇÃO' },

  // ── Q — Saúde Humana e Serviços Sociais ──────────────────────────────────────
  { codigo: 86, descricao: 'ATIVIDADES DE ATENÇÃO À SAÚDE HUMANA' },
  { codigo: 87, descricao: 'ATIVIDADES DE ATENÇÃO À SAÚDE HUMANA INTEGRADAS COM ASSISTÊNCIA SOCIAL, PRESTADAS EM RESIDÊNCIAS COLETIVAS E PARTICULARES' },
  { codigo: 88, descricao: 'SERVIÇOS DE ASSISTÊNCIA SOCIAL SEM ALOJAMENTO' },

  // ── R — Artes, Cultura, Esporte e Recreação ──────────────────────────────────
  { codigo: 90, descricao: 'ATIVIDADES ARTÍSTICAS, CRIATIVAS E DE ESPETÁCULOS' },
  { codigo: 91, descricao: 'ATIVIDADES LIGADAS AO PATRIMÔNIO CULTURAL E AMBIENTAL' },
  { codigo: 92, descricao: 'ATIVIDADES DE EXPLORAÇÃO DE JOGOS DE AZAR E APOSTAS' },
  { codigo: 93, descricao: 'ATIVIDADES ESPORTIVAS E DE RECREAÇÃO E LAZER' },

  // ── S — Outras Atividades de Serviços ────────────────────────────────────────
  { codigo: 94, descricao: 'ATIVIDADES DE ORGANIZAÇÕES ASSOCIATIVAS' },
  { codigo: 95, descricao: 'REPARAÇÃO E MANUTENÇÃO DE EQUIPAMENTOS DE INFORMÁTICA E COMUNICAÇÃO E DE OBJETOS PESSOAIS E DOMÉSTICOS' },
  { codigo: 96, descricao: 'OUTRAS ATIVIDADES DE SERVIÇOS PESSOAIS' },

  // ── T — Serviços Domésticos ──────────────────────────────────────────────────
  { codigo: 97, descricao: 'SERVIÇOS DOMÉSTICOS' },

  // ── U — Organismos Internacionais ────────────────────────────────────────────
  { codigo: 99, descricao: 'ORGANISMOS INTERNACIONAIS E OUTRAS INSTITUIÇÕES EXTRATERRITORIAIS' },
];

/** Set de códigos válidos para lookup O(1) */
export const VALID_ATIVIDADE_PRINCIPAL = new Set(
  ATIVIDADES_PRINCIPAIS.map(e => String(e.codigo))
);

/** Seções CNAE com label e faixa de códigos */
export interface SecaoCNAE {
  letra: string;
  nome: string;
  codigos: AtividadePrincipalEntry[];
}

const SECOES_DEF: { letra: string; nome: string; min: number; max: number }[] = [
  { letra: 'A', nome: 'Agricultura, Pecuária, Produção Florestal, Pesca e Aqüicultura', min:  1, max:  3 },
  { letra: 'B', nome: 'Indústrias Extrativas',                                           min:  5, max:  9 },
  { letra: 'C', nome: 'Indústrias de Transformação',                                    min: 10, max: 33 },
  { letra: 'D', nome: 'Eletricidade e Gás',                                             min: 35, max: 35 },
  { letra: 'E', nome: 'Água, Esgoto e Gestão de Resíduos',                              min: 36, max: 39 },
  { letra: 'F', nome: 'Construção',                                                     min: 41, max: 43 },
  { letra: 'G', nome: 'Comércio e Reparação de Veículos',                               min: 45, max: 47 },
  { letra: 'H', nome: 'Transporte, Armazenagem e Correio',                              min: 49, max: 53 },
  { letra: 'I', nome: 'Alojamento e Alimentação',                                       min: 55, max: 56 },
  { letra: 'J', nome: 'Informação e Comunicação',                                       min: 58, max: 63 },
  { letra: 'K', nome: 'Atividades Financeiras e de Seguros',                            min: 64, max: 66 },
  { letra: 'L', nome: 'Atividades Imobiliárias',                                        min: 68, max: 68 },
  { letra: 'M', nome: 'Atividades Profissionais, Científicas e Técnicas',               min: 69, max: 75 },
  { letra: 'N', nome: 'Atividades Administrativas e Serviços Complementares',           min: 77, max: 82 },
  { letra: 'O', nome: 'Administração Pública, Defesa e Seguridade Social',              min: 84, max: 84 },
  { letra: 'P', nome: 'Educação',                                                       min: 85, max: 85 },
  { letra: 'Q', nome: 'Saúde Humana e Serviços Sociais',                               min: 86, max: 88 },
  { letra: 'R', nome: 'Artes, Cultura, Esporte e Recreação',                           min: 90, max: 93 },
  { letra: 'S', nome: 'Outras Atividades de Serviços',                                  min: 94, max: 96 },
  { letra: 'T', nome: 'Serviços Domésticos',                                            min: 97, max: 97 },
  { letra: 'U', nome: 'Organismos Internacionais e Outras Instituições Extraterritoriais', min: 99, max: 99 },
];

export const SECOES_CNAE: SecaoCNAE[] = SECOES_DEF.map(s => ({
  letra: s.letra,
  nome: s.nome,
  codigos: ATIVIDADES_PRINCIPAIS.filter(e => e.codigo >= s.min && e.codigo <= s.max),
}));
