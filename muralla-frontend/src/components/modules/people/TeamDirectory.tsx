import React from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'away' | 'offline';
  isManager: boolean;
}

const TeamDirectory: React.FC = () => {

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Darwin Bruna',
      email: 'darwin@murallacafe.cl',
      role: 'General Manager',
      department: 'Management',
      phone: '+56 9 XXXX XXXX',
      status: 'active',
      isManager: true,
    },
    {
      id: '2',
      name: 'Kaví Doi',
      email: 'kavi@murallacafe.cl',
      role: 'General Manager',
      department: 'Management',
      phone: '+56 9 XXXX XXXX',
      status: 'active',
      isManager: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const managers = teamMembers.filter(member => member.isManager);
  const staff = teamMembers.filter(member => !member.isManager);

  const renderMemberCard = (member: TeamMember) => (
    <div
      key={member.id}
      className="card p-6 hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(member.name)}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(
              member.status
            )}`}
            title={getStatusText(member.status)}
          />
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {member.name}
            </h3>
            {member.isManager && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Manager
              </span>
            )}
          </div>
          
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
            {member.role}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {member.department}
          </p>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${member.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                {member.email}
              </a>
            </div>
            
            {member.phone && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${member.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {member.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button className="btn-outline text-xs">
            Message
          </button>
          <button className="btn-outline text-xs">
            Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Team Directory
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Connect with team members and find contact information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Member
          </button>
        </div>
      </div>

      {/* Management Team */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Management Team
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managers.map(renderMemberCard)}
        </div>
      </div>

      {/* Staff Members */}
      {staff.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Staff Members
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Team Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {teamMembers.length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Total Members
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teamMembers.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Online Now
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {managers.length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Managers
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              1
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Departments
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDirectory;
