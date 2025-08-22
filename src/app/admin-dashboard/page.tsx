'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isAdminUser } from '@/lib/adminAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect if not admin
  useEffect(() => {
    if (user !== undefined && !isAdminUser(user)) {
      router.push('/')
      return
    }
  }, [user, router])

  // Check if user is admin and logged in
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">Access Denied - Admin Only</div>
      </div>
    )
  }

  const adminTools = [
    {
      title: 'Deadline Manager',
      description: 'Manage gameweek deadlines and transfer windows',
      href: '/admin-dashboard/deadline-manager',
      icon: '🕒',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Reset Deduction Points',
      description: 'Reset user transfer deduction points for current gameweek',
      href: '/admin-reset-deduction-points.html',
      icon: '🔄',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts and permissions',
      href: '#',
      icon: '👥',
      color: 'bg-purple-500 hover:bg-purple-600',
      disabled: true
    },
    {
      title: 'Squad Analysis',
      description: 'View and analyze user squads',
      href: '#',
      icon: '📊',
      color: 'bg-orange-500 hover:bg-orange-600',
      disabled: true
    },
    {
      title: 'Points Management',
      description: 'Manage player points and gameweek scores',
      href: '#',
      icon: '🏆',
      color: 'bg-red-500 hover:bg-red-600',
      disabled: true
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      href: '#',
      icon: '⚙️',
      color: 'bg-gray-500 hover:bg-gray-600',
      disabled: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Fantasy League Management Center</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Logged in as Admin</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the Admin Panel</h2>
          <p className="text-gray-600">
            Use the tools below to manage the fantasy league. You have full administrative access to all system features.
          </p>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminTools.map((tool, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {tool.disabled ? (
                <div className="p-6 opacity-50 cursor-not-allowed">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center text-white text-2xl mr-4`}>
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                      <p className="text-sm text-gray-500">Coming Soon</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                </div>
              ) : (
                <Link 
                  href={tool.href}
                  className="block p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center text-white text-2xl mr-4 transition-colors duration-200`}>
                      {tool.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                      <p className="text-sm text-blue-600">Click to access</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{tool.description}</p>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin-dashboard/deadline-manager"
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center transition-colors duration-200"
            >
              <div className="text-2xl mb-2">🟢</div>
              <div className="font-medium text-blue-900">Open All Transfers</div>
              <div className="text-xs text-blue-600">Enable testing mode</div>
            </Link>
            
            <Link 
              href="/admin-dashboard/deadline-manager"
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center transition-colors duration-200"
            >
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-medium text-red-900">Close All Transfers</div>
              <div className="text-xs text-red-600">Disable all changes</div>
            </Link>
            
            <Link 
              href="/admin-reset-deduction-points.html"
              className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center transition-colors duration-200"
            >
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium text-green-900">Reset Points</div>
              <div className="text-xs text-green-600">Clear deductions</div>
            </Link>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center opacity-50">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-700">View Stats</div>
              <div className="text-xs text-gray-500">Coming soon</div>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-green-900">System Online</div>
                  <div className="text-sm text-green-600">All services running</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-blue-900">Admin Access</div>
                  <div className="text-sm text-blue-600">Full permissions</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-yellow-900">Testing Mode</div>
                  <div className="text-sm text-yellow-600">Use deadline manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
