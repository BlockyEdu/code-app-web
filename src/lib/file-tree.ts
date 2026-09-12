export type FileTreeNode = {
  name: string;
  path: string;
  children?: FileTreeNode[];
};

type Draft = { name: string; path: string; children: Record<string, Draft>; file?: boolean };

/** Build a nested file tree from artifact-relative paths. Folders sort before files. */
export function filesToTree(paths: string[]): FileTreeNode[] {
  const root: Record<string, Draft> = {};
  for (const full of paths) {
    const parts = full.split("/").filter(Boolean);
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      acc = acc ? `${acc}/${name}` : name;
      if (!cur[name]) cur[name] = { name, path: acc, children: {} };
      if (i === parts.length - 1) cur[name].file = true;
      cur = cur[name].children;
    }
  }
  const toList = (obj: Record<string, Draft>): FileTreeNode[] =>
    Object.values(obj)
      .sort(
        (a, b) => Number(Boolean(a.file)) - Number(Boolean(b.file)) || a.name.localeCompare(b.name),
      )
      .map((n) => ({
        name: n.name,
        path: n.path,
        children: n.file ? undefined : toList(n.children),
      }));
  return toList(root);
}
