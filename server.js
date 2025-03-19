const express = require('express');
const app = express();
const fs = require('fs').promises;
const path = require('path');

app.use(express.json());
app.use(express.static('.'));

// Обробка PUT-запитів для announcements.json
app.put('/data/announcements.json', async (req, res) => {
    try {
        await fs.writeFile(
            path.join(__dirname, 'data', 'announcements.json'),
            JSON.stringify(req.body, null, 2)
        );
        res.sendStatus(200);
    } catch (error) {
        console.error('Error saving announcements:', error);
        res.status(500).send(error.message);
    }
});

app.listen(5500, () => {
    console.log('Server running at http://localhost:5500');
});
