export function githubBase(repository?: string, override?: string): string {
  if (override) {
    const path = override.trim().replace(/^\/+|\/+$/g, "");
    return path ? `/${path}/` : "/";
  }
  const [owner, name] = (repository || "").split("/");
  if (!name || name.toLowerCase() === `${owner.toLowerCase()}.github.io`)
    return "/";
  return `/${name}/`;
}
