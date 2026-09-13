import { apiClient } from "@/lib/axios";
import type { Wallet, WalletInput } from "@/types";

const fetchUserWallets = async (): Promise<Wallet[]> => {
  const walletsResponse = await apiClient.get<{ items: Wallet[] }>("/wallets");

  return walletsResponse.data.items;
};

const createWallet = async (walletInput: WalletInput): Promise<Wallet> => {
  const walletResponse = await apiClient.post<Wallet>("/wallets", walletInput);

  return walletResponse.data;
};

const updateWallet = async (walletId: string, walletInput: Partial<WalletInput>): Promise<Wallet> => {
  const walletResponse = await apiClient.patch<Wallet>(`/wallets/${walletId}`, walletInput);

  return walletResponse.data;
};

const connectWallet = async (walletId: string): Promise<Wallet> => {
  const walletResponse = await apiClient.post<Wallet>(`/wallets/${walletId}/connect`);
  return walletResponse.data;
};

const disconnectWallet = async (walletId: string): Promise<Wallet> => {
  const walletResponse = await apiClient.post<Wallet>(`/wallets/${walletId}/disconnect`);
  return walletResponse.data;
};

export { connectWallet, createWallet, disconnectWallet, fetchUserWallets, updateWallet };
