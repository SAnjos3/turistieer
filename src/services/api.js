import axios from 'axios';

// Configuração base da API
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Serviços de Rotas
export const routeService = {
  // Listar todas as rotas
  getRoutes: async (userId = 1) => {
    const response = await api.get(`/routes?user_id=${userId}`);
    return response.data;
  },

  // Obter uma rota específica
  getRoute: async (routeId) => {
    const response = await api.get(`/routes/${routeId}`);
    return response.data;
  },

  // Criar nova rota
  createRoute: async (routeData) => {
    const response = await api.post('/routes', routeData);
    return response.data;
  },

  // Atualizar rota existente
  updateRoute: async (routeId, routeData) => {
    const response = await api.put(`/routes/${routeId}`, routeData);
    return response.data;
  },

  // Deletar rota
  deleteRoute: async (routeId) => {
    const response = await api.delete(`/routes/${routeId}`);
    return response.data;
  },

  // Exportar rota para PDF
  exportRouteToPDF: async (routeId) => {
    const response = await api.get(`/routes/${routeId}/export-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Enviar notificação de rota
  sendRouteNotification: async (routeId) => {
    const response = await api.post(`/routes/${routeId}/send-notification`);
    return response.data;
  },
};

// Serviços de Pontos Turísticos
export const touristSpotService = {
  // Listar todos os pontos turísticos
  getTouristSpots: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/tourist-spots?${queryParams}`);
    return response.data;
  },

  // Obter um ponto turístico específico
  getTouristSpot: async (spotId) => {
    const response = await api.get(`/tourist-spots/${spotId}`);
    return response.data;
  },
};

// Serviços de Usuário
export const userService = {
  // Obter usuário (para MVP, usar usuário padrão)
  getCurrentUser: async () => {
    return {
      id: 1,
      username: 'usuario_demo',
      email: 'demo@turismo.com',
      idioma_preferencial: 'PT'
    };
  },
};

// Serviços de Geolocalização
export const geolocationService = {
  // Obter posição atual do usuário
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada pelo navegador'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  },

  // Observar mudanças na posição
  watchPosition: (callback, errorCallback) => {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocalização não é suportada pelo navegador'));
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      errorCallback,
      options
    );
  },

  // Parar de observar posição
  clearWatch: (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
};

export default api;

