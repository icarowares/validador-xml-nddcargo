export function findLineForPath(xml: string, path: string): number | null {
  const segs = path.split('.');
  let from = 0;
  let lastLine: number | null = null;

  for (const seg of segs) {
    const m = seg.match(/^([^\[]+)(?:\[(\d+)\])?$/);
    if (!m) return lastLine;
    const name = m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idx = m[2] ? parseInt(m[2]) - 1 : 0;

    const re = new RegExp(`<${name}[\\s>/]`, 'g');
    re.lastIndex = from;

    let count = 0;
    let hit: RegExpExecArray | null;
    let found = false;

    while ((hit = re.exec(xml)) !== null) {
      if (count === idx) {
        lastLine = xml.slice(0, hit.index).split('\n').length;
        from = hit.index + 1;
        found = true;
        break;
      }
      count++;
    }

    if (!found) return lastLine;
  }

  return lastLine;
}
