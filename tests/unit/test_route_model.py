"""
Testes unitários para o modelo Route
Funcionalidades testadas: US01, US02, US03, US04 (CRUD de rotas)
"""
import pytest
import json
from datetime import datetime
from src.models.route import Route
from src.models.user import db


class TestRouteModel:
    """Testes para o modelo Route"""
    
    def test_criar_rota_valida(self, app_context):
        """
        Teste US01: Criar rotas turísticas
        Verifica se uma rota é criada corretamente com dados válidos
        """
        # Arrange - Preparar dados
        pontos_turisticos = [
            {"id": 1, "nome": "Cristo Redentor", "latitude": -22.951916, "longitude": -43.210487},
            {"id": 2, "nome": "Pão de Açúcar", "latitude": -22.948658, "longitude": -43.157444}
        ]
        
        # Act - Executar ação
        rota = Route(
            nome="Rota Teste Rio",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos=json.dumps(pontos_turisticos),
            user_id=1
        )
        
        db.session.add(rota)
        db.session.commit()
        
        # Assert - Verificar resultados
        assert rota.id is not None
        assert rota.nome == "Rota Teste Rio"
        assert rota.data_inicio == datetime(2025, 8, 15, 9, 0)
        assert rota.user_id == 1
        assert json.loads(rota.pontos_turisticos) == pontos_turisticos
        
    def test_converter_rota_para_dict(self, app_context):
        """
        Teste US03: Consultar rotas turísticas
        Verifica se a conversão para dicionário funciona corretamente
        """
        # Arrange
        pontos = [{"id": 1, "nome": "Cristo Redentor"}]
        rota = Route(
            nome="Rota Consulta",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos=json.dumps(pontos),
            user_id=1
        )
        
        db.session.add(rota)
        db.session.commit()
        
        # Act
        rota_dict = rota.to_dict()
        
        # Assert
        assert isinstance(rota_dict, dict)
        assert rota_dict['nome'] == "Rota Consulta"
        assert rota_dict['pontos_turisticos'] == pontos
        assert rota_dict['user_id'] == 1
        assert 'id' in rota_dict
        assert 'created_at' in rota_dict
        assert 'updated_at' in rota_dict
        
    def test_definir_pontos_turisticos(self, app_context):
        """
        Teste US01/US02: Criar/Atualizar rotas com pontos turísticos
        Verifica métodos de manipulação de pontos turísticos
        """
        # Arrange
        rota = Route(
            nome="Rota Pontos",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos="[]",
            user_id=1
        )
        
        pontos_novos = [
            {"id": 1, "nome": "Cristo Redentor"},
            {"id": 2, "nome": "Pão de Açúcar"},
            {"id": 3, "nome": "Copacabana"}
        ]
        
        # Act
        rota.set_pontos_turisticos(pontos_novos)
        pontos_retornados = rota.get_pontos_turisticos()
        
        # Assert
        assert pontos_retornados == pontos_novos
        assert len(pontos_retornados) == 3
        
    def test_obter_pontos_turisticos_vazios(self, app_context):
        """
        Teste de edge case: pontos turísticos vazios
        """
        # Arrange
        rota = Route(
            nome="Rota Vazia",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos="",
            user_id=1
        )
        
        # Act
        pontos = rota.get_pontos_turisticos()
        
        # Assert
        assert pontos == []
        
    def test_representacao_string_rota(self, app_context):
        """
        Teste da representação em string do modelo
        """
        # Arrange & Act
        rota = Route(
            nome="Rota Representação",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos="[]",
            user_id=1
        )
        
        # Assert
        assert str(rota) == "<Route Rota Representação>"
        
    def test_atualizar_rota_existente(self, app_context):
        """
        Teste US02: Atualizar rotas turísticas
        Verifica se uma rota pode ser atualizada corretamente
        """
        # Arrange - Criar rota inicial
        rota = Route(
            nome="Rota Original",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos=json.dumps([{"id": 1, "nome": "Cristo Redentor"}]),
            user_id=1
        )
        
        db.session.add(rota)
        db.session.commit()
        rota_id = rota.id
        
        # Act - Atualizar rota
        rota_para_atualizar = Route.query.get(rota_id)
        rota_para_atualizar.nome = "Rota Atualizada"
        rota_para_atualizar.data_inicio = datetime(2025, 8, 16, 10, 0)
        novos_pontos = [
            {"id": 1, "nome": "Cristo Redentor"},
            {"id": 2, "nome": "Pão de Açúcar"}
        ]
        rota_para_atualizar.set_pontos_turisticos(novos_pontos)
        rota_para_atualizar.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Assert
        rota_verificacao = Route.query.get(rota_id)
        assert rota_verificacao.nome == "Rota Atualizada"
        assert rota_verificacao.data_inicio == datetime(2025, 8, 16, 10, 0)
        assert len(rota_verificacao.get_pontos_turisticos()) == 2
        assert rota_verificacao.updated_at > rota_verificacao.created_at
        
    def test_deletar_rota(self, app_context):
        """
        Teste US04: Excluir rotas turísticas
        Verifica se uma rota pode ser deletada corretamente
        """
        # Arrange - Criar rota
        rota = Route(
            nome="Rota Para Deletar",
            data_inicio=datetime(2025, 8, 15, 9, 0),
            pontos_turisticos=json.dumps([{"id": 1, "nome": "Cristo Redentor"}]),
            user_id=1
        )
        
        db.session.add(rota)
        db.session.commit()
        rota_id = rota.id
        
        # Verificar que existe
        assert Route.query.get(rota_id) is not None
        
        # Act - Deletar rota
        db.session.delete(rota)
        db.session.commit()
        
        # Assert
        assert Route.query.get(rota_id) is None
