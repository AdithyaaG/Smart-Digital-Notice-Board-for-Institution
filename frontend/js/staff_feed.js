import { db, auth } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const noticeContainer = document.getElementById('staff-notice-container');

// 1. Listen for Auth State to get the logged-in Staff's email
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadMyNotices(user.email);
    } else {
        if (noticeContainer) noticeContainer.innerHTML = '<p>Please log in to see your posts.</p>';
    }
});

function loadMyNotices(staffEmail) {
    // 2. QUERY: Only fetch notices WHERE authorEmail matches the logged-in user
    // This prevents Admin or other Staff notices from showing here
    const q = query(
        collection(db, "notices"),
        where("authorEmail", "==", staffEmail),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        if (!noticeContainer) return;
        noticeContainer.innerHTML = ''; 
        const now = new Date(); 

        if (snapshot.empty) {
            noticeContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">You haven\'t posted any notices yet.</p>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const notice = docSnap.data();
            const id = docSnap.id;

            // --- AUTO-HIDE LOGIC ---
            // Even in staff view, we show if it's expired so they can see what students see
            const isExpired = notice.expiresAt && notice.expiresAt.toDate() < now;
            const statusColor = isExpired ? "#d32f2f" : "#2e7d32";
            const statusText = isExpired ? "EXPIRED (Hidden from Students)" : "Active";

            const expiryLabel = notice.expiresAt ? `
                <div style="color: ${statusColor}; font-size: 0.75rem; font-weight: bold; margin-bottom: 5px;">
                    <i class="fas fa-clock"></i> ${statusText}: ${notice.expiresAt.toDate().toLocaleString()}
                </div>
            ` : '<div style="color: #666; font-size: 0.75rem;">No Expiry (Stays forever)</div>';

            const card = `
                <div class="notice-card" style="background:white; padding:18px; border-radius:12px; margin-bottom:15px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border-left:6px solid #b3004b; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h3 style="color:#b3004b; margin:0; font-size:1.1rem;">${notice.title}</h3>
                        <button onclick="deleteNotice('${id}')" style="background:none; border:none; color:#ff5252; cursor:pointer; font-size:1.1rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <p style="color:#444; font-size:0.95rem; line-height:1.4; margin:12px 0;">${notice.content}</p>
                    
                    ${expiryLabel}

                    <div style="margin-top:10px; border-top:1px solid #eee; padding-top:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#999;"><i class="fas fa-calendar"></i> Posted: ${notice.createdAt?.toDate().toLocaleDateString() || 'Just now'}</span>
                        <span style="font-size:0.7rem; background:#f0f0f0; padding:2px 6px; border-radius:4px;">Target: ${notice.targetCode}</span>
                    </div>
                </div>`;
            noticeContainer.innerHTML += card;
        });
    });
}

// 3. Manual Delete Function for Staff
window.deleteNotice = async function(id) {
    if (confirm("Are you sure you want to permanently delete this notice?")) {
        try {
            await deleteDoc(doc(db, "notices", id));
            alert("Notice deleted.");
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        }
    }
};