import { frenchSpacing } from '../core/typography.js';
import { text } from './dom.js';
import { onStorageUnavailable } from './persistence.js';

export function mountStorageBanner(parent, before) {
  const banner = text('div', frenchSpacing('Vos blagues vues ne seront pas gardées dans ce navigateur.'), {
    class: 'bandeau',
    role: 'status',
    hidden: true,
  });
  parent.insertBefore(banner, before);
  onStorageUnavailable(() => {
    banner.hidden = false;
  });
}
