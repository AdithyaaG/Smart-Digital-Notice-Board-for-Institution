// Add this to the TOP of every role-specific page
function protectPage(requiredRole) {
    const role = localStorage.getItem("userRole");
    if (role !== requiredRole) {
        alert("Access Denied! Redirecting to login...");
        window.location.href = "../../login.html";
    }
}
window.protectPage = protectPage;


document.addEventListener('DOMContentLoaded', () => {
    // 1. Get user data (This will be set during Login)
    const userRole = localStorage.getItem('userRole') || 'student'; 
    const userName = localStorage.getItem('userName') || 'User';
    const userDept = localStorage.getItem('userDept') || '';

    // 2. Target UI elements
    const displayRole = document.getElementById('displayRole');
    const privilegedSection = document.getElementById('privilegedSection');
    const navCreate = document.getElementById('navCreate');
    const navAnalytics = document.getElementById('navAnalytics');
    const navManage = document.getElementById('navManage');
    const scopeText = document.getElementById('scopeText');

    // 3. APPLY ROLE-BASED VISIBILITY
    if (userRole === 'admin') {
        displayRole.innerText = "College Admin";
        privilegedSection.style.display = 'block';
        scopeText.innerText = "Institutional Reach (All Depts)";
        showAdminNav();
    } 
    else if (userRole === 'department') {
        displayRole.innerText = `${userDept} Head`;
        privilegedSection.style.display = 'block';
        scopeText.innerText = `Department Reach (${userDept})`;
        showAdminNav();
    } 
    else if (userRole === 'staff') {
        displayRole.innerText = "Class Staff";
        privilegedSection.style.display = 'block';
        scopeText.innerText = "Class Reach (My Students)";
        showAdminNav();
    } 
    else {
        // STUDENT VIEW
        displayRole.innerText = "Student Portal";
        privilegedSection.style.display = 'none'; // Students don't see analytics
        hideAdminNav();
    }

    function showAdminNav() {
        navCreate.style.display = 'flex';
        navAnalytics.style.display = 'flex';
        navManage.style.display = 'flex';
    }

    function hideAdminNav() {
        navCreate.style.display = 'none';
        navAnalytics.style.display = 'none';
        navManage.style.display = 'none';
    }
});