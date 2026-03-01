import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeContainer = document.getElementById('notice-container');

// 1. Get the HOD's Dept Code (e.g., "107")
const rawDept = localStorage.getItem("userDept") || "";
const myDeptCode = rawDept.length >= 5 ? rawDept.substring(2, 5) : rawDept;

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
            noticeContainer.innerHTML = '<p style="text-align:center; color:#666;">You haven\'t posted any notices yet.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            renderDeptNotice(doc.id, doc.data());
        });
    }
});

// 4. Specialized Render for Management (with Delete Button)
function renderDeptNotice(id, data) {
    const card = `
        <div class="notice-card" id="card-${id}" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 5px solid #b3004b; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h3 style="color: #b3004b; margin: 0;">${data.title}</h3>
                    <small style="color: #999;">Targeted to: ${data.targetCode}</small>
                </div>
                <button onclick="deleteNotice('${id}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            <p style="color: #444; margin: 10px 0;">${data.content}</p>
        </div>
    `;
    noticeContainer.innerHTML += card;
}

// 5. Global Delete Function
window.deleteNotice = async function(id) {
    if (confirm("Are you sure you want to delete this notice? This cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "notices", id));
            alert("Notice removed successfully.");
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting notice.");
        }
    }
};