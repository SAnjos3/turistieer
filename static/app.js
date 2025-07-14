// Configuração da API
const API_BASE_URL = window.location.origin + '/api';

// Estado da aplicação
let currentSection = 'routes';
let selectedSpots = [];
let allSpots = [];
let allRoutes = [];

// Elementos DOM
const sections = {
    routes: document.getElementById('routes-section'),
    spots: document.getElementById('spots-section'),
    create: document.getElementById('create-section')
};

const navButtons = {
    routes: document.getElementById('btn-routes'),
    spots: document.getElementById('btn-spots'),
    create: document.getElementById('btn-create')
};

// Variáveis para o mapa
let map = null;
let routeLayer = null;
let markersLayer = null;

// Variáveis para localização do usuário
let userLocation = null;
let isRequestingLocation = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    console.log('Inicializando aplicação...');
    showSection('routes');
}

function setupEventListeners() {
    // Navegação
    navButtons.routes.addEventListener('click', () => showSection('routes'));
    navButtons.spots.addEventListener('click', () => showSection('spots'));
    navButtons.create.addEventListener('click', () => showSection('create'));

    // Formulário de criação de rota
    const createForm = document.getElementById('create-route-form');
    createForm.addEventListener('submit', handleCreateRoute);

    // Seleção de pontos turísticos
    const btnSelectSpots = document.getElementById('btn-select-spots');
    btnSelectSpots.addEventListener('click', openSpotsModal);

    // Modal
    const modal = document.getElementById('spots-modal');
    const closeModal = document.querySelector('.close-modal');
    closeModal.addEventListener('click', closeSpotsModal);

    // Confirmar seleção de pontos
    const btnConfirmSpots = document.getElementById('btn-confirm-spots');
    btnConfirmSpots.addEventListener('click', confirmSpotSelection);

    // Busca de pontos turísticos
    const searchInput = document.getElementById('search-spots');
    const btnSearch = document.getElementById('btn-search');
    if (searchInput && btnSearch) {
        searchInput.addEventListener('input', debounce(filterSpots, 300));
        btnSearch.addEventListener('click', filterSpots);

        // Teste adicional - log quando o usuário digita
        searchInput.addEventListener('keyup', function (e) {
            console.log('Usuário digitou:', e.target.value);
        });
    } else {
        console.error('Elementos de busca não encontrados!');
    }

    // Fechar modal clicando fora
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeSpotsModal();
        }
    });
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadRoutes(),
            loadTouristSpots()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showNotification('Erro ao carregar dados iniciais', 'error');
    }
}

async function loadRoutes() {
    try {
        showLoading('routes-list');
        const response = await fetch(`${API_BASE_URL}/routes`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const routes = await response.json();
        allRoutes = routes;
        displayRoutes(routes);
    } catch (error) {
        console.error('Erro ao carregar rotas:', error);
        document.getElementById('routes-list').innerHTML = `
            <div class="empty-state">
                <p>Erro ao carregar rotas. Tente novamente mais tarde.</p>
                <button class="btn btn-primary" onclick="loadRoutes()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

async function loadTouristSpots() {
    try {
        showLoading('spots-list');

        // Primeiro tenta carregar da API
        let spots;
        try {
            console.log('Carregando pontos turísticos da API...');
            const response = await fetch(`${API_BASE_URL}/tourist-spots`);
            if (response.ok) {
                spots = await response.json();
                console.log('Pontos carregados da API:', spots.length);
            } else {
                throw new Error('API não disponível');
            }
        } catch (apiError) {
            // Se a API não funcionar, carrega do arquivo JSON local
            console.log('API não disponível, carregando dados locais...');
            const response = await fetch('/tourist_spots.json');
            const data = await response.json();
            spots = data.tourist_spots || data;
            console.log('Pontos carregados do arquivo local:', spots.length);
        }

        allSpots = spots;
        console.log('Total de pontos carregados em allSpots:', allSpots.length);
        displayTouristSpots(spots);
        populateModalSpots(spots);
    } catch (error) {
        console.error('Erro ao carregar pontos turísticos:', error);
        document.getElementById('spots-list').innerHTML = `
            <div class="empty-state">
                <p>Erro ao carregar pontos turísticos.</p>
            </div>
        `;
    }
}

function displayRoutes(routes) {
    const container = document.getElementById('routes-list');

    if (!routes || routes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-route" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                <p>Nenhuma rota encontrada</p>
                <p style="color: #999; font-size: 0.9rem;">Crie sua primeira rota turística!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = routes.map(route => `
        <div class="route-card" data-route-id="${route.id}">
            <div class="card-header">
                <div>
                    <h3 class="card-title">${route.nome}</h3>
                    <div class="card-date">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(route.data_inicio)} ${route.data_fim ? '- ' + formatDate(route.data_fim) : ''}
                    </div>
                </div>
            </div>
            
            ${route.descricao ? `<p class="card-description">${route.descricao}</p>` : ''}
            
            <div class="card-spots">
                ${(route.pontos_turisticos || []).slice(0, 3).map(spot =>
        `<span class="spot-tag">${spot.nome || spot}</span>`
    ).join('')}
                ${(route.pontos_turisticos || []).length > 3 ?
            `<span class="spot-tag">+${(route.pontos_turisticos || []).length - 3} mais</span>` : ''}
            </div>
            
            <div class="card-actions">
                <button class="btn btn-small btn-view-route" onclick="viewRouteWithMap(${route.id})">
                    <i class="fas fa-map"></i> Ver Rota
                </button>
                <button class="btn btn-small btn-secondary" onclick="exportRoutePDF(${route.id})">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteRoute(${route.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function displayTouristSpots(spots) {
    const container = document.getElementById('spots-list');
    console.log('Exibindo pontos turísticos:', spots.length);

    if (!spots || spots.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                <p>Nenhum ponto turístico encontrado</p>
                <p style="color: #999; font-size: 0.9rem;">Tente uma busca mais específica</p>
            </div>
        `;
        return;
    }

    container.innerHTML = spots.map(spot => {
        // Extrair localização
        let locationText = 'Localização não informada';
        if (spot.localizacao) {
            locationText = `Lat: ${spot.localizacao.latitude}, Lng: ${spot.localizacao.longitude}`;
        } else if (spot.cidade) {
            locationText = spot.cidade;
        }

        // Determinar se é ponto externo
        const isExternal = spot.source === 'nominatim' || (spot.id && spot.id.toString().startsWith('ext_'));

        return `
            <div class="spot-card" data-spot-id="${spot.id}">
                <div class="card-header">
                    <h3 class="card-title">${spot.nome}</h3>
                    <span class="spot-tag ${isExternal ? 'external' : ''}">${spot.categoria || 'Turismo'}</span>
                    ${isExternal ? '<span class="spot-tag external-indicator">🌐 Externo</span>' : ''}
                </div>
                
                ${spot.descricao ? `<p class="card-description">${spot.descricao}</p>` : ''}
                
                <div style="margin-top: 1rem;">
                    <p style="color: #666; font-size: 0.9rem;">
                        <i class="fas fa-map-marker-alt"></i>
                        ${locationText}
                    </p>
                    ${spot.endereco && spot.endereco !== spot.descricao ?
                `<p style="color: #999; font-size: 0.8rem; margin-top: 0.5rem;">${spot.endereco}</p>` : ''}
                </div>
                
                ${isExternal ? `
                    <div style="margin-top: 1rem;">
                        <button class="btn btn-small btn-primary" onclick="addExternalSpot('${spot.id}')">
                            <i class="fas fa-plus"></i> Adicionar aos Meus Pontos
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function populateModalSpots(spots) {
    const container = document.getElementById('modal-spots-list');

    container.innerHTML = spots.map(spot => `
        <div class="modal-spot-card" data-spot-id="${spot.id}" onclick="toggleSpotSelection(${spot.id})">
            <h4>${spot.nome}</h4>
            <p>${spot.descricao || spot.cidade || ''}</p>
        </div>
    `).join('');
}

function showSection(sectionName) {
    // Atualizar navegação
    Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
    navButtons[sectionName].classList.add('active');

    // Mostrar seção
    Object.values(sections).forEach(section => section.classList.remove('active'));
    sections[sectionName].classList.add('active');

    currentSection = sectionName;
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Carregando...
        </div>
    `;
}

async function handleCreateRoute(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const routeData = {
        nome: document.getElementById('route-name').value,
        descricao: document.getElementById('route-description').value,
        data_inicio: document.getElementById('start-date').value,
        data_fim: document.getElementById('end-date').value,
        pontos_turisticos: selectedSpots.map(spot => ({
            id: spot.id,
            nome: spot.nome,
            descricao: spot.descricao,
            localizacao: spot.localizacao
        }))
    };

    try {
        // Primeiro, calcular a melhor rota
        if (selectedSpots.length >= 2) {
            showNotification('Calculando melhor rota...', 'info');
            const routeCalculation = await calculateOptimalRoute(selectedSpots);

            if (routeCalculation) {
                // Mostrar informações da rota
                showRoutePreview(routeCalculation);

                // Perguntar se o usuário quer usar a ordem otimizada
                const useOptimized = confirm(
                    `Rota otimizada calculada!\n` +
                    `Distância total: ${routeCalculation.total_distance} km\n` +
                    `Tempo estimado: ${routeCalculation.estimated_time} minutos\n\n` +
                    `Deseja usar a ordem otimizada dos pontos?`
                );

                if (useOptimized && routeCalculation.optimized_points) {
                    // Atualizar selectedSpots com a ordem otimizada
                    selectedSpots = routeCalculation.optimized_points;
                    updateSelectedSpotsDisplay();
                    routeData.pontos_turisticos = selectedSpots.map(spot => ({
                        id: spot.id,
                        nome: spot.nome,
                        descricao: spot.descricao,
                        localizacao: spot.localizacao
                    }));
                }
            }
        }

        // Criar a rota
        const response = await fetch(`${API_BASE_URL}/routes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(routeData)
        });

        if (response.ok) {
            const newRoute = await response.json();
            showNotification('Rota criada com sucesso!', 'success');

            // Limpar formulário
            event.target.reset();
            selectedSpots = [];
            updateSelectedSpotsDisplay();

            // Carregar rotas atualizadas
            loadRoutes();

            // Mostrar rota criada
            showSection('routes');

            // Mostrar detalhes da rota com mapa
            setTimeout(() => viewRouteWithMap(newRoute.id), 500);

        } else {
            throw new Error('Erro ao criar rota');
        }
    } catch (error) {
        console.error('Erro ao criar rota:', error);
        showNotification('Erro ao criar rota. Tente novamente.', 'error');
    }
}

async function calculateOptimalRoute(points) {
    try {
        const response = await fetch(`${API_BASE_URL}/calculate-route`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ points: points })
        });

        if (response.ok) {
            return await response.json();
        } else {
            console.log('Erro ao calcular rota otimizada');
            return null;
        }
    } catch (error) {
        console.error('Erro no cálculo da rota:', error);
        return null;
    }
}

function showRoutePreview(routeData) {
    // Criar modal de preview da rota
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'route-preview-modal';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🗺️ Preview da Rota Otimizada</h3>
                <button class="close-modal" onclick="closeRoutePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="route-stats">
                    <div class="stat-item">
                        <i class="fas fa-route"></i>
                        <span>Distância Total: <strong>${routeData.total_distance} km</strong></span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>Tempo Estimado: <strong>${Math.floor(routeData.estimated_time / 60)}h ${routeData.estimated_time % 60}min</strong></span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Pontos: <strong>${routeData.optimized_points?.length || 0}</strong></span>
                    </div>
                </div>
                
                <h4>Sequência Otimizada:</h4>
                <div class="route-sequence">
                    ${(routeData.optimized_points || []).map((point, index) => `
                        <div class="sequence-item">
                            <span class="sequence-number">${index + 1}</span>
                            <span class="sequence-name">${point.nome}</span>
                            ${index < (routeData.optimized_points?.length || 0) - 1 ?
            `<div class="sequence-arrow">
                                    <i class="fas fa-arrow-down"></i>
                                    <small>${routeData.route_data?.segments?.[index]?.distance?.toFixed(1) || '--'} km</small>
                                </div>` : ''
        }
                        </div>
                    `).join('')}
                </div>
                
                <div id="route-map" style="height: 300px; margin-top: 1rem; border-radius: 10px;"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeRoutePreview()">Fechar</button>
                <button class="btn btn-primary" onclick="acceptOptimizedRoute()">Usar Esta Ordem</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Inicializar mapa no modal
    setTimeout(() => initRouteMap(routeData), 100);
}

function closeRoutePreview() {
    const modal = document.getElementById('route-preview-modal');
    if (modal) {
        modal.remove();
    }
}

function acceptOptimizedRoute() {
    closeRoutePreview();
    // A ordem já foi aceita no handleCreateRoute
}

async function viewRouteWithMap(routeId) {
    try {
        console.log('Carregando rota com ID:', routeId);
        const response = await fetch(`${API_BASE_URL}/routes/${routeId}`);

        if (response.ok) {
            const route = await response.json();
            console.log('Rota carregada:', route);

            // Calcular dados da rota se tiver pontos
            let routeData = null;
            if (route.pontos_turisticos && route.pontos_turisticos.length >= 2) {
                console.log('Calculando rota REAL...');
                try {
                    // Tentar primeiro a API de rota real
                    const realRouteResponse = await fetch(`${API_BASE_URL}/calculate-real-route`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ points: route.pontos_turisticos })
                    });

                    if (realRouteResponse.ok) {
                        routeData = await realRouteResponse.json();
                        console.log('Rota REAL calculada:', routeData);
                    } else {
                        console.log('API de rota real falhou, usando aproximação...');
                        // Fallback para rota aproximada
                        const calcResponse = await fetch(`${API_BASE_URL}/calculate-route`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ points: route.pontos_turisticos })
                        });

                        if (calcResponse.ok) {
                            routeData = await calcResponse.json();
                            console.log('Dados da rota aproximados:', routeData);
                        }
                    }
                } catch (calcError) {
                    console.error('Erro no cálculo da rota:', calcError);
                }
            }

            showRouteDetailsWithMap(route, routeData);
        } else {
            console.error('Erro ao carregar rota, status:', response.status);
            showNotification('Erro ao carregar rota', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar rota:', error);
        showNotification('Erro ao carregar detalhes da rota', 'error');
    }
}

function showRouteDetailsWithMap(route, routeData) {
    console.log('Mostrando detalhes da rota:', route);
    console.log('Dados da rota:', routeData);

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'route-details-modal';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>🗺️ ${route.nome}</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="route-info">
                    <p><strong>Descrição:</strong> ${route.descricao || 'Não informada'}</p>
                    <p><strong>Data:</strong> ${formatDate(route.data_inicio)} ${route.data_fim ? '- ' + formatDate(route.data_fim) : ''}</p>
                    <p><strong>Total de pontos:</strong> ${(route.pontos_turisticos || []).length}</p>
                    
                    ${routeData ? `
                        <div class="route-stats">
                            <div class="stat-item">
                                <i class="fas fa-route"></i>
                                <span>Distância: <strong>${routeData.total_distance} km</strong></span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-clock"></i>
                                <span>Tempo: <strong>${Math.floor(routeData.estimated_time / 60)}h ${routeData.estimated_time % 60}min</strong></span>
                            </div>
                        </div>
                    ` : '<p style="color: #999; font-style: italic;">Dados da rota não calculados</p>'}
                </div>
                
                <div id="route-detail-map" style="height: 400px; margin: 1rem 0; border-radius: 10px; border: 2px solid #ddd; background: #f0f8ff;">
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>
                        Carregando mapa...
                    </div>
                </div>
                
                <h4>Pontos da Rota:</h4>
                <div class="route-points">
                    ${(route.pontos_turisticos || []).length === 0 ?
            '<p style="color: #999; font-style: italic;">Nenhum ponto turístico adicionado a esta rota</p>' :
            (route.pontos_turisticos || []).map((spot, index) => `
                            <div class="point-item">
                                <span class="point-number">${index + 1}</span>
                                <div class="point-details">
                                    <strong>${spot.nome || spot}</strong>
                                    ${spot.descricao ? `<p>${spot.descricao}</p>` : ''}
                                    ${spot.localizacao ? `<small style="color: #666;">Lat: ${spot.localizacao.latitude}, Lng: ${spot.localizacao.longitude}</small>` : ''}
                                </div>
                            </div>
                        `).join('')
        }
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior se existir
    const existingModal = document.getElementById('route-details-modal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.appendChild(modal);
    console.log('Modal criado e adicionado ao DOM');

    // Inicializar mapa com delay maior
    setTimeout(() => {
        console.log('Inicializando mapa da rota...');
        initRouteDetailMap(route, routeData);
    }, 200);
}

function initRouteMap(routeData) {
    const mapContainer = document.getElementById('route-map');
    if (!mapContainer || !routeData.optimized_points || routeData.optimized_points.length === 0) {
        return;
    }

    // Criar mapa simples com marcadores
    const points = routeData.optimized_points;
    const bounds = calculateBounds(points);

    // Limpar container
    mapContainer.innerHTML = '';

    // Criar visualização simples sem biblioteca externa
    const mapDiv = document.createElement('div');
    mapDiv.style.cssText = `
        width: 100%;
        height: 100%;
        background: #e6f3ff;
        position: relative;
        border: 1px solid #ccc;
        border-radius: 10px;
        overflow: hidden;
    `;

    // Adicionar pontos como marcadores simples
    points.forEach((point, index) => {
        const marker = document.createElement('div');
        marker.style.cssText = `
            position: absolute;
            width: 30px;
            height: 30px;
            background: ${index === 0 ? '#28a745' : index === points.length - 1 ? '#dc3545' : '#007bff'};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 10;
        `;

        // Posicionar marcador (simulação)
        const x = 50 + (index * 40) % 200;
        const y = 50 + Math.sin(index) * 30;
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;

        marker.textContent = index + 1;
        marker.title = point.nome;

        mapDiv.appendChild(marker);

        // Desenhar linha para o próximo ponto
        if (index < points.length - 1) {
            const line = document.createElement('div');
            const nextX = 50 + ((index + 1) * 40) % 200;
            const nextY = 50 + Math.sin(index + 1) * 30;

            const length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));
            const angle = Math.atan2(nextY - y, nextX - x) * 180 / Math.PI;

            line.style.cssText = `
                position: absolute;
                width: ${length}px;
                height: 3px;
                background: #007bff;
                left: ${x + 15}px;
                top: ${y + 13.5}px;
                transform-origin: 0 50%;
                transform: rotate(${angle}deg);
                z-index: 5;
            `;

            mapDiv.appendChild(line);
        }
    });

    // Adicionar legenda
    const legend = document.createElement('div');
    legend.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(255,255,255,0.9);
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    legend.innerHTML = `
        <div><span style="color: #28a745;">●</span> Início</div>
        <div><span style="color: #007bff;">●</span> Pontos Intermediários</div>
        <div><span style="color: #dc3545;">●</span> Final</div>
    `;

    mapDiv.appendChild(legend);
    mapContainer.appendChild(mapDiv);
}

function initRouteDetailMap(route, routeData) {
    console.log('Iniciando mapa REAL de detalhes da rota...');
    const mapContainer = document.getElementById('route-detail-map');

    if (!mapContainer) {
        console.error('Container do mapa não encontrado!');
        return;
    }

    // Obter pontos da rota
    const points = route.pontos_turisticos || [];
    console.log('Pontos da rota:', points.length);

    if (points.length === 0) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                <p>Nenhum ponto para exibir no mapa</p>
                <p style="font-size: 0.9rem;">Esta rota não possui pontos turísticos</p>
            </div>
        `;
        return;
    }

    // Verificar se o Leaflet está disponível
    if (typeof L === 'undefined') {
        console.warn('Leaflet não disponível, usando mapa simulado');
        initSimulatedMap(mapContainer, points, routeData);
        return;
    }

    // Limpar container
    mapContainer.innerHTML = '';
    mapContainer.style.height = '400px';

    // Calcular centro do mapa baseado nos pontos
    let centerLat = 0, centerLng = 0, validPoints = 0;

    points.forEach(point => {
        if (point.localizacao) {
            centerLat += point.localizacao.latitude;
            centerLng += point.localizacao.longitude;
            validPoints++;
        }
    });

    if (validPoints === 0) {
        // Usar coordenadas padrão do Brasil
        centerLat = -15.7801;
        centerLng = -47.9292;
    } else {
        centerLat /= validPoints;
        centerLng /= validPoints;
    }

    // Criar mapa Leaflet
    const leafletMap = L.map(mapContainer).setView([centerLat, centerLng], 12);

    // Adicionar camada de tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(leafletMap);

    // Adicionar marcadores para cada ponto
    const markers = [];
    const latLngs = [];

    points.forEach((point, index) => {
        if (point.localizacao) {
            const lat = point.localizacao.latitude;
            const lng = point.localizacao.longitude;

            // Criar marcador personalizado
            const markerColor = index === 0 ? 'green' :
                index === points.length - 1 ? 'red' : 'blue';

            const marker = L.marker([lat, lng]).addTo(leafletMap);

            // Popup com informações do ponto
            const popupContent = `
                <div>
                    <h4>${point.nome}</h4>
                    <p><strong>Posição:</strong> ${index + 1}º ponto</p>
                    ${point.descricao ? `<p>${point.descricao}</p>` : ''}
                    <p><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                </div>
            `;
            marker.bindPopup(popupContent);

            markers.push(marker);
            latLngs.push([lat, lng]);
        }
    });

    // Ajustar zoom para mostrar todos os pontos
    if (latLngs.length > 0) {
        const group = new L.featureGroup(markers);
        leafletMap.fitBounds(group.getBounds().pad(0.1));
    }

    // Tentar adicionar rota real se houver dados de rota
    if (routeData && routeData.type === 'real' && routeData.geometry) {
        console.log('Adicionando rota real ao mapa...');

        // Adicionar linha da rota usando a geometria real
        const routeLine = L.geoJSON(routeData.geometry, {
            style: {
                color: '#007bff',
                weight: 4,
                opacity: 0.8
            }
        }).addTo(leafletMap);

        // Adicionar popup com informações da rota
        routeLine.bindPopup(`
            <div>
                <h4>🛣️ Rota Otimizada</h4>
                <p><strong>Distância:</strong> ${routeData.total_distance} km</p>
                <p><strong>Tempo estimado:</strong> ${Math.floor(routeData.estimated_time / 60)}h ${routeData.estimated_time % 60}min</p>
                <p><strong>Fonte:</strong> ${routeData.source}</p>
            </div>
        `);

    } else if (latLngs.length > 1) {
        console.log('Adicionando linha simples conectando os pontos...');

        // Adicionar linha simples conectando os pontos
        const polyline = L.polyline(latLngs, {
            color: '#007bff',
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 10'
        }).addTo(leafletMap);

        polyline.bindPopup(`
            <div>
                <h4>📍 Rota Aproximada</h4>
                <p><strong>Pontos:</strong> ${points.length}</p>
                <p>Conectando pontos em linha reta</p>
                <p><em>Para rota real, aguarde o cálculo...</em></p>
            </div>
        `);
    }

    // Adicionar controles de informação
    const info = L.control({ position: 'topright' });
    info.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'route-info-control');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <h4 style="margin: 0 0 5px 0;">${route.nome}</h4>
                <p style="margin: 0; font-size: 12px;">📍 ${points.length} pontos</p>
                ${routeData ? `
                    <p style="margin: 0; font-size: 12px;">🛣️ ${routeData.total_distance} km</p>
                    <p style="margin: 0; font-size: 12px;">⏱️ ${Math.floor(routeData.estimated_time / 60)}h ${routeData.estimated_time % 60}min</p>
                ` : ''}
            </div>
        `;
        return div;
    };
    info.addTo(leafletMap);

    console.log('Mapa real criado com sucesso!');
}

// Função de fallback para mapa simulado caso Leaflet não esteja disponível
function initSimulatedMap(mapContainer, points, routeData) {
    // Limpar container
    mapContainer.innerHTML = '';

    // Criar mapa simples
    const mapDiv = document.createElement('div');
    mapDiv.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #e6f3ff 0%, #cce7ff 100%);
        position: relative;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #ddd;
    `;

    // Adicionar título do mapa
    const mapTitle = document.createElement('div');
    mapTitle.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(255,255,255,0.9);
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        font-weight: bold;
        color: #333;
        z-index: 20;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    mapTitle.textContent = 'Mapa Simulado - Para mapa real, carregue as bibliotecas';
    mapDiv.appendChild(mapTitle);

    // Calcular posições dos pontos em círculo ou grid
    const centerX = 250;
    const centerY = 200;
    const radius = Math.min(150, 50 + points.length * 10);

    points.forEach((point, index) => {
        const marker = document.createElement('div');
        marker.style.cssText = `
            position: absolute;
            width: 35px;
            height: 35px;
            background: ${index === 0 ? '#28a745' : index === points.length - 1 ? '#dc3545' : '#007bff'};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 15;
            transition: transform 0.3s ease;
        `;

        // Posicionar em círculo
        const angle = (index / Math.max(points.length - 1, 1)) * Math.PI * 1.5;
        const x = centerX + Math.cos(angle) * radius - 17.5;
        const y = centerY + Math.sin(angle) * radius - 17.5;

        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.textContent = index + 1;
        marker.title = `${index + 1}. ${point.nome || point}`;

        // Efeito hover
        marker.addEventListener('mouseenter', () => {
            marker.style.transform = 'scale(1.2)';
        });
        marker.addEventListener('mouseleave', () => {
            marker.style.transform = 'scale(1)';
        });

        mapDiv.appendChild(marker);

        // Desenhar linha para o próximo ponto
        if (index < points.length - 1) {
            const nextAngle = ((index + 1) / Math.max(points.length - 1, 1)) * Math.PI * 1.5;
            const nextX = centerX + Math.cos(nextAngle) * radius;
            const nextY = centerY + Math.sin(nextAngle) * radius;

            const length = Math.sqrt(Math.pow(nextX - (x + 17.5), 2) + Math.pow(nextY - (y + 17.5), 2));
            const lineAngle = Math.atan2(nextY - (y + 17.5), nextX - (x + 17.5)) * 180 / Math.PI;

            const line = document.createElement('div');
            line.style.cssText = `
                position: absolute;
                width: ${length}px;
                height: 3px;
                background: #007bff;
                left: ${x + 17.5}px;
                top: ${y + 15}px;
                transform-origin: 0 50%;
                transform: rotate(${lineAngle}deg);
                z-index: 5;
                opacity: 0.8;
            `;

            mapDiv.appendChild(line);

            // Adicionar seta na linha
            const arrow = document.createElement('div');
            arrow.style.cssText = `
                position: absolute;
                width: 0;
                height: 0;
                border-left: 6px solid #007bff;
                border-top: 3px solid transparent;
                border-bottom: 3px solid transparent;
                right: -6px;
                top: -1.5px;
            `;
            line.appendChild(arrow);
        }
    });

    // Adicionar informações da rota se disponível
    if (routeData) {
        const routeInfo = document.createElement('div');
        routeInfo.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(255,255,255,0.95);
            padding: 10px;
            border-radius: 10px;
            font-size: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 20;
        `;
        routeInfo.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>📍 ${points.length} pontos</strong></div>
            <div style="margin-bottom: 5px;">🛣️ ${routeData.total_distance} km</div>
            <div>⏱️ ${Math.floor(routeData.estimated_time / 60)}h ${routeData.estimated_time % 60}min</div>
        `;
        mapDiv.appendChild(routeInfo);
    }

    // Adicionar legenda
    const legend = document.createElement('div');
    legend.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(255,255,255,0.95);
        padding: 10px;
        border-radius: 10px;
        font-size: 11px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 20;
    `;
    legend.innerHTML = `
        <div style="margin-bottom: 3px;"><span style="display: inline-block; width: 12px; height: 12px; background: #28a745; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>Início</div>
        <div style="margin-bottom: 3px;"><span style="display: inline-block; width: 12px; height: 12px; background: #007bff; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>Intermediário</div>
        <div><span style="display: inline-block; width: 12px; height: 12px; background: #dc3545; border-radius: 50%; margin-right: 5px; vertical-align: middle;"></span>Final</div>
    `;

    mapDiv.appendChild(legend);
    mapContainer.appendChild(mapDiv);

    console.log('Mapa criado com sucesso!');
}

function calculateBounds(points) {
    if (!points || points.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    points.forEach(point => {
        if (point.localizacao) {
            const lat = point.localizacao.latitude;
            const lng = point.localizacao.longitude;

            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        }
    });

    return {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng
    };
}

// Função para integrar com mapas reais (Leaflet) - para implementação futura
function initLeafletMap(containerId, points) {
    // Esta função pode ser implementada quando quiser usar mapas reais
    // Requer inclusão da biblioteca Leaflet no HTML:
    // <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    // <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

    console.log('Mapa Leaflet seria inicializado aqui com pontos:', points);
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';

    notification.innerHTML = `
        <i class="${icon}"></i>
        ${message}
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função de debug para diagnóstico
function debugInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('allSpots length:', allSpots.length);
    console.log('allRoutes length:', allRoutes.length);
    console.log('currentSection:', currentSection);
    console.log('selectedSpots length:', selectedSpots.length);

    // Mostrar primeiros spots
    if (allSpots.length > 0) {
        console.log('Primeiro spot:', allSpots[0]);
    }

    // Testar busca
    const searchInput = document.getElementById('search-spots');
    if (searchInput) {
        console.log('Campo de busca valor:', searchInput.value);
        console.log('Campo de busca existe:', !!searchInput);
    }

    // Mostrar notificação
    showNotification(`Debug: ${allSpots.length} pontos carregados, seção atual: ${currentSection}`, 'info');

    // Forçar recarregamento dos pontos
    if (allSpots.length === 0) {
        console.log('Forçando recarregamento dos pontos...');
        loadTouristSpots();
    }
}

async function addExternalSpot(spotId) {
    try {
        // Encontrar o ponto nas últimas buscas
        const spotCards = document.querySelectorAll('.spot-card');
        let spotData = null;

        spotCards.forEach(card => {
            if (card.dataset.spotId === spotId) {
                const title = card.querySelector('.card-title').textContent;
                const description = card.querySelector('.card-description')?.textContent || '';
                const locationText = card.querySelector('p[style*="color: #666"]').textContent;

                spotData = {
                    nome: title,
                    descricao: description,
                    endereco: locationText.replace('Lat: ', '').replace('Lng: ', ''),
                    categoria: card.querySelector('.spot-tag:not(.external-indicator)')?.textContent || 'Turismo'
                };
            }
        });

        if (!spotData) {
            showNotification('Erro ao obter dados do ponto turístico', 'error');
            return;
        }

        // Simular adição (em uma implementação real, você salvaria no backend)
        showNotification(`"${spotData.nome}" adicionado aos seus pontos turísticos!`, 'success');

        // Opcional: recarregar pontos locais
        loadTouristSpots();

    } catch (error) {
        console.error('Erro ao adicionar ponto externo:', error);
        showNotification('Erro ao adicionar ponto turístico', 'error');
    }
}

async function optimizeExistingRoute(routeId) {
    try {
        showNotification('Otimizando rota...', 'info');

        const response = await fetch(`${API_BASE_URL}/routes/${routeId}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();

            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🚀 Rota Otimizada</h3>
                        <button class="close-modal" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="route-stats">
                            <div class="stat-item">
                                <i class="fas fa-route"></i>
                                <span>Distância: <strong>${result.total_distance} km</strong></span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-clock"></i>
                                <span>Tempo: <strong>${Math.floor(result.estimated_time / 60)}h ${result.estimated_time % 60}min</strong></span>
                            </div>
                        </div>
                        
                        <h4>Ordem Otimizada dos Pontos:</h4>
                        <div class="route-sequence">
                            ${result.optimized_order.map((point, index) => `
                                <div class="sequence-item">
                                    <span class="sequence-number">${index + 1}</span>
                                    <span class="sequence-name">${point.nome || point}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            showNotification('Rota otimizada com sucesso!', 'success');
        } else {
            throw new Error('Erro ao otimizar rota');
        }
    } catch (error) {
        console.error('Erro ao otimizar rota:', error);
        showNotification('Erro ao otimizar rota', 'error');
    }
}

async function previewRoute() {
    if (selectedSpots.length < 2) {
        showNotification('Selecione pelo menos 2 pontos turísticos para visualizar a rota', 'warning');
        return;
    }

    try {
        showNotification('Calculando rota...', 'info');
        const routeData = await calculateOptimalRoute(selectedSpots);

        if (routeData) {
            showRoutePreview(routeData);
        } else {
            showNotification('Erro ao calcular rota. Usando ordem atual dos pontos.', 'warning');
            // Mostrar preview simples sem otimização
            const simpleRouteData = {
                optimized_points: selectedSpots,
                total_distance: '--',
                estimated_time: '--',
                route_data: null
            };
            showRoutePreview(simpleRouteData);
        }
    } catch (error) {
        console.error('Erro no preview da rota:', error);
        showNotification('Erro ao visualizar rota', 'error');
    }
}

// === FUNÇÕES ESSENCIAIS QUE ESTAVAM FALTANDO ===

function filterSpots() {
    const searchInput = document.getElementById('search-spots');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    console.log('Filtrando pontos com termo:', searchTerm);

    if (searchTerm.length < 2) {
        displayTouristSpots(allSpots);
        return;
    }

    // Buscar pontos locais
    const filteredSpots = allSpots.filter(spot =>
        spot.nome.toLowerCase().includes(searchTerm) ||
        (spot.descricao && spot.descricao.toLowerCase().includes(searchTerm)) ||
        (spot.cidade && spot.cidade.toLowerCase().includes(searchTerm))
    );

    // Se há poucos resultados locais, buscar externamente
    if (filteredSpots.length < 5) {
        searchExternalSpots(searchTerm);
    } else {
        displayTouristSpots(filteredSpots);
    }
}

async function searchExternalSpots(searchTerm) {
    try {
        showLoading('spots-list');
        console.log('Buscando pontos externos para:', searchTerm);

        const response = await fetch(`${API_BASE_URL}/search-places?q=${encodeURIComponent(searchTerm)}`);

        if (response.ok) {
            const externalSpots = await response.json();
            console.log('Pontos externos encontrados:', externalSpots.length);

            // Combinar resultados locais e externos
            const localFiltered = allSpots.filter(spot =>
                spot.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (spot.descricao && spot.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            const combinedSpots = [...localFiltered, ...externalSpots];
            displayTouristSpots(combinedSpots);
        } else {
            console.error('Erro na busca externa');
            // Mostrar apenas resultados locais
            const filteredSpots = allSpots.filter(spot =>
                spot.nome.toLowerCase().includes(searchTerm.toLowerCase())
            );
            displayTouristSpots(filteredSpots);
        }
    } catch (error) {
        console.error('Erro na busca externa:', error);
        // Fallback para busca local
        const filteredSpots = allSpots.filter(spot =>
            spot.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
        displayTouristSpots(filteredSpots);
    }
}

function openSpotsModal() {
    const modal = document.getElementById('spots-modal');
    if (modal) {
        modal.classList.add('active');
        populateModalSpots(allSpots);
    }
}

function closeSpotsModal() {
    const modal = document.getElementById('spots-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function toggleSpotSelection(spotId) {
    const spot = allSpots.find(s => s.id == spotId);
    if (!spot) return;

    const index = selectedSpots.findIndex(s => s.id == spotId);

    if (index > -1) {
        // Remover da seleção
        selectedSpots.splice(index, 1);
    } else {
        // Adicionar à seleção
        selectedSpots.push(spot);
    }

    // Atualizar visual
    updateModalSpotSelection();
    updateSelectedSpotsDisplay();
}

function updateModalSpotSelection() {
    const spotCards = document.querySelectorAll('.modal-spot-card');
    spotCards.forEach(card => {
        const spotId = card.dataset.spotId;
        const isSelected = selectedSpots.some(s => s.id == spotId);

        if (isSelected) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function confirmSpotSelection() {
    closeSpotsModal();
    updateSelectedSpotsDisplay();
    showNotification(`${selectedSpots.length} pontos selecionados`, 'success');
}

function updateSelectedSpotsDisplay() {
    const container = document.getElementById('selected-spots');
    if (!container) return;

    if (selectedSpots.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum ponto selecionado</p>';
        return;
    }

    container.innerHTML = selectedSpots.map((spot, index) => `
        <div class="selected-spot" data-spot-id="${spot.id}">
            <span class="spot-order">${index + 1}</span>
            <span class="spot-name">${spot.nome}</span>
            <button class="btn-remove" onclick="removeSelectedSpot(${spot.id})" title="Remover">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeSelectedSpot(spotId) {
    selectedSpots = selectedSpots.filter(s => s.id != spotId);
    updateSelectedSpotsDisplay();
    updateModalSpotSelection();
}

// Função para deletar rota
async function deleteRoute(routeId) {
    if (!confirm('Tem certeza que deseja excluir esta rota?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Rota excluída com sucesso!', 'success');
            loadRoutes(); // Recarregar lista
        } else {
            throw new Error('Erro ao excluir rota');
        }
    } catch (error) {
        console.error('Erro ao excluir rota:', error);
        showNotification('Erro ao excluir rota', 'error');
    }
}

// Função para exportar PDF
async function exportRoutePDF(routeId) {
    try {
        showNotification('Gerando PDF...', 'info');

        const response = await fetch(`${API_BASE_URL}/routes/${routeId}/pdf`);

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `rota_${routeId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showNotification('PDF baixado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao gerar PDF');
        }
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        showNotification('Erro ao gerar PDF', 'error');
    }
}

// === FIM DAS FUNÇÕES ESSENCIAIS ===
