"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SzsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subPath = searchParams.get("path") || "";
  const iframeSrc = `https://pmm-servicos-src.vercel.app${subPath}`;

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
        const newUrl = `/product-marketing/szs/pmm${qs ? `?${qs}` : ""}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
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
  );
}

export default function PmmSzsPage() {
  return (
    <Suspense>
      <SzsInner />
    </Suspense>
  );
}
