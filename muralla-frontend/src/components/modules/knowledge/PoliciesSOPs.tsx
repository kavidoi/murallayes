import React, { useState, useEffect } from 'react';
import { StatCard } from '../../ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface Policy {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  status: 'draft' | 'review' | 'active' | 'archived';
  approvedBy: string;
  acknowledgments: number;
  totalEmployees: number;
  compliance: number; // percentage
  tags: string[];
  relatedSOPs: string[];
}

interface SOP {
  id: string;
  title: string;
  process: string;
  description: string;
  steps: Step[];
  lastUpdated: string;
  version: string;
  owner: string;
  reviewers: string[];
  status: 'draft' | 'review' | 'active' | 'archived';
  estimatedTime: string;
  frequency: string;
  complexity: 'low' | 'medium' | 'high';
  relatedPolicies: string[];
}

interface Step {
  id: string;
  title: string;
  description: string;
  owner: string;
  estimatedTime: string;
  dependencies: string[];
  tools: string[];
  checkpoints: string[];
}

const PoliciesSOPs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('policies');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [policies] = useState<Policy[]>([
    {
      id: '1',
      title: 'Política de Trabajo Remoto e Híbrido',
      category: 'Recursos Humanos',
      description: 'Lineamientos para modalidades de trabajo flexible',
      content: 'Esta política establece los lineamientos para el trabajo remoto...',
      effectiveDate: '2024-01-01',
      lastUpdated: '2024-03-01',
      version: '2.1',
      status: 'active',
      approvedBy: 'CEO',
      acknowledgments: 145,
      totalEmployees: 150,
      compliance: 96.7,
      tags: ['remoto', 'flexibilidad', 'productividad'],
      relatedSOPs: ['sop-1', 'sop-2']
    },
    {
      id: '2',
      title: 'Política de Seguridad de Información',
      category: 'Tecnología',
      description: 'Protocolos de seguridad y manejo de datos',
      content: 'Los empleados deben seguir estrictos protocolos...',
      effectiveDate: '2024-02-01',
      lastUpdated: '2024-02-15',
      version: '3.0',
      status: 'active',
      approvedBy: 'CTO',
      acknowledgments: 150,
      totalEmployees: 150,
      compliance: 100,
      tags: ['seguridad', 'datos', 'compliance'],
      relatedSOPs: ['sop-3', 'sop-4']
    },
    {
      id: '3',
      title: 'Política de Gastos y Reembolsos',
      category: 'Finanzas',
      description: 'Procedimientos para gastos corporativos',
      content: 'Los gastos deben ser pre-aprobados...',
      effectiveDate: '2024-01-15',
      lastUpdated: '2024-01-15',
      version: '1.5',
      status: 'active',
      approvedBy: 'CFO',
      acknowledgments: 138,
      totalEmployees: 150,
      compliance: 92,
      tags: ['gastos', 'finanzas', 'aprobación'],
      relatedSOPs: ['sop-5']
    },
    {
      id: '4',
      title: 'Política de Desarrollo Profesional',
      category: 'Recursos Humanos',
      description: 'Oportunidades de crecimiento y capacitación',
      content: 'La empresa promueve el desarrollo continuo...',
      effectiveDate: '2024-03-01',
      lastUpdated: '2024-03-01',
      version: '1.0',
      status: 'review',
      approvedBy: 'Pending',
      acknowledgments: 0,
      totalEmployees: 150,
      compliance: 0,
      tags: ['desarrollo', 'capacitación', 'carrera'],
      relatedSOPs: []
    }
  ]);

  const [sops] = useState<SOP[]>([
    {
      id: 'sop-1',
      title: 'Proceso de Configuración de Trabajo Remoto',
      process: 'Recursos Humanos',
      description: 'Pasos para configurar el espacio de trabajo remoto',
      steps: [
        {
          id: '1',
          title: 'Solicitud de trabajo remoto',
          description: 'Empleado completa formulario de solicitud',
          owner: 'Empleado',
          estimatedTime: '15 min',
          dependencies: [],
          tools: ['Portal HR'],
          checkpoints: ['Formulario completo', 'Justificación válida']
        },
        {
          id: '2',
          title: 'Revisión por supervisor',
          description: 'Supervisor revisa y aprueba/rechaza solicitud',
          owner: 'Supervisor',
          estimatedTime: '30 min',
          dependencies: ['1'],
          tools: ['Sistema de aprobaciones'],
          checkpoints: ['Evaluación de productividad', 'Impacto en equipo']
        },
        {
          id: '3',
          title: 'Configuración técnica',
          description: 'IT configura accesos y herramientas necesarias',
          owner: 'IT Team',
          estimatedTime: '2 horas',
          dependencies: ['2'],
          tools: ['VPN', 'Software remoto', 'Hardware'],
          checkpoints: ['Acceso verificado', 'Seguridad configurada']
        }
      ],
      lastUpdated: '2024-03-01',
      version: '2.0',
      owner: 'HR Team',
      reviewers: ['IT Manager', 'Operations Manager'],
      status: 'active',
      estimatedTime: '2.5 horas',
      frequency: 'As needed',
      complexity: 'medium',
      relatedPolicies: ['1']
    },
    {
      id: 'sop-2',
      title: 'Onboarding de Nuevos Empleados',
      process: 'Recursos Humanos',
      description: 'Proceso completo de incorporación',
      steps: [
        {
          id: '1',
          title: 'Preparación pre-llegada',
          description: 'Configurar espacio de trabajo y documentación',
          owner: 'HR Coordinator',
          estimatedTime: '1 hora',
          dependencies: [],
          tools: ['Sistema HR', 'Email'],
          checkpoints: ['Espacio listo', 'Documentos preparados']
        },
        {
          id: '2',
          title: 'Primer día - Bienvenida',
          description: 'Recibimiento y orientación inicial',
          owner: 'HR Manager',
          estimatedTime: '4 horas',
          dependencies: ['1'],
          tools: ['Presentación', 'Tour oficina'],
          checkpoints: ['Documentos firmados', 'Accesos entregados']
        }
      ],
      lastUpdated: '2024-02-28',
      version: '3.1',
      owner: 'HR Team',
      reviewers: ['Department Managers'],
      status: 'active',
      estimatedTime: '1 semana',
      frequency: 'Per new hire',
      complexity: 'high',
      relatedPolicies: ['1', '4']
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'review': return 'bg-electric-yellow/20 text-electric-yellow border-electric-yellow/30';
      case 'draft': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'archived': return 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-electric-green/20 text-electric-green';
      case 'medium': return 'bg-electric-yellow/20 text-electric-yellow';
      case 'high': return 'bg-electric-red/20 text-electric-red';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'review': return 'En Revisión';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivada';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         policy.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || policy.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sop.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || sop.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.status === 'active').length;
  const avgCompliance = policies.reduce((sum, p) => sum + p.compliance, 0) / policies.length;
  const totalSOPs = sops.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 Políticas y SOPs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Marco normativo y procedimientos operativos estándar
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-electric-green">
            📋 Nueva Política
          </button>
          <button className="btn-electric-blue">
            ⚙️ Nuevo SOP
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Políticas Activas"
          value={activePolicies}
          subtitle={`de ${totalPolicies} totales`}
          color="electric-green"
        />
        <StatCard
          title="Compliance Promedio"
          value={`${avgCompliance.toFixed(1)}%`}
          subtitle="nivel de cumplimiento"
          color="electric-blue"
        />
        <StatCard
          title="SOPs Disponibles"
          value={totalSOPs}
          subtitle="procesos documentados"
          color="electric-purple"
        />
        <StatCard
          title="Revisiones Pendientes"
          value={policies.filter(p => p.status === 'review').length + sops.filter(s => s.status === 'review').length}
          subtitle="requieren atención"
          color="electric-yellow"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar políticas y SOPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="input"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="review">En revisión</option>
                <option value="draft">Borradores</option>
                <option value="archived">Archivados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'policies', label: '📋 Políticas' },
          { id: 'sops', label: '⚙️ SOPs' },
          { id: 'compliance', label: '✅ Compliance' },
          { id: 'analytics', label: '📊 Análisis' }
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

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {filteredPolicies.map((policy) => (
            <Card key={policy.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                        {policy.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(policy.status)}`}>
                        {getStatusName(policy.status)}
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        v{policy.version}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{policy.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {policy.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-electric-blue/10 text-electric-blue rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Categoría:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{policy.category}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Vigente desde:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{formatDate(policy.effectiveDate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Última actualización:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{formatDate(policy.lastUpdated)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Aprobada por:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{policy.approvedBy}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className="mb-2">
                      <div className="text-lg font-bold text-electric-green">{policy.compliance}%</div>
                      <div className="text-xs text-gray-500">Compliance</div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {policy.acknowledgments} / {policy.totalEmployees} reconocimientos
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1 dark:bg-gray-700">
                      <div
                        className="bg-electric-green h-2 rounded-full"
                        style={{ width: `${policy.compliance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button className="text-sm text-electric-blue hover:underline">
                      📖 Leer completa
                    </button>
                    <button className="text-sm text-electric-purple hover:underline">
                      📝 Reconocer
                    </button>
                    <button className="text-sm text-electric-green hover:underline">
                      📊 Ver compliance
                    </button>
                  </div>
                  {policy.relatedSOPs.length > 0 && (
                    <div className="text-sm text-gray-500">
                      🔗 {policy.relatedSOPs.length} SOPs relacionados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SOPs Tab */}
      {activeTab === 'sops' && (
        <div className="space-y-4">
          {filteredSOPs.map((sop) => (
            <Card key={sop.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
                        {sop.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(sop.status)}`}>
                        {getStatusName(sop.status)}
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        v{sop.version}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getComplexityColor(sop.complexity)}`}>
                        {sop.complexity === 'low' ? 'Baja' : sop.complexity === 'medium' ? 'Media' : 'Alta'} complejidad
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{sop.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Proceso:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{sop.process}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Propietario:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{sop.owner}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Tiempo estimado:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{sop.estimatedTime}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Frecuencia:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{sop.frequency}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Pasos:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{sop.steps.length} etapas</div>
                      </div>
                    </div>
                    
                    {/* Steps Preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">📋 Pasos del Proceso</h4>
                      <div className="space-y-2">
                        {sop.steps.slice(0, 3).map((step, index) => (
                          <div key={step.id} className="flex items-center text-sm">
                            <div className="flex items-center justify-center w-6 h-6 bg-electric-blue text-white rounded-full text-xs font-bold mr-3">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{step.title}</div>
                              <div className="text-gray-600 dark:text-gray-400 text-xs">{step.owner} • {step.estimatedTime}</div>
                            </div>
                          </div>
                        ))}
                        {sop.steps.length > 3 && (
                          <div className="text-sm text-electric-blue ml-9">
                            +{sop.steps.length - 3} pasos más...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button className="text-sm text-electric-blue hover:underline">
                      📖 Ver proceso completo
                    </button>
                    <button className="text-sm text-electric-purple hover:underline">
                      ▶️ Ejecutar proceso
                    </button>
                    <button className="text-sm text-electric-green hover:underline">
                      📝 Sugerir mejora
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Actualizado: {formatDate(sop.lastUpdated)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 Estado de Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.filter(p => p.status === 'active').map((policy) => (
                  <div key={policy.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{policy.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        policy.compliance >= 95 ? 'bg-electric-green/20 text-electric-green' :
                        policy.compliance >= 85 ? 'bg-electric-yellow/20 text-electric-yellow' :
                        'bg-electric-red/20 text-electric-red'
                      }`}>
                        {policy.compliance}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full ${
                          policy.compliance >= 95 ? 'bg-electric-green' :
                          policy.compliance >= 85 ? 'bg-electric-yellow' :
                          'bg-electric-red'
                        }`}
                        style={{ width: `${policy.compliance}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {policy.acknowledgments} / {policy.totalEmployees} empleados han reconocido
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚠️ Acciones Requeridas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border border-electric-red/30 rounded-lg bg-electric-red/5">
                  <h4 className="font-medium text-electric-red mb-1">Reconocimientos Pendientes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    5 empleados no han reconocido la "Política de Seguridad"
                  </p>
                  <button className="text-sm text-electric-red hover:underline mt-1">
                    Enviar recordatorio →
                  </button>
                </div>

                <div className="p-3 border border-electric-yellow/30 rounded-lg bg-electric-yellow/5">
                  <h4 className="font-medium text-electric-yellow mb-1">Revisión Programada</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "Política de Gastos" requiere revisión trimestral
                  </p>
                  <button className="text-sm text-electric-yellow hover:underline mt-1">
                    Programar revisión →
                  </button>
                </div>

                <div className="p-3 border border-electric-blue/30 rounded-lg bg-electric-blue/5">
                  <h4 className="font-medium text-electric-blue mb-1">Nueva Política</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "Política de Desarrollo" está en borrador
                  </p>
                  <button className="text-sm text-electric-blue hover:underline mt-1">
                    Revisar y publicar →
                  </button>
                </div>

                <div className="p-3 border border-electric-green/30 rounded-lg bg-electric-green/5">
                  <h4 className="font-medium text-electric-green mb-1">Training Completado</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Todos los empleados completaron capacitación en SOPs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📈 Métricas de Adopción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Políticas leídas completamente</span>
                  <span className="font-semibold text-electric-green">87%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">SOPs ejecutados correctamente</span>
                  <span className="font-semibold text-electric-blue">94%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Tiempo promedio de acknowledgment</span>
                  <span className="font-semibold text-gray-900 dark:text-white">2.3 días</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Feedback positivo</span>
                  <span className="font-semibold text-electric-purple">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔍 Insights y Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                  <h4 className="font-medium text-electric-blue mb-2">💡 Optimización</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Las políticas de Recursos Humanos tienen mayor engagement que las técnicas
                  </p>
                  <p className="text-xs text-electric-blue">
                    Recomendación: Simplificar lenguaje en políticas técnicas
                  </p>
                </div>

                <div className="p-3 bg-electric-green/10 border border-electric-green/30 rounded-lg">
                  <h4 className="font-medium text-electric-green mb-2">📊 Tendencia</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Compliance general ha mejorado 12% en últimos 3 meses
                  </p>
                  <p className="text-xs text-electric-green">
                    Continuar con estrategia actual
                  </p>
                </div>

                <div className="p-3 bg-electric-yellow/10 border border-electric-yellow/30 rounded-lg">
                  <h4 className="font-medium text-electric-yellow mb-2">⚠️ Atención</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    SOPs de alta complejidad tienen menor tasa de éxito
                  </p>
                  <p className="text-xs text-electric-yellow">
                    Considerar dividir en pasos más simples
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PoliciesSOPs;