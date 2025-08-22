'use client'

import { useState, useEffect } from 'react'
import { fetchAllPlayers } from '@/lib/firebasePlayersService'

interface Player {
  id: string
  name: string
  position: string
  club: string
  price: number
  points: { [key: string]: number }
  totalPoints: number
}

export default function FirebasePlayersTest() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true)
        const playersData = await fetchAllPlayers()
        setPlayers(playersData)
      } catch (err) {
        setError('Failed to load players')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadPlayers()
  }, [])

  if (loading) return <div>Loading players...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Firebase Players ({players.length})</h2>
      <div className="grid gap-4">
        {players.map(player => (
          <div key={player.id} className="border p-4 rounded">
            <h3 className="font-bold">{player.name}</h3>
            <p>Position: {player.position}</p>
            <p>Club: {player.club}</p>
            <p>Price: {player.price}M</p>
            <p>Total Points: {player.totalPoints}</p>
          </div>
        ))}
      </div>
    </div>
  )
}