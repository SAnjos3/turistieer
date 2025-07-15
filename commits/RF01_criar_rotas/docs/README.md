# RF01 - Criar Rotas Turísticas

## User Story
**US01** - Como usuário, quero criar rotas turísticas e agendar seu horário de início, para otimizar meu planejamento de visitas.

## Prioridade: Must Have
**WSJF**: 17 | **MVP**: ✅

## Funcionalidades Implementadas

### Backend
- **Modelo**: `route.py` - Define a estrutura de dados da rota
- **API**: `create_routes_api.py` - Endpoint POST /routes para criação
- **Validações**:
  - Nome obrigatório
  - Data de início obrigatória e futura
  - Data de fim opcional, mas deve ser posterior ao início
  - Máximo 5 pontos turísticos por rota
  - Formato de data ISO válido

### Frontend
- **Componente**: `RouteCreator.jsx` - Interface de criação de rotas
- **Funcionalidades**:
  - Formulário de criação com validação
  - Seleção de pontos turísticos
  - Validação de datas em tempo real
  - Feedback visual de erros

### Testes
- **API**: Testes de criação, validação e edge cases
- **Modelo**: Testes unitários do modelo Route
- **Frontend**: Testes de componente React

## Dependências Compartilhadas
- `_shared/models/user.py` - Modelo de usuário
- `_shared/config/main.py` - Configuração Flask
- `_shared/config/tourist_spots.json` - Dados dos pontos turísticos
- `_shared/tests/conftest.py` - Configurações de teste

## Definition of Done (DoD)

### ✅ Critérios Técnicos
- [ ] Código implementado e testado
- [ ] Testes unitários passando (>80% cobertura)
- [ ] Testes de integração passando
- [ ] Validações de entrada implementadas
- [ ] Tratamento de erros implementado

### ✅ Critérios Funcionais
- [ ] Usuário pode criar rota com nome e data
- [ ] Usuário pode adicionar até 5 pontos turísticos
- [ ] Sistema valida datas futuras
- [ ] Sistema valida ordem cronológica das datas
- [ ] Feedback adequado em caso de erro

### ✅ Critérios de Qualidade
- [ ] Interface responsiva
- [ ] Acessibilidade básica implementada
- [ ] Performance adequada (<2s para criação)
- [ ] Logs de auditoria implementados

## Como executar

### Backend
```bash
# A partir da raiz do projeto
python -m pytest commits/RF01_criar_rotas/tests/ -v
```

### Frontend
```bash
npm test -- commits/RF01_criar_rotas/tests/
```

## Arquivos neste commit
- `backend/route.py` - Modelo de dados
- `backend/create_routes_api.py` - API de criação
- `frontend/RouteCreator.jsx` - Componente React
- `tests/` - Todos os testes relacionados
- `docs/README.md` - Esta documentação
