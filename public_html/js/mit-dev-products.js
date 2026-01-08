import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    fetchPublicProducts();
});

async function fetchPublicProducts() {
    const container = document.getElementById('products-container');

    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aktualnie brak produktów w ofercie.</p></div>';
            return;
        }

        products.forEach(product => {
            const imgUrl = product.image_url || 'images/placeholder.png'; // Make sure you have a placeholder or handle null

            const productCard = `
                <div class="col-lg-4 col-md-6 col-12 mb-4">
                    <div class="card h-100 border-0 shadow-sm product-card">
                        <a href="product-details.html?id=${product.id}" class="text-decoration-none">
                            <div class="card-img-top-wrapper" style="height: 250px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                                <img src="${imgUrl}" class="card-img-top" alt="${product.name}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                            </div>
                        </a>
                        <div class="card-body d-flex flex-column">
                            <div class="mb-2">
                                <span class="badge bg-warning text-dark">${product.category}</span>
                            </div>
                            <h5 class="card-title fw-bold mb-3">
                                <a href="product-details.html?id=${product.id}" class="text-dark text-decoration-none">${product.name}</a>
                            </h5>
                            <p class="card-text text-muted flex-grow-1">${product.description ? product.description.substring(0, 100) + '...' : ''}</p>
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <h4 class="text-primary mb-0 fw-bold">${product.price} PLN</h4>
                                <a href="product-details.html?id=${product.id}" class="btn btn-outline-primary btn-sm">Szczegóły</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += productCard;
        });

    } catch (err) {
        console.error('Error fetching public products:', err);
        container.innerHTML = '<div class="col-12 text-center text-danger">Nie udało się załadować produktów. Spróbuj odświeżyć stronę.</div>';
    }
}
