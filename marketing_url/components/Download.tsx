export default function Download() {
  return (
    <section id="download" className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div className="container-max">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-12 text-primary-100">
            iOS와 Android에서 무료로 다운로드하고<br />
            나만의 전시 경험을 시작해보세요
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <a
              href="#"
              className="flex items-center gap-3 px-8 py-4 bg-white text-primary-600 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.44-2.24-1.06-3.38-1.61-4.12-2.75C5.5 15.5 5.5 13.5 5.5 12c0-1.5 0-3.5 1.11-5.49.74-1.14 1.88-1.69 4.12-2.75 1.16-.48 2.15-.94 3.24-1.44 1.03-.48 2.1-.55 3.08.4 1.01 1.01 1.01 2.01 1.01 3.01 0 1 0 2-.01 3.01z"/>
              </svg>
              App Store에서 다운로드
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-8 py-4 bg-white text-primary-600 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play에서 다운로드
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-primary-200">전시 작품</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-200">AI 도슨트 지원</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">무료</div>
              <div className="text-primary-200">앱 다운로드</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
