import { db } from './firebase-config.js'; 
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const scrollingBar = document.getElementById('scrolling-notice-bar');
const marqueeContainer = document.getElementById('marquee-container');

// --- 1. GET STUDENT DATA ---
const userEmail = localStorage.getItem("userEmail");
const rawId = localStorage.getItem("userReg") || ""; 

async function startMarquee() {
    let myDept = "";
    let myClassS1 = "";
    let myClassS2 = "";

    // --- 2. DYNAMIC DETECTION (Match your Feed Logic) ---
    if (rawId.length >= 8) {
        myDept = rawId.substring(2, 5); // Extracts '107' or '108'
        const year = rawId.substring(0, 2);
        myClassS1 = `${myDept}_${year}_Batch_UG-S1`;
        myClassS2 = `${myDept}_${year}_Batch_UG-S2`;
    }

    // List of allowed targets for this specific student
    const allowedTargets = ["ALL", myDept, myClassS1, myClassS2].filter(t => t !== "");

    // --- 3. FILTERED QUERY ---
    // Only fetch the last 10 notices that are actually meant for THIS student
    const q = query(
        collection(db, "notices"), 
        where("targetCode", "in", allowedTargets),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
        if (!marqueeContainer) return;
        
        if (snapshot.empty) {
            scrollingBar.style.display = 'none';
            return;
        }

        let fullScrollText = "";
        const now = new Date();

        snapshot.forEach((docSnap) => {
            const notice = docSnap.data();
            const createdAt = notice.createdAt?.toDate ? notice.createdAt.toDate() : new Date(notice.createdAt);
            
            // Only show notices from the last 24 hours in the marquee
            if (now - createdAt < 24 * 60 * 60 * 1000) {
                const role = (notice.authorRole || "Official").toUpperCase();
                
                let roleColor = "#1df704"; 
                let targetPage = "student_admincn.html";

                if(role === "DEPARTMENT") {
                    roleColor = "#00bfa5"; 
                    targetPage = "student_depcn.html";
                } else if(role === "STAFF") {
                    roleColor = "#ffd700"; 
                    targetPage = "student_notices.html";
                }

                fullScrollText += `
                    <a href="${targetPage}" style="color: white; text-decoration: none; margin-right: 80px; display: inline-flex; align-items: center;">
                        <span style="color: ${roleColor}; font-weight: 900; margin-right: 5px;">[${role}]</span> 
                        <span style="margin-right: 10px;">${notice.title}</span>
                        <span class="marquee-btn" style="background:${roleColor}; color:black; font-size:10px; padding:2px 5px; border-radius:3px; font-weight:bold;">VIEW</span>
                    </a>`;
            }
        });

        if (fullScrollText !== "") {
            marqueeContainer.innerHTML = fullScrollText + fullScrollText; 
            scrollingBar.style.display = 'block';
        } else {
            scrollingBar.style.display = 'none';
        }
    });
}

startMarquee();