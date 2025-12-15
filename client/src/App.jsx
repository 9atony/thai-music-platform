// src/App.jsx (ฉบับสมบูรณ์ แก้ Error ซ้ำ)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import หน้าจอต่างๆ
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import AdminPage from './pages/AdminPage'; // เพิ่มหน้า Admin

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. เข้ามาครั้งแรก เด้งไป Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 2. หน้า Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 3. หน้า Dashboard (รวมเพลง) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* 4. หน้า Editor (ทำเพลง) */}
        <Route path="/editor/:id" element={<EditorPage />} />
        
        {/* 5. หน้า Admin (สำหรับผู้ดูแล) */}
        <Route path="/admin" element={<AdminPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;