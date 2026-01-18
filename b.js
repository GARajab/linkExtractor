const https = require('https');
const http = require('http');
const fs = require('fs');
const readline = require('readline');

const TARGET_HOSTS = ['mediafire', 'akia', 'viki', '1file', 'rootz'];

function extractGameName(url) {
    try {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/').filter(Boolean);
        const gameName = segments[segments.length - 1] || segments[segments.length - 2] || 'Unknown';
        return gameName.replace(/-/g, ' ').replace(/\//g, '').trim();
    } catch {
        return 'Unknown Game';
    }
}

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function extractLinks(html) {
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const links = [];
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
        links.push(match[1]);
    }

    return links;
}

function filterFileHostLinks(links) {
    return links.filter(url =>
        TARGET_HOSTS.some(host => url.toLowerCase().includes(host))
    );
}

async function processUrl(url, index, total) {
    console.log(`\n[${index}/${total}] Processing: ${url}`);

    try {
        const html = await fetchPage(url);
        const allLinks = extractLinks(html);
        const fileHostLinks = filterFileHostLinks(allLinks);
        const gameName = extractGameName(url);

        let result = [];
        result.push('\n' + '='.repeat(60));
        result.push(`GAME: ${gameName}`);
        result.push(`SOURCE: ${url}`);
        result.push(`FOUND: ${fileHostLinks.length} links`);
        result.push('='.repeat(60) + '\n');

        if (fileHostLinks.length > 0) {
            fileHostLinks.forEach(link => result.push(link));
            console.log(`✓ Found ${fileHostLinks.length} file hosting links`);
        } else {
            result.push('[No file hosting links found]');
            console.log('⚠ No file hosting links found');
        }

        return result.join('\n');

    } catch (error) {
        console.log(`✗ Error: ${error.message}`);
        return `\n[ERROR fetching ${url}: ${error.message}]\n`;
    }
}

async function main() {
    const inputFile = process.argv[2];
    const outputFile = process.argv[3] || 'extracted-links.txt';

    if (!inputFile) {
        console.log('Usage: node brave.js <input-file> [output-file]');
        console.log('Example: node brave.js urls.txt links.txt');
        console.log('\nThe input file should contain one URL per line.');
        process.exit(1);
    }

    try {
        const fileStream = fs.createReadStream(inputFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const urls = [];
        for await (const line of rl) {
            const url = line.trim();
            if (url && url.startsWith('http')) {
                urls.push(url);
            }
        }

        if (urls.length === 0) {
            console.log('No valid URLs found in input file');
            process.exit(1);
        }

        console.log(`Found ${urls.length} URLs to process\n`);

        let allResults = [];

        for (let i = 0; i < urls.length; i++) {
            const result = await processUrl(urls[i], i + 1, urls.length);
            allResults.push(result);
        }

        // Write all results to file
        fs.writeFileSync(outputFile, allResults.join('\n\n'));

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✓ Processing complete!`);
        console.log(`✓ Results saved to: ${outputFile}`);
        console.log(`✓ Processed ${urls.length} URLs`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();