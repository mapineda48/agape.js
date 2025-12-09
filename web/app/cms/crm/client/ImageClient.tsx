import { useSelector } from "@/components/form/hooks";
import Input from "@/components/form/Input";
import Image from "@/components/util/image";
import type { UpsertClientPayload } from "@agape/crm/client";

export default function ImageClient() {
  const photo = useSelector((state: UpsertClientPayload) => state.photo);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {photo ? (
          <Image
            src={photo}
            alt="Vista previa"
            className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-xl"
          />
        ) : (
          <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white shadow-xl">
            <span className="text-white font-bold text-4xl">
              {photo === null ? "?" : "VP"}
            </span>
          </div>
        )}
        {!photo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="h-16 w-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Input.File
          path="photo"
          accept="image/*"
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-xl text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all"
        >
          <svg
            className="mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          Seleccionar Foto
        </label>
      </div>
    </div>
  );
}
