import { useEffect, useState } from "react";
import {
    FaFileAlt,
    FaFileArchive,
    FaFilePdf,
    FaFileWord,
    FaPlay,
} from "react-icons/fa";

function getDocIcon(mime = "") {
  if (mime.includes("pdf")) return FaFilePdf;
  if (mime.includes("word")) return FaFileWord;
  if (mime.includes("zip") || mime.includes("rar")) return FaFileArchive;
  return FaFileAlt;
}

function MsgMedia({ media }) {
  const items = media || [];
  const previews = items.filter(
    m =>
      (m.mime || "").startsWith("image") ||
      (m.mime || "").startsWith("video")
  );
  const docs = items.filter(
    m =>
      !(m.mime || "").startsWith("image") &&
      !(m.mime || "").startsWith("video")
  );

  const [openIdx, setOpenIdx] = useState(-1);
  const openItem = openIdx >= 0 ? previews[openIdx] : null;

  // keyboard navigation (unchanged behavior)
  useEffect(() => {
    function onKey(e) {
      if (openIdx < 0) return;
      if (e.key === "Escape") setOpenIdx(-1);
      else if (e.key === "ArrowLeft")
        setOpenIdx(i => (i - 1 + previews.length) % previews.length);
      else if (e.key === "ArrowRight")
        setOpenIdx(i => (i + 1) % previews.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, previews.length]);

  if (!items.length) return null;

  return (
    <>
      {/* PREVIEW GRID (same size & spacing) */}
      <div
        style={{
          marginTop: 6,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
          gap: 8,
        }}
      >
        {previews.map((m, i) => (
          <div
            key={i}
            onClick={() => setOpenIdx(i)}
            style={{
            //   width: 96,
              height: 96,
              border: "1px solid #eee",
              borderRadius: 8,
              overflow: "hidden",
              background: "#fafafa",
              cursor: "zoom-in",
              position: "relative",
            }}
          >
            {m.mime.startsWith("image") && (
              <img
                src={m.url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}

            {m.mime.startsWith("video") && (
              <>
                <video
                  src={m.url}
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FaPlay />
                </div>
              </>
            )}
          </div>
        ))}

        {/* DOCUMENT CHIPS (same behavior, better icon) */}
        {docs.map((m, i) => {
          const Icon = getDocIcon(m.mime || "");
          return (
            <a
              key={"doc" + i}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="preview-chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
              }}
            >
              <Icon />
              <span>{m.kind || m.mime || "file"}</span> ↗
            </a>
          );
        })}
      </div>

      {/* LIGHTBOX */}
      {openItem && (
        <div className="lightbox-backdrop" onClick={() => setOpenIdx(-1)}>
          <button
            className="lightbox-close"
            onClick={() => setOpenIdx(-1)}
          >
            Close ✕
          </button>

          <div
            className="lightbox-content"
            onClick={e => e.stopPropagation()}
          >
            {openItem.mime.startsWith("image") && (
              <img src={openItem.url} alt="" />
            )}

            {openItem.mime.startsWith("video") && (
              <video src={openItem.url} controls autoPlay />
            )}

            {previews.length > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setOpenIdx(
                      i => (i - 1 + previews.length) % previews.length
                    );
                  }}
                >
                  ◀ Prev
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setOpenIdx(
                      i => (i + 1) % previews.length
                    );
                  }}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default MsgMedia;
