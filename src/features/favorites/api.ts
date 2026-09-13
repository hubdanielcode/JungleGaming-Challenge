import { apiClient } from "@/lib/axios";

const fetchFavoriteNftIds = async (): Promise<string[]> => {
  const favoritesResponse = await apiClient.get<{ items: Array<{ id: string }> }>("/favorites");

  return favoritesResponse.data.items.map((favoriteNft) => favoriteNft.id);
};

const addFavoriteNft = async (nftId: string): Promise<void> => {
  await apiClient.post(`/favorites/${nftId}`);
};

const removeFavoriteNft = async (nftId: string): Promise<void> => {
  await apiClient.delete(`/favorites/${nftId}`);
};

export { fetchFavoriteNftIds, addFavoriteNft, removeFavoriteNft };
