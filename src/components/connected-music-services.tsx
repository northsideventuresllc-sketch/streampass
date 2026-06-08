"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Music2, Check, Unplug, ExternalLink } from "lucide-react";
import { MUSIC_STREAMING_SERVICES } from "@/lib/constants";
import type { ConnectedAccount } from "@/lib/types";

interface ConnectedMusicServicesProps {
  initialAccounts: ConnectedAccount[];
  preferredPlatform: string | null;
  userId: string;
}

export function ConnectedMusicServices({
  initialAccounts,
  preferredPlatform: initialPreferred,
  userId,
}: ConnectedMusicServicesProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [preferredPlatform, setPreferredPlatform] = useState(
    initialPreferred ?? MUSIC_STREAMING_SERVICES[0]
  );
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`streampass_music_platform_${userId}`);
    if (
      stored &&
      (MUSIC_STREAMING_SERVICES as readonly string[]).includes(stored) &&
      stored !== preferredPlatform
    ) {
      void Promise.resolve().then(() => setPreferredPlatform(stored));
    }
  }, [userId, preferredPlatform]);

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    const res = await fetch("/api/music/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (res.ok) {
      setAccounts(accounts.filter((a) => a.platform !== platform));
    }
    setDisconnecting(null);
  }

  function handleSetPreferred(platform: string) {
    setPreferredPlatform(platform);
    localStorage.setItem(`streampass_music_platform_${userId}`, platform);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Your music platform</h3>
        <p className="text-sm text-muted">
          Connect your streaming service. Everyone in a jam listens on their own
          platform — we sync the queue, not the app.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MUSIC_STREAMING_SERVICES.map((platform) => {
          const account = accounts.find((a) => a.platform === platform);
          const isConnected = connectedPlatforms.has(platform);
          const isPreferred = preferredPlatform === platform;

          return (
            <div
              key={platform}
              className={`card flex flex-col gap-3 ${
                isPreferred ? "border-magenta/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Music2 className="h-5 w-5 text-magenta" />
                  <div>
                    <p className="font-medium">{platform}</p>
                    {account?.display_name && (
                      <p className="text-xs text-muted">
                        {account.display_name}
                      </p>
                    )}
                  </div>
                </div>
                {isConnected ? (
                  <span className="badge-accent flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Connected
                  </span>
                ) : isPreferred && platform === "Apple Music" ? (
                  <span className="badge-accent flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Selected
                  </span>
                ) : (
                  <span className="text-xs text-muted">Not connected</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {platform === "Spotify" && !isConnected && (
                  <a
                    href="/api/music/connect/spotify"
                    className="btn-primary inline-flex items-center gap-1.5 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Connect Spotify
                  </a>
                )}

                {platform === "Apple Music" && !isConnected && (
                  <button
                    type="button"
                    onClick={() => handleSetPreferred("Apple Music")}
                    className="btn-secondary inline-flex items-center gap-1.5 text-xs"
                  >
                    Use Apple Music
                  </button>
                )}

                {isConnected && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSetPreferred(platform)}
                      className={
                        isPreferred ? "btn-primary text-xs" : "btn-secondary text-xs"
                      }
                    >
                      {isPreferred ? "Active in jams" : "Set as default"}
                    </button>
                    {platform === "Spotify" && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(platform)}
                        disabled={disconnecting === platform}
                        className="btn-secondary inline-flex items-center gap-1 text-xs text-danger"
                      >
                        <Unplug className="h-3 w-3" />
                        Disconnect
                      </button>
                    )}
                  </>
                )}

                {!isConnected && isPreferred && platform === "Apple Music" && (
                  <button
                    type="button"
                    onClick={() => handleSetPreferred(platform)}
                    className="btn-primary text-xs"
                  >
                    Active in jams
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
