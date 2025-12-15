import { useEffect, useMemo, useState } from "react";
import {
    FaPlay,
    FaFilePdf,
    FaFileWord,
    FaFileArchive,
    FaFileAlt,
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";

const getDocIcon = (mime = "") => {
    if (mime.includes("pdf")) return FaFilePdf;
    if (mime.includes("word")) return FaFileWord;
    if (mime.includes("zip") || mime.includes("rar")) return FaFileArchive;
    return FaFileAlt;
};

function MediaGrid({ media = [] }) {
    const items = useMemo(
        () => media.filter(m => m?.url),
        [media]
    );

    const imagesOnly = items.filter(m => m.mime?.startsWith("image"));
    const [openIdx, setOpenIdx] = useState(-1);
    const openItem = openIdx >= 0 ? items[openIdx] : null;

    // Keyboard navigation (unchanged)
    useEffect(() => {
        if (openIdx < 0) return;
        const onKey = (e) => {
            if (e.key === "Escape") setOpenIdx(-1);
            if (e.key === "ArrowLeft")
                setOpenIdx(i => (i - 1 + items.length) % items.length);
            if (e.key === "ArrowRight")
                setOpenIdx(i => (i + 1) % items.length);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [openIdx, items.length]);

    // SINGLE MEDIA (exact behavior)
    if (items.length === 1 && items[0].mime?.startsWith("image")) {
        return (
            <div className="mt-2">
                <img
                    src={items[0].url}
                    alt=""
                    onClick={() => setOpenIdx(0)}
                    className="w-full max-h-[520px] object-cover rounded-[14px] border border-gray-300 cursor-zoom-in"
                />

                {openItem && renderLightbox(openItem, items, setOpenIdx)}
            </div>
        );
    }

    return (
        <>
            {/* MEDIA GRID */}
            <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[10px]">
                {items.map((m, idx) => {
                    // IMAGE
                    if (m.mime?.startsWith("image")) {
                        return (
                            <img
                                key={m.id}
                                src={m.url}
                                alt=""
                                onClick={() => setOpenIdx(idx)}
                                className="w-full h-auto rounded-[12px] border border-gray-300 cursor-zoom-in"
                            />
                        );
                    }

                    // VIDEO (same size behavior as image)
                    if (m.mime?.startsWith("video")) {
                        return (
                            <div
                                key={m.id}
                                onClick={() => setOpenIdx(idx)}
                                className="relative cursor-pointer"
                            >
                                <video
                                    src={m.url}
                                    muted
                                    className="w-full h-auto rounded-[12px] border border-gray-300"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-[12px]">
                                    <FaPlay className="text-white text-3xl" />
                                </div>
                            </div>
                        );
                    }

                    // DOCUMENT (kept same width rule)
                    const Icon = getDocIcon(m.mime);
                    return (
                        <a
                            key={m.id}
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 rounded-[12px] border border-gray-300 p-3 hover:bg-gray-50"
                        >
                            <Icon className="text-xl text-gray-600" />
                            <span className="truncate text-sm">
                                {m.name || m.kind || "Document"}
                            </span>
                        </a>
                    );
                })}
            </div>

            {openItem && renderLightbox(openItem, items, setOpenIdx)}
        </>
    );
}

/* Lightbox kept neutral – does not affect grid sizing */
function renderLightbox(openItem, items, setOpenIdx) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setOpenIdx(-1)}
        >
            <button className="absolute top-4 right-4 text-white text-xl">
                <FaTimes />
            </button>

            <div
                className="max-w-[90vw] max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {openItem.mime?.startsWith("image") && (
                    <img
                        src={openItem.url}
                        alt=""
                        className="max-h-[80vh] rounded-xl"
                    />
                )}

                {openItem.mime?.startsWith("video") && (
                    <video
                        src={openItem.url}
                        controls
                        autoPlay
                        className="max-h-[80vh] rounded-xl"
                    />
                )}

                {items.length > 1 && (
                    <div className="mt-3 flex justify-between text-white">
                        <button
                            onClick={() =>
                                setOpenIdx(i => (i - 1 + items.length) % items.length)
                            }
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            onClick={() =>
                                setOpenIdx(i => (i + 1) % items.length)
                            }
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MediaGrid;
