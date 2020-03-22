const express = require('express');
const path = require('path');
const port = process.env.PORT || 80;

const app = express();

const COVID19 = require('./modules/COVID19');
const covid19 = new COVID19();

app.use(express.json({

  limit: 10000
}));

app.post('/geo', async (req, res) => {

    const result = await covid19.load();
    res.json(result);
});

app.get('/data', async (req, res) => {

    const result = await covid19.load();
    res.json(result);
});

app.use(express.static(path.join(__dirname,
  'public')));

app.listen(port, () => {
    
    console.log(`Server listening on port: ${port}!`)
});

