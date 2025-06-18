To control PTZ cameras, you can use a Python script like this one.

Save it as `ptz.py`:

**Reolink:**

```python
#!/usr/bin/env python3

from onvif import ONVIFCamera
import sys
import time

# Camera credentials
CAMERA_IP = '192.168.xx.yy'
PORT = 80
USERNAME = 'cam-user'
PASSWORD = 'your-password'

def main():
    if len(sys.argv) < 2:
        print("Usage: ptz.py <left|right|up|down|stop>")
        sys.exit(1)

    direction = sys.argv[1].lower()
    if direction not in ['left', 'right', 'up', 'down', 'stop']:
        print("Invalid direction.")
        sys.exit(1)

    # Connect to camera
    cam = ONVIFCamera(CAMERA_IP, PORT, USERNAME, PASSWORD)
    media = cam.create_media_service()
    ptz = cam.create_ptz_service()
    profile = media.GetProfiles()[0]
    token = profile.token

    if direction == 'stop':
        stop = ptz.create_type('Stop')
        stop.ProfileToken = token
        stop.PanTilt = True
        ptz.Stop(stop)
        print("Stopped.")
        return

    move = ptz.create_type('ContinuousMove')
    move.ProfileToken = token

    # Use plain dicts to avoid schema dependency
    move.Velocity = {
        'PanTilt': {'x': 0.0, 'y': 0.0},
        'Zoom': {'x': 0.0}
    }

    if direction == 'left':
        move.Velocity['PanTilt']['x'] = -0.5
    elif direction == 'right':
        move.Velocity['PanTilt']['x'] = 0.5
    elif direction == 'up':
        move.Velocity['PanTilt']['y'] = 0.5
    elif direction == 'down':
        move.Velocity['PanTilt']['y'] = -0.5

    ptz.ContinuousMove(move)
    time.sleep(0.5)

    # Stop after short delay
    stop = ptz.create_type('Stop')
    stop.ProfileToken = token
    stop.PanTilt = True
    ptz.Stop(stop)

    print(f"Moved {direction}.")

if __name__ == '__main__':
    main()

```

And then create a `ptz.sh` script that calls Python:
```bash
#!/bin/bash
echo "Content-type: text/plain"
echo ""
source /usr/local/venvs/onvif/bin/activate

# Parse the query string to extract the 'd' (direction) parameter
direction=$(echo "$QUERY_STRING" | sed -n 's/^.*d=\([^&]*\).*$/\1/p')

# Optional: fallback/default
if [ -z "$direction" ]; then
    echo "Missing direction parameter (?d=left|right|up|down|stop)"
    exit 1
fi

# Call the Python script with the direction
/usr/local/bin/ptz-dach.py "$direction"
```

If you want to make the controls available on your Nginx webserver, you can edit your `/etc/nginx/sites-enabled/default` and add an endpoint like this:

```bash
location /ptz {
    add_header Access-Control-Allow-Origin *;
    fastcgi_pass unix:/var/run/fcgiwrap.socket;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME /usr/local/bin/ptz.sh;
    fastcgi_param QUERY_STRING $query_string;
    fastcgi_param REQUEST_METHOD GET;
}
```

Restart Nginx with:
```bash
sudo nginx -t && sudo systemctl reload nginx
```