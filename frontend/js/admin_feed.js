import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeContainer = document.getElementById('admin-notice-container');

// 1. Global Delete Function for Admin
window.deleteAdminNotice = async function(id) {
    if (confirm("Permanently delete this official announcement?")) {
        try {
            await deleteDoc(doc(db, "notices", id));
            alert("Notice removed from all student feeds.");
        } catch (error) {
            console.error("Delete error:", error);
        }
    }
};

// 2. Query only notices posted by Admin
const q = query(
    collection(db, "notices"),
    where("authorRole", "==", "admin"),
    orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {
    if (noticeContainer) {
        noticeContainer.innerHTML = '';
        snapshot.forEach((snapDoc) => {
            const notice = snapDoc.data();
            const card = `
                <div class="notice-card" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 5px solid #d32f2f; position: relative;">
                    <button onclick="deleteAdminNotice('${snapDoc.id}')" 
                            style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ff4d4d; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                    <h3 style="color: #d32f2f; margin-top: 0;">${notice.title || "Admin Notice"}</h3>
                    <p style="color: #444;">${notice.content}</p>
                    <div style="font-size: 0.7rem; color: #888; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px;">
                        Sent to: ALL STUDENTS
                    </div>
                </div>
            `;
            noticeContainer.innerHTML += card;
        });
    }
});