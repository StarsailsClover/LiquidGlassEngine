export function expandWgslIncludes(
  source: string,
  resolve: (path: string) => string | undefined,
): string {
  return source.replace(/^#include\s+['"](.+?)['"]\s*$/gm, (_match, includePath: string) => {
    const included = resolve(includePath);
    if (included === undefined) {
      throw new Error(`Unresolved WGSL include: ${includePath}`);
    }
    return expandWgslIncludes(included, resolve);
  });
}
