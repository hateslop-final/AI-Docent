import { supabase } from "./supabase";

export type Exhibition = {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  gallery_id?: number;
  is_now?: boolean;
  show?: boolean;
  poster_url?: string;
  brochure?: string;
  location?: string;
  admission_fee?: string;
  info?: string;
  created_at?: string;
};

export async function fetchExhibitionById(id: number): Promise<Exhibition | null> {
  const { data, error } = await supabase
    .from("Exhibition")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("전시 단건 조회 실패:", error);
    return null;
  }
  return data;
}

export async function fetchExhibitions(galleryId: number): Promise<Exhibition[]> {
  try {
    const { data, error } = await supabase
      .from("Exhibition")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("start_date", { ascending: false });
    
    if (error) {
      console.error("전시 조회 실패:", error);
      
      // 환경 변수 미설정 시 더 명확한 에러 메시지
      if (error.message.includes('placeholder') || error.message.includes('Network request failed')) {
        throw new Error(
          'Supabase 환경 변수가 설정되지 않았습니다.\n' +
          'frontend-mobile/.env 파일에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.'
        );
      }
      
      throw new Error(`전시 조회 실패: ${error.message}`);
    }
    
    return data || [];
  } catch (err: any) {
    // 네트워크 에러 등 기타 에러 처리
    if (err.message?.includes('Network request failed') || err.message?.includes('fetch')) {
      throw new Error(
        '네트워크 연결에 실패했습니다.\n' +
        'Supabase 환경 변수를 확인하거나 인터넷 연결을 확인해주세요.'
      );
    }
    throw err;
  }
}
