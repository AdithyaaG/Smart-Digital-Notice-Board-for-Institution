import { db, auth } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const noticeContainer = document.getElementById('department-notice-container');

// --- CLOUDINARY CONFIG (Same as your post script) ---
const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

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

auth.onAuthStateChanged((user) => {
    if (user) {
        const q = query(
            collection(db, "notices"),
            where("authorEmail", "==", user.email),
            where("authorRole", "==", "department"),
            orderBy("createdAt", "desc")
        );

        onSnapshot(q, (snapshot) => {
            if (!noticeContainer) return;
            noticeContainer.innerHTML = '';
            if (snapshot.empty) {
                noticeContainer.innerHTML = '<p style="text-align:center; color:#666; margin-top:50px;">No notices posted yet.</p>';
                return;
            }
            snapshot.forEach((snapDoc) => {
                renderDeptNotice(snapDoc.id, snapDoc.data());
            });
        });
    } else { window.location.href = "../../index.html"; }
});

function renderDeptNotice(id, data) {
    const now = new Date();
    const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : null;
    const createdText = createdDate ? createdDate.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Pending...";
    const expDate = data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null);
    const isExpired = expDate && expDate < now;
    const expiryText = expDate ? expDate.toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "No Expiry";

    // Show paperclip icon if there is an attachment
    const hasAttachment = data.attachmentUrl ? `<i class="fas fa-paperclip" style="color:#b3004b; margin-left:5px;"></i>` : "";

    const card = `
        <div class="notice-card" id="card-${id}" style="background: white; padding: 18px; border-radius: 15px; margin-bottom: 15px; border-left: 5px solid #b3004b; box-shadow: 0 4px 12px rgba(0,0,0,0.08); opacity: ${isExpired ? '0.6' : '1'}; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <h3 style="color: #b3004b; margin: 0; font-size: 1.1rem;">${data.title} ${hasAttachment}</h3>
                        ${isExpired ? '<span style="background: red; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: bold;">EXPIRED</span>' : ''}
                    </div>
                    <div style="font-size: 0.75rem; color: #999; margin-bottom: 8px;"><i class="fas fa-calendar-alt"></i> Posted: ${createdText}</div>
                    <p style="color: #444; margin: 8px 0; font-size: 0.9rem; line-height: 1.4;">${data.content}</p>
                    <div style="display: flex; gap: 15px; margin-top: 10px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                        <small style="color: #666;"><i class="fas fa-bullseye" style="color:#b3004b;"></i> ${data.targetCode}</small>
                        <small style="color: ${isExpired ? 'red' : '#666'}; font-weight: ${isExpired ? 'bold' : 'normal'};"><i class="fas fa-clock"></i> Ends: ${expiryText}</small>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 10px;">
                    <button onclick="openEditModal('${id}')" style="background: #e8f5e9; color: #2e7d32; border: none; padding: 10px; border-radius: 10px; cursor: pointer;"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteNotice('${id}')" style="background: #ffebee; color: #c62828; border:none; padding: 10px; border-radius: 10px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    noticeContainer.innerHTML += card;
}

window.openEditModal = async function(id) {
    try {
        const snap = await getDoc(doc(db, "notices", id));
        if (snap.exists()) {
            const data = snap.data();
            document.getElementById('edit-id').value = id;
            document.getElementById('edit-title').value = data.title;
            document.getElementById('edit-content').value = data.content;
            
            // Handle Preview
            const previewArea = document.getElementById('edit-image-preview');
            if (data.attachmentUrl) {
                previewArea.innerHTML = data.attachmentType === 'image' 
                    ? `<img src="${data.attachmentUrl}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;">`
                    : `<div style="font-size:0.8rem; color:#666;"><i class="fas fa-file"></i> Existing File Attached</div>`;
            } else {
                previewArea.innerHTML = `<small style="color:#999;">No current attachment</small>`;
            }

            if (data.expiresAt) {
                const date = data.expiresAt.toDate();
                const localISO = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                document.getElementById('edit-expiry').value = localISO;
            } else {
                document.getElementById('edit-expiry').value = "";
            }
            document.getElementById('edit-modal').style.display = 'flex';
        }
    } catch (err) { console.error(err); }
};

window.saveEdit = async function() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const content = document.getElementById('edit-content').value;
    const expiryVal = document.getElementById('edit-expiry').value;
    const fileInput = document.getElementById('edit-file-input');
    const statusText = document.getElementById('edit-upload-status');

    let updateData = {
        title: title,
        content: content,
        updatedAt: serverTimestamp(),
        expiresAt: expiryVal ? Timestamp.fromDate(new Date(expiryVal)) : null
    };

    try {
        // If a new file is selected, upload it first
        if (fileInput.files.length > 0) {
            if (statusText) statusText.style.display = 'block';
            const cloudRes = await uploadToCloudinary(fileInput.files[0]);
            if (cloudRes) {
                updateData.attachmentUrl = cloudRes.url;
                updateData.attachmentType = cloudRes.type;
            }
        }

        await updateDoc(doc(db, "notices", id), updateData);
        
        if (statusText) statusText.style.display = 'none';
        document.getElementById('edit-modal').style.display = 'none';
        alert("Department notice updated!");
        fileInput.value = ""; // Reset file input
    } catch (err) { 
        console.error(err);
        alert("Update failed"); 
    }
};

window.deleteNotice = async function(id) {
    if (confirm("Permanently delete this notice?")) {
        try {
            await deleteDoc(doc(db, "notices", id));
        } catch (err) { alert("Delete failed"); }
    }
};