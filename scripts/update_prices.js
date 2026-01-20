const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const HARDWARE_FILE = path.join(__dirname, '../public_html/js/hardware_data.js');

async function fetchPriceFromOLX(query) {
    const url = `https://www.olx.pl/elektronika/komputery/podzespoly-i-czesci/?q=${encodeURIComponent(query)}`;
    console.log(`Searching OLX for: ${query}...`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        const prices = [];

        // Selectors for OLX prices (these change often, so we try a few generic ones)
        // 1. Look for elements with data-testid="ad-price"
        $('[data-testid="ad-price"]').each((i, el) => {
            const priceText = $(el).text().trim();
            const price = parsePrice(priceText);
            if (price > 0) prices.push(price);
        });

        // 2. Fallback: Look for "zł" in common containers if above fails
        if (prices.length === 0) {
            $('p:contains("zł")').each((i, el) => {
                const text = $(el).text();
                if (text.includes('zł') && text.length < 20) { // Short text likely a price
                    const price = parsePrice(text);
                    if (price > 0) prices.push(price);
                }
            });
        }

        if (prices.length === 0) {
            console.warn(`  No prices found for ${query}`);
            return null;
        }

        // Filter outliers (remove top/bottom 10% if enough data)
        prices.sort((a, b) => a - b);
        let validPrices = prices;
        if (prices.length > 5) {
            validPrices = prices.slice(1, -1); // Remove min and max
        }

        // Calculate average
        const sum = validPrices.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / validPrices.length);

        console.log(`  Found ${prices.length} prices. Avg: ${avg} zł`);
        return avg;

    } catch (err) {
        console.error(`  Error fetching ${query}:`, err.message);
        return null;
    }
}

function parsePrice(text) {
    // Remove "zł", spaces, commas
    const clean = text.replace(/zł/gi, '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(clean);
}

async function updatePrices() {
    console.log('Reading hardware_data.js...');
    let content = fs.readFileSync(HARDWARE_FILE, 'utf8');

    // Extract the array content using regex
    // Matches content between "export const hardwareDatabase = [" and "];"
    const match = content.match(/export const hardwareDatabase = \[\s*([\s\S]*?)\];/);

    if (!match) {
        console.error('Could not parse hardwareDatabase array.');
        return;
    }

    const arrayContent = match[1];

    // Parse individual objects manually to avoid eval/require issues
    // We assume format: { category: '...', name: '...', marketPrice: ... },
    const lines = arrayContent.split('\n').filter(line => line.trim().startsWith('{'));

    const items = lines.map(line => {
        const nameMatch = line.match(/name:\s*'([^']+)'/);
        const catMatch = line.match(/category:\s*'([^']+)'/);
        const priceMatch = line.match(/marketPrice:\s*(\d+)/);

        if (nameMatch && catMatch && priceMatch) {
            return {
                originalLine: line,
                category: catMatch[1],
                name: nameMatch[1],
                marketPrice: parseInt(priceMatch[1])
            };
        }
        return null;
    }).filter(Boolean);

    console.log(`Found ${items.length} items to update.`);

    let newArrayContent = arrayContent;

    for (const item of items) {
        // Add delay to be polite
        await new Promise(r => setTimeout(r, 1000));

        const newPrice = await fetchPriceFromOLX(item.name);

        if (newPrice) {
            // Replace price in the original line
            const regex = new RegExp(`(name:\\s*'${escapeRegExp(item.name)}'.*?marketPrice:\\s*)(\\d+)`);
            newArrayContent = newArrayContent.replace(regex, `$1${newPrice}`);
        }
    }

    // Reconstruct file
    const newFileContent = content.replace(match[1], newArrayContent);

    fs.writeFileSync(HARDWARE_FILE, newFileContent);
    console.log('Done! hardware_data.js updated.');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

updatePrices();
