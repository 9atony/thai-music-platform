import React from 'react';

const Sidebar = ({ 
  autoAdvance, setAutoAdvance, 
  bpm, setBpm, 
  onNew, onSave, onOpen, onPDF, 
  onClearAll,
  instruments, currentInst, onInstrumentChange, isLoading,
  // รับ props เป็นโหมดเพิ่มบรรทัดคู่
  isAddPairMode, setIsAddPairMode
}) => {
  return (
    <div className="sidebar" style={{ width: '250px', background: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid #ddd', height: '100%', overflowY: 'auto' }}>
      
      {/* ... ส่วนเลือกเครื่องดนตรี ... */}
      <div className="control-group">
        <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9em', textTransform: 'uppercase' }}>เครื่องดนตรี</h4>
        <div style={{ position: 'relative' }}>
          <select 
            value={currentInst}
            onChange={onInstrumentChange}
            disabled={isLoading}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              background: isLoading ? '#f0f0f0' : '#fff',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {instruments && Object.values(instruments).map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
          {isLoading && (
            <div style={{ fontSize: '0.7em', color: '#e67e22', marginTop: '5px', textAlign: 'right' }}>
              กำลังโหลดเสียง...
            </div>
          )}
        </div>
      </div>

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0' }} />

      {/* ... ส่วนควบคุมจังหวะ ... */}
      <div className="control-group">
        <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9em' }}>ควบคุม</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span style={{ fontSize: '1.2em' }}>⏱</span>
          <span style={{ fontWeight: 'bold' }}>{bpm}</span>
          <span style={{ fontSize: '0.8em', color: '#777' }}>BPM</span>
        </div>
        <input 
          type="range" 
          min="60" max="200" 
          value={bpm} 
          onChange={(e) => setBpm(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* ... ส่วนจัดการไฟล์ ... */}
      <div className="control-group">
        <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9em' }}>ไฟล์</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={onNew} className="btn-secondary" style={{ padding:'8px', background:'#3498db', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>📄 ใหม่</button>
          <button onClick={onSave} className="btn-secondary" style={{ padding:'8px', background:'#f1c40f', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>💾 บันทึก</button>
          <button onClick={onOpen} className="btn-secondary" style={{ padding:'8px', background:'#95a5a6', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>📂 เปิด</button>
          <button onClick={onPDF} className="btn-secondary" style={{ padding:'8px', background:'#e74c3c', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>📄 PDF</button>
        </div>
      </div>

      {/* === ส่วนตั้งค่าการพิมพ์ === */}
      <div className="control-group">
        <h4 style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9em' }}>ตั้งค่าการพิมพ์/เพิ่ม</h4>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9em', cursor:'pointer' }} htmlFor="auto-adv">เลื่อนอัตโนมัติ (ครบ 4)</label>
            <input 
                id="auto-adv"
                type="checkbox" 
                checked={autoAdvance} 
                onChange={(e) => setAutoAdvance(e.target.checked)}
                style={{ cursor:'pointer' }}
            />
        </div>
        
         {/* สวิตช์เลือกโหมดการเพิ่มบรรทัด */}
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background:'#f9f9f9', padding:'5px', borderRadius:'4px' }}>
            <label style={{ fontSize: '0.9em', cursor: 'pointer', fontWeight: isAddPairMode ? 'bold' : 'normal' }} htmlFor="add-pair">
                เพิ่มทีละ 2 (คู่)
            </label>
            <input 
                id="add-pair" 
                type="checkbox" 
                checked={isAddPairMode} 
                onChange={(e) => setIsAddPairMode(e.target.checked)}
                style={{ cursor: 'pointer' }}
            />
        </div>
        <div style={{ fontSize:'0.7em', color:'#888', marginTop:'2px' }}>
            *กดสวิตช์นี้แล้วกดปุ่ม + สีเขียว เพื่อเพิ่มบรรทัดคู่
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <button 
            onClick={onClearAll} 
            style={{ width: '100%', padding: '10px', background: '#ecf0f1', color: '#7f8c8d', border: '1px dashed #bdc3c7', borderRadius: '4px', cursor: 'pointer' }}
        >
            🗑 ล้างทั้งหมด
        </button>
      </div>

    </div>
  );
};

export default Sidebar;