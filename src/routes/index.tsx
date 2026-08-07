import { createFileRoute, redirect } from "@tanstack/react-router";

// The Flowance app is a self-contained static HTML app served from /flowance.html.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ href: "/flowance.html" });
  },
  head: () => ({
    meta: [
      { title: "Flowance — أموالك، بوضوح" },
      { name: "description", content: "تطبيق فلونس لإدارة المصاريف الشخصية وتتبع الميزانية بوضوح." },
      { property: "og:title", content: "Flowance — أموالك، بوضوح" },
      {
        property: "og:description",
        content: "تطبيق فلونس لإدارة المصاريف الشخصية وتتبع الميزانية بوضوح.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
