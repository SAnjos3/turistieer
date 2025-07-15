#!/usr/bin/env python3
"""
Script para validar a nova estrutura de testes organizada por funcionalidades.
"""
import os
import sys

def validate_test_structure():
    """Valida se a estrutura de testes está organizada corretamente."""
    
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"🔍 Validando estrutura em: {tests_dir}")
    
    # Pastas esperadas (por User Story)
    expected_features = [
        'us01_criar_rotas',
        'us02_atualizar_rotas', 
        'us03_consultar_rotas',
        'us04_excluir_rotas',
        'us07_consultar_pontos_turisticos',
        'us17_obter_localizacao',
        'us18_salvar_pdf'
    ]
    
    # Pastas antigas que NÃO devem existir
    old_structure = [
        'unit',
        'backend', 
        'integration',
        'components'
    ]
    
    # Arquivos de configuração esperados
    config_files = [
        'pytest.ini',
        'conftest.py', 
        'jest.config.js',
        '.babelrc',
        'run_tests.py',
        'run_tests.sh',
        'README.md'
    ]
    
    print("\n📁 Verificando pastas por funcionalidade...")
    missing_features = []
    for feature in expected_features:
        feature_path = os.path.join(tests_dir, feature)
        if os.path.exists(feature_path):
            print(f"✅ {feature}")
            
            # Verifica se tem README
            readme_path = os.path.join(feature_path, 'README.md')
            if os.path.exists(readme_path):
                print(f"   📝 README.md encontrado")
            else:
                print(f"   ⚠️  README.md não encontrado")
                
        else:
            print(f"❌ {feature} - FALTANDO")
            missing_features.append(feature)
    
    print("\n🗑️  Verificando remoção das pastas antigas...")
    old_found = []
    for old_dir in old_structure:
        old_path = os.path.join(tests_dir, old_dir)
        if os.path.exists(old_path):
            print(f"❌ {old_dir} - AINDA EXISTE (deve ser removida)")
            old_found.append(old_dir)
        else:
            print(f"✅ {old_dir} - removida corretamente")
    
    print("\n⚙️  Verificando arquivos de configuração...")
    missing_configs = []
    for config_file in config_files:
        config_path = os.path.join(tests_dir, config_file)
        if os.path.exists(config_path):
            print(f"✅ {config_file}")
        else:
            print(f"❌ {config_file} - FALTANDO")
            missing_configs.append(config_file)
    
    # Relatório final
    print("\n" + "="*60)
    print("📊 RELATÓRIO DE VALIDAÇÃO")
    print("="*60)
    
    if not missing_features and not old_found and not missing_configs:
        print("🎉 ESTRUTURA VÁLIDA!")
        print("✅ Todas as funcionalidades estão presentes")
        print("✅ Pastas antigas foram removidas") 
        print("✅ Arquivos de configuração estão presentes")
        return True
    else:
        print("❌ PROBLEMAS ENCONTRADOS:")
        if missing_features:
            print(f"   - Funcionalidades faltando: {', '.join(missing_features)}")
        if old_found:
            print(f"   - Pastas antigas ainda existem: {', '.join(old_found)}")
        if missing_configs:
            print(f"   - Configurações faltando: {', '.join(missing_configs)}")
        return False

if __name__ == "__main__":
    success = validate_test_structure()
    sys.exit(0 if success else 1)
