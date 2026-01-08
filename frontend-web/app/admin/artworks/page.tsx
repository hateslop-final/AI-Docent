"use client";

import { useState, useEffect } from "react";
import {
  fetchGalleries,
  fetchExhibitions,
  fetchArtworks,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  uploadArtworkImage,
} from "@/lib/api";
import type { Artwork, Exhibition } from "@/lib/types";
import AdminSidebar from "@/components/AdminSidebar";

type SortOption = "title_asc" | "title_desc" | "artist_asc" | "artist_desc" | "year_asc" | "year_desc";

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("title_asc");
  const [formData, setFormData] = useState({
    exhibition_id: "",
    title: "",
    artist: "",
    description: "",
    image_url: "",
    imageFile: null as File | null,
    production_year: "",
    ingredients: "",
    size: "",
    management_number: "",
    is_now: false,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAllExhibitions();
  }, []);

  useEffect(() => {
    if (selectedExhibitionId) {
      loadArtworks(selectedExhibitionId);
    }
  }, [selectedExhibitionId]);

  const loadAllExhibitions = async () => {
    try {
      const galleries = await fetchGalleries();
      const allExhibitions: Exhibition[] = [];
      
      // 모든 갤러리의 전시를 가져오기
      for (const gallery of galleries) {
        const exhibitions = await fetchExhibitions(gallery.id).catch(() => []);
        allExhibitions.push(...exhibitions);
      }
      
      setExhibitions(allExhibitions);
      if (allExhibitions.length > 0 && !selectedExhibitionId) {
        setSelectedExhibitionId(allExhibitions[0].id);
      }
    } catch (error) {
      console.error("전시 로딩 실패:", error);
    }
  };

  const loadArtworks = async (exhibitionId: number) => {
    setLoading(true);
    try {
      const data = await fetchArtworks(exhibitionId);
      setArtworks(data);
      setFilteredArtworks(data);
    } catch (error) {
      console.error("작품 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 정렬 적용
  useEffect(() => {
    let filtered = [...artworks];

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (artwork) =>
          artwork.title.toLowerCase().includes(query) ||
          artwork.artist.toLowerCase().includes(query) ||
          (artwork.description?.toLowerCase().includes(query) ?? false) ||
          (artwork.production_year?.toLowerCase().includes(query) ?? false)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "title_asc":
          return a.title.localeCompare(b.title, "ko");
        case "title_desc":
          return b.title.localeCompare(a.title, "ko");
        case "artist_asc":
          return a.artist.localeCompare(b.artist, "ko");
        case "artist_desc":
          return b.artist.localeCompare(a.artist, "ko");
        case "year_asc":
          const yearA = a.production_year || "";
          const yearB = b.production_year || "";
          return yearA.localeCompare(yearB);
        case "year_desc":
          const yearA2 = a.production_year || "";
          const yearB2 = b.production_year || "";
          return yearB2.localeCompare(yearA2);
        default:
          return 0;
      }
    });

    setFilteredArtworks(filtered);
  }, [artworks, searchQuery, sortOption]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.image_url;

      // 이미지 파일이 있으면 업로드
      if (formData.imageFile) {
        if (!formData.artist.trim()) {
          alert("작가명을 입력해주세요. 이미지 업로드를 위해 필요합니다.");
          setUploading(false);
          return;
        }
        try {
          imageUrl = await uploadArtworkImage(formData.imageFile, formData.artist);
        } catch (error: any) {
          alert(`이미지 업로드 실패: ${error.message}`);
          setUploading(false);
          return;
        }
      }

      const submitData = {
        exhibition_id: Number(formData.exhibition_id),
        title: formData.title,
        artist: formData.artist,
        description: formData.description || undefined,
        image_url: imageUrl || undefined,
        production_year: formData.production_year || undefined,
        ingredients: formData.ingredients || undefined,
        size: formData.size || undefined,
        management_number: formData.management_number
          ? Number(formData.management_number)
          : undefined,
        is_now: formData.is_now || undefined,
      };

      if (editingArtwork) {
        await updateArtwork(editingArtwork.id, submitData);
        alert("작품이 수정되었습니다.");
      } else {
        await createArtwork(submitData);
        alert("작품이 생성되었습니다.");
      }
      setShowForm(false);
      setEditingArtwork(null);
      setFormData({
        exhibition_id: "",
        title: "",
        artist: "",
        description: "",
        image_url: "",
        imageFile: null,
        production_year: "",
        ingredients: "",
        size: "",
        management_number: "",
        is_now: false,
      });
      if (selectedExhibitionId) loadArtworks(selectedExhibitionId);
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다. 백엔드 API가 구현되었는지 확인해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setFormData({
      exhibition_id: String(artwork.exhibition_id),
      title: artwork.title,
      artist: artwork.artist,
      description: artwork.description || "",
      image_url: artwork.image_url || "",
      imageFile: null,
      production_year: artwork.production_year || "",
      ingredients: artwork.ingredients || "",
      size: artwork.size || "",
      management_number: String(artwork.management_number || ""),
      is_now: artwork.is_now || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteArtwork(id);
      alert("작품이 삭제되었습니다.");
      if (selectedExhibitionId) loadArtworks(selectedExhibitionId);
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다. 백엔드 API가 구현되었는지 확인해주세요.");
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">작품 관리</h2>
          <div className="flex gap-4 items-center">
            <select
              value={selectedExhibitionId || ""}
              onChange={(e) => setSelectedExhibitionId(Number(e.target.value))}
              className="px-4 py-2 border rounded min-w-[300px]"
            >
              <option value="">전시 선택</option>
              {exhibitions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingArtwork(null);
                setFormData({
                  exhibition_id: String(selectedExhibitionId || ""),
                  title: "",
                  artist: "",
                  description: "",
                  image_url: "",
                  imageFile: null,
                  production_year: "",
                  ingredients: "",
                  size: "",
                  management_number: "",
                  is_now: false,
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!selectedExhibitionId}
            >
              + 새 작품 추가
            </button>
          </div>
        </div>

        {/* 검색 및 정렬 */}
        {artworks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="제목, 작가, 설명, 연도로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-sm font-medium whitespace-nowrap">정렬:</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-3 py-2 border rounded min-w-[150px]"
                >
                  <option value="title_asc">제목 (가나다순)</option>
                  <option value="title_desc">제목 (역순)</option>
                  <option value="artist_asc">작가 (가나다순)</option>
                  <option value="artist_desc">작가 (역순)</option>
                  <option value="year_asc">연도 (오름차순)</option>
                  <option value="year_desc">연도 (내림차순)</option>
                </select>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 whitespace-nowrap flex-shrink-0"
                >
                  검색 초기화
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                검색 결과: {filteredArtworks.length}개
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">
              {editingArtwork ? "작품 수정" : "새 작품 추가"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">전시</label>
                  <select
                    value={formData.exhibition_id}
                    onChange={(e) =>
                      setFormData({ ...formData, exhibition_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">선택</option>
                    {exhibitions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">작가</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이미지</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, imageFile: file, image_url: "" });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded"
                  />
                  {formData.imageFile && (
                    <div className="text-sm text-gray-600">
                      선택된 파일: {formData.imageFile.name}
                    </div>
                  )}
                  {formData.image_url && !formData.imageFile && (
                    <div className="text-sm text-gray-600">
                      현재 이미지 URL: {formData.image_url}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    이미지를 업로드하면 작가명 폴더에 자동으로 저장됩니다.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">제작 연도</label>
                  <input
                    type="text"
                    value={formData.production_year}
                    onChange={(e) =>
                      setFormData({ ...formData, production_year: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">재료/기법</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) =>
                      setFormData({ ...formData, ingredients: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">크기</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">관리 번호</label>
                <input
                  type="number"
                  value={formData.management_number}
                  onChange={(e) =>
                    setFormData({ ...formData, management_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_now}
                    onChange={(e) =>
                      setFormData({ ...formData, is_now: e.target.checked })
                    }
                    className="mr-2"
                  />
                  현재 전시 중인 작품
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingArtwork ? "수정" : "추가"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingArtwork(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">로딩 중...</div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden min-h-[500px] w-full">
            <div className="overflow-x-auto">
              <table className="divide-y divide-gray-200" style={{ minWidth: "900px", width: "100%" }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: "120px", minWidth: "120px" }}>
                    이미지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: "250px" }}>
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: "180px" }}>
                    작가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: "120px" }}>
                    제작연도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: "150px", minWidth: "150px" }}>
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArtworks.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                      {searchQuery ? "검색 결과가 없습니다." : "작품이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredArtworks.map((artwork) => (
                    <tr key={artwork.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {artwork.image_url ? (
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {artwork.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {artwork.artist}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {artwork.production_year || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(artwork)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(artwork.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
