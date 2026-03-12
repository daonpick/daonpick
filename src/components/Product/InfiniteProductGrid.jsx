import { useEffect, useRef, memo } from 'react'
import ProductCard from './ProductCard'
import SkeletonGrid from './SkeletonGrid'
import { ITEMS_PER_PAGE } from '../../utils/constants'

const InfiniteProductGrid = memo(function InfiniteProductGrid({ filteredProducts, visibleCount, hasMore, onLoadMore, onClickProduct }) {
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.slice(0, visibleCount).map((p, i) => {
          const isNewBatch = i >= visibleCount - ITEMS_PER_PAGE
          return (
            <div key={p.product_code}
                 className={isNewBatch ? 'opacity-0' : ''}
                 style={isNewBatch ? { animation: 'slide-up 0.7s ease-out forwards', animationDelay: `${(i % ITEMS_PER_PAGE) * 200}ms` } : undefined}>
              <ProductCard product={p} onClickProduct={onClickProduct} />
            </div>
          )
        })}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="mt-6">
          <SkeletonGrid />
        </div>
      )}
    </div>
  )
})

export default InfiniteProductGrid
