import { db, auth } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const noticeContainer = document.getElementById('staff-notice-container');

// Helper function for WhatsApp-style timestamps (Time of day)
function formatWhatsAppTime(date) {
    if (!date) return "Just now";
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString([], options);
}

// Helper function for the Date Separator Line (e.g., "03-03-26 Tuesday")
function formatSeparatorDate(date) {
    if (!date) return "";
    const datePart = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    }).replace(/\//g, '-'); 
    
    const dayPart = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${datePart} ${dayPart}`;
}

// 1. Listen for Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadMyNotices(user.email);
    } else {
        if (noticeContainer) noticeContainer.innerHTML = '<p>Please log in to see your posts.</p>';
    }
});

function loadMyNotices(staffEmail) {
    const q = query(
        collection(db, "notices"),
        where("authorEmail", "==", staffEmail),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        if (!noticeContainer) return;
        noticeContainer.innerHTML = ''; 
        const now = new Date(); 
        let lastProcessedDateString = "";

        if (snapshot.empty) {
            noticeContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">You haven\'t posted any notices yet.</p>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const notice = docSnap.data();
            const id = docSnap.id;

            // --- COLOR & PRIORITY LOGIC ---
            const isEvent = notice.priority?.toLowerCase().includes('event');
            const accentColor = isEvent ? "#ff9800" : "#1a237e"; // Orange for events, Deep Blue for staff

            // --- DATE LOGIC ---
            const postDate = notice.createdAt?.toDate ? notice.createdAt.toDate() : (notice.createdAt ? new Date(notice.createdAt) : new Date());
            const currentNoticeDateString = formatSeparatorDate(postDate);

            // --- INJECT DATE SEPARATOR LINE ---
            if (currentNoticeDateString !== lastProcessedDateString) {
                const dateLineHtml = `
                    <div style="width: 100%; border-top: 2px solid #333; margin: 30px 0 15px; position: relative; clear: both;">
                        <span style="position: absolute; top: -14px; left: 10px; background: #f0f2f5; padding: 0 12px; font-weight: 800; color: #333; font-size: 0.95rem; font-family: sans-serif; letter-spacing: 0.5px;">
                            ${currentNoticeDateString}
                        </span>
                    </div>`;
                noticeContainer.innerHTML += dateLineHtml;
                lastProcessedDateString = currentNoticeDateString;
            }

            // --- TIME DISPLAY LOGIC ---
            const timeOnly = formatWhatsAppTime(postDate);
            const diffDays = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
            let dayLabel = diffDays === 0 ? "Today" : (diffDays === 1 ? "Yesterday" : postDate.toLocaleDateString([], { month: 'short', day: 'numeric' }));

            // --- AUTO-HIDE / EXPIRY LOGIC ---
            const expiryDateObj = notice.expiresAt?.toDate ? notice.expiresAt.toDate() : (notice.expiresAt ? new Date(notice.expiresAt) : null);
            const isExpired = expiryDateObj && expiryDateObj < now;
            const statusColor = isExpired ? "#d32f2f" : (isEvent ? "#ef6c00" : "#2e7d32");
            const statusText = isExpired ? "EXPIRED (Hidden)" : "Active";

            const expiryLabel = expiryDateObj ? `
                <div style="color: ${statusColor}; font-size: 0.7rem; font-weight: bold; margin-bottom: 5px; background: ${isExpired ? '#fff1f0' : (isEvent ? '#fff3e0' : '#f1f8e9')}; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    <i class="fas fa-clock"></i> ${statusText}: ${expiryDateObj.toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}
                </div>
            ` : '<div style="color: #666; font-size: 0.7rem; margin-bottom: 5px;"><i class="fas fa-infinity"></i> Permanent Notice</div>';

            const card = `
                <div class="notice-card" style="background:white; padding:18px; border-radius:15px; margin-bottom:15px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border-left:6px solid ${isExpired ? '#999' : accentColor}; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div style="flex:1;">
                            <h3 style="color:${accentColor}; margin:0; font-size:1.1rem; padding-right:10px;">
                                ${isEvent ? '<i class="fas fa-calendar-star"></i> ' : ''}${notice.title}
                            </h3>
                            ${notice.event_date ? `<p style="margin:4px 0; font-size:0.8rem; color:#e65100; font-weight:700;"><i class="fas fa-calendar-day"></i> Event Date: ${notice.event_date}</p>` : ''}
                        </div>
                        <button onclick="deleteNotice('${id}')" style="background:#fff1f0; border:none; color:#ff5252; cursor:pointer; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:0.3s;">
                            <i class="fas fa-trash" style="font-size:0.9rem;"></i>
                        </button>
                    </div>
                    
                    <p style="color:#444; font-size:0.9rem; line-height:1.4; margin:12px 0;">${notice.content}</p>
                    
                    ${expiryLabel}

                    <div style="margin-top:10px; border-top:1px solid #f5f5f5; padding-top:10px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#888;">
                            <i class="fas fa-history"></i> Posted: <b>${dayLabel}, ${timeOnly}</b>
                        </span>
                        <span style="font-size:0.7rem; color:${accentColor}; background:${isEvent ? '#fff3e0' : '#e8eaf6'}; padding:2px 8px; border-radius:10px; font-weight:bold; border: 1px solid ${accentColor}44;">
                            ${notice.targetCode}
                        </span>
                    </div>
                </div>`;
            noticeContainer.innerHTML += card;
        });
    });
}

// 3. Manual Delete Function
window.deleteNotice = async function(id) {
    if (confirm("Are you sure you want to permanently delete this notice?")) {
        try {
            await deleteDoc(doc(db, "notices", id));
        } catch (e) {
            console.error(e);
            alert("Delete failed.");
        }
    }
};