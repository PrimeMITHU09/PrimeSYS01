const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());

app.get('/api', (req, res) => {
  res.send('PrimeSYS API is running on Vercel!');
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

// Important for Vercel serverless function: export the express app
module.exports = app;
