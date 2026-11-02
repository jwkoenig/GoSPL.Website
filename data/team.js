const BASE = process.env.NEXT_PUBLIC_BASEPATH || ''

// Founder splat headshots. `splat` is the live PLAY tour (embedded on desktop),
// `img` a still of the same framing (shown on mobile, linking to `splat`).
export const FOUNDERS = [
  {
    id: 'nik',
    name: 'Nik Saratow',
    splat: 'https://gospl.io/tours/team_nik/',
    img: `${BASE}/assets/team/nik.jpg`,
  },
  {
    id: 'hannes',
    name: 'Johannes Wolfgang König',
    splat: 'https://gospl.io/tours/team_hannes/',
    img: `${BASE}/assets/team/hannes.jpg`,
  },
]

export const LOCATIONS = [
  {
    id: 'hangar',
    label: 'Production',
    name: 'Studio Hangar',
    place: 'Berlin-Adlershof',
    url: 'https://www.hangar.de/',
    body: 'Our capture stage. A full film studio with room for cars, sets and full-scale builds, plus a turntable rated for up to 3.5 t. This is where the big scans happen.',
  },
  {
    id: 'morean',
    label: 'City office',
    name: 'morean',
    place: 'Berlin',
    url: 'https://morean.de/',
    body: 'Our desk in town, where we meet clients, plan shoots and author tours. Drop by for a coffee and walk through your space before it even exists.',
  },
]
