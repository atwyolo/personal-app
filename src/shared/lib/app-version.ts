import { version } from "../../../package.json";

const SHORT_SHA_LENGTH = 7;

/** Semver build metadata: `0.2.0+4eee3cf`. The part after `+` tells apart builds of one version and is ignored in comparisons. */
export const formatAppVersion = (appVersion: string, commitSha: string | undefined): string =>
  commitSha ? `${appVersion}+${commitSha.slice(0, SHORT_SHA_LENGTH)}` : appVersion;

/** What this build is, for checking a deployment. Vercel provides the commit; a local build has only the version. */
export const appVersion = formatAppVersion(version, process.env.VERCEL_GIT_COMMIT_SHA);
