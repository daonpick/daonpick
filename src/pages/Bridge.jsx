import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function Bridge() {
  const { code } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then((data) => {
        const found = data.find(
          (item) => item.code.toLowerCase() === code.toLowerCase()
        )
        setProduct(found || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
        <p className="text-[15px] text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-[#F9FAFB]">
        <div className="w-full max-w-[480px] px-5 pt-14">
          <Link to="/" className="text-[15px] text-blue-500 flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Link>
          <p className="mt-10 text-center text-gray-500 text-[15px]">
            상품을 찾을 수 없어요
          </p>
        </div>
      </div>
    )
  }

  const discountedPrice = Math.round(
    product.price * (1 - product.discount / 100)
  )

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F9FAFB]">
      {/* 공정위 문구 — fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm">
        <p className="max-w-[480px] mx-auto px-4 py-2 text-[11px] text-white/80 text-center leading-relaxed">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
          수수료를 제공받습니다.
        </p>
      </div>

      <div className="w-full max-w-[480px] px-5 pt-14 pb-12">
        {/* Top Bar */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-[15px] text-gray-500 py-2">
          <ArrowLeft className="w-4 h-4" />
          홈
        </Link>

        {/* Product Card */}
        <div className="mt-4 bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Product Image */}
          <div className="bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="px-6 pt-6 pb-7">
            <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-xs font-medium text-blue-600">
              {product.category}
            </span>
            <h2 className="mt-3 text-[18px] font-bold text-gray-900 leading-snug">
              {product.name}
            </h2>
            <p className="mt-2.5 text-[14px] text-gray-500 leading-relaxed">
              {product.description}
            </p>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-red-500">
                {product.discount}%
              </span>
              <span className="text-xl font-bold text-gray-900">
                {discountedPrice.toLocaleString()}원
              </span>
            </div>
            <span className="text-[13px] text-gray-400 line-through">
              {product.price.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* CTA */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full h-14 rounded-3xl bg-blue-500 text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-sm animate-heartbeat"
        >
          최저가로 구매하기
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
