export type WalletKind = "primary" | "secondary";
export type WalletNetwork = "ethereum" | "polygon";
export type WalletProvider = "walletconnect" | "metamask" | "coinbase";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
}

export interface Session {
  user: User;
  expiresAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileUpdateInput {
  username?: string;
  email?: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export interface AvatarUpdateInput {
  avatarDataUrl: string | null;
}

export interface Wallet {
  id: string;
  kind: WalletKind;
  address: string;
  network: WalletNetwork;
  provider: WalletProvider;
  label: string;
  connectionStatus?: "connected" | "disconnected";
}

export interface WalletInput {
  kind: WalletKind;
  address: string;
  network: WalletNetwork;
  provider: WalletProvider;
  label?: string;
}
