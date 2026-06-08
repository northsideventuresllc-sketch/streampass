"use client";

import Link from "next/link";
import { StreamPassLogo } from "./streampass-logo";
import { NorthsideFooter } from "./northside-footer";
import { FeatureRotator } from "./feature-rotator";
import { ImmersiveWarp } from "./immersive-warp";
import { HOME_SLOGAN } from "@/lib/constants";

export function HomeHero() {
  return (
    <>
      <ImmersiveWarp />
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.32em] text-muted/80">
          Northside Intelligence
        </p>

        <StreamPassLogo size="hero" interactive immersive />

        <p className="font-display mx-auto mt-10 max-w-lg text-xl font-medium leading-snug tracking-wide text-foreground/95 md:text-2xl">
          {HOME_SLOGAN}
        </p>

        <FeatureRotator />

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/signup" className="btn-primary px-10 py-3.5">
            Get started
          </Link>
          <Link href="/login" className="btn-secondary px-10 py-3.5">
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
}

export function HomeFooter() {
  return (
    <div className="absolute bottom-8 z-10 w-full px-4">
      <NorthsideFooter />
    </div>
  );
}
