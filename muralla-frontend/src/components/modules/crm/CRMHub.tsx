import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, Plus, TrendingUp, Heart, MessageCircle, Calendar, Phone, Mail, Star, Eye, Edit3, MoreVertical, DollarSign, Target, Award, Activity } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar: string;
  company?: {
    id: string;
    name: string;
    industry: string;
  };
  position?: string;
  type: 'lead' | 'customer' | 'partner' | 'vendor' | 'employee';
  status: 'active' | 'inactive' | 'prospect' | 'churned';
  stage: 'awareness' | 'interest' | 'consideration' | 'intent' | 'evaluation' | 'purchase' | 'retention' | 'advocacy';
  source: 'website' | 'referral' | 'social' | 'email' | 'event' | 'cold-outreach' | 'advertising';
  tags: string[];
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  preferences: {
    communicationChannel: 'email' | 'phone' | 'text' | 'chat';
    language: string;
    timezone: string;
    interests: string[];
  };
  demographics: {
    age?: number;
    gender?: string;
    location: string;
    country: string;
  };
  metrics: {
    engagementScore: number; // 0-100
    lifetimeValue: number;
    totalSpent: number;
    avgOrderValue: number;
    purchaseFrequency: number;
    lastInteraction: string;
    totalInteractions: number;
    conversionProbability: number; // 0-100
  };
  interactions: Array<{
    id: string;
    type: 'email' | 'call' | 'meeting' | 'chat' | 'purchase' | 'support' | 'event';
    direction: 'inbound' | 'outbound';
    subject: string;
    content: string;
    outcome: 'positive' | 'negative' | 'neutral';
    date: string;
    duration?: number; // minutes
    channel: string;
    assignedTo: {
      id: string;
      name: string;
      avatar: string;
    };
    sentiment: 'positive' | 'negative' | 'neutral';
    followUpRequired: boolean;
    followUpDate?: string;
  }>;
  assignments: {
    accountManager?: {
      id: string;
      name: string;
      avatar: string;
    };
    salesRep?: {
      id: string;
      name: string;
      avatar: string;
    };
    supportAgent?: {
      id: string;
      name: string;
      avatar: string;
    };
  };
  notes: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar: string;
    };
    date: string;
    private: boolean;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed' | 'overdue';
    assignedTo: {
      id: string;
      name: string;
    };
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    probability: number;
    closeDate: string;
    currency: string;
  }>;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const CRMHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'pipeline'>('cards');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'engagement' | 'value' | 'updated'>('name');

  // Mock data
  const contacts: Contact[] = [
    {
      id: '1',
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana.martinez@techcorp.cl',
      phone: '+56 9 1234 5678',
      avatar: '/api/placeholder/64/64',
      company: {
        id: 'comp1',
        name: 'TechCorp Chile',
        industry: 'Technology'
      },
      position: 'CTO',
      type: 'customer',
      status: 'active',
      stage: 'advocacy',
      source: 'referral',
      tags: ['enterprise', 'technical', 'champion'],
      socialMedia: {
        linkedin: 'https://linkedin.com/in/ana-martinez-tech',
        twitter: '@ana_martinez_cl'
      },
      preferences: {
        communicationChannel: 'email',
        language: 'Spanish',
        timezone: 'America/Santiago',
        interests: ['AI', 'Cloud Computing', 'DevOps']
      },
      demographics: {
        age: 42,
        gender: 'Female',
        location: 'Santiago, Chile',
        country: 'Chile'
      },
      metrics: {
        engagementScore: 92,
        lifetimeValue: 450000,
        totalSpent: 380000,
        avgOrderValue: 95000,
        purchaseFrequency: 4,
        lastInteraction: '2024-01-20T14:30:00Z',
        totalInteractions: 47,
        conversionProbability: 88
      },
      interactions: [
        {
          id: 'int1',
          type: 'meeting',
          direction: 'inbound',
          subject: 'Quarterly Business Review',
          content: 'Discussed expansion plans and new requirements for Q2',
          outcome: 'positive',
          date: '2024-01-20T14:30:00Z',
          duration: 60,
          channel: 'Video Call',
          assignedTo: {
            id: 'user1',
            name: 'Carlos López',
            avatar: '/api/placeholder/32/32'
          },
          sentiment: 'positive',
          followUpRequired: true,
          followUpDate: '2024-01-27T10:00:00Z'
        },
        {
          id: 'int2',
          type: 'email',
          direction: 'outbound',
          subject: 'New Feature Announcement',
          content: 'Introduced new AI-powered analytics module',
          outcome: 'positive',
          date: '2024-01-18T09:15:00Z',
          channel: 'Email',
          assignedTo: {
            id: 'user2',
            name: 'María Silva',
            avatar: '/api/placeholder/32/32'
          },
          sentiment: 'positive',
          followUpRequired: false
        }
      ],
      assignments: {
        accountManager: {
          id: 'user1',
          name: 'Carlos López',
          avatar: '/api/placeholder/32/32'
        },
        salesRep: {
          id: 'user2',
          name: 'María Silva',
          avatar: '/api/placeholder/32/32'
        }
      },
      notes: [
        {
          id: 'note1',
          content: 'Key decision maker for technology initiatives. Very responsive and collaborative.',
          author: {
            id: 'user1',
            name: 'Carlos López',
            avatar: '/api/placeholder/32/32'
          },
          date: '2024-01-15T10:30:00Z',
          private: false
        }
      ],
      tasks: [
        {
          id: 'task1',
          title: 'Send Q2 roadmap presentation',
          description: 'Prepare and send detailed roadmap for upcoming features',
          dueDate: '2024-01-27T17:00:00Z',
          priority: 'high',
          status: 'pending',
          assignedTo: {
            id: 'user1',
            name: 'Carlos López'
          }
        }
      ],
      deals: [
        {
          id: 'deal1',
          title: 'Enterprise License Expansion',
          value: 120000,
          stage: 'Negotiation',
          probability: 80,
          closeDate: '2024-02-15T00:00:00Z',
          currency: 'CLP'
        }
      ],
      customFields: {
        industry_focus: 'FinTech',
        company_size: '500-1000 employees',
        decision_influence: 'High'
      },
      createdAt: '2023-06-15T09:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      firstName: 'Roberto',
      lastName: 'Gómez',
      email: 'r.gomez@startup.com',
      phone: '+56 9 8765 4321',
      avatar: '/api/placeholder/64/64',
      company: {
        id: 'comp2',
        name: 'InnoStartup',
        industry: 'E-commerce'
      },
      position: 'Founder & CEO',
      type: 'lead',
      status: 'prospect',
      stage: 'evaluation',
      source: 'website',
      tags: ['startup', 'founder', 'high-potential'],
      socialMedia: {
        linkedin: 'https://linkedin.com/in/roberto-gomez-startup',
        twitter: '@rgomez_startup'
      },
      preferences: {
        communicationChannel: 'email',
        language: 'Spanish',
        timezone: 'America/Santiago',
        interests: ['E-commerce', 'Growth Hacking', 'Analytics']
      },
      demographics: {
        age: 32,
        gender: 'Male',
        location: 'Valparaíso, Chile',
        country: 'Chile'
      },
      metrics: {
        engagementScore: 76,
        lifetimeValue: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        purchaseFrequency: 0,
        lastInteraction: '2024-01-19T16:45:00Z',
        totalInteractions: 12,
        conversionProbability: 65
      },
      interactions: [
        {
          id: 'int3',
          type: 'chat',
          direction: 'inbound',
          subject: 'Product Demo Request',
          content: 'Interested in scheduling a demo for their e-commerce analytics needs',
          outcome: 'positive',
          date: '2024-01-19T16:45:00Z',
          duration: 15,
          channel: 'Website Chat',
          assignedTo: {
            id: 'user3',
            name: 'Diego Ruiz',
            avatar: '/api/placeholder/32/32'
          },
          sentiment: 'positive',
          followUpRequired: true,
          followUpDate: '2024-01-22T14:00:00Z'
        }
      ],
      assignments: {
        salesRep: {
          id: 'user3',
          name: 'Diego Ruiz',
          avatar: '/api/placeholder/32/32'
        }
      },
      notes: [
        {
          id: 'note2',
          content: 'Very enthusiastic about analytics. Company is scaling quickly and needs better data insights.',
          author: {
            id: 'user3',
            name: 'Diego Ruiz',
            avatar: '/api/placeholder/32/32'
          },
          date: '2024-01-19T17:00:00Z',
          private: false
        }
      ],
      tasks: [
        {
          id: 'task2',
          title: 'Schedule product demo',
          description: 'Set up comprehensive demo focusing on e-commerce analytics',
          dueDate: '2024-01-22T14:00:00Z',
          priority: 'high',
          status: 'pending',
          assignedTo: {
            id: 'user3',
            name: 'Diego Ruiz'
          }
        }
      ],
      deals: [
        {
          id: 'deal2',
          title: 'Startup Analytics Package',
          value: 25000,
          stage: 'Demo',
          probability: 40,
          closeDate: '2024-02-28T00:00:00Z',
          currency: 'CLP'
        }
      ],
      customFields: {
        industry_focus: 'E-commerce',
        company_size: '10-50 employees',
        growth_stage: 'Series A'
      },
      createdAt: '2024-01-10T11:30:00Z',
      updatedAt: '2024-01-19T16:45:00Z'
    },
    {
      id: '3',
      firstName: 'Carmen',
      lastName: 'Torres',
      email: 'carmen.torres@agency.cl',
      phone: '+56 9 5555 7777',
      avatar: '/api/placeholder/64/64',
      company: {
        id: 'comp3',
        name: 'Digital Marketing Agency',
        industry: 'Marketing'
      },
      position: 'Creative Director',
      type: 'partner',
      status: 'active',
      stage: 'retention',
      source: 'event',
      tags: ['partner', 'creative', 'collaborative'],
      socialMedia: {
        linkedin: 'https://linkedin.com/in/carmen-torres-creative',
        instagram: '@carmen_creative'
      },
      preferences: {
        communicationChannel: 'phone',
        language: 'Spanish',
        timezone: 'America/Santiago',
        interests: ['Design', 'Marketing', 'Innovation']
      },
      demographics: {
        age: 38,
        location: 'Santiago, Chile',
        country: 'Chile'
      },
      metrics: {
        engagementScore: 84,
        lifetimeValue: 85000,
        totalSpent: 62000,
        avgOrderValue: 15500,
        purchaseFrequency: 4,
        lastInteraction: '2024-01-21T11:20:00Z',
        totalInteractions: 28,
        conversionProbability: 75
      },
      interactions: [
        {
          id: 'int4',
          type: 'call',
          direction: 'outbound',
          subject: 'Partnership Opportunity Discussion',
          content: 'Discussed co-marketing opportunities for upcoming campaign',
          outcome: 'positive',
          date: '2024-01-21T11:20:00Z',
          duration: 45,
          channel: 'Phone',
          assignedTo: {
            id: 'user4',
            name: 'Sofía Chen',
            avatar: '/api/placeholder/32/32'
          },
          sentiment: 'positive',
          followUpRequired: true,
          followUpDate: '2024-01-28T15:00:00Z'
        }
      ],
      assignments: {
        accountManager: {
          id: 'user4',
          name: 'Sofía Chen',
          avatar: '/api/placeholder/32/32'
        }
      },
      notes: [
        {
          id: 'note3',
          content: 'Excellent partner for creative campaigns. Always delivers high-quality work on time.',
          author: {
            id: 'user4',
            name: 'Sofía Chen',
            avatar: '/api/placeholder/32/32'
          },
          date: '2024-01-21T12:00:00Z',
          private: false
        }
      ],
      tasks: [
        {
          id: 'task3',
          title: 'Draft partnership agreement',
          description: 'Prepare formal partnership terms for co-marketing initiatives',
          dueDate: '2024-01-30T17:00:00Z',
          priority: 'medium',
          status: 'pending',
          assignedTo: {
            id: 'user4',
            name: 'Sofía Chen'
          }
        }
      ],
      deals: [],
      customFields: {
        partnership_type: 'Co-marketing',
        collaboration_level: 'Strategic'
      },
      createdAt: '2023-09-22T14:15:00Z',
      updatedAt: '2024-01-21T11:20:00Z'
    },
    {
      id: '4',
      firstName: 'Miguel',
      lastName: 'Herrera',
      email: 'miguel.herrera@corp.com',
      phone: '+56 9 3333 9999',
      avatar: '/api/placeholder/64/64',
      company: {
        id: 'comp4',
        name: 'Global Corp',
        industry: 'Manufacturing'
      },
      position: 'IT Director',
      type: 'lead',
      status: 'prospect',
      stage: 'consideration',
      source: 'cold-outreach',
      tags: ['enterprise', 'it-decision-maker', 'budget-holder'],
      preferences: {
        communicationChannel: 'email',
        language: 'Spanish',
        timezone: 'America/Santiago',
        interests: ['IT Infrastructure', 'Digital Transformation', 'Security']
      },
      demographics: {
        age: 45,
        location: 'Santiago, Chile',
        country: 'Chile'
      },
      metrics: {
        engagementScore: 58,
        lifetimeValue: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        purchaseFrequency: 0,
        lastInteraction: '2024-01-17T10:15:00Z',
        totalInteractions: 6,
        conversionProbability: 35
      },
      interactions: [
        {
          id: 'int5',
          type: 'email',
          direction: 'inbound',
          subject: 'Re: Digital Transformation Solutions',
          content: 'Interested in learning more about integration capabilities',
          outcome: 'neutral',
          date: '2024-01-17T10:15:00Z',
          channel: 'Email',
          assignedTo: {
            id: 'user5',
            name: 'Roberto Kim',
            avatar: '/api/placeholder/32/32'
          },
          sentiment: 'neutral',
          followUpRequired: true,
          followUpDate: '2024-01-24T09:00:00Z'
        }
      ],
      assignments: {
        salesRep: {
          id: 'user5',
          name: 'Roberto Kim',
          avatar: '/api/placeholder/32/32'
        }
      },
      notes: [
        {
          id: 'note4',
          content: 'Cautious decision maker. Needs detailed technical information and references.',
          author: {
            id: 'user5',
            name: 'Roberto Kim',
            avatar: '/api/placeholder/32/32'
          },
          date: '2024-01-17T11:00:00Z',
          private: false
        }
      ],
      tasks: [
        {
          id: 'task4',
          title: 'Send technical documentation',
          description: 'Provide detailed integration specs and case studies',
          dueDate: '2024-01-24T12:00:00Z',
          priority: 'medium',
          status: 'pending',
          assignedTo: {
            id: 'user5',
            name: 'Roberto Kim'
          }
        }
      ],
      deals: [
        {
          id: 'deal3',
          title: 'Enterprise Integration Solution',
          value: 180000,
          stage: 'Qualification',
          probability: 25,
          closeDate: '2024-03-31T00:00:00Z',
          currency: 'CLP'
        }
      ],
      customFields: {
        industry_focus: 'Manufacturing',
        company_size: '1000+ employees',
        decision_timeline: '3-6 months'
      },
      createdAt: '2024-01-08T15:45:00Z',
      updatedAt: '2024-01-17T10:15:00Z'
    }
  ];

  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = 
        contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'all' || contact.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
      const matchesStage = selectedStage === 'all' || contact.stage === selectedStage;

      return matchesSearch && matchesType && matchesStatus && matchesStage;
    });

    // Sort contacts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'engagement':
          return b.metrics.engagementScore - a.metrics.engagementScore;
        case 'value':
          return b.metrics.lifetimeValue - a.metrics.lifetimeValue;
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [contacts, searchTerm, selectedType, selectedStatus, selectedStage, sortBy]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer': return 'bg-electric-green/20 text-electric-green';
      case 'lead': return 'bg-electric-blue/20 text-electric-blue';
      case 'partner': return 'bg-electric-purple/20 text-electric-purple';
      case 'vendor': return 'bg-electric-orange/20 text-electric-orange';
      case 'employee': return 'bg-electric-yellow/20 text-electric-yellow';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-electric-green/20 text-electric-green border-electric-green/30';
      case 'prospect': return 'bg-electric-blue/20 text-electric-blue border-electric-blue/30';
      case 'inactive': return 'bg-gray-300/20 text-gray-500 border-gray-300/30';
      case 'churned': return 'bg-electric-red/20 text-electric-red border-electric-red/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'awareness': 'bg-gray-200 text-gray-700',
      'interest': 'bg-electric-blue/20 text-electric-blue',
      'consideration': 'bg-electric-yellow/20 text-electric-yellow',
      'intent': 'bg-electric-orange/20 text-electric-orange',
      'evaluation': 'bg-electric-purple/20 text-electric-purple',
      'purchase': 'bg-electric-green/20 text-electric-green',
      'retention': 'bg-electric-cyan/20 text-electric-cyan',
      'advocacy': 'bg-electric-pink/20 text-electric-pink'
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-600';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = useMemo(() => {
    const totalContacts = filteredContacts.length;
    const activeCustomers = filteredContacts.filter(c => c.type === 'customer' && c.status === 'active').length;
    const totalValue = filteredContacts.reduce((sum, c) => sum + c.metrics.lifetimeValue, 0);
    const avgEngagement = Math.round(
      filteredContacts.reduce((sum, c) => sum + c.metrics.engagementScore, 0) / Math.max(filteredContacts.length, 1)
    );

    return {
      totalContacts,
      activeCustomers,
      totalValue,
      avgEngagement
    };
  }, [filteredContacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            CRM & Gestión de Relaciones
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Inteligencia de relaciones y gestión de comunidad integrada
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          <button className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Contacto
          </button>

          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {(['cards', 'table', 'pipeline'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-electric-blue text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode === 'cards' && 'Tarjetas'}
                {mode === 'table' && 'Tabla'}
                {mode === 'pipeline' && 'Pipeline'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Contactos Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalContacts}</p>
            </div>
            <Users className="w-8 h-8 text-electric-blue" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.activeCustomers} clientes activos
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Total LTV</p>
              <p className="text-2xl font-bold text-electric-green">
                {formatCurrency(stats.totalValue, 'CLP')}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-electric-green" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Lifetime value acumulado
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Engagement Promedio</p>
              <p className="text-2xl font-bold text-electric-purple">{stats.avgEngagement}%</p>
            </div>
            <Heart className="w-8 h-8 text-electric-purple" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Puntuación de compromiso
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tareas Pendientes</p>
              <p className="text-2xl font-bold text-electric-orange">
                {filteredContacts.reduce((sum, c) => sum + c.tasks.filter(t => t.status === 'pending').length, 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-electric-orange" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Follow-ups requeridos
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="name">Nombre</option>
                <option value="engagement">Engagement</option>
                <option value="value">Valor LTV</option>
                <option value="updated">Actualización</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300">
              {filteredContacts.length} contactos
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Tipos</option>
              <option value="customer">Cliente</option>
              <option value="lead">Lead</option>
              <option value="partner">Partner</option>
              <option value="vendor">Proveedor</option>
              <option value="employee">Empleado</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activo</option>
              <option value="prospect">Prospecto</option>
              <option value="inactive">Inactivo</option>
              <option value="churned">Perdido</option>
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">Todas las Etapas</option>
              <option value="awareness">Awareness</option>
              <option value="interest">Interest</option>
              <option value="consideration">Consideration</option>
              <option value="intent">Intent</option>
              <option value="evaluation">Evaluation</option>
              <option value="purchase">Purchase</option>
              <option value="retention">Retention</option>
              <option value="advocacy">Advocacy</option>
            </select>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setSelectedStage('all');
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-sm text-electric-blue hover:text-electric-blue/80"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {viewMode === 'cards' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={contact.avatar}
                        alt={`${contact.firstName} ${contact.lastName}`}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {contact.position}
                        </p>
                        {contact.company && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {contact.company.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(contact.type)}`}>
                        {contact.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getStageColor(contact.stage)}`}>
                        {contact.stage}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Engagement:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-electric-blue h-2 rounded-full transition-all"
                              style={{ width: `${contact.metrics.engagementScore}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{contact.metrics.engagementScore}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">LTV:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(contact.metrics.lifetimeValue, 'CLP')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Interacciones:</span>
                        <p className="font-medium">{contact.metrics.totalInteractions}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Conversión:</span>
                        <p className="font-medium">{contact.metrics.conversionProbability}%</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Última interacción: {formatDate(contact.metrics.lastInteraction)}
                      </span>
                      <div className="flex items-center gap-1">
                        {contact.email && <Mail className="w-3 h-3 text-gray-400" />}
                        {contact.phone && <Phone className="w-3 h-3 text-gray-400" />}
                        {contact.socialMedia.linkedin && <span className="text-xs">🔗</span>}
                      </div>
                    </div>

                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {contact.tasks.filter(t => t.status === 'pending').length > 0 && (
                      <div className="bg-electric-orange/10 text-electric-orange p-2 rounded text-xs">
                        📋 {contact.tasks.filter(t => t.status === 'pending').length} tarea(s) pendiente(s)
                      </div>
                    )}

                    {contact.deals.length > 0 && (
                      <div className="bg-electric-green/10 text-electric-green p-2 rounded text-xs">
                        💰 {contact.deals.length} deal(s) activos
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Etapa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    LTV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={contact.avatar}
                          alt={`${contact.firstName} ${contact.lastName}`}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {contact.email}
                          </div>
                          {contact.company && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.company.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(contact.type)}`}>
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${getStageColor(contact.stage)}`}>
                        {contact.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-electric-blue h-2 rounded-full transition-all"
                            style={{ width: `${contact.metrics.engagementScore}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{contact.metrics.engagementScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(contact.metrics.lifetimeValue, 'CLP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedContact(contact)}
                          className="text-electric-blue hover:text-electric-blue/80"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-blue">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-electric-blue">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'pipeline' && (
          <div className="p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Vista de pipeline en desarrollo</p>
              <p className="text-sm mt-2">Próximamente: visualización de embudo y flujo de conversión</p>
            </div>
          </div>
        )}
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedContact.avatar}
                    alt={`${selectedContact.firstName} ${selectedContact.lastName}`}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedContact.position}
                      {selectedContact.company && ` • ${selectedContact.company.name}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(selectedContact.type)}`}>
                        {selectedContact.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(selectedContact.status)}`}>
                        {selectedContact.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getStageColor(selectedContact.stage)}`}>
                        {selectedContact.stage}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Métricas Clave
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Engagement Score</span>
                            <span className="font-semibold">{selectedContact.metrics.engagementScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-electric-blue h-2 rounded-full transition-all"
                              style={{ width: `${selectedContact.metrics.engagementScore}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Probabilidad Conversión</span>
                            <span className="font-semibold">{selectedContact.metrics.conversionProbability}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-electric-green h-2 rounded-full transition-all"
                              style={{ width: `${selectedContact.metrics.conversionProbability}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">LTV:</span>
                            <p className="font-semibold text-electric-green">
                              {formatCurrency(selectedContact.metrics.lifetimeValue, 'CLP')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Total Gastado:</span>
                            <p className="font-semibold">
                              {formatCurrency(selectedContact.metrics.totalSpent, 'CLP')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Información de Contacto
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{selectedContact.email}</span>
                        </div>
                        {selectedContact.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{selectedContact.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {selectedContact.demographics.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedContact.interactions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Interacciones Recientes
                      </h4>
                      <div className="space-y-3">
                        {selectedContact.interactions.slice(0, 5).map(interaction => (
                          <div key={interaction.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                              interaction.type === 'email' ? 'bg-electric-blue' :
                              interaction.type === 'call' ? 'bg-electric-green' :
                              interaction.type === 'meeting' ? 'bg-electric-purple' :
                              'bg-electric-orange'
                            }`}>
                              {interaction.type === 'email' && <Mail className="w-4 h-4" />}
                              {interaction.type === 'call' && <Phone className="w-4 h-4" />}
                              {interaction.type === 'meeting' && <Calendar className="w-4 h-4" />}
                              {interaction.type === 'chat' && <MessageCircle className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {interaction.subject}
                                </h5>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDateTime(interaction.date)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {interaction.content}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    interaction.outcome === 'positive' ? 'bg-electric-green/20 text-electric-green' :
                                    interaction.outcome === 'negative' ? 'bg-electric-red/20 text-electric-red' :
                                    'bg-gray-200 text-gray-600'
                                  }`}>
                                    {interaction.outcome}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    por {interaction.assignedTo.name}
                                  </span>
                                </div>
                                {interaction.followUpRequired && (
                                  <span className="text-xs text-electric-orange">
                                    📅 Follow-up requerido
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedContact.deals.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Oportunidades Activas
                      </h4>
                      <div className="space-y-3">
                        {selectedContact.deals.map(deal => (
                          <div key={deal.id} className="p-4 bg-electric-green/10 border border-electric-green/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {deal.title}
                              </h5>
                              <span className="font-semibold text-electric-green">
                                {formatCurrency(deal.value, deal.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Etapa: <strong>{deal.stage}</strong></span>
                              <span>Probabilidad: <strong>{deal.probability}%</strong></span>
                              <span>Cierre: <strong>{formatDate(deal.closeDate)}</strong></span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                              <div
                                className="bg-electric-green h-2 rounded-full transition-all"
                                style={{ width: `${deal.probability}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {selectedContact.assignments.accountManager && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Equipo Asignado
                      </h4>
                      <div className="space-y-3">
                        {selectedContact.assignments.accountManager && (
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedContact.assignments.accountManager.avatar}
                              alt={selectedContact.assignments.accountManager.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedContact.assignments.accountManager.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Account Manager</p>
                            </div>
                          </div>
                        )}
                        {selectedContact.assignments.salesRep && (
                          <div className="flex items-center gap-3">
                            <img
                              src={selectedContact.assignments.salesRep.avatar}
                              alt={selectedContact.assignments.salesRep.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {selectedContact.assignments.salesRep.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sales Rep</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContact.tasks.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Tareas Pendientes
                      </h4>
                      <div className="space-y-2">
                        {selectedContact.tasks.filter(t => t.status === 'pending').map(task => (
                          <div key={task.id} className="p-2 bg-white dark:bg-gray-600 rounded border-l-4 border-electric-orange">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Vence: {formatDate(task.dueDate)} • {task.assignedTo.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Preferencias
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Canal preferido:</span>
                        <span className="font-medium capitalize">
                          {selectedContact.preferences.communicationChannel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Idioma:</span>
                        <span className="font-medium">{selectedContact.preferences.language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zona horaria:</span>
                        <span className="font-medium">{selectedContact.preferences.timezone}</span>
                      </div>
                    </div>
                  </div>

                  {selectedContact.preferences.interests.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Intereses
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedContact.preferences.interests.map(interest => (
                          <span
                            key={interest}
                            className="px-2 py-1 text-xs bg-electric-blue/20 text-electric-blue rounded"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedContact.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Etiquetas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedContact.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>Creado: {formatDate(selectedContact.createdAt)}</p>
                    <p>Actualizado: {formatDate(selectedContact.updatedAt)}</p>
                    <p>Fuente: {selectedContact.source}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMHub;