'use client'

import { useState } from 'react'

export default function Hero() {
  const [imageError, setImageError] = useState(false)
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container-max section-padding relative z-10">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="gradient-text">CURAT</span>
            <br />
            <span className="text-gray-900">당신의 AI 도슨트</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            작품을 촬영하고, AI와 대화하며<br />
            나만의 맞춤형 전시 경험을 만들어보세요
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#download"
              className="px-8 py-4 bg-primary-600 text-white rounded-full font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              앱 다운로드
            </a>
            <a
              href="#features"
              className="px-8 py-4 bg-white text-primary-600 rounded-full font-semibold text-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
            >
              기능 알아보기
            </a>
          </div>

          {/* 앱 미리보기 이미지 영역 */}
          <div className="mt-16 relative">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-[9/16] bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* 앱 스크린샷 이미지 - public/screenshot.png 또는 screenshot.jpg 파일을 추가하세요 */}
                  {!imageError ? (
                    <img 
                      src="/screenshot.png" 
                      alt="CURAT 앱 스크린샷"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-400 text-lg">앱 스크린샷 이미지를 추가하세요</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
