# Sistema de Rotas Turísticas

Sistema web para criação e gerenciamento de rotas turísticas com pontos de interesse.

## Funcionalidades

- ✅ Criação de rotas turísticas personalizadas
- ✅ Gerenciamento de pontos turísticos
- ✅ Exportação de rotas para PDF
- ✅ Sistema de notificações
- ✅ Interface web responsiva

## Estrutura do Projeto

```
├── main.py                 # Arquivo principal da aplicação Flask
├── requirements.txt        # Dependências Python
├── package.json           # Configurações do frontend
├── tourist_spots.json     # Dados dos pontos turísticos
├── database/              # Banco de dados SQLite
│   └── app.db
├── src/                   # Código fonte
│   ├── components/        # Componentes React
│   │   ├── Header.jsx
│   │   ├── MapComponent.jsx
│   │   ├── RouteCreator.jsx
│   │   ├── RouteList.jsx
│   │   ├── RouteViewer.jsx
│   │   ├── TouristSpots.jsx
│   │   └── TouristSpotSelector.jsx
│   ├── models/           # Modelos de dados (SQLAlchemy)
│   │   ├── user.py
│   │   ├── route.py
│   │   └── tourist_spot.py
│   ├── routes/           # Rotas da API Flask
│   │   ├── __init__.py
│   │   ├── user_routes.py
│   │   ├── routes.py
│   │   ├── tourist_spots.py
│   │   ├── pdf_export.py
│   │   └── notifications.py
│   ├── services/         # Serviços do frontend
│   │   └── api.js
│   └── ui/              # Componentes de interface
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       └── label.jsx
└── venv/                # Ambiente virtual Python
```

## Instalação e Execução

### Backend (Python/Flask)

1. **Criar e ativar ambiente virtual:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Linux/Mac
   # ou
   venv\Scripts\activate     # Windows
   ```

2. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Executar servidor:**
   ```bash
   python3 main.py
   ```

   O servidor estará disponível em: `http://localhost:5000`

### Frontend (React)

1. **Instalar dependências do Node.js:**
   ```bash
   npm install
   ```

2. **Executar em modo desenvolvimento:**
   ```bash
   npm start
   ```

## 🧪 Testes

O projeto possui uma estrutura completa de testes que valida todas as funcionalidades do MVP conforme a Definition of Done (DOD).

### Estrutura de Testes
```
tests/
├── conftest.py              # Configurações pytest
├── jest.config.js          # Configuração Jest
├── run_tests.py            # Script Python de automação
├── run_tests.sh            # Script Bash de automação
├── unit/                   # Testes unitários
├── backend/                # Testes de integração backend
├── integration/            # Testes de APIs externas
└── components/             # Testes de componentes React
```

### Executar Testes

**Opção 1: Script Automatizado (Recomendado)**
```bash
cd tests
./run_tests.sh                 # Todos os testes
./run_tests.sh --coverage      # Com relatório de cobertura
python3 run_tests.py --all     # Via Python
```

**Opção 2: Comandos Específicos**

Backend (Python):
```bash
cd tests
# Testes unitários
python3 -m pytest unit/ -v

# Testes de integração  
python3 -m pytest backend/ -v
python3 -m pytest integration/ -v

# Todos os testes backend com cobertura
python3 -m pytest . --cov=../src --cov-report=html:../reports/backend_coverage
```

Frontend (React):
```bash
# Instalar dependências
npm install

# Testes de componentes
npm run test -- tests/components/

# Testes com cobertura
npm run test:coverage
```

### Relatórios de Teste

Os relatórios são gerados automaticamente na pasta `reports/`:

- **Backend**: `reports/backend_coverage/index.html`
- **Frontend**: `reports/frontend_coverage/index.html`
- **Pytest HTML**: `reports/pytest_report.html`

Consulte `tests/README.md` para documentação detalhada dos testes.

## API Endpoints

### Usuários
- `POST /api/users` - Criar usuário
- `GET /api/users` - Listar usuários
- `GET /api/users/<id>` - Obter usuário específico
- `PUT /api/users/<id>` - Atualizar usuário
- `DELETE /api/users/<id>` - Deletar usuário

### Rotas
- `POST /api/routes` - Criar rota
- `GET /api/routes` - Listar rotas
- `GET /api/routes/<id>` - Obter rota específica
- `PUT /api/routes/<id>` - Atualizar rota
- `DELETE /api/routes/<id>` - Deletar rota

### Pontos Turísticos
- `GET /api/tourist-spots` - Listar pontos turísticos
- `POST /api/tourist-spots` - Criar ponto turístico
- `GET /api/tourist-spots/<id>` - Obter ponto específico
- `PUT /api/tourist-spots/<id>` - Atualizar ponto
- `DELETE /api/tourist-spots/<id>` - Deletar ponto

### Exportação PDF
- `GET /api/routes/<id>/export-pdf` - Exportar rota para PDF

### Notificações
- `GET /api/notifications` - Listar notificações
- `POST /api/notifications` - Criar notificação

## Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **SQLite** - Banco de dados
- **ReportLab** - Geração de PDFs
- **Flask-CORS** - Habilitação de CORS

### Frontend
- **React** - Biblioteca JavaScript
- **CSS3** - Estilização
- **JavaScript ES6+** - Linguagem de programação

## Resolução de Problemas Comuns

### Erro: "unable to open database file"
- **Causa:** Pasta `database/` não existe
- **Solução:** A pasta é criada automaticamente, mas certifique-se que há permissões de escrita

### Erro: "Import flask could not be resolved"
- **Causa:** Ambiente virtual não ativado ou dependências não instaladas
- **Solução:** Ative o ambiente virtual e instale as dependências

## Desenvolvimento

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.
