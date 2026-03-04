import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeContainer = document.getElementById('admin-notice-container');

// Helper function for WhatsApp-style timestamps
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
        
        if (snapshot.empty) {
            noticeContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">No official announcements found.</p>';
            return;
        }

        snapshot.forEach((snapDoc) => {
            const notice = snapDoc.data();
            
            // --- COLOR LOGIC BASED ON PRIORITY/CATEGORY ---
            // If priority is 'campus event' or 'event', use Orange. Otherwise, use Red.
            const isEvent = notice.priority?.toLowerCase().includes('event') || 
                            notice.category?.toLowerCase().includes('event');
            
            const accentColor = isEvent ? "#ff9800" : "#d32f2f";
            const lightBg = isEvent ? "#fff3e0" : "#ffebee";
            const icon = isEvent ? "fa-calendar-star" : "fa-shield-alt";

            // --- TIME SNAP LOGIC ---
            const postDate = notice.createdAt?.toDate ? notice.createdAt.toDate() : (notice.createdAt ? new Date(notice.createdAt) : null);
            const timeDisplay = formatWhatsAppTime(postDate);

            const card = `
                <div class="notice-card" style="background: white; padding: 18px; border-radius: 15px; margin-bottom: 15px; border-left: 6px solid ${accentColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative;">
                    <button onclick="deleteAdminNotice('${snapDoc.id}')" 
                            style="position: absolute; top: 12px; right: 12px; background: ${lightBg}; border: none; color: ${accentColor}; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-trash"></i>
                    </button>
                    
                    <h3 style="color: ${accentColor}; margin-top: 0; font-size: 1.1rem; padding-right: 35px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas ${icon}" style="font-size: 0.9rem;"></i>
                        ${notice.title || "Admin Notice"}
                    </h3>
                    
                    <p style="color: #444; font-size: 0.95rem; line-height: 1.5; margin-bottom: 5px;">${notice.content}</p>
                    
                    ${notice.event_date ? `
                        <div style="font-size: 0.8rem; color: #e65100; font-weight: bold; margin-bottom: 10px;">
                            <i class="fas fa-calendar-alt"></i> Event Date: ${new Date(notice.event_date).toLocaleDateString()}
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #888; margin-top: 10px; border-top: 1px solid #f5f5f5; padding-top: 10px;">
                        <span><i class="fas fa-history"></i> Posted: <b>${timeDisplay}</b></span>
                        <span style="font-weight: bold; color: ${accentColor}; background: ${lightBg}; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                            ${notice.priority || 'OFFICIAL'}
                        </span>
                    </div>
                </div>
            `;
            noticeContainer.innerHTML += card;
        });
    }
});