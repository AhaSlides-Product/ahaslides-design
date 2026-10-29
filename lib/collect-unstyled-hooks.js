import { htmlTags } from './screen-lint-website.js';

export function collectUnstyledHooks(documents) {
  const used = new Set();
  const styled = new Set();
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if ((key === 'css' || key === 'baseCss') && typeof value === 'string')
        for (const match of value.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) styled.add(match[1]);
      if (key === 'html' && typeof value === 'string')
        for (const tag of htmlTags(value)) for (const name of tag.classes) used.add(name);
      if (typeof value === 'object' && value !== null) visit(value);
    }
  };
  documents.forEach(visit);
  return [...used].filter((name) => !styled.has(name)).sort();
}
