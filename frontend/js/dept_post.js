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
        
        let type = data.resource_type; 
        if (file.type === 'application/pdf' || data.format === 'pdf') {
            type = 'document';
        }

        return { url: data.secure_url, type: type };
    } catch (error) {
        console.error("Cloudinary Error:", error);
        return null;
    }
}

// 2. Main Publish Function
window.publishDeptNotice = async function() {
    // Check if user is Staff (Security Trick)
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "staff" && userRole !== "admin") {
        alert("Unauthorized! Only staff can post department-wide notices.");
        return;
    }

    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const priority = document.getElementById('noticePriority').value;
    const eventDate = document.getElementById('eventDate').value; 
    
    const fileInput = document.getElementById('file-input');
    const files = fileInput ? Array.from(fileInput.files) : [];
    
    const user = auth.currentUser;
    if (!user) {
        alert("Authentication error. Please log in again.");
        return;
    }

    if (!title || !content) {
        alert("Please enter both Title and Content!");
        return;
    }

    const postBtn = document.querySelector('.btn-post');
    if (postBtn) {
        postBtn.disabled = true;
        postBtn.innerText = "UPLOADING...";
    }

    // --- MULTI-UPLOAD LOOP ---
    let attachments = [];
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            if (postBtn) postBtn.innerText = `UPLOADING (${i + 1}/${files.length})...`;
            const data = await uploadToCloudinary(files[i]);
            if (data) attachments.push(data);
        }
    }

    // --- THE TRICK: IDENTITY SWITCH ---
    // Grab the staff's specific department code (e.g., "107")
    const finalTargetCode = localStorage.getItem("userDept") || ""; 
    const authorName = localStorage.getItem("userName") || "Staff Member";
    const deptName = localStorage.getItem("deptName") || "Department";

    try {
        if (postBtn) postBtn.innerText = "FINALIZING...";

        await addDoc(collection(db, "notices"), {
            title: title,
            content: content,
            priority: priority,
            event_date: eventDate || null, 
            authorName: authorName,          // Real Staff Name
            authorEmail: user.email,         // Real Staff Email
            authorRole: "staff",             // Switched from 'department' to 'staff' for accountability
            targetCode: finalTargetCode,     // The Dept Code (e.g. 107) - This is the key!
            targetType: "department_wide",   // Tag to identify this isn't a single-class notice
            deptName: deptName,              // Visual label for students
            
            attachments: attachments, 
            createdAt: serverTimestamp(),
            // Set a default expiry of 30 days if not provided
            expiresAt: null 
        });

        alert(`Notice successfully posted to all students in ${deptName} (${finalTargetCode})!`);
        // Redirect back to staff home
        window.location.href = "staff_home.html"; 
    } catch (error) {
        console.error("Firestore Error:", error);
        alert("Failed to save notice: " + error.message);
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.innerText = "POST";
        }
    }
};