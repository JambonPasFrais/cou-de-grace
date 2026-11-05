export function el(tag, options = {}, children = []) {
  const { class: className, text, on, ...attributes } = options;
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value === null || value === undefined) {
      continue;
    }
    node.setAttribute(name, value === true ? '' : String(value));
  }

  for (const [event, handler] of Object.entries(on ?? {})) {
    node.addEventListener(event, handler);
  }

  node.append(...[children].flat().filter(child => child !== null && child !== undefined));
  return node;
}

export const div = (options, children) => el('div', options, children);
export const button = (options, children) => el('button', { type: 'button', ...options }, children);
export const text = (tag, content, options = {}) => el(tag, { ...options, text: content });

export function autofocus(element) {
  queueMicrotask(() => element.focus());
  return element;
}
