"use client";

import { X, ChevronRight, ArrowLeft } from "lucide-react";
import { Region } from "@/types/region/region";

interface Props {
  open: boolean;
  regions: Region[];
  path: Region[];
  setPath: (path: Region[]) => void;
  onSelect: (region: Region) => void;
  onClose: () => void;
}

export default function RegionModal({
  open,
  regions,
  path,
  setPath,
  onSelect,
  onClose,
}: Props) {
  if (!open) return null;

  const parent = path[path.length - 1] ?? null;

  const currentRegions = regions.filter(
    (r) => r.parentId === (parent?.id ?? null)
  );

  const hasChildren = (regionId: string) =>
    regions.some((r) => r.parentId === regionId);

  const handleClick = (region: Region) => {
    if (hasChildren(region.id)) {
      setPath([...path, region]);
    } else {
      onSelect(region);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 bg-black/30 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-6"
      >
 
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {path.length > 0 && (
              <button
                onClick={() => setPath(path.slice(0, -1))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <h2 className="text-xl font-semibold">
              {parent ? parent.name : "Выберите регион"}
            </h2>
          </div>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {currentRegions.map((region) => (
            <button
              key={region.id}
              onClick={() => handleClick(region)}
              className="
                w-full flex justify-between items-center
                p-3 rounded-lg text-left
                hover:bg-gray-100 transition
              "
            >
              <span className="text-lg">{region.name}</span>

              {hasChildren(region.id) && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}