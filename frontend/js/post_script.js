import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

// 1. Cloudinary Upload Logic
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return { url: data.secure_url, type: data.resource_type };
    } catch (error) {
        console.error("Cloudinary Error:", error);
        return null;
    }
}

// 2. Main Publish Function
window.publishNotice = async function() {
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const expiryValue = document.getElementById('expiryDateTime').value;
    const priority = document.getElementById('noticePriority').value;
    const eventDate = document.getElementById('eventDate').value; 
    
    // Get file from the single input you have in HTML
    const fileInput = document.getElementById('file-input');
    const file = fileInput ? fileInput.files[0] : null;

    const user = auth.currentUser;
    if (!user) {
        alert("Session expired. Please log in.");
        return;
    }

    if (!title || !content) {
        alert("Please fill in the title and content!");
        return;
    }

    const postBtn = document.querySelector('.btn-post');
    if (postBtn) {
        postBtn.disabled = true;
        postBtn.innerText = "POSTING...";
    }

    let attachmentData = null;
    if (file) {
        attachmentData = await uploadToCloudinary(file);
        if (!attachmentData) {
            alert("File upload failed.");
            if (postBtn) {
                postBtn.disabled = false;
                postBtn.innerText = "POST";
            }
            return;
        }
    }

    try {
        await addDoc(collection(db, "notices"), {
            title: title,
            content: content,
            priority: priority,
            event_date: eventDate || null, 
            authorName: localStorage.getItem("userName") || "Administrator",
            authorEmail: user.email,
            authorRole: "admin", 
            targetCode: "ALL", 
            attachmentUrl: attachmentData ? attachmentData.url : null,
            attachmentType: attachmentData ? attachmentData.type : null,
            createdAt: serverTimestamp(),
            expiresAt: expiryValue ? new Date(expiryValue) : null
        });

        alert("Broadcast Notice Sent to All Students!");
        window.location.href = "admin_home.html"; 
    } catch (error) {
        console.error("Firestore Error:", error);
        alert("Post failed: " + error.message);
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.innerText = "POST";
        }
    }
};

// 3. Simple File Change Listener
document.getElementById('file-input')?.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        alert("File selected: " + e.target.files[0].name);
    }
});