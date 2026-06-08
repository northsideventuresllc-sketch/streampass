"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  IDLE_DAYS_THRESHOLD,
  VIDEO_STREAMING_SERVICES,
  isMusicService,
  isVideoService,
} from "@/lib/constants";
import { PlatformSelect } from "@/components/platform-select";
import type { UserService } from "@/lib/types";
import { formatCurrency, daysSince, formatRelativeDate } from "@/lib/utils";

interface SubscriptionsManagerProps {
  initialServices: UserService[];
}

export function SubscriptionsManager({
  initialServices,
}: SubscriptionsManagerProps) {
  const [services, setServices] = useState(initialServices);
  const [serviceName, setServiceName] = useState<string>(
    VIDEO_STREAMING_SERVICES[0]
  );
  const [monthlyCost, setMonthlyCost] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const totalSpend = services.reduce(
    (sum, s) => sum + Number(s.monthly_cost),
    0
  );

  const idleServices = services.filter((s) => {
    const days = daysSince(s.last_active_at);
    return days === null || days >= IDLE_DAYS_THRESHOLD;
  });

  const savingsOpportunity = idleServices.reduce(
    (sum, s) => sum + Number(s.monthly_cost),
    0
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("streampass_user_services")
      .upsert(
        {
          user_id: user.id,
          service_name: serviceName,
          monthly_cost: parseFloat(monthlyCost) || 0,
        },
        { onConflict: "user_id,service_name" }
      )
      .select()
      .single();

    if (!error && data) {
      setServices((prev) => {
        const exists = prev.find((s) => s.service_name === data.service_name);
        if (exists) {
          return prev.map((s) =>
            s.service_name === data.service_name ? data : s
          );
        }
        return [...prev, data];
      });
      setMonthlyCost("");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("streampass_user_services")
      .delete()
      .eq("id", id);
    if (!error) setServices(services.filter((s) => s.id !== id));
  }

  const videoServices = services.filter((s) => isVideoService(s.service_name));
  const musicServices = services.filter((s) => isMusicService(s.service_name));

  function renderServiceList(items: UserService[], emptyLabel: string) {
    if (items.length === 0) {
      return <p className="text-sm text-muted">{emptyLabel}</p>;
    }

    return (
      <div className="space-y-2">
        {items.map((service) => {
          const days = daysSince(service.last_active_at);
          const isIdle = days === null || days >= IDLE_DAYS_THRESHOLD;

          return (
            <div key={service.id} className="panel-row">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{service.service_name}</p>
                  {isIdle && (
                    <span className="badge-warning flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Idle {days !== null ? `${days}d` : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Last active: {formatRelativeDate(service.last_active_at ?? "")}
                </p>
              </div>
              <p className="font-mono text-sm">
                {formatCurrency(Number(service.monthly_cost))}/mo
              </p>
              <button
                onClick={() => handleDelete(service.id)}
                className="rounded p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bento-card bento-cyan">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#a1a1aa]">
            Monthly Total
          </p>
          <p className="stat-value mt-2 text-white">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="bento-card bento-magenta">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#a1a1aa]">
            Active Services
          </p>
          <p className="stat-value mt-2 text-white">{services.length}</p>
        </div>
        <div className="bento-card border-[rgba(251,191,36,0.35)]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#a1a1aa]">
            Potential Savings
          </p>
          <p className="stat-value mt-2 text-[#fbbf24]">
            {formatCurrency(savingsOpportunity)}/mo
          </p>
          {idleServices.length > 0 && (
            <p className="mt-1 text-xs text-[#a1a1aa]">
              From {idleServices.length} idle service
              {idleServices.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleAdd} className="card">
        <h2 className="mb-4 font-semibold">Add Subscription</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <PlatformSelect
            value={serviceName}
            onChange={setServiceName}
            mediaType="all"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(e.target.value)}
            placeholder="Monthly cost ($)"
            className="input"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary sm:col-span-2 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </form>

      <div className="card">
        <h2 className="mb-4 font-semibold">Your Subscriptions</h2>
        {services.length === 0 ? (
          <p className="text-sm text-muted">
            No subscriptions tracked yet. Add your video and music services above.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">Video streaming</h3>
              {renderServiceList(
                videoServices,
                "No video subscriptions tracked yet."
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted">Music streaming</h3>
              {renderServiceList(
                musicServices,
                "No music subscriptions tracked yet."
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
