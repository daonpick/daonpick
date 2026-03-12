import { Eye, Heart } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { formatFakeViews } from '../../utils/formatters'

export default function RankingCard({ product, rank, onClickProduct, badge, isDragged }) {
  const { toggleWishlist, isWishlisted } = useStore()
  const wishlisted = isWishlisted(product.code)

  return (
    <div onClick={() => { if (!isDragged || !isDragged()) onClickProduct(product) }}
         className="shrink-0 w-40 text-left cursor-pointer select-none active:scale-[0.97] transition-transform"
         style={{ WebkitTouchCallout: 'none' }}>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
        <img src={product.image} alt={product.name} draggable={false} loading="lazy" decoding="async"
             onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image' }}
             className="w-full h-full object-cover pointer-events-none" />
        {badge && (
          <span className="badge-shimmer absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur text-[#F37021] font-bold text-[10px]"
                style={{ '--shimmer-delay': `${(rank - 1) * 0.8}s` }}>
            <span className="relative z-10">{badge}</span>
          </span>
        )}
        <button aria-label={wishlisted ? '찜 해제' : '찜하기'} className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
          <Heart className={`w-5 h-5 drop-shadow-lg transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white/80'}`} />
        </button>
        <span className="absolute bottom-1 left-2 text-6xl font-black italic leading-none tracking-tighter"
              style={{
                color: '#F37021',
                WebkitTextStroke: '2px rgba(255,255,255,0.85)',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}>
          {rank}
        </span>
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-sm font-bold text-gray-900 tracking-tight line-clamp-2 leading-snug">{product.name}</p>
        <span className="flex items-center gap-0.5 text-[11px] text-gray-400 mt-0.5">
          <Eye className="w-3 h-3" /> {formatFakeViews(product.views, product.product_code)}
        </span>
      </div>
    </div>
  )
}
