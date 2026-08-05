"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { api } from "@/helpers/api"
import { Category } from "@/types/category"
import { localized } from "@/lib/localized"
import { useLocaleRegion } from "@/hooks/useLocaleRegion"

interface Props {
  rootCategories: Category[]
  onSelect: (category: Category) => void
  onClose: () => void
}

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
  "https://169-58-13-208.nip.io"

const COLLAPSED_COUNT = 5

export default function CategorySelectMenu({ rootCategories, onSelect, onClose }: Props) {
  const { locale } = useLocaleRegion()
  const t = useTranslations("categoryMenu")

  const [allCategories, setAllCategories] = useState<Category[] | null>(null)
  const [activeRootId, setActiveRootId] = useState<string | null>(
    rootCategories[0]?.id ?? null,
  )
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [mobileStack, setMobileStack] = useState<Category[]>([])
  const [mobileQuery, setMobileQuery] = useState("")

  const categoriesLoaded = allCategories !== null

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

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

  const hasChildren = (id: string) => (childrenByParent.get(id) ?? []).length > 0

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

  const choose = (cat: Category) => {
    onSelect(cat)
    onClose()
  }

  const handleRootClick = (cat: Category) => {
    if (hasChildren(cat.id)) {
      setActiveRootId(cat.id)
    } else {
      choose(cat)
    }
  }

  const mobileParent = mobileStack[mobileStack.length - 1] ?? null
  const mobileList = mobileParent
    ? childrenByParent.get(mobileParent.id) ?? []
    : rootCategories
  const filteredMobileList = mobileQuery.trim()
    ? mobileList.filter((c) =>
        localized(c, locale).toLowerCase().includes(mobileQuery.trim().toLowerCase()),
      )
    : mobileList

  const mobileRootPending = !mobileParent && !categoriesLoaded

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center md:pt-20 md:px-4">
      <div
        className="hidden md:block absolute inset-0 bg-black/40 cursor-pointer"
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
          {rootCategories.map((cat) => {
            const name = localized(cat, locale)
            return (
              <button
                key={cat.id}
                onMouseEnter={() => hasChildren(cat.id) && setActiveRootId(cat.id)}
                onClick={() => handleRootClick(cat)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${
                  activeRootId === cat.id ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-50 shrink-0">
                  <img
                    src={`${MEDIA_BASE}/public${cat.imageUrl}`}
                    alt={name}
                    className="w-12 h-12 object-contain"
                  />
                </span>
                <span className="flex-1 min-w-0 text-[16px] font-normal text-black/80 line-clamp-2">
                  {name}
                </span>
                <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!allCategories ? (
            <MenuSkeleton />
          ) : (
            <>
              {activeRoot && !hasChildren(activeRoot.id) ? (
                <button
                  onClick={() => choose(activeRoot)}
                  className="flex items-center gap-1.5 text-2xl font-medium leading-none mb-5 cursor-pointer hover:text-primary transition-colors"
                >
                  {localized(activeRoot, locale)}
                </button>
              ) : (
                <h3 className="text-2xl font-medium leading-none mb-5 text-black/85">
                  {activeRoot ? localized(activeRoot, locale) : ""}
                </h3>
              )}

              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                {secondLevel.map((group) => {
                  const grandchildren = childrenByParent.get(group.id) ?? []
                  const groupIsLeaf = grandchildren.length === 0
                  const expanded = expandedGroups[group.id]
                  const visibleChildren = expanded
                    ? grandchildren
                    : grandchildren.slice(0, COLLAPSED_COUNT)
                  const hiddenCount = grandchildren.length - visibleChildren.length
                  const groupName = localized(group, locale)

                  return (
                    <div key={group.id} className="break-inside-avoid mb-7">
                      {groupIsLeaf ? (
                        <button
                          onClick={() => choose(group)}
                          className="flex items-center gap-1 font-normal text-[17px] text-black/85 hover:text-primary mb-2 cursor-pointer"
                        >
                          {groupName}
                        </button>
                      ) : (
                        <div className="font-normal text-[17px] text-black/85 mb-2">
                          {groupName}
                        </div>
                      )}

                      {grandchildren.length > 0 && (
                        <ul className="space-y-2">
                          {visibleChildren.map((sub) => (
                            <li key={sub.id}>
                              <button
                                onClick={() => choose(sub)}
                                className="text-[16px] text-black/60 hover:text-primary hover:underline cursor-pointer text-left"
                              >
                                {localized(sub, locale)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {hiddenCount > 0 && (
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="flex items-center gap-1 text-[15px] text-primary mt-2 cursor-pointer"
                        >
                          {t("showMore", { count: hiddenCount })}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
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
            {mobileParent ? localized(mobileParent, locale) : t("selectCategory")}
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
              placeholder={t("search")}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2.5 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {!allCategories && mobileParent ? (
            <div className="px-4">
              <MenuSkeleton />
            </div>
          ) : (
            <>
              {filteredMobileList.map((cat) => {
                const catHasChildren = hasChildren(cat.id)
                const showIcon = mobileStack.length === 0
                const name = localized(cat, locale)

                const content = (
                  <>
                    {showIcon && (
                      <span className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-50 shrink-0">
                        <img
                          src={`${MEDIA_BASE}/public${cat.imageUrl}`}
                          alt={name}
                          className="w-12 h-12 object-contain"
                        />
                      </span>
                    )}
                    <span className="flex-1 min-w-0 text-[16px] font-normal text-black/80 line-clamp-2">
                      {name}
                    </span>
                    {catHasChildren && (
                      <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />
                    )}
                  </>
                )

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (mobileRootPending) return
                      catHasChildren ? pushMobile(cat) : choose(cat)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      mobileRootPending
                        ? "opacity-40 pointer-events-none"
                        : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    {content}
                  </button>
                )
              })}

              {filteredMobileList.length === 0 && (
                <p className="px-4 py-6 text-center text-black/40 text-[15px]">
                  {t("noResults")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuSkeleton() {
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