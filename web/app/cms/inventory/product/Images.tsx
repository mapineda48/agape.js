import Form from "@/components/form";
import { useState, useEffect } from "react";
import Image from "@/components/util/image";
const path = "images";

export default function InputImages() {
  const [images, setImages] = Form.useInput<(string | File)[]>(path, []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ensure currentIndex is valid when images change
  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(images.length - 1);
    }
  }, [images.length, currentIndex]);

  const currentImage = images[currentIndex];

  const handleRemove = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    if (currentIndex >= newImages.length) {
      setCurrentIndex(Math.max(0, newImages.length - 1));
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Preview Area */}
      <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
        {images.length > 0 ? (
          <>
            <Image
              src={currentImage}
              alt="Product preview"
              className="w-full h-full object-contain"
            />

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-start justify-end p-4">
              <button
                type="button"
                onClick={() => handleRemove(currentIndex)}
                className="bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600 p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                title="Eliminar imagen"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Counter Badge */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm font-medium">Sin imágenes</p>
          </div>
        )}
      </div>

      {/* Thumbnails & Upload Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {images.map((img: string | File, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx
                ? "border-indigo-500 ring-2 ring-indigo-200 ring-offset-1"
                : "border-transparent hover:border-gray-300"
              }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}

        {/* Upload Button */}
        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors group">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={({ currentTarget }) => {
              const filesArray = Array.from(currentTarget.files ?? []);
              if (!filesArray.length) return;

              const newImages = [...images, ...filesArray];
              setImages(newImages);
              setCurrentIndex(newImages.length - filesArray.length); // Focus first new image
              currentTarget.value = "";
            }}
          />
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full mb-1 group-hover:scale-110 transition-transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-700">
            Agregar
          </span>
        </label>
      </div>
    </div>
  );
}
