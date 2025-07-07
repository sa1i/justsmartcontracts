export type TSavedAbi = {
  id: string;
  name: string;
  abi: string;
  createdAt: string;
  lastUsedAt: string;
  description?: string;
  tags?: string[];
};

export type TAbiStorage = {
  savedAbis: TSavedAbi[];
  version: number;
};