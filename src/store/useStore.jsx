import { createContext, useContext, useState, useCallback } from 'react'

const StoreContext = createContext(null)

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => loadJSON('daonpick_wishlist', []))
  const [recentViews, setRecentViews] = useState(() => loadJSON('daonpick_recent', []))

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const code = String(product.code)
      const exists = prev.some((p) => String(p.code) === code)
      const next = exists
        ? prev.filter((p) => String(p.code) !== code)
        : [{ code: product.code, name: product.name, image: product.image, link: product.link }, ...prev]
      localStorage.setItem('daonpick_wishlist', JSON.stringify(next))
      return next
    })
  }, [])

  const isWishlisted = useCallback((code) => {
    return wishlist.some((p) => String(p.code) === String(code))
  }, [wishlist])

  const addRecentView = useCallback((product) => {
    setRecentViews((prev) => {
      const code = String(product.code)
      const filtered = prev.filter((p) => String(p.code) !== code)
      const next = [{ code: product.code, name: product.name, image: product.image, link: product.link }, ...filtered].slice(0, 5)
      localStorage.setItem('daonpick_recent', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <StoreContext.Provider value={{ wishlist, recentViews, toggleWishlist, isWishlisted, addRecentView }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
