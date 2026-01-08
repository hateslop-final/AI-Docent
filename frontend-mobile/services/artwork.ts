import { supabase } from "./supabase";

export type Artwork = {
  id: string;
  exhibition_id: number;
  title: string;
  artist?: string;
  image_url?: string;
  production_year?: string | null;
};

export async function fetchArtworksByExhibition(exhibitionId: number): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from("Artworks")
    .select("id, exhibition_id, title, artist, image_url, production_year")
    .eq("exhibition_id", exhibitionId)
    .order("title");
  if (error) throw new Error(`작품 조회 실패: ${error.message}`);
  return data ?? [];
}

export async function searchArtworksByTitleOrArtist(params: {
  exhibitionId?: number;
  query: string;
}): Promise<Artwork[]> {
  const { exhibitionId, query } = params;
  const builder = supabase
    .from("Artworks")
    .select("id, exhibition_id, title, artist, image_url, production_year")
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order("title")
    .limit(50);

  if (exhibitionId !== undefined) {
    builder.eq("exhibition_id", exhibitionId);
  }

  const { data, error } = await builder;
  if (error) throw new Error(`작품 검색 실패: ${error.message}`);
  return data ?? [];
}