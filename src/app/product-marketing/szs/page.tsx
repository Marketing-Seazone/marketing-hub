"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { T } from "@/lib/constants";

function SzsInner() {
  const searchParams = useSearchParams();
  const subPath = searchParams.get("path") || "";
  const iframeSrc = `https://seazone-pmm-servicos.vercel.app${subPath}`;
  const isPitchPage = /\/pitch([-\w]*)$/.test(subPath);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "szs-navigate" && typeof event.data.path === "string") {
        const path = event.data.path as string;
        const params = new URLSearchParams(window.location.search);
        if (path === "/" || path === "") {
          params.delete("path");
        } else {
          params.set("path", path);
        }
        const qs = params.toString();
        const newUrl = `/product-marketing/szs${qs ? `?${qs}` : ""}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function handleEdit() {
    const iframe = document.querySelector("iframe");
    iframe?.contentWindow?.postMessage(
      { type: "szs-edit" },
      "https://seazone-pmm-servicos.vercel.app"
    );
  }

  function handleDownload() {
    const url = new URL(iframeSrc);
    url.searchParams.set("autoprint", "1");
    window.open(url.toString(), "_blank");
  }

  return (
    <>
      {isPitchPage && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={handleEdit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.font,
              background: T.card,
              color: T.mutedFg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              boxShadow: T.elevSm,
            }}
          >
            <Pencil size={12} />
            Editar
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.font,
              background: T.primary,
              color: T.primaryFg,
              border: "none",
              borderRadius: 6,
              boxShadow: T.elevSm,
            }}
          >
            <Download size={12} />
            Baixar PDF
          </button>
        </div>
      )}
      <iframe
        src={iframeSrc}
        title="PMM SZS"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          border: "none",
          display: "block",
        }}
        allow="clipboard-write"
      />
    </>
  );
}

export default function PmmSzsPage() {
  return (
    <Suspense>
      <SzsInner />
    </Suspense>
  );
}
