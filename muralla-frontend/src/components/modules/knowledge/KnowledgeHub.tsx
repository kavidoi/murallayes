import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface Document {
  id: string;
  title: string;
  type: 'policy' | 'sop' | 'guide' | 'template' | 'history';
  category: string;
  content: string;
  tags: string[];
  lastUpdated: string;
  author: string;
  version: string;
  views: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
}

interface SearchResult {
  document: Document;
  relevance: number;
  snippet: string;
}

const KnowledgeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [popularDocuments, setPopularDocuments] = useState<Document[]>([]);

  const [documents] = useState<Document[]>([
    {
      id: '1',
      title: 'Política de Trabajo Remoto',
      type: 'policy',
      category: 'Recursos Humanos',
      content: 'Lineamientos para el trabajo remoto e híbrido...',
      tags: ['remoto', 'política', 'flexibilidad'],
      lastUpdated: '2024-03-01',
      author: 'HR Team',
      version: '2.1',
      views: 245,
      rating: 4.8,
      status: 'published'
    },
    {
      id: '2',
      title: 'SOP: Proceso de Onboarding',
      type: 'sop',
      category: 'Recursos Humanos',
      content: 'Procedimiento estándar para incorporación de nuevos empleados...',
      tags: ['onboarding', 'proceso', 'nuevos empleados'],
      lastUpdated: '2024-02-28',
      author: 'Maria Rodriguez',
      version: '3.0',
      views: 189,
      rating: 4.9,
      status: 'published'
    },
    {
      id: '3',
      title: 'Guía de Ventas B2B',
      type: 'guide',
      category: 'Ventas',
      content: 'Metodología completa para ventas empresariales...',
      tags: ['ventas', 'b2b', 'metodología'],
      lastUpdated: '2024-03-10',
      author: 'Sales Team',
      version: '1.5',
      views: 156,
      rating: 4.7,
      status: 'published'
    },
    {
      id: '4',
      title: 'Template: Propuesta Comercial',
      type: 'template',
      category: 'Ventas',
      content: 'Plantilla estándar para propuestas comerciales...',
      tags: ['template', 'propuesta', 'comercial'],
      lastUpdated: '2024-03-05',
      author: 'Juan Perez',
      version: '2.0',
      views: 298,
      rating: 4.6,
      status: 'published'
    },
    {
      id: '5',
      title: 'Historia: Fundación de la Empresa',
      type: 'history',
      category: 'Cultura',
      content: 'Relato de los inicios y evolución de Muralla...',
      tags: ['historia', 'fundación', 'cultura'],
      lastUpdated: '2024-01-15',
      author: 'Founders',
      version: '1.0',
      views: 78,
      rating: 4.9,
      status: 'published'
    }
  ]);

  useEffect(() => {
    // Simulate recent documents (last viewed)
    setRecentDocuments(documents.slice(0, 3));
    
    // Simulate popular documents (most viewed)
    setPopularDocuments(
      [...documents]
        .sort((a, b) => b.views - a.views)
        .slice(0, 4)
    );
  }, [documents]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = documents
      .map(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = doc.content.toLowerCase().includes(query.toLowerCase());
        const tagMatch = doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        let relevance = 0;
        if (titleMatch) relevance += 3;
        if (contentMatch) relevance += 2;
        if (tagMatch) relevance += 1;
        
        if (relevance > 0) {
          return {
            document: doc,
            relevance,
            snippet: doc.content.substring(0, 150) + '...'
          };
        }
        return null;
      })
      .filter(result => result !== null)
      .sort((a, b) => b!.relevance - a!.relevance) as SearchResult[];

    setSearchResults(results);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'policy': return '📋';
      case 'sop': return '⚙️';
      case 'guide': return '📖';
      case 'template': return '📄';
      case 'history': return '📚';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'policy': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      case 'sop': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'guide': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'template': return 'bg-electric-purple/20 text-electric-purple border-electric-purple/30';
      case 'history': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalDocuments = documents.length;
  const publishedDocuments = documents.filter(d => d.status === 'published').length;
  const totalViews = documents.reduce((sum, doc) => sum + doc.views, 0);
  const avgRating = documents.reduce((sum, doc) => sum + doc.rating, 0) / documents.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🧠 Centro de Conocimiento</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tu biblioteca inteligente de conocimiento institucional
          </p>
        </div>
        <button className="btn-electric">
          ➕ Nuevo Documento
        </button>
      </div>

      {/* Knowledge Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Documentos"
          value={totalDocuments}
          subtitle={`${publishedDocuments} publicados`}
          color="electric-blue"
        />
        <StatCard
          title="Visualizaciones"
          value={totalViews.toLocaleString()}
          subtitle="este mes"
          color="electric-green"
        />
        <StatCard
          title="Rating Promedio"
          value={avgRating.toFixed(1)}
          subtitle="⭐ de 5.0"
          color="electric-purple"
        />
        <StatCard
          title="Categorías"
          value={[...new Set(documents.map(d => d.category))].length}
          subtitle="áreas de conocimiento"
          color="electric-cyan"
        />
      </div>

      {/* AI-Powered Search */}
      <Card className="bg-gradient-to-br from-electric-cyan/20 to-electric-blue/10 dark:from-electric-cyan/20 dark:to-electric-blue/10 border-electric-cyan/30 dark:border-electric-blue/30">
        <CardHeader>
          <CardTitle className="text-electric-cyan">🤖 Búsqueda Inteligente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <input
              type="text"
              placeholder="Pregunta cualquier cosa sobre la empresa... ej: '¿Cómo trabajar remoto?' o 'proceso de ventas'"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 text-lg border border-electric-cyan/30 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-electric-cyan"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-electric-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Resultados ({searchResults.length})
              </h4>
              {searchResults.map((result) => (
                <div key={result.document.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="mr-2">{getTypeIcon(result.document.type)}</span>
                        <h5 className="font-medium text-gray-900 dark:text-white">{result.document.title}</h5>
                        <span className={`ml-2 px-2 py-1 text-xs rounded ${getTypeColor(result.document.type)}`}>
                          {result.document.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{result.snippet}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{result.document.category}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(result.document.lastUpdated)}</span>
                        <span className="mx-2">•</span>
                        <span>⭐ {result.document.rating}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-xs text-electric-blue font-medium">
                        {Math.round(result.relevance * 25)}% relevancia
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'recent', label: '🕒 Recientes', icon: '🕒' },
          { id: 'popular', label: '🔥 Populares', icon: '🔥' },
          { id: 'categories', label: '📁 Categorías', icon: '📁' },
          { id: 'ai-insights', label: '🤖 IA Insights', icon: '🤖' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-electric-blue text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recent Documents */}
      {activeTab === 'recent' && (
        <Card>
          <CardHeader>
            <CardTitle>🕒 Documentos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{getTypeIcon(doc.type)}</span>
                      <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getTypeColor(doc.type)}`}>
                      {doc.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {doc.content.substring(0, 100)}...
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doc.category}</span>
                    <span>{formatDate(doc.lastUpdated)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="mr-3">👁️ {doc.views}</span>
                      <span>⭐ {doc.rating}</span>
                    </div>
                    <button className="text-xs text-electric-blue hover:underline">
                      Leer más →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Documents */}
      {activeTab === 'popular' && (
        <Card>
          <CardHeader>
            <CardTitle>🔥 Documentos Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularDocuments.map((doc, index) => (
                <div key={doc.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center w-8 h-8 bg-electric-blue text-white rounded-full font-bold text-sm mr-4">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="mr-2">{getTypeIcon(doc.type)}</span>
                      <h4 className="font-medium text-gray-900 dark:text-white">{doc.title}</h4>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {doc.content.substring(0, 80)}...
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="mr-4">{doc.category}</span>
                      <span className="mr-4">👁️ {doc.views} vistas</span>
                      <span>⭐ {doc.rating}</span>
                    </div>
                  </div>
                  
                  <button className="ml-4 text-sm text-electric-blue hover:underline">
                    Ver documento
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...new Set(documents.map(d => d.category))].map((category) => {
            const categoryDocs = documents.filter(d => d.category === category);
            const totalViews = categoryDocs.reduce((sum, doc) => sum + doc.views, 0);
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-electric-blue">{categoryDocs.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">documentos</div>
                    <div className="text-xs text-gray-500 mt-1">{totalViews} vistas totales</div>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryDocs.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center text-sm">
                        <span className="mr-2">{getTypeIcon(doc.type)}</span>
                        <span className="flex-1 truncate text-gray-900 dark:text-white">{doc.title}</span>
                        <span className="text-xs text-gray-500">⭐ {doc.rating}</span>
                      </div>
                    ))}
                    {categoryDocs.length > 3 && (
                      <div className="text-xs text-electric-blue">
                        +{categoryDocs.length - 3} más...
                      </div>
                    )}
                  </div>
                  
                  <button className="w-full mt-4 text-sm text-electric-blue hover:underline">
                    Ver toda la categoría →
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Insights */}
      {activeTab === 'ai-insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-electric-purple/20 to-electric-pink/10 dark:from-electric-purple/20 dark:to-electric-pink/10 border-electric-purple/30 dark:border-electric-pink/30">
            <CardHeader>
              <CardTitle className="text-electric-purple">🤖 Análisis IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">📈 Tendencias de Búsqueda</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">"trabajo remoto"</span>
                      <span className="text-electric-green font-medium">+45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">"proceso de ventas"</span>
                      <span className="text-electric-green font-medium">+32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">"onboarding"</span>
                      <span className="text-electric-blue font-medium">+18%</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎯 Contenido Sugerido</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Crear guía de comunicación interna</p>
                    <p>• Actualizar políticas de seguridad</p>
                    <p>• Documentar proceso de escalación</p>
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">⚠️ Documentos Obsoletos</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Manual IT (6 meses sin actualizar)</p>
                    <p>• Política de gastos (necesita revisión)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>💡 Recomendaciones Personalizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border border-electric-blue/30 rounded-lg bg-electric-blue/5">
                  <div className="flex items-center mb-2">
                    <span className="mr-2">📖</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">Para ti</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Basado en tu rol de Ejecutivo de Ventas, te recomendamos:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="text-electric-blue">• Guía avanzada de negociación</li>
                    <li className="text-electric-blue">• Templates de propuestas 2024</li>
                    <li className="text-electric-blue">• Proceso de cierre de ventas</li>
                  </ul>
                </div>
                
                <div className="p-3 border border-electric-green/30 rounded-lg bg-electric-green/5">
                  <div className="flex items-center mb-2">
                    <span className="mr-2">🏆</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">Más Valorados</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Documentos con mejor rating en tu área:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="text-electric-green">• SOP: Proceso de Onboarding (4.9⭐)</li>
                    <li className="text-electric-green">• Historia: Fundación (4.9⭐)</li>
                    <li className="text-electric-green">• Política: Trabajo Remoto (4.8⭐)</li>
                  </ul>
                </div>
                
                <div className="p-3 border border-electric-purple/30 rounded-lg bg-electric-purple/5">
                  <div className="flex items-center mb-2">
                    <span className="mr-2">🔔</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">Actualizaciones</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Documentos actualizados recientemente:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="text-electric-purple">• Guía de Ventas B2B (hace 2 días)</li>
                    <li className="text-electric-purple">• Template: Propuesta Comercial (hace 5 días)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default KnowledgeHub;