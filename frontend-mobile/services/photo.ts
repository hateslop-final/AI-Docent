import { API_BASE } from "./api";

export const PhotoService = {
  async searchImage({
    tempUri,
    exhibitionId,
  }: {
    tempUri: string;
    exhibitionId: number;
  }) {
    const formData = new FormData();

    formData.append("exhibition_id", String(exhibitionId));

    formData.append("image", {
      uri: tempUri,
      name: "query.jpg",
      type: "image/jpeg",
    } as any);
    
    const res = await fetch(`${API_BASE}/image-search/`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Image search failed: ${text}`);
    }

    return res.json();
  },
};