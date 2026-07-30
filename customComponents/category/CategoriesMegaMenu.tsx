"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { api } from "@/helpers/api"
import { Category } from "@/types/category"
import { slugPathFor } from "@/lib/categorySlug"

interface Props {
  rootCategories: Category[]
  onClose: () => void
}

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
  "https://169-58-13-208.nip.io"

// How many grandchild links to show per second-level group before
// collapsing the rest behind "Ещё N" (desktop pane only).
const COLLAPSED_COUNT = 5

export default function CategoriesMegaMenu({ rootCategories, onClose }: Props) {
  const [allCategories, setAllCategories] = useState<Category[] | null>(null)
  const [activeRootId, setActiveRootId] = useState<string | null>(
    rootCategories[0]?.id ?? null,
  )
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Mobile only: a stack of selected categories representing how deep we've
  // drilled down (empty = showing the root list). Each level renders only
  // its own direct children — nothing further is shown until tapped.
  const [mobileStack, setMobileStack] = useState<Category[]>([])
  const [mobileQuery, setMobileQuery] = useState("")

  // Lock page scroll while the modal is open.
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  // Lazy-load the full (flat) category list — with parentId — the first
  // time the menu opens, so the homepage itself only ever needs the roots.
  useEffect(() => {
    let cancelled = false
    api.get("/categories").then((res) => {
      if (!cancelled) setAllCategories(res.data.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>()
    if (!allCategories) return map
    for (const cat of allCategories) {
      if (!cat.parentId) continue
      const list = map.get(cat.parentId) ?? []
      list.push(cat)
      map.set(cat.parentId, list)
    }
    return map
  }, [allCategories])

  // Full canonical slug path for a category (e.g. "Автомобили" ->
  // "/transport/avtomobili") — matches app/[...slug]/page.tsx's own
  // canonicalization exactly, so these links never bounce through a
  // redirect. Falls back to just the category's own slug if the flat
  // list hasn't loaded yet (shouldn't normally happen since links only
  // render once allCategories is populated).
  const categoryHref = (cat: Category) =>
    `/${slugPathFor(cat, allCategories ?? rootCategories).join("/")}`

  const secondLevel = activeRootId ? childrenByParent.get(activeRootId) ?? [] : []
  const activeRoot = rootCategories.find((c) => c.id === activeRootId)

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }))

  const pushMobile = (cat: Category) => {
    setMobileStack((prev) => [...prev, cat])
    setMobileQuery("")
  }
  const popMobile = () => {
    setMobileStack((prev) => prev.slice(0, -1))
    setMobileQuery("")
  }

  const mobileParent = mobileStack[mobileStack.length - 1] ?? null
  const mobileList = mobileParent
    ? childrenByParent.get(mobileParent.id) ?? []
    : rootCategories
  const filteredMobileList = mobileQuery.trim()
    ? mobileList.filter((c) =>
        c.name.toLowerCase().includes(mobileQuery.trim().toLowerCase()),
      )
    : mobileList

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center md:pt-20 md:px-4">
      <div
        className="hidden md:block absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* ---------- Desktop / tablet (md and up): side-by-side panes ---------- */}
      <div className="hidden md:flex relative bg-white rounded-2xl w-full max-w-7xl max-h-[75vh] overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-80 shrink-0 border-r border-gray-100 overflow-y-auto py-3">
          <RootCategoryList
            rootCategories={rootCategories}
            activeRootId={activeRootId}
            onSelect={setActiveRootId}
            onHover={setActiveRootId}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!allCategories ? (
            <MegaMenuSkeleton />
          ) : (
            <>
              <a
                href={activeRoot ? categoryHref(activeRoot) : "#"}
                onClick={onClose}
                className="flex items-center gap-1.5 text-2xl font-medium leading-none mb-5 hover:text-primary transition-colors"
              >
                {activeRoot?.name}
                <ChevronRight className="w-6 h-6 text-black/80" />
              </a>
              <SubcategoryColumns
                secondLevel={secondLevel}
                childrenByParent={childrenByParent}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                categoryHref={categoryHref}
                onNavigate={onClose}
              />
            </>
          )}
        </div>
      </div>

      {/* ---------- Mobile (below md): full-screen recursive drill-down ---------- */}
      <div className="flex md:hidden relative bg-white w-full h-full flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          {mobileParent ? (
            <button
              onClick={popMobile}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-9 h-9 shrink-0" />
          )}
          <h2 className="flex-1 text-lg font-normal truncate">
            {mobileParent ? mobileParent.name : "Все категории"}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder="Найти"
              className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {!allCategories && mobileParent ? (
            <div className="px-4">
              <MegaMenuSkeleton />
            </div>
          ) : (
            <>
              {/* "Все категории" shortcut to the current level's own listing page —
                  only shown once we've drilled into something (not at the root list). */}
              {mobileParent && (
                <a
                  href={categoryHref(mobileParent)}
                  onClick={onClose}
                  className="block px-4 py-3 text-[16px] text-black/80 hover:bg-gray-50"
                >
                  Все категории
                </a>
              )}

              {filteredMobileList.map((cat) => {
                const hasChildren = (childrenByParent.get(cat.id) ?? []).length > 0
                const showIcon = mobileStack.length === 0 // only true root level has icons

                const content = (
                  <>
                    {showIcon && (
                      <span className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-50 shrink-0">
                        <img
                          src={`${MEDIA_BASE}/public${cat.imageUrl}`}
                          alt={cat.name}
                          className="w-12 h-12 object-contain"
                        />
                      </span>
                    )}
                    <span className="flex-1 min-w-0 text-[16px] font-normal text-black/80 line-clamp-2">
                      {cat.name}
                    </span>
                    {hasChildren && (
                      <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />
                    )}
                  </>
                )

                return hasChildren ? (
                  <button
                    key={cat.id}
                    onClick={() => pushMobile(cat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {content}
                  </button>
                ) : (
                  <a
                    key={cat.id}
                    href={categoryHref(cat)}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {content}
                  </a>
                )
              })}

              {filteredMobileList.length === 0 && (
                <p className="px-4 py-6 text-center text-black/40 text-[15px]">
                  Ничего не найдено
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Shared root-category list, used by the desktop sidebar. */
function RootCategoryList({
  rootCategories,
  activeRootId,
  onSelect,
  onHover,
}: {
  rootCategories: Category[]
  activeRootId: string | null
  onSelect: (id: string) => void
  onHover?: (id: string) => void
}) {
  return (
    <>
      {rootCategories.map((cat) => (
        <button
          key={cat.id}
          onMouseEnter={onHover ? () => onHover(cat.id) : undefined}
          onClick={() => onSelect(cat.id)}
          className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${
            activeRootId === cat.id ? "bg-gray-100" : "hover:bg-gray-50"
          }`}
        >
          <span className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-50 shrink-0">
            <img
              src={`${MEDIA_BASE}/public${cat.imageUrl}`}
              alt={cat.name}
              className="w-12 h-12 object-contain"
            />
          </span>
          <span className="flex-1 min-w-0 text-[16px] font-normal text-black/80 line-clamp-2">
            {cat.name}
          </span>
          <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />
        </button>
      ))}
    </>
  )
}

/**
 * Desktop-only: 2nd-level headers + their 3rd-level lists shown together in
 * multi-column layout (with "Ещё N" collapsing long lists). Mobile no longer
 * uses this — it drills down one level at a time instead.
 */
function SubcategoryColumns({
  secondLevel,
  childrenByParent,
  expandedGroups,
  onToggleGroup,
  categoryHref,
  onNavigate,
}: {
  secondLevel: Category[]
  childrenByParent: Map<string, Category[]>
  expandedGroups: Record<string, boolean>
  onToggleGroup: (id: string) => void
  categoryHref: (cat: Category) => string
  onNavigate: () => void
}) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
      {secondLevel.map((group) => {
        const grandchildren = childrenByParent.get(group.id) ?? []
        const expanded = expandedGroups[group.id]
        const visibleChildren = expanded
          ? grandchildren
          : grandchildren.slice(0, COLLAPSED_COUNT)
        const hiddenCount = grandchildren.length - visibleChildren.length

        return (
          <div key={group.id} className="break-inside-avoid mb-7">
            <a
              href={categoryHref(group)}
              onClick={onNavigate}
              className="flex items-center gap-1 font-normal text-[17px] text-black/85 hover:text-primary mb-2"
            >
              {group.name}
              {grandchildren.length > 0 && <ChevronRight className="w-4 h-4" />}
            </a>

            {grandchildren.length > 0 && (
              <ul className="space-y-2">
                {visibleChildren.map((sub) => (
                  <li key={sub.id}>
                    <a
                      href={categoryHref(sub)}
                      onClick={onNavigate}
                      className="text-[16px] text-black/60 hover:text-primary hover:underline"
                    >
                      {sub.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {hiddenCount > 0 && (
              <button
                onClick={() => onToggleGroup(group.id)}
                className="flex items-center gap-1 text-[15px] text-primary mt-2 cursor-pointer"
              >
                Ещё {hiddenCount}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Shimmer placeholder shown while the flat category list is loading. */
function MegaMenuSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded mb-5" />
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="break-inside-avoid mb-7">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="space-y-2.5">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-3 w-28 bg-gray-100 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}