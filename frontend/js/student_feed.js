import { db } from './firebase-config.js';
import { 
    collection, query, where, orderBy, onSnapshot, doc, setDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeContainer = document.getElementById('notice-container');

// --- 1. DATA EXTRACTION ---
const rawId = localStorage.getItem("userReg") || ""; 
const userName = localStorage.getItem("userName") || "Student";
const studentRegNum = Number(rawId); 

let myDept = "";
let myClass = "";

if (rawId.length >= 8) {
    myDept = rawId.substring(2, 5); 
    myClass = rawId.substring(0, 5);
}

window.allNotices = {}; 

// --- 2. URL FILTER LOGIC ---
const urlParams = new URLSearchParams(window.location.search);
const filterType = urlParams.get('filter'); 

let activeTargets = [myClass]; 
if (filterType === "OFFICIAL") activeTargets = ["ALL"];
else if (filterType === "DEPT") activeTargets = [myDept];
else if (filterType === "CLASS") activeTargets = [myClass];

// --- 3. THE QUERY ---
const q = query(
    collection(db, "notices"),
    where("targetCode", "in", activeTargets),
    orderBy("createdAt", "desc")
);

// ... (Keep Section 1, 2, and 3 the same) ...

// --- 4. REAL-TIME LISTENER WITH AUTO-PIN ---
onSnapshot(q, (snapshot) => {
    if (!noticeContainer) return;
    noticeContainer.innerHTML = ''; 
    const now = new Date();
    
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    let pinnedNotices = [];
    let regularNotices = [];

    snapshot.forEach((docSnap) => {
        const notice = docSnap.data();
        const id = docSnap.id;

        // --- RANGE FILTERING LOGIC ---
        const start = Number(notice.start_reg);
        const end = Number(notice.end_reg);
        if (!isNaN(start) && !isNaN(end) && start !== 0 && end !== 0) {
            if (studentRegNum < start || studentRegNum > end) return; 
        }

        // --- EXPIRY LOGIC ---
        const expiryDate = notice.expiresAt?.toDate ? notice.expiresAt.toDate() : (notice.expiresAt ? new Date(notice.expiresAt) : null);
        if (expiryDate && expiryDate <= now) return; 

        window.allNotices[id] = notice; 

        // --- AUTO-PIN LOGIC ---
        let isPinned = false;
        if (notice.event_date) {
            const eventDate = new Date(notice.event_date);
            if (eventDate <= twoDaysFromNow && eventDate >= now.setHours(0,0,0,0)) {
                isPinned = true;
            }
        }

        // --- THEME COLORS (Updated to Deep Blue) ---
        const primaryBlue = "#1a237e";
        const accentColor = notice.authorRole === "admin" ? "#d32f2f" : primaryBlue;
        let attachmentIcon = notice.attachmentUrl ? `<i class="fas fa-paperclip" style="margin-left:8px; font-size:0.8rem; opacity:0.6;"></i>` : "";

        // WhatsApp Style Time logic
        const displayTime = notice.postedTime || ""; // Retrieves "10:45 AM" from Firestore

        const cardHtml = `
            <div class="notice-card" id="student-card-${id}" onclick="showNoticePopup('${id}')" 
                 style="cursor:pointer; background:white; padding:18px; border-radius:15px; margin-bottom:15px; 
                 border-left:6px solid ${isPinned ? '#ff9800' : accentColor}; 
                 box-shadow: ${isPinned ? '0 4px 15px rgba(255,152,0,0.2)' : '0 4px 12px rgba(0,0,0,0.08)'}; 
                 transition: transform 0.2s; position:relative;">
                
                ${isPinned ? `<div style="position:absolute; top:-10px; right:10px; background:#ff9800; color:white; font-size:0.65rem; padding:3px 10px; border-radius:10px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.1); z-index:5;"><i class="fas fa-thumbtack"></i> UPCOMING</div>` : ''}

                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div style="font-weight:800; color:${isPinned ? '#e65100' : accentColor}; font-size:1.05rem; flex:1; padding-right:10px; word-wrap: break-word;">
                        ${notice.title} ${attachmentIcon}
                    </div>
                    ${expiryDate ? `<div id="timer-${id}" style="color: #d32f2f; font-size: 0.7rem; font-weight: bold; background: #fff5f5; padding: 4px 8px; border-radius: 6px; white-space:nowrap;"><i class="fas fa-clock"></i> <span id="time-text-${id}">...</span></div>` : ''}
                </div>
                
                ${notice.event_date ? `<div style="font-size:0.75rem; color:#e65100; font-weight:bold; margin-bottom:8px;"><i class="fas fa-calendar-alt"></i> Event: ${new Date(notice.event_date).toLocaleDateString()}</div>` : ''}

                <div style="font-size:0.85rem; color:#666; line-height:1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-wrap: break-word; margin-bottom:10px;">
                    ${notice.content}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:#aaa; border-top: 1px solid #f9f9f9; padding-top:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span><i class="fas fa-user"></i> ${notice.authorName}</span>
                        <span style="color:#bbb; font-weight:normal;">• ${displayTime}</span>
                    </div>
                    <span style="background:#e8eaf6; color:${primaryBlue}; padding:2px 8px; border-radius:10px; font-weight:bold;">${notice.targetCode}</span>
                </div>
            </div>`;

        if (isPinned) pinnedNotices.push({html: cardHtml, id: id, expiry: expiryDate});
        else regularNotices.push({html: cardHtml, id: id, expiry: expiryDate});
    });

    [...pinnedNotices, ...regularNotices].forEach(item => {
        noticeContainer.innerHTML += item.html;
        if (item.expiry) startLiveTimer(item.id, item.expiry);
    });
});

// --- 5. POPUP MODAL (Notice Popup) ---
window.showNoticePopup = function(id) {
    const notice = window.allNotices[id]; 
    if (!notice) return;
    recordNoticeView(id);

    const existing = document.getElementById('notice-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = "notice-overlay";
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:10000; padding:15px; backdrop-filter: blur(4px); box-sizing: border-box;";

    const primaryBlue = "#1a237e";

    let mediaHtml = "";
    if (notice.attachmentUrl) {
        if (notice.attachmentType === 'image') {
            mediaHtml = `<div style="margin-top:20px; text-align:center; width:100%;"><a href="${notice.attachmentUrl}" target="_blank"><img src="${notice.attachmentUrl}" style="max-width:100%; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); display:block; margin:0 auto; max-height:350px; object-fit:contain;"></a></div>`;
        } else if (notice.attachmentType === 'video') {
            mediaHtml = `<div style="margin-top:20px; width:100%;"><video controls style="width:100%; border-radius:12px; background:black; display:block;"><source src="${notice.attachmentUrl}"></video></div>`;
        } else {
            mediaHtml = `<a href="${notice.attachmentUrl}" target="_blank" style="display:flex; align-items:center; gap:12px; background:#e8eaf6; padding:15px; border-radius:12px; margin-top:20px; text-decoration:none; border:1px solid #c5cae9; word-break: break-all;"><i class="fas fa-file-alt" style="color:${primaryBlue}; font-size:1.2rem;"></i><span style="color:${primaryBlue}; font-weight:bold;">Download Attachment</span></a>`;
        }
    }

    const linkedContent = notice.content.replace(/(https?:\/\/[^\s]+)/g, `<a href="$1" target="_blank" style="color:${primaryBlue}; text-decoration:underline; font-weight:bold; word-break: break-all;">$1</a>`);

    overlay.innerHTML = `
        <div style="background:white; width:100%; max-width:480px; max-height:85vh; border-radius:20px; position:relative; display:flex; flex-direction:column; overflow:hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.2); box-sizing: border-box;">
            <div style="padding:20px 25px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; background:#fff;">
                <h2 style="color:${primaryBlue}; margin:0; font-size:1.2rem; line-height:1.2; padding-right:35px; word-wrap: break-word;">${notice.title}</h2>
                <button onclick="document.getElementById('notice-overlay').remove()" style="position:absolute; top:15px; right:15px; border:none; background:#eee; width:32px; height:32px; border-radius:50%; font-size:1.4rem; cursor:pointer; color:#666; display:flex; align-items:center; justify-content:center; z-index:11;">&times;</button>
            </div>
            <div style="padding:20px 25px; overflow-y:auto; flex:1; overflow-x:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                   <span style="font-size:0.75rem; color:#999;"><i class="fas fa-clock"></i> Posted at ${notice.postedTime || '--:--'}</span>
                </div>
                ${notice.event_date ? `<div style="background:#fff3e0; color:#e65100; padding:10px; border-radius:10px; margin-bottom:15px; font-weight:bold; font-size:0.9rem;"><i class="fas fa-calendar-star"></i> Scheduled Event: ${new Date(notice.event_date).toLocaleDateString()}</div>` : ''}
                <div style="color:#333; line-height:1.7; white-space:pre-wrap; font-size:1rem; word-wrap: break-word; overflow-wrap: break-word;">${linkedContent}</div>
                ${mediaHtml}
            </div>
            <div style="padding:15px 25px; background:#f9f9f9; border-top:1px solid #eee; font-size:0.8rem; color:#888; display:flex; justify-content:space-between; align-items:center;">
                <span><i class="fas fa-user-circle"></i> ${notice.authorName}</span>
                <span style="color:${primaryBlue}; font-weight:bold; background:#fff; padding:2px 8px; border-radius:8px; border:1px solid #eee;">${notice.targetCode}</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

// ... (Keep Helpers startLiveTimer and recordNoticeView the same) ...

// --- 6. HELPERS ---
function startLiveTimer(id, expiryDate) {
    const timerInterval = setInterval(() => {
        const timeLeft = expiryDate - new Date();
        const card = document.getElementById(`student-card-${id}`);
        if (timeLeft <= 0) {
            if (card) card.remove();
            clearInterval(timerInterval);
            return;
        }
        const mins = Math.floor((timeLeft / 1000 / 60) % 60);
        const secs = Math.floor((timeLeft / 1000) % 60);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const timeText = document.getElementById(`time-text-${id}`);
        if (timeText) timeText.innerText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`;
    }, 1000);
}

async function recordNoticeView(noticeId) {
    if (!rawId || !noticeId) return;
    try {
        const viewRef = doc(db, "notices", noticeId, "views", rawId);
        await setDoc(viewRef, { viewerName: userName, viewedAt: serverTimestamp(), studentId: rawId }, { merge: true });
    } catch (e) { console.error(e); }
}