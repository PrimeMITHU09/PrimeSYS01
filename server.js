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

app.get('/proxy/hls', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL');

  const proxyReq = http.request(url, {
    method: 'GET',
    headers: { 'Referer': 'http://redforce.live/', 'User-Agent': 'Mozilla/5.0' }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // If it's an m3u8 playlist, we need to rewrite the URIs inside it to also go through our proxy
    if (url.includes('.m3u8')) {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        // Rewrite relative and absolute URLs
        const lines = body.split('\n');
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith('#')) {
            let targetUrl = line;
            if (!line.startsWith('http')) {
              targetUrl = baseUrl + line;
            }
            lines[i] = `http://localhost:3000/proxy/hls?url=${encodeURIComponent(targetUrl)}`;
          }
        }
        res.end(lines.join('\n'));
      });
    } else {
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', (err) => res.status(500).send(err.message));
  proxyReq.end();
});

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

app.get('/tv_player', (req, res) => {
  const streamId = req.query.id;
  if (!streamId) return res.status(400).send('No stream ID provided');
  
  const options = {
    hostname: 'redforce.live',
    path: `/player.php?stream=${streamId}`,
    method: 'GET',
    headers: {
      'Referer': 'http://redforce.live/',
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      const match = data.match(/var primarySource = '(.*?)';/);
      if (match && match[1]) {
        const streamUrl = match[1];
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
            <style>
              body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
              video { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <video id="video" controls autoplay muted playsinline></video>
            <script>
              const video = document.getElementById('video');
              const url = "${streamUrl}";
              if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                video.play();
              }
            </script>
          </body>
          </html>
        `);
      } else {
        res.status(404).send('<h1 style="color:white;">Stream not found</h1>');
      }
    });
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
