export default function Features() {
  const features = [
    {
      icon: '🎨',
      title: '맞춤형 온보딩',
      description: '연령대와 선호도를 선택하면, 나에게 맞는 수준의 작품 설명을 받을 수 있습니다.',
    },
    {
      icon: '🤖',
      title: 'AI 도슨트 채팅',
      description: '작품에 대해 궁금한 점을 자유롭게 질문하고, OpenAI 기반 AI가 맞춤형 답변을 제공합니다.',
    },
    {
      icon: '📸',
      title: '이미지 검색',
      description: '작품을 촬영하면 CLIP AI가 유사한 작품을 찾아주고, 작품에 대한 정보를 제공합니다.',
    },
    {
      icon: '🏛️',
      title: '전시 관리',
      description: '현재 진행 중인 전시와 과거 전시를 한눈에 확인하고, 관심 있는 전시를 선택할 수 있습니다.',
    },
    {
      icon: '💬',
      title: '채팅 히스토리',
      description: '전시별로 최대 3개의 세션을 저장하고, 언제든지 이전 대화를 다시 확인할 수 있습니다.',
    },
    {
      icon: '🌙',
      title: '다크모드',
      description: '시스템 설정에 따라 자동으로 다크모드가 적용되며, 수동으로도 전환할 수 있습니다.',
    },
  ]

  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">주요 기능</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            CURAT이 제공하는 다양한 기능으로<br />
            더욱 풍부한 전시 경험을 즐겨보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
