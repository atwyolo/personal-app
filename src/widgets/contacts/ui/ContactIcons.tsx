import type { FC, SVGProps } from "react";

const OutlineIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  />
);

export const WhatsAppIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <OutlineIcon {...props}>
    <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 7.8 19.4z" />
    <path d="M9 9.5c.5 2.2 2.3 4 4.5 4.5l1-1.2 2 .8-.3 1.6c-3.8.2-7.6-3.6-7.4-7.4l1.6-.3.8 2z" />
  </OutlineIcon>
);

export const EnvelopeIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <OutlineIcon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </OutlineIcon>
);

export const LinkedInIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <OutlineIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 10v7M8 7v.01M12 17v-7M12 13a3 3 0 0 1 6 0v4" />
  </OutlineIcon>
);
