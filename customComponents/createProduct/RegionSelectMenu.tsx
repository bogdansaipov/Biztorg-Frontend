"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { Region } from "@/types/region/region"

interface Props {
  regions: Region[] // full flat list (all viloyats + districts)
  onSelect: (region: Region) => void
  onClose: () => void
}

// Same drill-down pattern as CategorySelectMenu, including the leaf-only
// selection rule: a viloyat with districts under it is navigation-only —
// clicking it drills into its districts rather than selecting the
// viloyat itself. Only an actual leaf (a viloyat with no districts, or a
// district itself) can be picked.
export default function RegionSelectMenu({ regions, onSelect, onClose }: Props) {
  const roots = useMemo(
    () => regions.filter((r) => !(r as unknown as { parentId?: string }).parentId),
    [regions],
  )

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Region[]>()
    for (const r of regions) {
      const parentId = (r as unknown as { parentId?: string }).parentId
      if (!parentId) continue
      const list = map.get(parentId) ?? []
      list.push(r)
      map.set(parentId, list)
    }
    return map
  }, [regions])

  const hasChildren = (id: string) => (childrenByParent.get(id) ?? []).length > 0

  const [activeRootId, setActiveRootId] = useState<string | null>(roots[0]?.id ?? null)
  const [mobileStack, setMobileStack] = useState<Region[]>([])
  const [mobileQuery, setMobileQuery] = useState("")

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

  const activeRoot = roots.find((r) => r.id === activeRootId)
  const districts = activeRootId ? childrenByParent.get(activeRootId) ?? [] : []

  const choose = (region: Region) => {
    onSelect(region)
    onClose()
  }

  const handleRootClick = (region: Region) => {
    if (hasChildren(region.id)) {
      setActiveRootId(region.id)
    } else {
      choose(region)
    }
  }

  const pushMobile = (region: Region) => {
    setMobileStack((prev) => [...prev, region])
    setMobileQuery("")
  }
  const popMobile = () => {
    setMobileStack((prev) => prev.slice(0, -1))
    setMobileQuery("")
  }

  const mobileParent = mobileStack[mobileStack.length - 1] ?? null
  const mobileList = mobileParent ? childrenByParent.get(mobileParent.id) ?? [] : roots
  const filteredMobileList = mobileQuery.trim()
    ? mobileList.filter((r) => r.name.toLowerCase().includes(mobileQuery.trim().toLowerCase()))
    : mobileList

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center md:pt-20 md:px-4">
      <div className="hidden md:block absolute inset-0 bg-black/40 cursor-pointer" onClick={onClose} />

      {/* ---------- Desktop / tablet: side-by-side panes (viloyat -> district) ---------- */}
      <div className="hidden md:flex relative bg-white rounded-2xl w-full max-w-4xl max-h-[75vh] overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto py-3">
          {roots.map((region) => (
            <button
              key={region.id}
              onMouseEnter={() => hasChildren(region.id) && setActiveRootId(region.id)}
              onClick={() => handleRootClick(region)}
              className={`w-full flex items-center justify-between gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${
                activeRootId === region.id ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <span className="flex-1 min-w-0 text-[16px] font-normal text-black/80 line-clamp-2">
                {region.name}
              </span>
              <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Same rule as CategorySelectMenu: the active viloyat's name is
              only clickable/selectable when it has no districts of its own. */}
          {activeRoot && districts.length === 0 ? (
            <button
              onClick={() => choose(activeRoot)}
              className="flex items-center gap-1.5 text-2xl font-medium leading-none mb-5 cursor-pointer hover:text-primary transition-colors"
            >
              {activeRoot.name}
            </button>
          ) : (
            <h3 className="text-2xl font-medium leading-none mb-5 text-black/85">
              {activeRoot?.name}
            </h3>
          )}

          {districts.length > 0 && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
              {districts.map((district) => (
                <button
                  key={district.id}
                  onClick={() => choose(district)}
                  className="block w-full text-left text-[16px] text-black/70 hover:text-primary hover:underline cursor-pointer mb-2 break-inside-avoid"
                >
                  {district.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Mobile: recursive drill-down, viloyat -> district ---------- */}
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
            {mobileParent ? mobileParent.name : "Выберите регион"}
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
          {/* No "select the current level itself" shortcut — intermediate
              levels (with children) are navigation-only, same as categories. */}
          {filteredMobileList.map((region) => {
            const regionHasChildren = hasChildren(region.id)
            return (
              <button
                key={region.id}
                onClick={() => (regionHasChildren ? pushMobile(region) : choose(region))}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="flex-1 min-w-0 text-[16px] font-normal text-black/80 line-clamp-2">
                  {region.name}
                </span>
                {regionHasChildren && <ChevronRight className="w-4 h-4 text-black/30 shrink-0" />}
              </button>
            )
          })}

          {filteredMobileList.length === 0 && (
            <p className="px-4 py-6 text-center text-black/40 text-[15px]">
              Ничего не найдено
            </p>
          )}
        </div>
      </div>
    </div>
  )
}