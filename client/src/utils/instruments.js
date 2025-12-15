// src/utils/instruments.js

export const INSTRUMENTS = {
  kongwong: {
    id: 'kongwong',
    name: 'ฆ้องวงใหญ่ (Gong Wong Yai)',
    folder: '/sounds/kongwong', // โฟลเดอร์ที่เก็บเสียง
    // Mapping เฉพาะของเครื่องนี้ (ถ้าชื่อไฟล์เหมือนกันทุกเครื่อง ส่วนนี้อาจจะไม่ต้องมีก็ได้)
    mapping: {
      default: 'mid', // เสียงเริ่มต้น
    }
  },
  ranatek: {
    id: 'ranatek',
    name: 'ระนาดเอก (Ranat Ek)',
    folder: '/sounds/ranatek',
    mapping: {
      default: 'high', // ระนาดเอกเสียงธรรมชาติจะสูงกว่า
    }
  },
  ranatthum: {
    id: 'ranatthum',
    name: 'ระนาดทุ้ม (Ranat Thum)',
    folder: '/sounds/ranatthum',
  }
  // เพิ่มเครื่องอื่นได้ง่ายๆ แค่เพิ่ม object ในนี้
};