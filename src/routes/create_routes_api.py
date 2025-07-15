from flask import Blueprint, request, jsonify, current_app
import traceback

create_routes_api = Blueprint('create_routes_api', __name__)

@create_routes_api.route('/api/routes', methods=['POST'])
def create_route():
    try:
        print('--- [DEBUG] Recebido POST /api/routes ---')
        print('Headers:', dict(request.headers))
        print('Raw data:', request.get_data(as_text=True))
        try:
            data = request.get_json(force=True)
            print('JSON decodificado:', data)
        except Exception as json_err:
            print('Erro ao decodificar JSON:', json_err)
            raise
        # Adicione prints para cada campo esperado
        for key in ['nome', 'data_inicio', 'pontos_turisticos', 'user_id']:
            print(f"Campo '{key}':", data.get(key))
        # ...existing code...
        return jsonify({'message': 'Rota criada com sucesso!'}), 201
    except Exception as e:
        print('--- [ERRO 500] ---')
        print('Payload recebido:', request.get_data(as_text=True))
        print('Traceback completo:')
        traceback.print_exc()
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500