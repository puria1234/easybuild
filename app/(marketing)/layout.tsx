import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex flex-1 flex-col pt-[65px]">{children}</main>
      <Footer />
    </>
  );
}
