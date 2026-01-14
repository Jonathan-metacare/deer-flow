// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import { useMemo } from "react";

import { useStore } from "~/core/store";
import { cn } from "~/lib/utils";

import { GoogleMapBackground } from "~/components/google-map-background";
import { MessagesBlock } from "./components/messages-block";
import { ResearchBlock } from "./components/research-block";

export default function Main() {
  const openResearchId = useStore((state) => state.openResearchId);
  const doubleColumnMode = useMemo(
    () => openResearchId !== null,
    [openResearchId],
  );
  return (
    <div
      className={cn(
        "relative flex h-full w-full justify-end px-4 pt-12 pb-4",
        doubleColumnMode && "gap-8",
      )}
    >
      <GoogleMapBackground />
      <ResearchBlock
        className={cn(
          "relative z-10 w-[min(max(calc((100vw-538px)*0.75),575px),960px)] pb-4 transition-all duration-300 ease-out",
          !doubleColumnMode && "scale-0",
          doubleColumnMode && "",
        )}
        researchId={openResearchId}
      />
      <MessagesBlock className="z-[100]" />

    </div>
  );
}
