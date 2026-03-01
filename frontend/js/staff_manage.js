import { db, auth } from './firebase-config.js';
import { 
    collection, query, where, orderBy, onSnapshot, doc, getDoc, 
    updateDoc, deleteDoc, Timestamp, serverTimestamp, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById('notice-list-container');
const CLOUD_NAME = "dfie8haie"; 
const UPLOAD_PRESET = "sr_notices"; 

// --- HELPER: CLOUDINARY UPLOAD ---
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const statusText = document.getElementById('edit-upload-status');
    if (statusText) statusText.style.display = 'block';

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        if (statusText) statusText.style.display = 'none';
        return { url: data.secure_url, type: data.resource_type };
    } catch (error) {
        console.error("Cloudinary Error:", error);
        if (statusText) statusText.style.display = 'none';
        return null;
    }
}

// --- REAL-TIME LISTENER ---
auth.onAuthStateChanged((user) => {
    if (user) {
        const q = query(
            collection(db, "notices"),
            where("authorEmail", "==", user.email), 
            orderBy("createdAt", "desc")
        );

        onSnapshot(q, (snapshot) => {
            if (!container) return;
            container.innerHTML = ''; 

            if (snapshot.empty) {
                container.innerHTML = `<p style="text-align:center; padding:40px; color:#666;">No notices found.</p>`;
                return;
            }

            snapshot.forEach((snapDoc) => {
                const data = snapDoc.data();
                const noticeId = snapDoc.id;
                const now = new Date();
                const expiryDate = data.expiresAt?.toDate ? data.expiresAt.toDate() : (data.expiresAt ? new Date(data.expiresAt) : null);
                const isExpired = expiryDate && expiryDate <= now;

                const card = `
                    <div class="notice-item" style="border-left: 5px solid ${isExpired ? '#999' : '#b3004b'}; opacity: ${isExpired ? '0.8' : '1'};">
                        <div class="notice-info" onclick="window.location.href='staff_analytics.html?id=${noticeId}'" style="flex:1; cursor:pointer;">
                            <h4 style="color: ${isExpired ? '#666' : '#333'};">
                                ${data.title} ${data.attachmentUrl ? '<i class="fas fa-paperclip" style="font-size:0.7rem; color:#aaa;"></i>' : ''}
                            </h4>
                            <p>Target: ${data.targetCode} | <span style="color:#b3004b;">View Stats <i class="fas fa-chart-line"></i></span></p>
                        </div>
                        <div style="display:flex; gap:8px; margin-left: 15px;">
                            <button onclick="openEditModal('${noticeId}')" style="background:#4CAF50; color:white; border:none; width:38px; height:38px; border-radius:8px; cursor:pointer;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="confirmDelete('${noticeId}')" style="background:#ff4d4d; color:white; border:none; width:38px; height:38px; border-radius:8px; cursor:pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
                container.innerHTML += card;
            });
        });
    } else {
        window.location.href = "../../index.html";
    }
});

// --- OPEN MODAL ---
window.openEditModal = async function(id) {
    const modal = document.getElementById('edit-modal');
    try {
        const snap = await getDoc(doc(db, "notices", id));
        if (snap.exists()) {
            const data = snap.data();
            document.getElementById('edit-id').value = id;
            document.getElementById('edit-title').value = data.title;
            document.getElementById('edit-content').value = data.content;
            document.getElementById('edit-target').value = data.targetCode;

            if (data.expiresAt) {
                const date = data.expiresAt.toDate();
                document.getElementById('edit-expiry').value = date.toISOString().slice(0, 16);
            } else {
                document.getElementById('edit-expiry').value = "";
            }

            modal.style.display = 'flex';
        }
    } catch (err) { console.error("Load Error:", err); }
};

// --- SAVE FUNCTION ---
window.saveEdit = async function() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const content = document.getElementById('edit-content').value;
    const expiryValue = document.getElementById('edit-expiry').value;
    const fileInput = document.getElementById('edit-file-input');
    const saveBtn = document.getElementById('save-edit-btn');

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Updating...`;
        }

        const updateData = {
            title: title,
            content: content,
            lastEditedAt: serverTimestamp()
        };

        if (fileInput && fileInput.files[0]) {
            const uploadedMedia = await uploadToCloudinary(fileInput.files[0]);
            if (uploadedMedia) {
                updateData.attachmentUrl = uploadedMedia.url;
                updateData.attachmentType = uploadedMedia.type === 'image' ? 'image' : 'video';
            }
        }

        if (expiryValue) {
            updateData.expiresAt = Timestamp.fromDate(new Date(expiryValue));
        } else {
            updateData.expiresAt = null; 
        }

        await updateDoc(doc(db, "notices", id), updateData);
        document.getElementById('edit-modal').style.display = 'none';
        alert("Notice updated successfully!");

    } catch (err) { 
        console.error("Update Error:", err);
        alert("Error: " + err.message); 
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<i class="fas fa-check-circle"></i> Save Changes`;
        }
    }
};

// --- CORRECTED DELETE FUNCTION ---
// This function now attempts to clear the subcollection so the doc fully disappears from Console
window.confirmDelete = async function(id) {
    if (confirm("Permanently delete this notice and all view data?")) {
        try {
            // 1. Delete all documents in the 'views' subcollection first
            const viewsCol = collection(db, "notices", id, "views");
            const viewsSnap = await getDocs(viewsCol);
            
            const deletePromises = viewsSnap.docs.map(vDoc => deleteDoc(vDoc.ref));
            await Promise.all(deletePromises);

            // 2. Finally delete the notice document itself
            await deleteDoc(doc(db, "notices", id));
            
            alert("Notice and analytics deleted successfully.");
        } catch (err) { 
            console.error("Delete Error:", err);
            alert("Delete failed: " + err.message); 
        }
    }
};