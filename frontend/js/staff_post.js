import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const statusText = document.getElementById('upload-status');
    if (statusText) statusText.style.display = 'block';

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Media upload failed');
        const data = await response.json();
        if (statusText) statusText.style.display = 'none';
        return { url: data.secure_url, type: data.resource_type };
    } catch (error) {
        console.error("Cloudinary Error:", error);
        if (statusText) statusText.style.display = 'none';
        return null;
    }
}

window.publishStaffNotice = async function() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    const priority = document.getElementById('noticePriority').value; 
    const eventDateInput = document.getElementById('eventDate').value; 
    const expiryInput = document.getElementById('expiryDate').value;
    const fileInput = document.getElementById('staff-file-input');
    const postBtn = document.querySelector('.btn-post');
    
    const classCode = localStorage.getItem("userDept"); 
    const authorName = localStorage.getItem("userName");
    const authorRole = localStorage.getItem("userRole") || "staff"; 

    if (!title || !content) {
        alert("Please fill in both the title and content!");
        return;
    }

    if ((priority === 'event' || priority === 'off_campus') && !eventDateInput) {
        alert("Please select the Event Date to enable Auto-Highlighting!");
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Session expired. Please log in again.");
        return;
    }

    // --- NEW: GENERATE WHATSAPP-STYLE TIME ---
    const now = new Date();
    const postedTime = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    }); 
    // Result: "10:45 AM"
    // -----------------------------------------

    postBtn.disabled = true;
    postBtn.innerText = "POSTING...";

    try {
        let startReg = null;
        let endReg = null;

        const batchQuery = query(
            collection(db, "batches"), 
            where("controller_email", "==", currentUser.email)
        );
        const batchSnap = await getDocs(batchQuery);
        
        if (!batchSnap.empty) {
            const batchData = batchSnap.docs[0].data();
            startReg = Number(batchData.start_reg);
            endReg = Number(batchData.end_reg);
        }

        let attachmentUrl = null;
        let attachmentType = null;
        if (fileInput.files[0]) {
            const uploadedMedia = await uploadToCloudinary(fileInput.files[0]);
            if (uploadedMedia) {
                attachmentUrl = uploadedMedia.url;
                attachmentType = uploadedMedia.type;
            }
        }

        let finalExpiry = null;
        if (expiryInput) {
            finalExpiry = Timestamp.fromDate(new Date(expiryInput));
        }

        // SAVE TO FIRESTORE
        await addDoc(collection(db, "notices"), {
            title: title,
            content: content,
            priority: priority,
            event_date: eventDateInput || null,
            postedTime: postedTime,        // <--- NEW FIELD SAVED HERE
            authorName: authorName,
            authorEmail: currentUser.email,
            authorRole: authorRole,
            targetCode: classCode, 
            start_reg: Number(startReg), 
            end_reg: Number(endReg),
            attachmentUrl: attachmentUrl,
            attachmentType: attachmentType,
            createdAt: serverTimestamp(),
            expiresAt: finalExpiry
        });

        alert("Notice published successfully!");
        window.location.href = "staff_home.html"; 
    } catch (error) {
        console.error("Error publishing notice:", error);
        alert("Error: " + error.message);
        postBtn.disabled = false;
        postBtn.innerText = "POST";
    }
};