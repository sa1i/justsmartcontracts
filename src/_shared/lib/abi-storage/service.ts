import { TAbiStorage, TSavedAbi } from "./types";

const STORAGE_KEY = "abi-storage";
const STORAGE_VERSION = 1;

class AbiStorageService {
  private getStorage(): TAbiStorage {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return { savedAbis: [], version: STORAGE_VERSION };
      }
      
      const parsed = JSON.parse(data) as TAbiStorage;
      return parsed.version === STORAGE_VERSION 
        ? parsed 
        : { savedAbis: [], version: STORAGE_VERSION };
    } catch {
      return { savedAbis: [], version: STORAGE_VERSION };
    }
  }

  private saveStorage(storage: TAbiStorage): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error("Failed to save ABI storage:", error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidAbi(abi: string): boolean {
    try {
      const parsed = JSON.parse(abi);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }

  saveAbi(name: string, abi: string, description?: string, tags?: string[]): TSavedAbi {
    if (!this.isValidAbi(abi)) {
      throw new Error("Invalid ABI format");
    }

    const storage = this.getStorage();
    const now = new Date().toISOString();
    
    const savedAbi: TSavedAbi = {
      id: this.generateId(),
      name: name.trim(),
      abi: abi.trim(),
      createdAt: now,
      lastUsedAt: now,
      description: description?.trim(),
      tags: tags?.map(tag => tag.trim()).filter(Boolean) || [],
    };

    storage.savedAbis.unshift(savedAbi);
    this.saveStorage(storage);
    
    return savedAbi;
  }

  getAllAbis(): TSavedAbi[] {
    const storage = this.getStorage();
    return storage.savedAbis.sort((a, b) => 
      new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );
  }

  getAbiById(id: string): TSavedAbi | null {
    const storage = this.getStorage();
    return storage.savedAbis.find(abi => abi.id === id) || null;
  }

  updateLastUsed(id: string): void {
    const storage = this.getStorage();
    const abiIndex = storage.savedAbis.findIndex(abi => abi.id === id);
    
    if (abiIndex !== -1) {
      storage.savedAbis[abiIndex].lastUsedAt = new Date().toISOString();
      this.saveStorage(storage);
    }
  }

  deleteAbi(id: string): void {
    const storage = this.getStorage();
    storage.savedAbis = storage.savedAbis.filter(abi => abi.id !== id);
    this.saveStorage(storage);
  }

  updateAbi(id: string, updates: Partial<Pick<TSavedAbi, 'name' | 'abi' | 'description' | 'tags'>>): void {
    const storage = this.getStorage();
    const abiIndex = storage.savedAbis.findIndex(abi => abi.id === id);
    
    if (abiIndex !== -1) {
      if (updates.abi && !this.isValidAbi(updates.abi)) {
        throw new Error("Invalid ABI format");
      }
      
      storage.savedAbis[abiIndex] = {
        ...storage.savedAbis[abiIndex],
        ...updates,
        lastUsedAt: new Date().toISOString(),
      };
      this.saveStorage(storage);
    }
  }

  searchAbis(query: string): TSavedAbi[] {
    const storage = this.getStorage();
    const lowerQuery = query.toLowerCase();
    
    return storage.savedAbis
      .filter(abi => 
        abi.name.toLowerCase().includes(lowerQuery) ||
        abi.description?.toLowerCase().includes(lowerQuery) ||
        abi.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => 
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      );
  }

  exportAbis(): string {
    const storage = this.getStorage();
    return JSON.stringify(storage.savedAbis, null, 2);
  }

  importAbis(data: string): number {
    try {
      const abis = JSON.parse(data) as TSavedAbi[];
      if (!Array.isArray(abis)) {
        throw new Error("Invalid import format");
      }

      const storage = this.getStorage();
      let importedCount = 0;

      abis.forEach(abi => {
        if (this.isValidAbi(abi.abi) && abi.name) {
          const existingIndex = storage.savedAbis.findIndex(existing => 
            existing.name === abi.name && existing.abi === abi.abi
          );

          if (existingIndex === -1) {
            storage.savedAbis.push({
              ...abi,
              id: this.generateId(),
              createdAt: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
            });
            importedCount++;
          }
        }
      });

      this.saveStorage(storage);
      return importedCount;
    } catch (error) {
      throw new Error("Failed to import ABIs: " + (error as Error).message);
    }
  }

  clearAll(): void {
    const storage = { savedAbis: [], version: STORAGE_VERSION };
    this.saveStorage(storage);
  }
}

export const abiStorageService = new AbiStorageService();