import React from 'react';

const NoteCell = ({ note, isActive, onClick }) => {
  // ฟังก์ชันช่วยจัดกลุ่ม: ตัวอักษร + สระ/จุด ให้เป็น 1 ก้อน
  const getVisualNotes = (text) => {
    if (!text) return [];
    
    const chars = text.split('');
    const groups = [];
    
    chars.forEach((char) => {
      // เช็คว่าเป็นสระบน/ล่าง หรือไม่ 
      // \u0E3A = พินทุ (จุดล่าง), \u0E4D = นิคหิต (วงกลมบน)
      const isMark = ['\u0E3A', '\u0E4D'].includes(char); 
      
      if (isMark && groups.length > 0) {
        // ถ้าเป็นสระ ให้เอาไปรวมกับตัวก่อนหน้า (เช่น 'ด' + 'ฺ' => 'ดฺ')
        groups[groups.length - 1] += char;
      } else {
        // ถ้าเป็นตัวอักษรปกติ หรือตัวแรกสุด ให้เริ่มกลุ่มใหม่
        groups.push(char);
      }
    });

    // ตัดให้เหลือแค่ 4 "กลุ่ม" (ไม่ใช่ 4 ตัวอักษรแล้ว)
    return groups.slice(0, 4);
  };

  const subNotes = getVisualNotes(note);

  return (
    <div 
      className={`note-cell ${isActive ? 'active' : ''}`} 
      onClick={onClick}
    >
      {/* ถ้าไม่มีโน้ต ให้แสดงพื้นที่ว่าง (เพื่อให้ Flex ทำงานถูกต้อง) */}
      {subNotes.length === 0 ? (
        <span style={{ visibility: 'hidden' }}>-</span>
      ) : (
        subNotes.map((group, index) => (
          <span key={index} className="note-char">
            {group}
          </span>
        ))
      )}
    </div>
  );
};

export default NoteCell;