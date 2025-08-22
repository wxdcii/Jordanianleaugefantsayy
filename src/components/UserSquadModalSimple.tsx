'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface UserSquadModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  userRank: number
  totalPoints: number
}

function UserSquadModal({ isOpen, onClose, userId, userName, userRank, totalPoints }: UserSquadModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            {userName}
            <span className="text-sm text-gray-500">
              #{userRank} | {totalPoints} pts
            </span>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="p-4">
          <p>Squad data for user {userId} will be loaded here...</p>
          <p>This is a simplified version for testing.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UserSquadModal
