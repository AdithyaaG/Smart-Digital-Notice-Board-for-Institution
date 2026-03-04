import { auth, db } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection,
    query,
    where,
    getDocs,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

window.loginWithGoogle = async function() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userEmail = user.email.toLowerCase(); 

        // Store basic info immediately
        localStorage.setItem("userPhoto", user.photoURL || ""); 
        localStorage.setItem("userName", user.displayName || "User");
        localStorage.setItem("userEmail", userEmail);

        // --- STEP 1: CHECK FOR ADMIN ROLE ---
        const adminRef = doc(db, "users", user.uid);
        const adminDoc = await getDoc(adminRef);

        if (adminDoc.exists() && adminDoc.data().role === "admin") {
            localStorage.setItem("userRole", "admin");
            window.location.href = `pages/admin/admin_home.html`;
            return;
        }

        // --- STEP 2: CHECK FOR STAFF ROLE (Using Array Search) ---
        // This queries the 'departments' collection to see if the email exists in 'staffEmails' array
        const deptQuery = query(
            collection(db, "departments"), 
            where("staffEmails", "array-contains", userEmail)
        );
        
        const deptSnap = await getDocs(deptQuery);

        if (!deptSnap.empty) {
            const deptData = deptSnap.docs[0].data();
            
            localStorage.setItem("userRole", "staff");
            localStorage.setItem("userDept", deptData.deptCode); // e.g., "107"
            localStorage.setItem("deptName", deptData.deptName);
            localStorage.setItem("userName", user.displayName);

            window.location.href = "pages/staff/staff_home.html";
            return;
        }

        // --- STEP 3: CHECK STUDENT ACCESS (Auto-Extraction) ---
        const emailPrefix = userEmail.split('@')[0];
        // Checks if email starts with a number and ends with college domain
        const isStudentEmail = /^\d/.test(emailPrefix) && userEmail.endsWith("@srcas.ac.in");

        if (isStudentEmail) {
            const studentRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentRef);
            
            const regNumStr = emailPrefix;
            // Matches your logic: 23107068 -> deptCode 107
            const deptCode = regNumStr.substring(2, 5); 

            if (!studentDoc.exists()) {
                await setDoc(studentRef, {
                    uid: user.uid,
                    name: user.displayName,
                    email: userEmail,
                    regNo: Number(regNumStr),
                    deptCode: deptCode,
                    batchYear: Number(regNumStr.substring(0, 2)),
                    role: "student",
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
            } else {
                await updateDoc(studentRef, { lastLogin: serverTimestamp() });
            }

            localStorage.setItem("userRole", "student");
            localStorage.setItem("userReg", regNumStr);
            localStorage.setItem("userDept", deptCode);
            window.location.href = "pages/student/student_home.html";
            return;
        }

        // If no roles match, sign out to prevent unauthorized persistence
        alert("Unauthorized access. Your email is not registered in any Department staff list.");
        await auth.signOut();
        window.location.reload();

    } catch (error) {
        console.error("Login Error:", error);
        // Common cause: Firestore Rules missing 'list' permission for departments
        alert("Login Error: " + error.message);
    }
};