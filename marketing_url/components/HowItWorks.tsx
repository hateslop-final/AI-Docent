export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: '온보딩 완료',
      description: '연령대, 선호도, 관심 갤러리를 선택하여 나만의 프로필을 만듭니다.',
    },
    {
      number: '02',
      title: '전시 선택',
      description: '홈 화면에서 현재 진행 중인 전시를 선택하고 작품을 둘러봅니다.',
    },
    {
      number: '03',
      title: '작품 촬영 또는 채팅',
      description: '작품을 촬영하여 유사 작품을 찾거나, AI 도슨트와 채팅하며 작품에 대해 질문합니다.',
    },
    {
      number: '04',
      title: '맞춤형 경험',
      description: 'AI가 제공하는 맞춤형 설명과 추천을 통해 더 깊이 있는 전시 경험을 즐깁니다.',
    },
  ]

  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="gradient-text">작동 방식</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            간단한 4단계로 시작하는<br />
            나만의 전시 여행
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex gap-6 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-1/2 -bottom-8 transform -translate-x-1/2">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-primary-300 to-primary-200"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
