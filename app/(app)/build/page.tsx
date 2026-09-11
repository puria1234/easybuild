import { Suspense } from "react";
import { BuilderWorkspace } from "@/components/builder/workspace";

export const metadata = {
  title: "Build with AI | EasyBuild.",
};

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="flex flex-1" />}>
      <BuilderWorkspace />
    </Suspense>
  );
}
