import { AppHeader } from "@/components/app/app-header";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
