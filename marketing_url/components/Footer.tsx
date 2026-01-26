export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">CURAT</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              AI 기반 맞춤형 전시 안내 서비스로<br />
              더욱 풍부한 미술관 경험을 제공합니다.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">기능</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">주요 기능</a></li>
              <li><a href="#download" className="hover:text-white transition-colors">다운로드</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">문의</h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@curat.app" className="hover:text-white transition-colors">이메일</a></li>
              <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2026 CURAT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
