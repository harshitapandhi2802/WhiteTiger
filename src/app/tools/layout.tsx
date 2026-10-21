import type { Metadata } from "next";
import { ToolsShell } from "@/components/tools/ToolsShell";
import "./tools.css";

export const metadata: Metadata = {
  title: "Tools — White Tiger",
  description: "Option chain, strategy builder, options calculator, paper portfolio and charges calculator.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <ToolsShell>{children}</ToolsShell>;
}
