"use client";

import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState, useRef, useEffect } from "react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

export function LandingInput() {
    const router = useRouter();
    const t = useTranslations("chat.inputBox");
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = useCallback(() => {
        if (!value.trim()) return;
        router.push(`/chat?q=${encodeURIComponent(value)}`);
    }, [router, value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [value]);

    return (
        <div className="w-full max-w-2xl relative group">
            <div className="relative flex w-full items-center overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-300 focus-within:border-white/40 hover:border-white/30">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("placeholder") || "Ask anything..."}
                    className="min-h-[60px] w-full resize-none border-none bg-transparent pl-6 pr-14 py-5 text-lg text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide"
                    rows={1}
                />
                <div className="absolute right-3 bottom-2.5">
                    <Button
                        size="icon"
                        className={cn(
                            "h-10 w-10 rounded-full transition-all duration-300",
                            value.trim()
                                ? "bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                : "bg-white/10 text-white/30 hover:bg-white/20"
                        )}
                        onClick={handleSend}
                        disabled={!value.trim()}
                    >
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
