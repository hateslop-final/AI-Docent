import { supabase } from "./supabase";

export type Gallery = {
  id: number;
  name: string;
  location?: string;
  description?: string;
};

export async function fetchGalleries(): Promise<Gallery[]> {
  try {
    const { data, error } = await supabase.from("Gallery").select("*").order("name");
    
    if (error) {
      // 환경 변수 미설정 또는 네트워크 에러 체크
      const isEnvError = 
        error.message?.includes('placeholder') || 
        error.message?.includes('Network request failed') ||
        error.message?.includes('fetch') ||
        error.code === 'PGRST116'; // Supabase 연결 실패 코드
      
      if (isEnvError) {
        const envError = new Error(
          'Supabase 환경 변수가 설정되지 않았습니다.\n\n' +
          'frontend-mobile/.env 파일을 생성하고 다음을 추가하세요:\n\n' +
          'EXPO_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
          'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'
        );
        console.error('갤러리 조회 실패:', envError.message);
        throw envError;
      }
      
      console.error("갤러리 조회 실패:", error);
      throw new Error(`갤러리 조회 실패: ${error.message}`);
    }
    
    return data || [];
  } catch (err: any) {
    // 이미 처리된 에러는 그대로 throw
    if (err.message?.includes('Supabase 환경 변수')) {
      throw err;
    }
    
    // 기타 네트워크 에러
    if (err.message?.includes('Network request failed') || err.message?.includes('fetch')) {
      throw new Error(
        '네트워크 연결에 실패했습니다.\n' +
        '인터넷 연결을 확인하거나 Supabase 환경 변수를 확인해주세요.'
      );
    }
    
    throw err;
  }
}