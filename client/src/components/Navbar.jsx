// src/components/Navbar.jsx (ฉบับแก้ไข: แก้ไข API URL และแสดงรูปโปรไฟล์)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, LogOut, Shield, User, Menu, X, Home } from 'lucide-react';

// 💡 FIX 1: กำหนด URL ของ Backend (ใช้ Render Domain)
const BASE_API_URL = 'https://thai-music-platform.onrender.com';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // เมนูมือถือ
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ดึง UID ของตัวเอง
  const myUid = localStorage.getItem('uid');

  // ตรวจสอบว่าเป็นหน้า Editor หรือไม่ เพื่อเปลี่ยนสี Navbar
  const isEditor = location.pathname.startsWith('/editor');

  useEffect(() => {
    if (myUid) fetchUserData();
  }, [myUid]);

  const fetchUserData = async () => {
    try {
      // 🎯 FIX 2: เปลี่ยนจาก localhost:3001 เป็น BASE_API_URL
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
    localStorage.removeItem('uid');
    navigate('/login');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 shadow-md ${
        isEditor ? 'bg-[#2c3e50] text-white' : 'bg-white text-gray-800'
    } transition-colors duration-300 font-['Prompt']`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo / Title */}
          <div className="flex-shrink-0 flex items-center">
            <Music size={28} className={`${isEditor ? 'text-yellow-400' : 'text-[#A67B5B]'}`} />
            <span className="ml-2 text-xl font-bold tracking-tight">
              Thai Music Platform
            </span>
          </div>

          {/* Desktop Links & Profile */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-4">
                <Link to="/dashboard" className={`${isEditor ? 'text-white hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors flex items-center gap-1 font-['Prompt']`}>
                    <Home size={20} /> หน้าหลัก
                </Link>
                {/* 🛡️ FIX 3: Admin Link (ตอนนี้ Logic น่าจะทำงานแล้ว หลังแก้ API Call) */}
                {isAdmin && (
                    <Link to="/admin" className={`${isEditor ? 'text-yellow-400 hover:text-yellow-300' : 'text-purple-600 hover:text-purple-800'} transition-colors flex items-center gap-1 font-['Prompt'] font-semibold`}>
                        <Shield size={20} /> ผู้ดูแลระบบ
                    </Link>
                )}
            </div>

            {/* Profile Section */}
            <div className={`flex items-center space-x-3 ${isEditor ? 'text-white' : 'text-gray-600'}`}>
                <div className="flex items-center space-x-2">
                    {/* 📸 FIX 4: แสดงรูปโปรไฟล์ หรือ Icon Default */}
                    {userData?.photoURL ? (
                        <img 
                            src={userData.photoURL} 
                            alt={userData.displayName}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/50" 
                        />
                    ) : (
                        <User size={24} className={`${isEditor ? 'text-gray-300' : 'text-gray-400'}`} />
                    )}
                    <span className={`font-medium ${isEditor ? 'text-white' : 'text-gray-800'}`}>
                        {userData?.displayName?.split(' ')[0] || 'User'} 
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    title="ออกจากระบบ"
                >
                    <LogOut size={20} />
                </button>
            </div>
          </div>

          {/* ปุ่ม Mobile Menu */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                {isOpen ? <X /> : <Menu />}</button>
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
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 rounded-md hover:bg-red-50 font-['Prompt']">
                    <div className="flex items-center gap-2"><LogOut size={20} /> ออกจากระบบ</div>
                </button>
            </div>
        </div>
      )}
    </nav>
  );
}