"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BeginnerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/analyze");
  }, [router]);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0e1a", color: "#fff" }}>
      <p>Redirecting...</p>
    </div>
  );
}
