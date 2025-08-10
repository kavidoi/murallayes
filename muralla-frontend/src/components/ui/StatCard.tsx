import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'purple';
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
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = 'blue' }) => {
  const c = colorMap[color];
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


