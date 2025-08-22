'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGameweek } from '@/contexts/GameweekContext';
import { getUserSquadFromSubcollection } from '@/lib/firebase/squadService';

export const useSocialMediaNotification = (triggerOnMount: boolean = false) => {
  const { user } = useAuth();
  const { currentGameweek } = useGameweek();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!triggerOnMount) return;
    
    const checkAndShowNotification = async () => {
      if (!user || !currentGameweek) return;

      // Check if user explicitly chose "Don't show again"
      const dontShowAgain = localStorage.getItem(`socialNotification_dontShow_${user.uid}`);
      
      if (dontShowAgain === 'true') return;

      try {
        // Check if user has a squad for the current gameweek
        const squadResult = await getUserSquadFromSubcollection(user.uid, currentGameweek.id);
        
        if (squadResult.success && squadResult.data) {
          // Show notification when user enters squad selection
          setTimeout(() => {
            setShowNotification(true);
          }, 2000); // Show after 2 seconds on squad selection page
        }
        
      } catch (error) {
        console.error('Error checking user squad:', error);
      }
    };

    checkAndShowNotification();
  }, [user, currentGameweek, triggerOnMount]);

  const showNotificationManually = async () => {
    if (!user || !currentGameweek) return;

    // Check if user explicitly chose "Don't show again"
    const dontShowAgain = localStorage.getItem(`socialNotification_dontShow_${user.uid}`);
    
    if (dontShowAgain === 'true') return;

    try {
      // Check if user has a squad for the current gameweek
      const squadResult = await getUserSquadFromSubcollection(user.uid, currentGameweek.id);
      
      if (squadResult.success && squadResult.data) {
        // Show notification immediately
        setTimeout(() => {
          setShowNotification(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error checking user squad:', error);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  const closeNotificationPermanently = () => {
    setShowNotification(false);
    
    // Mark as "don't show again" so it won't show on future visits
    if (user) {
      localStorage.setItem(`socialNotification_dontShow_${user.uid}`, 'true');
    }
  };

  const resetNotification = () => {
    if (user) {
      localStorage.removeItem(`socialNotification_dontShow_${user.uid}`);
    }
  };

  return {
    showNotification,
    closeNotification,
    closeNotificationPermanently,
    resetNotification,
    showNotificationManually
  };
};
