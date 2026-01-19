import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        fetchProductDetails(productId);
    } else {
        showError('Brak identyfikatora produktu.');
    }
});

async function fetchProductDetails(id) {
    try {
        // Fetch Product Data
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (productError) throw productError;

        // Fetch Gallery Images
        const { data: images, error: imagesError } = await supabase
            .from('product_images')
            .select('*')
            .eq('product_id', id);

        if (imagesError) console.warn('Error fetching images:', imagesError);

        renderProduct(product, images || []);

    } catch (err) {
        console.error('Error loading product:', err);
        showError('Nie udało się załadować produktu.');
    }
}

function renderProduct(product, images) {
    document.getElementById('product-loading').classList.add('d-none');
    document.getElementById('product-content').classList.remove('d-none');

    // Basic Info
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-price').textContent = `${product.price} PLN`;
    document.getElementById('product-desc').textContent = product.description || 'Brak opisu.';
    document.getElementById('product-location').textContent = product.location || 'Brak danych o lokalizacji';

    // Dynamic SEO Updates
    document.title = `${product.name} - Sklep Informatyczny Kielce`;

    // Update Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = `Kup ${product.name} w Kielcach. Cena: ${product.price} PLN. ${product.description ? product.description.substring(0, 100) + '...' : ''}`;

    // Update Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `${product.name} - Sklep Informatyczny Kielce`;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = `Sprawdź ${product.name}. Cena: ${product.price} PLN. Dostępny w naszym sklepie w Kielcach.`;

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = window.location.href;

    // Update Twitter
    const twTitle = document.querySelector('meta[property="twitter:title"]');
    if (twTitle) twTitle.content = `${product.name} - Sklep Informatyczny Kielce`;

    const twDesc = document.querySelector('meta[property="twitter:description"]');
    if (twDesc) twDesc.content = `Sprawdź ${product.name}. Cena: ${product.price} PLN. Dostępny w naszym sklepie w Kielcach.`;

    const twUrl = document.querySelector('meta[property="twitter:url"]');
    if (twUrl) twUrl.content = window.location.href;

    // Update Images for Social Media (use first image)
    const mainImage = (images && images.length > 0) ? images[0].image_url : (product.image_url || 'https://www.mobilnyit.pl/images/okrlogo.png');

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.content = mainImage;

    const twImage = document.querySelector('meta[property="twitter:image"]');
    if (twImage) twImage.content = mainImage;

    // Gallery Logic
    const track = document.getElementById('carousel-track');
    const thumbsContainer = document.getElementById('gallery-thumbs');
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');

    let allImages = [];
    if (images.length > 0) {
        allImages = images.map(img => img.image_url);
    } else if (product.image_url) {
        allImages = [product.image_url];
    } else {
        allImages = ['images/placeholder.png'];
    }

    let currentIndex = 0;

    // Render Slides into Track
    track.innerHTML = '';
    allImages.forEach((url) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide d-flex justify-content-center align-items-center h-100';
        slide.style.minWidth = '100%';
        slide.style.flexShrink = '0';

        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';

        slide.appendChild(img);
        track.appendChild(slide);
    });

    // Function to update display (slide)
    const updateDisplay = (index) => {
        track.style.transform = `translateX(-${index * 100}%)`;

        // Update thumbs
        document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
            if (i === index) t.classList.add('active');
            else t.classList.remove('active');
        });

        // Scroll thumb into view
        const activeThumb = document.querySelectorAll('.gallery-thumb')[index];
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    // Render Thumbnails
    thumbsContainer.innerHTML = '';
    allImages.forEach((url, index) => {
        const thumb = document.createElement('img');
        thumb.src = url;
        thumb.className = `gallery-thumb img-thumbnail ${index === 0 ? 'active' : ''}`;
        thumb.style.width = '80px';
        thumb.style.height = '80px';
        thumb.style.objectFit = 'cover';

        thumb.addEventListener('click', () => {
            currentIndex = index;
            updateDisplay(currentIndex);
        });

        thumbsContainer.appendChild(thumb);
    });

    // Navigation Buttons
    if (allImages.length > 1) {
        prevBtn.classList.remove('d-none');
        nextBtn.classList.remove('d-none');

        // Remove old listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        newPrevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
            updateDisplay(currentIndex);
        });

        newNextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % allImages.length;
            updateDisplay(currentIndex);
        });
    } else {
        prevBtn.classList.add('d-none');
        nextBtn.classList.add('d-none');
    }

    // Swipe Support
    let touchStartX = 0;
    let touchEndX = 0;
    const imageContainer = document.getElementById('main-image-container');

    // Simple listener addition (no cloning needed for container as we didn't replace it in HTML)
    imageContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    imageContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (allImages.length <= 1) return;

        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe Left -> Next
            currentIndex = (currentIndex + 1) % allImages.length;
            updateDisplay(currentIndex);
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe Right -> Prev
            currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
            updateDisplay(currentIndex);
        }
    }
}

function showError(msg) {
    document.getElementById('product-loading').classList.add('d-none');
    const errorEl = document.getElementById('product-error');
    errorEl.textContent = msg;
    errorEl.classList.remove('d-none');
}
