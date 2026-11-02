export function upgradeProperties(element, names) {
  for (const name of names) {
    if (!Object.prototype.hasOwnProperty.call(element, name)) continue;
    const value = element[name];
    delete element[name];
    element[name] = value;
  }
}
