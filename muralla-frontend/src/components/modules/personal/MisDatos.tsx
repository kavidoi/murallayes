import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  city: string;
  birthDate: string;
  startDate: string;
  department: string;
  position: string;
  manager: string;
  employeeId: string;
}

interface Skills {
  technical: Array<{ name: string; level: number; verified: boolean }>;
  soft: Array<{ name: string; level: number; verified: boolean }>;
  languages: Array<{ name: string; level: string; certified: boolean }>;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  verified: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'skill' | 'certification' | 'performance';
  targetDate: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
}

const MisDatos: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@muralla.com',
    phone: '+56 9 1234 5678',
    emergencyContact: 'María Pérez',
    emergencyPhone: '+56 9 8765 4321',
    address: 'Av. Providencia 1234, Apt 56',
    city: 'Santiago, Chile',
    birthDate: '1990-05-15',
    startDate: '2022-03-01',
    department: 'Ventas',
    position: 'Ejecutivo de Cuentas Senior',
    manager: 'Sarah Manager',
    employeeId: 'EMP-2024-0156'
  });

  const [skills, setSkills] = useState<Skills>({
    technical: [
      { name: 'CRM Management', level: 90, verified: true },
      { name: 'Data Analysis', level: 75, verified: true },
      { name: 'Project Management', level: 80, verified: false },
      { name: 'Microsoft Office', level: 95, verified: true },
      { name: 'Salesforce', level: 85, verified: true }
    ],
    soft: [
      { name: 'Comunicación', level: 92, verified: true },
      { name: 'Liderazgo', level: 78, verified: false },
      { name: 'Negociación', level: 88, verified: true },
      { name: 'Resolución de problemas', level: 85, verified: true },
      { name: 'Trabajo en equipo', level: 90, verified: true }
    ],
    languages: [
      { name: 'Español', level: 'Nativo', certified: false },
      { name: 'Inglés', level: 'Avanzado', certified: true },
      { name: 'Portugués', level: 'Intermedio', certified: false }
    ]
  });

  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: '1',
      name: 'Salesforce Certified Administrator',
      issuer: 'Salesforce',
      issueDate: '2023-06-15',
      expiryDate: '2026-06-15',
      credentialId: 'SCA-2023-JPS',
      verified: true
    },
    {
      id: '2',
      name: 'Google Analytics Certified',
      issuer: 'Google',
      issueDate: '2023-09-20',
      expiryDate: '2024-09-20',
      credentialId: 'GA-IQ-JPS-2023',
      verified: true
    },
    {
      id: '3',
      name: 'Project Management Professional (PMP)',
      issuer: 'PMI',
      issueDate: '2022-11-10',
      expiryDate: '2025-11-10',
      credentialId: 'PMP-2022-1156789',
      verified: true
    }
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Obtener certificación en Sales Leadership',
      description: 'Completar el programa de certificación avanzada en liderazgo de ventas',
      category: 'certification',
      targetDate: '2024-06-30',
      progress: 45,
      status: 'active'
    },
    {
      id: '2',
      title: 'Mejorar habilidades de presentación',
      description: 'Tomar curso de presentaciones ejecutivas y practicar con 5 clientes',
      category: 'skill',
      targetDate: '2024-04-15',
      progress: 75,
      status: 'active'
    },
    {
      id: '3',
      title: 'Ascenso a Sales Manager',
      description: 'Desarrollar habilidades de gestión y liderar un equipo pequeño',
      category: 'career',
      targetDate: '2024-12-31',
      progress: 30,
      status: 'active'
    }
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSkillColor = (level: number) => {
    if (level >= 90) return 'bg-electric-green';
    if (level >= 75) return 'bg-electric-blue';
    if (level >= 60) return 'bg-electric-yellow';
    return 'bg-electric-red';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'career': return 'bg-electric-purple/20 text-electric-purple';
      case 'skill': return 'bg-electric-blue/20 text-electric-blue';
      case 'certification': return 'bg-electric-green/20 text-electric-green';
      case 'performance': return 'bg-electric-cyan/20 text-electric-cyan';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-electric-blue/20 text-electric-blue';
      case 'completed': return 'bg-electric-green/20 text-electric-green';
      case 'paused': return 'bg-electric-yellow/20 text-electric-yellow';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const isExpiringCertification = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffMonths = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return diffMonths <= 3; // Expiring in 3 months or less
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👤 Mis Datos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu perfil profesional y desarrollo de carrera
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={isEditing ? "btn-electric-green" : "btn-electric"}
        >
          {isEditing ? '💾 Guardar' : '✏️ Editar'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'personal', label: '👤 Información Personal', icon: '👤' },
          { id: 'skills', label: '🎯 Habilidades', icon: '🎯' },
          { id: 'certifications', label: '📜 Certificaciones', icon: '📜' },
          { id: 'goals', label: '🚀 Objetivos', icon: '🚀' }
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

      {/* Personal Information Tab */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contacto de Emergencia
                    </label>
                    <input
                      type="text"
                      value={personalInfo.emergencyContact}
                      onChange={(e) => setPersonalInfo({...personalInfo, emergencyContact: e.target.value})}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono de Emergencia
                    </label>
                    <input
                      type="tel"
                      value={personalInfo.emergencyPhone}
                      onChange={(e) => setPersonalInfo({...personalInfo, emergencyPhone: e.target.value})}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información Laboral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID de Empleado
                  </label>
                  <input
                    type="text"
                    value={personalInfo.employeeId}
                    disabled
                    className="input bg-gray-100 dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Posición
                  </label>
                  <input
                    type="text"
                    value={personalInfo.position}
                    disabled
                    className="input bg-gray-100 dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={personalInfo.department}
                    disabled
                    className="input bg-gray-100 dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manager
                  </label>
                  <input
                    type="text"
                    value={personalInfo.manager}
                    disabled
                    className="input bg-gray-100 dark:bg-gray-700"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={personalInfo.birthDate}
                      onChange={(e) => setPersonalInfo({...personalInfo, birthDate: e.target.value})}
                      disabled={!isEditing}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={personalInfo.startDate}
                      disabled
                      className="input bg-gray-100 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Technical Skills */}
          <Card>
            <CardHeader>
              <CardTitle>💻 Habilidades Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.technical.map((skill, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">{skill.level}%</span>
                        {skill.verified && <span className="text-electric-green">✓</span>}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full ${getSkillColor(skill.level)}`}
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Soft Skills */}
          <Card>
            <CardHeader>
              <CardTitle>🤝 Habilidades Blandas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.soft.map((skill, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{skill.name}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">{skill.level}%</span>
                        {skill.verified && <span className="text-electric-green">✓</span>}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full ${getSkillColor(skill.level)}`}
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>🌍 Idiomas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {skills.languages.map((language, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">{language.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{language.level}</div>
                    {language.certified && (
                      <span className="px-2 py-1 text-xs rounded-full bg-electric-green/20 text-electric-green">
                        Certificado
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <Card>
          <CardHeader>
            <CardTitle>📜 Certificaciones Profesionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h4>
                        {cert.verified && <span className="ml-2 text-electric-green">✓</span>}
                        {isExpiringCertification(cert.expiryDate) && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-electric-red/20 text-electric-red">
                            Por expirar
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Emitido: {formatDate(cert.issueDate)}
                        {cert.expiryDate && ` • Expira: ${formatDate(cert.expiryDate)}`}
                      </div>
                      {cert.credentialId && (
                        <div className="text-xs text-gray-500">
                          ID de Credencial: {cert.credentialId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <Card>
          <CardHeader>
            <CardTitle>🚀 Objetivos de Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h4>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getCategoryColor(goal.category)}`}>
                          {goal.category === 'career' ? 'Carrera' :
                           goal.category === 'skill' ? 'Habilidad' :
                           goal.category === 'certification' ? 'Certificación' : 'Rendimiento'}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(goal.status)}`}>
                          {goal.status === 'active' ? 'Activo' :
                           goal.status === 'completed' ? 'Completado' : 'Pausado'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
                      <div className="text-xs text-gray-500">
                        Meta: {formatDate(goal.targetDate)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                      <span className="text-electric-blue font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className="bg-electric-blue h-2 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MisDatos;