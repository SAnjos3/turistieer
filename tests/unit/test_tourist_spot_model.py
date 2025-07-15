"""
Testes unitários para o modelo TouristSpot
Funcionalidade testada: US07 (Consultar pontos turísticos)
"""
import pytest
from src.models.tourist_spot import TouristSpot
from src.models.user import db


class TestTouristSpotModel:
    """Testes para o modelo TouristSpot"""
    
    def test_criar_ponto_turistico_valido(self, app_context):
        """
        Teste US07: Consultar pontos turísticos
        Verifica se um ponto turístico é criado corretamente
        """
        # Arrange & Act
        ponto = TouristSpot(
            nome="Cristo Redentor",
            latitude=-22.951916,
            longitude=-43.210487,
            imagem_url="https://example.com/cristo.jpg",
            descricao="Estátua icônica no Corcovado"
        )
        
        db.session.add(ponto)
        db.session.commit()
        
        # Assert
        assert ponto.id is not None
        assert ponto.nome == "Cristo Redentor"
        assert ponto.latitude == -22.951916
        assert ponto.longitude == -43.210487
        assert ponto.imagem_url == "https://example.com/cristo.jpg"
        assert ponto.descricao == "Estátua icônica no Corcovado"
        
    def test_converter_ponto_para_dict(self, app_context):
        """
        Teste US07: Consultar pontos turísticos
        Verifica se a conversão para dicionário funciona corretamente
        """
        # Arrange
        ponto = TouristSpot(
            nome="Pão de Açúcar",
            latitude=-22.948658,
            longitude=-43.157444,
            imagem_url="https://example.com/pao-acucar.jpg",
            descricao="Famoso morro na Urca"
        )
        
        db.session.add(ponto)
        db.session.commit()
        
        # Act
        ponto_dict = ponto.to_dict()
        
        # Assert
        assert isinstance(ponto_dict, dict)
        assert ponto_dict['nome'] == "Pão de Açúcar"
        assert ponto_dict['localizacao']['latitude'] == -22.948658
        assert ponto_dict['localizacao']['longitude'] == -43.157444
        assert ponto_dict['imagem_url'] == "https://example.com/pao-acucar.jpg"
        assert ponto_dict['descricao'] == "Famoso morro na Urca"
        assert 'id' in ponto_dict
        
    def test_ponto_turistico_sem_imagem(self, app_context):
        """
        Teste de edge case: ponto turístico sem imagem
        """
        # Arrange & Act
        ponto = TouristSpot(
            nome="Local Sem Imagem",
            latitude=-22.900000,
            longitude=-43.200000,
            descricao="Descrição do local"
        )
        
        db.session.add(ponto)
        db.session.commit()
        
        # Assert
        assert ponto.imagem_url is None
        ponto_dict = ponto.to_dict()
        assert ponto_dict['imagem_url'] is None
        
    def test_ponto_turistico_sem_descricao(self, app_context):
        """
        Teste de edge case: ponto turístico sem descrição
        """
        # Arrange & Act
        ponto = TouristSpot(
            nome="Local Sem Descrição",
            latitude=-22.900000,
            longitude=-43.200000,
            imagem_url="https://example.com/local.jpg"
        )
        
        db.session.add(ponto)
        db.session.commit()
        
        # Assert
        assert ponto.descricao is None
        ponto_dict = ponto.to_dict()
        assert ponto_dict['descricao'] is None
        
    def test_representacao_string_ponto(self, app_context):
        """
        Teste da representação em string do modelo
        """
        # Arrange & Act
        ponto = TouristSpot(
            nome="Copacabana",
            latitude=-22.971177,
            longitude=-43.182543
        )
        
        # Assert
        assert str(ponto) == "<TouristSpot Copacabana>"
        
    def test_buscar_pontos_por_nome(self, app_context):
        """
        Teste US07: Consultar pontos turísticos
        Verifica busca de pontos por nome
        """
        # Arrange - Criar múltiplos pontos
        pontos_teste = [
            TouristSpot(nome="Cristo Redentor", latitude=-22.951916, longitude=-43.210487),
            TouristSpot(nome="Pão de Açúcar", latitude=-22.948658, longitude=-43.157444),
            TouristSpot(nome="Copacabana", latitude=-22.971177, longitude=-43.182543)
        ]
        
        for ponto in pontos_teste:
            db.session.add(ponto)
        db.session.commit()
        
        # Act - Buscar por nome parcial
        resultado_cristo = TouristSpot.query.filter(TouristSpot.nome.like('%Cristo%')).first()
        resultado_pao = TouristSpot.query.filter(TouristSpot.nome.like('%Açúcar%')).first()
        todos_pontos = TouristSpot.query.all()
        
        # Assert
        assert resultado_cristo is not None
        assert resultado_cristo.nome == "Cristo Redentor"
        assert resultado_pao is not None
        assert resultado_pao.nome == "Pão de Açúcar"
        assert len(todos_pontos) >= 3
        
    def test_coordenadas_precisao(self, app_context):
        """
        Teste de precisão das coordenadas geográficas
        """
        # Arrange & Act
        ponto = TouristSpot(
            nome="Teste Precisão",
            latitude=-22.9519160000000,
            longitude=-43.2104870000000
        )
        
        db.session.add(ponto)
        db.session.commit()
        
        # Assert
        assert abs(ponto.latitude - (-22.951916)) < 0.000001
        assert abs(ponto.longitude - (-43.210487)) < 0.000001
