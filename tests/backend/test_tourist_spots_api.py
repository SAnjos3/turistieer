"""
Testes de integração para os endpoints de pontos turísticos
Funcionalidade testada: US07 (Consultar pontos turísticos)
"""
import pytest
import json


class TestTouristSpotsAPI:
    """Testes para os endpoints de pontos turísticos"""
    
    def test_listar_pontos_turisticos(self, client):
        """
        Teste US07: Consultar pontos turísticos
        Verifica listagem de pontos via GET /api/tourist-spots
        """
        # Act
        response = client.get('/api/tourist-spots')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        
        # Verificar estrutura dos pontos (se houver)
        if len(data) > 0:
            ponto = data[0]
            assert 'id' in ponto
            assert 'nome' in ponto
            assert 'localizacao' in ponto
            assert 'latitude' in ponto['localizacao']
            assert 'longitude' in ponto['localizacao']
            
    def test_buscar_ponto_turistico_especifico(self, client):
        """
        Teste US07: Consultar ponto turístico específico
        Verifica busca via GET /api/tourist-spots/{id}
        """
        # Arrange - Primeiro listar para pegar um ID válido
        response_lista = client.get('/api/tourist-spots')
        lista_pontos = json.loads(response_lista.data)
        
        if len(lista_pontos) > 0:
            # Act
            ponto_id = lista_pontos[0]['id']
            response = client.get(f'/api/tourist-spots/{ponto_id}')
            
            # Assert
            assert response.status_code == 200
            
            data = json.loads(response.data)
            assert data['id'] == ponto_id
            assert 'nome' in data
            assert 'localizacao' in data
        else:
            # Skip test se não há pontos turísticos
            pytest.skip("Nenhum ponto turístico disponível para teste")
            
    def test_buscar_ponto_inexistente(self, client):
        """
        Teste US07: Buscar ponto inexistente deve retornar 404
        """
        # Act
        response = client.get('/api/tourist-spots/99999')
        
        # Assert
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        
    def test_buscar_pontos_por_nome(self, client):
        """
        Teste US07: Filtrar pontos turísticos por nome
        """
        # Act - Buscar por "Cristo" (assumindo que existe)
        response = client.get('/api/tourist-spots?search=cristo')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        
        # Verificar se todos os resultados contêm o termo buscado
        for ponto in data:
            assert 'cristo' in ponto['nome'].lower()
            
    def test_buscar_pontos_por_proximidade(self, client):
        """
        Teste US07 + US17: Filtrar pontos por proximidade (geolocalização)
        """
        # Arrange - Coordenadas do Rio de Janeiro (centro)
        lat_rio = -22.908333
        lng_rio = -43.196388
        raio = 50  # 50km
        
        # Act
        response = client.get(f'/api/tourist-spots?lat={lat_rio}&lng={lng_rio}&radius={raio}')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        
        # Verificar se os pontos retornados têm informação de distância
        for ponto in data:
            if 'distance' in ponto:
                assert ponto['distance'] <= raio
                
    def test_buscar_pontos_vazio(self, client):
        """
        Teste US07: Busca que não retorna resultados
        """
        # Act - Buscar por termo inexistente
        response = client.get('/api/tourist-spots?search=TERMO_INEXISTENTE_12345')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        assert len(data) == 0
        
    def test_buscar_lugares_via_api_externa(self, client):
        """
        Teste US07: Buscar pontos via API externa (Nominatim)
        """
        # Act
        response = client.get('/api/search-places?q=Rio de Janeiro')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert isinstance(data, list)
        
        # Deve retornar tanto resultados locais quanto externos
        # Verificar estrutura básica
        for item in data:
            assert 'nome' in item
            assert 'localizacao' in item
            
    def test_buscar_lugares_sem_parametro(self, client):
        """
        Teste US07: Busca sem parâmetro deve retornar erro
        """
        # Act
        response = client.get('/api/search-places')
        
        # Assert
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'obrigatório' in data['error']
        
    def test_estrutura_dados_pontos_turisticos(self, client):
        """
        Teste US07: Verificar estrutura completa dos dados dos pontos
        """
        # Act
        response = client.get('/api/tourist-spots')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        
        if len(data) > 0:
            ponto = data[0]
            
            # Campos obrigatórios
            assert isinstance(ponto['id'], int)
            assert isinstance(ponto['nome'], str)
            assert len(ponto['nome']) > 0
            assert isinstance(ponto['localizacao'], dict)
            assert isinstance(ponto['localizacao']['latitude'], (int, float))
            assert isinstance(ponto['localizacao']['longitude'], (int, float))
            
            # Campos opcionais
            if 'imagem_url' in ponto:
                assert isinstance(ponto['imagem_url'], (str, type(None)))
            if 'descricao' in ponto:
                assert isinstance(ponto['descricao'], (str, type(None)))
                
    def test_coordenadas_validas(self, client):
        """
        Teste US07: Verificar se as coordenadas estão em faixas válidas
        """
        # Act
        response = client.get('/api/tourist-spots')
        
        # Assert
        assert response.status_code == 200
        
        data = json.loads(response.data)
        
        for ponto in data:
            lat = ponto['localizacao']['latitude']
            lng = ponto['localizacao']['longitude']
            
            # Verificar faixas válidas de coordenadas
            assert -90 <= lat <= 90, f"Latitude inválida: {lat}"
            assert -180 <= lng <= 180, f"Longitude inválida: {lng}"
