import React from 'react';

// Widget components
const FinancialWidget = () => (
  <div className="card bg-gradient-to-br from-electric-cyan/20 to-electric-blue/10 dark:from-electric-blue/20 dark:to-electric-cyan/10 border-electric-cyan/30 dark:border-electric-blue/30">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Financial Snapshot</h3>
      <div className="flex space-x-2">
        <button
          onClick={() => window.location.href = '/finance/revenue-expenses?tab=revenue&action=add'}
          className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center transition-colors"
          title="Add Revenue"
        >
          <span className="mr-1">+</span>
          Revenue
        </button>
        <button
          onClick={() => window.location.href = '/finance/revenue-expenses?tab=expenses&action=add'}
          className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center transition-colors"
          title="Add Expense"
        >
          <span className="mr-1">+</span>
          Expense
        </button>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Current Balance</p>
        <p className="text-2xl font-semibold text-neutral-900 dark:text-white">$24,500</p>
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
          <span>↑ 3.2%</span>
          <span className="ml-1">this week</span>
        </p>
      </div>
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Revenue MTD</p>
        <p className="text-2xl font-semibold text-neutral-900 dark:text-white">$18,245</p>
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
          <span>↑ 12.5%</span>
          <span className="ml-1">vs last month</span>
        </p>
      </div>
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Expenses MTD</p>
        <p className="text-2xl font-semibold text-neutral-900 dark:text-white">$9,320</p>
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
          <span>↑ 5.3%</span>
          <span className="ml-1">vs last month</span>
        </p>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <a href="/finance/revenue-expenses" className="text-sm text-electric-cyan dark:text-electric-blue hover:underline">
        View financial reports →
      </a>
    </div>
  </div>
);

const TaskWidget = () => (
  <div className="card">
    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">Today's Focus</h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Complete quarterly report</span>
        </div>
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Due today</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Review marketing materials</span>
        </div>
        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Due tomorrow</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Team standup meeting</span>
        </div>
        <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">10:00 AM</span>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <a href="/projects/tasks" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
        View all tasks (12) →
      </a>
    </div>
  </div>
);

const PeopleWidget = () => (
  <div className="card">
    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">People Pulse</h3>
    <div className="space-y-3">
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">On shift today</p>
        <div className="flex items-center mt-1">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-electric-blue/20 text-electric-blue dark:bg-electric-blue/30 dark:text-electric-cyan flex items-center justify-center border-2 border-white dark:border-neutral-800">
              <span className="text-xs font-medium">JD</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-electric-purple/20 text-electric-purple dark:bg-electric-purple/30 dark:text-electric-pink flex items-center justify-center border-2 border-white dark:border-neutral-800">
              <span className="text-xs font-medium">AM</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-electric-green/20 text-electric-green dark:bg-electric-green/30 dark:text-electric-green flex items-center justify-center border-2 border-white dark:border-neutral-800">
              <span className="text-xs font-medium">RK</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 flex items-center justify-center border-2 border-white dark:border-neutral-800">
              <span className="text-xs font-medium">+2</span>
            </div>
          </div>
          <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">5 team members</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Out today</p>
        <div className="flex items-center mt-1">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 flex items-center justify-center border-2 border-white dark:border-neutral-800">
              <span className="text-xs font-medium">TS</span>
            </div>
          </div>
          <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">1 team member (PTO)</span>
        </div>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <a href="/staff/directory" className="text-sm text-electric-cyan dark:text-electric-blue hover:underline">
        View team directory →
      </a>
    </div>
  </div>
);

const InventoryWidget = () => (
  <div className="card">
    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">Inventory Watch</h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Coffee beans (Dark Roast)</span>
        </div>
        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Low stock (2 kg)</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Milk (Whole)</span>
        </div>
        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Reorder soon (5 L)</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <span className="text-neutral-800 dark:text-neutral-200">Cups (12 oz)</span>
        </div>
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">In stock (250)</span>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <a href="/operations/inventory" className="text-sm text-electric-cyan dark:text-electric-blue hover:underline">
        View inventory →
      </a>
    </div>
  </div>
);

const EventWidget = () => (
  <div className="card">
    <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-white">Event Radar</h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 font-medium">Acoustic Night</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Today, 7:00 PM</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          Confirmed
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 font-medium">Art Workshop</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Tomorrow, 2:00 PM</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
          5 spots left
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 font-medium">Poetry Reading</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Jul 25, 6:30 PM</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-electric-blue/20 text-electric-blue dark:bg-electric-blue/30 dark:text-electric-cyan">
          Planning
        </span>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <a href="/schedule" className="text-sm text-electric-cyan dark:text-electric-blue hover:underline">
        View all events →
      </a>
    </div>
  </div>
);

const OverviewSection: React.FC = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <FinancialWidget />
        </div>
        <div>
          <TaskWidget />
        </div>
        <div>
          <PeopleWidget />
        </div>
        <div>
          <InventoryWidget />
        </div>
        <div className="md:col-span-2 lg:col-span-3 xl:col-span-5">
          <EventWidget />
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
