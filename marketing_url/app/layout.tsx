import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CURAT - 당신의 AI 도슨트',
  description: 'AI 기반 맞춤형 전시 안내 서비스. 작품을 촬영하고, AI 도슨트와 대화하며, 나만의 전시 경험을 만들어보세요.',
  keywords: ['AI 도슨트', '미술관', '전시', '예술', 'AI 채팅', '이미지 검색'],
  openGraph: {
    title: 'CURAT - 당신의 AI 도슨트',
    description: 'AI 기반 맞춤형 전시 안내 서비스',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
