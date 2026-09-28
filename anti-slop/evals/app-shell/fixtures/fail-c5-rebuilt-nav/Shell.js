const items = [
  { id: 'home', icon: 'system-house', label: 'Home' },
  { id: 'library', icon: 'system-folder', label: 'My presentations' },
  { id: 'team', icon: 'system-users', label: 'Team' },
];

export function renderNav(rail, activeId) {
  rail.innerHTML = items.map(item => `
    <li class="nav-item ${item.id === activeId ? 'is-active' : ''}" data-id="${item.id}">
      <aha-icon name="${item.icon}" size="16"></aha-icon> ${item.label}
    </li>`).join('');
  rail.querySelectorAll('.nav-item').forEach(node =>
    node.addEventListener('click', () => renderNav(rail, node.dataset.id)));
}

export const navStyles = `
  .nav-item { padding: var(--aha-space-8) var(--aha-space-12); transition: background .15s ease; }
  .nav-item.is-active { background: var(--aha-bg-hover); color: var(--aha-color-primary); }
`;
