// src/pages/EditorPage.jsx
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

const handlePDF = async () => {
    const pages = document.querySelectorAll('.sheet-page');
    if (pages.length === 0) {
        alert("ไม่พบหน้ากระดาษ");
        return;
    }

    document.body.style.cursor = 'wait';
    
    // ตั้งค่า PDF A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; // ความกว้าง A4
    // ❌ ลบ pdfHeight ที่ล็อคตายตัวออก

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        const canvas = await html2canvas(page, {
            scale: 2, // เพิ่มความชัด
            useCORS: true,
            logging: false,
            // ✅ บังคับขนาดการถ่ายภาพให้เท่ากับขนาด Element จริง
            width: page.offsetWidth,
            height: page.offsetHeight,
            windowWidth: page.scrollWidth,
            windowHeight: page.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        
        // ✅ คำนวณความสูงตามสัดส่วนจริง (Aspect Ratio) เพื่อไม่ให้ภาพยืด
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        
        // วางภาพลงไป (สูงเท่าไหร่ก็เท่านั้น ไม่ดึงยืด)
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`${metaData.title}.pdf`);
    document.body.style.cursor = 'default';
  };
  
function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [songData, setSongData] = useState(Array(8).fill().map(() => Array(8).fill('')));
  const [rowTypes, setRowTypes] = useState(Array(8).fill('single'));
  const [metaData, setMetaData] = useState({ title: "กำลังโหลด...", tempo: "", instrument: "kongwong", composer: "" });
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [bpm, setBpm] = useState(120); 
  const [isPlaying, setIsPlaying] = useState(false);
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
        fetch(`http://localhost:3001/api/project/${id}`)
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
  }, [songData, rowTypes, metaData, currentInst, currentFont]);

  const handleSaveToCloud = async (isAuto = false) => {
    if (isAuto) setSaveStatus('saving');
    const payload = {
        title: metaData.title,
        meta: { ...metaData, instrument: currentInst, font: currentFont },
        data: songData,
        rowTypes: rowTypes
    };
    try {
        const res = await fetch(`http://localhost:3001/api/project/${id}`, {
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

  // --- Handlers ---
  
  // ✅ แก้ไข: วาง handleInstrumentChange ไว้ตรงนี้ (ไม่อยู่ในฟังก์ชันอื่น)
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

  const handleDelete = () => { 
     const { row, col } = selectedCell;
     if (songData[row] && songData[row][col]) {
        addToHistory();
        const newData = [...songData];
        newData[row][col] = newData[row][col].slice(0, -1);
        setSongData(newData);
     }
  };

  const handleClearCell = () => { 
      addToHistory();
      const n = [...songData]; 
      n[selectedCell.row][selectedCell.col] = ''; 
      setSongData(n); 
  };

  // ✅ Room Operations (เพิ่มใหม่)
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
    const saveObj = { meta: { ...metaData, font: currentFont }, data: songData, rowTypes: rowTypes };
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
  
  // ✅ PDF Function แบบ Multi-page
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
    const pdfHeight = 297;

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
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save(`${metaData.title}.pdf`);
    document.body.style.cursor = 'default';
  };

  const handlePlayToggle = () => { 
    if(isPlaying){ stopSong(); setIsPlaying(false); } else { setIsPlaying(true); const startIndex = (selectedCell.row * 8) + selectedCell.col; playSong(songData, bpm, () => setIsPlaying(false), startIndex); } 
  };
  
  return (
    <div className="flex flex-col h-screen bg-[#F5F7FA]">
      <Navbar />
      <Toolbar 
          autoAdvance={autoAdvance} setAutoAdvance={setAutoAdvance}
          bpm={bpm} setBpm={setBpm} 
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
              <Sheet data={songData} rowTypes={rowTypes} selectedCell={selectedCell} onCellClick={handleCellClick} metaData={metaData} onMetaChange={handleMetaChange} currentFont={currentFont} />
          </div>
      </div>
      
      <Keyboard onKeyPress={handleNoteInput} onDelete={handleDelete} onClear={handleClearCell} />
    </div>
  )
}

export default EditorPage;