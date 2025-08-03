'use client'

import { useState } from 'react'
import { isFirebaseConfigured } from '@/lib/firebase'

export default function DemoModeBanner() {
  const [isVisible, setIsVisible] = useState(!isFirebaseConfigured)

  if (!isVisible || isFirebaseConfigured) {
    return null
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium relative">
      <div className="flex items-center justify-center gap-2">
        <span>🔧</span>
        <span>
          Demo Mode - Firebase not configured. Authentication and data saving are disabled.
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-700 hover:text-yellow-900"
      >
        ✕
      </button>
    </div>
  )
}
