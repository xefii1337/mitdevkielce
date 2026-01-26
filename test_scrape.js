
async function testScrape() {
    const query = 'RTX 4090';
    const url = `https://www.olx.pl/elektronika/komputery/podzespoly-i-czesci/?q=${encodeURIComponent(query)}`;

    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        console.log(`Fetched ${html.length} bytes.`);

        // Simple regex check for price to see if we got content
        // OLX classes change, but usually "css-..." or data-testid
        if (html.includes('RTX 4090')) {
            console.log('Found product name in HTML.');
        } else {
            console.log('Product name NOT found. Might be blocked or dynamic.');
        }

    } catch (error) {
        console.error('Error fetching:', error.message);
    }
}

testScrape();
