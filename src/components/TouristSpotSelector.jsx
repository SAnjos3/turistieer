import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { X, Search, MapPin, Plus, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { touristSpotService } from '../services/api';

const TouristSpotSelector = ({ onSelectSpot, onClose, selectedSpots = [] }) => {
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadTouristSpots();
  }, []);

  useEffect(() => {
    filterSpots();
  }, [searchTerm, spots]);

  const loadTouristSpots = async () => {
    try {
      setLoading(true);
      const data = await touristSpotService.getTouristSpots();
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

    const filtered = spots.filter(spot =>
      spot.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spot.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpots(filtered);
  };

  const isSpotSelected = (spotId) => {
    return selectedSpots.some(spot => spot.id === spotId);
  };

  const handleSelectSpot = (spot) => {
    if (!isSpotSelected(spot.id)) {
      onSelectSpot(spot);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">{t('selectSpots')}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('searchSpots')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg text-gray-600">{t('loading')}</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{t('noSpotsFound')}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSpots.map((spot) => {
                const isSelected = isSpotSelected(spot.id);
                return (
                  <Card 
                    key={spot.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectSpot(spot)}
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
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {spot.nome}
                            </h4>
                            {isSelected ? (
                              <Badge variant="default" className="flex items-center space-x-1">
                                <Check className="h-3 w-3" />
                                <span>Selecionado</span>
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center space-x-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSpot(spot);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                                <span>Adicionar</span>
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {spot.descricao}
                          </p>
                          <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {spot.localizacao?.latitude?.toFixed(4)}, {spot.localizacao?.longitude?.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSpots.length} de 5 pontos selecionados
            </div>
            <Button onClick={onClose}>
              Concluir Seleção
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouristSpotSelector;

