import { useCallback, useEffect, useState } from "react";
import { abiStorageService } from "./service";
import { TSavedAbi } from "./types";

export const useAbiStorage = () => {
  const [savedAbis, setSavedAbis] = useState<TSavedAbi[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAbis = useCallback(() => {
    setLoading(true);
    try {
      const abis = abiStorageService.getAllAbis();
      setSavedAbis(abis);
    } catch (error) {
      console.error("Failed to load ABIs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAbi = useCallback((name: string, abi: string, description?: string, tags?: string[]) => {
    try {
      const savedAbi = abiStorageService.saveAbi(name, abi, description, tags);
      loadAbis();
      return savedAbi;
    } catch (error) {
      console.error("Failed to save ABI:", error);
      throw error;
    }
  }, [loadAbis]);

  const deleteAbi = useCallback((id: string) => {
    try {
      abiStorageService.deleteAbi(id);
      loadAbis();
    } catch (error) {
      console.error("Failed to delete ABI:", error);
      throw error;
    }
  }, [loadAbis]);

  const updateAbi = useCallback((id: string, updates: Partial<Pick<TSavedAbi, 'name' | 'abi' | 'description' | 'tags'>>) => {
    try {
      abiStorageService.updateAbi(id, updates);
      loadAbis();
    } catch (error) {
      console.error("Failed to update ABI:", error);
      throw error;
    }
  }, [loadAbis]);

  const searchAbis = useCallback((query: string) => {
    try {
      return abiStorageService.searchAbis(query);
    } catch (error) {
      console.error("Failed to search ABIs:", error);
      return [];
    }
  }, []);

  const markAsUsed = useCallback((id: string) => {
    try {
      abiStorageService.updateLastUsed(id);
      loadAbis();
    } catch (error) {
      console.error("Failed to mark ABI as used:", error);
    }
  }, [loadAbis]);

  useEffect(() => {
    loadAbis();
  }, [loadAbis]);

  return {
    savedAbis,
    loading,
    saveAbi,
    deleteAbi,
    updateAbi,
    searchAbis,
    markAsUsed,
    loadAbis,
  };
};