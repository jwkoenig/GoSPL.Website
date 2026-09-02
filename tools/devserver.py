"""Static dev server that applies the .htaccess tour rewrites.

`python -m http.server` serves the repo fine but knows nothing about the
Apache rewrite, so /tours/<slug>/ 404s locally and the clean URLs can only be
tested after deploying. This mirrors the rules in .htaccess (minus the HTTPS
redirect) so local dev matches production.

    python tools/devserver.py [port]
"""

import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

TOUR_ROOT = re.compile(r'^/tours/([A-Za-z0-9_-]+)$')
TOUR_INDEX = re.compile(r'^/tours/[A-Za-z0-9_-]+/$')
TOUR_ASSET = re.compile(r'^/tours/[A-Za-z0-9_-]+/(.+)$')


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.sog': 'application/octet-stream',
        '.bin': 'application/octet-stream',
    }

    def do_GET(self):
        path = self.path.partition('?')[0]

        # /tours/<slug> -> /tours/<slug>/   [R=301]
        if TOUR_ROOT.match(path):
            self.send_response(301)
            self.send_header('Location', path + '/')
            self.end_headers()
            return

        # /tours/<slug>/ -> /player/index.html   [internal]
        if TOUR_INDEX.match(path):
            self.path = '/player/index.html'
        else:
            # /tours/<slug>/<asset> -> /player/<asset>   [internal]
            asset = TOUR_ASSET.match(path)
            if asset:
                self.path = '/player/' + asset.group(1)

        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8430
    print(f'serving on http://localhost:{port}/tours/kramer/')
    ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory='.')).serve_forever()
