const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const GEOJSON_FILE = path.join(__dirname, 'field.geojson');

app.use(bodyParser.json());

app.post('/save', (req, res) => {
    fs.writeFile(GEOJSON_FILE, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            return res.status(500).send('Error saving file.');
        }
        res.send('File saved.');
    });
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
