"use client";

import { ImageUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

interface Props {
  previewImages: string[];
  setPreviewImages: Dispatch<SetStateAction<string[]>>;
  uploadedFiles: File[];
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
}

const LIGHTBOX_Z_INDEX = 2147483647;

function ImagePreviewLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  index: number | null;
  onIndexChange: (updater: (i: number) => number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("createProduct");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (index === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onIndexChange((i) => (i - 1 + images.length) % images.length);
      else if (e.key === "ArrowRight") onIndexChange((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, images.length, onIndexChange, onClose]);

  if (index === null || !mounted) return null;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((i) => (i - 1 + images.length) % images.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((i) => (i + 1) % images.length);
  };

  const overlay = (
    <div
      className="fixed inset-0 bg-black/90 flex flex-col"
      style={{ zIndex: LIGHTBOX_Z_INDEX }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/80 text-sm font-medium">
          {t("photoOf", { index: index + 1, total: images.length })}
        </span>
        <button
          onClick={onClose}
          className="text-white hover:opacity-70 transition cursor-pointer p-1"
          aria-label={t("close")}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-6">
        <img
          src={images[index]}
          alt="preview"
          className="max-w-full max-h-full object-contain rounded-xl cursor-default"
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              aria-label={t("prevPhoto")}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              aria-label={t("nextPhoto")}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default function ImageUploader({
  previewImages,
  setPreviewImages,
  uploadedFiles,
  setUploadedFiles,
}: Props) {
  const t = useTranslations("createProduct");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFiles = (files: FileList) => {
    const maxImages = 4;
    const available = maxImages - previewImages.length;

    const selected = Array.from(files).slice(0, available);

    selected.forEach((file) => {
      setUploadedFiles((prev) => [...prev, file]);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setPreviewImages(previewImages.filter((_, i) => i !== index));
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-9">
      <h2 className="text-lg sm:text-2xl font-bold mb-4 text-gray-700">
        {t("photosTitle")}
      </h2>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileChange}
      />

      {previewImages.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg px-6 py-10 text-center cursor-pointer"
          onClick={triggerFileInput}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
        <button className="cursor-pointer bg-primary text-white px-4 font-semibold py-2 sm:py-2.5 text-sm sm:text-base rounded-xl">
  {t("choosePhotos")}
</button>

<p className="text-base sm:text-lg font-semibold mt-2 text-gray-600">
  {t("orDragHere")}
  <br />
  {t("fileHint")}
</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewImages.map((img, i) => (
            <div
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-zoom-in"
            >
              <img
                src={img}
                alt="preview"
                className="w-full h-full object-cover"
              />

              <button
                onClick={(e) => removeImage(e, i)}
                className="absolute top-2 cursor-pointer right-2 bg-white rounded-full p-1 opacity-80 hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {previewImages.length < 4 && (
            <div
              className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer"
              onClick={triggerFileInput}
            >
              <ImageUp className="w-7 h-7 text-black/70" />
            </div>
          )}
        </div>
      )}

      <ImagePreviewLightbox
        images={previewImages}
        index={lightboxIndex}
        onIndexChange={(updater) => setLightboxIndex((i) => (i === null ? i : updater(i)))}
        onClose={() => setLightboxIndex(null)}
      />
    </section>
  );
}