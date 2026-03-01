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
    deleteDoc,
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
        const userEmail = user.email.toLowerCase(); // Standardize email

        localStorage.setItem("userPhoto", user.photoURL || ""); 
        localStorage.setItem("userName", user.displayName || "User");

        // --- STEP 1: CHECK WHITELIST & ROLE (users collection) ---
        let userRef = doc(db, "users", user.uid);
        let userDoc = await getDoc(userRef);

        // LINKING LOGIC: If UID doc doesn't exist, search for email-based placeholder (Whitelisted)
        if (!userDoc.exists()) {
            const q = query(collection(db, "users"), where("email", "==", userEmail));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
                const whitelistedDoc = querySnap.docs[0];
                const data = whitelistedDoc.data();

                // Create permanent doc with actual UID and set isLinked to true
                await setDoc(userRef, {
                    ...data,
                    uid: user.uid,
                    isLinked: true, // Mark as fully registered
                    lastLogin: serverTimestamp(),
                    // Optionally update name if the whitelisted name was just a placeholder
                    name: data.name || user.displayName 
                });

                // Remove the email-based placeholder (e.g., WHITELIST_DEPT_107)
                await deleteDoc(whitelistedDoc.ref);
                userDoc = await getDoc(userRef);
            }
        }

        // Handle Authorized Roles (Admin, Dept, Staff)
        if (userDoc.exists()) {
            const data = userDoc.data();
            localStorage.setItem("userRole", data.role);
            
            // CRITICAL: Store dept_code correctly for HOD/Staff dashboards
            if (data.dept_code) {
                localStorage.setItem("userDept", data.dept_code);
                localStorage.setItem("dept_code", data.dept_code); // Used by batch management
            }
            
            if (data.profilePic) localStorage.setItem("userPhoto", data.profilePic);
            
            let folderName = data.role;
            let fileName = data.role;

            if (data.role === "dept") {
                folderName = "department"; 
                fileName = "department";
            }
            
            window.location.href = `pages/${folderName}/${fileName}_home.html`;
            return; 
        }

        // --- STEP 2: CHECK STUDENT ACCESS (Auto-Creation) ---
        const emailPrefix = userEmail.split('@')[0];
        const isStudentEmail = /^\d/.test(emailPrefix) && userEmail.endsWith("@srcas.ac.in");

        if (isStudentEmail) {
            const studentRef = doc(db, "students", user.uid);
            const studentDoc = await getDoc(studentRef);
            
            const regNumStr = emailPrefix;
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
        } else {
            // UNAUTHORIZED: Not a whitelisted Admin/Dept/Staff and not a valid Student email
            alert("Unauthorized access. Only registered Staff/HODs or valid Student emails can enter.");
            await auth.signOut();
            window.location.reload();
        }

    } catch (error) {
        console.error("Login Error:", error);
        alert("Login Error: " + error.message);
        
        const btn = document.getElementById('googleLoginBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fab fa-google"></i> Login with College Email';
        }
    }
};