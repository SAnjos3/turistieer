"""
Testes específicos para validação de datas e horários na criação de rotas
Complementa test_routes_api.py com cenários específicos de validação temporal
"""
import pytest
import json
from datetime import datetime, timedelta


class TestDateTimeValidation:
    """Testes específicos para validação de datas e horários"""
    
    def test_criar_rota_horario_inicio_valido(self, client, sample_route_data):
        """
        Teste US01: Criar rota com horário de início válido (futuro)
        
        Critério: Deve aceitar datas futuras com diferentes horários
        """
        # Arrange - Data 1 hora no futuro
        data_futura = (datetime.now() + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
        
        sample_route_data["nome"] = "Rota Horário Válido"
        sample_route_data["data_inicio"] = data_futura
        
        # Act
        response = client.post('/api/routes',
                             data=json.dumps(sample_route_data),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['nome'] == sample_route_data['nome']
        
    def test_criar_rota_data_limite_muito_distante(self, client, sample_route_data):
        """
        Teste US01: Validar rota com data muito distante (ex: 1 ano no futuro)
        
        Critério: Deve aceitar datas futuras razoáveis
        """
        # Arrange - Data 1 ano no futuro
        data_distante = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%S")
        
        sample_route_data["nome"] = "Rota Data Distante"
        sample_route_data["data_inicio"] = data_distante
        
        # Act
        response = client.post('/api/routes',
                             data=json.dumps(sample_route_data),
                             content_type='application/json')
        
        # Assert
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['nome'] == sample_route_data['nome']
