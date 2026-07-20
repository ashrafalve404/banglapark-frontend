"use client";

export function SocialSidebar() {
    return (
        <div className="hidden lg:flex fixed right-3 lg:right-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
            <a
                href="https://www.facebook.com/profile.php?id=61589186879275"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2] hover:opacity-90 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
                title="Facebook"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
                </svg>
            </a>
            <a
                href="https://youtube.com/@banglapark?si=7mFnhHpG0s9fE0Hf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#FF0000] hover:opacity-90 flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg"
                title="YouTube"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            </a>
        </div>
    );
}
