import React from 'react';
import { StatCard } from '../../ui/StatCard';

const MiDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Espacio Personal</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tu centro de comando personal - gestiona tu vida laboral de manera inteligente
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Horas Esta Semana"
          value="38.5h"
          subtitle="2.5h más que la semana pasada"
          color="electric-blue"
        />
        <StatCard
          title="Días PTO Disponibles"
          value="12"
          subtitle="Expiran en 6 meses"
          color="electric-green"
        />
        <StatCard
          title="Tareas Pendientes"
          value="7"
          subtitle="3 vencen hoy"
          color="electric-purple"
        />
        <StatCard
          title="Comisiones Este Mes"
          value="$2,450"
          subtitle="15% más que el mes pasado"
          color="electric-cyan"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vacations Quick View */}
        <div className="card bg-gradient-to-br from-electric-green/20 to-electric-green/10 dark:from-electric-green/20 dark:to-electric-green/10 border-electric-green/30 dark:border-electric-green/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🏖️ Mis Vacaciones</h3>
            <a href="/me/pto" className="text-sm text-electric-green hover:underline">Ver todo</a>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Saldo actual</span>
              <span className="font-semibold text-electric-green">12 días</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Próximas vacaciones</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">15 Mar - 22 Mar</span>
            </div>
            <button className="w-full btn-electric-green text-sm">Solicitar PTO</button>
          </div>
        </div>

        {/* Finances Quick View */}
        <div className="card bg-gradient-to-br from-electric-cyan/20 to-electric-blue/10 dark:from-electric-cyan/20 dark:to-electric-blue/10 border-electric-cyan/30 dark:border-electric-blue/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">💰 Mis Finanzas</h3>
            <a href="/me/finances" className="text-sm text-electric-cyan hover:underline">Ver todo</a>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Salario este mes</span>
              <span className="font-semibold text-electric-cyan">$4,200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Comisiones</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">$2,450</span>
            </div>
            <button className="w-full btn-electric text-sm">Ver detalles</button>
          </div>
        </div>

        {/* Calendar Quick View */}
        <div className="card bg-gradient-to-br from-electric-purple/20 to-electric-pink/10 dark:from-electric-purple/20 dark:to-electric-pink/10 border-electric-purple/30 dark:border-electric-pink/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📅 Mi Calendario</h3>
            <a href="/me/calendar" className="text-sm text-electric-purple hover:underline">Ver todo</a>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Hoy, 2:00 PM</span>
                <span className="text-electric-purple font-medium">Reunión 1:1</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Mañana, 10:00 AM</span>
                <span className="text-electric-purple font-medium">Demo cliente</span>
              </div>
            </div>
            <button className="w-full btn-electric-purple text-sm">Agendar cita</button>
          </div>
        </div>
      </div>

      {/* Today's Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Tasks */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">🎯 Mi Enfoque Hoy</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input type="checkbox" className="mr-3 text-electric-blue rounded" />
              <span className="text-gray-800 dark:text-gray-200">Completar reporte de ventas Q1</span>
              <span className="ml-auto text-xs text-red-600 dark:text-red-400">Vence hoy</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-3 text-electric-blue rounded" />
              <span className="text-gray-800 dark:text-gray-200">Revisar propuesta cliente ABC</span>
              <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400">Mañana</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-3 text-electric-blue rounded" defaultChecked />
              <span className="text-gray-500 dark:text-gray-400 line-through">Llamar a proveedor XYZ</span>
              <span className="ml-auto text-xs text-green-600 dark:text-green-400">Completado</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <a href="/projects/tasks" className="text-sm text-electric-cyan hover:underline">Ver todas mis tareas →</a>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">📊 Mi Rendimiento</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Objetivos del mes</span>
                <span className="text-electric-green font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-electric-green h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Productividad</span>
                <span className="text-electric-blue font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-electric-blue h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Satisfacción cliente</span>
                <span className="text-electric-purple font-medium">96%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className="bg-electric-purple h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiDashboard;