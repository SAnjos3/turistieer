# Código Compartilhado - Turistieer

Este diretório contém todo o código base compartilhado entre os requisitos do MVP.

## Estrutura

### 📁 config/
Arquivos de configuração e inicialização:
- `main.py` - Aplicação Flask principal e configuração
- `requirements.txt` - Dependências Python
- `package.json` - Dependências Node.js  
- `tourist_spots.json` - Base de dados dos pontos turísticos

### 📁 models/
Modelos base do sistema:
- `user.py` - Modelo de usuário e configuração do banco

### 📁 static/
Arquivos estáticos base:
- `index.html` - Template HTML principal
- `style.css` - Estilos CSS base

### 📁 tests/
Configurações de teste:
- `conftest.py` - Fixtures e configurações compartilhadas

## Como Usar

### 1. Primeiro Commit (Base)
Copie todos os arquivos deste diretório para inicializar o projeto:

```bash
cp -r _shared/* ./
```

### 2. Commits de Requisitos
Para cada requisito específico, sempre mantenha esta base e adicione apenas os arquivos específicos.

## Dependências Externas

### Python
```bash
pip install -r config/requirements.txt
```

### Node.js
```bash
npm install # usando config/package.json
```

## Banco de Dados

O projeto usa SQLite por padrão. Para outros bancos, modifique a configuração em `config/main.py`.

### Inicialização
```python
from models.user import db
db.create_all()
```

## Pontos Turísticos

Os dados estão em `config/tourist_spots.json` e incluem:
- 10 pontos do Rio de Janeiro (Cristo Redentor, Pão de Açúcar, etc.)
- 5 pontos de Brasília (Congresso Nacional, Catedral, etc.)

## Configuração de Testes

O arquivo `tests/conftest.py` configura:
- Cliente de teste Flask
- Banco de dados temporário
- Fixtures de dados de exemplo
- Limpeza automática após testes

## Estrutura Flask

```python
# main.py
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///turistieer.db'

# Blueprints são registrados aqui
app.register_blueprint(routes_bp, url_prefix='/api')
```

## Importante

⚠️ **Este código deve ser copiado em TODOS os commits** para manter a funcionalidade base do sistema.

⚠️ **Não modifique estes arquivos** nos commits de requisitos específicos - eles devem permanecer inalterados para evitar conflitos.
