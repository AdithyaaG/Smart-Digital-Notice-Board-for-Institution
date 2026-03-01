document.addEventListener('DOMContentLoaded', () => {
    // 1. In production, we get the ID from the URL (e.g., detailed_notice.html?id=101)
    const params = new URLSearchParams(window.location.search);
    const noticeId = params.get('id');

    // 2. MOCK DATA (This replaces the database fetch for now)
    const noticeData = {
        title: "Semester Fee Payment Deadline",
        content: "All students are hereby informed that the final date for semester fee payment is 30th Jan. Please use the portal to avoid a fine of ₹500.",
        type: "important", // Options: emergency, important, normal, event
        date: "Jan 14, 2026",
        views: "1,425",
        image: "static/images/admission_open.png", // Leave null if no image
        file: "fee_structure.pdf"
    };

    displayNotice(noticeData);
});

function displayNotice(data) {
    document.getElementById('detailTitle').innerText = data.title;
    document.getElementById('noticeHeading').innerText = data.title;
    document.getElementById('noticeFullText').innerText = data.content;
    document.getElementById('postDate').innerText = data.date;
    document.getElementById('viewCount').innerText = data.views;
    document.getElementById('detailType').innerText = data.type.toUpperCase();

    // Handle Media Display
    const mediaBox = document.getElementById('mediaContainer');
    if (data.image) {
        mediaBox.innerHTML = `<img src="${data.image}" alt="Notice Header">`;
    }

    // Handle Attachments
    if (data.file) {
        document.getElementById('attachmentSection').style.display = 'flex';
        document.getElementById('fileName').innerText = data.file;
    }

    // Category Specific Logic
    const shareBtn = document.getElementById('shareBtn');
    if (data.type === 'event') {
        shareBtn.style.display = 'flex';
        shareBtn.onclick = () => {
            navigator.share({
                title: data.title,
                text: data.content,
                url: window.location.href
            }).catch(() => alert("Share failed or not supported"));
        };
    }
    
    // UI Styling for Emergency
    if (data.type === 'emergency') {
        document.querySelector('.admin-header').style.backgroundColor = '#ff0000';
    }
}