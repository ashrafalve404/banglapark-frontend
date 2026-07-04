import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { AnnouncementProvider } from "@/lib/announcement-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <AnnouncementProvider>
            <div className="flex min-h-screen flex-col">
                <AnnouncementBar />
                <Header />
                <main className="flex-1 pt-24 sm:pt-[100px] pb-[64px] md:pb-0">{children}</main>
                <Footer />
                <MobileBottomNav />
            </div>
        </AnnouncementProvider>
    );
}
