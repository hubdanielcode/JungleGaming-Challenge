import { apiClient } from "@/lib/axios";
import type { AvatarUpdateInput, PasswordChangeInput, ProfileUpdateInput, User } from "@/types";

const fetchProfile = async (): Promise<User> => {
  const profileResponse = await apiClient.get<User>("/profile");

  return profileResponse.data;
};

const updateProfile = async (profileUpdateInput: ProfileUpdateInput): Promise<User> => {
  const profileResponse = await apiClient.patch<User>("/profile", profileUpdateInput);

  return profileResponse.data;
};

const updateAvatar = async (avatarUpdateInput: AvatarUpdateInput): Promise<User> => {
  const profileResponse = await apiClient.put<User>("/profile/avatar", avatarUpdateInput);

  return profileResponse.data;
};

const updatePassword = async (passwordChangeInput: PasswordChangeInput): Promise<void> => {
  await apiClient.post("/profile/password", passwordChangeInput);
};

export { fetchProfile, updateProfile, updateAvatar, updatePassword };
