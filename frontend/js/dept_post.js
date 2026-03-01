import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cloudinary Configuration
const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    if (progressDiv) progressDiv.style.display = 'block';

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        if (progressDiv) progressDiv.style.display = 'none';
        return { url: data.secure_url, type: data.resource_type };
    } catch (error) {
        console.error("Cloudinary Error:", error);
        if (progressDiv) progressDiv.style.display = 'none';
        return null;
    }
}

window.publishDeptNotice = async function() {
    const titleElement = document.getElementById('noticeTitle');
    const contentElement = document.getElementById('noticeContent');
    const expiryElement = document.getElementById('expiryDate');
    const priorityElement = document.getElementById('noticePriority');
    const eventDateElement = document.getElementById('eventDate'); // Added this
    const fileInput = document.getElementById('file-input');
    
    const title = titleElement ? titleElement.value.trim() : "";
    const content = contentElement ? contentElement.value.trim() : "";
    const expiryValue = expiryElement ? expiryElement.value : "";
    const priority = priorityElement ? priorityElement.value : "normal";
    const eventDate = eventDateElement ? eventDateElement.value : null; // Get event date
    
    const user = auth.currentUser;
    if (!user) {
        alert("Authentication error. Please log in again.");
        return;
    }

    if (!title || !content) {
        alert("Please enter both Title and Content!");
        return;
    }

    // Capture the exact time of posting for display
    const now = new Date();
    const postedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let attachmentData = null;
    if (fileInput && fileInput.files.length > 0) {
        const postBtn = document.querySelector('.btn-post');
        if (postBtn) {
            postBtn.disabled = true;
            postBtn.innerText = "UPLOADING...";
        }
        attachmentData = await uploadToCloudinary(fileInput.files[0]);
        if (!attachmentData) {
            alert("File upload failed.");
            if (postBtn) {
                postBtn.disabled = false;
                postBtn.innerText = "POST TO DEPT";
            }
            return; 
        }
    }

    let expiryTimestamp = expiryValue ? new Date(expiryValue) : null;
    const rawDeptCode = localStorage.getItem("userDept") || ""; 
    const authorName = localStorage.getItem("userName") || "HOD";
    let finalTargetCode = rawDeptCode.length >= 5 ? rawDeptCode.substring(2, 5) : rawDeptCode;

    try {
        await addDoc(collection(db, "notices"), {
            title: title,
            content: content,
            priority: priority,
            event_date: eventDate, // CRITICAL: Saves the date for Auto-Pin
            postedTime: postedTime, // Added time of posting
            authorName: authorName,
            authorEmail: user.email,
            authorRole: "department", 
            targetCode: finalTargetCode,
            attachmentUrl: attachmentData ? attachmentData.url : null, 
            attachmentType: attachmentData ? attachmentData.type : null, 
            createdAt: serverTimestamp(),
            expiresAt: expiryTimestamp
        });

        alert("Notice successfully posted!");
        window.location.href = "department_home.html"; 
    } catch (error) {
        console.error("Firestore Error:", error);
        alert("Failed to post: " + error.message);
    }
};