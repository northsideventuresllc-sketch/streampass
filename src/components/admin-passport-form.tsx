"use client";

import { useState } from "react";

export function AdminPassportForm() {
  const [adminKey, setAdminKey] = useState("");
  const [titleId, setTitleId] = useState("");
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/tracked-titles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          id: titleId,
          current_platform: currentPlatform || undefined,
          expires_at: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setResult(
        `Updated "${data.title.title}" — alert: ${data.title.alert_triggered}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-lg space-y-4">
      <h2 className="font-semibold">Update Tracked Title</h2>
      <p className="text-sm text-muted">
        Admin tool to update platform status and trigger user alerts.
      </p>

      <div>
        <label className="mb-1 block text-xs text-muted">Admin Key</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          className="input"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Title ID (UUID)</label>
        <input
          type="text"
          value={titleId}
          onChange={(e) => setTitleId(e.target.value)}
          className="input font-mono text-xs"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">New Platform</label>
        <input
          type="text"
          value={currentPlatform}
          onChange={(e) => setCurrentPlatform(e.target.value)}
          className="input"
          placeholder="e.g. Netflix"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-muted">Expires At</label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="input"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {result && <p className="text-sm text-success">{result}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Updating..." : "Update & Trigger Alert"}
      </button>
    </form>
  );
}
