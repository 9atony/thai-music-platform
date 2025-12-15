// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; 
// ✅ เพิ่ม Trash2 สำหรับปุ่มลบ
import { Plus, Music, Clock, Search, FileAudio, Trash2 } from 'lucide-react'; 

// 💡 FIX 5: กำหนด URL ของ Backend (Placeholder)
// **ต้องเปลี่ยน 'https://YOUR-BACKEND-DOMAIN.render.com' เป็น Domain จริงหลัง Deploy Render**
const BASE_API_URL = 'https://YOUR-BACKEND-DOMAIN.render.com';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [userData, setUserData] = useState(null); 
  const navigate = useNavigate();
  
  const myUid = localStorage.getItem('uid'); 

  useEffect(() => {
    if(!myUid) {
        navigate('/login');
        return;
    }
    fetchProjects();
    fetchUserData();
  }, []);

  // ดึงชื่อ User มาโชว์ใน Banner
  const fetchUserData = async () => {
    try {
        // 🎯 FIX 6: ใช้ BASE_API_URL
        const res = await fetch(`${BASE_API_URL}/api/admin/users`); 
        const users = await res.json();
        const me = users.find(u => u.uid === myUid);
        if (me) setUserData(me);
    } catch (error) { console.error(error); }
  };

  const fetchProjects = async () => {
    try {
        // 🎯 FIX 7: ใช้ BASE_API_URL
        const res = await fetch(`${BASE_API_URL}/api/projects/${myUid}`);
        if (!res.ok) throw new Error("ดึงข้อมูลไม่สำเร็จ");
        const data = await res.json();
        setProjects(data);
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
  };

  const createNewProject = async () => {
    const defaultData = {
        ownerUid: myUid,
        title: "เพลงใหม่ (Untitled)",
        meta: { tempo: "", instrument: "ranatek", composer: "" }, 
        data: Array(8).fill().map(() => Array(8).fill('')), 
        rowTypes: Array(8).fill('single') 
    };

    try {
        // 🎯 FIX 8: ใช้ BASE_API_URL
        const res = await fetch(`${BASE_API_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultData)
        });
        const newProject = await res.json();
        navigate(`/editor/${newProject._id}`);
    } catch (error) {
        console.error("Error creating project:", error);
        alert("สร้างเพลงใหม่ไม่สำเร็จ ตรวจสอบ Server");
    }
  };

  // ✅ ฟังก์ชันลบ Project
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Project นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
        return;
    }
    
    try {
        // 🎯 FIX 9: ใช้ BASE_API_URL
        const response = await fetch(`${BASE_API_URL}/api/project/${projectId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            setProjects(projects.filter(p => p._id !== projectId));
            alert('✅ Project ถูกลบเรียบร้อยแล้ว');
        } else {
            const errorData = await response.json();
            alert(`❌ ไม่สามารถลบ Project ได้: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        alert('❌ การเชื่อมต่อล้มเหลว ไม่สามารถลบ Project ได้');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-['Prompt']">
        
        <Navbar />
        
        {/* --- Hero Banner Section --- */}
        <div className="bg-[#4A3B32] text-white pt-10 pb-20 px-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                <Music size={300} />
            </div>
            <div className="container mx-auto relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    สวัสดีคุณ, {userData?.displayName || 'นักดนตรี'} 👋
                </h1>
                <p className="text-white/80 text-lg">
                    พร้อมที่จะสร้างสรรค์บทเพลงไทยใหม่ๆ วันนี้หรือยัง?
                </p>
            </div>
        </div>

        {/* --- Main Content (เลื่อนขึ้นมาทับ Banner นิดนึงให้ดูมีมิติ) --- */}
        <div className="container mx-auto px-6 -mt-10 relative z-20 pb-12">
            
            {/* Header + Search Bar (ถ้าอนาคตอยากทำ) */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 hidden md:flex items-center w-64">
                    <Search className="ml-3 text-gray-400" size={20}/>
                    <input type="text" placeholder="ค้นหาเพลง..." className="w-full px-3 py-2 outline-none text-gray-700 bg-transparent"/>
                </div>
                
                <button 
                    onClick={createNewProject}
                    className="bg-gradient-to-r from-[#A67B5B] to-[#8a654b] hover:from-[#956d50] hover:to-[#785740] text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-900/20 flex items-center gap-2 transition-all transform hover:-translate-y-1 font-medium"
                >
                    <Plus size={24} /> สร้างเพลงใหม่
                </button>
            </div>

            {/* --- Project Grid --- */}
            {projects.length === 0 ? (
                // กรณีไม่มีเพลง (Empty State)
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileAudio size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700">ยังไม่มีผลงานเพลง</h3>
                    <p className="text-gray-500 mb-6 max-w-sm">เริ่มต้นการเดินทางทางดนตรีของคุณ ด้วยการสร้างโน้ตเพลงไทยเพลงแรกเลย!</p>
                    <button onClick={createNewProject} className="text-[#A67B5B] font-semibold hover:underline">
                        + สร้างเพลงแรกของคุณ
                    </button>
                </div>
            ) : (
                // กรณีมีเพลง (Show Grid)
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    {/* การ์ดปุ่มสร้าง (ทางลัด) */}
                    <div 
                        onClick={createNewProject}
                        className="group h-64 border-2 border-dashed border-[#A67B5B]/30 hover:border-[#A67B5B] bg-[#A67B5B]/5 hover:bg-[#A67B5B]/10 rounded-2xl flex flex-col justify-center items-center cursor-pointer transition-all duration-300"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                            <Plus size={32} className="text-[#A67B5B]" />
                        </div>
                        <span className="font-medium text-[#A67B5B]">สร้างผลงานใหม่</span>
                    </div>

                    {/* รายการเพลง */}
                    {projects.map((p) => (
                        <div 
                            key={p._id}
                            onClick={() => navigate(`/editor/${p._id}`)}
                            className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 cursor-pointer transition-all duration-300 hover:-translate-y-1 group flex flex-col h-64 relative overflow-hidden"
                        >
                            {/* Decorative Top Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A67B5B] to-[#d4b483] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            {/* Thumbnail Area */}
                            <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 flex flex-col items-center justify-center relative border border-gray-50 group-hover:border-[#A67B5B]/20 transition-colors">
                                <Music size={48} className="text-gray-300 group-hover:text-[#A67B5B] transition-colors duration-300" />
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-2 font-medium">
                                    {p.meta?.instrument || 'ระนาดเอก'}
                                </span>
                            </div>
                            
                            {/* Content */}
                            <div className="relative"> {/* ต้องเพิ่ม relative เพื่อให้ปุ่มลบวางซ้อนได้ */}
                                <h3 className="font-bold text-gray-800 text-lg truncate mb-1 group-hover:text-[#A67B5B] transition-colors">
                                    {p.title || "ไม่มีชื่อเพลง"}
                                </h3>
                                <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(p.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit'})}
                                    </span>
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                        แก้ไขล่าสุด
                                    </span>
                                </div>
                                
                                {/* ✅ NEW: ปุ่มลบ Project */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // หยุดไม่ให้คลิกแล้วนำทางไปยัง Editor
                                        handleDeleteProject(p._id);
                                    }}
                                    className="absolute -top-10 right-0 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="ลบ Project"
                                >
                                    <Trash2 size={18} />
                                </button>
                                {/* 🎯 สิ้นสุดปุ่มลบ Project */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}