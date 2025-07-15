# Guia de Migração - Turistieer MVP

Este guia explica como usar a estrutura organizada por requisitos para criar commits granulares no novo repositório.

## Estrutura Criada

```
commits/
├── _shared/                    # Código compartilhado entre todos os requisitos
├── RF01_criar_rotas/           # US01 - Criar rotas turísticas  
├── RF02_atualizar_rotas/       # US02 - Atualizar rotas turísticas
├── RF03_consultar_rotas/       # US03 - Consultar rotas turísticas
├── RF04_excluir_rotas/         # US04 - Excluir rotas turísticas
├── RF07_consultar_pontos_turisticos/  # US07 - Consultar pontos turísticos
├── RF17_obter_localizacao/     # US17 - Obter localização atual
└── RF18_salvar_pdf/            # US18 - Salvar rotas em PDF
```

## Ordem de Commits Recomendada

### 1. Commit Base - Infraestrutura
**Arquivos do `_shared/`:**
- `config/main.py` - Aplicação Flask base
- `config/requirements.txt` - Dependências Python
- `config/package.json` - Dependências Node.js
- `config/tourist_spots.json` - Dados dos pontos turísticos
- `models/user.py` - Modelo base de usuário
- `static/index.html` - HTML base
- `static/style.css` - CSS base
- `tests/conftest.py` - Configuração de testes

**Commit Message:** `feat: infraestrutura base do projeto turistieer`

### 2. RF01 - Criar Rotas Turísticas
**Arquivos:**
- `backend/route.py` - Modelo de rota
- `backend/create_routes_api.py` - API de criação
- `frontend/RouteCreator.jsx` - Interface de criação
- `tests/` - Todos os testes de criação

**Validação DoD:**
- [ ] Usuário pode criar rota com nome e data
- [ ] Validação de datas futuras funciona
- [ ] Máximo 5 pontos por rota
- [ ] Testes passando

**Commit Message:** `feat(RF01): implementar criação de rotas turísticas`

### 3. RF07 - Consultar Pontos Turísticos
**Arquivos:**
- `backend/tourist_spot.py` - Modelo de ponto turístico
- `frontend/TouristSpots.jsx` - Lista de pontos
- `frontend/TouristSpotSelector.jsx` - Seletor de pontos
- `tests/` - Testes de consulta de pontos

**Dependência:** Precisa dos pontos turísticos do `_shared`

**Commit Message:** `feat(RF07): implementar consulta de pontos turísticos`

### 4. RF17 - Obter Localização
**Arquivos:**
- `frontend/MapComponent.jsx` - Componente de mapa
- `tests/` - Testes de geolocalização

**Commit Message:** `feat(RF17): implementar obtenção de localização atual`

### 5. RF03 - Consultar Rotas
**Arquivos:**
- `frontend/RouteList.jsx` - Lista de rotas
- `frontend/RouteViewer.jsx` - Visualizador de rota
- `tests/` - Testes de consulta

**Dependências:** RF01 (modelo de rota), RF17 (mapa)

**Commit Message:** `feat(RF03): implementar consulta e visualização de rotas`

### 6. RF02 - Atualizar Rotas
**Arquivos:**
- `backend/update_routes_api.py` - API de atualização
- `tests/` - Testes de atualização

**Dependências:** RF01 (modelo de rota), RF03 (visualização)

**Commit Message:** `feat(RF02): implementar atualização de rotas turísticas`

### 7. RF04 - Excluir Rotas
**Arquivos:**
- `tests/` - Testes de exclusão
- (API de exclusão pode ser extraída do routes.py original)

**Dependências:** RF01, RF03

**Commit Message:** `feat(RF04): implementar exclusão de rotas turísticas`

### 8. RF18 - Salvar PDF
**Arquivos:**
- `backend/pdf_export.py` - Exportação para PDF
- `tests/` - Testes de PDF

**Dependências:** RF03 (visualização de rota)

**Commit Message:** `feat(RF18): implementar exportação de rotas para PDF`

## Como Executar Cada Commit

### Preparação do Ambiente
```bash
# Instalar dependências do _shared
pip install -r _shared/config/requirements.txt
npm install # usando _shared/config/package.json
```

### Para Cada Requisito
```bash
# Copiar arquivos do _shared primeiro
cp -r commits/_shared/* ./

# Copiar arquivos do requisito específico
cp -r commits/RF01_criar_rotas/* ./

# Executar testes
python -m pytest tests/ -v
npm test

# Se tudo passar, fazer commit
git add .
git commit -m "feat(RF01): implementar criação de rotas turísticas"
```

## Validação do DoD

Cada commit deve atender aos critérios do Definition of Done:

### ✅ Critérios Técnicos
- Testes unitários passando (>80% cobertura)
- Testes de integração passando  
- Validações de entrada implementadas
- Tratamento de erros implementado

### ✅ Critérios Funcionais  
- Funcionalidade completa implementada
- Interface de usuário funcional
- Validações de negócio implementadas

### ✅ Critérios de Qualidade
- Código limpo e documentado
- Performance adequada
- Acessibilidade básica

## Dependências entre Requisitos

```
_shared (base)
├── RF01 (criar rotas)
├── RF07 (pontos turísticos) 
├── RF17 (localização)
├── RF03 (consultar rotas) ← depende de RF01, RF17
├── RF02 (atualizar rotas) ← depende de RF01, RF03  
├── RF04 (excluir rotas) ← depende de RF01, RF03
└── RF18 (salvar PDF) ← depende de RF03
```

## Notas Importantes

1. **Sempre copiar `_shared` primeiro** em cada commit
2. **Executar testes** antes de cada commit  
3. **Validar funcionalmente** cada requisito
4. **Manter ordem de dependências** entre requisitos
5. **Documentar problemas** encontrados durante migração

## Arquivos que Precisam de Atenção

- `src/routes/routes.py` - Contém múltiplas funcionalidades, precisa ser dividido
- `static/app.js` - Pode conter código de múltiplos requisitos
- Configurações de banco de dados podem precisar de ajustes

## Contato

Para dúvidas sobre a migração, consulte a documentação de cada requisito em `commits/RFxx_*/docs/README.md`
