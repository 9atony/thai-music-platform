// src/utils/audioEngine.js (ฉบับแก้ไข: ใช้ AudioContext Timing สำหรับ BPM ที่แม่นยำ)
import { INSTRUMENTS } from './instruments';

let audioCtx = null;
let currentInstrumentId = 'kongwong'; 
let soundBuffers = {}; 
let isPlaying = false;
let timeoutIds = []; // ยังเก็บ setTimeout สำหรับ Logic การจบเพลง

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

// 💡 NEW: ฟังก์ชันเล่นเสียงที่แม่นยำด้วย Web Audio API
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
        // ใช้ฟังก์ชันใหม่ในการเล่นเสียง
        playBufferAtTime(fileName, time);
    }
};

// ✅ ฟังก์ชันเล่นเพลง (ใช้ AudioContext Time)
export const playSong = async (songData, bpm = 120, onComplete, startIndex = 0) => {
    if (isPlaying) stopSong();
    
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!soundBuffers[currentInstrumentId]) {
        await loadInstrumentSounds(currentInstrumentId);
    }

    isPlaying = true;
    
    // ✅ เวลาต่อ 1 ช่อง (1 จังหวะ) หน่วยเป็นวินาที (สำหรับ AudioContext Time)
    const timePerCell = 60 / bpm; 

    // 1. แปลงข้อมูลทั้งหมดเป็นเส้นตรง (1D Array)
    let allCells = [];
    songData.forEach(row => row.forEach(cell => allCells.push(cell)));

    // 2. หา "โน้ตตัวสุดท้ายจริงๆ" (Logic เดิมยังคงใช้งานได้)
    let absoluteLastNoteIndex = -1;
    for (let i = allCells.length - 1; i >= 0; i--) {
        if (allCells[i] && allCells[i].trim() !== '') {
            absoluteLastNoteIndex = i;
            break;
        }
    }

    let stopIndex = allCells.length - 1; 
    if (absoluteLastNoteIndex !== -1) {
        const rowOfLastNote = Math.floor(absoluteLastNoteIndex / 8);
        const endOfRowIndex = (rowOfLastNote * 8) + 7;
        stopIndex = endOfRowIndex;
    } else {
        if (onComplete) onComplete();
        isPlaying = false;
        return;
    }

    if (startIndex > stopIndex) {
        if (onComplete) onComplete();
        isPlaying = false;
        return;
    }

    const cellsToPlay = allCells.slice(startIndex, stopIndex + 1);

    // 💡 currentTime คือตำแหน่งเวลาในการเล่นเพลง หน่วยเป็นวินาที
    let currentTime = 0;
    const startTime = audioCtx.currentTime; // เวลาเริ่มต้นจริง ๆ ใน Web Audio API

    cellsToPlay.forEach((cellText, cellIndex) => {
        if (cellText && cellText !== '') {
             // Logic แยกโน้ตและขีด (-)
             const notesInCell = cellText.match(/([ก-ฮ][\u0E3A\u0E4D]?)|-/g) || [];
             const noteCount = notesInCell.length;

             if (noteCount > 0) {
                 // เวลาต่อโน้ตย่อยใน 1 ช่อง (หน่วยเป็นวินาที)
                 const timePerNote = timePerCell / noteCount; 
                 
                 notesInCell.forEach((note, noteIndex) => {
                     if (note !== '-') {
                        // 🎯 กำหนดเวลาเล่น: เวลาเริ่มต้น + เวลา ณ ช่องปัจจุบัน + (เวลาโน้ตย่อย * ลำดับโน้ตย่อย)
                        const playTime = startTime + currentTime + (noteIndex * timePerNote);
                        playNote(note, playTime); 
                     }
                 });
             }
        }
        
        // เลื่อนเวลาไปที่ช่องถัดไป
        currentTime += timePerCell;
    });
    
    // 5. Logic จบเพลง: ใช้ setTimeout ในการเรียก onComplete
    // ต้องรอจนจบช่องสุดท้าย (currentTime คือระยะเวลาทั้งหมดของการเล่น)
    timeoutIds.push(setTimeout(() => { 
        if (onComplete) onComplete(); 
        isPlaying = false; 
    }, currentTime * 1000)); // แปลงวินาทีเป็นมิลลิวินาที
};

export const stopSong = () => {
    isPlaying = false;
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds = [];
    // อาจจะต้องมี logic หยุด Web Audio API sources ด้วยถ้าจำเป็น
};

export const changeInstrument = async (instId) => {
    await loadInstrumentSounds(instId);
};