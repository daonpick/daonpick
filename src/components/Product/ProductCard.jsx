import { Eye, ArrowRight, Heart } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatFakeViews } from '../../utils/formatters'

export default function ProductCard({ product, onClickProduct }) {
  const { toggleWishlist, isWishlisted } = useStore()
  const wishlisted = isWishlisted(product.code)

  return (
    <div onClick={() => onClickProduct(product)}
         className="w-full select-none cursor-pointer active:scale-[0.97] transition-transform"
         style={{ WebkitTouchCallout: 'none' }}>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img src={product.image} alt={product.name} draggable={false} loading="lazy" decoding="async"
               onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image' }}
               className="w-full h-full object-cover pointer-events-none" />
          {product.display_code && (
            <div className="absolute top-0 left-0 bg-[#191F28]/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-br-xl z-10">
              {product.display_code}
            </div>
          )}
          <button aria-label={wishlisted ? '찜 해제' : '찜하기'} className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
            <Heart className={`w-5 h-5 drop-shadow-lg transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
          </button>
        </div>
        <div className="p-3">
          <p className="text-[14px] font-bold text-[#222] leading-snug truncate tracking-tight">{product.name}</p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" /> {formatFakeViews(product.views, product.product_code)}
            </span>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-[#F37021]">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
