from flask import Blueprint, request, jsonify
import json
import os
import requests
from urllib.parse import quote

tourist_spots_bp = Blueprint('tourist_spots', __name__)

def load_tourist_spots():
    """Carrega pontos turísticos do arquivo JSON estático"""
    try:
        # Caminho para o arquivo na raiz do projeto
        json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'tourist_spots.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Se o arquivo contém uma lista diretamente, retorna ela
            if isinstance(data, list):
                return data
            # Se contém um objeto com chave "tourist_spots", extrai a lista
            elif isinstance(data, dict) and 'tourist_spots' in data:
                return data['tourist_spots']
            else:
                return data
    except Exception as e:
        print(f"Erro ao carregar pontos turísticos: {e}")
        return []

@tourist_spots_bp.route('/tourist-spots', methods=['GET'])
def get_tourist_spots():
    """Listar todos os pontos turísticos com filtros opcionais"""
    try:
        spots = load_tourist_spots()
        
        # Filtro por nome (busca parcial)
        search = request.args.get('search', '').lower()
        if search:
            spots = [spot for spot in spots if search in spot['nome'].lower()]
        
        # Filtro por proximidade (latitude, longitude, raio em km)
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', type=float, default=10.0)
        
        if lat is not None and lng is not None:
            filtered_spots = []
            for spot in spots:
                spot_lat = spot['localizacao']['latitude']
                spot_lng = spot['localizacao']['longitude']
                
                # Cálculo simples de distância (aproximado)
                distance = ((lat - spot_lat) ** 2 + (lng - spot_lng) ** 2) ** 0.5 * 111  # ~111km por grau
                
                if distance <= radius:
                    spot_with_distance = spot.copy()
                    spot_with_distance['distance'] = round(distance, 2)
                    filtered_spots.append(spot_with_distance)
            
            spots = sorted(filtered_spots, key=lambda x: x['distance'])
        
        return jsonify(spots), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tourist_spots_bp.route('/tourist-spots/<int:spot_id>', methods=['GET'])
def get_tourist_spot(spot_id):
    """Obter um ponto turístico específico"""
    try:
        spots = load_tourist_spots()
        spot = next((s for s in spots if s['id'] == spot_id), None)
        
        if not spot:
            return jsonify({'error': 'Ponto turístico não encontrado'}), 404
        
        return jsonify(spot), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tourist_spots_bp.route('/search-places', methods=['GET'])
def search_places():
    """Buscar pontos turísticos via API externa (Nominatim/OpenStreetMap)"""
    try:
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'error': 'Parâmetro de busca obrigatório'}), 400
            
        # Buscar primeiro nos pontos locais
        local_spots = load_tourist_spots()
        local_results = [
            spot for spot in local_spots 
            if query.lower() in spot['nome'].lower() or 
               (spot.get('descricao', '') and query.lower() in spot['descricao'].lower())
        ]
        
        # Buscar via API externa (Nominatim)
        external_results = search_nominatim(query)
        
        # Combinar resultados
        all_results = local_results + external_results
        
        # Remover duplicatas por nome
        seen_names = set()
        unique_results = []
        for spot in all_results:
            if spot['nome'].lower() not in seen_names:
                seen_names.add(spot['nome'].lower())
                unique_results.append(spot)
        
        return jsonify(unique_results), 200
        
    except Exception as e:
        print(f"Erro na busca de lugares: {e}")
        return jsonify({'error': str(e)}), 500

def search_nominatim(query):
    """Buscar lugares usando a API do Nominatim (OpenStreetMap)"""
    try:
        # URL da API Nominatim
        base_url = "https://nominatim.openstreetmap.org/search"
        
        # Parâmetros da busca
        params = {
            'q': query,
            'format': 'json',
            'limit': 20,  # Aumentar limite
            'addressdetails': 1,
            'extratags': 1,
            'namedetails': 1,
            'accept-language': 'pt-BR,pt,en'
        }
        
        # Headers para identificar a aplicação
        headers = {
            'User-Agent': 'TouristRoutes/1.0 (contact@example.com)'
        }
        
        # Fazer requisição
        response = requests.get(base_url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"Nominatim retornou {len(data)} resultados para '{query}'")
        
        # Converter para formato esperado
        results = []
        for item in data:
            # Ser mais inclusivo nos tipos de lugares
            place_type = item.get('type', '').lower()
            category = item.get('category', '').lower()
            class_type = item.get('class', '').lower()
            
            # Aceitar mais tipos de lugares
            accepted_types = ['tourism', 'attraction', 'monument', 'museum', 'park', 'lake', 'water', 
                             'natural', 'leisure', 'historic', 'memorial', 'viewpoint', 'beach']
            accepted_categories = ['tourism', 'amenity', 'leisure', 'natural', 'historic', 'place']
            
            is_tourist_place = (
                any(keyword in place_type for keyword in accepted_types) or
                any(keyword in category for keyword in accepted_categories) or
                any(keyword in class_type for keyword in accepted_types) or
                'tourism' in str(item.get('extratags', {})).lower() or
                item.get('importance', 0) > 0.3  # Lugares com alta importância
            )
            
            if is_tourist_place:
                # Extrair informações
                display_name = item.get('display_name', '')
                name_parts = display_name.split(',')
                name = name_parts[0].strip()  # Primeiro parte do nome
                
                # Melhorar a descrição
                description = f"📍 {display_name}"
                if place_type:
                    description = f"{place_type.title()} - {description}"
                
                spot = {
                    'id': f"ext_{item.get('place_id', '')}",  # ID externo
                    'nome': name,
                    'descricao': description,
                    'localizacao': {
                        'latitude': float(item.get('lat', 0)),
                        'longitude': float(item.get('lon', 0))
                    },
                    'endereco': display_name,
                    'categoria': place_type.title() or category.title() or 'Ponto de Interesse',
                    'source': 'nominatim',
                    'importance': item.get('importance', 0)
                }
                results.append(spot)
        
        # Ordenar por importância
        results.sort(key=lambda x: x.get('importance', 0), reverse=True)
        
        print(f"Filtrados {len(results)} pontos turísticos")
        return results[:10]  # Retornar apenas os 10 melhores
        
    except requests.RequestException as e:
        print(f"Erro na API Nominatim: {e}")
        return []
    except Exception as e:
        print(f"Erro no processamento Nominatim: {e}")
        return []

