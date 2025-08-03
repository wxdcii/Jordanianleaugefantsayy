'use client';

import { useState, useEffect } from 'react';
import { GameweekDeadlineService } from '@/lib/gameweekDeadlineService';

interface DeadlineDisplayProps {
  gameweek: number;
  language?: 'en' | 'ar';
  className?: string;
}

interface DeadlineInfo {
  status: 'open' | 'closed';
  timeRemaining: string;
  deadline?: Date | null;
  statusText?: string;
  isOpen?: boolean;
}

export default function DeadlineDisplay({ 
  gameweek, 
  language = 'en', 
  className = '' 
}: DeadlineDisplayProps) {
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDeadline = async () => {
      try {
        const info = await GameweekDeadlineService.getDeadlineInfo(gameweek);
        setDeadlineInfo(info);
      } catch (error) {
        console.error('Error getting deadline info:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDeadline();
    
    // Update every minute
    const interval = setInterval(checkDeadline, 60000);
    return () => clearInterval(interval);
  }, [gameweek]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (!deadlineInfo) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        {language === 'ar' ? 'غير متاح' : 'Not Available'}
      </div>
    );
  }

  const statusColor = GameweekDeadlineService.getStatusColor(deadlineInfo.status);
  const timeText = GameweekDeadlineService.getTimeRemainingText(deadlineInfo.timeRemaining, language);

  return (
    <div className={`${className}`}>
      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          deadlineInfo.status === 'open' ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        {deadlineInfo.status === 'open' 
          ? (language === 'ar' ? 'مفتوح للتغييرات' : 'Open for Changes')
          : (language === 'ar' ? 'مغلق للتغييرات' : 'Closed for Changes')
        }
      </div>
      
      {/* Time Remaining */}
      <div className="mt-2 text-sm text-gray-600">
        <span className="font-medium">
          {language === 'ar' ? 'الوقت المتبقي: ' : 'Time Remaining: '}
        </span>
        <span className={deadlineInfo.status === 'open' ? 'text-green-600' : 'text-red-600'}>
          {timeText}
        </span>
      </div>
      

    </div>
  );
}

// Compact version for inline display
export function DeadlineStatus({ 
  gameweek, 
  language = 'en',
  showIcon = true 
}: { 
  gameweek: number; 
  language?: 'en' | 'ar';
  showIcon?: boolean;
}) {
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null);

  useEffect(() => {
    const checkDeadline = async () => {
      const info = await GameweekDeadlineService.getDeadlineInfo(gameweek);
      setDeadlineInfo(info);
    };

    checkDeadline();
    const interval = setInterval(checkDeadline, 60000);
    return () => clearInterval(interval);
  }, [gameweek]);

  if (!deadlineInfo) {
    return <span className="text-gray-400">...</span>;
  }

  const statusColor = deadlineInfo.status === 'open' ? 'text-green-600' : 'text-red-600';
  const timeText = GameweekDeadlineService.getTimeRemainingText(deadlineInfo.timeRemaining, language);

  return (
    <span className={`inline-flex items-center text-sm ${statusColor}`}>
      {showIcon && (
        <span className="mr-1">
          {deadlineInfo.status === 'open' ? '🟢' : '🔴'}
        </span>
      )}
      {timeText}
    </span>
  );
}

// Live countdown component
export function LiveCountdown({ 
  gameweek, 
  language = 'en' 
}: { 
  gameweek: number; 
  language?: 'en' | 'ar';
}) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = async () => {
      const info = await GameweekDeadlineService.getDeadlineInfo(gameweek);
      
      if (!info.deadline || info.status === 'closed') {
        setIsExpired(true);
        setTimeRemaining(language === 'ar' ? 'انتهى الوقت' : 'Expired');
        return;
      }

      const now = new Date();
      const deadline = info.deadline;
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeRemaining(language === 'ar' ? 'انتهى الوقت' : 'Expired');
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      let timeText = '';
      if (language === 'ar') {
        if (days > 0) timeText = `${days} أيام ${hours} ساعات`;
        else if (hours > 0) timeText = `${hours} ساعات ${minutes} دقائق`;
        else timeText = `${minutes} دقائق ${seconds} ثواني`;
      } else {
        if (days > 0) timeText = `${days}d ${hours}h ${minutes}m`;
        else if (hours > 0) timeText = `${hours}h ${minutes}m ${seconds}s`;
        else timeText = `${minutes}m ${seconds}s`;
      }

      setTimeRemaining(timeText);
      setIsExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second
    return () => clearInterval(interval);
  }, [gameweek, language]);

  return (
    <div className={`font-mono text-lg ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
      {timeRemaining}
    </div>
  );
}
