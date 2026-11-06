const NAMESPACE = 'http://www.w3.org/2000/svg';

export function svg(tag, attributes = {}, children = []) {
  const node = document.createElementNS(NAMESPACE, tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== false && value !== null && value !== undefined) {
      node.setAttribute(name, String(value));
    }
  }
  node.append(...[children].flat().filter(child => child !== null && child !== undefined));
  return node;
}
