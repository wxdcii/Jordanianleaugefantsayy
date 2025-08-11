'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isAdminUser } from '@/lib/adminAuth'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface GameweekData {
  gw: number
  startDate: string
  deadline: string
  isOpen: boolean
}

export default function DeadlineManagerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [gameweeks, setGameweeks] = useState<GameweekData[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<{ [key: number]: boolean }>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (user !== undefined && !isAdminUser(user)) {
      router.push('/')
      return
    }
  }, [user, router])

  // Load all gameweeks
  useEffect(() => {
    const loadGameweeks = async () => {
      if (!user || !isAdminUser(user)) return

      try {
        setLoading(true)
        console.log('🔍 Loading all gameweeks...')
        
        const gameweeksRef = collection(db, 'gameweeksDeadline')
        const q = query(gameweeksRef, orderBy('gw', 'asc'))
        const querySnapshot = await getDocs(q)
        
        const gameweekData: GameweekData[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          gameweekData.push({
            gw: data.gw,
            startDate: data.startDate,
            deadline: data.deadline,
            isOpen: data.isOpen || false
          })
        })
        
        console.log('✅ Loaded gameweeks:', gameweekData)
        setGameweeks(gameweekData)
      } catch (error) {
        console.error('❌ Error loading gameweeks:', error)
        setMessage({ type: 'error', text: 'Failed to load gameweeks' })
      } finally {
        setLoading(false)
      }
    }

    loadGameweeks()
  }, [user])

  // Toggle gameweek open/closed status
  const toggleGameweekStatus = async (gameweekNumber: number, currentStatus: boolean) => {
    if (!user || !isAdminUser(user)) {
      setMessage({ type: 'error', text: 'Admin access required' })
      return
    }

    try {
      setUpdating(prev => ({ ...prev, [gameweekNumber]: true }))
      console.log(`🔄 Toggling GW${gameweekNumber} from ${currentStatus ? 'open' : 'closed'} to ${!currentStatus ? 'open' : 'closed'}`)
      
      const gameweekRef = doc(db, 'gameweeksDeadline', gameweekNumber.toString())
      
      // Update the isOpen status
      await updateDoc(gameweekRef, {
        isOpen: !currentStatus
      })
      
      // Update local state
      setGameweeks(prev => prev.map(gw => 
        gw.gw === gameweekNumber 
          ? { ...gw, isOpen: !currentStatus }
          : gw
      ))
      
      console.log(`✅ GW${gameweekNumber} ${!currentStatus ? 'opened' : 'closed'} successfully`)
      setMessage({ 
        type: 'success', 
        text: `Gameweek ${gameweekNumber} ${!currentStatus ? 'opened' : 'closed'} successfully` 
      })
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
      
    } catch (error) {
      console.error(`❌ Error toggling GW${gameweekNumber}:`, error)
      setMessage({ type: 'error', text: `Failed to update Gameweek ${gameweekNumber}` })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setUpdating(prev => ({ ...prev, [gameweekNumber]: false }))
    }
  }

  // Open all gameweeks for testing
  const openAllGameweeks = async () => {
    if (!user || !isAdminUser(user)) {
      setMessage({ type: 'error', text: 'Admin access required' })
      return
    }

    if (!confirm('Are you sure you want to open ALL gameweeks? This will allow transfers for all gameweeks.')) {
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Opening all gameweeks...')
      
      const promises = gameweeks.map(async (gw) => {
        const gameweekRef = doc(db, 'gameweeksDeadline', gw.gw.toString())
        await updateDoc(gameweekRef, { isOpen: true })
      })
      
      await Promise.all(promises)
      
      // Update local state
      setGameweeks(prev => prev.map(gw => ({ ...gw, isOpen: true })))
      
      console.log('✅ All gameweeks opened successfully')
      setMessage({ type: 'success', text: 'All gameweeks opened successfully!' })
      setTimeout(() => setMessage(null), 3000)
      
    } catch (error) {
      console.error('❌ Error opening all gameweeks:', error)
      setMessage({ type: 'error', text: 'Failed to open all gameweeks' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Close all gameweeks
  const closeAllGameweeks = async () => {
    if (!user || !isAdminUser(user)) {
      setMessage({ type: 'error', text: 'Admin access required' })
      return
    }

    if (!confirm('Are you sure you want to close ALL gameweeks? This will prevent transfers for all gameweeks.')) {
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Closing all gameweeks...')
      
      const promises = gameweeks.map(async (gw) => {
        const gameweekRef = doc(db, 'gameweeksDeadline', gw.gw.toString())
        await updateDoc(gameweekRef, { isOpen: false })
      })
      
      await Promise.all(promises)
      
      // Update local state
      setGameweeks(prev => prev.map(gw => ({ ...gw, isOpen: false })))
      
      console.log('✅ All gameweeks closed successfully')
      setMessage({ type: 'success', text: 'All gameweeks closed successfully!' })
      setTimeout(() => setMessage(null), 3000)
      
    } catch (error) {
      console.error('❌ Error closing all gameweeks:', error)
      setMessage({ type: 'error', text: 'Failed to close all gameweeks' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Deadline Manager</h1>
            <p className="text-gray-600 mt-1">Manage gameweek deadlines and transfer windows</p>
            <p className="text-sm text-blue-600 mt-2">
              Admin: {user?.email} | Logged in as Administrator
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Bulk Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={openAllGameweeks}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : '🟢 Open All Gameweeks'}
            </button>
            
            <button
              onClick={closeAllGameweeks}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : '🔴 Close All Gameweeks'}
            </button>

            <div className="ml-auto text-sm text-gray-600 flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Open = Transfers Allowed
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-2"></span>
              Closed = Transfers Blocked
            </div>
          </div>

          {/* Gameweeks Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading gameweeks...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Gameweek</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Start Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Deadline</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Status</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gameweeks.map((gw) => (
                    <tr key={gw.gw} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        GW{gw.gw}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        {formatDate(gw.startDate)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        {formatDate(gw.deadline)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          gw.isOpen
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            gw.isOpen ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {gw.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <button
                          onClick={() => toggleGameweekStatus(gw.gw, gw.isOpen)}
                          disabled={updating[gw.gw]}
                          className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                            gw.isOpen
                              ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                              : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                          }`}
                        >
                          {updating[gw.gw] 
                            ? 'Updating...' 
                            : gw.isOpen 
                              ? '🔒 Close' 
                              : '🔓 Open'
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {gameweeks.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-600">
              No gameweeks found. Please check your database configuration.
            </div>
          )}

          {/* Usage Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Usage Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Open Gameweek:</strong> Players can make transfers, select captains, and save teams</li>
              <li>• <strong>Closed Gameweek:</strong> All team changes are blocked</li>
              <li>• <strong>Individual Toggle:</strong> Click "Open/Close" button for specific gameweeks</li>
              <li>• <strong>Bulk Actions:</strong> Use "Open All" or "Close All" for testing</li>
              <li>• <strong>Testing:</strong> Use "Open All" to enable transfers for all gameweeks during testing</li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {gameweeks.filter(gw => gw.isOpen).length}
              </div>
              <div className="text-sm text-green-600">Open Gameweeks</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">
                {gameweeks.filter(gw => !gw.isOpen).length}
              </div>
              <div className="text-sm text-red-600">Closed Gameweeks</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">
                {gameweeks.length}
              </div>
              <div className="text-sm text-blue-600">Total Gameweeks</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-700">
                {user?.email?.includes('ammar.mkld67') ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">Admin Access</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
