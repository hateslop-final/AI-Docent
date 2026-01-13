import { API_BASE } from "./api";

export const PhotoService = {
  async searchImage({
    tempUri,
    exhibitionId,
  }: {
    tempUri: string;
    exhibitionId: number;
  }) {
    const url = `${API_BASE}/image-search/`;
    
    try {
      const formData = new FormData();
      formData.append("exhibition_id", String(exhibitionId));
      formData.append("image", {
        uri: tempUri,
        name: "query.jpg",
        type: "image/jpeg",
      } as any);
      
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`서버 오류 (${res.status}): ${text}`);
      }

      const data = await res.json();
      return data;
    } catch (error: any) {
      if (error.message?.includes("Network request failed") || 
          error.message?.includes("fetch") ||
          error.message?.includes("Failed to connect")) {
        throw new Error(
          "네트워크 연결에 실패했습니다.\n\n" +
          "다음을 확인해주세요:\n" +
          `1. 백엔드 서버가 ${API_BASE}에서 실행 중인지 확인\n` +
          "2. 인터넷 연결 상태 확인\n" +
          "3. 방화벽 설정 확인\n" +
          "4. 실제 기기 사용 시 PC와 같은 Wi-Fi에 연결되어 있는지 확인"
        );
      }
      
      throw error;
    }
  },
};