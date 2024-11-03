const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files from the current directory

// Function to clean up subtitles
function cleanSubtitles(rawSubtitles) {
    const uniqueLines = new Set(); // Using a Set to store unique lines
    return rawSubtitles
        .split('\n')
        .filter(line => 
            !line.match(/^\d+$/) && // Exclude line numbers
            !line.includes('-->') && // Exclude timestamp lines
            line.trim() !== '' // Exclude empty lines
        )
        .map(line => line
            .replace(/<[^>]*>/g, '') // Remove HTML-like tags
            .trim() // Trim whitespace from each line
        )
        .filter(line => {
            // Add the line to the Set if it's not a duplicate
            if (!uniqueLines.has(line) && line.length > 0) {
                uniqueLines.add(line);
                return true;
            }
            return false; // Exclude duplicate lines
        })
        .join('\n'); // Join lines with a newline character
}

// Endpoint to handle requests for subtitles
app.post('/get-subtitles', (req, res) => {
    const videoUrl = req.body.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Command to download the subtitles using yt-dlp
    const command = `yt-dlp --write-auto-subs --skip-download --sub-lang en --output "temp" "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error fetching subtitles: ${stderr}`);
            return res.status(500).json({ error: 'Failed to fetch subtitles' });
        }

        const subtitleFile = 'temp.en.vtt';
        if (fs.existsSync(subtitleFile)) {
            const subtitles = fs.readFileSync(subtitleFile, 'utf-8');
            const cleanedSubtitles = cleanSubtitles(subtitles); // Call the cleanSubtitles function here
            res.json({ subtitles: cleanedSubtitles || 'No subtitles found.' });
            fs.unlinkSync(subtitleFile); // Delete the file after reading
        } else {
            res.json({ subtitles: 'No subtitles found.' });
        }
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});


/////this worked bro i like it
