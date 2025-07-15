from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.route import Route
import json

# Blueprint específico para atualização de rotas (RF02)
update_routes_bp = Blueprint('update_routes', __name__)

@update_routes_bp.route('/routes/<int:route_id>', methods=['PUT'])
def update_route(route_id):
    """Atualizar uma rota existente - RF02"""
    try:
        route = Route.query.get_or_404(route_id)
        data = request.get_json()
        
        # Validar se a rota pertence ao usuário (para MVP, usamos user_id=1)
        if route.user_id != data.get('user_id', 1):
            return jsonify({'error': 'Não autorizado a atualizar esta rota'}), 403
        
        # Atualizar campos se fornecidos
        if 'nome' in data:
            if not data['nome'].strip():
                return jsonify({'error': 'Nome da rota não pode estar vazio'}), 400
            route.nome = data['nome']
        
        if 'descricao' in data:
            route.descricao = data['descricao']
        
        if 'data_inicio' in data:
            try:
                nova_data_inicio = datetime.fromisoformat(data['data_inicio'].replace('Z', '+00:00'))
                
                # Validar se nova data de início é futura
                now = datetime.now()
                if nova_data_inicio <= now:
                    return jsonify({'error': 'Data de início deve ser futura'}), 400
                
                route.data_inicio = nova_data_inicio
            except ValueError:
                return jsonify({'error': 'Formato de data de início inválido. Use formato ISO (YYYY-MM-DDTHH:MM:SS)'}), 400
        
        if 'data_fim' in data:
            if data['data_fim']:  # Se não for None ou string vazia
                try:
                    nova_data_fim = datetime.fromisoformat(data['data_fim'].replace('Z', '+00:00'))
                    
                    # Validar se data de fim é posterior à data de início
                    if nova_data_fim <= route.data_inicio:
                        return jsonify({'error': 'Data de fim deve ser posterior à data de início'}), 400
                    
                    route.data_fim = nova_data_fim
                except ValueError:
                    return jsonify({'error': 'Formato de data de fim inválido. Use formato ISO (YYYY-MM-DDTHH:MM:SS)'}), 400
            else:
                route.data_fim = None  # Remover data de fim
        
        if 'pontos_turisticos' in data:
            pontos_turisticos = data['pontos_turisticos']
            if len(pontos_turisticos) > 5:
                return jsonify({'error': 'Máximo de 5 pontos turísticos por rota'}), 400
            route.pontos_turisticos = json.dumps(pontos_turisticos)
        
        # Atualizar timestamp de modificação
        route.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(route.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@update_routes_bp.route('/routes/<int:route_id>/reorder', methods=['POST'])
def reorder_route_points(route_id):
    """Reordenar pontos turísticos de uma rota - RF02"""
    try:
        route = Route.query.get_or_404(route_id)
        data = request.get_json()
        
        # Validar autorização
        if route.user_id != data.get('user_id', 1):
            return jsonify({'error': 'Não autorizado a modificar esta rota'}), 403
        
        if 'new_order' not in data:
            return jsonify({'error': 'Nova ordem dos pontos é obrigatória'}), 400
        
        new_order = data['new_order']
        current_points = route.get_pontos_turisticos()
        
        # Validar se a nova ordem contém os mesmos pontos
        if len(new_order) != len(current_points):
            return jsonify({'error': 'Nova ordem deve conter todos os pontos atuais'}), 400
        
        # Verificar se todos os IDs estão presentes
        current_ids = {point.get('id') for point in current_points}
        new_ids = {point.get('id') for point in new_order}
        
        if current_ids != new_ids:
            return jsonify({'error': 'Nova ordem deve conter exatamente os mesmos pontos'}), 400
        
        # Atualizar ordem dos pontos
        route.pontos_turisticos = json.dumps(new_order)
        route.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(route.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
