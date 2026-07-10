import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PublicMainContainer } from "@/components/layout/PublicMainContainer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <PublicMainContainer>{children}</PublicMainContainer>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}

