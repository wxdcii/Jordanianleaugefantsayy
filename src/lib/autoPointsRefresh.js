/**
 * Automatic Points Refresh System
 * Periodically checks and updates user points when player data changes
 */

let refreshInterval: ReturnType<typeof setInterval> | null = null;
let isRefreshing = false;

/**
 * Start automatic points refresh
 * @param {number} intervalMinutes - How often to refresh (in minutes)
 */
export function startAutoRefresh(intervalMinutes = 30): void {
  if (refreshInterval) {
    console.log('⚠️ Auto refresh already running, stopping previous interval');
    stopAutoRefresh();
  }

  console.log(`🔄 Starting auto points refresh every ${intervalMinutes} minutes`);

  refreshInterval = setInterval(async () => {
    if (isRefreshing) {
      console.log('⏳ Refresh already in progress, skipping this cycle');
      return;
    }

    try {
      isRefreshing = true;
      console.log('🔄 Auto refresh: Starting points update...');

      const response = await fetch('/api/refresh-all-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Auto refresh completed: Updated ${result.data.totalUsersUpdated} users across ${result.data.gameweeksUpdated} gameweeks`);
      } else {
        console.error('❌ Auto refresh failed:', result.message);
      }

    } catch (error) {
      console.error('❌ Auto refresh error:', error);
    } finally {
      isRefreshing = false;
    }
  }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
}

/**
 * Stop automatic points refresh
 */
export function stopAutoRefresh(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('🛑 Auto points refresh stopped');
  }
}

/**
 * Check if auto refresh is running
 * @returns {boolean}
 */
export function isAutoRefreshRunning(): boolean {
  return refreshInterval !== null;
}

/**
 * Get auto refresh status
 * @returns {{ isRunning: boolean, isCurrentlyRefreshing: boolean }}
 */
export function getAutoRefreshStatus() {
  return {
    isRunning: refreshInterval !== null,
    isCurrentlyRefreshing: isRefreshing
  };
}

/**
 * Manual refresh trigger (same as auto refresh but can be called manually)
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
export async function triggerManualRefresh() {
  if (isRefreshing) {
    return {
      success: false,
      message: 'Refresh already in progress'
    };
  }

  try {
    isRefreshing = true;
    console.log('🔄 Manual refresh: Starting points update...');

    const response = await fetch('/api/refresh-all-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Manual refresh completed: Updated ${result.data.totalUsersUpdated} users`);
      return {
        success: true,
        message: `Updated ${result.data.totalUsersUpdated} users across ${result.data.gameweeksUpdated} gameweeks`,
        data: result.data
      };
    } else {
      console.error('❌ Manual refresh failed:', result.message);
      return {
        success: false,
        message: result.message
      };
    }

  } catch (error: any) {
    console.error('❌ Manual refresh error:', error);
    return {
      success: false,
      message: error.message
    };
  } finally {
    isRefreshing = false;
  }
}

// Named export object instead of anonymous default export
const AutoPointsRefresh = {
  startAutoRefresh,
  stopAutoRefresh,
  isAutoRefreshRunning,
  getAutoRefreshStatus,
  triggerManualRefresh
};

export default AutoPointsRefresh;
