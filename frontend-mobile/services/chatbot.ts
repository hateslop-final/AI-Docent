import { API_BASE } from "./api";

export type ChatbotRequest = {
  artwork_id?: string;
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

    const url = `${API_BASE}/chatbot/`;
    const requestBody = JSON.stringify(request);
    
    console.log("[ChatbotService] 요청 시작:", {
      url,
      API_BASE,
      method: "POST",
      body: request,
    });
    
    // URL 유효성 검사
    if (!url || url.includes("undefined") || url.includes("null")) {
      const error = new Error(`잘못된 API URL: ${url}. API_BASE를 확인해주세요.`);
      console.error("[ChatbotService] URL 오류:", error);
      throw error;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: options?.signal ?? controller.signal,
      });
      
      console.log("[ChatbotService] 응답 수신:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (!res.ok) {
        let errorText = `HTTP ${res.status}`;

        try {
          const text = await res.text();
          console.error("[ChatbotService] 에러 응답:", {
            status: res.status,
            statusText: res.statusText,
            body: text,
          });
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

      const responseData = await res.json();
      console.log("[ChatbotService] 응답 성공:", {
        answerLength: responseData.answer?.length || 0,
      });
      return responseData;
    } catch (err: any) {
      console.error("[ChatbotService] 요청 실패:", {
        error: err.message,
        name: err.name,
        type: err.constructor?.name,
        url,
        API_BASE,
        stack: err.stack,
      });
      
      /** Abort (타임아웃/취소) */
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        throw new Error("요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.");
      }

      /** fetch 자체 실패 (네트워크 에러) */
      if (err instanceof TypeError || err.name === "TypeError" || err.message?.includes("fetch")) {
        throw new Error(`네트워크 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요. (URL: ${url})`);
      }
      
      /** DOMException (CORS 또는 네트워크 문제) */
      if (err.name === "DOMException" || err.constructor?.name === "DOMException") {
        throw new Error(`네트워크 요청이 실패했습니다. 백엔드 서버(${url})가 실행 중인지 확인해주세요.`);
      }

      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};