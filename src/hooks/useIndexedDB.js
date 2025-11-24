
import { useState, useEffect, useCallback } from 'react';
import { addData, getAllData, updateData, deleteData } from '../lib/indexedDB';

export const useIndexedDBStore = (storeName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    const result = await getAllData(storeName);
    setData(result);
    setLoading(false);
  }, [storeName]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addItem = async (item) => {
    await addData(storeName, item);
    await refreshData();
  };

  const updateItem = async (item) => {
    await updateData(storeName, item);
    await refreshData();
  };

  const deleteItem = async (id) => {
    await deleteData(storeName, id);
    await refreshData();
  };

  return { data, loading, addItem, updateItem, deleteItem, refreshData };
};
