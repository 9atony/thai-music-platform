// src/components/Navbar.jsx (ฉบับแก้ไข: Final - ใช้ Render Domain)
import React, { useState, useEffect } => 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, LogOut, Shield, User, Menu, X, Home } from 'lucide-react';

// ✅ เพิ่ม BASE_API_URL
const BASE_API_URL = 'https://thai-music-platform.onrender.com';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // เมนูมือถือ
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ดึง UID ของตัวเอง
  const myUid = localStorage.getItem('uid');

  useEffect(() => {
    if (myUid) fetchUserData();
  }, [myUid]);

  const fetchUserData = async () => {
    try {
      // 🎯 FIX 1: เปลี่ยนจาก localhost เป็น BASE_API_URL
      const res = await fetch(`${BASE_API_URL}/api/admin/users`);
      const users = await res.json();
      const me = users.find(u => u.uid === myUid);
      
      if (me) {
        setUserData(me);
        // 🛡️ Logic การเช็ค Admin
        if (me.role === 'admin') setIsAdmin(true);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const handleLogout = () => {
    if(window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.removeItem('uid');
        navigate('/login');
    }
  };

  // เช็คว่าอยู่หน้า Editor หรือไม่ เพื่อเปลี่ยนสี Navbar
  const isEditor = location.pathname.includes('/editor');

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isEditor ? 'bg-[#2c3e50] text-white shadow-md' : 'bg-white text-gray-800 shadow-sm border-b border-[#A67B5B]/20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isEditor ? 'bg-white/10 text-white' : 'bg-gradient-to-br from-[#A67B5B] to-[#8a654b] text-white shadow-lg shadow-orange-900/20'
            }`}>
                <Music size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className={`font-bold text-xl font-['Prompt'] ${isEditor ? 'text-white' : 'text-[#4A3B32]'}`}>
                Thai Music<span className={`${isEditor ? 'text-gray-400' : 'text-[#A67B5B]'}`}>.Editor</span>
            </span>
          </Link>

          {/* เมนู Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-['Prompt'] font-medium ${
                location.pathname === '/dashboard' 
                ? (isEditor ? 'bg-white/20' : 'bg-[#F9F7F0] text-[#A67B5B]') 
                : 'hover:opacity-70'
            }`}>
                <Home size={18} /> หน้าหลัก
            </Link>

            {/* ปุ่ม Admin (โผล่เฉพาะคนที่เป็น Admin) */}
            {isAdmin && (
                <Link to="/admin" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-['Prompt'] font-medium ${
                    location.pathname === '/admin'
                    ? 'bg-purple-100 text-purple-700'
                    : (isEditor ? 'text-purple-300 hover:text-purple-100' : 'text-purple-600 hover:bg-purple-50')
                }`}>
                    <Shield size={18} /> ผู้ดูแลระบบ
                </Link>
            )}

            <div className={`h-6 w-[1px] ${isEditor ? 'bg-gray-600' : 'bg-gray-200'}`}></div>

            {/* โปรไฟล์ & Logout */}
            <div className="flex items-center gap-3">
                <span className={`text-sm font-medium font-['Prompt'] ${isEditor ? 'text-gray-300' : 'text-gray-600'}`}>
                    {userData?.displayName || 'ผู้ใช้งาน'}
                </span>
                
                {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="w-9 h-9 rounded-full border-2 border-[#A67B5B] shadow-sm object-cover" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <User size={20} />
                    </div>
                )}

                <button 
                    onClick={handleLogout}
                    className={`p-2 rounded-full transition-colors ${
                        isEditor ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                    }`}
                    title="ออกจากระบบ"
                >
                    <LogOut size={20} />
                </button>
            </div>
          </div>

          {/* ปุ่ม Mobile Menu */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* เมนู Mobile (Dropdown) */}
      {isOpen && (
        <div className={`md:hidden absolute w-full shadow-xl border-t ${
            isEditor ? 'bg-[#2c3e50] border-gray-700' : 'bg-white border-gray-100'
        }`}>
            <div className="px-4 pt-2 pb-4 space-y-2">
                <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-gray-100 font-['Prompt']">
                    🏠 หน้าหลัก
                </Link>
                {isAdmin && (
                    <Link to="/admin" className="block px-3 py-2 rounded-md hover:bg-purple-50 text-purple-600 font-['Prompt']">
                        🛡️ ผู้ดูแลระบบ
                    </Link>
                )}
                <div className="border-t my-2 border-gray-200"></div>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md font-['Prompt']">
                    🚪 ออกจากระบบ
                </button>
            </div>
        </div>
      )}
    </nav>
  );
}