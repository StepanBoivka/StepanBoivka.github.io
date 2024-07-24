const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const filePath = path.join(process.cwd(), 'public', 'field.geojson');
        const geojson = req.body;

        fs.writeFile(filePath, JSON.stringify(geojson, null, 2), (err) => {
            if (err) {
                res.status(500).json({ error: 'Failed to save file' });
            } else {
                res.status(200).json({ message: 'File saved successfully' });
            }
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

