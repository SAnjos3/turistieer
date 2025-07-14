import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { touristSpotService, geolocationService } from '../services/api';
import MapComponent from './MapComponent';

const TouristSpots = ({ setCurrentView }) => {
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      await getCurrentLocation();
      await loadTouristSpots();
    };
    fetchData();
  }, []);

  useEffect(() => {
    filterSpots();
  }, [searchTerm, spots]);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      console.log('Attempting to get user location...');
      const position = await geolocationService.getCurrentPosition();
      setUserLocation(position);
      setLocationError(null);
      console.log('User location obtained:', position);
    } catch (err) {
      setLocationError(err.message);
      console.error('Error getting user location:', err);
    } finally {
      setLocationLoading(false);
      console.log('Location loading finished.');
    }
  };

  const loadTouristSpots = async () => {
    try {
      setLoading(true);
      let data;
      if (userLocation) {
        data = await touristSpotService.getTouristSpots({
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radius: 50 // Exemplo: busca por pontos em um raio de 50km
        });
      } else {
        data = await touristSpotService.getTouristSpots();
      }
      setSpots(data);
      setFilteredSpots(data);
    } catch (err) {
      setError(t('errorLoadingSpots'));
      console.error('Error loading tourist spots:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterSpots = () => {
    if (!searchTerm.trim()) {
      setFilteredSpots(spots);
      return;
    }

    const filtered = spots.filter(
      (spot) =>
        spot.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpots(filtered);
  };

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
  };

  if (loading || locationLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('allTouristSpots')}
        </h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {filteredSpots.length} pontos
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t('searchSpots')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Pontos */}
        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto">
          {filteredSpots.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{t('noSpotsFound')}</p>
            </div>
          ) : (
            filteredSpots.map((spot) => (
              <Card
                key={spot.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedSpot?.id === spot.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSpotClick(spot)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Imagem */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {spot.imagem_url ? (
                        <img
                          src={spot.imagem_url}
                          alt={spot.nome}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">
                        {spot.nome}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-3 mb-2">
                        {spot.descricao}
                      </p>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {spot.localizacao?.latitude?.toFixed(4)},{' '}
                          {spot.localizacao?.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Mapa */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>
                {selectedSpot
                  ? `Localização: ${selectedSpot.nome}`
                  : 'Mapa dos Pontos Turísticos'}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              {locationError ? (
                <div className="flex items-center justify-center h-full text-red-600 text-center p-4">
                  Não foi possível carregar o mapa: {locationError}. Por favor, permita o acesso à sua localização.
                </div>
              ) : (
                <MapComponent
                  spots={selectedSpot ? [selectedSpot] : filteredSpots}
                  showUserLocation={true}
                  userLocation={userLocation}
                  selectedSpot={selectedSpot}
                  className="w-full h-full rounded-lg"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detalhes do Ponto Selecionado */}
      {selectedSpot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>{selectedSpot.nome}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Imagem */}
              {selectedSpot.imagem_url && (
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedSpot.imagem_url}
                    alt={selectedSpot.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Informações */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-600">{selectedSpot.descricao}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Localização</h4>
                  <p className="text-gray-600">
                    Latitude: {selectedSpot.localizacao?.latitude?.toFixed(6)}
                  </p>
                  <p className="text-gray-600">
                    Longitude: {selectedSpot.localizacao?.longitude?.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TouristSpots;


