# 🍨 Gelato Balancer — Calculadora & Balanceadora de Gelatos

[![Deploy to GitHub Pages](https://github.com/gbajovedi/Receitas-e-Balanceamento-de-Gelatos/actions/workflows/deploy.yml/badge.svg)](https://github.com/gbajovedi/Receitas-e-Balanceamento-de-Gelatos/actions/workflows/deploy.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline-success)](https://gbajovedi.github.io/Receitas-e-Balanceamento-de-Gelatos/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)](https://tailwindcss.com/)

> **Progressive Web App (PWA)** profissional para cálculo, formulação bromatológica, balanceamento e gestão de custos de gelatos artesanais e sorvetes.

👉 **Acesse o aplicativo online:** [**https://gbajovedi.github.io/Receitas-e-Balanceamento-de-Gelatos/**](https://gbajovedi.github.io/Receitas-e-Balanceamento-de-Gelatos/)

## 📲 Como Instalar como Aplicativo (PWA)

O **Gelato Balancer** pode ser instalado diretamente no seu smartphone, tablet ou computador, funcionando com visual de aplicativo nativo em tela cheia e **100% offline**:

- **📱 Android (Google Chrome):** Acesse o link acima, toque no menu de **três pontinhos** no canto superior e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **🍏 iPhone / iPad (Safari):** Abra o link no Safari, toque no botão de **Compartilhar** (ícone de quadrado com seta para cima) e selecione **"Adicionar à Tela de Início"**.
- **💻 Computador (Chrome / Edge):** Abra o link e clique no ícone de **computador com seta para baixo** no canto direito da barra de endereço para **"Instalar Aplicativo"** (ou crie um atalho na Área de Trabalho).

> **💡 Dica para a Cozinha:** Uma vez instalado, o aplicativo abre instantaneamente e não necessita de Wi-Fi ou conexão com a internet para você consultar ou balancear suas receitas.


---

## 📱 Visão Geral

Desenvolvido para superar as limitações das planilhas convencionais (onde editar ingredientes quebrava fórmulas matriciais de busca), o **Gelato Balancer** é uma aplicação web moderna, reativa e **100% offline-first**. 

Ele permite formular e ajustar receitas diretamente na bancada da produção, visualizar diagnósticos térmicos e nutricionais em tempo real, gerenciar um catálogo de **177 receitas pré-balanceadas**, manipular **190 matérias-primas** e calcular a formação precisa do preço de venda com rateio de custos fixos.

---

## ✨ Principais Recursos

### ⚖️ 1. Bancada de Balanceamento Reativo
- **Edição em Tempo Real:** Altere insumos e gramagens livremente sem quebrar referências ou fórmulas.
- **Metas Bromatológicas por Estilo:** Validação instantânea (`Ok`, `Baixo`, `Alto`) contra os parâmetros ideais de 8 categorias oficiais:
  * *Gelatos de Leite*
  * *Sorbets*
  * *Gelatos de Leite com Fruta*
  * *Chocolate base água*
  * *Vegano*
  * *Alcoólicos*
  * *Zero Açúcar*
  * *Gelatos Proteicos*
- **Termômetro de Vitrine:** Cálculo da temperatura estimada de serviço (-10°C a -14°C) a partir do PAC relativo e da matriz de calda.
- **Rótulo Automático de Alérgenos:** Detecção regulamentar de leite, lactose, glúten (trigo, aveia, cevada, biscoitos) e oleaginosas.
- **Escala de Lote em 1 Clique:** Multiplicação proporcional automática de calda base para qualquer volume de produção (ex.: de 1.000 g para 3.500 g, 5.000 g ou cubas inteiras) e botão de normalização para 1 kg.
- **Persistência Local Flexível:** Salve alterações diretamente na receita original ou crie novas variações personalizadas armazenadas no seu dispositivo.

### 🍯 2. Módulo de Pós-Produção (Variegatos & Inclusões)
- Adição de mesclas e recheios incorporados após o congelamento/batimento.
- Cálculo da proporção de mescla no produto final (%) e reflexo direto no custo total por quilo.

### 📖 3. Livro com 177 Receitas Catalogadas
- Repositório com 177 receitas testadas da gelateria tradicional italiana e contemporânea.
- Busca instantânea por título ou por insumo (ex: receitas com pistache, cacau, maracujá).
- Botão **"Carregar na Calculadora"** para puxar a receita para edição e teste imediato.

### 🥄 4. Tabela de Insumos & Custos (190 Matérias-Primas)
- Banco de dados bromatológico completo:
  * Açúcares, Gorduras, SLNG (Sólidos Não Gordurosos do Leite), Outros Sólidos, Sólidos Totais, Água, POD, PAC e Proteínas.
- Edição rápida e simplificada do **Custo/Kg** para manter as fichas técnicas sempre alinhadas aos preços dos seus fornecedores.
- Cadastro de novos insumos personalizados.

### 👨‍🍳 5. Pré-preparos & Variegatos Caseiros (95 Formulações)
- Fórmulas de caldas base, mixes (ex: *Mix Zero*), pastas e variegatos artesanais (Brigadeiro, Caramelo Flor de Sal, Cocada, etc.).
- Fichas completas com gramagens de ingredientes e procedimentos detalhados de cocção/forno.

### 💰 6. Engenharia de Custos & Precificação
- Simulador de custos indiretos mensais (aluguel, luz, folha, marketing, sistemas, embalagens).
- Rateio fixo por unidade produzida.
- Formação de preço por markup de margem líquida desejada e taxas de cartão.
- Cálculo de:
  * **Custo da Calda Base (R$/Kg)**
  * **Custo Final com Mesclas (R$/Kg)**
  * **Custo por Bola (60 g)**
  * **Preço Sugerido do Pote (500 g)**

### 💾 7. Sistema de Backup & Importação/Exportação (.JSON)
- Armazenamento 100% offline usando **IndexedDB (Dexie.js)**.
- **Exportar Backup (.JSON):** Baixe todas as suas receitas, alterações de custos e insumos novos em um único arquivo.
- **Importar Backup (.JSON):** Restaure seus dados ou sincronize entre celular, tablet e computador com modos de mesclagem ou substituição.
- **Restaurar Padrões de Fábrica:** Recupere a base inicial da planilha com um único clique.

### 🖨️ 8. Modo Ficha Técnica / Cozinha
- Interface limpa com formatação especial para impressão física ou PDF, ideal para apoiar o operador na pesagem dos ingredientes na balança.

---

## 🎯 Parâmetros Bromatológicos Fundamentais

| Parâmetro | Significado Técnico | Efeito no Gelato |
| :--- | :--- | :--- |
| **POD** | *Potere Dolcificante* (Poder Adoçante) | Dulçor relativo à sacarose (referência = 1.0). Evita gelatos enjoativos. |
| **PAC** | *Potere Anticongelante* | Determina o ponto de congelamento e a firmeza na espátula em vitrine (-11°C a -14°C). |
| **Gorduras** | Lipídios (creme de leite, manteiga, pastas puras) | Fornecem corpo, cremosidade, palatabilidade e desaceleram o derretimento. |
| **SLNG** | Sólidos Não Gordurosos do Leite (*MSNF*) | Proteínas e lactose que retêm água livre e auxiliam na incorporação estável de ar (*overrun*). |
| **Açúcares** | Sacarose, Dextrose, Glucose, Frutose, etc. | Responsáveis diretos pela combinação de sabor doce e maciez térmica. |
| **Outros Sólidos** | Fibras, estabilizantes, cacau, polpas | Estruturam caldas à base de água (sorbets) e equilibram o extrato seco. |
| **Sólidos Totais** | Matéria seca total versus água livre | Previne a formação de cristais de gelo perceptíveis na língua. |

---

## 🛠️ Tecnologias Utilizadas

- **Core:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Banco de Dados Local:** [IndexedDB](https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API) via [Dexie.js](https://dexie.org/)
- **Motor PWA / Cache:** [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) & [Workbox](https://developer.chrome.com/docs/workbox/)
- **CI/CD:** [GitHub Actions](https://github.com/features/actions) integrado ao [GitHub Pages](https://pages.github.com/)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Git

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/gbajovedi/Receitas-e-Balanceamento-de-Gelatos.git
cd Receitas-e-Balanceamento-de-Gelatos
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no navegador:
```text
http://localhost:5173
```

### Gerar Build de Produção
```bash
npm run build
```

---

## 📁 Estrutura de Arquivos

```text
Receitas-e-Balanceamento-de-Gelatos/
├── .github/workflows/          # Automação de deploy contínuo no GitHub Pages
├── extracted_data/             # Bases brutas extraídas da planilha em JSON
├── public/                     # Favicons, ícones de alta resolução PWA e manifest
├── src/
│   ├── components/
│   │   ├── Balanceamento/      # Telas e widgets da calculadora, gauges e pós-produção
│   │   ├── Financeiro/         # Simulador de precificação e rateio de custos fixos
│   │   ├── ImportExport/       # Modal de backup e restauração JSON
│   │   ├── Ingredientes/       # Tabela de gestão e edição de insumos
│   │   ├── PrePreparos/        # Lista de bases e variegatos artesanais
│   │   ├── Receitas/           # Catálogo das 177 receitas de gelato
│   │   └── Navbar.tsx          # Barra de navegação responsiva
│   ├── core/
│   │   └── calculator.ts       # Motor matemático puro de balanceamento e termodinâmica
│   ├── data/                   # Datasets integrados (ingredientes, receitas, estilos)
│   ├── db/
│   │   └── database.ts         # Camada de banco IndexedDB (Dexie) com seed de fábrica
│   ├── types/
│   │   └── gelato.ts           # Interfaces e tipos TypeScript de alta precisão
│   ├── App.tsx                 # Controlador principal da aplicação
│   ├── index.css               # Estilos Tailwind e regras de impressão para cozinha
│   └── main.tsx                # Ponto de montagem da aplicação React
├── Planilha de Gelatos...xlsx  # Planilha original em Excel (mantida localmente)
├── index.html                  # Template HTML do PWA
├── package.json                # Dependências e scripts
├── tailwind.config.js          # Configurações do Tailwind
└── vite.config.ts              # Configuração Vite com base path e plugins PWA
```

---

## 👨‍🍳 Autor

- **Gabriel Ajovedi** — [@gbajovedi](https://github.com/gbajovedi)
