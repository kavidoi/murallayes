import React, { useState, useEffect } from 'react';

interface TimeClockWidgetProps {
  className?: string;
}

interface WorkSession {
  id: string;
  startTime: string;
  type: 'in-person' | 'remote';
  isActive: boolean;
  elapsedTime: number; // in minutes
}

const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({ className = '' }) => {
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Timer logic for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession?.isActive) {
      interval = setInterval(() => {
        setCurrentSession(prev => prev ? {
          ...prev,
          elapsedTime: prev.elapsedTime + 1
        } : null);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [currentSession?.isActive]);

  const formatElapsedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatCurrentTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const startShift = (type: 'in-person' | 'remote') => {
    const now = new Date();
    const session: WorkSession = {
      id: Date.now().toString(),
      startTime: now.toTimeString().slice(0, 5),
      type,
      isActive: true,
      elapsedTime: 0
    };
    setCurrentSession(session);
  };

  const endShift = () => {
    if (!currentSession) return;
    
    // Here you would typically save the session data to the backend
    console.log('Ending shift:', currentSession);
    setCurrentSession(null);
  };

  const takeBreak = () => {
    if (!currentSession) return;
    
    // Pause the current session
    setCurrentSession(prev => prev ? {
      ...prev,
      isActive: false
    } : null);
  };

  const resumeFromBreak = () => {
    if (!currentSession) return;
    
    // Resume the session
    setCurrentSession(prev => prev ? {
      ...prev,
      isActive: true
    } : null);
  };

  return (
    <div className={`card bg-gradient-to-br from-electric-cyan/20 to-electric-blue/10 dark:from-electric-blue/20 dark:to-electric-cyan/10 border-electric-cyan/30 dark:border-electric-blue/30 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Reloj de Trabajo</h2>
        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {formatCurrentTime(currentTime)}
        </div>
      </div>

      {currentSession ? (
        <div className="space-y-4">
          {/* Active Session Display */}
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentSession.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                currentSession.isActive ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {currentSession.isActive ? 'En Turno' : 'En Descanso'}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-electric-blue dark:text-electric-cyan">
                {formatElapsedTime(currentSession.elapsedTime)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Desde {currentSession.startTime} • {currentSession.type === 'remote' ? 'Remoto' : 'Presencial'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {currentSession.isActive ? (
              <>
                <button
                  onClick={takeBreak}
                  className="w-full px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/50 transition-colors"
                >
                  ⏸️ Tomar Descanso
                </button>
                <button
                  onClick={endShift}
                  className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                >
                  ⏹️ Finalizar Turno
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={resumeFromBreak}
                  className="w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
                >
                  ▶️ Continuar Turno
                </button>
                <button
                  onClick={endShift}
                  className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                >
                  ⏹️ Finalizar Turno
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Clock In Options */}
          <div className="text-center text-neutral-600 dark:text-neutral-400 text-sm">
            Inicia tu turno de trabajo
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => startShift('in-person')}
              className="w-full px-4 py-3 text-sm font-medium text-electric-blue bg-electric-blue/20 border border-electric-blue/30 rounded-lg hover:bg-electric-blue/30 dark:bg-electric-blue/20 dark:border-electric-blue/30 dark:text-electric-cyan dark:hover:bg-electric-blue/30 transition-colors flex items-center justify-center"
            >
              <span className="mr-2">🏢</span>
              Iniciar Turno Presencial
            </button>
            <button
              onClick={() => startShift('remote')}
              className="w-full px-4 py-3 text-sm font-medium text-electric-purple bg-electric-purple/20 border border-electric-purple/30 rounded-lg hover:bg-electric-purple/30 dark:bg-electric-purple/20 dark:border-electric-purple/30 dark:text-electric-purple dark:hover:bg-electric-purple/30 transition-colors flex items-center justify-center"
            >
              <span className="mr-2">🏠</span>
              Iniciar Trabajo Remoto
            </button>
          </div>
        </div>
      )}

      {/* Quick Link to Full Interface */}
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <a 
          href="/me/shifts" 
          className="text-sm text-electric-cyan dark:text-electric-blue hover:underline block text-center"
        >
          Ver historial completo →
        </a>
      </div>
    </div>
  );
};

export default TimeClockWidget;