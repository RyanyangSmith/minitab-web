import { useCallback } from 'react';
import { useTableStore } from '../store/tableStore';

export function useSpreadsheet(tableId: string) {
  const table = useTableStore((s) => s.tables[tableId]);
  const setCellValue = useTableStore((s) => s.setCellValue);
  const setSubHeader = useTableStore((s) => s.setSubHeader);
  const getCellValue = useTableStore((s) => s.getCellValue);
  const getSubHeader = useTableStore((s) => s.getSubHeader);
  const getColumnData = useTableStore((s) => s.getColumnData);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (row === 1) {
        // Sub-header row
        setSubHeader(tableId, col, value);
      } else {
        const numVal = value === '' ? null : isNaN(Number(value)) ? value : Number(value);
        setCellValue(tableId, row, col, numVal);
      }
    },
    [tableId, setCellValue, setSubHeader]
  );

  return {
    table,
    getCellValue: (row: number, col: number) => getCellValue(tableId, row, col),
    setCellValue: (row: number, col: number, value: string) => handleCellChange(row, col, value),
    getSubHeader: (col: number) => getSubHeader(tableId, col),
    getColumnData: (col: number) => getColumnData(tableId, col),
  };
}
