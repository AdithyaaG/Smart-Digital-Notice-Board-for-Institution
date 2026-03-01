import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById('notice-container');

// 1. Get the 5-digit Class Code (e.g., 23107)
const rawId = localStorage.getItem("userReg") || "";
const myClass = rawId.substring(0, 5); 

if (container && myClass) {
    // 2. Query ONLY for this specific class
    const q = query(
        collection(db, "notices"),
        where("targetCode", "==", myClass), 
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">No class updates from staff yet.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            renderClassNotice(data);
        });
    }, (error) => {
        console.error("Firestore Error:", error);
        // If you see an index error here, click the link in the console
    });
}

function renderClassNotice(data) {
    const card = `
        <div class="notice-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 5px solid #7b1fa2; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between;">
                <h3 style="color: #7b1fa2; margin: 0; font-size: 1.1rem;">${data.title}</h3>
                <span style="background: #f3e5f5; color: #7b1fa2; padding: 2px 8px; border-radius: 5px; font-size: 10px; font-weight: bold;">STAFF</span>
            </div>
            <p style="color: #444; margin: 10px 0;">${data.content}</p>
            <div style="font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 8px;">
                Posted by: ${data.authorName}
            </div>
        </div>
    `;
    container.innerHTML += card;
}