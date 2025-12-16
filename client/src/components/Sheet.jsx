// src/components/Sheet.jsx
import React from 'react';

const Sheet = ({ data, rowTypes, selectedCell, onCellClick, metaData, onMetaChange, currentFont }) => {
  
  const isFormal = currentFont.includes('Sarabun');
  const ROWS_FIRST_PAGE = 10;
  const ROWS_OTHER_PAGES = 13;

  // src/components/Sheet.jsx

// ... (ส่วน import และ const ROWS_... เหมือนเดิม) ...

  // --- ฟังก์ชันแบ่งข้อมูลเป็นหน้าๆ (Pagination Logic) ฉบับแก้ไข ---
  const getPages = () => {
    const pages = [];
    let currentRowIndex = 0;
    let pageCount = 1;

    // เราจะใช้ rowTypes ในการกำหนดว่าแถวถัดไปควรขยับไปกี่ขั้น
    while (currentRowIndex < data.length) {
      const capacity = pageCount === 1 ? ROWS_FIRST_PAGE : ROWS_OTHER_PAGES;
      
      let rowsOnPage = 0;
      let stopIndex = currentRowIndex;

      // วนลูปเพื่อหาว่าต้องรวมไปถึงแถวไหน ถึงจะเต็ม Capacity
      while (rowsOnPage < capacity && stopIndex < data.length) {
          const type = rowTypes[stopIndex];
          
          if (type === 'single') {
              rowsOnPage += 1;
              stopIndex += 1;
          } else if (type === 'pair_top') {
              // ถ้าเจอคู่ ต้องนับเป็น 1 ชุด แต่ขยับ index ไป 2 แถว
              rowsOnPage += 1; // นับเป็น 1 ชุด
              stopIndex += 2;  // ขยับข้าม 'pair_top' และ 'pair_bottom'
          } else {
              // ถ้าเป็น 'pair_bottom' หรือ type แปลกๆ ให้ข้ามไป
              stopIndex += 1;
          }
      }

      // ตรวจสอบว่ารวมเกิน Capacity ไหม ถ้าเกินต้องถอยหลังกลับ
      if (rowsOnPage > capacity) {
          // ถ้าเกินความจุ ให้ถอยหลังกลับไป 1 ชุดล่าสุด (1 หรือ 2 แถว)
          
          // ตรวจสอบแถวก่อนหน้า (stopIndex - 1) ว่าเป็น 'pair_bottom' ไหม?
          // ถ้าใช่ แสดงว่าต้องถอย 2 แถว (pair_top + pair_bottom)
          if (stopIndex >= 2 && rowTypes[stopIndex - 1] === 'pair_bottom') {
              stopIndex -= 2;
          } else {
              // ถ้าไม่ ก็ถอยแค่ 1 แถว (single)
              stopIndex -= 1;
          }
      }

      // ป้องกันการเกิด Infinite Loop ในกรณีที่ capacity น้อยเกินไป
      if (stopIndex <= currentRowIndex) {
          // ถ้าการคำนวณทำให้ index ไม่ขยับ ให้ขยับไป 1 ชุด (single) เป็นอย่างน้อย
          stopIndex = currentRowIndex + (rowTypes[currentRowIndex] === 'pair_top' ? 2 : 1);
          if (stopIndex > data.length) stopIndex = data.length; // ไม่ให้เกินจำนวนแถวทั้งหมด
      }
      

      // ตัดข้อมูลมาเฉพาะส่วนของหน้านี้
      const pageRows = data.slice(currentRowIndex, stopIndex);
      
      // เก็บข้อมูลหน้าลงใน Array
      pages.push({
        pageIndex: pageCount - 1,
        startIndex: currentRowIndex,
        rows: pageRows
      });

      // ขยับ index ไปหน้าถัดไป (สำคัญ: ต้องใช้ stopIndex ที่คำนวณมา)
      currentRowIndex = stopIndex;
      pageCount++;
    }
    return pages;
  };
  
// ... (โค้ดส่วนอื่นของ Sheet.jsx เหมือนเดิม) ...

  const pages = getPages();

  const renderRow = (localIndex, rowData, startIndex, isPair = false, pairPosition = null) => {
    const realIndex = startIndex + localIndex;
    
    // Grid: 9 คอลัมน์ (1 Label + 8 Notes) สำหรับบรรทัดคู่, 8 คอลัมน์สำหรับบรรทัดเดี่ยว
    const gridClass = isPair ? "grid grid-cols-9 border-t border-gray-300" : "grid grid-cols-8 border-l border-t border-gray-300";

    return (
      <div className={gridClass}>
        
        {/* --- ส่วน Label ด้านหน้า (เฉพาะบรรทัดคู่) --- */}
        {isPair && (
            <div className="border-l border-r border-b border-gray-300 bg-gray-50 flex items-center justify-center select-none h-10">
                {/* ✅ ใช้ currentFont สำหรับข้อความกำกับมือ */}
                <span className={`text-[10px] font-bold ${currentFont}`}> 
                    {pairPosition === 'top' && <span className="text-[#A67B5B]">มือขวา</span>}
                    {pairPosition === 'bottom' && <span className="text-gray-400">มือซ้าย</span>}
                </span>
            </div>
        )}

        {/* --- ส่วนตัวโน้ต (8 ห้อง) --- */}
        {rowData.map((cellData, colIndex) => {
          const isActive = selectedCell.row === realIndex && selectedCell.col === colIndex;
          
          return (
            <div 
              key={colIndex}
              onClick={() => onCellClick(realIndex, colIndex)}
              className={`
                relative border-r border-b border-gray-300 flex items-center justify-center cursor-text transition-all select-none
                ${isActive ? 'bg-[#A67B5B]/10 ring-2 ring-[#A67B5B] z-10' : 'hover:bg-gray-50'}
                h-10 /* ความสูงคงที่ */
              `}
            >
              <span className={`
                ${currentFont} 
                font-normal      /* ไม่หนา (Normal Weight) ทั้งคู่ */
                text-base        /* ขนาด 16px (Base) ทั้งคู่ */
                text-gray-800 
                leading-[2.5] pt-1 pb-1 block w-full text-center
              `}>
                {cellData}
              </span>

              {/* เลขบอกบรรทัด (เฉพาะโหมดเดี่ยว และไม่ใช่ทางการ) */}
              {!isPair && colIndex === 0 && !isFormal && (
                <div className="absolute -left-8 text-xs text-gray-300 font-sans select-none flex items-center h-full">
                   {(realIndex + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full gap-8 py-8">
      
      {pages.map((page) => (
        <div 
            key={page.pageIndex}
            className={`sheet-page bg-white shadow-xl relative flex flex-col justify-between ${currentFont}`}
            style={{ 
                width: '210mm', 
                height: '297mm',
                minWidth: '210mm',
                minHeight: '297mm',
                padding: '40px 50px',
                margin: '0 auto',
                boxSizing: 'border-box' 
            }}
        >
          
          <div>
              {/* Header */}
              {page.pageIndex === 0 ? (
                <div className="flex flex-col items-center gap-2 mb-6 text-center">
                    <input 
                        type="text" 
                        value={metaData.title}
                        onChange={(e) => onMetaChange('title', e.target.value)}
                        placeholder="ชื่อเพลง (Untitled)"
                        className={`text-2xl font-bold text-center w-full text-[#4A3B32] outline-none border-b-2 border-transparent hover:border-gray-200 focus:border-[#A67B5B] bg-transparent ${currentFont} py-2 leading-relaxed`}
                    />

                    <div className="flex gap-4 w-full justify-center mt-2">
                        <input type="text" value={metaData.tempo} onChange={(e) => onMetaChange('tempo', e.target.value)} placeholder="อัตราจังหวะ" className={`text-center text-gray-600 outline-none bg-transparent text-sm ${currentFont}`}/>
                        <span className="text-gray-300">|</span>
                        <input type="text" value={metaData.composer} onChange={(e) => onMetaChange('composer', e.target.value)} placeholder="ผู้ประพันธ์" className={`text-center text-gray-600 outline-none bg-transparent text-sm ${currentFont}`}/>
                    </div>
                </div>
              ) : (
                <div className="h-8 mb-4 border-b border-dashed border-gray-100 flex items-end justify-center pb-2">
                    <span className="text-gray-300 text-xs">{metaData.title} (ต่อ)</span>
                </div>
              )}

              {/* Rows */}
              <div className="flex flex-col gap-0 w-full">
                {page.rows.map((row, index) => {
                    const realIndex = page.startIndex + index;
                    const type = rowTypes[realIndex];

                    if (type === 'single') return <div key={realIndex} className="mb-3">{renderRow(index, row, page.startIndex)}</div>;
                    
                    if (type === 'pair_top') {
                        const nextRow = data[realIndex + 1];
                        if (!nextRow) return null;
                        return (
                        <div key={realIndex} className="mb-3 border border-gray-300 rounded overflow-hidden">
                            <div className="bg-white">{renderRow(index, row, page.startIndex, true, 'top')}</div>
                            <div className="bg-white">{renderRow(index + 1, nextRow, page.startIndex, true, 'bottom')}</div>
                        </div>
                        );
                    }
                    return null;
                })}
              </div>
          </div>

          {/* Footer */}
          <div className="w-full text-center flex justify-between items-end text-[10px] text-gray-400 font-sans border-t border-gray-100 pt-2">
             <span>Thai Music Editor Platform</span>
             <span>หน้า {page.pageIndex + 1} / {pages.length}</span>
          </div>

        </div>
      ))}
      
      <div className="h-32 w-full"></div> 
    </div>
  );
};

export default Sheet;