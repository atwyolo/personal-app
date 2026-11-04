import { version } from "../../../package.json";

const SHORT_SHA_LENGTH = 7;

export const formatAppVersion = (appVersion: string, commitSha: string | undefined): string =>
  commitSha ? `${appVersion}+${commitSha.slice(0, SHORT_SHA_LENGTH)}` : appVersion;

export const appVersion = formatAppVersion(version, process.env.VERCEL_GIT_COMMIT_SHA);
