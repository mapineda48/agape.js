import { useInput } from "@/components/form";
import { useState } from "react";

const path = "images";

export default function InputImages() {
  const [images, setState] = useInput<(string | File)[]>(path, []);

  const [currentImage, setCurrentImage] = useState(0);

  const prevImage = () => {
    setCurrentImage((i) => (i > 0 ? i - 1 : images.length - 1));
  };
  const nextImage = () => {
    setCurrentImage((i) => (i < images.length - 1 ? i + 1 : 0));
  };

  const current = images[currentImage];

  console.log(current);

  return (
    <>
      <input
        type="file"
        multiple
        accept="image/*"
        className="mt-1"
        onChange={({ currentTarget }) => {
          const filesArray = Array.from(currentTarget.files ?? []);

          if (!filesArray.length) {
            return;
          }

          setState((currents: File[]) => [...currents, ...filesArray]);
          setCurrentImage(images.length);
          currentTarget.value = "";
        }}
      />
      {current && (
        <div className="mt-4 relative">
          <img
            src={
              typeof current === "string"
                ? current
                : URL.createObjectURL(current)
            }
            alt="preview"
            className="w-full h-64 object-cover rounded"
          />
          <button
            type="button"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
