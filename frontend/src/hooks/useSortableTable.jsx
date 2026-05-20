import { useState, useMemo } from 'react';

export default function useSortableTable(items) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nulls safely
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Case-insensitive string comparison
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Third click resets the sort back to default
      direction = null;
      key = null;
    }
    setSortConfig({ key, direction });
  };

  const resetSort = () => setSortConfig({ key: null, direction: null });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return sortConfig.direction === 'asc' ? 
      <span style={{ color: 'var(--lto-yellow)', marginLeft: 4 }}>▲</span> : 
      <span style={{ color: 'var(--lto-yellow)', marginLeft: 4 }}>▼</span>;
  };

  return { sortedItems, requestSort, resetSort, sortConfig, getSortIcon };
}