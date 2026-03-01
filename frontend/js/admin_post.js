import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

// 1. Cloudinary Upload Logic
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');

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

// 2. Main Publish Function
window.publishNotice = async function() {
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const expiryValue = document.getElementById('expiryDateTime').value;
    const priority = document.getElementById('noticePriority').value;
    
    // Check all possible inputs from your HTML
    const mainFile = document.getElementById('file-input').files[0];
    const docFile = document.getElementById('docInput').files[0];
    const vidFile = document.getElementById('videoInput').files[0];
    const imgFile = document.getElementById('imageInput').files[0];
    
    // Priority: Specific hidden inputs first, then main box
    const file = imgFile || vidFile || docFile || mainFile;

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
    if (postBtn) postBtn.disabled = true;

    let attachmentData = null;
    if (file) {
        attachmentData = await uploadToCloudinary(file);
        if (!attachmentData) {
            alert("File upload failed.");
            if (postBtn) postBtn.disabled = false;
            return;
        }
    }

    try {
        await addDoc(collection(db, "notices"), {
            title: title,
            content: content,
            priority: priority,
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
        alert("Post failed.");
        if (postBtn) postBtn.disabled = false;
    }
};

// 3. FAB Menu Handlers
document.getElementById('imageIcon')?.addEventListener('click', () => document.getElementById('imageInput').click());
document.getElementById('videoIcon')?.addEventListener('click', () => document.getElementById('videoInput').click());
document.getElementById('docIcon')?.addEventListener('click', () => document.getElementById('docInput').click());

// 4. Preview Text Logic
const allInputs = ['file-input', 'imageInput', 'videoInput', 'docInput'];
allInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            const preview = document.getElementById('filePreview');
            if (preview) preview.innerHTML = `<i class="fas fa-paperclip"></i> Selected: ${e.target.files[0].name}`;
        }
    });
});

// 5. FAB Menu Toggle
document.getElementById('mainAddBtn')?.addEventListener('click', () => {
    const menu = document.getElementById('attachmentMenu');
    menu.classList.toggle('active'); // Ensure your CSS handles .active or style it here
    if(menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
        menu.style.flexDirection = 'column';
    }
});