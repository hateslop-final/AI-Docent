import { supabase } from "./supabase";

export const DEFAULT_PROFILE_IMAGE_URL =
  "https://via.placeholder.com/200/007AFF/FFFFFF?text=User";

export async function uploadProfileImage(
  userId: string,
  imageUri: string
): Promise<string> {
  const filePath = `profiles/${userId}/avatar.jpg`;

  console.log("📤 upload start", { userId, imageUri, filePath });

  // 1) 이미지 fetch
  const res = await fetch(imageUri);
  if (!res.ok) throw new Error("이미지 fetch 실패");

  // 2) ArrayBuffer로 변환
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  console.log("📦 buffer size:", uint8Array.byteLength);

  if (uint8Array.byteLength === 0) {
    throw new Error("이미지 버퍼가 비어있음");
  }

  // 3) Supabase 업로드 (핵심)
  const { error } = await supabase.storage
    .from("AI_Docent")
    .upload(filePath, uint8Array, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("❌ upload error", error);
    throw error;
  }

  // 4) public url (캐시 무효화를 위해 타임스탬프 추가)
  const { data } = supabase.storage
    .from("AI_Docent")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;
  // 캐시 무효화를 위해 타임스탬프 추가
  const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

  console.log("✅ upload success:", urlWithCacheBust);
  return urlWithCacheBust;
}

export async function deleteProfileImage(userId: string): Promise<void> {
  const filePath = `profiles/${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from("AI_Docent")
    .remove([filePath]);

  if (error) {
    console.error("❌ delete error", error);
    throw error;
  }

  console.log("✅ delete success:", filePath);
}