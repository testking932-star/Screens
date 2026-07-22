import http.server
import urllib.request
import urllib.error
import ssl
import sys
import os

PORT = 8085
if len(sys.argv) > 1:
    PORT = int(sys.argv[1])

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/clover-api/'):
            self.handle_proxy('GET')
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/clover-api/'):
            self.handle_proxy('POST')
        else:
            super().do_POST()

    def do_PUT(self):
        if self.path.startswith('/clover-api/'):
            self.handle_proxy('PUT')
        else:
            self.send_error(405, "Method not allowed")

    def do_DELETE(self):
        if self.path.startswith('/clover-api/'):
            self.handle_proxy('DELETE')
        else:
            self.send_error(405, "Method not allowed")

    def handle_proxy(self, method):
        # Extract the remote path
        remote_path = self.path[len('/clover-api'):]
        
        # Determine target host based on X-Clover-Env header
        env = self.headers.get('X-Clover-Env', 'prod')
        base_url = 'https://api.clover.com/v3' if env == 'prod' else 'https://apisandbox.dev.clover.com/v3'
        
        # Build the final URL
        target_url = f"{base_url.rstrip('/')}{remote_path}"
        
        # Forward request headers
        headers = {}
        for key, val in self.headers.items():
            if key.lower() not in ('host', 'content-length', 'connection', 'accept-encoding'):
                headers[key] = val
                
        # Read body if present
        body = None
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length)
            
        # Make the request to Clover
        req = urllib.request.Request(
            target_url,
            data=body,
            headers=headers,
            method=method
        )
        
        context = ssl._create_unverified_context()
        
        try:
            with urllib.request.urlopen(req, context=context) as response:
                self.send_response(response.status)
                # Forward response headers (handle CORS)
                for key, val in response.headers.items():
                    if key.lower() not in ('transfer-encoding', 'content-encoding', 'connection'):
                        self.send_header(key, val)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for key, val in e.headers.items():
                if key.lower() not in ('transfer-encoding', 'content-encoding', 'connection'):
                    self.send_header(key, val)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(f"Proxy error: {e}".encode('utf-8'))

def run_server():
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, ProxyHTTPRequestHandler)
    print(f"Clover Menu App with proxy is running on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
