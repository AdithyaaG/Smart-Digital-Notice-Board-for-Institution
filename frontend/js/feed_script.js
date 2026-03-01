import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Get the student's class code from LocalStorage
const userClass = localStorage.getItem("userClass"); 

const noticeContainer = document.getElementById('notice-container');

// 3. Create the Smart Query
const q = query(
    collection(db, "notices"),
    where("targetCode", "in", ["ALL", userClass]),
    orderBy("createdAt", "desc") 
);

onSnapshot(q, (snapshot) => {
    noticeContainer.innerHTML = ''; 
    
    snapshot.forEach((doc) => {
        const notice = doc.data();
        renderNotice(notice);
    });
});

function renderNotice(data) {
    // Check if an image URL exists. If it does, create an <img> tag.
    let attachmentHtml = "";
    if (data.attachmentUrl) {
        attachmentHtml = `
            <div class="notice-image-container" style="margin: 10px 0;">
                <img src="${data.attachmentUrl}" alt="Notice Attachment" 
                     style="width: 100%; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);"
                     onerror="this.parentElement.style.display='none'">
            </div>
        `;
    }

    const card = `
        <div class="notice-card" style="margin-bottom: 20px; padding: 15px; background: #fff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="color: #b3004b; margin-bottom: 8px;">${data.title}</h3>
            <p style="color: #333; line-height: 1.4;">${data.content}</p>
            
            ${attachmentHtml} <div class="notice-meta" style="font-size: 0.8rem; color: #777; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                <span>Posted by: ${data.authorName}</span><br>
                <span>Target: ${data.targetCode}</span>
            </div>
        </div>
    `;
    noticeContainer.innerHTML += card;
}

