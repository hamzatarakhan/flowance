import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import "@/styles/flowance.css";
import { bootFlowance } from "@/lib/flowance-runtime";
import { registerFlowanceUI } from "@/lib/flowance-ui";
import { LoadScreen } from "@/components/flowance/LoadScreen";
import { Onboarding } from "@/components/flowance/Onboarding";
import { Header } from "@/components/flowance/Header";
import { HeroCard } from "@/components/flowance/HeroCard";
import { MonthBar } from "@/components/flowance/MonthBar";
import { StatsGrid } from "@/components/flowance/StatsGrid";
import { BudgetCard } from "@/components/flowance/BudgetCard";
import { InsightsCard } from "@/components/flowance/InsightsCard";
import { GroupTabsBar } from "@/components/flowance/GroupTabsBar";
import { ListViewArea } from "@/components/flowance/ListViewArea";
import { Panels } from "@/components/flowance/Panels";
import { PageCredit } from "@/components/flowance/PageCredit";
import { StickyBar } from "@/components/flowance/StickyBar";
import { Toasts } from "@/components/flowance/Toasts";
import { ScanOverlay } from "@/components/flowance/ScanOverlay";
import { HistoryOverlay } from "@/components/flowance/HistoryOverlay";
import { HistoryView } from "@/components/flowance/HistoryView";
import { YearView } from "@/components/flowance/YearView";
import { SearchOverlay } from "@/components/flowance/SearchOverlay";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowance — أموالك، بوضوح" },
      {
        name: "description",
        content: "تطبيق فلونس لإدارة المصاريف الشهرية، تتبّع المدفوعات ومراقبة الميزانية بوضوح.",
      },
      { property: "og:title", content: "Flowance — أموالك، بوضوح" },
      {
        property: "og:description",
        content: "تطبيق فلونس لإدارة المصاريف الشهرية، تتبّع المدفوعات ومراقبة الميزانية بوضوح.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Cairo:wght@300;400;500;600;700;900&display=swap",
      },
    ],
  }),
  component: FlowancePage,
});

function FlowancePage() {
  useEffect(() => {
    registerFlowanceUI();
    void bootFlowance();
  }, []);

  return (
    <>
      <LoadScreen />
      <Onboarding />

      <div className="app">
        <Header />
        <div className="scroll-body">
          <HeroCard />
          <MonthBar />
          <StatsGrid />
          <BudgetCard />
          <InsightsCard />
          <GroupTabsBar />
          <ListViewArea />
          <Panels />
          <PageCredit />
        </div>
      </div>

      <StickyBar />
      <Toasts />
      <ScanOverlay />
      <HistoryOverlay />
      <HistoryView />
      <YearView />
      <SearchOverlay />
    </>
  );
}
