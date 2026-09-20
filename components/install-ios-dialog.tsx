"use client";

import { Share, SquarePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InstallIosDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bits &amp; Bobs to your home screen</DialogTitle>
          <DialogDescription>
            iPhone and iPad only allow this from the Share menu, so it takes two taps.
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-[15px] font-semibold">
          <li className="flex items-center gap-3">
            <Share aria-hidden className="size-5 shrink-0" />
            <span>
              Tap <strong className="font-extrabold">Share</strong> in the browser toolbar.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <SquarePlus aria-hidden className="size-5 shrink-0" />
            <span>
              Scroll down and tap <strong className="font-extrabold">Add to Home Screen</strong>.
            </span>
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">
          No Share button? You are probably inside another app&apos;s browser. Open this page in
          Safari first.
        </p>
      </DialogContent>
    </Dialog>
  );
}
