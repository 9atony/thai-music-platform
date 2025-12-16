// src/pages/EditorPage.jsx (ฉบับแก้ไข: Final Fix - เพิ่ม State PlaybackCells และ Logic Highlight)
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toolbar from '../components/Toolbar';
import Sheet from '../components/Sheet';
import Keyboard from '../components/Keyboard';
import '../App.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { INSTRUMENTS } from '../utils/instruments';
import { playSong, stopSong, loadInstrumentSounds, playNote, changeInstrument } from '../utils/audioEngine';

// ✅ เพิ่ม BASE_API_URL เหมือนกับ DashboardPage.jsx
const BASE_API_URL = 'https://thai-music-platform.onrender.com';

function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [songData, setSongData] = useState(Array(8).fill().map(() => Array(8).fill('')));
  const [rowTypes, setRowTypes] = useState(Array(8).fill('single'));
  const [metaData, setMetaData] = useState({ title: "กำลังโหลด...", tempo: "", instrument: "kongwong", composer: "" });
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [autoAdvance, setAutoAdvance] = useState(true);
  
  // ค่าเริ่มต้น BPM (Default) เป็น 60
  const [bpm, setBpm] = useState(60); 
  
  const [isPlaying, setIsPlaying] = useState(false);
  // 🎯 FIX 1: เพิ่ม State ที่ขาดหายไป! (แก้ไข ReferenceError)
  const [playbackCells, setPlaybackCells] = useState([]); 
  
  const [pitchLevel, setPitchLevel] = useState('mid'); 
  const [currentInst, setCurrentInst] = useState('kongwong'); 
  const [isLoading, setIsLoading] = useState(false); 
  const [isAddPairMode, setIsAddPairMode] = useState(false);
  const [currentFont, setCurrentFont] = useState("font-['Sarabun']");
  
  // Undo / Redo
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [saveStatus, setSaveStatus] = useState('saved'); 
  const isFirstLoad = useRef(true);
  const fileInputRef = useRef(null);

  // Load Data
  useEffect(() => {
    if (id) {
        setIsLoading(true);
        // แก้ไข: เปลี่ยนจาก localhost เป็น BASE_API_URL (Render Domain)
        fetch(`${BASE_API_URL}/api/project/${id}`)
            .then(res => res.json())
            .then(async (project) => {
                if (!project || project.error) return;
                if (project.data) setSongData(project.data);
                if (project.rowTypes) setRowTypes(project.rowTypes);
                if (project.title) setMetaData(prev => ({ ...prev, title: project.title }));
                if (project.meta) {
                    setMetaData(prev => ({ ...prev, ...project.meta }));
                    if (project.meta.font) setCurrentFont(project.meta.font);
                    const inst = project.meta.instrument || 'kongwong';
                    if (INSTRUMENTS[inst]) {
                        setCurrentInst(inst);
                        await loadInstrumentSounds(inst);
                    }
                    // ดึงค่า BPM ที่บันทึกไว้ ถ้ามี
                    if (project.meta.bpm) setBpm(project.meta.bpm);
                }
                setIsLoading(false);
                setTimeout(() => { isFirstLoad.current = false; }, 1000);
            })
            .catch(err => setIsLoading(false));
    }
  }, [id]);

  // Auto Save
  useEffect(() => {
    if (!id || isLoading || isFirstLoad.current) return;
    setSaveStatus('unsaved');
    const timeoutId = setTimeout(() => handleSaveToCloud(true), 2000);
    return () => clearTimeout(timeoutId);
  }, [songData, rowTypes, metaData, currentInst, currentFont, bpm]);

  const handleSaveToCloud = async (isAuto = false) => {
    if (isAuto) setSaveStatus('saving');
    const payload = {
        title: metaData.title,
        // บันทึกค่า BPM ลงใน meta
        meta: { ...metaData, instrument: currentInst, font: currentFont, bpm: bpm },
        data: songData,
        rowTypes: rowTypes
    };
    try {
        // แก้ไข: เปลี่ยนจาก localhost เป็น BASE_API_URL (Render Domain)
        const res = await fetch(`${BASE_API_URL}/api/project/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) setSaveStatus('saved'); else setSaveStatus('error');
    } catch (err) { setSaveStatus('error'); }
  };

  // Undo Logic
  const addToHistory = () => {
    const currentState = {
        songData: JSON.parse(JSON.stringify(songData)),
        rowTypes: [...rowTypes]
    };
    setHistory(prev => [...prev, currentState]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setFuture(prev => [...prev, { songData, rowTypes }]);
    setSongData(previousState.songData);
    setRowTypes(previousState.rowTypes);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextState = future[future.length - 1];
    setHistory(prev => [...prev, { songData, rowTypes }]);
    setSongData(nextState.songData);
    setRowTypes(nextState.rowTypes);
    setFuture(prev => prev.slice(0, -1));
  };
  
  // ฟังก์ชันควบคุม BPM พร้อม Min/Max
  const handleBpmChange = (newBpm) => {
    const minBpm = 20;
    const maxBpm = 200;
    let value = parseInt(newBpm, 10);
    if (isNaN(value)) value = 60; // กลับไป default ถ้าไม่ใช่ตัวเลข
    
    // จำกัดค่าให้อยู่ในขอบเขต 20-200
    if (value < minBpm) value = minBpm;
    if (value > maxBpm) value = maxBpm;
    
    setBpm(value);
  };


  // --- Handlers ---
  
  const handleInstrumentChange = async (e) => {
    const instId = e.target.value;
    if (!INSTRUMENTS[instId]) return;
    setCurrentInst(instId);
    setIsLoading(true);
    setMetaData(prev => ({ ...prev, instrument: INSTRUMENTS[instId].name }));
    await changeInstrument(instId);
    setIsLoading(false);
  };

  const handleNoteInput = (n) => {
    let finalNote = n;
    playNote(finalNote);
    const { row, col } = selectedCell;
    if (!songData[row]) return;
    const currentText = songData[row][col] || '';
    const currentPureLen = currentText.replace(/[\u0E3A\u0E4D]/g, '').length;
    const incomingPureLen = finalNote.replace(/[\u0E3A\u0E4D]/g, '').length;
    if (currentPureLen + incomingPureLen > 4) return;

    addToHistory();
    const newData = [...songData];
    newData[row][col] = currentText + finalNote;
    setSongData(newData);
    if (autoAdvance && (currentPureLen + incomingPureLen) >= 4) {
        let nextCol = col + 1; let nextRow = row;
        if (nextCol >= 8) { nextCol = 0; nextRow += 1; }
        if (nextRow < songData.length) setSelectedCell({ row: nextRow, col: nextCol });
    }
  };

  // NEW/FIXED: Logic การลบโน้ตและเลื่อน Cursor ย้อนหลัง
  const handleDelete = () => { 
    const { row, col } = selectedCell;
    const currentCell = songData[row] ? songData[row][col] : null;
    
    let shouldMoveBackward = false; // Flag สำหรับการเลื่อน Cursor
    
    // 1. Logic การลบโน้ตและสระ
    if (currentCell) {
        addToHistory();
        const newData = [...songData];
        let updatedText = currentCell;

        const lastChar = currentCell.slice(-1);
        // \u0E3A = ไม้ไต่คู้ (บน, เสียงต่ำ), \u0E4D = ไม้ไต่คู้ (ล่าง, เสียงสูง)
        const isToneMark = lastChar === '\u0E3A' || lastChar === '\u0E4D';

        if (isToneMark && currentCell.length >= 2) { 
            // FIX: ลบทั้งโน้ตและเครื่องหมาย (2 ตัวอักษร)
            updatedText = currentCell.slice(0, -2); 
        } else {
            // ลบ 1 ตัวอักษรสุดท้าย (โน้ตเดี่ยว หรือขีด)
            updatedText = currentCell.slice(0, -1);
        }
        
        newData[row][col] = updatedText;
        setSongData(newData);

        if (updatedText === '') {
            shouldMoveBackward = true;
        }

    } else {
        // ถ้าช่องว่างอยู่แล้ว ก็ให้ข้ามไปช่องก่อนหน้าทันที
        shouldMoveBackward = true;
    }

    // 2. Logic เลื่อน Cursor ไปห้องก่อนหน้า (Continuous Room Deletion/Movement)
    if (shouldMoveBackward) {
        if (col > 0) {
            // เลื่อนไปคอลัมน์ก่อนหน้า
            setSelectedCell({ row, col: col - 1 });
        } else if (row > 0) {
            // ถ้าอยู่คอลัมน์แรก ให้เลื่อนไปคอลัมน์สุดท้าย (7) ของแถวบน
            setSelectedCell({ row: row - 1, col: 7 }); 
        }
    }
  };
  // ----------------------------------------------------


  const handleClearCell = () => { 
      addToHistory();
      const n = [...songData]; 
      n[selectedCell.row][selectedCell.col] = ''; 
      setSongData(n); 
  };

  // Room Operations 
  const handleInsertRoom = () => {
    if (!songData[selectedCell.row]) return;
    addToHistory();
    const newData = [...songData];
    const currentRow = [...newData[selectedCell.row]];
    currentRow.splice(selectedCell.col, 0, ''); // แทรก
    if (currentRow.length > 8) currentRow.pop(); // ตัดหาง
    newData[selectedCell.row] = currentRow;
    setSongData(newData);
  };

  const handleDeleteRoom = () => {
    if (!songData[selectedCell.row]) return;
    addToHistory();
    const newData = [...songData];
    const currentRow = [...newData[selectedCell.row]];
    currentRow.splice(selectedCell.col, 1); // ลบ
    currentRow.push(''); // เติมหาง
    newData[selectedCell.row] = currentRow;
    setSongData(newData);
  };

  // Row Operations
  const handleAddRow = () => {
    addToHistory();
    if (isAddPairMode) { 
        setSongData([...songData, Array(8).fill(''), Array(8).fill('')]); 
        setRowTypes([...rowTypes, 'pair_top', 'pair_bottom']); 
    } else { 
        setSongData([...songData, Array(8).fill('')]); 
        setRowTypes([...rowTypes, 'single']); 
    }
  };

  const handleDeleteRow = () => {
      if (songData.length === 0) return;
      addToHistory();
      const lastType = rowTypes[rowTypes.length - 1];
      if (lastType === 'pair_bottom') {
          setSongData(prev => prev.slice(0, -2));
          setRowTypes(prev => prev.slice(0, -2));
      } else {
          setSongData(prev => prev.slice(0, -1));
          setRowTypes(prev => prev.slice(0, -1));
      }
  };

  const handleClearAll = () => { 
      if (window.confirm("ยืนยันล้างโน้ต?")) { 
          addToHistory();
          stopSong(); 
          setIsPlaying(false); 
          setSongData(Array(8).fill().map(() => Array(8).fill(''))); 
          setRowTypes(Array(8).fill('single')); 
      }
  };

  const handleImportFile = (event) => { 
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json.data && json.rowTypes) {
            addToHistory();
            setSongData(json.data); setRowTypes(json.rowTypes);
            if (json.meta) {
                setMetaData(prev => ({ ...prev, ...json.meta }));
                if (json.meta.title) setMetaData(prev => ({ ...prev, title: json.meta.title }));
                if (json.meta.font) setCurrentFont(json.meta.font);
                if (json.meta.instrument && INSTRUMENTS[json.meta.instrument]) {
                    setCurrentInst(json.meta.instrument);
                    await loadInstrumentSounds(json.meta.instrument);
                }
                // ดึงค่า BPM จากไฟล์ที่ Import
                if (json.meta.bpm) setBpm(json.meta.bpm); 
            }
            alert(`✅ โหลดเพลงเรียบร้อย!`);
        }
      } catch (err) { alert("❌ อ่านไฟล์ล้มเหลว"); }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleCellClick = (row, col) => setSelectedCell({ row, col });
  const handleMetaChange = (field, value) => setMetaData(prev => ({ ...prev, [field]: value }));
  const handleExportFile = () => { 
    // บันทึกค่า BPM ลงในไฟล์ JSON ที่ Export
    const saveObj = { meta: { ...metaData, font: currentFont, bpm: bpm }, data: songData, rowTypes: rowTypes };
    const dataStr = JSON.stringify(saveObj);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metaData.title}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // PDF Function แบบ Multi-page
  const handlePDF = async () => {
    // หาหน้ากระดาษทั้งหมดที่มี class 'sheet-page' (จาก Sheet.jsx)
    const pages = document.querySelectorAll('.sheet-page');
    if (pages.length === 0) {
        alert("ไม่พบหน้ากระดาษ");
        return;
    }

    document.body.style.cursor = 'wait';
    
    // สร้าง PDF A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const canvas = await html2canvas(page, {
            scale: 2, 
            useCORS: true,
            logging: false,
            windowWidth: page.scrollWidth,
            windowHeight: page.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, 0); 
    }

    pdf.save(`${metaData.title}.pdf`);
    document.body.style.cursor = 'default';
  };

// 🎯 FIX 2: แก้ไข handlePlayToggle เพื่อส่ง Callback Highlight และล้าง State เมื่อหยุด
  const handlePlayToggle = () => { 
    if(isPlaying){ 
        stopSong(); 
        setIsPlaying(false); 
        // 🚨 FIX 3: ล้าง Highlight เมื่อหยุดเล่น
        setPlaybackCells([]); 
    } else { 
        setIsPlaying(true); 
        const startIndex = (selectedCell.row * 8) + selectedCell.col; 
        
        // 🚨 FIX 4: Callback function สำหรับ Engine เพื่ออัปเดตตำแหน่ง Highlight
        const updateHighlight = (cellsToHighlight) => {
            setPlaybackCells(cellsToHighlight);
        };

        // ส่ง rowTypes และ updateHighlight เข้าไปใน playSong
        playSong(songData, bpm, rowTypes, () => {
            // เมื่อเล่นจบ
            setIsPlaying(false);
            setPlaybackCells([]);
        }, updateHighlight, startIndex); // ✅ ส่ง updateHighlight
    } 
  };
  
  return (
    <div className="flex flex-col h-screen bg-[#F5F7FA]">
      <Navbar />
      <Toolbar 
          autoAdvance={autoAdvance} setAutoAdvance={setAutoAdvance}
          // ส่งฟังก์ชัน handleBpmChange ไปยัง Toolbar
          bpm={bpm} setBpm={handleBpmChange} 
          onNew={handleClearAll} onSave={handleExportFile} onPDF={handlePDF} onClearAll={handleClearAll}
          instruments={INSTRUMENTS} currentInst={currentInst} onInstrumentChange={handleInstrumentChange}
          isLoading={isLoading} isAddPairMode={isAddPairMode} setIsAddPairMode={setIsAddPairMode}
          onOpen={() => fileInputRef.current.click()} 
          isPlaying={isPlaying} onPlayToggle={handlePlayToggle} onAddRow={handleAddRow}
          currentFont={currentFont} onFontChange={setCurrentFont}
          onDeleteRow={handleDeleteRow}
          onUndo={handleUndo} onRedo={handleRedo} canUndo={history.length > 0} canRedo={future.length > 0}
          onInsertRoom={handleInsertRoom} onDeleteRoom={handleDeleteRoom}
      />
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleImportFile} />

      <div className="flex-1 overflow-auto relative flex justify-center bg-[#5c5c5c]">
          <div className="fixed top-24 right-6 text-xs text-white/50 z-10 font-['Prompt']">
              {saveStatus === 'saved' && "✅ บันทึกอัตโนมัติ"}
              {saveStatus === 'saving' && "⏳ กำลังบันทึก..."}
              {saveStatus === 'unsaved' && "✏️ ..."}
          </div>
          <div className="w-full flex justify-center pb-32 pt-8">
               {/* 🎯 FIX 5: ส่ง State Highlight ไปที่ Sheet */}
              <Sheet 
                  data={songData} 
                  rowTypes={rowTypes} 
                  selectedCell={selectedCell} 
                  onCellClick={handleCellClick} 
                  metaData={metaData} 
                  onMetaChange={handleMetaChange} 
                  currentFont={currentFont}
                  playbackCells={playbackCells} // ✅ ส่ง State ใหม่
              />
          </div>
      </div>
      
      <Keyboard onKeyPress={handleNoteInput} onDelete={handleDelete} onClear={handleClearCell} />
    </div>
  )
}

export default EditorPage;