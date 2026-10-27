window.leaderboardContrast = function (panels) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const parse = (css) => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = '#000';
    context.fillStyle = css;
    context.fillRect(0, 0, 1, 1);
    const data = context.getImageData(0, 0, 1, 1).data;
    return [data[0], data[1], data[2], data[3] / 255];
  };
  const over = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3]));
  const channel = (value) => { const unit = value / 255; return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4; };
  const luminance = (rgb) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const gradientAt = (deck, box, x, y) => {
    const angle = (deck.angle * Math.PI) / 180;
    const length = Math.abs(box.width * Math.sin(angle)) + Math.abs(box.height * Math.cos(angle));
    const t = Math.min(1, Math.max(0, (((x - box.left - box.width / 2) * Math.sin(angle)) - ((y - box.top - box.height / 2) * Math.cos(angle))) / length + 0.5));
    for (let i = 1; i < deck.stops.length; i++) {
      const [p1, c1] = deck.stops[i];
      const [p0, c0] = deck.stops[i - 1];
      if (t <= p1) { const f = (t - p0) / (p1 - p0); return c0.map((v, k) => v + (c1[k] - v) * f); }
    }
    return deck.stops[deck.stops.length - 1][1];
  };
  const results = [];
  for (const panel of panels) {
    const box = panel.root.getBoundingClientRect();
    const pageAt = (x, y) => (panel.bg.stops ? gradientAt(panel.bg, box, x, y) : panel.bg);
    const corners = (rect) => [[rect.left, rect.top], [rect.right, rect.top], [rect.left, rect.bottom], [rect.right, rect.bottom], [rect.left + rect.width / 2, rect.top + rect.height / 2]];
    const record = (kind, element, backgroundsAt) => {
      const text = parse(getComputedStyle(element).color);
      const rect = element.getBoundingClientRect();
      let worst = Infinity;
      for (const [x, y] of corners(rect)) {
        const background = backgroundsAt(x, y);
        worst = Math.min(worst, ratio(over(text, background), background));
      }
      results.push({ kind, deck: panel.name, surface: panel.surface, ratio: worst });
    };
    const shadow = panel.element.shadowRoot;
    const onPage = (kind, selector) => { for (const element of shadow.querySelectorAll(selector)) if (element.getClientRects().length && !element.closest('[hidden]')) record(kind, element, pageAt); };
    onPage('title', '.heading');
    onPage('player count', '.count');
    onPage('score', '.score-value');
    onPage('score unit', '.score-unit');
    onPage('gain', '.delta-value');
    onPage('and N more', '.more');
    for (const row of shadow.querySelectorAll('li.row')) {
      if (!row.getClientRects().length) continue;
      const track = row.querySelector('.track');
      const trackRect = track.getBoundingClientRect();
      const trackFill = parse(getComputedStyle(track).backgroundColor);
      const onTrack = (x, y) => over(trackFill, pageAt(x, y));
      const barColour = parse(getComputedStyle(row.querySelector('.fill')).backgroundColor).slice(0, 3);
      const edge = trackRect.left + row.querySelector('.fill').getBoundingClientRect().width;
      const chip = row.querySelector('.chip');
      record('rank number', chip, (x, y) => over(parse(getComputedStyle(chip).backgroundColor), pageAt(x, y)));
      for (const [kind, selector] of [['name', '.name'], ['You tag', '.tag']]) {
        const base = row.querySelector('.base ' + selector);
        const layer = row.querySelector('.over ' + selector);
        if (base.getClientRects().length && !base.closest('[hidden]') && base.getBoundingClientRect().right > edge + 1) record(kind + ' on track', base, onTrack);
        if (layer.getClientRects().length && !layer.closest('[hidden]') && layer.getBoundingClientRect().left < edge - 1) record(kind + ' on bar', layer, () => barColour);
      }
    }
  }
  return results;
};
