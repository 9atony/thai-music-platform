import React from 'react';
import NoteCell from './NoteCell';

const MusicRow = ({ rowIndex, rowData, selectedCell, onCellClick }) => {
  return (
    <div className="music-row">
      {rowData.map((note, colIndex) => {
        const isActive = (selectedCell.row === rowIndex && selectedCell.col === colIndex);
        const isFirstCell = (colIndex === 0);
        const isMeasureEnd = (colIndex + 1) % 4 === 0; // กั้นทุก 4 ตัว

        return (
          <NoteCell 
            key={colIndex}
            note={note}
            isActive={isActive}
            isFirstCell={isFirstCell}
            isMeasureEnd={isMeasureEnd}
            onClick={() => onCellClick(rowIndex, colIndex)}
          />
        );
      })}
    </div>
  );
};

export default MusicRow;