import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// ==================== Gallery API (Supabase 직접 호출) ====================
export async function fetchGalleries() {
  const { data, error } = await supabase.from("Gallery").select("*");
  if (error) throw new Error(`갤러리 조회 실패: ${error.message}`);
  return data || [];
}

export async function createGallery(data: {
  name: string;
  location: string;
  description: string;
}) {
  const { data: result, error } = await supabase
    .from("Gallery")
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(`갤러리 생성 실패: ${error.message}`);
  return result;
}

export async function updateGallery(
  id: number,
  data: { name: string; location: string; description: string }
) {
  const { data: result, error } = await supabase
    .from("Gallery")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`갤러리 수정 실패: ${error.message}`);
  return result;
}

export async function deleteGallery(id: number) {
  const { error } = await supabase.from("Gallery").delete().eq("id", id);
  if (error) throw new Error(`갤러리 삭제 실패: ${error.message}`);
  return { success: true };
}

// ==================== Exhibition API (Supabase 직접 호출) ====================
export async function fetchExhibitions(galleryId: number) {
  const { data, error } = await supabase
    .from("Exhibition")
    .select("*")
    .eq("gallery_id", galleryId);
  if (error) throw new Error(`전시 조회 실패: ${error.message}`);
  return data || [];
}

export async function createExhibition(data: {
  gallery_id: number;
  name: string;
  description: string;
  info: string;
  start_date: string;
  end_date: string;
  is_now: boolean;
  brochure?: string;
  location: string;
  admission_fee?: string;
}) {
  const { data: result, error } = await supabase
    .from("Exhibition")
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(`전시 생성 실패: ${error.message}`);
  return result;
}

export async function updateExhibition(
  id: number,
  data: {
    gallery_id: number;
    name: string;
    description: string;
    info: string;
    start_date: string;
    end_date: string;
    is_now: boolean;
    brochure?: string;
    location: string;
    admission_fee?: string;
  }
) {
  const { data: result, error } = await supabase
    .from("Exhibition")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`전시 수정 실패: ${error.message}`);
  return result;
}

export async function deleteExhibition(id: number) {
  const { error } = await supabase.from("Exhibition").delete().eq("id", id);
  if (error) throw new Error(`전시 삭제 실패: ${error.message}`);
  return { success: true };
}

// ==================== Artwork API (Supabase 직접 호출) ====================
export async function uploadArtworkImage(
  file: File,
  artistName: string
): Promise<string> {
  // 작가명을 안전한 형식으로 변환
  let sanitizedArtistName = artistName.trim();
  
  if (!sanitizedArtistName) {
    sanitizedArtistName = "unknown";
  }

  // 브라우저 환경에서 Base64 인코딩 (URL-safe)
  // 한글을 포함한 모든 문자를 안전하게 처리
  const utf8Bytes = new TextEncoder().encode(sanitizedArtistName);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  const encodedArtistName = base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // 파일 확장자 추출
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}.${fileExt}`;
  
  // 경로 구성: Artworks/{인코딩된작가명}/{파일명}
  const filePath = `Artworks/${encodedArtistName}/${fileName}`;

  // Supabase Storage에 업로드
  // 버킷 이름: "AI_Docent", 경로: "Artworks/{작가명}/{파일명}"
  const { data, error } = await supabase.storage
    .from("AI_Docent")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // Public URL 가져오기
  const {
    data: { publicUrl },
  } = supabase.storage.from("AI_Docent").getPublicUrl(filePath);

  return publicUrl;
}

export async function fetchArtworks(exhibitionId: number) {
  const { data, error } = await supabase
    .from("Artworks")
    .select("*")
    .eq("exhibition_id", exhibitionId);
  if (error) throw new Error(`작품 조회 실패: ${error.message}`);
  return data || [];
}

export async function fetchArtworkDetail(id: string) {
  const { data, error } = await supabase
    .from("Artworks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(`작품 상세 조회 실패: ${error.message}`);
  return data;
}

export async function createArtwork(data: {
  exhibition_id: number;
  title: string;
  artist: string;
  description?: string;
  image_url?: string;
  production_year?: string;
  ingredients?: string;
  size?: string;
  management_number?: number;
  is_now?: boolean;
}) {
  const { data: result, error } = await supabase
    .from("Artworks")
    .insert([data])
    .select()
    .single();
  if (error) throw new Error(`작품 생성 실패: ${error.message}`);
  return result;
}

export async function updateArtwork(
  id: string,
  data: {
    exhibition_id: number;
    title: string;
    artist: string;
    description?: string;
    image_url?: string;
    production_year?: string;
    ingredients?: string;
    size?: string;
    management_number?: number;
    is_now?: boolean;
  }
) {
  const { data: result, error } = await supabase
    .from("Artworks")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`작품 수정 실패: ${error.message}`);
  return result;
}

export async function deleteArtwork(id: string) {
  const { error } = await supabase.from("Artworks").delete().eq("id", id);
  if (error) throw new Error(`작품 삭제 실패: ${error.message}`);
  return { success: true };
}

// ==================== Image Search API ====================
export async function searchByImage(file: File, exhibitionId: number) {
  const form = new FormData();
  form.append("image", file);
  form.append("exhibition_id", String(exhibitionId));

  const res = await fetch(`${API_BASE}/image-search/`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("이미지 검색 실패");
  return res.json();
}