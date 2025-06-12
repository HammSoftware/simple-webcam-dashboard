
### Simple webcam dashboard ### 

A very easy way to view your RTSP webcam streams directly in your browser, without requiring any plugins.\
Since web browsers don't support RTSP natively, the streams are transcoded to a browser-friendly format (HLS).

Supports any sort of webcam that can output an RTSP video stream.\
All you need is a Linux server running `ffmpeg`.\
For example, a Raspberry Pi 5 can easily handle 12 or more streams simultaneously without breaking a sweat.\
Using `ffmpeg` and `nginx`, we are setting up a small webserver.

Feel free to use and modify this source code any way you like.


### Instructions ###


#### 1. Setup nginx and ffmpeg ####

**a)** Install nginx
```bash
sudo apt update
sudo apt install nginx -y
```

**b)** Create the root folder and apply user rights (insert your user name here):
```bash
sudo mkdir /var/www/html
sudo chown -R YOUR_USER:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

**c)** Copy the **index.html** file into ``/var/www/html``

**c)** Install ffmpeg
```bash
sudo apt install ffmpeg -y
```


#### 2. Setup system services for ffmpeg ####

**a)** Figure out the RTSP URL of your camera.\
Consider logging into the admin interface of your camera to find out the exposed ports or checking the camera manual.\
Typical RTSP URLs can look like this:

Hikvision:
```ini
  rtsp://user:pass@IP:554/Streaming/Channels/101 # Main stream
  rtsp://user:pass@IP:554/Streaming/Channels/102 # Sub stream
```

Reolink:
```ini
  rtsp://user:pass@IP:554/h264Preview_01_main # Main stream
  rtsp://user:pass@IP:554/h264Preview_01_sub # Sub stream
```

Dahua / Amcrest:
```ini
  rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=0 # Main
  rtsp://user:pass@IP:554/cam/realmonitor?channel=1&subtype=1 # Sub
```

Axis:
```ini
  rtsp://user:pass@IP:554/axis-media/media.amp
```

Unifi Protect (Ubiquiti):
```ini
  rtsp://user:pass@IP:7447/<UUID> # Found in Unifi Protect UI
```

ONVIF-compliant cameras (generic):
```ini
  rtsp://user:pass@IP:554/live/ch00_0 # Often default
```

Annke:
```ini
  rtsp://user:pass@IP:554/Streaming/Channels/101 # Hikvision-compatible
```

Foscam:
```ini
  rtsp://user:pass@IP:554/videoMain
```

TP-Link / Tapo:
```ini
  rtsp://user:pass@IP:554/stream1
```

Ezviz:
```ini
  rtsp://user:pass@IP:554/h264
```

**b)** Create the folder for the stream playlists created by ffmpeg (insert your username and usergroup in here):
```bash
sudo mkdir -p /var/www/html/stream/your-camera-name
sudo chown -R YOUR_USER:YOUR_GROUP /var/www/html/stream/your-camera-name
sudo chmod -R 755 /var/www/html/stream/your-camera-name
```

**c)** Create a systemd service to automatically start the streams on system boot:
```bash
sudo nano /etc/systemd/system/ffmpeg-stream-camera-name.service
```

**d)** Paste this and modify it to your needs:
```ini
[Unit]
Description=My camera description
After=network-online.target
Wants=network-online.target

[Service]
User=YOUR_USER
ExecStart=/usr/bin/ffmpeg -rtsp_transport tcp -i rtsp://user:password@192.x.y.z:554/Streaming/Channels/101 \
-c:v copy -c:a aac -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments \
/var/www/html/stream/your-cam-name/stream.m3u8
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**e)** Run:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ffmpeg-stream-fahrradkeller.service
sudo systemctl start ffmpeg-stream-fahrradkeller.service
```

**f)** Add the stream to the camera JSON inside the `index.html`
```json
{
    id: "your-cam-name",
    label: "Your camera name",
    src: "stream/your-cam-name/stream.m3u8"
}
```

#### 3. Test your setup ####
A webserver should now be running at `http://your-local-ip/` and display your camera stream, simply open it in your browser.