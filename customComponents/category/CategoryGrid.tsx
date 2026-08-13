"use client"

import { useRef, useState } from "react"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { Category } from "@/types/category"
import { useCategoriesMenu } from "@/context/CategoriesMenuContext"
import { useLocaleRegion } from "@/hooks/useLocaleRegion"
import { localized } from "@/lib/localized"

interface Props {
  categories: Category[]
}

const VISIBLE_COUNT = 11

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://169-58-13-208.nip.io"

const ALL_CATEGORIES_MARKER = "__all__"

const DRAG_THRESHOLD = 6

export default function CategoryGrid({ categories }: Props) {
  const { open: openCategoriesMenu } = useCategoriesMenu()
  const { locale, region } = useLocaleRegion()
  const t = useTranslations("category")
  const visible = categories.slice(0, VISIBLE_COUNT)

  const mobileItems = [...visible, { id: ALL_CATEGORIES_MARKER } as Category]
  const topRow = mobileItems.filter((_, i) => i % 2 === 0)
  const bottomRow = mobileItems.filter((_, i) => i % 2 !== 0)

  return (
    <section className="max-w-[1400px] mx-auto py-4 px-4 lg:px-0">
      <div className="lg:hidden">
        <DraggableRow
          topRow={topRow}
          bottomRow={bottomRow}
          onOpenMenu={openCategoriesMenu}
          locale={locale}
          region={region}
          allCategoriesLabel={t("allCategories")}
        />
      </div>

      <div className="hidden lg:grid grid-cols-4 xl:grid-cols-6 gap-2">
        {visible.map((category) => {
          const name = localized(category, locale)
          return (
            <a
              key={category.id}
              href={`/${locale}/${region}/category/${category.slug}`}
              className="group flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-2.5"
            >
              <img
                src={`${MEDIA_BASE}/public${category.imageUrl}`}
                alt={name}
                className="w-14 h-14 object-contain shrink-0"
              />
              <span className="flex-1 min-w-0 text-[17px] leading-tight font-normal text-black/80 line-clamp-2">
                {name}
              </span>
            </a>
          )
        })}

        <button
          onClick={openCategoriesMenu}
          className="flex items-center justify-between rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-2.5 text-left cursor-pointer"
        >
          <span className="text-[17px] font-normal text-black/80">
            {t("allCategories")}
          </span>
          <ChevronRight className="w-5 h-5 text-black/50 shrink-0" />
        </button>
      </div>
    </section>
  )
}

function DraggableRow({
  topRow,
  bottomRow,
  onOpenMenu,
  locale,
  region,
  allCategoriesLabel,
}: {
  topRow: Category[]
  bottomRow: Category[]
  onOpenMenu: () => void
  locale: string
  region: string
  allCategoriesLabel: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const pointerDownActive = useRef(false)
  const pointerId = useRef<number | null>(null)
  const startX = useRef(0)
  const startScrollLeft = useRef(0)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current
    if (!el) return
    pointerDownActive.current = true
    isDragging.current = false
    pointerId.current = e.pointerId
    startX.current = e.clientX
    startScrollLeft.current = el.scrollLeft
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerDownActive.current) return
    const el = scrollerRef.current
    if (!el) return

    const delta = e.clientX - startX.current

    if (!isDragging.current) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return
      isDragging.current = true
      setDragging(true)
      if (pointerId.current !== null) {
        el.setPointerCapture(pointerId.current)
      }
    }

    el.scrollLeft = startScrollLeft.current - delta
  }

  const endDrag = () => {
    pointerDownActive.current = false
    isDragging.current = false
    pointerId.current = null
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
            <MobilePill
              key={category.id}
              category={category}
              onOpenMenu={onOpenMenu}
              locale={locale}
              region={region}
              allCategoriesLabel={allCategoriesLabel}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {bottomRow.map((category) => (
            <MobilePill
              key={category.id}
              category={category}
              onOpenMenu={onOpenMenu}
              locale={locale}
              region={region}
              allCategoriesLabel={allCategoriesLabel}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MobilePill({
  category,
  onOpenMenu,
  locale,
  region,
  allCategoriesLabel,
}: {
  category: Category
  onOpenMenu: () => void
  locale: string
  region: string
  allCategoriesLabel: string
}) {
  if (category.id === ALL_CATEGORIES_MARKER) {
    return (
      <button
        onClick={onOpenMenu}
        className="flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-3.5 py-2.5 shrink-0 whitespace-nowrap cursor-pointer"
      >
        <span className="text-[15px] font-normal text-black/80">
          {allCategoriesLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-black/50 shrink-0" />
      </button>
    )
  }

  const name = localized(category, locale)

  return (
    <a
      href={`/${locale}/${region}/category/${category.slug}`}
      draggable={false}
      className="flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-3.5 py-2.5 shrink-0 whitespace-nowrap"
    >
      <img
        src={`${MEDIA_BASE}/public${category.imageUrl}`}
        alt={name}
        draggable={false}
        className="w-11 h-11 object-contain shrink-0"
      />
      <span className="text-[15px] font-normal text-black/80">
        {name}
      </span>
    </a>
  )
}