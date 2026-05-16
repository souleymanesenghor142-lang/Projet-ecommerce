// ======================== 1. ÉLÉMENTS DOM ========================
const productsContainer = document.getElementById('productsContainer');
const cartItemsList = document.getElementById('cartItemsList');
const cartItemCountSpan = document.getElementById('cartItemCount');
const cartTotalPriceSpan = document.getElementById('cartTotalPrice');
const clearCartBtn = document.getElementById('clearCartBtn');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const modal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');

// ======================== 2. VARIABLES GLOBALES ========================
let allProducts = [];      // Tous les produits bruts
let cart = [];             // Panier [{id, title, price, image, quantity}]
let currentFilteredProducts = [];

// ======================== 3. CHARGEMENT API ========================
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) throw new Error('Erreur API');
        const data = await response.json();
        allProducts = data;
        currentFilteredProducts = [...allProducts];
        populateCategories();
        applyFiltersAndRender();
    } catch (error) {
        productsContainer.innerHTML = '<div class="loading-spinner">⚠️ Erreur chargement produits. Réessayez.</div>';
        console.error(error);
    }
}

// Extraire catégories uniques pour le select
function populateCategories() {
    const categories = [...new Set(allProducts.map(p => p.category))];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        categorySelect.appendChild(option);
    });
}

// ======================== 4. FILTRES + RECHERCHE + TRI ========================
function applyFiltersAndRender() {
    let filtered = [...allProducts];
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = categorySelect.value;

    // Filtre recherche (titre)
    if (searchTerm) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm));
    }
    // Filtre catégorie
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    // Tri prix
    const sortValue = sortSelect.value;
    if (sortValue === 'price-asc') {
        filtered.sort((a,b) => a.price - b.price);
    } else if (sortValue === 'price-desc') {
        filtered.sort((a,b) => b.price - a.price);
    }

    currentFilteredProducts = filtered;
    renderProducts(currentFilteredProducts);
}

// ======================== 5. AFFICHAGE PRODUITS (createElement, appendChild, innerHTML partiel) ========================
function renderProducts(products) {
    if (!productsContainer) return;
    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="loading-spinner">Aucun produit ne correspond 😕</div>';
        return;
    }
    productsContainer.innerHTML = ''; // vide sans innerHTML? on utilise innerHTML + boucle avec createElement? On utilise innerHTML pour vider puis createElement (mix autorisé)
    // Mais exigence: createElement & appendChild
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.title;
        img.className = 'product-img';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';

        const title = document.createElement('h3');
        title.className = 'product-title';
        title.textContent = product.title.length > 40 ? product.title.slice(0,40)+'…' : product.title;

        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = `${product.price} €`;

        const desc = document.createElement('p');
        desc.className = 'product-desc';
        desc.textContent = product.description.length > 80 ? product.description.slice(0,80)+'…' : product.description;

        const btnDiv = document.createElement('div');
        btnDiv.className = 'card-buttons';

        const addBtn = document.createElement('button');
        addBtn.textContent = '➕ Ajouter';
        addBtn.className = 'btn-primary';
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product);
        });

        const detailBtn = document.createElement('button');
        detailBtn.textContent = '👁️ Détail';
        detailBtn.className = 'btn-outline';
        detailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal(product);
        });

        btnDiv.appendChild(addBtn);
        btnDiv.appendChild(detailBtn);
        infoDiv.appendChild(title);
        infoDiv.appendChild(price);
        infoDiv.appendChild(desc);
        card.appendChild(img);
        card.appendChild(infoDiv);
        card.appendChild(btnDiv);
        productsContainer.appendChild(card);
    });
}

// ======================== 6. GESTION PANIER + LOCALSTORAGE ========================
function saveCartToLocalStorage() {
    localStorage.setItem('ecommerceCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const stored = localStorage.getItem('ecommerceCart');
    if (stored) {
        cart = JSON.parse(stored);
    } else {
        cart = [];
    }
    updateCartDisplay();
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    saveCartToLocalStorage();
    updateCartDisplay();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToLocalStorage();
    updateCartDisplay();
}

function updateCartDisplay() {
    // Nombre d'articles
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartItemCountSpan.textContent = totalItems;
    // Prix total
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotalPriceSpan.textContent = `${totalPrice.toFixed(2)} €`;

    // Affichage liste panier (innerHTML exigé)
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart-msg">🛒 Votre panier est vide.</div>';
        return;
    }
    let htmlContent = '';
    cart.forEach(item => {
        htmlContent += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title.length > 30 ? item.title.slice(0,27)+'…' : item.title}</div>
                    <div class="cart-item-price">${item.price} € x ${item.quantity}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-remove" data-id="${item.id}">Supprimer</button>
                </div>
            </div>
        `;
    });
    cartItemsList.innerHTML = htmlContent;
    // Attacher événements suppression
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });
}

function clearCart() {
    cart = [];
    saveCartToLocalStorage();
    updateCartDisplay();
}

// ======================== 7. MODAL DÉTAIL PRODUIT ========================
function openModal(product) {
    modalBody.innerHTML = `
        <div style="text-align:center">
            <img src="${product.image}" alt="${product.title}" class="modal-product-img" style="max-height:200px;object-fit:contain;">
            <h2>${product.title}</h2>
            <p style="margin:1rem 0"><strong>${product.price} €</strong></p>
            <p>${product.description}</p>
            <p><em>Catégorie : ${product.category}</em></p>
            <button class="btn-primary" id="modalAddToCart" style="margin-top:1rem;">Ajouter au panier</button>
        </div>
    `;
    modal.style.display = 'block';
    const modalAddBtn = document.getElementById('modalAddToCart');
    if (modalAddBtn) {
        modalAddBtn.addEventListener('click', () => {
            addToCart(product);
            modal.style.display = 'none';
        });
    }
}

function closeModalFunc() {
    modal.style.display = 'none';
}

// ======================== 8. MODE SOMBRE ========================
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.textContent = '🌙';
    }
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const darkActive = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', darkActive);
        darkModeToggle.textContent = darkActive ? '☀️' : '🌙';
    });
}

// ======================== 9. ÉVÉNEMENTS (filtres, tri, clearCart) ========================
function attachEvents() {
    searchInput.addEventListener('input', () => applyFiltersAndRender());
    categorySelect.addEventListener('change', () => applyFiltersAndRender());
    sortSelect.addEventListener('change', () => applyFiltersAndRender());
    clearCartBtn.addEventListener('click', clearCart);
    closeModal.addEventListener('click', closeModalFunc);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModalFunc();
    });
}

// ======================== 10. INITIALISATION ========================
function init() {
    loadCartFromStorage();
    fetchProducts();
    attachEvents();
    initDarkMode();
}

init();