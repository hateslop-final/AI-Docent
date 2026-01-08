"use client";

import { useState, useEffect } from "react";
import { fetchGalleries, fetchExhibitions, fetchArtworks } from "@/lib/api";
import type { Gallery, Exhibition, Artwork } from "@/lib/types";
import AdminSidebar from "@/components/AdminSidebar";

type TableStats = {
  name: string;
  count: number;
  description: string;
  fields: string[];
};

type GalleryStats = {
  gallery: Gallery;
  exhibitionCount: number;
  artworkCount: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<TableStats[]>([]);
  const [galleryStats, setGalleryStats] = useState<GalleryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 모든 갤러리 가져오기
        const galleries = await fetchGalleries().catch(() => []);
        
        // 모든 전시 가져오기 (각 갤러리별로)
        const allExhibitions: Exhibition[] = [];
        for (const gallery of galleries) {
          const exhibitions = await fetchExhibitions(gallery.id).catch(() => []);
          allExhibitions.push(...exhibitions);
        }

        // 모든 작품 가져오기 (각 전시별로)
        const allArtworks: Artwork[] = [];
        for (const exhibition of allExhibitions) {
          const artworks = await fetchArtworks(exhibition.id).catch(() => []);
          allArtworks.push(...artworks);
        }

        // 전체 통계
        setStats([
          {
            name: "Gallery",
            count: galleries.length || 0,
            description: "갤러리 정보를 관리합니다",
            fields: ["id", "name", "location", "description"],
          },
          {
            name: "Exhibition",
            count: allExhibitions.length || 0,
            description: "전시 정보를 관리합니다",
            fields: [
              "id",
              "gallery_id",
              "name",
              "description",
              "info",
              "start_date",
              "end_date",
              "is_now",
              "brochure",
              "location",
              "admission_fee",
            ],
          },
          {
            name: "Artwork",
            count: allArtworks.length || 0,
            description: "작품 정보를 관리합니다",
            fields: [
              "id",
              "exhibition_id",
              "title",
              "artist",
              "description",
              "image_url",
              "production_year",
              "ingredients",
              "size",
              "embedding",
              "management_number",
              "is_now",
            ],
          },
        ]);

        // 갤러리별 상세 통계
        const galleryStatsData: GalleryStats[] = [];
        for (const gallery of galleries) {
          const exhibitions = await fetchExhibitions(gallery.id).catch(() => []);
          let artworkCount = 0;
          for (const exhibition of exhibitions) {
            const artworks = await fetchArtworks(exhibition.id).catch(() => []);
            artworkCount += artworks.length;
          }
          galleryStatsData.push({
            gallery,
            exhibitionCount: exhibitions.length,
            artworkCount,
          });
        }
        setGalleryStats(galleryStatsData);
      } catch (error) {
        console.error("통계 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex h-screen">
      <AdminSidebar />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto p-8">
        <h2 className="text-3xl font-bold mb-6">대시보드</h2>

        {loading ? (
          <div className="text-center py-12">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((table) => (
              <div
                key={table.name}
                className="bg-white rounded-lg shadow p-6 border border-gray-200"
              >
                <h3 className="text-xl font-semibold mb-2">{table.name}</h3>
                <p className="text-gray-600 mb-4">{table.description}</p>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {table.count}
                </div>
                <div className="text-sm text-gray-500">
                  총 {table.count}개 레코드
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 갤러리별 상세 통계 */}
        {galleryStats.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
            <h3 className="text-xl font-semibold mb-4">갤러리별 상세 통계</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      갤러리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      전시 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      작품 수
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {galleryStats.map((item) => (
                    <tr key={item.gallery.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.gallery.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.gallery.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.exhibitionCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.artworkCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 데이터베이스 구조 요약 */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">데이터베이스 구조</h3>
          <div className="space-y-4">
            {stats.map((table) => (
              <div key={table.name} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-lg mb-2">{table.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{table.description}</p>
                <div className="flex flex-wrap gap-2">
                  {table.fields.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
