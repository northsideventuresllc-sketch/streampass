import { PageHeader } from "@/components/afterglow/page-header";
import { RecommendationsPanel } from "@/components/recommendations-panel";

export default function DiscoverPage() {
  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        badge="Discover"
        title="AI Picks"
        subtitle="Cross-platform video recommendations from your watch history."
      />
      <RecommendationsPanel />
    </div>
  );
}
