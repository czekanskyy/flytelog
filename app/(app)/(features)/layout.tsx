import { FeatureTabs } from "@/components/feature-tabs"

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <FeatureTabs />
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {children}
      </div>
    </>
  )
}
