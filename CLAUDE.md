# Project rules

- **Never use em dashes (U+2014, or its HTML entity) anywhere** - not in site copy, docs, comments or content JSON. Use a plain hyphen `-` instead. `npm run check:emdash` enforces this and runs automatically before every build, so the deploy fails if one slips in.
