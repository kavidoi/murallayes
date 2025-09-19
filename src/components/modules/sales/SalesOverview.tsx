import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
interface SalesOverviewProps {
  className?: string;
}

const SalesOverview: React.FC<SalesOverviewProps> = ({ className = '' }) => {

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestión integral de ventas POS y del sistema interno
          </p>
        </div>
      </div>

      {/* Sales Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* POS Sales Card */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-4xl">🏪</div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  POS Sales
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transacciones y ventas del sistema POS
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                  Esta Semana
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  Real-time
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Sincronización
                </p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  Automática
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Características:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Transacciones en tiempo real
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Integración con Tuu API
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Reportes y analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Gestión de sincronización
                </li>
              </ul>
            </div>

            <Link
              to="/sales/pos"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Acceder a POS Sales →
            </Link>
          </CardContent>
        </Card>

        {/* System Sales Card */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-4xl">🖥️</div>
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  System Sales
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ventas del sistema interno Muralla
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Estado
                </p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  En Desarrollo
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Integración
                </p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  Planificada
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Funcionalidades planificadas:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⏳</span>
                  Ventas directas del sistema
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⏳</span>
                  Gestión de productos internos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⏳</span>
                  Facturación integrada
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">⏳</span>
                  Reportes unificados
                </li>
              </ul>
            </div>

            <Link
              to="/sales/system"
              className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Ver System Sales →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas Combinadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Próximamente
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  POS + Sistema
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Canales Activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  1
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  POS operativo
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Integración</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  50%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  POS completado
                </p>
              </div>
              <div className="text-3xl">⚙️</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesOverview;
