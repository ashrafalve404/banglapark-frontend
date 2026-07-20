import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PublicMainContainer } from "@/components/layout/PublicMainContainer";
import { SocialSidebar } from "@/components/layout/SocialSidebar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <SocialSidebar />
            <PublicMainContainer>{children}</PublicMainContainer>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}
