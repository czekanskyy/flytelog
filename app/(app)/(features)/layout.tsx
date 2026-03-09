import { RouteBar } from '@/components/routebar';

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RouteBar />
      {children}
    </>
  );
}
