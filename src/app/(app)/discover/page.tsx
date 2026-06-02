import { PageHeader } from "@/components/afterglow/page-header";
import { RecommendationsPanel } from "@/components/recommendations-panel";

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        badge="Discover"
        title="AI Picks"
        subtitle="Cross-platform recommendations from your watch history."
      />
      <RecommendationsPanel />
    </div>
  );
}
