"use client";

import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

const TYPING_INTERVAL = 20; // ms between updates
const DELETING_INTERVAL = 10; // ms between updates
const TYPING_STEP = 2; // chars to add per update
const DELETING_STEP = 4; // chars to remove per update
const PAUSE_DURATION = 1000; // ms to pause after typing
const PLACEHOLDERS = [
    "investigate a forest.",
    "forecast the weather.",
    "supervise a specific farm.",
    "analyze crop health.",
    "track deforestation.",
];

export function LandingInput() {
    const router = useRouter();
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Placeholder animation state
    const [placeholderText, setPlaceholderText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(TYPING_INTERVAL);

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

    // Typing effect
    useEffect(() => {
        // If user has typed something, stop animation
        if (value) {
            setPlaceholderText("");
            return;
        }

        const baseText = "Ask satellite to ";
        const i = loopNum % PLACEHOLDERS.length;
        const fullText = baseText + PLACEHOLDERS[i];

        const handleTyping = () => {
            setPlaceholderText((current) => {
                if (isDeleting) {
                    // Deleting: remove chunk of chars until we reach "Ask satellite to "
                    if (current.length > baseText.length) {
                        const nextLen = Math.max(baseText.length, current.length - DELETING_STEP);
                        return current.substring(0, nextLen);
                    } else {
                        setIsDeleting(false);
                        setLoopNum((prev) => prev + 1);
                        setTypingSpeed(TYPING_INTERVAL);
                        return current;
                    }
                } else {
                    // Typing: add chunk of chars until full
                    if (current.length < fullText.length) {
                        const nextLen = Math.min(fullText.length, current.length + TYPING_STEP);
                        return fullText.substring(0, nextLen);
                    } else {
                        setIsDeleting(true);
                        setTypingSpeed(DELETING_INTERVAL);
                        return current;
                    }
                }
            });
        };

        let timer: NodeJS.Timeout;

        if (!isDeleting && placeholderText === fullText) {
            // Pausing at end of sentence
            timer = setTimeout(handleTyping, PAUSE_DURATION);
        } else if (isDeleting && placeholderText === baseText) {
            // Pausing before starting next sentence (short pause)
            timer = setTimeout(handleTyping, 200);
        } else {
            // Normal typing/deleting
            timer = setTimeout(handleTyping, typingSpeed);
        }

        return () => clearTimeout(timer);
    }, [value, isDeleting, loopNum, typingSpeed, placeholderText]);

    // Initialize placeholder
    useEffect(() => {
        setPlaceholderText("Ask satellite to ");
        setTypingSpeed(TYPING_INTERVAL);
    }, []);


    return (
        <div className="w-full max-w-2xl relative group">
            <div className="relative flex w-full items-center overflow-hidden rounded-[24px] border border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-300 focus-within:border-white/40 hover:border-white/30">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value ? "" : placeholderText}
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
