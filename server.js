const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

app.get('/download', async (req, res) => {
  const { url, format } = req.query;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send('Invalid YouTube URL');
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, ''); // clean title

    if (format === 'mp3') {
      res.header('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      ytdl(url, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
    } else {
      res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      ytdl(url, { filter: 'audioandvideo', quality: 'highest' }).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to process download: ' + error.message);
  }
});

const http = require('http');

app.get('/api/proxy/stream', (req, res) => {
  const streamId = req.query.id;
  if (!streamId) return res.status(400).json({ error: 'No stream ID provided' });
  
  const options = {
    hostname: 'redforce.live',
    path: `/player.php?stream=${streamId}`,
    method: 'GET',
    headers: {
      'Referer': 'http://redforce.live/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      const match = data.match(/var primarySource = '(.*?)';/);
      if (match && match[1]) {
        res.json({ streamUrl: match[1] });
      } else {
        res.status(404).json({ error: 'Stream URL not found' });
      }
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
  proxyReq.end();
});

app.get('/api/proxy/image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('No URL provided');
  
  http.get(imageUrl, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).send(err.message);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PrimeSYS Downloader Backend running on port ${PORT}`);
});
