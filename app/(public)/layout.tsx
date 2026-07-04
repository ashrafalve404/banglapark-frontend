import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { AnnouncementProvider } from "@/lib/announcement-context";
import { PublicMainContainer } from "@/components/layout/PublicMainContainer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <AnnouncementProvider>
            <div className="flex min-h-screen flex-col">
                <AnnouncementBar />
                <Header />
                <PublicMainContainer>{children}</PublicMainContainer>
                <Footer />
                <MobileBottomNav />
            </div>
        </AnnouncementProvider>
    );
}

