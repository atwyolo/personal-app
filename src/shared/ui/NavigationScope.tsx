"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type FC,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useTransition,
} from "react";

import { useRouter as useLocaleRouter } from "@/shared/lib/i18n/navigation";
import { useMounted } from "@/shared/lib/useMounted";
import { cn } from "@/shared/lib/utils";

interface NavigateOptions {
  /** The id of an element to scroll to and focus once the new page has rendered. */
  scrollTo?: string;
}

interface UseNavigationScope {
  pending: boolean;
  /** Goes to a locale-less href (the router adds the locale). Ignored while a navigation is pending. */
  navigate: (href: string, options?: NavigateOptions) => void;
}

const NavigationScopeContext = createContext<UseNavigationScope | null>(null);

interface NavigationScopeProps {
  children: ReactNode;
  /** The id of an element to focus when the clicked link is gone after the navigation (a removed tag's ×). */
  focusFallback?: string;
  /** Give it a `scroll-margin-top` for a sticky header: a page change scrolls the scope's top into view. */
  className?: string;
}

/** A click the browser must handle itself: a new tab or window, a download, a link with its own target. */
const leftToBrowser = (event: MouseEvent, anchor: HTMLAnchorElement) =>
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey ||
  anchor.hasAttribute("download") ||
  (anchor.target !== "" && anchor.target !== "_self");

/**
 * One pending state for a page whose controls are links to other states of the same page (the blog list's filters
 * and pages). It takes over a plain click on any such link: the server-rendered links stay real anchors, so they work
 * before hydration and open in a new tab, while here the navigation runs in a transition without scrolling. While it
 * is pending the scope is `aria-busy`, carries `data-pending` for the page to dim what it wants, and ignores further
 * clicks, so a double click makes one history entry (owner's rule: no optimistic state, block until the answer).
 *
 * Only links to the same pathname are taken over: a post, Back and the menu navigate as usual. Nothing is `disabled`
 * or `inert`, which would drop the focus from the clicked link. Once the new state has rendered:
 * - a link with `data-scope-scroll="<id>"` scrolls the scope's own top into view and focuses that element, so a screen
 *   reader hears where it landed. The scope's top, not the element's: a sticky panel above the list on phones would
 *   cover an element scrolled to the top of the view (WCAG 2.4.11), while at the scope's top it sits in its own place;
 * - a clicked link that is no longer in the document (a removed tag) hands the focus to `focusFallback`, so the
 *   keyboard does not restart from the top of the page.
 */
export const NavigationScope: FC<NavigationScopeProps> = (props) => {
  const { children, focusFallback, className } = props;
  const router = useRouter();
  const localeRouter = useLocaleRouter();
  const [pending, startTransition] = useTransition();
  // Set at once on a click, before React has rendered `pending`, so a second click in the same frame is blocked too.
  const busy = useRef(false);
  const scrollTarget = useRef<string | null>(null);
  const clicked = useRef<HTMLAnchorElement | null>(null);
  const root = useRef<HTMLDivElement>(null);
  // Until React has hydrated the scope, a click is the browser's own navigation; tests wait for this marker.
  const hydrated = useMounted();

  useEffect(() => {
    if (pending) return;
    busy.current = false;

    const id = scrollTarget.current;
    const link = clicked.current;
    scrollTarget.current = null;
    clicked.current = null;

    const target = id === null ? null : document.getElementById(id);
    if (target !== null) {
      root.current?.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
      return;
    }
    if (link !== null && !link.isConnected && focusFallback !== undefined) {
      document.getElementById(focusFallback)?.focus({ preventScroll: true });
    }
  }, [pending, focusFallback]);

  const start = useCallback(
    (push: () => Promise<void> | void, options?: NavigateOptions) => {
      busy.current = true;
      scrollTarget.current = options?.scrollTo ?? null;
      startTransition(async () => {
        await push();
      });
    },
    [],
  );

  const navigate = useCallback(
    (href: string, options?: NavigateOptions) => {
      if (busy.current) return;
      start(() => localeRouter.push(href, { scroll: false }), options);
    },
    [localeRouter, start],
  );

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as Element).closest("a");
    if (anchor === null || !event.currentTarget.contains(anchor) || leftToBrowser(event, anchor)) return;

    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;

    // Prevented, so next/link and the browser leave it to us (next/link checks `defaultPrevented`).
    event.preventDefault();
    if (busy.current) return;
    clicked.current = anchor;
    start(() => router.push(`${url.pathname}${url.search}`, { scroll: false }), {
      scrollTo: anchor.dataset.scopeScroll,
    });
  };

  const value = useMemo(() => ({ pending, navigate }), [pending, navigate]);

  return (
    <NavigationScopeContext value={value}>
      <div
        ref={root}
        onClickCapture={onClickCapture}
        data-navigation-scope=""
        data-hydrated={hydrated ? "" : undefined}
        aria-busy={pending || undefined}
        data-pending={pending ? "" : undefined}
        className={cn("data-pending:[&_a]:cursor-progress", className)}
      >
        {children}
      </div>
    </NavigationScopeContext>
  );
};

/** The scope's pending state and `navigate`, for controls inside it that are not links (the tag search). */
export const useNavigationScope = (): UseNavigationScope => {
  const scope = useContext(NavigationScopeContext);
  if (scope === null) throw new Error("useNavigationScope must be used inside a NavigationScope.");
  return scope;
};
