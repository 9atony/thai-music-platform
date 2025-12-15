// src/utils/audioEngine.js
import { INSTRUMENTS } from './instruments';

let audioCtx = null;
let currentInstrumentId = 'kongwong'; 
let soundBuffers = {}; 
let isPlaying = false;
let timeoutIds = [];

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

const playBuffer = (fileName) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const buffers = soundBuffers[currentInstrumentId];
    if (buffers && buffers[fileName]) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[fileName];
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.0;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
    }
};

export const playNote = (noteChar) => {
    const fileName = getFileName(noteChar);
    if (fileName) {
        playBuffer(fileName);
    }
};

// ✅ ฟังก์ชันเล่นเพลง (ปรับปรุง Logic การจบเพลง)
export const playSong = async (songData, bpm = 120, onComplete, startIndex = 0) => {
    if (isPlaying) stopSong();
    
    if (!soundBuffers[currentInstrumentId]) {
        await loadInstrumentSounds(currentInstrumentId);
    }

    isPlaying = true;
    const delayPerCell = (60 / bpm) * 1000; 

    // 1. แปลงข้อมูลทั้งหมดเป็นเส้นตรง (1D Array)
    let allCells = [];
    songData.forEach(row => row.forEach(cell => allCells.push(cell)));

    // 2. หา "โน้ตตัวสุดท้ายจริงๆ" ของทั้งเพลงอยู่ตรงไหน?
    let absoluteLastNoteIndex = -1;
    for (let i = allCells.length - 1; i >= 0; i--) {
        // เช็คว่ามีตัวอักษรและไม่ใช่ช่องว่าง
        if (allCells[i] && allCells[i].trim() !== '') {
            absoluteLastNoteIndex = i;
            break;
        }
    }

    // 3. คำนวณ "จุดจบของบรรทัดนั้น" (End of Row)
    // 1 บรรทัดมี 8 ห้อง
    let stopIndex = allCells.length - 1; // ค่าเริ่มต้นคือจบเพลง

    if (absoluteLastNoteIndex !== -1) {
        // หาว่าโน้ตตัวสุดท้ายอยู่บรรทัดที่เท่าไหร่ (0-7, 8-15, ...)
        const rowOfLastNote = Math.floor(absoluteLastNoteIndex / 8);
        
        // จุดจบของบรรทัดนั้น คือ (เลขบรรทัด * 8) + 7
        const endOfRowIndex = (rowOfLastNote * 8) + 7;
        
        stopIndex = endOfRowIndex;
    } else {
        // เพลงว่างเปล่า
        if (onComplete) onComplete();
        isPlaying = false;
        return;
    }

    // 4. ตัดเอาเฉพาะช่วงที่ต้องเล่น (จาก Start -> จบบรรทัดสุดท้ายที่มีโน้ต)
    // ตรวจสอบว่า startIndex เกินจุดจบหรือยัง
    if (startIndex > stopIndex) {
        if (onComplete) onComplete();
        isPlaying = false;
        return;
    }

    const cellsToPlay = allCells.slice(startIndex, stopIndex + 1);

    let currentTime = 0;
    
    // วนลูปเล่น
    cellsToPlay.forEach((cellText, cellIndex) => {
        if (cellText && cellText !== '') {
             // Logic แยกโน้ตและขีด (-)
             const notesInCell = cellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
             const noteCount = notesInCell.length;

             if (noteCount > 0) {
                 const timePerNote = delayPerCell / noteCount;
                 notesInCell.forEach((note, noteIndex) => {
                     if (note !== '-') {
                        timeoutIds.push(setTimeout(() => { 
                            if(isPlaying) playNote(note); 
                        }, currentTime + (noteIndex * timePerNote)));
                     }
                 });
             }
        }
        
        // เช็คจบการทำงาน
        if (cellIndex === cellsToPlay.length - 1) {
           timeoutIds.push(setTimeout(() => { 
               if (onComplete) onComplete(); 
               isPlaying = false; 
           }, currentTime + delayPerCell)); // รอจนจบห้องสุดท้ายแล้วค่อยหยุด
        }
        
        currentTime += delayPerCell;
    });
};

export const stopSong = () => {
    isPlaying = false;
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
};

export const changeInstrument = async (instId) => {
    await loadInstrumentSounds(instId);
};