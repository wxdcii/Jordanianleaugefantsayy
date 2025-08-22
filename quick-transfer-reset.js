const http = require('http');

async function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/transfers',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function resetTransfersForAllUsers() {
  console.log('🚀 Starting transfer reset for all users...');
  console.log('🎯 Target: GW4, 2 free transfers, 0 deduction points');
  
  // List of common user IDs that might exist
  // You can add actual user IDs here if you know them
  const potentialUserIds = [
    'test_user',
    'admin',
    'user1',
    'user2', 
    'user3',
    'demo_user',
    // Add more user IDs if you know them
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const userId of potentialUserIds) {
    try {
      console.log(`🔄 Processing user: ${userId}`);
      
      const requestData = {
        userId: userId,
        gameweekId: 4,
        transferState: {
          savedFreeTransfers: 2,
          transfersMadeThisWeek: 0,
          pointsDeductedThisWeek: 0,
          lastGameweekProcessed: 4,
          wildcardActive: false,
          freeHitActive: false
        }
      };
      
      const response = await makeRequest(requestData);
      
      if (response.status === 200) {
        console.log(`✅ Successfully updated ${userId}`);
        successCount++;
      } else {
        console.log(`⚠️ User ${userId} may not exist (status: ${response.status})`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${userId}:`, error.message);
      errorCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 Reset process completed!');
  console.log(`✅ Successfully updated: ${successCount} users`);
  console.log(`❌ Errors/Not found: ${errorCount} users`);
  console.log('💡 If you have actual user IDs, add them to the potentialUserIds array');
}

// Alternative: Direct database update approach
async function directDatabaseReset() {
  console.log('\n🔧 Attempting direct database reset...');
  
  try {
    const requestData = {
      action: 'reset_all_users',
      gameweekId: 4,
      freeTransfers: 2,
      resetDeductionPoints: true
    };
    
    const response = await makeRequest(requestData);
    console.log('📡 Database reset response:', response);
    
  } catch (error) {
    console.error('❌ Direct reset failed:', error.message);
  }
}

// Run both approaches
async function runReset() {
  await resetTransfersForAllUsers();
  await directDatabaseReset();
  
  console.log('\n🏁 All reset attempts completed!');
  console.log('📝 Summary:');
  console.log('   - Attempted to set all users to 2 free transfers');
  console.log('   - Attempted to reset all deduction points to 0');
  console.log('   - Target gameweek: GW4');
}

runReset().catch(console.error);
