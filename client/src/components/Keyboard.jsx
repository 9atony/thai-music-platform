// src/components/Keyboard.jsx
import React, { useRef, useEffect } from 'react';
import { Delete, Eraser, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Keyboard({ onKeyPress, onDelete, onClear }) {
  
  const scrollRef = useRef(null);

  // สีประจำโน้ต (ด=แดง, ร=เหลือง, etc.)
  const colors = {
    'ด': '#e74c3c', 'ร': '#f1c40f', 'ม': '#2ecc71', 'ฟ': '#e67e22', 
    'ซ': '#3498db', 'ล': '#9b59b6', 'ท': '#e84393'
  };

  const baseNotes = ['ด', 'ร', 'ม', 'ฟ', 'ซ', 'ล', 'ท'];

  // สร้างชุดโน้ต 3 ระดับเสียง (ต่ำ -> กลาง -> สูง)
  const allNotes = [
    // 1. เสียงต่ำ (มีจุดด้านล่าง)
    ...baseNotes.map(n => ({ char: n, suffix: '\u0E3A', type: 'low', display: n, mark: '•' })), 
    // 2. เสียงกลาง (ปกติ)
    ...baseNotes.map(n => ({ char: n, suffix: '', type: 'mid', display: n, mark: '' })),
    // 3. เสียงสูง (มีวงกลมด้านบน)
    ...baseNotes.map(n => ({ char: n, suffix: '\u0E4D', type: 'high', display: n, mark: '°' }))
  ];

  // ฟังก์ชันช่วยกดโน้ต (ส่งค่าพร้อมวรรณยุกต์ไปเลย)
  const handlePress = (noteObj) => {
    // ส่งตัวอักษร + สระ/วรรณยุกต์ ไปให้ EditorPage โดยตรง
    // (EditorPage ไม่ต้องเช็ค pitchLevel แล้ว เพราะเราส่งไปครบแล้ว)
    onKeyPress(noteObj.char + noteObj.suffix);
  };

  // เลื่อน Scroll ไปตรงกลางตอนเริ่มต้น (เพื่อให้เห็นเสียงกลางก่อน)
  useEffect(() => {
    if (scrollRef.current) {
        // เลื่อนไปที่ประมาณ 1/3 ของความกว้าง (จุดเริ่มเสียงกลาง)
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth / 3.5;
    }
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#f8f5f2] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-[#A67B5B]/20 z-50 flex flex-col h-[320px] md:h-[300px]">
      
      {/* 1. แถบเครื่องมือ (ลบ / ล้าง) */}
      <div className="flex justify-between items-center px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        <span className="text-xs font-bold text-[#A67B5B] uppercase tracking-widest">
            แป้นพิมพ์ตัวโน้ต (Full Range)
        </span>
        <div className="flex gap-3">
            <button 
                onClick={onClear} 
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                title="ล้างช่องนี้"
            >
                <Eraser size={20} />
            </button>
            <button 
                onClick={onDelete} 
                className="flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-600 hover:text-white transition-all font-medium text-sm shadow-sm"
            >
                <Delete size={18} /> ลบ
            </button>
        </div>
      </div>

      {/* 2. พื้นที่ลิ่มนิ้ว (เลื่อนซ้าย-ขวาได้) */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden bg-[#e5e5e5] relative custom-scrollbar scroll-smooth"
      >
        <div className="flex h-full min-w-max px-[50vw] md:px-0 md:justify-center items-end pb-2 pt-4 gap-1.5">
            {allNotes.map((note, index) => (
                <button
                    key={`${note.type}-${note.char}-${index}`}
                    onClick={() => handlePress(note)}
                    className="relative group flex-shrink-0 w-14 md:w-16 h-[85%] bg-white rounded-b-lg border border-gray-300 border-t-0 shadow-[0_4px_0_#c0c0c0] active:shadow-none active:translate-y-1 active:border-t-4 transition-all flex flex-col items-center justify-end pb-4 mx-[1px]"
                    style={{ 
                        borderBottom: `6px solid ${colors[note.char]}`,
                        // ถ้าเป็นเสียงต่ำ/สูง ให้พื้นหลังตุ่นๆ หน่อย เพื่อแยกแยะง่าย
                        background: note.type === 'mid' ? 'white' : '#f9f9f9' 
                    }}
                >
                    {/* สัญลักษณ์ Pitch (จุด/วงกลม) */}
                    <div className={`absolute top-2 text-xl font-bold ${note.type === 'mid' ? 'hidden' : 'text-gray-400'}`}>
                        {note.mark}
                    </div>

                    {/* ชื่อโน้ต */}
                    <span className="text-3xl font-bold text-gray-800 font-['Prompt'] group-hover:scale-110 transition-transform">
                        {note.display}
                    </span>

                    {/* Label บอกประเภทเสียง (เล็กๆ) */}
                    <span className="text-[9px] text-gray-300 uppercase mt-1 font-bold tracking-tighter">
                        {note.type}
                    </span>
                </button>
            ))}
        </div>
        
        {/* ลูกศรบอกทิศทาง (ตกแต่ง) */}
        <div className="absolute top-1/2 left-2 pointer-events-none opacity-20"><ChevronLeft /></div>
        <div className="absolute top-1/2 right-2 pointer-events-none opacity-20"><ChevronRight /></div>
      </div>

      {/* 3. ปุ่มขีด (Dash) - ใหญ่สะใจด้านล่างสุด */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0 pb-safe">
        <button
            onClick={() => onKeyPress('-')}
            className="w-full h-14 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 active:scale-[0.99] text-gray-500 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center gap-3 transition-all"
        >
            <Minus size={28} strokeWidth={3} />
            <span className="text-lg font-bold font-['Prompt']">ขีด (เว้นวรรค)</span>
        </button>
      </div>

    </div>
  );
}