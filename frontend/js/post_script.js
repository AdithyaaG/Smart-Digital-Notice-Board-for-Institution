import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

// 1. Cloudinary Upload Logic (Modified to handle a single file)
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Upload failed');
        }

        const data = await response.json();
        return { 
            url: data.secure_url, 
            type: data.resource_type // 'image', 'video', or 'raw'
        };
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
    
    // Get ALL files from the input
    const fileInput = document.getElementById('file-input');
    const files = fileInput ? Array.from(fileInput.files) : [];

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
        postBtn.innerText = "UPLOADING...";
    }

    // --- MULTIPLE FILE UPLOAD LOGIC ---
    let attachments = [];
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            if (postBtn) postBtn.innerText = `UPLOADING (${i + 1}/${files.length})...`;
            
            const uploadedData = await uploadToCloudinary(files[i]);
            if (uploadedData) {
                attachments.push(uploadedData);
            } else {
                console.error(`Failed to upload: ${files[i].name}`);
                // Optional: stop if one fails, or continue. Here we continue.
            }
        }

        if (attachments.length === 0 && files.length > 0) {
            alert("All file uploads failed. Please check your connection.");
            if (postBtn) {
                postBtn.disabled = false;
                postBtn.innerText = "POST";
            }
            return;
        }
    }

    if (postBtn) postBtn.innerText = "SAVING...";

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
            // We now store the full array of attachments
            attachments: attachments, 
            // Backward compatibility for old single-file logic
            attachmentUrl: attachments.length > 0 ? attachments[0].url : null,
            attachmentType: attachments.length > 0 ? attachments[0].type : null,
            createdAt: serverTimestamp(),
            expiresAt: expiryValue ? new Date(expiryValue) : null
        });

        alert(`Notice sent successfully with ${attachments.length} attachment(s)!`);
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

// 3. Simple Console Logger
document.getElementById('file-input')?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        console.log(`${files.length} files queued for upload.`);
    }
});