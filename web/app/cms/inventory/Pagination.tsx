import { useEvent } from "@/components/util/event-emiter";
import { useEffect } from "react";

const PAGE_SIZE = 10;
const SIZE_PAGE_CHUNK = 5;

export function Pagination(props: {
  totalItems: number;
  pageIndex: number;
  onChange: (pageIndex: number) => void;
}) {
  const [chunk, setChunk] = useEvent<number>(0);

  const totalPages = Math.ceil(props.totalItems / PAGE_SIZE);
  const totalChunks = Math.ceil(totalPages / SIZE_PAGE_CHUNK);
  const startIndex = chunk * SIZE_PAGE_CHUNK;
  const endIndex = Math.min(startIndex + SIZE_PAGE_CHUNK, totalPages);

  const canGoPrev = chunk > 0;
  const canGoNext = chunk < totalChunks - 1;

  useEffect(() => setChunk(0), [totalChunks])

  const handleChunkPrev = () => {
    if (canGoPrev) {
      const newChunk = chunk - 1;
      setChunk(newChunk);
      props.onChange(newChunk * SIZE_PAGE_CHUNK); // cambia a la primera página del nuevo chunk
    }
  };

  const handleChunkNext = () => {
    if (canGoNext) {
      const newChunk = chunk + 1;
      setChunk(newChunk);
      props.onChange(newChunk * SIZE_PAGE_CHUNK);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 space-x-1">
      <button
        onClick={handleChunkPrev}
        disabled={!canGoPrev}
        className="flex size-10 items-center justify-center disabled:opacity-30"
      >
        <CaretLeftIcon />
      </button>

      {Array.from({ length: endIndex - startIndex }, (_, itemIndex) => {
        const pageIndex = startIndex + itemIndex;
        return (
          <a
            key={pageIndex}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              props.onChange(pageIndex)
            }}
            className={`text-sm font-normal leading-normal flex size-10 items-center justify-center rounded-full text-[#101518] ${pageIndex === props.pageIndex ? "bg-[#eaedf1]" : ""
              }`}
          >
            {pageIndex + 1}
          </a>
        );
      })}

      <button
        onClick={handleChunkNext}
        disabled={!canGoNext}
        className="flex size-10 items-center justify-center disabled:opacity-30"
      >
        <CaretRightIcon />
      </button>
    </div>
  );
}

function CaretLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18px"
      height="18px"
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
    </svg>
  );
}

function CaretRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18px"
      height="18px"
      fill="currentColor"
      viewBox="0 0 256 256"
    >
      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
    </svg>
  );
}