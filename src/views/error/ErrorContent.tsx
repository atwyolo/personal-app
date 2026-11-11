"use client";

import { RotateCwIcon } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";

import { StatusCode } from "@/shared/ui/StatusCode";
import { StatusPage } from "@/shared/ui/StatusPage";
import { statusPill } from "@/shared/ui/status-pill";

import type { ErrorTexts } from "./error-texts";

interface ErrorContentProps {
  error: unknown;
  texts: ErrorTexts;
}

const getDigest = (error: unknown): string | null =>
  typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string"
    ? error.digest
    : null;

export const ErrorContent: FC<ErrorContentProps> = (props) => {
  const { error, texts } = props;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const digest = getDigest(error);

  useEffect(() => {
    console.error(error);
    titleRef.current?.focus();
  }, [error]);

  const handleReload = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    window.location.reload();
  };

  return (
    <div data-error-page className="flex grow flex-col">
      <title>{texts.metaTitle}</title>
      <meta name="robots" content="noindex" />
      <StatusPage
        code={<StatusCode variant="error" />}
        label={texts.label}
        title={texts.title}
        titleRef={titleRef}
        text={texts.text}
        detail={
          digest && (
            <p className="mt-[18px] inline-flex max-w-full items-center gap-2 rounded-[10px] border border-dashed border-card-border px-3 py-[7px] text-left font-mono text-[13px] leading-[1.3] text-muted-foreground [overflow-wrap:anywhere]">
              {texts.errorId} <span className="font-medium text-foreground-soft">{digest}</span>
            </p>
          )
        }
      >
        <button type="button" className={statusPill} disabled={busy} data-busy={busy || undefined} onClick={handleReload}>
          <RotateCwIcon aria-hidden="true" className="size-[18px]" strokeWidth={2.4} />
          <span aria-live="polite">{busy ? texts.reloading : texts.reload}</span>
        </button>
      </StatusPage>
    </div>
  );
};
