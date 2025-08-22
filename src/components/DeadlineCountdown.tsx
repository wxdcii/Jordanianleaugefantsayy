'use client';

import React, { useState, useEffect } from 'react';
import { getTimeUntilDeadline, isDeadlinePassed } from '@/lib/deadlineService';

interface DeadlineCountdownProps {
  gameweek: number;
  language?: 'en' | 'ar';
  className?: string;
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({
  gameweek,
  language = 'en',
  className = '',
  showIcon = true
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateCountdown = async () => {
      try {
        const passed = await isDeadlinePassed(gameweek);
        setDeadlinePassed(passed);

        if (!passed) {
          const remaining = await getTimeUntilDeadline(gameweek);
          setTimeRemaining(remaining);
        }
      } catch (error) {
        console.error('Error updating countdown:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second if deadline hasn't passed
    if (!deadlinePassed) {
      interval = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameweek, deadlinePassed]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">
          {language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}
        </span>
      </div>
    );
  }

  if (deadlinePassed) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        {showIcon && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <span className="font-medium">
          {language === 'ar' ? 'انتهى الوقت' : 'Time Expired'}
        </span>
      </div>
    );
  }

  if (!timeRemaining) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        {showIcon && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )}
        <span>
          {language === 'ar' ? 'غير متاح' : 'Not Available'}
        </span>
      </div>
    );
  }

  // Determine urgency level for styling
  const getUrgencyLevel = () => {
    if (timeRemaining.totalMs <= 60 * 60 * 1000) return 'critical'; // Less than 1 hour
    if (timeRemaining.totalMs <= 24 * 60 * 60 * 1000) return 'urgent'; // Less than 1 day
    if (timeRemaining.totalMs <= 3 * 24 * 60 * 60 * 1000) return 'warning'; // Less than 3 days
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  const urgencyStyles = {
    critical: 'text-red-600 bg-red-50 border-red-200',
    urgent: 'text-orange-600 bg-orange-50 border-orange-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    normal: 'text-green-600 bg-green-50 border-green-200'
  };

  const formatTime = () => {
    const { days, hours, minutes, seconds } = timeRemaining;
    
    if (language === 'ar') {
      if (days > 0) {
        return `${days} يوم ${hours} ساعة ${minutes} دقيقة`;
      } else if (hours > 0) {
        return `${hours} ساعة ${minutes} دقيقة ${seconds} ثانية`;
      } else if (minutes > 0) {
        return `${minutes} دقيقة ${seconds} ثانية`;
      } else {
        return `${seconds} ثانية`;
      }
    } else {
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${urgencyStyles[urgencyLevel]} ${className}`}>
      {showIcon && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )}
      <div className="flex flex-col">
        <span className="text-xs opacity-75">
          {language === 'ar' ? 'الوقت المتبقي' : 'Time Left'}
        </span>
        <span className="font-mono font-bold">
          {formatTime()}
        </span>
      </div>
    </div>
  );
};

export default DeadlineCountdown;
