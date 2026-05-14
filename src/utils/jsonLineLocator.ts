interface Seg { key: string; idx: number | null; }

function parsePath(path: string): Seg[] {
  return path.split('.').map(part => {
    const m = part.match(/^([^\[]+)(?:\[(\d+)\])?$/);
    if (!m) return { key: part, idx: null };
    return { key: m[1], idx: m[2] !== undefined ? parseInt(m[2]) : null };
  });
}

// Returns the character index of the idx-th top-level { inside a JSON array
// starting at fromPos (right after the opening [).
function findNthObjectInArray(json: string, fromPos: number, idx: number): number {
  let i = fromPos;
  let count = 0;
  while (i < json.length) {
    const c = json[i];
    if (c === '{') {
      if (count === idx) return i;
      // Skip this object to count the next one
      let depth = 1;
      i++;
      while (i < json.length && depth > 0) {
        if (json[i] === '{' || json[i] === '[') depth++;
        else if (json[i] === '}' || json[i] === ']') depth--;
        i++;
      }
      count++;
    } else if (c === ']') {
      return -1;
    } else {
      i++;
    }
  }
  return -1;
}

export function findLineForJsonPath(json: string, path: string): number | null {
  const segs = parsePath(path);
  let from = 0;
  let lastLine: number | null = null;

  for (const seg of segs) {
    const escaped = seg.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`"${escaped}"\\s*:`, 'g');
    re.lastIndex = from;
    const hit = re.exec(json);
    if (!hit) return lastLine;

    lastLine = json.slice(0, hit.index).split('\n').length;
    from = hit.index + hit[0].length;

    if (seg.idx !== null) {
      // Advance to the opening [ of the array value
      let i = from;
      while (i < json.length && json[i] !== '[') i++;
      if (i >= json.length) return lastLine;
      i++; // skip [

      const pos = findNthObjectInArray(json, i, seg.idx);
      if (pos === -1) return lastLine;
      lastLine = json.slice(0, pos).split('\n').length;
      from = pos + 1;
    }
  }

  return lastLine;
}
