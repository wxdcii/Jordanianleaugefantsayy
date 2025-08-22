'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialMediaNotification } from '@/hooks/useSocialMediaNotification';

export default function SocialNotificationDebug() {
  const { user } = useAuth();
  const { showNotification, resetNotification } = useSocialMediaNotification();

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-4 rounded-lg text-sm z-40">
      <h4 className="font-bold mb-2">Social Notification Debug</h4>
      <p>User: {user.email}</p>
      <p>Show Notification: {showNotification ? 'Yes' : 'No'}</p>
      <button
        onClick={resetNotification}
        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
      >
        Reset Notification
      </button>
    </div>
  );
}
