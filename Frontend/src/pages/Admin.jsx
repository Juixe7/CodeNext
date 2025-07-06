import React, { useState } from 'react';
import { Plus, Edit, Trash2, Home, RefreshCw, Zap, Settings, Shield, Database } from 'lucide-react';
import { NavLink } from 'react-router';
import ThemeToggle from '../components/ThemeToggle';

function Admin() {
  const [selectedOption, setSelectedOption] = useState(null);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform with detailed specifications',
      icon: Plus,
      color: 'btn-success',
      bgColor: 'bg-success/10',
      route: '/admin/create',
      features: ['Problem details', 'Test cases', 'Solutions', 'Video editorial']
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Edit existing problems and their details to keep content current',
      icon: Edit,
      color: 'btn-warning',
      bgColor: 'bg-warning/10',
      route: '/admin/update',
      features: ['Modify content', 'Update test cases', 'Edit solutions', 'Change difficulty']
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform with confirmation safeguards',
      icon: Trash2,
      color: 'btn-error',
      bgColor: 'bg-error/10',
      route: '/admin/delete',
      features: ['Safe deletion', 'Confirmation prompts', 'Bulk operations', 'Archive options']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-100 transition-colors duration-300">
      {/* Navigation */}
      <nav className="navbar bg-base-100 shadow-lg border-b border-base-300 px-6 transition-colors duration-300">
        <div className="flex-1">
          <NavLink to="/" className="btn btn-ghost text-xl font-bold">
            <Home className="w-6 h-6 mr-2 text-primary" />
            CodeMaster
          </NavLink>
        </div>
        <div className="flex-none gap-4">
          <div className="badge badge-primary gap-2">
            <Shield className="w-4 h-4" />
            Admin Panel
          </div>
          {/* Theme Toggle */}
          <ThemeToggle size="sm" />
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Settings className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-base-content mb-4">
            Admin Dashboard
          </h1>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            Manage coding problems, content, and platform settings with powerful administrative tools
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats shadow w-full mb-12">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Database className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Problems</div>
            <div className="stat-value text-primary">150+</div>
            <div className="stat-desc">↗︎ 12% more than last month</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-success">
              <Zap className="w-8 h-8" />
            </div>
            <div className="stat-title">Active Users</div>
            <div className="stat-value text-success">2.6k</div>
            <div className="stat-desc">↗︎ 8% more than last month</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-info">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div className="stat-title">Submissions</div>
            <div className="stat-value text-info">15.2k</div>
            <div className="stat-desc">↗︎ 22% more than last month</div>
          </div>
        </div>

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.id}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-base-300"
              >
                <div className="card-body p-8">
                  {/* Icon */}
                  <div className={`${option.bgColor} p-4 rounded-full mb-6 w-fit`}>
                    <IconComponent size={32} className="text-base-content" />
                  </div>
                  
                  {/* Title */}
                  <h2 className="card-title text-xl mb-3">
                    {option.title}
                  </h2>
                  
                  {/* Description */}
                  <p className="text-base-content/70 mb-6 leading-relaxed">
                    {option.description}
                  </p>

                  {/* Features List */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-base-content/60">
                      Features
                    </h4>
                    <ul className="space-y-2">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Action Button */}
                  <div className="card-actions">
                    <NavLink 
                      to={option.route}
                      className={`btn ${option.color} btn-wide`}
                    >
                      {option.title}
                    </NavLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-16">
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title mb-6">
                <Zap className="w-6 h-6" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="btn btn-outline btn-sm">
                  <Database className="w-4 h-4 mr-2" />
                  View All Problems
                </button>
                <button className="btn btn-outline btn-sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Cache
                </button>
                <button className="btn btn-outline btn-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Logs
                </button>
                <button className="btn btn-outline btn-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;