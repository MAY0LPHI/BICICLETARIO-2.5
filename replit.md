# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web construída com JavaScript, HTML e CSS, projetada para gerenciar clientes, registrar bicicletas e controlar entradas/saídas de um estacionamento de bicicletas. O projeto visa otimizar a operação de bicicletários, oferecendo funcionalidades de cadastro, registro de movimentação, exportação de dados e configurações personalizáveis, incluindo uma versão desktop executável.

## User Preferences
- Idioma: Português (Brasil)
- Aplicação projetada para lojas locais de estacionamento de bicicletas
- Interface com suporte a tema escuro/claro
- Dados separados por plataforma (navegador e desktop) em pastas distintas
- Execução local no computador via navegador

## System Architecture
O sistema adota uma arquitetura modular baseada em Vanilla JavaScript (ES6+ Modules), HTML e CSS, utilizando Tailwind CSS para estilização e Lucide Icons para ícones. A persistência de dados é realizada via LocalStorage ou arquivos JSON.

- **UI/UX**:
  - Interface responsiva com suporte a temas Claro, Escuro e detecção da preferência do sistema operacional.
  - Modais para edições e confirmações.
  - Abas de navegação para diferentes módulos (Cadastros, Registros Diários, Configurações).
  - Feedback visual para ações e seleções (ex: tema selecionado, resultados de busca).

- **Módulos Core**:
  - **app-modular.js**: Ponto de entrada, inicialização da aplicação, gerenciamento de tema e controle de abas.
  - **Cadastros (js/cadastros/)**: Gerencia clientes (adição, busca, edição com validação de CPF, prevenção de duplicidade) e bicicletas (cadastro múltiplo por cliente, edição, visualização de histórico).
  - **Registros (js/registros/)**: Controla registros diários de entrada/saída, com opções de "Registrar Saída", "Remover Acesso", "Alterar Registro" e "Adicionar Outra Bike". Diferenciação visual entre tipos de saída e organização hierárquica dos registros por Ano → Mês → Dia.
  - **Configuração (js/configuracao/)**: Permite seleção de tema, busca avançada global, importação/exportação de dados (CSV, Excel) e exportação de registros de acesso por cliente (PDF, Excel).
  - **Shared (js/shared/)**: Contém utilitários (formatação, validação de CPF, geração de UUID) e funções para gerenciamento e migração de dados no LocalStorage.

- **Fluxo de Dados**:
  - Dados armazenados no LocalStorage com estruturas separadas para clientes (`bicicletario_clients`) e registros (`bicicletario_registros`, `bicicletario_registros_organizados`, `bicicletario_registros_resumo`).
  - Sistema de "snapshot" para bicicletas, registrando uma cópia dos dados da bicicleta no momento da entrada para preservar o histórico.
  - Integração com API de arquivos para salvar dados em disco quando disponível.

- **Versão Desktop (Electron)**:
  - O projeto inclui uma versão desktop executável (`.exe`) construída com Electron, encapsulando a aplicação web para distribuição autônoma. Configurações para build no Windows (64-bit) com instalador NSIS.

## External Dependencies
- **Tailwind CSS**: Framework CSS para estilização (servido localmente em `libs/tailwind.min.js`).
- **Lucide Icons**: Biblioteca de ícones (servido localmente em `libs/lucide.js`).
- **SheetJS (xlsx)**: Biblioteca para leitura e escrita de arquivos Excel (servido localmente em `libs/xlsx.full.min.js`).
- **LocalStorage**: Para persistência de dados no navegador.
- **Python 3.12 HTTP Server**: Utilizado para servir a aplicação localmente durante o desenvolvimento.
- **Electron**: Framework para construção de aplicações desktop com tecnologias web.
- **Electron Builder**: Ferramenta para empacotamento e distribuição de aplicações Electron.

**Nota**: Todas as bibliotecas JavaScript são servidas localmente, permitindo que a aplicação funcione completamente offline.

## Sistema de Armazenamento em Arquivos

### Estrutura de Pastas Separada por Plataforma

**24/10/2025 - Nova Organização de Dados**:
- Dados agora organizados em pastas separadas por plataforma
- **dados/navegador/**: Dados da versão web/navegador
  - `clientes/` - Arquivos JSON com cadastros de clientes (formato: `{CPF}.json`)
  - `registros/` - Registros organizados por `ano/mes/dia/{id}.json`
- **dados/desktop/**: Dados da versão desktop Electron
  - `clientes/` - Arquivos JSON com cadastros de clientes
  - `registros/` - Registros organizados por `ano/mes/dia/{dia}.json`

### Versão Desktop (Electron)
- **19/10/2025 - Sistema de Armazenamento em Arquivos Locais**:
  - Dados salvos em arquivos JSON organizados quando rodando na versão desktop
  - `electron/storage-backend.js` gerencia arquivos com Node.js fs
  - IPC handlers (ipcMain/ipcRenderer) para comunicação segura
  - Localização Windows: `%APPDATA%\bicicletario-desktop\dados\desktop\`
  - Backup simples: copiar pasta `dados/desktop/`
  - Formato JSON legível, editável e auditável

### Versão Web/Navegador
- **24/10/2025 - API de Armazenamento em Arquivos**:
  - `storage_api.py` rodando na porta 5001
  - API REST para salvar/carregar dados em arquivos
  - Dados salvos em: `dados/navegador/`
  - Funciona em paralelo com localStorage para backup duplo
  - `js/shared/file-storage.js` cliente JavaScript para a API
  - `js/shared/storage.js` detecta automaticamente se a API está disponível e usa arquivos quando possível

## Atalhos de Inicialização

**24/10/2025 - Scripts de Atalho para Fácil Execução Local**:

### Windows (.bat):
- `INICIAR-NAVEGADOR.bat` - Abre no navegador padrão (recomendado)
- `INICIAR-CHROME.bat` - Abre especificamente no Google Chrome
- `INICIAR-FIREFOX.bat` - Abre especificamente no Mozilla Firefox
- `INICIAR-EDGE.bat` - Abre especificamente no Microsoft Edge

### Linux/Mac (.sh):
- `INICIAR-NAVEGADOR.sh` - Abre no navegador padrão

**Como usar:**
- Windows: Clique duas vezes no arquivo .bat desejado
- Linux/Mac: Execute `./INICIAR-NAVEGADOR.sh` no terminal

**Documentação completa:** 
- `LEIA-ME.txt` - Guia rápido e simples
- `COMO-USAR-ATALHOS.md` - Guia completo com troubleshooting

## Replit Setup and Deployment
- **24/10/2025 - Configuração Atual**:
  - Projeto configurado para rodar no ambiente Replit
  - Servidor Python 3.12 HTTP na porta 5000 (0.0.0.0) servindo a aplicação web
  - Storage API na porta 5001 (localhost) para persistência em arquivos
  - Workflow "Web Server" configurado para iniciar automaticamente ambos servidores
  - Código JavaScript suporta tanto localStorage quanto API de arquivos
  - Cache-control headers configurados para evitar cache de arquivos estáticos
  - `.gitignore` configurado para ignorar dados mas manter estrutura de pastas

## Recent Changes

**25/10/2025 - Suporte Offline Completo**:
- ✅ Todas as dependências externas baixadas localmente (pasta `libs/`)
- ✅ Tailwind CSS, Lucide Icons e SheetJS agora servidos localmente
- ✅ Aplicação funciona completamente sem conexão à internet
- ✅ index.html e test_theme.html atualizados para usar recursos locais
- ✅ Botões e interações funcionam normalmente mesmo offline
- ✅ Dados salvos em localStorage sempre disponíveis
- ✅ API de arquivos (porta 5001) funciona localmente quando disponível

**25/10/2025 - Replit Import Setup Completed**:
- ✅ Project imported from GitHub and configured for Replit environment
- ✅ Python 3.12 HTTP server running on port 5000 (0.0.0.0) for web frontend
- ✅ Storage API running on port 5001 (localhost) for file-based persistence
- ✅ Web Server workflow configured with webview output type
- ✅ Deployment configured as autoscale (stateless web application)
- ✅ .gitignore created to protect user data while preserving directory structure
- ✅ Data directories created with .gitkeep files for version control
- ✅ Application verified working - all features functional
- ✅ Cache-control headers configured to prevent stale content in Replit iframe

**24/10/2025 - Correção de Scripts e Integração de Arquivos**:
- ✅ Scripts .bat corrigidos para evitar erros de codificação
- ✅ Removidos caracteres especiais em português que causavam problemas
- ✅ Scripts agora matam processos antigos nas portas 5000 e 5001
- ✅ `js/shared/storage.js` atualizado para integrar com API de arquivos
- ✅ Detecção automática da disponibilidade da API de arquivos
- ✅ Dados salvos automaticamente em `dados/navegador/` quando API disponível
- ✅ Fallback para localStorage quando API indisponível
- ✅ Criado `LEIA-ME.txt` com guia rápido de uso

**24/10/2025 - Reorganização de Dados e Atalhos**:
- ✅ Estrutura de pastas separada por plataforma (dados/navegador e dados/desktop)
- ✅ `storage_api.py` atualizado para usar `dados/navegador/`
- ✅ `electron/storage-backend.js` atualizado para usar `dados/desktop/`
- ✅ Scripts de atalho criados para todas as plataformas (Windows, Linux, Mac)
- ✅ Scripts específicos para navegadores (Chrome, Firefox, Edge)
- ✅ Documentação completa em `COMO-USAR-ATALHOS.md`
- ✅ `.gitignore` atualizado para ignorar dados mas manter estrutura
- ✅ Arquivos `.gitkeep` criados para preservar pastas vazias no Git

**21/10/2025 - Importação do GitHub e Setup Inicial**:
- ✅ Projeto importado do GitHub e configurado para Replit
- ✅ Servidor Python HTTP configurado na porta 5000 (0.0.0.0)
- ✅ Workflow configurado para iniciar automaticamente com webview
- ✅ Deployment configurado como autoscale (aplicação web stateless)
- ✅ Aplicação verificada e funcionando corretamente
- ✅ Todas as funcionalidades testadas: cadastro de clientes, bicicletas e registros diários
- ✅ Dependências Electron (electron, electron-builder) já instaladas para builds desktop
