import { useState } from 'react';

interface Entry {
  type: 'feat' | 'fix';
  text: string;
}

interface Release {
  date: string;
  entries: Entry[];
}

const RELEASES: Release[] = [
  {
    date: '25 mai 2026',
    entries: [
      { type: 'feat', text: 'Validação de TXT Encerramento (EnvEnce) — layout completo com registros 0000/1000/1100/2000/2400/3000/3100/3110/4000/4100/4110/4120; aba Encerramento habilitada para arquivos TXT' },
      { type: 'feat', text: 'Regras de negócio TXT Encerramento: RN-E01 (exclusividade Lotação/Fracionado/TAC-Agregado), RN-E02 (encerrar=1), RN-E03 (codigoIBGE ou CEP ou lat+lon), RN-E04 (mín. 2 pontos de parada por 3100), RN-E05 (4110 XOR 4120)' },
      { type: 'feat', text: 'Três exemplos TXT Encerramento disponíveis para download: Carga Lotação, Carga Fracionada e TAC-Agregado (com duas viagens, rotas e pontos de parada por codigoIBGE)' },
    ],
  },
  {
    date: '24 mai 2026',
    entries: [
      { type: 'feat', text: 'Editor XML e JSON — auto-indentação ao colar: XML e JSON válidos são formatados automaticamente com 2 espaços ao colar no editor; conteúdo inválido é inserido sem alteração' },
      { type: 'feat', text: 'Validação global de espaços extras (XML, JSON e TXT) — campos com espaço no início ou no fim do valor são apontados como erro em todos os tipos de arquivo' },
      { type: 'feat', text: 'gerPgtoFin=5 (Outros) proibido para transportador TAC (Pessoa Física) — regra implementada nos validadores XML, JSON e TXT Emissão' },
      { type: 'feat', text: 'Exemplos XML de emissão reorganizados em 3 grupos: Sem pagamento (Conta Corrente), Com pagamento (NDD Cargo e PIX) e Frota Própria — 10 novos arquivos disponíveis para download' },
      { type: 'feat', text: 'Exemplo JSON Emissão TAC-Agregado · gerPgtoFin=2 (Conta Corrente) · TAC/PF adicionado' },
      { type: 'feat', text: 'Seção de arquivos de exemplo passa a ser colapsável — padrão recolhida ao carregar a página' },
      { type: 'fix',  text: 'Auditoria Notion — tipoPagamento: valores corrigidos para 1=TED (descontinuado) e 2=PIX; exemplos PIX (XML e JSON) atualizados de tipoPagamento=1 para tipoPagamento=2' },
      { type: 'fix',  text: 'Auditoria Notion — campos booleanos nos exemplos XML (indAltoDesempenho, indRetornoVazio, composicaoVeicular): valor "2" corrigido para "0" (false=0, true=1 conforme XSD e Notion)' },
      { type: 'fix',  text: 'XSD — nomes IndAltoDesempenho e IndRetornoVazio corrigidos para camelCase (indAltoDesempenho, indRetornoVazio); composicaoVeicular movida para o bloco lotacao com nome em camelCase' },
      { type: 'feat', text: 'XSD e RN-54 — despesas torna-se obrigatório em valores (vlrDespesas=0.00 e descricao="NAO INFORMADO" quando não aplicável); todos os 15 exemplos XML atualizados' },
      { type: 'feat', text: 'XSD e RN-55 — tarifas adicionado como obrigatório em valores (quantidadeTotal + valorTotal); ausente do XSD anterior; todos os 15 exemplos XML atualizados' },
    ],
  },
  {
    date: '23 mai 2026',
    entries: [
      { type: 'feat', text: 'RN-42 (JSON Emissão) — cpfCnpj de ContratantesCargaFrac não pode ser igual ao CNPJ da contratante principal (ide.cnpj)' },
      { type: 'feat', text: 'RN-43 (JSON Emissão) — CPF e CNPJ dos contratantes fracionados passam a ter dígito verificador validado' },
      { type: 'feat', text: 'RN-21 (JSON e TXT Emissão) — eixos validados por tipo: tração (tipo=1) deve ter 2–4 eixos; reboque (tipo=2) deve ter 1–4 eixos' },
      { type: 'feat', text: 'RN-35 (JSON Emissão) — soma dos valorAplicado das parcelas deve ser igual ao vlrFrete' },
      { type: 'feat', text: 'RN-30 (JSON Emissão) — regra de chavePix × tipoChave cruzada com gerPgtoFin=6: chavePix obrigatória quando tipoChave ≠ 5, proibida quando tipoChave=5; tipoChave só permitido quando gerPgtoFin=6' },
      { type: 'feat', text: 'RN-31 (JSON Emissão) — codigoInstituicaoFinanceira, numeroAgencia e cpfCnpjFavorecido obrigatórios quando gerPgtoFin ∈ {2,3,4} ou tipoChave=5' },
      { type: 'feat', text: 'XML Emissão — tipoPagamento proibido em dadosBancarios quando gerPgtoFin ∈ {2,3,4,5}' },
      { type: 'feat', text: 'Email em formato válido validado em XML (infTransportador.email) e em todos os campos de e-mail do TXT (registros 4010, 4020, 4021 e 4620)' },
      { type: 'fix',  text: 'RN-32 removida — TED (tipoPagamento=1) volta a ser aceito no XML; apenas PIX (2) era aceito anteriormente' },
      { type: 'feat', text: 'XML Emissão — RNTRCTransportador: valor "999999999" aceito para reboque (tipo=2) sem RNTRC; rejeitado para veículo de tração (tipo=1), que deve sempre informar um RNTRC válido' },
    ],
  },
  {
    date: '22 mai 2026',
    entries: [
      { type: 'fix', text: 'TXT Emissão — registro 4200 corrigido: qtdEixos removido (campo movido para o registro 4210); 4200 agora contém apenas placa (f[1])' },
      { type: 'fix', text: 'TXT Emissão — registro 4210 corrigido: qtdEixos adicionado como campo obrigatório em f[6]' },
      { type: 'feat', text: 'TXT Emissão — registro 4010: campos opcionais email (f[7]) e idCartao (f[8]) agora validados' },
      { type: 'feat', text: 'JSON Emissão — transp.cadastro.endereco passa a ser obrigatório; campos numero e CEP também obrigatórios dentro do endereço do transportador' },
      { type: 'feat', text: 'XML Emissão — validação de ordenação de tags (xs:sequence): 24 verificações de ordem cobrindo todos os blocos do layout v4.2.12.0' },
      { type: 'fix',  text: 'XML Emissão — ordem de campos em carga.fracionado corrigida: fracionado.quantidade precede ContratantesCargaFrac conforme xs:sequence do layout' },
      { type: 'feat', text: 'JSON Emissão — validação do objeto rota: campos obrigatórios e regras de negócio conforme layout v4.2.12.0' },
      { type: 'feat', text: 'JSON Emissão — exemplos de payload atualizados com o objeto rota preenchido' },
      { type: 'feat', text: 'JSON Emissão — campo numero de endereço passa a aceitar somente dígitos numéricos' },
      { type: 'feat', text: 'JSON Emissão — veiculos[].cadastro torna-se obrigatório; ausência do objeto gera erro de validação' },
      { type: 'feat', text: 'JSON Emissão — bloco condutores permitido somente quando gerPgtoFin = 1 (TAC) ou 6 (Frota Própria)' },
      { type: 'feat', text: 'JSON Emissão — campo tipoPagamento omitido automaticamente em dadosBancarios quando gerPgtoFin ∈ {2, 3, 4, 5}' },
      { type: 'feat', text: 'Novos exemplos XML de TAC-Agregado disponíveis para download: TAC·NDD Cargo e ETC·Outros' },
      { type: 'fix',  text: 'RN-50 (vedação de CNPJ de transportador para TAC-Agregado) desativada temporariamente aguardando confirmação da interpretação do layout' },
    ],
  },
  {
    date: '21 mai 2026',
    entries: [
      { type: 'feat', text: 'Subpágina "Como usar?" com guia completo para desenvolvedores: 5 passos de uso, tipos de arquivo, tipos de integração, como ler erros, tabelas de apoio, campos enum, regras de negócio, erros comuns e limitações — acessível pelo link no rodapé da aplicação' },
      { type: 'feat', text: 'Tabela codigoSH atualizada para a lista oficial: 1.231 posições SH com descrição completa de cada código, campo de busca por código ou descrição e layout com zebra por capítulo' },
      { type: 'feat', text: 'Validação de formaConstituicao (XML, TXT e JSON): rejeita naturezas jurídicas inválidas e exibe link direto para a tabela de consulta com os 73 códigos válidos' },
      { type: 'feat', text: 'Subpágina "Tabela formaConstituicao" com 73 naturezas jurídicas (IBGE/RFB) agrupadas em 5 grupos e campo de pesquisa — acessível pelo menu "Materiais de apoio"' },
      { type: 'feat', text: 'Validação de atividadePrincipal (XML, TXT e JSON): rejeita divisões CNAE inválidas e exibe link direto para a tabela de consulta com todos os 87 códigos válidos' },
      { type: 'feat', text: 'Subpágina "Tabela atividadePrincipal" com 87 divisões CNAE agrupadas por seção (A a U) e campo de pesquisa por código ou descrição — acessível pelo menu "Materiais de apoio"' },
      { type: 'feat', text: 'Resultados de validação sempre ordenados por número de linha crescente' },
      { type: 'feat', text: 'Mensagens de erro para todos os campos enum (XML, TXT e JSON) agora exibem a lista completa de valores aceitos com descrição — gerPgtoFin, tipoOperacao, tipoRateio, tipo do transportador, finalidadeParcela, tipoPagamento, tipoChave, proprietarioCarga, tipo do veículo, efetivacao, prazoMinimo, campo, critério, conector e outros' },
      { type: 'fix',  text: 'Correção: gerPgtoFin no TXT aceitava apenas 1 e 2 — agora valida corretamente os 6 valores permitidos (1 a 6)' },
    ],
  },
  {
    date: '20 mai 2026',
    entries: [
      { type: 'feat', text: 'Validação de codigoTipoCarga (XML, TXT e JSON): rejeita valores fora do intervalo 1–12 e exibe a lista completa dos 12 tipos válidos diretamente na mensagem de erro' },
      { type: 'feat', text: '10 novas regras de negócio no processo de emissão (XML, TXT e JSON): dtFim ≥ dtInicio, intervalo máximo de 90 dias, faixa de peso válida, vlrFrete > 0, cnpjTransportador vedado para TAC-Agregado e codigoSH validado contra a tabela oficial NDD' },
      { type: 'feat', text: 'Subpágina "Tabela codigoSH" com 1.231 posições SH agrupadas por capítulo, campo de busca por código ou descrição e descrição completa de cada posição — acessível pelo menu "Materiais de apoio"' },
      { type: 'feat', text: 'Mensagens de erro de codigoSH inválido exibem link direto para a tabela de consulta' },
      { type: 'fix',  text: 'Tela em branco corrigida — hook useEffect do tema estava posicionado após retorno antecipado de subpágina, violando as Rules of Hooks do React' },
      { type: 'feat', text: 'Atributo versao de todos os XMLs passa a aceitar somente o valor "4.2.12.0" — qualquer outro valor é rejeitado com mensagem clara' },
      { type: 'feat', text: 'Validação JSON: dadosPF e dadosPJ são mutuamente exclusivos — tipo=1 exige dadosPF e proíbe dadosPJ; tipo=2/3 exige dadosPJ e proíbe dadosPF' },
      { type: 'feat', text: 'Validação JSON: vlrFrete aceita no máximo 2 casas decimais' },
      { type: 'feat', text: 'Validação JSON: campo UF de todos os endereços agora validado contra a lista de estados brasileiros' },
      { type: 'feat', text: 'Validação JSON: campos de e-mail validados quanto ao formato (transp.cadastro.email e sócios)' },
      { type: 'fix', text: 'Validação JSON agora detecta payloads em lote (loteOT) e exibe mensagem clara orientando o envio de uma única OT por vez' },
      { type: 'fix', text: 'Campos string opcionais deixados em branco ("") agora são rejeitados com mensagem orientativa — use null ou omita o campo' },
      { type: 'feat', text: 'Campos carga e carga.remetente agora obrigatórios para todos os tipos de operação (incluindo TAC-Agregado)' },
      { type: 'feat', text: 'Exemplo de payload JSON TAC-Agregado disponível para download no painel JSON › Emissão' },
    ],
  },
  {
    date: '15 mai 2026',
    entries: [
      { type: 'feat', text: 'Validação de XML Encerramento (encerrarOT_envio) — regras de negócio RN-E01 a RN-E04, XSD e suporte a lotação, fracionado e TAC-Agregado' },
      { type: 'feat', text: 'Validação de XML Cancelamento (cancelarOT_envio) — regras técnicas completas, XSD e arquivo de exemplo' },
      { type: 'feat', text: 'Validação de XML Retificação (alterarOT_envio) — todas as regras técnicas e de negócio do layout v4.2.12.0' },
      { type: 'feat', text: 'XSD alterarOT_envio_4_2_12_0.xsd disponível para download no painel XML › Retificação' },
      { type: 'feat', text: 'Syntax highlighting customizado para TXT NDD Cargo — destaque de código de registro, separadores e campos por tipo' },
      { type: 'feat', text: 'Editor substituído por CodeMirror 6 com highlight estilo VS Code para XML, JSON e TXT (números de linha, folding, bracket matching)' },
      { type: 'feat', text: 'Exemplos XML para download — Carga Lotação, Carga Fracionada, Frota Própria e TAC-Agregado' },
      { type: 'feat', text: 'Validação ajustada conforme layout Notion: suporte a latitude/longitude em pontosParada e totalKm obrigatório para lotação/fracionado' },
      { type: 'feat', text: 'Vercel Analytics — rastreamento de validações, mudanças de tipo de arquivo e downloads' },
      { type: 'fix',  text: 'IndAltoDesempenho, IndRetornoVazio e ComposicaoVeicular passam a aceitar 0 ou 1 (em vez de true/false)' },
      { type: 'fix',  text: 'Exemplos TXT atualizados com valores 0/1 nos campos booleanos' },
    ],
  },
  {
    date: '14 mai 2026',
    entries: [
      { type: 'feat', text: 'Navegar para a linha do código ao clicar em um erro de validação JSON' },
      { type: 'feat', text: 'Validação de JSON para API REST NDD Cargo — layout loteOT_envio novo formato' },
      { type: 'feat', text: 'Modo escuro com toggle no header e persistência via localStorage' },
      { type: 'feat', text: 'Título da página, favicon e logo NDD no header' },
      { type: 'feat', text: 'Validação de TXT loteOT_envio — layout Emissão completo com todas as regras de negócio' },
      { type: 'feat', text: 'Download do XSD movido para dentro do painel XML › Emissão' },
      { type: 'fix',  text: 'Remove suporte a lote de OTs do validador JSON (simplificação da estrutura)' },
      { type: 'fix',  text: 'Botão Validar sempre visível quando há seção de exemplos acima' },
      { type: 'fix',  text: 'Corrige erros de build TypeScript para deploy no Vercel' },
    ],
  },
  {
    date: '12 mai 2026',
    entries: [
      { type: 'feat', text: 'UX/UI — seletor de tipo de integração, gutter de linhas numeradas e navegação por rejeições no painel de resultado' },
      { type: 'feat', text: 'Validador XML NDD Cargo loteOT_envio v4.2.12.0 — versão inicial' },
    ],
  },
];

export function ReleaseNotes() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                   border border-gray-200 dark:border-gray-700
                   bg-white dark:bg-gray-800
                   text-gray-500 dark:text-gray-400
                   hover:bg-gray-50 dark:hover:bg-gray-700
                   hover:text-gray-700 dark:hover:text-gray-200
                   hover:border-gray-300 dark:hover:border-gray-600
                   transition-colors shadow-sm"
      >
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Changelog
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg max-h-[80vh] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Changelog</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Histórico de alterações do validador</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="flex flex-col gap-6">
                {RELEASES.map(release => (
                  <div key={release.date}>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                      {release.date}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {release.entries.map((entry, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <span
                            className={`mt-0.5 shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide leading-none ${
                              entry.type === 'feat'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {entry.type}
                          </span>
                          {entry.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
