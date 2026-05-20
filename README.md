# Validador NDD Cargo

Ferramenta web para validação de arquivos de integração da plataforma **NDD Cargo**, layout `loteOT_envio` v4.2.12.0. Suporta os três formatos aceitos pela API: **XML**, **TXT** e **JSON**.

Todo o processamento é feito **localmente no navegador** — nenhum dado é enviado para servidores externos.

---

## Funcionalidades

### Tipos de integração suportados
| Tipo | XML | TXT | JSON |
|---|:---:|:---:|:---:|
| Emissão | ✅ | ✅ | ✅ |
| Retificação | ✅ | — | — |
| Cancelamento | ✅ | — | — |
| Encerramento | ✅ | — | — |

### Validações realizadas

- **XSD / estrutura de campos** — tipo, tamanho, formato e obrigatoriedade de cada campo conforme o layout oficial NDD
- **Regras de negócio** — mais de 50 regras cruzadas, incluindo:
  - Datas coerentes (`dtFim ≥ dtInicio`, intervalo máximo de 90 dias)
  - Peso e valor do frete maiores que zero
  - `codigoSH` validado contra a tabela oficial (1.229 códigos agrupados por capítulo)
  - `codigoTipoCarga` validado contra os 12 tipos permitidos
  - Campos enum com lista completa de valores aceitos exibida na mensagem de erro
  - Restrições por tipo de operação (Lotação, Fracionado, TAC-Agregado)
  - Duplicidade de placa de veículo
  - Transportador pessoa física obrigatório para TAC-Agregado
  - Estrutura de registros TXT (sequência, hierarquia e cardinalidade)
- **Atributo `versao`** — aceita somente `4.2.12.0`

### Recursos de apoio
- Editor com syntax highlighting estilo VS Code (CodeMirror 6) para XML, JSON e TXT
- Clique em um erro para navegar diretamente à linha correspondente no editor
- Resultados ordenados por número de linha crescente
- Tabela de `codigoSH` acessível pelo menu "Materiais de apoio"
- Arquivos de exemplo para download (XML, TXT e JSON) para cada modalidade
- XSDs disponíveis para download direto na interface
- Modo escuro com persistência via `localStorage`
- Rastreamento de eventos via Vercel Analytics

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Estilo | Tailwind CSS |
| Editor | CodeMirror 6 (`@uiw/react-codemirror`) |
| Deploy | Vercel |
| Analytics | `@vercel/analytics` |

---

## Estrutura do projeto

```
src/
├── App.tsx                        # Componente raiz — roteamento hash, orquestração
├── components/
│   ├── XmlInput.tsx               # Editor CodeMirror com highlight e scroll para linha
│   ├── ValidationResult.tsx       # Painel de resultados com navegação por erros
│   ├── CodigoSHPage.tsx           # Subpágina: tabela de 1.229 códigos SH
│   └── ReleaseNotes.tsx           # Modal de changelog
├── validator/
│   ├── types.ts                   # Interfaces ValidationError e ValidationResult
│   ├── validate.ts                # Validador XML — Emissão
│   ├── validateRetificacao.ts     # Validador XML — Retificação
│   ├── validateCancelamento.ts    # Validador XML — Cancelamento
│   ├── validateEncerramento.ts    # Validador XML — Encerramento
│   ├── businessRules.ts           # Regras de negócio compartilhadas (XML)
│   ├── validateTxt.ts             # Validador TXT — Emissão
│   └── validateJson.ts            # Validador JSON — Emissão
└── data/
    ├── codigoSH.ts                # Tabela de 1.229 códigos SH (cap. NDD)
    └── codigoTipoCarga.ts         # 12 tipos de carga com descrições

public/
├── schemas/                       # XSDs para download (emissão, retif., cancel., encerr.)
├── exemplos/
│   ├── emissao/                   # XML, TXT e JSON de exemplo por modalidade
│   ├── retificacao/               # XMLs de retificação
│   ├── cancelamento/              # XML de cancelamento
│   └── encerramento/              # XMLs de encerramento
└── ndd-logo.svg
```

---

## Configuração local

### Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9 (ou `pnpm` / `yarn`)

### Instalação e execução

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd xml-validator

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:5173)
npm run dev
```

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção (`dist/`) |
| `npm run preview` | Pré-visualizar o build de produção localmente |
| `npm run lint` | Verificar erros de lint com ESLint |

### Build de produção

```bash
npm run build
# Saída gerada em dist/
```

O projeto está configurado para deploy automático na **Vercel** a partir da branch `main`. Cada push dispara um novo build.

---

## Adicionando novos tipos de integração

1. Crie um arquivo `src/validator/validateXxx.ts` exportando `validateXxx(content: string): ValidationResult`
2. Importe e chame a função em `App.tsx` dentro de `handleValidate`
3. Adicione a entrada em `INTEGRATION_TYPES` com os `activeFor` corretos
4. Inclua exemplos em `public/exemplos/<tipo>/` e XSDs em `public/schemas/` se aplicável

---

## Convenções de código

- Todos os validadores retornam `ValidationResult` com `errors: ValidationError[]` ordenado por `lineNumber` crescente (a ordenação é feita em `App.tsx` após a validação)
- Campos enum sempre exibem a lista completa de valores aceitos com descrição na mensagem de erro
- Strings opcionais deixadas em branco (`""`) são rejeitadas — use `null` ou omita o campo (JSON) / deixe o campo vazio entre separadores (TXT)
- Nenhuma dependência de runtime além de React e CodeMirror — toda a lógica de validação é TypeScript puro
