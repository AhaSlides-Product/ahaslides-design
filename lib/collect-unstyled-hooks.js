import { htmlTags } from './screen-lint-website.js';

export function collectUnstyledHooks(documents) {
  const hooks = new Set();
  const visit = (node, baseCss = '') => {
    if (Array.isArray(node)) return node.forEach((item) => visit(item, baseCss));
    if (!node || typeof node !== 'object') return;
    const shared = `${baseCss}\n${typeof node.baseCss === 'string' ? node.baseCss : ''}`;
    if (typeof node.html === 'string') {
      const styled = new Set([...`${shared}\n${node.css ?? ''}`.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
      for (const tag of htmlTags(node.html)) for (const name of tag.classes) if (!styled.has(name)) hooks.add(name);
    }
    Object.values(node).forEach((value) => visit(value, shared));
  };
  documents.forEach((document) => visit(document));
  return [...hooks].sort();
}
