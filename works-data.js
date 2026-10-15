// PORTS — works data, shared by the home Works index and works.html.
// Every entry below is a PLACEHOLDER (sample: true) until real titles, categories and images arrive.
// To add a real work: copy an entry, set sample: false, and add `images` (file paths, see below);
// `art` is only the stand-in gradient shown while there is no image.
// `color` is the work's representative colour, laid down first while the image loads (works page).
//   cat:   'branding' | 'production' | 'product'   (matches the three services; used by the filters)
//   tag:   short discipline label shown next to the title
//   featured: true -> listed in the home Works index (keep it to ~6-10)
window.PORTS_WORKS = [
  { title: 'Virtual Live Stage',     cat: 'production', tag: 'WebGL',      year: 2025, featured: true,  sample: true, color: '#1a3fe0', art: 'radial-gradient(circle at 30% 30%, #8aa2ff, #1a3fe0 45%, #0a0f3a)' },
  { title: 'AR Fan Meeting',         cat: 'production', tag: 'AR',         year: 2025, featured: true,  sample: true, color: '#ff9a62', art: 'linear-gradient(135deg, #ff7a59, #ffd36e)' },
  { title: 'Anime IP Branding',      cat: 'branding',   tag: 'Branding',   year: 2025, featured: true,  sample: true, color: '#3a5bd9', art: 'radial-gradient(circle at 70% 60%, #c8f6ff, #3a5bd9 60%, #10123a)' },
  { title: 'Music Video 3DCG',       cat: 'production', tag: '3D CG',      year: 2024, featured: true,  sample: true, color: '#d0478c', art: 'conic-gradient(from 200deg at 40% 60%, #1a3fe0, #ff4f9a, #ffc857, #1a3fe0)' },
  { title: 'WebGL Special Site',     cat: 'production', tag: 'WebGL',      year: 2024, featured: true,  sample: true, color: '#2c2f45', art: 'linear-gradient(160deg, #0b0b0d, #2c2f45 60%, #6d8bff)' },
  { title: 'AI Key Visual',          cat: 'production', tag: 'AI',         year: 2024, featured: true,  sample: true, color: '#7a1f5a', art: 'radial-gradient(circle at 50% 120%, #ff5f6d, #3d1460 70%)' },
  { title: 'Fan Community App',      cat: 'product',    tag: 'Product',    year: 2024, featured: true,  sample: true, color: '#22c55e', art: 'linear-gradient(120deg, #e6ffb0, #22c55e 50%, #064e3b)' },
  { title: 'Pop-up Store',           cat: 'branding',   tag: 'Space',      year: 2023, featured: true,  sample: true, color: '#f97316', art: 'radial-gradient(circle at 20% 80%, #fde68a, #f97316 40%, #7c2d12)' },
  { title: 'Game Trailer',           cat: 'production', tag: 'Video',      year: 2023, featured: false, sample: true, color: '#a5b4fc', art: 'linear-gradient(200deg, #eef2ff, #a5b4fc 40%, #312e81)' },
  { title: 'Idol Group Identity',    cat: 'branding',   tag: 'Branding',   year: 2023, featured: false, sample: true, color: '#1a3fe0', art: 'linear-gradient(45deg, #1a3fe0 0 50%, #f4f6fd 50%)' },
  { title: 'Digital Goods Platform', cat: 'product',    tag: 'Product',    year: 2023, featured: false, sample: true, color: '#d0478c', art: 'radial-gradient(circle at 60% 40%, #ffd6e7, #d0478c 55%, #3b0a2a)' },
  { title: 'Live Streaming Visuals', cat: 'production', tag: 'Motion',     year: 2022, featured: false, sample: true, color: '#1a3fe0', art: 'linear-gradient(90deg, #0b0b0d, #1a3fe0, #8aa2ff)' },
];

// Detail-page fields (work.html). Optional per entry; anything missing falls back to the
// placeholder text below so every work has a page now:
//   slug     url id (work.html#slug) — derived from the title if missing
//   lead     one-paragraph overview (EN)      leadJa  the same in Japanese
//   client   client name                       role    what PORTS did
//   images   up to 5 image paths: [hero, wide, pair-left, pair-right, process]
//   process  one sentence about how it was made
Object.assign(window.PORTS_WORKS[0], {
  lead: 'A three-day online festival staged entirely in the browser — a WebGL venue where fans move, cheer and gather around the artists in real time.',
  leadJa: 'ブラウザだけで完結する3日間のオンラインフェス。ファンが自由に歩き回り、声援を送り、アーティストを囲めるWebGLの会場をつくりました。',
  role: 'Direction, WebGL, 3D CG',
  process: 'From a single stage sketch to a venue that holds thousands — lighting, crowd and camera were all tuned live in the browser.',
});
window.PORTS_WORKS.forEach((w) => {
  w.slug = w.slug || w.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  w.lead = w.lead || 'Project overview goes here — what we made, for whom, and how it reached its audience. (sample)';
  w.leadJa = w.leadJa || 'プロジェクトの概要がここに入ります。何を、誰のために、どうつくったか。（サンプル）';
  w.client = w.client || '—';
  w.role = w.role || w.tag;
  w.process = w.process || 'A short note on the process goes here. (sample)';
});

// Image i (0-4) of a work: the real file when given, otherwise a stand-in gradient built from
// the work's own art and colour so each work keeps a recognisable palette.
window.PORTS_WORK_IMG = (w, i) => {
  if (w.images && w.images[i]) return `url("${w.images[i]}") center / cover`;
  const c = w.color || '#1a3fe0';
  return [
    w.art,
    `radial-gradient(circle at 70% 40%, #ffffffaa, ${c} 55%, #0a0f3a)`,
    `linear-gradient(160deg, #0b0b0d, ${c} 70%, #ffffff66)`,
    `radial-gradient(circle at 50% 110%, ${c}, #0b0b0d 75%)`,
    `conic-gradient(from 210deg at 40% 60%, ${c}, #ffffff55, #0a0f3a, ${c})`,
  ][i % 5];
};
