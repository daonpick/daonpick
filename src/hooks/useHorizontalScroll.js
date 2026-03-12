import { useState, useEffect, useCallback, useRef } from 'react'

export default function useHorizontalScroll() {
  const ref = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const drag = useRef({ active: false, startX: 0, sl: 0, moved: false })

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  const scrollDir = useCallback((dir) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: el.scrollLeft + dir * 180, behavior: 'smooth' })
  }, [])

  const isDragged = useCallback(() => drag.current.moved, [])

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    drag.current = { active: true, startX: e.clientX, sl: el.scrollLeft, moved: false }

    const onMouseMove = (ev) => {
      if (!drag.current.active) return
      ev.preventDefault()
      const dx = ev.clientX - drag.current.startX
      if (Math.abs(dx) > 3) drag.current.moved = true
      el.scrollLeft = drag.current.sl - dx
    }

    const onMouseUp = () => {
      drag.current.active = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      setTimeout(() => { drag.current.moved = false }, 0)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    check()
    el.addEventListener('scroll', check, { passive: true })

    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += (e.deltaY || e.deltaX)
    }
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('scroll', check)
      el.removeEventListener('wheel', onWheel)
    }
  }, [check])

  return { ref, canScrollLeft, canScrollRight, scrollDir, isDragged, onMouseDown }
}
