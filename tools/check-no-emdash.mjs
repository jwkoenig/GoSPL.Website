// Fails if any tracked text file contains an em dash (U+2014) or its HTML
// entity. House style: use a plain hyphen "-" instead.
// Runs automatically before `npm run build` (prebuild) and via `npm run check:emdash`.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Built from parts so this file doesn't flag itself.
const PATTERN = new RegExp(['\\u' + '2014', '&' + 'mdash;', '&' + '#8212;', '&' + '#x2014;'].join('|'), 'i')
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const hits = []

for (const file of files) {
  let text
  try {
    const buf = readFileSync(file)
    if (buf.includes(0)) continue // binary
    text = buf.toString('utf8')
  } catch {
    continue
  }
  text.split('\n').forEach((line, i) => {
    if (PATTERN.test(line)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`)
  })
}

if (hits.length) {
  console.error('Em dashes found. Replace them with a plain hyphen "-":\n')
  console.error(hits.join('\n'))
  process.exit(1)
}
console.log('No em dashes found.')
