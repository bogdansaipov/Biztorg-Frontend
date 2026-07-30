"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/helpers/api"
import { Category } from "@/types/category"
import CategoriesMegaMenu from "@/customComponents/category/CategoriesMegaMenu"

interface CategoriesMenuContextValue {
  rootCategories: Category[]
  open: () => void
  close: () => void
}

const CategoriesMenuContext = createContext<CategoriesMenuContextValue | null>(null)

export function CategoriesMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [rootCategories, setRootCategories] = useState<Category[]>([])

  // Fetched once, on mount, so the "Каталог" button works from any page —
  // not just the home page, which already has its own server-fetched copy
  // for rendering the pills themselves.
  useEffect(() => {
    api.get("/categories/root").then((res) => setRootCategories(res.data.data))
  }, [])

  return (
    <CategoriesMenuContext.Provider
      value={{
        rootCategories,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
      {isOpen && rootCategories.length > 0 && (
        <CategoriesMegaMenu
          rootCategories={rootCategories}
          onClose={() => setIsOpen(false)}
        />
      )}
    </CategoriesMenuContext.Provider>
  )
}

export function useCategoriesMenu() {
  const ctx = useContext(CategoriesMenuContext)
  if (!ctx) {
    throw new Error("useCategoriesMenu must be used within CategoriesMenuProvider")
  }
  return ctx
}