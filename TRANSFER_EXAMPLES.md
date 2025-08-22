# 🔄 Transfer System Examples - Visual Guide

## 📋 **Transfer Cost Calculation Examples**

### **Example 1: Free Transfer (No Cost)**
```
👤 User State:
   Free Transfers: 1
   Transfers Made: 0
   Current Penalty: 0 points

🎯 Action: Transfer Salah OUT → Mané IN

💰 Calculation:
   Transfers Made: 1
   Free Transfers Used: 1
   Extra Transfers: 0
   Cost: 0 × 4 = 0 points

📊 Result:
   transferState: {
     savedFreeTransfers: 1,
     transfersMadeThisWeek: 1,
     pointsDeductedThisWeek: 0  ← CENTRALIZED
   }
```

---

### **Example 2: Taking a Hit (-4 Points)**
```
👤 User State:
   Free Transfers: 1
   Transfers Made: 0  
   Current Penalty: 0 points

🎯 Action: 2 Transfers
   - Salah OUT → Mané IN
   - Kane OUT → Haaland IN

💰 Calculation:
   Transfers Made: 2
   Free Transfers Used: 1
   Extra Transfers: 1
   Cost: 1 × 4 = 4 points

📊 Result:
   transferState: {
     savedFreeTransfers: 1,
     transfersMadeThisWeek: 2,
     pointsDeductedThisWeek: 4  ← CENTRALIZED
   }
```

---

### **Example 3: Multiple Hits (-12 Points)**
```
👤 User State:
   Free Transfers: 1
   Transfers Made: 0
   Current Penalty: 0 points

🎯 Action: 4 Transfers (Squad Overhaul)
   - Salah OUT → Mané IN
   - Kane OUT → Haaland IN  
   - Bruno OUT → KDB IN
   - TAA OUT → Cancelo IN

💰 Calculation:
   Transfers Made: 4
   Free Transfers Used: 1
   Extra Transfers: 3
   Cost: 3 × 4 = 12 points

📊 Result:
   transferState: {
     savedFreeTransfers: 1,
     transfersMadeThisWeek: 4,
     pointsDeductedThisWeek: 12  ← CENTRALIZED
   }
```

---

### **Example 4: Accumulated Free Transfers**
```
👤 User State:
   Free Transfers: 2 (didn't transfer last week)
   Transfers Made: 0
   Current Penalty: 0 points

🎯 Action: 3 Transfers
   - Salah OUT → Mané IN
   - Kane OUT → Haaland IN
   - Bruno OUT → KDB IN

💰 Calculation:
   Transfers Made: 3
   Free Transfers Used: 2
   Extra Transfers: 1
   Cost: 1 × 4 = 4 points

📊 Result:
   transferState: {
     savedFreeTransfers: 2,
     transfersMadeThisWeek: 3,
     pointsDeductedThisWeek: 4  ← CENTRALIZED
   }
```

---

### **Example 5: Wildcard Active (Free Squad Overhaul)**
```
👤 User State:
   Free Transfers: 1
   Transfers Made: 0
   Current Penalty: 0 points
   Wildcard: ACTIVE ⭐

🎯 Action: 10 Transfers (Complete Team Change)
   - Replace entire squad

💰 Calculation:
   Wildcard Active → ALL TRANSFERS FREE
   Cost: 0 points (unlimited transfers)

📊 Result:
   transferState: {
     savedFreeTransfers: 1,
     transfersMadeThisWeek: 10,
     pointsDeductedThisWeek: 0  ← CENTRALIZED (wildcard = free)
   }
```

---

## 🔄 **Gameweek Transition Examples**

### **End of Gameweek → New Gameweek**
```
📅 End of GW5:
   transferState: {
     savedFreeTransfers: 1,
     transfersMadeThisWeek: 3,
     pointsDeductedThisWeek: 8  ← These points were deducted from GW5
   }

🔄 Transition to GW6:
   transferState: {
     savedFreeTransfers: 2,      ← +1 FT added (max 2)
     transfersMadeThisWeek: 0,   ← Reset to 0
     pointsDeductedThisWeek: 0   ← Reset to 0 (penalties don't carry over)
   }
```

### **Free Transfer Accumulation (Max 2)**
```
📅 GW1: User doesn't transfer
   transferState: {
     savedFreeTransfers: 1,
     transfersMadeThisWeek: 0,
     pointsDeductedThisWeek: 0
   }

📅 GW2: Gets +1 FT
   transferState: {
     savedFreeTransfers: 2,      ← Accumulated (1 + 1 = 2)
     transfersMadeThisWeek: 0,
     pointsDeductedThisWeek: 0
   }

📅 GW3: Still doesn't transfer  
   transferState: {
     savedFreeTransfers: 2,      ← Still 2 (max limit reached)
     transfersMadeThisWeek: 0,
     pointsDeductedThisWeek: 0
   }
```

---

## 🗄️ **Database Storage Comparison**

### **❌ OLD WAY (3 Places - Redundant)**
```javascript
// Squad Document
{
  userId: "user123",
  transferCost: 8,           ← Redundant storage #1
  transferState: {
    pointsDeductedThisWeek: 8, ← Redundant storage #2
    transferCost: 8            ← Redundant storage #3
  }
}
```

### **✅ NEW WAY (1 Place - Centralized)**
```javascript
// Squad Document  
{
  userId: "user123",
  // transferCost: REMOVED
  transferState: {
    transfersMade: 2,
    freeTransfers: 1,
    transferCost: 4,           ← SINGLE SOURCE OF TRUTH
    pendingTransfers: []
  }
}
```

---

## 🎯 **Transfer Cost Rules**

| Transfers Made | Free Transfers | Extra Transfers | Cost |
|---------------|---------------|----------------|------|
| 0 | 1 | 0 | **0 points** |
| 1 | 1 | 0 | **0 points** |
| 2 | 1 | 1 | **-4 points** |
| 3 | 1 | 2 | **-8 points** |
| 4 | 1 | 3 | **-12 points** |
| 2 | 2 | 0 | **0 points** |
| 3 | 2 | 1 | **-4 points** |
| 10 | 1 (Wildcard) | 0 | **0 points** |

---

## 🚀 **Key Benefits**

### **1. Single Source of Truth**
- ✅ Transfer costs stored **only** in `transferState.transferCost`
- ❌ No confusion about which field to check
- ✅ Consistent data across the entire application

### **2. Clean Database Structure**
- ✅ No redundant fields
- ✅ Smaller document sizes
- ✅ Faster queries and updates

### **3. Simplified Logic**
- ✅ One place to update transfer costs
- ✅ Easier debugging and maintenance
- ✅ No sync issues between multiple fields

### **4. Proper Gameweek Management**
- ✅ Transfer penalties **reset to 0** each gameweek
- ✅ Free transfers **accumulate up to 2**
- ✅ Transfer counts **reset to 0**

---

## 💻 **Code Usage Examples**

### **Getting Transfer Cost**
```javascript
// ✅ CORRECT WAY (Centralized)
const transferCost = squad.transferState?.transferCost || 0;

// ❌ OLD WAY (Redundant)
const transferCost = squad.transferCost; // Field no longer exists
```

### **Calculating Net Points**
```javascript
// ✅ CORRECT WAY
const netPoints = totalPoints - (squad.transferState?.transferCost || 0);

// ❌ OLD WAY  
const netPoints = totalPoints - squad.transferCost; // Field removed
```

### **Updating Transfer Cost**
```javascript
// ✅ CORRECT WAY (Single location)
await updateDoc(squadRef, {
  'transferState.transferCost': newCost
});

// ❌ OLD WAY (Multiple locations)
await updateDoc(squadRef, {
  transferCost: newCost,                    // Redundant
  'transferState.transferCost': newCost,    // Redundant  
  'transferState.pointsDeductedThisWeek': newCost // Redundant
});
```

---

🎉 **Result: Clean, centralized transfer cost management!**
