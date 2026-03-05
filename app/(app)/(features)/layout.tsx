import { FeatureTabs } from '@/components/feature-tabs';

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FeatureTabs />
      {children}
    </>
  );
}
