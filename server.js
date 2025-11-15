const express = require('express');
const OBSWebSocket = require('obs-websocket-js').default;
const path = require('path');

const app = express();
const obs = new OBSWebSocket();

// Configuration
const OBS_HOST = process.env.OBS_HOST || 'localhost';
const OBS_PORT = process.env.OBS_PORT || 4455;
const OBS_PASSWORD = process.env.OBS_PASSWORD || '';
const SERVER_PORT = process.env.PORT || 3000;
const TEXT_SOURCE_NAME = process.env.TEXT_SOURCE_NAME || 'TextOverlay';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// OBS connection state
let obsConnected = false;

// Connect to OBS
async function connectToOBS() {
  try {
    await obs.connect(`ws://${OBS_HOST}:${OBS_PORT}`, OBS_PASSWORD);
    obsConnected = true;
    console.log('Connected to OBS WebSocket');
  } catch (error) {
    obsConnected = false;
    console.error('Failed to connect to OBS:', error.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectToOBS, 5000);
  }
}

// Handle OBS disconnection
obs.on('ConnectionClosed', () => {
  obsConnected = false;
  console.log('OBS connection closed, attempting to reconnect...');
  setTimeout(connectToOBS, 2000);
});

// API endpoint to send text to OBS
app.post('/api/text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!obsConnected) {
    return res.status(503).json({ error: 'Not connected to OBS' });
  }

  try {
    // Update the text source
    await obs.call('SetInputSettings', {
      inputName: TEXT_SOURCE_NAME,
      inputSettings: {
        text: text
      }
    });

    // Make the source visible
    await obs.call('SetSceneItemEnabled', {
      sceneName: await getCurrentScene(),
      sceneItemId: await getSceneItemId(TEXT_SOURCE_NAME),
      sceneItemEnabled: true
    });

    // Optional: Auto-hide after 10 seconds
    setTimeout(async () => {
      try {
        await obs.call('SetSceneItemEnabled', {
          sceneName: await getCurrentScene(),
          sceneItemId: await getSceneItemId(TEXT_SOURCE_NAME),
          sceneItemEnabled: false
        });
      } catch (err) {
        console.error('Error hiding text:', err.message);
      }
    }, 10000);

    res.json({ success: true, message: 'Text sent to OBS' });
  } catch (error) {
    console.error('Error updating OBS:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get current scene
async function getCurrentScene() {
  const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
  return currentProgramSceneName;
}

// Get scene item ID by name
async function getSceneItemId(sourceName) {
  const sceneName = await getCurrentScene();
  const { sceneItems } = await obs.call('GetSceneItemList', { sceneName });
  const item = sceneItems.find(item => item.sourceName === sourceName);
  if (!item) {
    throw new Error(`Source "${sourceName}" not found in current scene`);
  }
  return item.sceneItemId;
}

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    obsConnected,
    textSourceName: TEXT_SOURCE_NAME
  });
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
  console.log(`OBS WebSocket: ws://${OBS_HOST}:${OBS_PORT}`);
  console.log(`Text Source Name: ${TEXT_SOURCE_NAME}`);
  connectToOBS();
});
