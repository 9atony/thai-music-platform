// src/pages/AdminPage.jsx (ฉบับแก้ไข: ใช้ Render Domain)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Users, Music, Trash2, Edit, Search, Shield, AlertCircle } from 'lucide-react';

// ✅ เพิ่ม BASE_API_URL
const BASE_API_URL = 'https://thai-music-platform.onrender.com';

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'users'
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkPermission();
  }, []);

  // --- Logic ตรวจสอบสิทธิ์และดึงข้อมูล ---
  const checkPermission = async () => {
    const myUid = localStorage.getItem('uid');
    if (!myUid) {
        navigate('/login');
        return;
    }

    try {
        // 🎯 FIX 1: เปลี่ยนจาก localhost เป็น BASE_API_URL
        const res = await fetch(`${BASE_API_URL}/api/admin/users`);
        const allUsers = await res.json();
        const me = allUsers.find(u => u.uid === myUid);
        
        if (me && me.role === 'admin') {
            setIsAdmin(true);
            // โหลดข้อมูลหลังผ่านการตรวจสิทธิ์
            setUsers(allUsers);
            // 🎯 FIX 2: เปลี่ยนจาก localhost เป็น BASE_API_URL
            const resProj = await fetch(`${BASE_API_URL}/api/admin/projects`);
            setProjects(await resProj.json());
        } else {
            alert("⛔️ Access Denied: สำหรับผู้ดูแลระบบเท่านั้น");
            navigate('/dashboard');
        }
    } catch (err) {
        console.error("Error:", err);
        navigate('/dashboard');
    } finally {
        setChecking(false);
    }
  };

  const reloadData = async () => {
      // 🎯 FIX 3: เปลี่ยนจาก localhost เป็น BASE_API_URL
      const resUsers = await fetch(`${BASE_API_URL}/api/admin/users`);
      setUsers(await resUsers.json());
      // 🎯 FIX 4: เปลี่ยนจาก localhost เป็น BASE_API_URL
      const resProj = await fetch(`${BASE_API_URL}/api/admin/projects`);
      setProjects(await resProj.json());
  };

  const handleDeleteProject = async (id) => {
    if(!window.confirm("ยืนยันการลบเพลงนี้? (ไม่สามารถกู้คืนได้)")) return;
    try {
        // 🎯 FIX 5: เปลี่ยนจาก localhost เป็น BASE_API_URL
        await fetch(`${BASE_API_URL}/api/project/${id}`, { method: 'DELETE' });
        reloadData();
    } catch(err) { alert("ลบไม่สำเร็จ"); }
  };

  const getOwnerName = (uid) => {
    const owner = users.find(u => u.uid === uid);
    return owner ? owner.displayName : 'Unknown';
  };

  // กรองข้อมูลตามคำค้นหา
  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- UI Components ---
  if (checking) return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] font-['Prompt'] text-[#A67B5B]">
          <div className="flex flex-col items-center animate-pulse">
              <Shield size={48} className="mb-4" />
              <h2 className="text-xl font-medium">กำลังตรวจสอบสิทธิ์ Admin...</h2>
          </div>
      </div>
  );
  
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-['Prompt'] pb-20">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-[#4A3B32] text-white pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <Shield size={400} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-2 opacity-80">
                <Shield size={20} className="text-[#A67B5B]" />
                <span className="uppercase tracking-widest text-xs font-semibold">Admin Panel</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">จัดการระบบ</h1>
            <p className="text-white/60 mt-2">ควบคุมดูแลผู้ใช้งานและผลงานเพลงทั้งหมดในระบบ</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-orange-900/5 border border-orange-100 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
                <div>
                    <p className="text-gray-500 text-sm mb-1">เพลงทั้งหมดในระบบ</p>
                    <h3 className="text-4xl font-bold text-[#4A3B32]">{projects.length}</h3>
                </div>
                <div className="w-16 h-16 bg-[#A67B5B]/10 rounded-2xl flex items-center justify-center text-[#A67B5B] group-hover:bg-[#A67B5B] group-hover:text-white transition-colors">
                    <Music size={32} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-orange-900/5 border border-orange-100 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
                <div>
                    <p className="text-gray-500 text-sm mb-1">ผู้ใช้งานทั้งหมด</p>
                    <h3 className="text-4xl font-bold text-[#4A3B32]">{users.length}</h3>
                </div>
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users size={32} />
                </div>
            </div>
        </div>

        {/* Action Bar & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            {/* Custom Tabs */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex gap-1">
                <button 
                    onClick={() => setActiveTab('projects')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'projects' 
                        ? 'bg-[#A67B5B] text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    🎼 จัดการเพลง
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'users' 
                        ? 'bg-[#A67B5B] text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    👤 จัดการผู้ใช้
                </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#A67B5B] transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อเพลง หรือ ผู้ใช้..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all text-sm"
                />
            </div>
        </div>

        {/* --- Table Section --- */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden min-h-[400px]">
            
            {/* 1. Projects Table */}
            {activeTab === 'projects' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                                <th className="p-5 font-medium pl-8">ชื่อเพลง</th>
                                <th className="p-5 font-medium">เจ้าของผลงาน</th>
                                <th className="p-5 font-medium">เครื่องดนตรี</th>
                                <th className="p-5 font-medium">อัปเดตล่าสุด</th>
                                <th className="p-5 font-medium text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredProjects.map((p) => (
                                <tr key={p._id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors group">
                                    <td className="p-5 pl-8 font-semibold text-[#4A3B32]">
                                        {p.title || 'Untitled'}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                {getOwnerName(p.ownerUid).charAt(0)}
                                            </div>
                                            <span className="text-gray-600">{getOwnerName(p.ownerUid)}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-gray-500">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                            {p.meta?.instrument || '-'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-gray-400 text-xs">
                                        {new Date(p.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="p-5 flex justify-center gap-2">
                                        <button 
                                            onClick={() => navigate(`/editor/${p._id}`)}
                                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors tooltip"
                                            title="แก้ไข"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteProject(p._id)}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors hover:text-red-600"
                                            title="ลบเพลง"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProjects.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-gray-400">ไม่พบข้อมูลเพลง</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 2. Users Table */}
            {activeTab === 'users' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                                <th className="p-5 pl-8 font-medium">ผู้ใช้งาน</th>
                                <th className="p-5 font-medium">อีเมล</th>
                                <th className="p-5 font-medium">สถานะ</th>
                                <th className="p-5 font-medium">วันที่สมัคร</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredUsers.map((u) => (
                                <tr key={u._id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                    <td className="p-5 pl-8">
                                        <div className="flex items-center gap-3">
                                            {u.photoURL ? (
                                                <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500">
                                                    <Users size={20} />
                                                </div>
                                            )}
                                            <span className="font-semibold text-gray-700">{u.displayName || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-gray-600">{u.email}</td>
                                    <td className="p-5">
                                        {u.role === 'admin' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200">
                                                <Shield size={12} /> Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                                                User
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5 text-gray-400 text-xs">
                                        {new Date(u.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                             {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-gray-400">ไม่พบข้อมูลผู้ใช้</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}