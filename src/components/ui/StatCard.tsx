import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'electric-blue' | 'electric-green' | 'electric-purple' | 'electric-cyan' | 'electric-pink' | 'electric-yellow' | 'electric-red' | 'electric-orange';
}

const colorMap = {
  blue: {
    container: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
    title: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    subtitle: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    container: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
    title: 'text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-300',
    subtitle: 'text-green-600 dark:text-green-400',
  },
  red: {
    container: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800',
    title: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
    subtitle: 'text-red-600 dark:text-red-400',
  },
  purple: {
    container: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
    title: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    subtitle: 'text-purple-600 dark:text-purple-400',
  },
  'electric-blue': {
    container: 'from-electric-blue/20 to-electric-cyan/10 dark:from-electric-blue/20 dark:to-electric-cyan/10 border-electric-blue/30 dark:border-electric-cyan/30',
    title: 'text-electric-blue dark:text-electric-cyan',
    value: 'text-electric-blue dark:text-electric-cyan',
    subtitle: 'text-electric-blue dark:text-electric-cyan',
  },
  'electric-green': {
    container: 'from-electric-green/20 to-electric-green/10 dark:from-electric-green/20 dark:to-electric-green/10 border-electric-green/30 dark:border-electric-green/30',
    title: 'text-electric-green dark:text-electric-green',
    value: 'text-electric-green dark:text-electric-green',
    subtitle: 'text-electric-green dark:text-electric-green',
  },
  'electric-purple': {
    container: 'from-electric-purple/20 to-electric-pink/10 dark:from-electric-purple/20 dark:to-electric-pink/10 border-electric-purple/30 dark:border-electric-pink/30',
    title: 'text-electric-purple dark:text-electric-pink',
    value: 'text-electric-purple dark:text-electric-pink',
    subtitle: 'text-electric-purple dark:text-electric-pink',
  },
  'electric-cyan': {
    container: 'from-electric-cyan/20 to-electric-blue/10 dark:from-electric-cyan/20 dark:to-electric-blue/10 border-electric-cyan/30 dark:border-electric-blue/30',
    title: 'text-electric-cyan dark:text-electric-blue',
    value: 'text-electric-cyan dark:text-electric-blue',
    subtitle: 'text-electric-cyan dark:text-electric-blue',
  },
  'electric-pink': {
    container: 'from-electric-pink/20 to-electric-purple/10 dark:from-electric-pink/20 dark:to-electric-purple/10 border-electric-pink/30 dark:border-electric-purple/30',
    title: 'text-electric-pink dark:text-electric-purple',
    value: 'text-electric-pink dark:text-electric-purple',
    subtitle: 'text-electric-pink dark:text-electric-purple',
  },
  'electric-yellow': {
    container: 'from-electric-yellow/20 to-electric-orange/10 dark:from-electric-yellow/20 dark:to-electric-orange/10 border-electric-yellow/30 dark:border-electric-orange/30',
    title: 'text-electric-yellow dark:text-electric-orange',
    value: 'text-electric-yellow dark:text-electric-orange',
    subtitle: 'text-electric-yellow dark:text-electric-orange',
  },
  'electric-red': {
    container: 'from-electric-red/20 to-red-400/10 dark:from-electric-red/20 dark:to-red-400/10 border-electric-red/30 dark:border-red-400/30',
    title: 'text-electric-red dark:text-red-400',
    value: 'text-electric-red dark:text-red-400',
    subtitle: 'text-electric-red dark:text-red-400',
  },
  'electric-orange': {
    container: 'from-electric-orange/20 to-electric-yellow/10 dark:from-electric-orange/20 dark:to-electric-yellow/10 border-electric-orange/30 dark:border-electric-yellow/30',
    title: 'text-electric-orange dark:text-electric-yellow',
    value: 'text-electric-orange dark:text-electric-yellow',
    subtitle: 'text-electric-orange dark:text-electric-yellow',
  },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = 'electric-blue' }) => {
  const c = colorMap[color] || colorMap['electric-blue'];
  return (
    <Card className={`bg-gradient-to-br ${c.container}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium ${c.title}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${c.value}`}>{value}</div>
        {subtitle && <p className={`text-xs mt-1 ${c.subtitle}`}>{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default StatCard;


