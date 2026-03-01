// Import the Firebase SDKs from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration (Based on your provided keys)
const firebaseConfig = {
  apiKey: "AIzaSyAuJdkFSzz2A6I7Ts2E4KIriFsN36F5_rI",
  authDomain: "sdnb-project.firebaseapp.com",
  projectId: "sdnb-project",
  storageBucket: "sdnb-project.firebasestorage.app",
  messagingSenderId: "656454665656",
  appId: "1:656454665656:web:10a5217f3d9e3a2feabb4d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services so your other JS files (like login_handler.js) can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);