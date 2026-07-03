import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-16 pb-[64px] md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}
