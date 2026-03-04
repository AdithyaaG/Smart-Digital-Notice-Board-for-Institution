document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetching data from Local Storage
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");
    const userPhoto = localStorage.getItem("userPhoto");
    
    const deptCode = localStorage.getItem("dept_code") || localStorage.getItem("deptCode");
    const regNo = localStorage.getItem("userRegNo");

    // 2. Fetching Unique ID for the ID field (Staff ID or UID)
    const userId = localStorage.getItem("staffId") || localStorage.getItem("uid");

    // 3. Updating Text Fields
    const nameDisplay = document.getElementById('disp-name');
    const roleDisplay = document.getElementById('disp-role');
    const deptDisplay = document.getElementById('disp-dept'); // This is the field we are changing
    const idDisplay = document.getElementById('disp-id');
    const badgeRole = document.getElementById('badge-role');

    // Display Name
    if (nameDisplay) nameDisplay.innerText = userName || "User";
    
    // Display Role with formatting
    if (roleDisplay) {
        if (userRole === 'admin') {
            roleDisplay.innerText = "Admin Account";
        } else if (userRole) {
            roleDisplay.innerText = userRole.charAt(0).toUpperCase() + userRole.slice(1) + " Account";
        } else {
            roleDisplay.innerText = "Staff Account";
        }
    }

    // Role Badge
    if (badgeRole && userRole) {
        badgeRole.innerText = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    }

    // --- LOGIC CHANGE FOR STUDENT ---
    if (deptDisplay) {
        if (userRole === 'student') {
            // For students, show Register Number instead of Dept Code
            deptDisplay.innerText = regNo || "Reg No Not Found";
            
            // Optional: Change the label if you have one nearby
            const deptLabel = document.querySelector('label[for="disp-dept"]') || 
                              deptDisplay.previousElementSibling;
            if (deptLabel && deptLabel.innerText.includes("Department")) {
                deptLabel.innerText = "Register Number:";
            }
        } else {
            // For Staff/Admin, show Department Code
            deptDisplay.innerText = deptCode || "Not Assigned";
        }
    }

    // ID Display (Shows Staff ID for staff, or fallback UID)
    if (idDisplay) {
        idDisplay.innerText = userId || "Not Available";
    }

    // 4. Universal Image Handling
    if (userPhoto) {
        const headerImg = document.getElementById('user-header-img');
        const headerIcon = document.getElementById('user-header-icon');
        
        if (headerImg) {
            headerImg.src = userPhoto;
            headerImg.style.display = 'block';
            if (headerIcon) headerIcon.style.display = 'none';
        }

        const mainAvatar = document.querySelector('.avatar-circle') || 
                           document.querySelector('.profile-avatar') || 
                           document.getElementById('profile-pic-container');

        if (mainAvatar) {
            mainAvatar.innerHTML = `<img src="${userPhoto}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            mainAvatar.style.background = "transparent";
            mainAvatar.style.border = "none";
        }
    }

    // 5. Unified Logout Logic
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to sign out?")) {
                localStorage.clear();
                window.location.href = "../../login.html";
            }
        };
    }
});