// src/components/Toolbar.jsx (ฉบับแก้ไข: BPM Min=20 และใช้ setBpm Prop)
import React from 'react';
import { 
  FileUp, FileDown, FilePlus, 
  Music, Printer, Trash2, 
  ChevronsRight, Type,
  Play, Square, Plus, Minus, 
  Undo2, Redo2,
  ArrowRightFromLine, ArrowLeftFromLine, 
  AlignJustify 
} from 'lucide-react';

const Toolbar = ({ 
  autoAdvance, setAutoAdvance, 
  bpm, setBpm, // setBpm ในที่นี้คือ handleBpmChange จาก EditorPage
  onNew, onSave, onOpen, onPDF, 
  onClearAll,
  instruments, currentInst, onInstrumentChange, isLoading,
  isAddPairMode, setIsAddPairMode,
  isPlaying, onPlayToggle, onAddRow,
  currentFont, onFontChange,
  onDeleteRow, onUndo, onRedo, canUndo, canRedo,
  onInsertRoom, onDeleteRoom 
}) => {
  return (
    <div className="w-full bg-white border-b border-gray-200 px-4 py-2 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 font-['Prompt'] z-40 relative">
      
      {/* 1. ส่วนเลือกเครื่องดนตรี */}
      <div className="flex items-center gap-3 w-full md:w-auto border-r border-gray-100 pr-4">
        <div className="w-10 h-10 bg-[#A67B5B]/10 rounded-lg flex items-center justify-center text-[#A67B5B]">
            <Music size={20} />
        </div>
        <div className="flex flex-col">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">เครื่องดนตรี</label>
            <select 
                value={currentInst}
                onChange={onInstrumentChange}
                disabled={isLoading}
                className="bg-transparent font-semibold text-gray-700 outline-none cursor-pointer min-w-[120px] text-sm hover:text-[#A67B5B] transition-colors"
            >
                {instruments && Object.values(instruments).map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* 2. ส่วนควบคุม (Undo/Redo + Play + BPM) */}
      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shadow-inner">
        <div className="flex gap-1 border-r border-gray-200 pr-3 mr-1">
            <button onClick={onUndo} disabled={!canUndo} className={`p-2 rounded-lg transition-all ${canUndo ? 'text-gray-600 hover:bg-white hover:text-[#A67B5B] shadow-sm' : 'text-gray-300 cursor-not-allowed'}`} title="ย้อนกลับ"><Undo2 size={18} /></button>
            <button onClick={onRedo} disabled={!canRedo} className={`p-2 rounded-lg transition-all ${canRedo ? 'text-gray-600 hover:bg-white hover:text-[#A67B5B] shadow-sm' : 'text-gray-300 cursor-not-allowed'}`} title="ทำซ้ำ"><Redo2 size={18} /></button>
        </div>
        <button onClick={onPlayToggle} className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all transform active:scale-95 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
            {isPlaying ? <Square size={16} fill="white" /> : <Play size={18} fill="white" className="ml-1" />}
        </button>
        <div className="flex flex-col w-20 md:w-24">
             <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">TEMPO</label>
                <span className="text-xs font-bold text-[#A67B5B]">{bpm}</span>
             </div>
             {/* 🎯 FIX 1: แก้ min เป็น 20 และเรียก setBpm ที่มาจาก Props */}
             <input 
                type="range" 
                min="20" // <-- แก้ไขที่นี่
                max="200" 
                value={bpm} 
                onChange={(e) => setBpm(e.target.value)} // setBpm คือ handleBpmChange ที่มี logic min/max
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
            />
        </div>
      </div>

      {/* 3. ✅ ส่วนจัดการโครงสร้าง (ห้อง & บรรทัด) - อยู่ใกล้กัน */}
      <div className="flex items-center gap-3 px-2 mx-2 border-l border-r border-gray-100">
         
         {/* กลุ่มจัดการห้อง (สีฟ้า) */}
         <div className="flex items-center bg-blue-50/50 border border-blue-100 rounded-lg p-1 gap-1">
            <button 
                onClick={onInsertRoom} 
                className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" 
                title="แทรกห้องว่าง (ดันโน้ตไปทางขวา)"
            >
                <ArrowRightFromLine size={16} /> <span className="text-xs font-medium hidden xl:inline">แทรกห้อง</span>
            </button>
            <div className="w-px h-4 bg-blue-200"></div>
            <button 
                onClick={onDeleteRoom} 
                className="flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" 
                title="ลบห้องนี้"
            >
                <ArrowLeftFromLine size={16} /> <span className="text-xs font-medium hidden xl:inline">ลบห้อง</span>
            </button>
         </div>

         {/* กลุ่มจัดการบรรทัด (สีส้ม) */}
         <div className="flex items-center bg-orange-50/50 border border-orange-100 rounded-lg p-1 gap-1">
            <button 
                onClick={onAddRow} 
                className="flex items-center gap-1 px-2 py-1.5 text-orange-600 hover:bg-orange-100 rounded-md transition-colors" 
                title="เพิ่มบรรทัดใหม่"
            >
                <Plus size={16} /> <span className="text-xs font-medium hidden xl:inline">เพิ่มบรรทัด</span>
            </button>
            <div className="w-px h-4 bg-orange-200"></div>
            <button 
                onClick={onDeleteRow} 
                className="flex items-center gap-1 px-2 py-1.5 text-orange-600 hover:bg-orange-100 rounded-md transition-colors" 
                title="ลบบรรทัดล่างสุด"
            >
                <Minus size={16} /> <span className="text-xs font-medium hidden xl:inline">ลบบรรทัด</span>
            </button>
         </div>

      </div>

      <div className="hidden md:block flex-1"></div>

      {/* 4. ส่วนตั้งค่า & ไฟล์ */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        
        {/* Settings */}
        <div className="hidden lg:flex items-center gap-3 border-r border-gray-200 pr-3 mr-1">
            <div className="flex items-center gap-1">
                <Type size={16} className="text-gray-400" />
                <select value={currentFont} onChange={(e) => onFontChange(e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs font-medium text-gray-700 hover:text-[#A67B5B]">
                    <option value="font-['Sarabun']">ทางการ</option>
                    <option value="font-['Prompt']">สวยงาม</option>
                </select>
            </div>
            
            <label className="flex items-center gap-1 cursor-pointer select-none hover:text-[#A67B5B]">
                <div className={`w-3 h-3 border rounded flex items-center justify-center ${autoAdvance ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-gray-300'}`}>
                    {autoAdvance && <ChevronsRight size={10} className="text-white" />}
                </div>
                <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="hidden" />
                <span className="text-xs">ออโต้</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer select-none hover:text-[#A67B5B]">
                <div className={`w-6 h-3.5 rounded-full p-0.5 transition-colors ${isAddPairMode ? 'bg-[#A67B5B]' : 'bg-gray-300'}`}>
                    <div className={`w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${isAddPairMode ? 'translate-x-2.5' : 'translate-x-0'}`}></div>
                </div>
                <input type="checkbox" checked={isAddPairMode} onChange={(e) => setIsAddPairMode(e.target.checked)} className="hidden" />
                <span className="text-xs">มือฆ้อง</span>
            </label>
        </div>

        {/* File Actions */}
        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
            <button onClick={onNew} title="เริ่มใหม่" className="p-1.5 text-gray-500 hover:bg-white hover:text-blue-500 rounded-md shadow-sm"><FilePlus size={18} /></button>
            <button onClick={onOpen} title="เปิดไฟล์" className="p-1.5 text-gray-500 hover:bg-white hover:text-green-600 rounded-md shadow-sm"><FileUp size={18} /></button>
            <button onClick={onSave} title="บันทึก JSON" className="p-1.5 text-gray-500 hover:bg-white hover:text-orange-500 rounded-md shadow-sm"><FileDown size={18} /></button>
        </div>
        <button onClick={onPDF} className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg" title="PDF"><Printer size={18} /></button>
        <button onClick={onClearAll} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg" title="ล้างทั้งหมด"><Trash2 size={18} /></button>
      </div>

    </div>
  );
};

export default Toolbar;