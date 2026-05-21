export function ComoUsarPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <a
            href="/"
            onClick={e => { e.preventDefault(); window.location.hash = ''; }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </a>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600 text-white shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Como usar o Validador?</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Guia completo para desenvolvedores</p>
            </div>
          </div>
          <img src="/ndd-logo.svg" alt="NDD" className="ml-auto h-6 dark:invert opacity-80" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-10">

        {/* ── O que é ─────────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="💡" title="O que é este validador?" />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3">
            <p>
              Este validador verifica se os arquivos de integração com a plataforma <strong>NDD Cargo</strong> estão
              corretos <em>antes</em> de enviá-los à API. Ele aplica as mesmas regras de estrutura e de
              negócio que o servidor aplicaria, permitindo que você corrija os erros localmente sem
              precisar de credenciais, ambiente de homologação nem conexão com a internet.
            </p>
            <p>
              Tudo é processado <strong>no próprio navegador</strong> — nenhum dado é transmitido a nenhum servidor.
            </p>
            <InfoBox color="blue">
              O layout validado é o <strong>loteOT_envio v4.2.12.0</strong>. Versões anteriores ou
              campos extras não previstos no layout serão sinalizados como erro.
            </InfoBox>
          </div>
        </section>

        {/* ── Passo a passo ───────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="🪜" title="Como validar em 5 passos" />
          <div className="flex flex-col gap-3">
            {[
              {
                n: 1,
                title: 'Escolha o tipo de arquivo',
                body: 'Selecione XML, TXT ou JSON na barra superior, de acordo com o formato que você está integrando. Cada formato tem regras próprias.',
              },
              {
                n: 2,
                title: 'Escolha o tipo de integração',
                body: 'Logo abaixo do seletor de arquivo, escolha a operação: Emissão, Retificação, Cancelamento ou Encerramento. Apenas os tipos compatíveis com o formato selecionado ficam ativos.',
              },
              {
                n: 3,
                title: 'Cole o conteúdo no editor',
                body: 'Cole o conteúdo do arquivo ou payload JSON diretamente no editor. O editor tem numeração de linhas e syntax highlighting para facilitar a leitura. Você também pode carregar um dos exemplos disponíveis clicando no botão de download acima do editor.',
              },
              {
                n: 4,
                title: 'Clique em "Validar"',
                body: 'O botão fica na borda inferior do editor. A validação é instantânea e ocorre inteiramente no navegador.',
              },
              {
                n: 5,
                title: 'Leia e corrija os erros',
                body: 'O painel da direita exibe a lista de erros. Clique em qualquer erro para que o editor role automaticamente até a linha correspondente. Corrija o problema e valide novamente até não restar nenhum erro.',
              },
            ].map(step => (
              <div key={step.n} className="flex gap-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {step.n}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{step.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Formatos ────────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="📄" title="Tipos de arquivo" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <FormatCard
              color="blue"
              tag="XML"
              title="Integração via arquivo XML"
              items={[
                'Suporta Emissão, Retificação, Cancelamento e Encerramento',
                'Elemento raiz: <loteOT_envio> (Emissão) ou equivalente para cada operação',
                'O atributo versao deve ser exatamente "4.2.12.0"',
                'XSD disponível para download no painel de Emissão',
                'Formato mais completo: permite todos os campos do layout',
              ]}
            />

            <FormatCard
              color="violet"
              tag="TXT"
              title="Integração via arquivo TXT"
              items={[
                'Apenas Emissão',
                'Campos separados por ponto e vírgula (;)',
                'Cada linha é um registro com código fixo (0000, 1000, 2000…)',
                'O arquivo deve começar obrigatoriamente com o registro 0000',
                'Cada OT começa com o registro 1000',
                'A ordem dos registros é hierárquica e obrigatória',
              ]}
            />

            <FormatCard
              color="emerald"
              tag="JSON"
              title="Integração via API REST"
              items={[
                'Apenas Emissão',
                'Envie uma OT por requisição (sem o wrapper loteOT)',
                'Campos string opcionais: use null ou omita — nunca envie ""',
                'Campos booleanos: true ou false (não 0/1)',
                'Exemplo de payload disponível para download no painel JSON',
              ]}
            />
          </div>
        </section>

        {/* ── Tipos de integração ──────────────────────────────────────── */}
        <section>
          <SectionTitle icon="🔄" title="Tipos de integração" />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Quando usar</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">XML</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">TXT</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Emissão</td>
                  <td className="px-4 py-3">Criar uma nova Ordem de Transporte (OT)</td>
                  <td className="px-4 py-3 text-center text-green-600">✓</td>
                  <td className="px-4 py-3 text-center text-green-600">✓</td>
                  <td className="px-4 py-3 text-center text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Retificação</td>
                  <td className="px-4 py-3">Corrigir dados de uma OT já emitida</td>
                  <td className="px-4 py-3 text-center text-green-600">✓</td>
                  <td className="px-4 py-3 text-center text-gray-300 dark:text-gray-600">—</td>
                  <td className="px-4 py-3 text-center text-gray-300 dark:text-gray-600">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Cancelamento</td>
                  <td className="px-4 py-3">Cancelar uma OT antes do encerramento</td>
                  <td className="px-4 py-3 text-center text-green-600">✓</td>
                  <td className="px-4 py-3 text-center text-gray-300 dark:text-gray-600">—</td>
                  <td className="px-4 py-3 text-center text-gray-300 dark:text-gray-600">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Encerramento</td>
                  <td className="px-4 py-3">Finalizar a entrega e encerrar a OT</td>
                  <td className="px-4 py-3 text-center text-green-600">✓</td>
                  <td className="px-4 py-3 text-center text-gray-300 dark:text-gray-600">—</td>
                  <td className="px-4 py-3 text-center text-gray-300 dark:text-gray-600">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Como ler os erros ────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="🔍" title="Como ler os resultados" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-500 inline-flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                Arquivo válido
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O painel exibe um banner verde com a mensagem de sucesso e a quantidade de OTs encontradas.
                Isso significa que o arquivo passou em todas as regras técnicas e de negócio
                implementadas. Você pode submetê-lo à API com confiança.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500 inline-flex items-center justify-center text-white text-[10px] font-bold">✕</span>
                Arquivo inválido
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cada erro exibe o <strong>caminho do campo</strong> (ex:{' '}
                <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">Linha 12 · Reg. 2000 · Campo: tipo</code>)
                e a <strong>mensagem explicando o problema</strong>. Os erros ficam ordenados pelo
                número de linha. Clique em qualquer erro para o editor rolar até a linha correspondente.
              </p>
            </div>

            <div className="sm:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Erros com link de apoio</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alguns campos aceitam apenas códigos de uma tabela oficial (ex: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">codigoSH</code>,{' '}
                <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">atividadePrincipal</code>,{' '}
                <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">formaConstituicao</code>).
                Nesses casos o erro exibe um link azul — clique nele para abrir a tabela de consulta
                com todos os valores válidos e suas descrições.
              </p>
            </div>
          </div>
        </section>

        {/* ── Tabelas de apoio ─────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="📚" title="Tabelas de apoio" />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Campo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">O que contém</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Qtd.</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Acessar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">codigoSH</td>
                  <td className="px-4 py-3">Natureza da carga (NCM/SH) — identifica o tipo de mercadoria transportada</td>
                  <td className="px-4 py-3">1.229</td>
                  <td className="px-4 py-3">
                    <a href="#/codigos-sh" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline">
                      Tabela codigoSH
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">atividadePrincipal</td>
                  <td className="px-4 py-3">Divisão CNAE da empresa transportadora (ramo de atividade econômica)</td>
                  <td className="px-4 py-3">87</td>
                  <td className="px-4 py-3">
                    <a href="#/atividade-principal" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline">
                      Tabela atividadePrincipal
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">formaConstituicao</td>
                  <td className="px-4 py-3">Natureza jurídica da empresa (ex: Sociedade Limitada, Cooperativa, Autarquia…)</td>
                  <td className="px-4 py-3">73</td>
                  <td className="px-4 py-3">
                    <a href="#/forma-constituicao" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline">
                      Tabela formaConstituicao
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">
            Todas as tabelas estão acessíveis também pelo menu <strong>"Materiais de apoio"</strong> na barra da aplicação,
            sem necessidade de fazer uma validação primeiro.
          </p>
        </section>

        {/* ── Campos enum ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="🔢" title="Campos com lista de valores fixos" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Vários campos aceitam apenas um conjunto fechado de valores numéricos. Quando você informa um valor inválido,
            a mensagem de erro exibe automaticamente todos os valores aceitos e suas descrições.
            Os principais são:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { campo: 'tipoOperacao / tipo (OT)', valores: '1 Lotação · 2 Fracionado · 3 TAC-Agregado' },
              { campo: 'gerPgtoFin', valores: '1 Conta digital NDD · 2 Conta corrente · 3 Poupança · 4 Conta pagamento · 5 Outros · 6 PIX NDD' },
              { campo: 'proprietarioCarga', valores: '1 Remetente · 2 Destinatário · 3 Consignatário · 4 Outro' },
              { campo: 'CodigoTipoCarga', valores: '1 Granel sólido … 12 Carga Granel Pressurizada (12 tipos)' },
              { campo: 'tipo (veículo)', valores: '1 Tração · 2 Reboque' },
              { campo: 'tpRateioRetencoes / tipoRateio', valores: '1 Primeira · 2 Última · 3 Todas · 4 Não reter · 5 Todas c/ proporção' },
              { campo: 'finalidadeParcela', valores: '1 Adiantamento · 2 Saldo' },
              { campo: 'tipoPagamento (dadosBancarios)', valores: '1–6 (mesmas opções de gerPgtoFin)' },
              { campo: 'tipoChave (PIX)', valores: '1 CPF/CNPJ · 2 Celular · 3 E-mail · 4 Aleatória · 5 Outro' },
              { campo: 'efetivacao', valores: '1 Posto credenciado · 2 Triagem · 3 Contratante · 4 Confirmação eletrônica' },
            ].map(row => (
              <div key={row.campo} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{row.campo}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{row.valores}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Regras de negócio ────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="⚙️" title="Principais regras de negócio verificadas" />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <ul className="flex flex-col gap-2.5">
              {[
                { label: 'Datas coerentes', desc: 'dtFim deve ser maior ou igual a dtInicio. O intervalo máximo entre elas é de 90 dias (para Lotação e Fracionado).' },
                { label: 'Peso da carga', desc: 'O campo quantidade (peso) deve ser maior que 0 e menor que 9.999.999,99.' },
                { label: 'Valor do frete', desc: 'vlrFrete deve ser maior que zero — frete gratuito não é permitido.' },
                { label: 'Versão do layout', desc: 'O atributo versao nos XMLs deve ser exatamente "4.2.12.0". Qualquer outra versão é rejeitada.' },
                { label: 'TAC-Agregado — transportador', desc: 'Em operações TAC-Agregado, o transportador deve ser pessoa física (CPF, 11 dígitos). CNPJ é rejeitado.' },
                { label: 'TAC-Agregado — data de início', desc: 'dtInicio não deve ser informada em TAC-Agregado.' },
                { label: 'Placa duplicada', desc: 'A mesma placa de veículo não pode aparecer mais de uma vez na mesma OT.' },
                { label: 'Veículo de tração', desc: 'Cada OT deve ter exatamente um veículo do tipo Tração (tipo = 1). Não pode ter zero nem mais de um.' },
                { label: 'Registros obrigatórios (TXT)', desc: 'Remetente (2200+2210), Valores (4300), Tarifas (4330) e pelo menos um Veículo (4200) são obrigatórios em toda OT.' },
                { label: 'Payload em lote (JSON)', desc: 'O validador JSON aceita apenas uma OT por vez. Enviar o wrapper loteOT resulta em erro orientativo.' },
              ].map(rule => (
                <li key={rule.label} className="flex gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2" />
                  <span>
                    <strong className="text-gray-900 dark:text-white">{rule.label}:</strong>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{rule.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Erros comuns ─────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="⚠️" title="Erros comuns e como corrigir" />
          <div className="flex flex-col gap-3">
            {[
              {
                erro: 'String vazia ""',
                contexto: 'JSON',
                solucao: 'Campos opcionais que não têm valor devem ser omitidos ou enviados como null. Nunca envie uma string vazia.',
                code: '❌  "contrato": ""\n✅  "contrato": null\n✅  (omitir o campo)',
              },
              {
                erro: 'versao incorreta',
                contexto: 'XML',
                solucao: 'O atributo versao no elemento raiz deve ser exatamente "4.2.12.0".',
                code: '❌  versao="4.2.0.0"\n✅  versao="4.2.12.0"',
              },
              {
                erro: 'Separador errado no TXT',
                contexto: 'TXT',
                solucao: 'Os campos são separados por ponto e vírgula (;). Não use vírgula, TAB nem espaço.',
                code: '❌  2000,2,1\n✅  2000;2;1',
              },
              {
                erro: 'CNPJ como transportador em TAC-Agregado',
                contexto: 'Todos',
                solucao: 'No tipo TAC-Agregado o transportador deve ser pessoa física. Use CPF (11 dígitos).',
                code: '❌  cnpjTransportador: "12345678000195"\n✅  cpfTransportador: "12345678901"',
              },
              {
                erro: 'codigoSH com menos de 4 dígitos',
                contexto: 'Todos',
                solucao: 'O código SH deve ter exatamente 4 dígitos. Se o código for menor, complete com zero à esquerda.',
                code: '❌  codigoSH: "123"\n✅  codigoSH: "0123"',
              },
            ].map(item => (
              <div key={item.erro} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded">
                    {item.erro}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.contexto}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{item.solucao}</p>
                <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {item.code}
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* ── Limitações ───────────────────────────────────────────────── */}
        <section>
          <SectionTitle icon="🚧" title="O que este validador não garante" />
          <InfoBox color="amber">
            <ul className="flex flex-col gap-2 text-sm">
              {[
                'Aprovação definitiva pela API: o servidor pode ter regras adicionais de negócio ou consistências com o cadastro da empresa que o validador não conhece.',
                'Autenticação e autorização: o validador não verifica tokens, permissões nem limites de uso da API.',
                'Persistência dos dados: nenhum dado inserido no editor é salvo. Ao fechar ou recarregar a página tudo é perdido.',
                'Compatibilidade com versões anteriores do layout: apenas o v4.2.12.0 é suportado.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-amber-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </InfoBox>
        </section>

        <p className="text-xs text-center text-gray-400 dark:text-gray-600 pb-4">
          Dúvidas sobre o layout? Consulte a documentação oficial no Notion da NDD Tech.
        </p>
      </main>
    </div>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white mb-4">
      <span className="text-lg leading-none">{icon}</span>
      {title}
    </h2>
  );
}

function InfoBox({ color, children }: { color: 'blue' | 'amber'; children: React.ReactNode }) {
  const styles = {
    blue:  'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  );
}

function FormatCard({ color, tag, title, items }: {
  color: 'blue' | 'violet' | 'emerald';
  tag: string;
  title: string;
  items: string[];
}) {
  const badge = {
    blue:   'bg-blue-600',
    violet: 'bg-violet-600',
    emerald:'bg-emerald-600',
  };
  const border = {
    blue:   'border-blue-200 dark:border-blue-800',
    violet: 'border-violet-200 dark:border-violet-800',
    emerald:'border-emerald-200 dark:border-emerald-800',
  };
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border ${border[color]} p-4 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <span className={`${badge[color]} text-white text-xs font-bold px-2 py-0.5 rounded`}>{tag}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="shrink-0 text-gray-400 dark:text-gray-500 mt-0.5">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
