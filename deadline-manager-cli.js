#!/usr/bin/env node

/**
 * Admin Deadline Manager - Command Line Tool
 * Quickly open/close gameweek transfers for testing
 * 
 * Usage:
 * node deadline-manager-cli.js open-all     # Open all gameweeks
 * node deadline-manager-cli.js close-all    # Close all gameweeks
 * node deadline-manager-cli.js open 2       # Open specific gameweek
 * node deadline-manager-cli.js close 2      # Close specific gameweek
 * node deadline-manager-cli.js status       # Show current status
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  // You may need to adjust this path to your service account key
  const serviceAccount = require('./firebase-admin-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Add your project ID here
    projectId: 'your-project-id'
  });
}

const db = admin.firestore();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function showStatus() {
  try {
    log('cyan', '🔍 Checking gameweek status...\n');
    
    const gameweeksRef = db.collection('gameweeksDeadline');
    const snapshot = await gameweeksRef.orderBy('gw', 'asc').get();
    
    if (snapshot.empty) {
      log('red', '❌ No gameweeks found in database');
      return;
    }
    
    console.log('📊 Gameweek Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let openCount = 0;
    let closedCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const status = data.isOpen ? 'OPEN' : 'CLOSED';
      const statusColor = data.isOpen ? 'green' : 'red';
      const statusIcon = data.isOpen ? '🟢' : '🔴';
      
      console.log(`${statusIcon} GW${data.gw.toString().padEnd(3)} | ${status.padEnd(6)} | Deadline: ${new Date(data.deadline).toLocaleString()}`);
      
      if (data.isOpen) openCount++;
      else closedCount++;
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('green', `✅ Open: ${openCount} gameweeks`);
    log('red', `❌ Closed: ${closedCount} gameweeks`);
    log('blue', `📊 Total: ${openCount + closedCount} gameweeks`);
    
  } catch (error) {
    log('red', `❌ Error checking status: ${error.message}`);
  }
}

async function openAllGameweeks() {
  try {
    log('yellow', '🔄 Opening all gameweeks...');
    
    const gameweeksRef = db.collection('gameweeksDeadline');
    const snapshot = await gameweeksRef.get();
    
    if (snapshot.empty) {
      log('red', '❌ No gameweeks found in database');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, { isOpen: true });
      count++;
    });
    
    await batch.commit();
    
    log('green', `✅ Successfully opened ${count} gameweeks`);
    log('cyan', '🎮 All transfers are now ENABLED for testing');
    
  } catch (error) {
    log('red', `❌ Error opening gameweeks: ${error.message}`);
  }
}

async function closeAllGameweeks() {
  try {
    log('yellow', '🔄 Closing all gameweeks...');
    
    const gameweeksRef = db.collection('gameweeksDeadline');
    const snapshot = await gameweeksRef.get();
    
    if (snapshot.empty) {
      log('red', '❌ No gameweeks found in database');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, { isOpen: false });
      count++;
    });
    
    await batch.commit();
    
    log('green', `✅ Successfully closed ${count} gameweeks`);
    log('cyan', '🚫 All transfers are now DISABLED');
    
  } catch (error) {
    log('red', `❌ Error closing gameweeks: ${error.message}`);
  }
}

async function toggleGameweek(gameweekNumber, targetState) {
  try {
    const action = targetState ? 'Opening' : 'Closing';
    log('yellow', `🔄 ${action} gameweek ${gameweekNumber}...`);
    
    const gameweekRef = db.collection('gameweeksDeadline').doc(gameweekNumber.toString());
    const doc = await gameweekRef.get();
    
    if (!doc.exists) {
      log('red', `❌ Gameweek ${gameweekNumber} not found`);
      return;
    }
    
    await gameweekRef.update({ isOpen: targetState });
    
    const newStatus = targetState ? 'OPENED' : 'CLOSED';
    const statusColor = targetState ? 'green' : 'red';
    const statusIcon = targetState ? '🟢' : '🔴';
    
    log(statusColor, `${statusIcon} Gameweek ${gameweekNumber} ${newStatus} successfully`);
    
  } catch (error) {
    log('red', `❌ Error updating gameweek ${gameweekNumber}: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('yellow', '🎮 Admin Deadline Manager - Command Line Tool');
    console.log('\nUsage:');
    console.log('  node deadline-manager-cli.js status        # Show current status');
    console.log('  node deadline-manager-cli.js open-all      # Open all gameweeks');
    console.log('  node deadline-manager-cli.js close-all     # Close all gameweeks');
    console.log('  node deadline-manager-cli.js open 2        # Open gameweek 2');
    console.log('  node deadline-manager-cli.js close 2       # Close gameweek 2');
    console.log('\nExamples:');
    console.log('  node deadline-manager-cli.js open-all      # Enable all transfers for testing');
    console.log('  node deadline-manager-cli.js open 2        # Enable transfers for GW2 only');
    console.log('  node deadline-manager-cli.js status        # Check which gameweeks are open');
    process.exit(0);
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'status':
      await showStatus();
      break;
      
    case 'open-all':
      log('blue', '🎯 This will open ALL gameweeks for transfers');
      await openAllGameweeks();
      break;
      
    case 'close-all':
      log('blue', '🎯 This will close ALL gameweeks and prevent transfers');
      await closeAllGameweeks();
      break;
      
    case 'open':
      if (args.length < 2) {
        log('red', '❌ Please specify gameweek number: node deadline-manager-cli.js open 2');
        process.exit(1);
      }
      const openGW = parseInt(args[1]);
      if (isNaN(openGW)) {
        log('red', '❌ Invalid gameweek number');
        process.exit(1);
      }
      await toggleGameweek(openGW, true);
      break;
      
    case 'close':
      if (args.length < 2) {
        log('red', '❌ Please specify gameweek number: node deadline-manager-cli.js close 2');
        process.exit(1);
      }
      const closeGW = parseInt(args[1]);
      if (isNaN(closeGW)) {
        log('red', '❌ Invalid gameweek number');
        process.exit(1);
      }
      await toggleGameweek(closeGW, false);
      break;
      
    default:
      log('red', `❌ Unknown command: ${command}`);
      log('yellow', 'Use "node deadline-manager-cli.js" for help');
      process.exit(1);
  }
  
  process.exit(0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('red', `💥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log('red', `💥 Unhandled Rejection: ${error.message}`);
  process.exit(1);
});

main().catch(error => {
  log('red', `💥 Fatal Error: ${error.message}`);
  process.exit(1);
});
