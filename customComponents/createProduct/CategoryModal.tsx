"use client";

import { ChevronRight, X, ArrowLeft } from "lucide-react";
import { Category } from "@/types/category";

interface Props {
  open: boolean;
  categories: Category[];
  path: Category[];
  setPath: (v: Category[]) => void;
  onSelect: (cat: Category) => void;
  onClose: () => void;
}

export default function CategoryModal({
  open,
  categories,
  path,
  setPath,
  onSelect,
  onClose,
}: Props) {
  if (!open) return null;

  const parentId = path.length ? path[path.length - 1].id : null;
  const items = categories.filter((c) => c.parentId === parentId);

  const hasChildren = (id: string) =>
    categories.some((c) => c.parentId === id);

  const handleClick = (cat: Category) => {
    if (hasChildren(cat.id)) {
      setPath([...path, cat]);
    } else {
      onSelect(cat);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-[420px] p-6 z-10">

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {path.length > 0 && (
              <button
                onClick={() => setPath(path.slice(0, -1))}
                className="cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {path.length ? path[path.length - 1].name : "Выберите категорию"}
            </h2>
          </div>

          <button onClick={onClose} className="cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {items.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleClick(cat)}
              className="w-full cursor-pointer flex justify-between items-center p-3 bg-gray-100 rounded-lg text-left text-lg font-medium text-gray-700 hover:bg-gray-200"
            >
              <span>{cat.name}</span>
              {hasChildren(cat.id) && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
