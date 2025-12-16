// src/utils/audioEngine.js (ฉบับแก้ไข: ส่งตำแหน่ง Highlight ใน Pair Mode)
import { INSTRUMENTS } from './instruments';

let audioCtx = null;
let currentInstrumentId = 'kongwong'; 
let soundBuffers = {}; 
let isPlaying = false;
let currentTimeoutId = null; 
let currentNoteIndex = 0; 

const CHAR_MAP = {
    'ด': 'd', 'ร': 'r', 'ม': 'm', 'ฟ': 'f', 'ซ': 's', 'ล': 'l', 'ท': 't'
};

// ... (ฟังก์ชัน getFileName, loadInstrumentSounds, playBufferAtTime, playNote เหมือนเดิม)

export const loadInstrumentSounds = async (instrumentId) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // ... (logic โหลดเสียงเหมือนเดิม)
};

const playBufferAtTime = (fileName, time) => {
    if (!audioCtx) return;
    // ... (logic เล่นเสียงที่แม่นยำเหมือนเดิม)
};

export const playNote = (noteChar, time = 0) => {
    const fileName = getFileName(noteChar);
    if (fileName) {
        playBufferAtTime(fileName, time);
    }
};

// ✅ NEW: ฟังก์ชันเล่นโน้ตแบบต่อเนื่อง (เพิ่ม onUpdateCurrentCell)
export const playSong = async (songData, bpm = 120, rowTypes, onComplete, onUpdateCurrentCell, startIndex = 0) => {
    if (isPlaying) stopSong();
    
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!soundBuffers[currentInstrumentId]) {
        await loadInstrumentSounds(currentInstrumentId);
    }

    isPlaying = true;
    currentNoteIndex = startIndex; 
    
    const timePerCell = 60 / bpm; 
    const totalCells = songData.reduce((acc, row) => acc + row.length, 0);

    let allCells = [];
    songData.forEach(row => row.forEach(cell => allCells.push(cell)));

    const internalPlayLoop = () => {
        if (!isPlaying) {
            // เรียก onComplete เมื่อหยุดเล่นกลางคัน
            if (onComplete) onComplete(); 
            return;
        }

        if (currentNoteIndex >= totalCells) {
            currentNoteIndex = 0; // วนกลับไปเริ่มต้น
        }

        const currentCellIndex = currentNoteIndex;
        const rowIndex = Math.floor(currentCellIndex / 8);
        const colIndex = currentCellIndex % 8;

        const cellText = allCells[currentCellIndex];
        const isPairBottom = rowTypes[rowIndex] === 'pair_bottom';
        const isPairTop = rowTypes[rowIndex] === 'pair_top';

        // 🎯 FIX 1: การอัปเดต Highlight ณ จุดเริ่มต้นของห้อง
        if (onUpdateCurrentCell && !isPairBottom) { // ไม่ต้อง Highlight Row Bottom เพราะ Row Top จะจัดการ
            const highlightCells = [{row: rowIndex, col: colIndex}]; 
            
            // 💡 ถ้าเป็น Row Top ให้ส่งตำแหน่งของ Row Bottom เข้าไปด้วย
            if (isPairTop) {
                const bottomRowIndex = rowIndex + 1;
                if (bottomRowIndex < songData.length && rowTypes[bottomRowIndex] === 'pair_bottom') {
                    highlightCells.push({row: bottomRowIndex, col: colIndex});
                }
            }
            // เรียก Callback เพื่ออัปเดต State ที่ EditorPage
            onUpdateCurrentCell(highlightCells); 
        }

        // 🎯 Logic เล่นโน้ตพร้อมกัน (Pair Mode)
        if (isPairTop) {
            // โน้ตมือบน (Row Top)
            if (cellText && cellText !== '') {
                const notesInCell = cellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
                const noteCount = notesInCell.length;
                
                if (noteCount > 0) {
                    const timePerNote = timePerCell / noteCount;
                    
                    notesInCell.forEach((note, noteIndex) => {
                         if (note !== '-') { playNote(note, (noteIndex * timePerNote)); }
                    });
                }
            }
            
            // 💡 เล่นโน้ตมือล่าง (Row Bottom) พร้อมกัน
            const bottomRowIndex = rowIndex + 1;
            if (bottomRowIndex < songData.length && rowTypes[bottomRowIndex] === 'pair_bottom') {
                const bottomCellText = songData[bottomRowIndex][colIndex];
                
                if (bottomCellText && bottomCellText !== '') {
                     const notesInCell = bottomCellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
                     const noteCount = notesInCell.length;
                     
                     if (noteCount > 0) {
                         const timePerNote = timePerCell / noteCount;
                         
                         notesInCell.forEach((note, noteIndex) => {
                             if (note !== '-') { playNote(note, (noteIndex * timePerNote)); }
                         });
                     }
                }
            }
            
            currentNoteIndex += 8; // ข้ามไป Row ถัดไป

        } else if (isPairBottom) {
             currentNoteIndex += 1; // ข้ามช่องนี้ไป (ถูกเล่นไปแล้ว)

        } else {
             // โน้ตบรรทัดเดียว (Single) - Logic เดิม
             if (cellText && cellText !== '') {
                 const notesInCell = cellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
                 const noteCount = notesInCell.length;

                 if (noteCount > 0) {
                     const timePerNote = timePerCell / noteCount;

                     notesInCell.forEach((note, noteIndex) => {
                         if (note !== '-') { playNote(note, (noteIndex * timePerNote)); }
                     });
                 }
             }
             currentNoteIndex += 1;
        }

        // กำหนดเวลาสำหรับ Loop ถัดไป
        currentTimeoutId = setTimeout(internalPlayLoop, timePerCell * 1000);
    };

    internalPlayLoop();
};

export const stopSong = () => {
    isPlaying = false;
    if (currentTimeoutId) clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
    currentNoteIndex = 0; 
};

export const changeInstrument = async (instId) => {
    await loadInstrumentSounds(instId);
};