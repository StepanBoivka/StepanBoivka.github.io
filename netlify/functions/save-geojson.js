const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod === 'POST') {
        const data = JSON.parse(event.body);
        const filePath = path.join(__dirname, '..', 'public', 'field.geojson');

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File saved successfully!' }),
        };
    } else {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
};
