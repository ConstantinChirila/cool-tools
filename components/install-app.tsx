"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { promptInstall, useInstallMode } from "@/hooks/use-install-app";

// Only iOS visitors who tap the button ever need the dialog.
const InstallIosDialog = dynamic(() => import("@/components/install-ios-dialog"), { ssr: false });

/** Quiet footer entry: native prompt on Chromium, Share sheet steps on iOS, nothing elsewhere. */
export function InstallApp() {
  const mode = useInstallMode();
  const [iosOpen, setIosOpen] = React.useState(false);
  const [iosEverOpened, setIosEverOpened] = React.useState(false);

  if (mode === "none") return null;

  const onClick = () => {
    if (mode === "prompt") {
      void promptInstall();
      return;
    }
    setIosEverOpened(true);
    setIosOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="sticker-sm flex h-11 w-fit items-center gap-2 rounded-full bg-yellow px-4 text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <Download aria-hidden className="size-4" />
        {mode === "prompt" ? "Install app" : "Add to home screen"}
      </button>
      {iosEverOpened && <InstallIosDialog open={iosOpen} onOpenChange={setIosOpen} />}
    </>
  );
}
