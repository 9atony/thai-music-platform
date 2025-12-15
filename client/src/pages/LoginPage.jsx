// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Mail, Music, Sparkles } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
// ✅ เพิ่ม linkWithCredential และ fetchSignInMethodsForEmail
import { auth, googleProvider, facebookProvider } from '../firebase'; 
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail, linkWithCredential } from 'firebase/auth'; 

// 💡 FIX 3: กำหนด URL ของ Backend (Placeholder)
// **ต้องเปลี่ยน 'https://YOUR-BACKEND-DOMAIN.render.com' เป็น Domain จริงหลัง Deploy Render**
const BASE_API_URL = 'https://thai-music-platform.onrender.com';

// --- Function บันทึกลง Server (แก้ไข Try/Catch) ---
const saveUserToServer = async (user) => {
  try {
    // 🎯 FIX 4: ใช้ BASE_API_URL
    await fetch(`${BASE_API_URL}/api/save-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || ''
      }),
    });
  } catch (error) {
    // ✅ แก้ไข: ดักจับ Error การเชื่อมต่อ Server เพื่อไม่ให้บล็อกการนำทาง
    console.error("Save user to server failed, but proceeding to dashboard:", error);
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Utility Function: จัดการการเชื่อมโยงบัญชีเมื่อเกิด Error ---
  const handleLinkAccountError = async (error, provider) => {
    // ตรวจสอบว่า Error เป็น Error บัญชีซ้ำซ้อน และมีข้อมูลที่จำเป็นหรือไม่
    if (error.code === 'auth/account-exists-with-different-credential' && error.customData?.email && error.credential) {
      const email = error.customData.email;
      
      try {
          // 1. ดึงวิธีการลงชื่อเข้าใช้เดิม
          const methods = await fetchSignInMethodsForEmail(auth, email);
          const firstMethod = methods[0];
          
          // ✅ FIX: ตรวจสอบว่ามี method และเป็น string ก่อนเรียก includes
          if (!firstMethod || typeof firstMethod !== 'string') {
              alert(`บัญชีนี้ลงทะเบียนด้วยวิธีการที่ตรวจไม่พบ กรุณาลองเข้าสู่ระบบด้วย Provider เดิม`);
              return;
          }

          // 2. ล็อกอินด้วยวิธีเดิมเพื่อดึง User Credential
          let userCredential;
          if (firstMethod.includes('password')) {
            // แจ้งผู้ใช้ให้ล็อกอินด้วย Email/Password ก่อน
            alert(`บัญชีนี้ลงทะเบียนด้วย Email/Password ไว้แล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านก่อนเพื่อทำการเชื่อมโยงบัญชี.`);
            return;
          } else {
            // ล็อกอินด้วย Provider เดิม (เช่น Google หรือ Facebook)
            const currentProvider = firstMethod.includes('google') ? googleProvider : facebookProvider;
            userCredential = await signInWithPopup(auth, currentProvider);
          }
          
          // 3. เชื่อมโยง Provider ใหม่ (จาก Error) เข้ากับบัญชีเดิม
          const existingUser = userCredential.user;
          await linkWithCredential(existingUser, error.credential);
          
          alert("บัญชีถูกเชื่อมโยงเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วย " + provider.providerId.split('.')[0].toUpperCase() + " ได้แล้ว");
          handleAuthSuccess(existingUser);

      } catch (linkError) {
          alert("เกิดข้อผิดพลาดในการเชื่อมโยงบัญชี: " + linkError.message);
      }
      
    } else {
      // สำหรับ Error อื่นๆ
      alert("เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + error.message);
    }
  };


  // --- Auth Handlers ---
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      handleAuthSuccess(result.user);
    } catch (error) { 
      handleLinkAccountError(error, googleProvider); 
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      handleAuthSuccess(result.user);
    } catch (error) { 
      handleLinkAccountError(error, facebookProvider); 
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    const displayName = e.target.displayName?.value;

    try {
      let user;
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        if (displayName) {
          await updateProfile(user, { displayName });
          user.displayName = displayName;
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }
      handleAuthSuccess(user);
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (user) => {
      localStorage.setItem('uid', user.uid);
      await saveUserToServer(user);
      navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-[#fdfbf7]">
      
      {/* --- ฝั่งซ้าย: รูปภาพ Art (Animation Zoom) --- */}
      <div className="hidden lg:flex w-5/12 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[#4A3B32] z-0"></div>
        <img 
          src="/thai-bg.png"
          alt="Thai Music" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-1000 ease-in-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
        
        <div className="absolute bottom-0 left-0 p-12 text-white z-10 w-full">
          <div className="mb-4 w-16 h-1 bg-[#C5A065]"></div> {/* เส้นขีดสีทอง */}
          <h2 className="text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
            ท่วงทำนอง<br/>แห่งความเป็นไทย
          </h2>
          <p className="text-lg text-gray-200 font-light max-w-sm">
            เครื่องมือเขียนโน้ตดนตรีไทยบนเว็บ เชื่อมต่อวัฒนธรรมกับเทคโนโลยีสมัยใหม่
          </p>
        </div>
      </div>

      {/* --- ฝั่งขวา: ฟอร์ม (Clean & Luxury) --- */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 relative">
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
            <Music size={120} color="#A67B5B" />
        </div>

        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-stone-100">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#A67B5B] to-[#8a654b] rounded-2xl mb-4 shadow-lg shadow-orange-900/20">
                <Music className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isRegister ? 'เริ่มต้นใช้งาน' : 'ยินดีต้อนรับกลับ'}
            </h1>
            <p className="text-gray-500 mt-2">
              {isRegister ? 'สร้างบัญชีเพื่อเริ่มแต่งเพลงของคุณ' : 'เข้าสู่ระบบเพื่อจัดการผลงาน'}
            </p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={handleGoogleLogin} className="flex items-center justify-center py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group">
               <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" alt="G" />
               <span className="text-sm font-medium text-gray-600">Google</span>
            </button>
            <button onClick={handleFacebookLogin} className="flex items-center justify-center py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#1565c0] transition-all duration-200 shadow-md shadow-blue-500/20 group">
               <span className="mr-2 font-bold text-lg group-hover:scale-110 transition-transform">f</span> 
               <span className="text-sm font-medium">Facebook</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider"><span className="px-4 bg-white text-gray-400">หรือ</span></div>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleEmailAuth}>
            
            {isRegister && (
                <div className="group">
                    <div className="relative">
                        <User className="absolute top-4 left-4 h-5 w-5 text-gray-400 group-focus-within:text-[#A67B5B] transition-colors" />
                        <input id="displayName" name="displayName" type="text" required placeholder="ชื่อที่ใช้แสดง" 
                            className="block w-full pl-12 py-3.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none transition-all placeholder-gray-400 text-gray-700 font-medium" 
                        />
                    </div>
                </div>
            )}

            <div className="group">
              <div className="relative">
                <Mail className="absolute top-4 left-4 h-5 w-5 text-gray-400 group-focus-within:text-[#A67B5B] transition-colors" />
                <input id="email" name="email" type="email" required placeholder="อีเมลของคุณ"
                  className="block w-full pl-12 py-3.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none transition-all placeholder-gray-400 text-gray-700 font-medium" 
                />
              </div>
            </div>

            <div className="group">
              <div className="relative">
                <Lock className="absolute top-4 left-4 h-5 w-5 text-gray-400 group-focus-within:text-[#A67B5B] transition-colors" />
                <input id="password" name="password" type="password" required placeholder="รหัสผ่าน" minLength={6}
                  className="block w-full pl-12 py-3.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] outline-none transition-all placeholder-gray-400 text-gray-700 font-medium" 
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-white bg-gradient-to-r from-[#A67B5B] to-[#8a654b] hover:from-[#956d50] hover:to-[#785740] transition-all duration-300 font-semibold text-lg shadow-lg shadow-orange-900/20 hover:shadow-orange-900/30 hover:-translate-y-0.5"
            >
              {isLoading ? (
                  <span className="flex items-center"><Sparkles className="animate-spin mr-2 h-5 w-5"/> กำลังโหลด...</span>
              ) : (
                  <span className="flex items-center">
                    {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'} 
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              {isRegister ? 'มีบัญชีอยู่แล้วใช่ไหม?' : 'ยังไม่มีบัญชีผู้ใช้?'}
              <button 
                onClick={() => setIsRegister(!isRegister)} 
                className="ml-2 font-bold text-[#A67B5B] hover:text-[#8a654b] hover:underline focus:outline-none transition-colors"
              >
                {isRegister ? 'เข้าสู่ระบบเลย' : 'ลงทะเบียนที่นี่'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;