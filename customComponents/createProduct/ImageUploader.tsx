"use client";

import { ImageUp, X } from "lucide-react";
import { Dispatch, SetStateAction, useRef } from "react";

interface Props {
  previewImages: string[];
  setPreviewImages: Dispatch<SetStateAction<string[]>>;
  uploadedFiles: File[];
  setUploadedFiles: Dispatch<SetStateAction<File[]>>;
}

export default function ImageUploader({
  previewImages,
  setPreviewImages,
  uploadedFiles,
  setUploadedFiles,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const removeImage = (index: number) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index));
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <section className="bg-gray-50 rounded-xl p-9">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">
        Фотографии (от 1 до 4)
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
          <button className="bg-primary text-white px-4 font-semibold py-2.5 rounded-xl">
            Выберите фото
          </button>

          <p className="text-lg font-semibold mt-2 text-gray-600">
            или перетащите их сюда
            <br />
            (JPG, PNG, WEBP до 5 МБ)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewImages.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group"
            >
              <img
                src={img}
                alt="preview"
                className="w-full h-full object-cover"
              />

              <button
                onClick={() => removeImage(i)}
                className="absolute top-2 cursor-pointer right-2 bg-white rounded-full p-1 opacity-80 hover:opacity-100"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
          ))}

          {previewImages.length < 4 && (
            <div
              className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer"
              onClick={triggerFileInput}
            >
              <ImageUp className="w-7 h-7 text-black/70"/>
            </div>
          )}
        </div>
      )}
    </section>
  );
}