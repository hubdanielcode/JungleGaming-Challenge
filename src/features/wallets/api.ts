import { apiClient } from "@/lib/axios";
import type { Wallet, WalletInput, WalletNetwork, WalletProvider } from "@/types";

const fetchUserWallets = async (): Promise<Wallet[]> => {
  const walletsResponse = await apiClient.get<{ items: Wallet[] }>("/wallets");

  return walletsResponse.data.items;
};

const createWallet = async (walletInput: WalletInput): Promise<Wallet> => {
  const walletResponse = await apiClient.post<Wallet>("/wallets", walletInput);

  return walletResponse.data;
};

const connectWallet = async (provider: WalletProvider, network: WalletNetwork): Promise<Wallet> => {
  const walletResponse = await apiClient.post<Wallet>("/wallets/connect", { provider, network });

  return walletResponse.data;
};

const updateWallet = async (walletId: string, walletInput: Partial<WalletInput>): Promise<Wallet> => {
  const walletResponse = await apiClient.patch<Wallet>(`/wallets/${walletId}`, walletInput);

  return walletResponse.data;
};

export { fetchUserWallets, createWallet, connectWallet, updateWallet };
