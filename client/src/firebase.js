// src/firebase.js
import { initializeApp } from "firebase/app";
// เพิ่มบรรทัดนี้เพื่อใช้งาน Login, Google, Facebook
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

// 👇 เอาโค้ด firebaseConfig จากหน้าเว็บในรูป มาวางทับตรงนี้เลย!
const firebaseConfig = {
  apiKey: "AIzaSyA7ithzAV5Q-c3WTTiYYqZ_TKQYzHP35AM",
  authDomain: "thai-music-app-378f9.firebaseapp.com",
  projectId: "thai-music-app-378f9",
  storageBucket: "thai-music-app-378f9.firebasestorage.app",
  messagingSenderId: "408880825100",
  appId: "1:408880825100:web:26964b9a649e4489fd3f29",
  measurementId: "G-JEQCVPND2W"
};

// เริ่มต้นระบบ
const app = initializeApp(firebaseConfig);

// ส่งออกเครื่องมือให้หน้า Login เอาไปใช้
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();