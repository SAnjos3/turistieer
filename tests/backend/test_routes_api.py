"""
Testes de integração para os endpoints de rotas
Funcionalidades testadas: US01, US02, US03, US04 (CRUD de rotas)
"""
import pytest
import json
from datetime import datetime


class TestRoutesAPI:
    """Testes para os endpoints de rotas turísticas"""
    
    def test_criar_rota_valida(self, client, sample_route_data):
        """
        Teste US01: Criar rotas turísticas
        Verifica criação de rota via API POST /api/routes
        """
        # Act
        response = client.post('/api/routes',
                             data=json.dumps(sample_route_data),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 201
        
        data = json.loads(response.data)
        assert data['nome'] == sample_route_data['nome']
        assert data['user_id'] == sample_route_data['user_id']
        assert len(data['pontos_turisticos']) == 2
        assert 'id' in data
        assert 'created_at' in data
        
    def test_criar_rota_sem_nome(self, client):
        """
        Teste US01: Validação - rota sem nome deve falhar
        """
        # Arrange
        dados_invalidos = {
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": [],
            "user_id": 1
        }
        
        # Act
        response = client.post('/api/routes',
                             data=json.dumps(dados_invalidos),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Nome da rota é obrigatório' in data['error']
        
    def test_criar_rota_sem_data_inicio(self, client):
        """
        Teste US01: Validação - rota sem data de início deve falhar
        """
        # Arrange
        dados_invalidos = {
            "nome": "Rota Teste",
            "pontos_turisticos": [],
            "user_id": 1
        }
        
        # Act
        response = client.post('/api/routes',
                             data=json.dumps(dados_invalidos),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Data de início é obrigatória' in data['error']
        
    def test_criar_rota_muitos_pontos(self, client):
        """
        Teste US01: Validação - máximo 5 pontos turísticos
        """
        # Arrange
        pontos_excesso = [{"id": i, "nome": f"Ponto {i}"} for i in range(1, 7)]  # 6 pontos
        dados_invalidos = {
            "nome": "Rota com Muitos Pontos",
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": pontos_excesso,
            "user_id": 1
        }
        
        # Act
        response = client.post('/api/routes',
                             data=json.dumps(dados_invalidos),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Máximo de 5 pontos' in data['error']
        
    def test_listar_rotas_usuario(self, client, create_sample_route):
        """
        Teste US03: Consultar rotas turísticas
        Verifica listagem de rotas via GET /api/routes
        """
        # Arrange - Criar algumas rotas
        create_sample_route()
        create_sample_route({
            "nome": "Segunda Rota",
            "data_inicio": "2025-08-16T10:00:00",
            "pontos_turisticos": [{"id": 1, "nome": "Cristo Redentor"}],
            "user_id": 1
        })
        
        # Act
        response = client.get('/api/routes?user_id=1')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) >= 2
        
        # Verificar estrutura dos dados
        for rota in data:
            assert 'id' in rota
            assert 'nome' in rota
            assert 'data_inicio' in rota
            assert 'pontos_turisticos' in rota
            assert 'user_id' in rota
            
    def test_obter_rota_especifica(self, client, create_sample_route):
        """
        Teste US03: Consultar rotas turísticas
        Verifica busca de rota específica via GET /api/routes/{id}
        """
        # Arrange - Criar rota
        response_criacao = create_sample_route()
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Act
        response = client.get(f'/api/routes/{rota_id}')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['id'] == rota_id
        assert data['nome'] == "Rota Teste"
        assert 'pontos_turisticos' in data
        
    def test_obter_rota_inexistente(self, client):
        """
        Teste US03: Consultar rota inexistente deve retornar 404
        """
        # Act
        response = client.get('/api/routes/99999')
        
        # Assert
        assert response.status_code == 404
        
    def test_atualizar_rota_existente(self, client, create_sample_route):
        """
        Teste US02: Atualizar rotas turísticas
        Verifica atualização via PUT /api/routes/{id}
        """
        # Arrange - Criar rota
        response_criacao = create_sample_route()
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        dados_atualizacao = {
            "nome": "Rota Atualizada",
            "data_inicio": "2025-08-20T14:00:00",
            "pontos_turisticos": [
                {"id": 1, "nome": "Cristo Redentor"},
                {"id": 2, "nome": "Pão de Açúcar"},
                {"id": 3, "nome": "Copacabana"}
            ]
        }
        
        # Act
        response = client.put(f'/api/routes/{rota_id}',
                            data=json.dumps(dados_atualizacao),
                            content_type='application/json')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['nome'] == "Rota Atualizada"
        assert len(data['pontos_turisticos']) == 3
        assert 'updated_at' in data
        
    def test_atualizar_rota_inexistente(self, client):
        """
        Teste US02: Atualizar rota inexistente deve retornar 404
        """
        # Arrange
        dados_atualizacao = {
            "nome": "Rota Inexistente"
        }
        
        # Act
        response = client.put('/api/routes/99999',
                            data=json.dumps(dados_atualizacao),
                            content_type='application/json')
        
        # Assert
        assert response.status_code == 404
        
    def test_deletar_rota_existente(self, client, create_sample_route):
        """
        Teste US04: Excluir rotas turísticas
        Verifica exclusão via DELETE /api/routes/{id}
        """
        # Arrange - Criar rota
        response_criacao = create_sample_route()
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Verificar que existe
        response_verificacao = client.get(f'/api/routes/{rota_id}')
        assert response_verificacao.status_code == 200
        
        # Act - Deletar
        response = client.delete(f'/api/routes/{rota_id}')
        
        # Assert
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
        assert 'deletada com sucesso' in data['message']
        
        # Verificar que não existe mais
        response_verificacao_final = client.get(f'/api/routes/{rota_id}')
        assert response_verificacao_final.status_code == 404
        
    def test_deletar_rota_inexistente(self, client):
        """
        Teste US04: Deletar rota inexistente deve retornar 404
        """
        # Act
        response = client.delete('/api/routes/99999')
        
        # Assert
        assert response.status_code == 404
        
    def test_calcular_rota_otimizada(self, client):
        """
        Teste funcionalidade de otimização de rotas
        """
        # Arrange
        pontos_para_otimizar = [
            {"id": 1, "nome": "Cristo Redentor", "latitude": -22.951916, "longitude": -43.210487},
            {"id": 2, "nome": "Pão de Açúcar", "latitude": -22.948658, "longitude": -43.157444},
            {"id": 3, "nome": "Copacabana", "latitude": -22.971177, "longitude": -43.182543}
        ]
        
        # Act
        response = client.post('/api/calculate-route',
                             data=json.dumps({"points": pontos_para_otimizar}),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'optimized_points' in data
        assert 'total_distance' in data
        assert 'estimated_time' in data
        assert 'route_data' in data
        
    def test_calcular_rota_poucos_pontos(self, client):
        """
        Teste validação: calcular rota com menos de 2 pontos deve falhar
        """
        # Arrange
        ponto_unico = [{"id": 1, "nome": "Cristo Redentor"}]
        
        # Act
        response = client.post('/api/calculate-route',
                             data=json.dumps({"points": ponto_unico}),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
