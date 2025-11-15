# OBS WebSocket Text Overlay

A simple web server that allows you to send text messages to OBS via a web interface. Perfect for letting others send messages that appear as overlays in your stream or recording.

## Features

- Clean web interface for submitting text
- Automatic connection to OBS WebSocket
- Text auto-hides after 10 seconds
- Real-time connection status
- Port forwarding friendly

## Prerequisites

- Node.js (v14 or higher)
- OBS Studio with WebSocket server enabled

## OBS Setup

1. Open OBS Studio
2. Go to `Tools` → `WebSocket Server Settings`
3. Check `Enable WebSocket server`
4. Note the port (default: 4455) and password if set
5. Click `OK`

### Create Text Source in OBS

1. In your scene, add a new source: `+` → `Text (GDI+)` or `Text (FreeType 2)`
2. Name it **exactly** `TextOverlay` (or change the `TEXT_SOURCE_NAME` environment variable)
3. Configure the text appearance (font, size, color, etc.)
4. Position it where you want text to appear
5. The source can start hidden - the server will show/hide it automatically

## Installation

```bash
npm install
```

## Configuration

Set environment variables (optional):

```bash
# OBS WebSocket settings
export OBS_HOST=localhost        # OBS WebSocket host
export OBS_PORT=4455            # OBS WebSocket port
export OBS_PASSWORD=            # OBS WebSocket password (if set)
export TEXT_SOURCE_NAME=TextOverlay  # Name of text source in OBS

# Server settings
export PORT=3000                # Web server port
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser to `http://localhost:3000`

3. Forward the port to make it accessible externally:
```bash
# Example with SSH port forwarding
ssh -R 80:localhost:3000 serveo.net

# Or use ngrok
ngrok http 3000

# Or configure your router to forward port 3000
```

4. Share the public URL with anyone you want to send text to your OBS

## How It Works

1. Someone opens the web interface
2. They type a message and click "Send to OBS"
3. The server updates the text source in OBS
4. The text appears for 10 seconds, then automatically hides

## API Endpoints

### POST /api/text
Send text to OBS
```json
{
  "text": "Your message here"
}
```

### GET /api/status
Check connection status
```json
{
  "obsConnected": true,
  "textSourceName": "TextOverlay"
}
```

## Troubleshooting

**"Not connected to OBS"**
- Ensure OBS is running
- Check WebSocket server is enabled in OBS
- Verify host/port/password settings
- Check firewall settings

**"Source 'TextOverlay' not found"**
- Create a text source named "TextOverlay" in your current scene
- Or change `TEXT_SOURCE_NAME` to match your source name

**Text doesn't appear**
- Make sure the text source is in your current active scene
- Check the text source isn't behind other elements
- Verify the text color contrasts with your background

## Customization

Edit `server.js` to change:
- Auto-hide duration (default: 10 seconds)
- Text source behavior
- Connection retry logic

Edit `public/index.html` to customize:
- Web interface appearance
- Form behavior
- Status updates

## License

MIT
