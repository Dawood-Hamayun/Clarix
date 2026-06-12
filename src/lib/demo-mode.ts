/**
 * Demo lock. When CLARIX_DEMO_MODE=true the workspace is frozen for
 * client demos: knowledge can't be added or removed, settings are
 * read-only, and the project can't be deleted. Flip the env to false
 * (or unset it) to make everything editable again, e.g. when preparing
 * a demo on different data.
 */
export function isDemoLocked(): boolean {
  return process.env.CLARIX_DEMO_MODE === "true";
}
