// src/utils/audioEngine.js (ฉบับแก้ไข: Continuous Play และ Pair Mode Playback)
import { INSTRUMENTS } from './instruments';

let audioCtx = null;
let currentInstrumentId = 'kongwong'; 
let soundBuffers = {}; 
let isPlaying = false;
let currentTimeoutId = null; // ใช้สำหรับหยุดการเล่นต่อเนื่อง
let currentNoteIndex = 0; // ติดตามโน้ตตัวที่กำลังเล่น

const CHAR_MAP = {
    'ด': 'd', 'ร': 'r', 'ม': 'm', 'ฟ': 'f', 'ซ': 's', 'ล': 'l', 'ท': 't'
};

const getFileName = (noteChar) => {
    if (!noteChar || noteChar === '-') return null;

    const baseChar = noteChar.charAt(0);
    const suffix = noteChar.slice(1);    
    
    const filePrefix = CHAR_MAP[baseChar];
    if (!filePrefix) return null;

    let level = '2'; 
    if (suffix.includes('\u0E3A')) level = '1';
    else if (suffix.includes('\u0E4D')) level = '3';

    return `${filePrefix}${level}`; 
};

export const loadInstrumentSounds = async (instrumentId) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    if (soundBuffers[instrumentId]) {
        currentInstrumentId = instrumentId;
        return;
    }

    const instrument = INSTRUMENTS[instrumentId];
    if (!instrument) return;

    soundBuffers[instrumentId] = {};
    console.log(`Loading sounds for: ${instrument.name}...`);

    const notes = ['d', 'r', 'm', 'f', 's', 'l', 't'];
    const levels = ['1', '2', '3'];
    const loadPromises = [];

    levels.forEach(lvl => {
        notes.forEach(note => {
            const fileName = `${note}${lvl}`;
            const url = `${instrument.folder}/${fileName}.wav`;
            
            const p = fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`File not found: ${url}`);
                    return res.arrayBuffer();
                })
                .then(buf => audioCtx.decodeAudioData(buf))
                .then(decoded => {
                    soundBuffers[instrumentId][fileName] = decoded;
                })
                .catch(() => {});
            loadPromises.push(p);
        });
    });

    await Promise.all(loadPromises);
    currentInstrumentId = instrumentId;
    console.log(`Loaded ${instrumentId} complete.`);
};

const playBufferAtTime = (fileName, time) => {
    if (!audioCtx) return;

    const buffers = soundBuffers[currentInstrumentId];
    if (buffers && buffers[fileName]) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[fileName];
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.0;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 🎯 กำหนดเวลาเล่นเสียงที่แน่นอน: audioCtx.currentTime + time
        source.start(audioCtx.currentTime + time);
    }
};

export const playNote = (noteChar, time = 0) => {
    const fileName = getFileName(noteChar);
    if (fileName) {
        playBufferAtTime(fileName, time);
    }
};

// 💡 NEW: ฟังก์ชันเล่นโน้ตแบบต่อเนื่อง
export const playSong = async (songData, bpm = 120, rowTypes, onComplete, startIndex = 0) => {
    if (isPlaying) stopSong();
    
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!soundBuffers[currentInstrumentId]) {
        await loadInstrumentSounds(currentInstrumentId);
    }

    isPlaying = true;
    currentNoteIndex = startIndex; // เริ่มจาก index ที่กำหนด
    
    // เวลาต่อ 1 ช่อง (1 จังหวะ) หน่วยเป็นวินาที
    const timePerCell = 60 / bpm; 
    const totalCells = songData.reduce((acc, row) => acc + row.length, 0);

    // 1. แปลงข้อมูลทั้งหมดเป็นเส้นตรง (1D Array) - ยังคงจำเป็น
    let allCells = [];
    songData.forEach(row => row.forEach(cell => allCells.push(cell)));

    const internalPlayLoop = () => {
        if (!isPlaying) return;

        // 💡 ตรวจสอบจุดจบ: ถ้าเล่นจนจบ Array แล้ว ให้วนกลับไปเริ่มต้น
        if (currentNoteIndex >= totalCells) {
            currentNoteIndex = 0;
            // ถ้าไม่ต้องการวน ให้ใส่ if (onComplete) onComplete(); return;
            // แต่โจทย์ต้องการเล่นไปเรื่อยๆ
        }

        const currentCellIndex = currentNoteIndex;
        const rowIndex = Math.floor(currentCellIndex / 8);
        const colIndex = currentCellIndex % 8;

        const cellText = allCells[currentCellIndex];
        const isPairBottom = rowTypes[rowIndex] === 'pair_bottom';
        const isPairTop = rowTypes[rowIndex] === 'pair_top';

        // 🎯 Logic เล่นโน้ตพร้อมกัน (Pair Mode)
        if (isPairTop) {
            // โน้ตมือบน (Row Top)
            if (cellText && cellText !== '') {
                // ... (Logic เดิมของการแยกโน้ตย่อย)
                const notesInCell = cellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
                const noteCount = notesInCell.length;
                
                if (noteCount > 0) {
                    const timePerNote = timePerCell / noteCount;
                    const startTime = audioCtx.currentTime;

                    notesInCell.forEach((note, noteIndex) => {
                         if (note !== '-') {
                            // เล่นโน้ตมือบน
                            playNote(note, (noteIndex * timePerNote)); 
                         }
                    });
                }
            }
            
            // 💡 เล่นโน้ตมือล่าง (Row Bottom) พร้อมกัน
            const bottomRowIndex = rowIndex + 1;
            if (bottomRowIndex < songData.length && rowTypes[bottomRowIndex] === 'pair_bottom') {
                const bottomCellText = songData[bottomRowIndex][colIndex];
                
                if (bottomCellText && bottomCellText !== '') {
                     // ... (Logic เดิมของการแยกโน้ตย่อย)
                     const notesInCell = bottomCellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
                     const noteCount = notesInCell.length;
                     
                     if (noteCount > 0) {
                         const timePerNote = timePerCell / noteCount;
                         
                         notesInCell.forEach((note, noteIndex) => {
                             if (note !== '-') {
                                // เล่นโน้ตมือล่าง
                                playNote(note, (noteIndex * timePerNote)); 
                             }
                         });
                     }
                }
            }
            
            // 💡 ถ้าเป็น Row Top ต้องข้าม Row Bottom ไปเลย
            currentNoteIndex += 8; // ข้ามไป Row ถัดไป (ซึ่งคือ Row Top ตัวต่อไป)

        } else if (isPairBottom) {
            // โน้ตมือล่าง จะถูกข้ามไปในรอบ Row Top แล้ว
             currentNoteIndex += 1; // ข้ามช่องนี้ไป

        } else {
             // โน้ตบรรทัดเดียว (Single) - Logic เดิม
             if (cellText && cellText !== '') {
                 const notesInCell = cellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
                 const noteCount = notesInCell.length;

                 if (noteCount > 0) {
                     const timePerNote = timePerCell / noteCount;
                     const startTime = audioCtx.currentTime;

                     notesInCell.forEach((note, noteIndex) => {
                         if (note !== '-') {
                            playNote(note, (noteIndex * timePerNote)); 
                         }
                     });
                 }
             }
             currentNoteIndex += 1;
        }


        // 💡 กำหนดเวลาสำหรับ Loop ถัดไป (ใช้ setTimeout ในการหน่วงเวลา)
        // ต้องคูณ 1000 เพื่อแปลงวินาทีเป็นมิลลิวินาที
        currentTimeoutId = setTimeout(internalPlayLoop, timePerCell * 1000);
    };

    // เริ่ม Loop
    internalPlayLoop();
};

export const stopSong = () => {
    isPlaying = false;
    if (currentTimeoutId) clearTimeout(currentTimeoutId);
    currentTimeoutId = null;
    currentNoteIndex = 0; // รีเซ็ตตำแหน่งการเล่น
};

export const changeInstrument = async (instId) => {
    await loadInstrumentSounds(instId);
};