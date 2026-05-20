export interface CodigoTipoCargaEntry {
  codigo: number;
  descricao: string;
}

export const CODIGOS_TIPO_CARGA: CodigoTipoCargaEntry[] = [
  { codigo: 1,  descricao: 'Granel sólido' },
  { codigo: 2,  descricao: 'Granel líquido' },
  { codigo: 3,  descricao: 'Frigorificada ou Aquecida' },
  { codigo: 4,  descricao: 'Conteinerizada' },
  { codigo: 5,  descricao: 'Carga Geral' },
  { codigo: 6,  descricao: 'Neogranel' },
  { codigo: 7,  descricao: 'Perigosa (granel sólido)' },
  { codigo: 8,  descricao: 'Perigosa (granel líquido)' },
  { codigo: 9,  descricao: 'Perigosa (Frigorificada ou Aquecida)' },
  { codigo: 10, descricao: 'Perigosa (conteinerizada)' },
  { codigo: 11, descricao: 'Perigosa (carga geral)' },
  { codigo: 12, descricao: 'Carga Granel Pressurizada' },
];

/** Lista formatada para exibição inline em mensagens de erro */
export const TIPO_CARGA_LISTA = CODIGOS_TIPO_CARGA.map(e => `${e.codigo} – ${e.descricao}`).join(', ');
