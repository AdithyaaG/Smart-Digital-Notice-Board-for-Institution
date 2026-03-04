import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeContainer = document.getElementById('notice-container');

// 1. Get the HOD's Dept Code (e.g., "107")
const rawDept = localStorage.getItem("userDept") || "";
const myDeptCode = rawDept.length >= 5 ? rawDept.substring(2, 5) : rawDept;

// --- TIME SNAP HELPER ---
function formatWhatsAppTime(date) {
    if (!date) return "Just now";
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStr = date.toLocaleTimeString([], options);

    if (diffDays === 0) return `Today, ${timeStr}`;
    if (diffDays === 1) return `Yesterday, ${timeStr}`;
    
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

// 2. Query for notices posted BY this department
const q = query(
    collection(db, "notices"),
    where("targetCode", "==", myDeptCode),
    orderBy("createdAt", "desc")
);

// 3. Listen for changes
onSnapshot(q, (snapshot) => {
    if (noticeContainer) {
        noticeContainer.innerHTML = '';
        if (snapshot.empty) {
            noticeContainer.innerHTML = '<p style="text-align:center; color:#666; margin-top:20px;">You haven\'t posted any notices yet.</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            renderDeptNotice(docSnap.id, docSnap.data());
        });
    }
});

// 4. Specialized Render for Management (Updated with Time Snap)
function renderDeptNotice(id, data) {
    // Calculate the Time Snap
    const postDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
    const timeDisplay = formatWhatsAppTime(postDate);

    const card = `
        <div class="notice-card" id="card-${id}" style="background: white; padding: 18px; border-radius: 15px; margin-bottom: 15px; border-left: 6px solid #b3004b; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h3 style="color: #b3004b; margin: 0; font-size: 1.1rem;">${data.title}</h3>
                    <small style="color: #999; font-weight: bold;">Targeted to: ${data.targetCode}</small>
                </div>
                <button onclick="deleteNotice('${id}')" style="background: #ff4d4d; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            
            <p style="color: #444; margin: 12px 0; font-size: 0.95rem; line-height: 1.4;">${data.content}</p>
            
            <div style="margin-top: 10px; border-top: 1px solid #f5f5f5; padding-top: 10px; font-size: 0.75rem; color: #888;">
                <i class="fas fa-history"></i> Posted: <span style="font-weight: bold; color: #555;">${timeDisplay}</span>
            </div>
        </div>
    `;
    noticeContainer.innerHTML += card;
}

// 5. Global Delete Function
window.deleteNotice = async function(id) {
    if (confirm("Are you sure you want to delete this notice? This cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "notices", id));
            // UI updates automatically via onSnapshot
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting notice.");
        }
    }
};