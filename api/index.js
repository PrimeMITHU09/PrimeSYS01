const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');

const app = express();
app.use(cors());

app.get('/api', (req, res) => {
  res.send('PrimeSYS API is running on Vercel!');
});

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).send('Missing query');
  try {
    const r = await ytSearch(q);
    const videos = r.videos.slice(0, 8);
    res.json(videos);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/download', async (req, res) => {
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
app.get('/api/proxy/player', (req, res) => {
  const streamId = req.query.stream;
  if (!streamId) return res.status(400).send('No stream ID provided');
  
  const http = require('http');
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
      let html = data;
      html = html.replace(/(href|src)=(['"])(?!http|\/\/|data:)([^'"]+)(['"])/g, '$1=$2http://redforce.live/$3$4');
      html = html.replace('<head>', '<head><base href="http://redforce.live/">');
      res.send(html);
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).send(err.message);
  });
  proxyReq.end();
});

app.get('/api/proxy/image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('No URL provided');
  
  require('http').get(imageUrl, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).send(err.message);
  });
});

// Important for Vercel serverless function: export the express app
module.exports = app;
