"use client"

import { useRef, useState } from "react"
import { ChevronRight } from "lucide-react"
import { Category } from "@/types/category"
import { useCategoriesMenu } from "@/context/CategoriesMenuContext"

interface Props {
  categories: Category[] // root categories, already ordered by createdAt on the backend
}

// Show 11 real categories + 1 "Все категории" cell = 12 total, matching the
// birbir-style fixed grid on desktop (no horizontal scrolling needed).
const VISIBLE_COUNT = 11

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
  "https://169-58-13-208.nip.io"

// A sentinel appended to the mobile list so "Все категории" naturally falls
// into whichever row it belongs to when we split by index, instead of being
// bolted on separately after the fact.
const ALL_CATEGORIES_MARKER = "__all__"

export default function CategoryGrid({ categories }: Props) {
  const { open: openCategoriesMenu } = useCategoriesMenu()
  const visible = categories.slice(0, VISIBLE_COUNT)

  // Mobile/tablet-only: alternate items into two independent horizontal rows
  // (even index -> top row, odd index -> bottom row). Each row flows on its
  // own — this deliberately avoids pairing items into shared-height columns,
  // which is what caused the uneven-gap bug we ran into on the native app.
  const mobileItems = [...visible, { id: ALL_CATEGORIES_MARKER } as Category]
  const topRow = mobileItems.filter((_, i) => i % 2 === 0)
  const bottomRow = mobileItems.filter((_, i) => i % 2 !== 0)

  return (
    <section className="max-w-[1400px] mx-auto py-4">
      {/*
        Below lg (so phones AND tablets): horizontally-scrolling pill rows.
        The grid version only kicks in on genuinely large/desktop screens.
      */}
      <div className="lg:hidden">
        <DraggableRow topRow={topRow} bottomRow={bottomRow} onOpenMenu={openCategoriesMenu} />
      </div>

      {/* ---------- Desktop (lg and up): fixed grid, unchanged ---------- */}
      <div className="hidden lg:grid grid-cols-4 xl:grid-cols-6 gap-2">
        {visible.map((category) => (
          // Root categories have no ancestors, so their own slug IS the
          // canonical path — no need to walk parentId chains here like
          // CategoriesMegaMenu has to for deeper categories.
          <a
            key={category.id}
            href={`/${category.slug}`}
            className="group flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-2.5"
          >
            <img
              src={`${MEDIA_BASE}/public${category.imageUrl}`}
              alt={category.name}
              className="w-14 h-14 object-contain shrink-0"
            />
            <span className="flex-1 min-w-0 text-[17px] leading-tight font-normal text-black/80 line-clamp-2">
              {category.name}
            </span>
          </a>
        ))}

        <button
          onClick={openCategoriesMenu}
          className="flex items-center justify-between rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-2.5 text-left cursor-pointer"
        >
          <span className="text-[17px] font-normal text-black/80">
            Все категории
          </span>
          <ChevronRight className="w-5 h-5 text-black/50 shrink-0" />
        </button>
      </div>
    </section>
  )
}

/**
 * Two horizontally-scrolling pill rows that also support click-and-drag with
 * a mouse (not just touch), since a real mouse has no swipe gesture and the
 * scrollbar itself is hidden.
 */
function DraggableRow({
  topRow,
  bottomRow,
  onOpenMenu,
}: {
  topRow: Category[]
  bottomRow: Category[]
  onOpenMenu: () => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    if (!el) return
    isDragging.current = true
    setDragging(true)
    startX.current = e.clientX
    startScrollLeft.current = el.scrollLeft
    el.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = startScrollLeft.current - (e.clientX - startX.current)
  }

  const endDrag = () => {
    isDragging.current = false
    setDragging(false)
  }

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className={`overflow-x-auto hide-scrollbar -mx-4 px-4 ${
        dragging ? "cursor-grabbing select-none" : "cursor-grab"
      }`}
    >
      <div className="flex flex-col gap-2 w-max">
        <div className="flex gap-2">
          {topRow.map((category) => (
            <MobilePill key={category.id} category={category} onOpenMenu={onOpenMenu} />
          ))}
        </div>
        <div className="flex gap-2">
          {bottomRow.map((category) => (
            <MobilePill key={category.id} category={category} onOpenMenu={onOpenMenu} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** A single pill in the horizontal-scroll rows. Renders either a real
 * category link, or the "Все категории" trigger when it hits the sentinel. */
function MobilePill({
  category,
  onOpenMenu,
}: {
  category: Category
  onOpenMenu: () => void
}) {
  if (category.id === ALL_CATEGORIES_MARKER) {
    return (
      <button
        onClick={onOpenMenu}
        className="flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-3.5 py-2.5 shrink-0 whitespace-nowrap cursor-pointer"
      >
        <span className="text-[15px] font-normal text-black/80">
          Все категории
        </span>
        <ChevronRight className="w-4 h-4 text-black/50 shrink-0" />
      </button>
    )
  }

  return (
    // Same reasoning as the desktop grid above — root category, own slug
    // is already the canonical path.
    <a
      href={`/${category.slug}`}
      draggable={false}
      className="flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-3.5 py-2.5 shrink-0 whitespace-nowrap"
    >
      <img
        src={`${MEDIA_BASE}/public${category.imageUrl}`}
        alt={category.name}
        draggable={false}
        className="w-11 h-11 object-contain shrink-0"
      />
      <span className="text-[15px] font-normal text-black/80">
        {category.name}
      </span>
    </a>
  )
}