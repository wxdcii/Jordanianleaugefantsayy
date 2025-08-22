'use client';

import React from 'react';
import SocialMediaNotification from '@/components/SocialMediaNotification';
import { useSocialMediaNotification } from '@/hooks/useSocialMediaNotification';

export default function NotificationProvider() {
  const { showNotification, closeNotification, closeNotificationPermanently } = useSocialMediaNotification(false);

  return (
    <SocialMediaNotification 
      show={showNotification} 
      onClose={closeNotification}
      onClosePermanently={closeNotificationPermanently}
    />
  );
}
