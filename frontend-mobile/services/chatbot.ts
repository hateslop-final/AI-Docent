import { API_BASE } from "./api";

export type ChatbotRequest = {
  artwork_id: string;
  question: string;
  age_group: "teen" | "adult";
  expertise_level: "light" | "medium" | "deep";
};

export type ChatbotResponse = {
  answer: string;
};

/** 네트워크 타임아웃(ms) */
const TIMEOUT = 20_000;

export const ChatbotService = {
  async askQuestion(
    request: ChatbotRequest,
    options?: { signal?: AbortSignal }
  ): Promise<ChatbotResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(`${API_BASE}/chatbot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: options?.signal ?? controller.signal,
      });

      if (!res.ok) {
        let errorText = `HTTP ${res.status}`;

        try {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            errorText = json.detail || json.error?.message || text;
          } catch {
            errorText = text || errorText;
          }
        } catch {
          /* ignore */
        }

        const error = new Error(errorText);
        (error as any).status = res.status;
        throw error;
      }

      return await res.json();
    } catch (err: any) {
      /** Abort (타임아웃/취소) */
      if (err.name === "AbortError") {
        throw new Error("요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.");
      }

      /** fetch 자체 실패 */
      if (err instanceof TypeError) {
        throw new Error("네트워크 연결에 실패했습니다.");
      }

      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};