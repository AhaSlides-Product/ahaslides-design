/**
 * @ahaslides-product/design/antd-render-empty — the DS empty state for every antd component.
 *
 *   import { createRenderEmpty } from '@ahaslides-product/design/antd-render-empty';
 *   const renderEmpty = createRenderEmpty({ h: React.createElement });   // Vue 3: { h } from 'vue'
 *   <ConfigProvider renderEmpty={renderEmpty} theme={…}> <App /> </ConfigProvider>
 *
 * antd draws its own grey Empty picture wherever a component has nothing to show (a Select or
 * Cascader with no options, a List, a Transfer column, a Table). Passing this to the app's root
 * ConfigProvider swaps every one of them for <aha-empty>: the empty-table illustration in a table
 * body, the small `simple` empty-list art in a dropdown or Transfer column, the default empty-list
 * art in a List. `labels` overrides the caption per component name, `labels.default` for the rest.
 */
if (typeof window !== 'undefined') import('./aha-empty.js');

export const renderEmptyLabels = { default: 'No data' };

const DROPDOWN_COMPONENTS = new Set(['Select', 'TreeSelect', 'Cascader', 'AutoComplete', 'Mentions', 'Transfer', 'Table.filter']);

/**
 * @param {{ h: Function, labels?: Record<string, string> }} deps — `h(tag, props, child)`:
 *   React.createElement or Vue 3's `h`.
 * @returns {(componentName?: string) => unknown} the `renderEmpty` prop for ConfigProvider.
 */
export function createRenderEmpty({ h, labels: labelOverrides } = {}) {
  if (typeof h !== 'function') throw new TypeError('createRenderEmpty needs { h }: React.createElement or Vue h');
  const labels = { ...renderEmptyLabels, ...labelOverrides };
  return function renderEmpty(componentName) {
    const description = labels[componentName] ?? labels.default;
    if (componentName === 'Table') {
      return h('aha-empty', { description },
        h('aha-illustration', { slot: 'image', name: 'empty-table', size: '64', decorative: '' }));
    }
    return h('aha-empty', { description, image: DROPDOWN_COMPONENTS.has(componentName) ? 'simple' : 'default' });
  };
}

export default { createRenderEmpty, renderEmptyLabels };
