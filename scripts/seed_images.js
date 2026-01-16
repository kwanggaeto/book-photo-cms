const fs = require('fs');
const path = require('path');

// Port 3005 to avoid conflict
const API_URL = 'http://localhost:3005/api/upload';
const API_KEY = 'test-secret-key-1234';

const images = [
    'kpop_1_1768552263370.png',
    'kpop_2_1768552279292.png',
    'kpop_3_1768552296967.png',
    'kpop_4_1768552313842.png',
    'kpop_5_1768552332611.png',
    'kpop_6_1768552347706.png',
    'kpop_7_1768552364098.png',
    'kpop_8_1768552379900.png',
    'kpop_9_1768552399808.png',
    'kpop_10_1768552415180.png'
];

const artifactDir = 'C:\\Users\\etern\\.gemini\\antigravity\\brain\\be392588-9168-433f-849e-c9dadb0565aa';

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
            console.error(`Uploaded ${filename}: Failed`, response.status);
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
