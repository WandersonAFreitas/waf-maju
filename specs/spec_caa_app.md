# **ESPECIFICAÇÃO TÉCNICA (TECHNICAL SPECIFICATION)**

## **Projeto: VoiceBoard PWA (Comunicação Alternativa e Ampliada - CAA)**

**Versão:** 1.0.0 | **Status:** Aprovado para Desenvolvimento | **Autor:** Arquiteto de Software | **Data:** Junho de 2026

## **1. VISÃO GERAL E OBJETIVOS**

### **1.1 Contexto de Negócio**

O aplicativo é uma ferramenta de Comunicação Alternativa e Ampliada (CAA) voltada para pessoas com Transtorno do Espectro Autista (TEA) e indivíduos com atraso severo na fala. A aplicação utiliza o método PECS (Picture Exchange Communication System) digitalizado, onde o usuário seleciona cartões visuais para estruturar uma frase que posteriormente é reproduzida via síntese de voz (TTS).

### **1.2 Premissas de Engenharia**

* **Offline-First Absoluto:** Uma falha na conexão de rede não pode impedir o usuário de se comunicar. O aplicativo deve inicializar e operar de forma 100% independente da nuvem.  
* **Latência Zero de Toque:** Usuários com dificuldades motoras ou sobrecarga cognitiva exigem feedback tátil imediato. Qualquer latência introduzida por renderizações desnecessárias ou delays de toque do navegador deve ser eliminada.  
* **Sobrecarga Sensorial Mínima:** Sem animações intrusivas, sem som de clique estridente, transições suaves de layout e foco em alto contraste estruturado com cores pastéis calmas.

## **2. ARQUITETURA DE SOFTWARE & PADRÕES DE PROJETO (CLEAN CODE)**

Adotamos uma variação simplificada da **Clean Architecture** adaptada para o ecossistema frontend (React), separando a camada de persistência, de gerenciamento de estado global e a interface visual.

### **2.1 Estrutura de Pastas do Projeto (Vite + React)**

src/  
├── assets/                  # Arquivos estáticos (ícones iniciais, manifest)  
├── components/              # Componentes de UI reusáveis (Design System)  
│   ├── ui/  
│   │   ├── Card.tsx         # Componente do Card de comunicação (Memoizado)  
│   │   ├── Loading.tsx      # Indicador de carregamento estilizado  
│   │   └── SafeTouch.tsx    # Elemento com remoção de atraso de toque  
│   └── shared/  
│       └── ProtectedRoute.tsx # Guarda de segurança (Trava Parental)  
├── data/                    # Camada de Persistência (IndexedDB)  
│   ├── db.ts                # Inicialização e schemas do Dexie.js  
│   └── initialData.ts       # Dados semente (seed) para o primeiro carregamento  
├── hooks/                   # Hooks customizados (Separação de lógica de negócio)  
│   ├── useAudioSynthesis.ts # Isolamento do Web Speech API (TTS)  
│   └── useImageProcessor.ts # Redimensionamento e compressão de imagens via Canvas  
├── pages/                   # Componentes de página/telas principais  
│   ├── Login/  
│   │   └── LoginScreen.tsx  # Tela de autenticação resiliente offline  
│   ├── Main/  
│   │   └── MainScreen.tsx   # Prancha de comunicação interativa  
│   └── Settings/  
│       └── SettingsScreen.tsx # Gerenciamento de cartões e grupos  
├── store/                   # Gerenciamento de Estado Global (Zustand)  
│   └── useCommunicationStore.ts  
├── App.tsx                  # Roteador interno e orquestrador de telas  
└── main.tsx                 # Bootstrap e registro do Service Worker

### **2.2 Princípios SOLID Aplicados**

* **Single Responsibility Principle (SRP):** Os componentes visuais da prancha apenas renderizam a UI recebida via props. Toda a lógica de enfileiramento de palavras e chamada do motor de voz fica encapsulada no estado global (Zustand) e nos hooks customizados.  
* **Dependency Inversion Principle (DIP):** O mecanismo de fala não interage diretamente com o componente. O componente consome o método speak() injetado via hook customizado. No futuro, se trocarmos o Web Speech API por uma inteligência artificial nativa ou de nuvem, o componente principal não precisará de alterações.

## **3. ESPECIFICAÇÕES DE DADOS (SCHEMAS & PERSISTÊNCIA)**

### **3.1 Modelo de Dados (IndexedDB via Dexie.js)**

As tabelas devem ser modeladas em TypeScript e persistidas localmente de maneira isolada.

// src/types/index.ts

export type ScreenType = 'LOGIN' | 'MAIN' | 'SETTINGS';

export interface Category {  
  id: string;          // ex: 'alimentacao', 'sentimentos'  
  label: string;       // ex: 'COMIDAS'  
  color: string;       // Classe de cor CSS do Tailwind (ex: 'bg-[#d8b4fe]')  
  textColor: string;   // Cor do texto acessível (ex: 'text-purple-950')  
  order: number;       // Sequência de ordenação lógica na grade  
}

export interface ActionCard {  
  id?: number;          // Auto-incrementável no IndexedDB  
  label: string;       // Texto exibido e falado (ex: 'QUERO', 'BANHEIRO')  
  imageSource: string; // Nome do ícone Lucide OR String Base64 da imagem comprimida  
  categoryId?: string; // Opcional. Se ausente, pertence à raiz (Ações principais)  
  order: number;       // Ordem de exibição na grade  
}

## **4. REQUISITOS FUNCIONAIS E FLUXOS POR TELA**

               +-------------------+  
               |   Login Screen    |  
               +---------+---------+  
                         |  
                         v (Bypass se offline)  
               +-------------------+  
               |    Main Screen    | <==============================+  
               +---------+---------+                                |  
                         |                                          | (Navegar / Home)  
                         | (Trava Parental Segurar 3s)              |  
                         v                                          |  
               +-------------------+                                |  
               |  Settings Screen  +--------------------------------+  
               +-------------------+

### **4.1 Tela de Login (LoginScreen.tsx)**

* **Fluxo de Autenticação Offline Resiliente:** 1. A tela aceita qualquer login simulado se o app estiver offline.  
  2. Grava um token provisório no localStorage do navegador.  
  3. No carregamento subsequente, o app verifica a existência do token no localStorage. Caso exista, concede bypass imediato para a MainScreen sem exigir credenciais novamente.

### **4.2 Tela Principal (MainScreen.tsx)**

A interface replica fielmente o comportamento de uma prancha PECS tradicional.

#### **Barra de Controle Superior:**

* **Botão Home:** Reseta o filtro de categorias ativo, voltando a exibir todas as ações raízes e categorias inferiores.  
* **Botão Configurações:** Direciona para a SettingsScreen. Possui uma **Trava Parental**. Para disparar o redirecionamento, o tutor deve pressionar e segurar o botão por 3 segundos (ou resolver uma equação matemática rápida como 7 x 8 = ?).  
* **Área do Input de Frase (Fila):** Mostra horizontalmente os cards de palavras selecionados.  
* **Botão Excluir Único (Backspace):** Apaga o último item inserido na fila de palavras.  
* **Botão Limpar Tudo (Lixeira):** Limpa totalmente a frase montada.  
* **Botão Verde "▶ FALAR" (TTS):** Dispara a leitura sequencial das palavras adicionadas.

#### **Área das Grades (Grids):**

* **Grade Superior (Ações):** Renderiza dinamicamente as ações. Se não houver categoria selecionada, mostra as ações raízes. Se uma categoria estiver ativa, exibe apenas as ações associadas à categoria selecionada, adicionando um card de cabeçalho com o botão "Voltar".  
* **Grade Inferior (Grupos):** Renderiza as categorias com cores pasteis diferenciadas (Alimentação, Sentimentos, Pessoas, etc.). O toque em uma categoria atualiza o estado global e altera a grade superior de ações para o subgrupo selecionado.

### **4.3 Tela de Configuração (SettingsScreen.tsx)**

Esta tela permite que terapeutas ou responsáveis modifiquem a estrutura de comunicação do app.

#### **Gerenciamento de Cards e Categorias:**

* **Lista Dinâmica:** Exibe todas as categorias cadastradas. Ao expandir uma categoria, lista as ações filhas.  
* **Formulário de Cadastro de Novo Botão:**  
  * Campos: Nome/Etiqueta (Label) do Botão, Grupo ao qual pertence (ou Raiz) e Ordem de classificação.  
  * **Seletor de Imagem com Duas Opções:**  
    1. *Selecionar Ícone:* Exibe uma seleção em grade de ícones minimalistas padrão (biblioteca lucide-react).  
    2. *Upload de Imagem (ou Uso da Câmera):* Aceita arquivos de imagens do dispositivo.

#### **Motor de Compressão de Imagens (Canvas Processing):**

Para evitar o estouro de armazenamento do IndexedDB e lentidão ao carregar, o processamento de imagem deve ser realizado no lado do cliente:

*A imagem subida deve ser renderizada em um <canvas> oculto, reduzida para os limites descritos e convertida em uma string Base64 leve antes de persistir no banco local.*

## **5. REQUISITOS NÃO-FUNCIONAIS (NFR) & UX TÉCNICA**

### **5.1 Otimização de Toque e Latência**

* No CSS global da aplicação, o seletor correspondente aos botões de cards deve conter a propriedade:  
  button {  
    touch-action: manipulation;  
  }

  Isso desabilita o comportamento padrão dos navegadores móveis de esperar 300ms para diferenciar um toque único de um toque duplo de zoom.  
* **Feedback Háptico:** No momento da seleção de qualquer card, acionar o motor de vibração nativo da API do navegador caso o dispositivo móvel suporte:  
  if (navigator.vibrate) {  
    navigator.vibrate(12); // Vibração sutil de confirmação táctil  
  }

### **5.2 Estratégia de Memorização (Performance React)**

* Todos os componentes de Card devem ser declarados com React.memo comparando as propriedades primitivas (label, imageSource, color) para evitar que a seleção de uma palavra force o re-render de todos os outros cartões visíveis na prancha.

## **6. CONFIGURAÇÃO PWA & ESTRATÉGIA OFFLINE**

### **6.1 Configurações de Manifesto (manifest.json / vite-plugin-pwa)**

* **Modo de Exibição:** standalone (oculta a barra do navegador).  
* **Orientação Fixa:** landscape (orientação em paisagem é o padrão ergonômico para pranchas de comunicação em tablets e dispositivos móveis).  
* **Theme Color:** #f8fafc (Slate 50).

### **6.2 Estratégias do Service Worker (Workbox)**

1. **Precaching (App Shell):** Todos os arquivos de bundles JavaScript compilados, estilos CSS gerados pelo Tailwind, fontes robóticas locais e o arquivo HTML principal devem ser baixados e armazenados em cache durante a instalação inicial.  
2. **Offline-First Assets:** Seletor de ícones e dependências estáticas do Lucide React devem ser cacheadas imediatamente com política *Cache-First*.  
3. **Módulo de Notificação de Atualização:** Implementar lógica para ouvir eventos do service worker (onNeedRefresh). Exibir uma barra discreta e não obstrutiva na parte superior da tela informando "Nova versão disponível" com um botão para recarregar instantaneamente a aplicação.

## **7. CRITÉRIOS DE ACEITAÇÃO PARA O GOOGLE JULES**

* [ ] O app compila sob TypeScript sem utilizar anotações do tipo any.  
* [ ] Os botões de cards da tela principal adicionam e reproduzem as palavras instantaneamente.  
* [ ] Imagens convertidas para Base64 não ultrapassam a média de 10 a 15KB após compressão.  
* [ ] A trava parental na tela de configurações funciona independentemente de o app estar conectado à rede.
