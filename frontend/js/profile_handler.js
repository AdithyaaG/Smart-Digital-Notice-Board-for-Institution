document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetching data from Local Storage
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");
    const userPhoto = localStorage.getItem("userPhoto");
    const deptCode = localStorage.getItem("dept_code");

    // 2. Fetching Unique ID (Checks for Staff ID or Student Registration Number)
    const userId = localStorage.getItem("staffId") || localStorage.getItem("userRegNo");

    // 3. Updating Text Fields
    const nameDisplay = document.getElementById('disp-name');
    const roleDisplay = document.getElementById('disp-role');
    const deptDisplay = document.getElementById('disp-dept');
    const idDisplay = document.getElementById('disp-id');
    const badgeRole = document.getElementById('badge-role');

    if (nameDisplay) nameDisplay.innerText = userName || "User";
    
    if (roleDisplay) {
        // Formats role for display (e.g., 'admin' -> 'Admin Account')
        roleDisplay.innerText = userRole === 'admin' ? "Admin Account" : 
                               (userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) + " Account" : "Staff Account");
    }

    if (badgeRole && userRole) {
        badgeRole.innerText = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    }

    if (deptDisplay) deptDisplay.innerText = deptCode || "---";
    if (idDisplay) idDisplay.innerText = userId || "---";

    // 4. Universal Image Handling
    if (userPhoto) {
        // Handle Top Header Profile Image
        const headerImg = document.getElementById('user-header-img');
        const headerIcon = document.getElementById('user-header-icon');
        
        if (headerImg) {
            headerImg.src = userPhoto;
            headerImg.style.display = 'block';
            if (headerIcon) headerIcon.style.display = 'none';
        }

        // Handle Main Card Avatar (Supports Admin, Staff, and Student CSS classes)
        const mainAvatar = document.querySelector('.avatar-circle') || 
                           document.querySelector('.profile-avatar') || 
                           document.getElementById('profile-pic-container');

        if (mainAvatar) {
            // Replaces icon with the Google Photo
            mainAvatar.innerHTML = `<img src="${userPhoto}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            mainAvatar.style.background = "transparent";
            mainAvatar.style.border = "none";
        }
    }

    // 5. Unified Logout Logic
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm("Are you sure you want to sign out?")) {
                localStorage.clear(); // Clear all data on logout
                window.location.href = "../../login.html";
            }
        };
    }
});