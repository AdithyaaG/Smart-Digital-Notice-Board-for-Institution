import { db } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.saveEdit = async function() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const content = document.getElementById('edit-content').value;
    const target = document.getElementById('edit-target').value;

    try {
        const noticeRef = doc(db, "notices", id);
        await updateDoc(noticeRef, {
            title: title,
            content: content,
            targetCode: target,
            lastEditedAt: new Date()
        });

        alert("Notice updated successfully!");
        document.getElementById('edit-modal').style.display = 'none';
        // The onSnapshot in staff_feed.js will automatically update the UI
    } catch (error) {
        console.error("Error updating notice:", error);
        alert("Failed to update notice.");
    }
};