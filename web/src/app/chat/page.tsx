// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import dynamic from "next/dynamic";

import { Logo } from "../../components/deer-flow/logo";
import { ThemeToggle } from "../../components/deer-flow/theme-toggle";

const Main = dynamic(() => import("./main"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      Loading...
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="flex h-screen w-screen justify-center overscroll-none">
      <header className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center rounded-full border bg-background/60 px-4 py-1.5 backdrop-blur-md transition-colors shadow-sm hover:bg-background/80">
          <Logo />
        </div>
        <div className="pointer-events-auto flex items-center rounded-full border bg-background/60 p-1.5 backdrop-blur-md transition-colors shadow-sm hover:bg-background/80">
          <ThemeToggle />
        </div>
      </header>
      <Main />
    </div>
  );
}
