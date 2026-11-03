// Tour URLs in data/ are written as https://gospl.io/tours/<slug>/. The
// production build (served by both beta.gospl.io and gospl.io, basePath '')
// links them root-relative, so each server embeds its own player and tours;
// otherwise beta would show live's tours. `next dev` and the GitHub Pages
// preview have no player, so they keep the absolute gospl.io URL.
const SAME_SERVER = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BASEPATH

export function tourUrl(url) {
  return SAME_SERVER && url ? url.replace(/^https:\/\/gospl\.io(?=\/)/, '') : url
}
