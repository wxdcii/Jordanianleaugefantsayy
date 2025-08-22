// Simple Firebase save test
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/lib/firebase.js';

async function testSave() {
  console.log('🧪 Testing Firebase save...');
  
  // Check if Firebase is initialized
  console.log('Firebase db:', !!db);
  console.log('Firebase auth:', !!auth);
  
  if (!db) {
    console.error('❌ Firebase db not initialized');
    return;
  }
  
  try {
    // Test with a simple document
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Hello Firebase'
    };
    
    const testRef = doc(db, 'test', 'simple-test');
    
    console.log('💾 Attempting to save test document...');
    await setDoc(testRef, testDoc);
    console.log('✅ Test document saved successfully!');
    
    // Try to read it back
    console.log('📖 Attempting to read test document...');
    const docSnap = await getDoc(testRef);
    
    if (docSnap.exists()) {
      console.log('✅ Test document read successfully!');
      console.log('Data:', docSnap.data());
    } else {
      console.log('❌ Test document not found');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testSave();
