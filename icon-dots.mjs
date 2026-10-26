const COMMAND_ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

export function parseSubpaths(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const subpaths = [];
  let current = null, x = 0, y = 0, startX = 0, startY = 0, command = null, index = 0;
  const open = () => { current = { xs: [x], ys: [y], closed: false }; subpaths.push(current); startX = x; startY = y; };
  const add = (px, py) => { current.xs.push(px); current.ys.push(py); };
  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) command = tokens[index++];
    const upper = command.toUpperCase(), relative = command !== upper;
    if (upper === 'Z') { current.closed = true; x = startX; y = startY; current = null; continue; }
    const args = tokens.slice(index, index + COMMAND_ARITY[upper]).map(Number);
    index += COMMAND_ARITY[upper];
    const baseX = relative ? x : 0, baseY = relative ? y : 0;
    if (upper === 'M') {
      x = args[0] + baseX; y = args[1] + baseY; open();
      command = relative ? 'l' : 'L';
      continue;
    }
    if (!current) { current = { xs: [x], ys: [y], closed: false }; subpaths.push(current); startX = x; startY = y; }
    if (upper === 'H') { x = args[0] + baseX; add(x, y); }
    else if (upper === 'V') { y = args[0] + baseY; add(x, y); }
    else if (upper === 'A') {
      const endX = args[5] + baseX, endY = args[6] + baseY;
      add(endX, endY); add(x - args[0], y - args[1]); add(x + args[0], y + args[1]);
      x = endX; y = endY;
    } else {
      for (let pair = 0; pair < args.length; pair += 2) add(args[pair] + baseX, args[pair + 1] + baseY);
      x = args[args.length - 2] + baseX; y = args[args.length - 1] + baseY;
    }
  }
  return subpaths.map(({ xs, ys, closed }) => {
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    return { closed, minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  });
}

const isStroked = (tag) => /\sstroke="(?!none)/.test(tag);
const widthOf = (tag) => Number((tag.match(/\sstroke-width="([^"]+)"/) || [])[1] ?? 1);

export function findStrokedDots(svg) {
  const found = [];
  for (const tag of svg.match(/<path\b[^>]*>/g) || []) {
    const d = (tag.match(/\sd="([^"]+)"/) || [])[1];
    if (!d || !isStroked(tag)) continue;
    const strokeWidth = widthOf(tag);
    parseSubpaths(d).forEach((sub, subpathIndex) => {
      if (sub.closed && Math.max(sub.width, sub.height) < strokeWidth) found.push({ kind: 'path', tag, strokeWidth, subpathIndex, ...sub });
    });
  }
  for (const tag of svg.match(/<circle\b[^>]*>/g) || []) {
    const radius = Number((tag.match(/\sr="([^"]+)"/) || [])[1]);
    const strokeWidth = widthOf(tag);
    if (isStroked(tag) && radius * 2 < strokeWidth) found.push({ kind: 'circle', tag, strokeWidth, radius, cx: Number((tag.match(/\scx="([^"]+)"/) || [])[1]), cy: Number((tag.match(/\scy="([^"]+)"/) || [])[1]) });
  }
  return found;
}
