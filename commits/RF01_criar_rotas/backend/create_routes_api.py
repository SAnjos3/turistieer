from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.route import Route
import json

# Blueprint específico para criação de rotas (RF01)
create_routes_bp = Blueprint('create_routes', __name__)

@create_routes_bp.route('/routes', methods=['POST'])
def create_route():
    """Criar uma nova rota turística - RF01"""
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('nome'):
            return jsonify({'error': 'Nome da rota é obrigatório'}), 400
        
        if not data.get('data_inicio'):
            return jsonify({'error': 'Data de início é obrigatória'}), 400
        
        pontos_turisticos = data.get('pontos_turisticos', [])
        if len(pontos_turisticos) > 5:
            return jsonify({'error': 'Máximo de 5 pontos turísticos por rota'}), 400
        
        # Converter string de data para datetime e validar
        try:
            data_inicio = datetime.fromisoformat(data['data_inicio'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use formato ISO (YYYY-MM-DDTHH:MM:SS)'}), 400
        
        # Validar se data de início é futura
        now = datetime.now()
        if data_inicio <= now:
            return jsonify({'error': 'Data de início deve ser futura'}), 400
        
        # Validar data de fim se fornecida
        data_fim = None
        if data.get('data_fim'):
            try:
                data_fim = datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Formato de data de fim inválido. Use formato ISO (YYYY-MM-DDTHH:MM:SS)'}), 400
            
            # Validar se data de fim é posterior à data de início
            if data_fim <= data_inicio:
                return jsonify({'error': 'Data de fim deve ser posterior à data de início'}), 400
        
        # Criar nova rota
        nova_rota = Route(
            nome=data['nome'],
            descricao=data.get('descricao'),
            data_inicio=data_inicio,
            data_fim=data_fim,
            pontos_turisticos=json.dumps(pontos_turisticos),
            user_id=data.get('user_id', 1)  # Default user para MVP
        )
        
        db.session.add(nova_rota)
        db.session.commit()
        
        return jsonify(nova_rota.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
