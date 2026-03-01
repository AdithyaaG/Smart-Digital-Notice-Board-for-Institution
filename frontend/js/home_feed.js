import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function updateNotificationCenter() {
    const rawId = localStorage.getItem("userReg") || "";
    const myDept = rawId.substring(2, 5); 
    
    // 1. Get current "Last Seen" times from LocalStorage
    const lastAdminSeen = localStorage.getItem("lastAdminSeen") || 0;
    const lastDeptSeen = localStorage.getItem("lastDeptSeen") || 0;

    // 2. Function to fetch and update UI
    async function checkNew(targets, badgeId, reminderId, storageKey) {
        const q = query(collection(db, "notices"), where("targetCode", "in", targets));
        const snapshot = await getDocs(q);
        
        let newCount = 0;
        snapshot.forEach(doc => {
            // Compare notice timestamp with last seen time
            if (doc.data().createdAt.toMillis() > storageKey) {
                newCount++;
            }
        });

        const badge = document.getElementById(badgeId);
        const reminder = document.getElementById(reminderId);

        if (newCount > 0) {
            badge.innerText = newCount;
            badge.style.display = "block";
            // Update the placeholder with your custom message logic here
            reminder.innerText = `You have ${newCount} unread updates!`; 
        } else {
            badge.style.display = "none";
            reminder.innerText = "All caught up!"; 
        }
    }

    // Run for both categories
    await checkNew(["ALL"], "admin-count", "admin-reminder", lastAdminSeen);
    await checkNew([myDept], "dept-count", "dept-reminder", lastDeptSeen);
}

// Run on page load
updateNotificationCenter();