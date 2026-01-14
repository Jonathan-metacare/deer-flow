// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useCallback, useRef, useState } from "react";

import type { Option, Resource } from "~/core/messages";
import { sendMessage, useMessageIds, useStore } from "~/core/store";
import { cn } from "~/lib/utils";

import { ConversationStarter } from "./conversation-starter";
import { InputBox } from "./input-box";
import { MessageListView } from "./message-list-view";

export function MessagesBlock({ className }: { className?: string }) {
  const messageIds = useMessageIds();
  const responding = useStore((state) => state.responding);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [feedback, setFeedback] = useState<{ option: Option } | null>(null);

  const handleSend = useCallback(
    async (
      message: string,
      options?: {
        interruptFeedback?: string;
        resources?: Array<Resource>;
      },
    ) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      try {
        await sendMessage(
          message,
          {
            interruptFeedback:
              options?.interruptFeedback ?? feedback?.option.value,
            resources: options?.resources,
          },
          {
            abortSignal: abortController.signal,
          },
        );
      } catch { }
    },
    [feedback],
  );

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const handleFeedback = useCallback(
    (feedback: { option: Option }) => {
      setFeedback(feedback);
    },
    [setFeedback],
  );

  const handleRemoveFeedback = useCallback(() => {
    setFeedback(null);
  }, [setFeedback]);

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 top-[72px] z-[100] flex w-[440px] flex-col gap-4",
        className,
      )}
    >
      <div className="h-[180px] shrink-0">
        <InputBox
          className="h-full w-full shadow-2xl"
          responding={responding}
          feedback={feedback}
          onSend={handleSend}
          onCancel={handleCancel}
          onRemoveFeedback={handleRemoveFeedback}
        />
      </div>
      <div className="bg-card flex flex-grow flex-col overflow-hidden rounded-[24px] border shadow-sm">
        {messageIds.length === 0 ? (
          <ConversationStarter onSend={handleSend} />
        ) : (
          <MessageListView
            className="flex-grow"
            onFeedback={handleFeedback}
            onSendMessage={handleSend}
          />
        )}
      </div>

    </div>
  );
}
