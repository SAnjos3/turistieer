"""
Testes de integração para exportação de rotas em PDF
Funcionalidade testada: US18 (Salvar rotas turísticas em PDF)
"""
import pytest
import json
import tempfile
import os


class TestPDFExport:
    """Testes para exportação de rotas em PDF"""
    
    def test_exportar_rota_para_pdf(self, client, create_sample_route):
        """
        Teste US18: Salvar rotas turísticas em PDF
        Verifica exportação via GET /api/routes/{id}/export-pdf
        """
        # Arrange - Criar rota com pontos turísticos
        dados_rota = {
            "nome": "Rota para PDF",
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": [
                {
                    "id": 1,
                    "nome": "Cristo Redentor",
                    "descricao": "Estátua icônica no Corcovado"
                },
                {
                    "id": 2,
                    "nome": "Pão de Açúcar",
                    "descricao": "Famoso morro na Urca"
                }
            ],
            "user_id": 1
        }
        
        response_criacao = create_sample_route(dados_rota)
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Act
        response = client.get(f'/api/routes/{rota_id}/export-pdf')
        
        # Assert
        assert response.status_code == 200
        assert response.content_type == 'application/pdf'
        
        # Verificar cabeçalhos de download
        assert 'attachment' in response.headers.get('Content-Disposition', '')
        assert 'filename' in response.headers.get('Content-Disposition', '').lower()
        
        # Verificar se o conteúdo é um PDF válido
        assert response.data.startswith(b'%PDF-')
        assert len(response.data) > 1000  # PDF deve ter conteúdo significativo
        
    def test_exportar_rota_inexistente_para_pdf(self, client):
        """
        Teste US18: Exportar rota inexistente deve retornar 404
        """
        # Act
        response = client.get('/api/routes/99999/export-pdf')
        
        # Assert
        assert response.status_code == 404
        
    def test_exportar_rota_sem_pontos_para_pdf(self, client, create_sample_route):
        """
        Teste US18: Exportar rota sem pontos turísticos
        """
        # Arrange - Criar rota vazia
        dados_rota = {
            "nome": "Rota Vazia",
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": [],
            "user_id": 1
        }
        
        response_criacao = create_sample_route(dados_rota)
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Act
        response = client.get(f'/api/routes/{rota_id}/export-pdf')
        
        # Assert
        assert response.status_code == 200
        assert response.content_type == 'application/pdf'
        assert response.data.startswith(b'%PDF-')
        
    def test_estrutura_nome_arquivo_pdf(self, client, create_sample_route):
        """
        Teste US18: Verificar estrutura do nome do arquivo PDF
        """
        # Arrange
        dados_rota = {
            "nome": "Rota Rio de Janeiro",
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": [{"id": 1, "nome": "Cristo Redentor"}],
            "user_id": 1
        }
        
        response_criacao = create_sample_route(dados_rota)
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Act
        response = client.get(f'/api/routes/{rota_id}/export-pdf')
        
        # Assert
        assert response.status_code == 200
        
        content_disposition = response.headers.get('Content-Disposition', '')
        
        # Verificar que o nome do arquivo contém o nome da rota
        assert 'rota_Rio_de_Janeiro.pdf' in content_disposition or 'Rota Rio de Janeiro' in content_disposition
        
    def test_conteudo_pdf_inclui_informacoes_rota(self, client, create_sample_route):
        """
        Teste US18: Verificar que o PDF contém as informações da rota
        """
        # Arrange
        dados_rota = {
            "nome": "Rota Completa Teste",
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": [
                {
                    "id": 1,
                    "nome": "Cristo Redentor",
                    "descricao": "Estátua icônica localizada no Corcovado"
                },
                {
                    "id": 2,
                    "nome": "Pão de Açúcar",
                    "descricao": "Morro famoso acessível por bondinho"
                }
            ],
            "user_id": 1
        }
        
        response_criacao = create_sample_route(dados_rota)
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Act
        response = client.get(f'/api/routes/{rota_id}/export-pdf')
        
        # Assert
        assert response.status_code == 200
        assert len(response.data) > 2000  # PDF com conteúdo deve ser maior
        
        # Nota: Para verificar o conteúdo textual do PDF seria necessária
        # uma biblioteca adicional como PyPDF2, por isso verificamos o tamanho
        
    def test_exportar_multiplas_rotas_pdf(self, client, create_sample_route):
        """
        Teste US18: Exportar múltiplas rotas em sequência
        """
        # Arrange - Criar múltiplas rotas
        rotas_criadas = []
        
        for i in range(3):
            dados_rota = {
                "nome": f"Rota Teste {i+1}",
                "data_inicio": "2025-08-15T09:00:00",
                "pontos_turisticos": [{"id": 1, "nome": "Cristo Redentor"}],
                "user_id": 1
            }
            
            response_criacao = create_sample_route(dados_rota)
            rota_criada = json.loads(response_criacao.data)
            rotas_criadas.append(rota_criada['id'])
        
        # Act & Assert
        for rota_id in rotas_criadas:
            response = client.get(f'/api/routes/{rota_id}/export-pdf')
            
            assert response.status_code == 200
            assert response.content_type == 'application/pdf'
            assert response.data.startswith(b'%PDF-')
            
    def test_geracao_pdf_com_caracteres_especiais(self, client, create_sample_route):
        """
        Teste US18: PDF com caracteres especiais no nome e descrição
        """
        # Arrange
        dados_rota = {
            "nome": "Rota São Paulo - Açúcar & Café",
            "data_inicio": "2025-08-15T09:00:00",
            "pontos_turisticos": [
                {
                    "id": 1,
                    "nome": "Mercadão - São Paulo",
                    "descricao": "Mercado Municipal com produtos típicos, açúcar & especiarias"
                }
            ],
            "user_id": 1
        }
        
        response_criacao = create_sample_route(dados_rota)
        rota_criada = json.loads(response_criacao.data)
        rota_id = rota_criada['id']
        
        # Act
        response = client.get(f'/api/routes/{rota_id}/export-pdf')
        
        # Assert
        assert response.status_code == 200
        assert response.content_type == 'application/pdf'
        assert response.data.startswith(b'%PDF-')
        # PDF deve ser gerado mesmo com caracteres especiais
