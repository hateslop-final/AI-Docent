"use client";

import { useState, useEffect } from "react";
import {
  fetchGalleries,
  fetchExhibitions,
  createExhibition,
  updateExhibition,
  deleteExhibition,
} from "@/lib/api";
import type { Exhibition, Gallery } from "@/lib/types";
import AdminSidebar from "@/components/AdminSidebar";

export default function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [formData, setFormData] = useState({
    gallery_id: "",
    name: "",
    description: "",
    info: "",
    start_date: "",
    end_date: "",
    is_now: false,
    brochure: "",
    location: "",
    admission_fee: "",
  });

  useEffect(() => {
    loadGalleries();
  }, []);

  useEffect(() => {
    if (selectedGalleryId) {
      loadExhibitions(selectedGalleryId);
    }
  }, [selectedGalleryId]);

  const loadGalleries = async () => {
    try {
      const data = await fetchGalleries();
      setGalleries(data);
      if (data.length > 0 && !selectedGalleryId) {
        setSelectedGalleryId(data[0].id);
      }
    } catch (error) {
      console.error("갤러리 로딩 실패:", error);
    }
  };

  const loadExhibitions = async (galleryId: number) => {
    setLoading(true);
    try {
      const data = await fetchExhibitions(galleryId);
      setExhibitions(data);
    } catch (error) {
      console.error("전시 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        gallery_id: Number(formData.gallery_id),
        name: formData.name,
        description: formData.description,
        info: formData.info,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_now: formData.is_now,
        brochure: formData.brochure || undefined,
        location: formData.location,
        admission_fee: formData.admission_fee || undefined,
      };

      if (editingExhibition) {
        await updateExhibition(editingExhibition.id, submitData);
        alert("전시가 수정되었습니다.");
      } else {
        await createExhibition(submitData);
        alert("전시가 생성되었습니다.");
      }
      setShowForm(false);
      setEditingExhibition(null);
      if (selectedGalleryId) loadExhibitions(selectedGalleryId);
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장에 실패했습니다. 백엔드 API가 구현되었는지 확인해주세요.");
    }
  };

  const handleEdit = (exhibition: Exhibition) => {
    setEditingExhibition(exhibition);
    setFormData({
      gallery_id: String(exhibition.gallery_id),
      name: exhibition.name,
      description: exhibition.description,
      info: exhibition.info,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      is_now: exhibition.is_now,
      brochure: exhibition.brochure || "",
      location: exhibition.location,
      admission_fee: exhibition.admission_fee || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteExhibition(id);
      alert("전시가 삭제되었습니다.");
      if (selectedGalleryId) loadExhibitions(selectedGalleryId);
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
          <h2 className="text-3xl font-bold">전시 관리</h2>
          <div className="flex gap-4 items-center">
            <select
              value={selectedGalleryId || ""}
              onChange={(e) => setSelectedGalleryId(Number(e.target.value))}
              className="px-4 py-2 border rounded"
            >
              <option value="">갤러리 선택</option>
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingExhibition(null);
                setFormData({
                  gallery_id: String(selectedGalleryId || ""),
                  name: "",
                  description: "",
                  info: "",
                  start_date: "",
                  end_date: "",
                  is_now: false,
                  brochure: "",
                  location: "",
                  admission_fee: "",
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={!selectedGalleryId}
            >
              + 새 전시 추가
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">
              {editingExhibition ? "전시 수정" : "새 전시 추가"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">갤러리</label>
                  <select
                    value={formData.gallery_id}
                    onChange={(e) =>
                      setFormData({ ...formData, gallery_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  >
                    <option value="">선택</option>
                    {galleries.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이름</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">상세 정보</label>
                <textarea
                  value={formData.info}
                  onChange={(e) =>
                    setFormData({ ...formData, info: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">시작일</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">종료일</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">위치</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">입장료</label>
                  <input
                    type="text"
                    value={formData.admission_fee}
                    onChange={(e) =>
                      setFormData({ ...formData, admission_fee: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
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
                  현재 진행 중인 전시
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingExhibition ? "수정" : "추가"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingExhibition(null);
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
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    위치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    진행중
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exhibitions.map((exhibition) => (
                  <tr key={exhibition.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {exhibition.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {exhibition.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exhibition.start_date} ~ {exhibition.end_date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {exhibition.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {exhibition.is_now ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          진행중
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                          종료
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(exhibition)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(exhibition.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
