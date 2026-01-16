const fs = require('fs');
const path = require('path');

// Production URL
const API_URL = 'http://127.0.0.1:8787/api/upload';
// Assuming the same key is used for production as local dev for this exercise
// If 401, we will need to ask the user for the real prod key.
const API_KEY = 'test-secret-key-1234';

const images = [
    'print.png'
];

const artifactDir = 'D:\\Kwangkee_Works\\Projects\\2025_12_책박물관\\Photobooth';

async function uploadImage(filename) {
    const filePath = path.join(artifactDir, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();

    formData.append('file', blob, filename);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`Uploaded ${filename}: Success`);
        } else {
            console.error(`Uploaded ${filename}: Failed`, response.status, await response.text());
        }
    } catch (error) {
        console.error(`Uploaded ${filename}: Error`, error.message);
    }
}

async function run() {
    console.log(`Uploading to ${API_URL}...`);
    for (const image of images) {
        await uploadImage(image);
    }
}

run();
