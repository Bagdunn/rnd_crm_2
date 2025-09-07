// Global variables
let currentPage = 'dashboard';
let currentItemsPage = 1;
let currentPurchasesPage = 1;
let currentTransactionsPage = 1;
let itemsPerPage = 20;
let currentUser = null;
let currentSort = { column: null, direction: 'asc' };

// API base URL
const API_BASE = '/api';

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();
});

// Authentication functions
async function checkAuthentication() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    console.log('Checking authentication, token:', token ? 'Present' : 'Missing');
    
    if (!token) {
        // No token, redirect to login
        console.log('No token found, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Auth verify response:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            console.log('Authentication successful, user:', currentUser);
            updateUserInfo();
            initializeApp();
        } else {
            // Token is invalid, redirect to login
            console.log('Token invalid, redirecting to login');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
    }
}

function updateUserInfo() {
    const userInfoElement = document.querySelector('.user-info span:last-child');
    if (userInfoElement && currentUser) {
        userInfoElement.textContent = currentUser.full_name || currentUser.username;
    }
}

function initializeApp() {
    console.log('Initializing app...');
    initializeNavigation();
    initializeEventListeners();
    loadCategories();
    
    // Show warehouse by default or restore saved page
    const savedPage = localStorage.getItem('currentPage') || 'warehouse';
    console.log('Saved page from localStorage:', savedPage);
    switchPage(savedPage);
}

function logout() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    window.location.href = '/login.html';
}

// API helper function with authentication
async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    console.log('API Request:', url, 'Token:', token ? 'Present' : 'Missing');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, finalOptions);
        
        console.log('API Response:', url, 'Status:', response.status);
        
        // If unauthorized, redirect to login
        if (response.status === 401) {
            console.log('Unauthorized request, redirecting to login');
            logout();
            throw new Error('Unauthorized');
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Navigation
function initializeNavigation() {
    console.log('Initializing navigation...');
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log('Found nav buttons:', navButtons.length);
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            console.log('Navigation clicked:', page);
            switchPage(page);
        });
    });
}

function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
    // Logout button
    document.addEventListener('click', function(e) {
        if (e.target.matches('.logout-btn') || e.target.closest('.logout-btn')) {
            e.preventDefault();
            logout();
        }
    });
    
    // Modal close buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('.modal-close') || e.target.closest('.modal-close')) {
            e.preventDefault();
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });
    
    // Warehouse cells
    document.addEventListener('click', function(e) {
        if (e.target.matches('.warehouse-cell') || e.target.closest('.warehouse-cell')) {
            e.preventDefault();
            const cell = e.target.closest('.warehouse-cell');
            if (cell && cell.dataset.position) {
                selectCell(cell.dataset.position);
            }
        }
    });
    
    // Add item modal button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="showAddItemModal"]') || e.target.closest('[onclick*="showAddItemModal"]')) {
            e.preventDefault();
            showAddItemModal();
        }
    });
    
    // Add preset modal button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="showAddPresetModal"]') || e.target.closest('[onclick*="showAddPresetModal"]')) {
            e.preventDefault();
            showAddPresetModal();
        }
    });
    
    // Add category modal button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="showAddCategoryModal"]') || e.target.closest('[onclick*="showAddCategoryModal"]')) {
            e.preventDefault();
            showAddCategoryModal();
        }
    });
    
    // Purchase request modal button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="showPurchaseRequestModal"]') || e.target.closest('[onclick*="showPurchaseRequestModal"]')) {
            e.preventDefault();
            showPurchaseRequestModal();
        }
    });
    
    // Add to warehouse modal button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="showAddToWarehouseModal"]') || e.target.closest('[onclick*="showAddToWarehouseModal"]')) {
            e.preventDefault();
            const cellId = e.target.dataset.cellId || '';
            showAddToWarehouseModal(cellId);
        }
    });
    
    // Filter dropdowns
    document.addEventListener('change', function(e) {
        if (e.target.matches('#category-filter, #quantity-filter')) {
            filterItems();
        } else if (e.target.matches('#purchase-status-filter')) {
            filterPurchases();
        } else if (e.target.matches('#transaction-type-filter')) {
            filterTransactions();
        }
    });
    
    // Remove property buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="removeProperty"]') || e.target.closest('[onclick*="removeProperty"]')) {
            e.preventDefault();
            removeProperty(e.target);
        }
    });
    
    // Add property button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="addProperty"]') || e.target.closest('[onclick*="addProperty"]')) {
            e.preventDefault();
            addProperty();
        }
    });
    
    // Remove preset item buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="removePresetItem"]') || e.target.closest('[onclick*="removePresetItem"]')) {
            e.preventDefault();
            removePresetItem(e.target);
        }
    });
    
    // Add preset item button
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="addPresetItem"]') || e.target.closest('[onclick*="addPresetItem"]')) {
            e.preventDefault();
            addPresetItem();
        }
    });
    
    // Cancel buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="closeModal"]') || e.target.closest('[onclick*="closeModal"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            if (onclick && onclick.includes('closeModal')) {
                const modalId = onclick.match(/closeModal\('([^']+)'\)/)?.[1];
                if (modalId) {
                    closeModal(modalId);
                }
            }
        }
    });
    
    // Dynamic buttons in tables and lists
    document.addEventListener('click', function(e) {
        // Edit item buttons
        if (e.target.matches('[onclick*="editItem"]') || e.target.closest('[onclick*="editItem"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const itemId = onclick.match(/editItem\((\d+)\)/)?.[1];
            if (itemId) {
                editItem(parseInt(itemId));
            }
        }
        
        // Delete item buttons
        if (e.target.matches('[onclick*="deleteItem"]') || e.target.closest('[onclick*="deleteItem"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const itemId = onclick.match(/deleteItem\((\d+)\)/)?.[1];
            if (itemId) {
                deleteItem(parseInt(itemId));
            }
        }
        
        // Withdraw item buttons
        if (e.target.matches('[onclick*="withdrawItem"]') || e.target.closest('[onclick*="withdrawItem"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const match = onclick.match(/withdrawItem\((\d+),\s*'([^']+)',\s*(\d+)\)/);
            if (match) {
                const [, itemId, itemName, quantity] = match;
                withdrawItem(parseInt(itemId), itemName, parseInt(quantity));
            }
        }
        
        // Edit category buttons
        if (e.target.matches('[onclick*="editCategory"]') || e.target.closest('[onclick*="editCategory"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const categoryId = onclick.match(/editCategory\((\d+)\)/)?.[1];
            if (categoryId) {
                editCategory(parseInt(categoryId));
            }
        }
        
        // Delete category buttons
        if (e.target.matches('[onclick*="deleteCategory"]') || e.target.closest('[onclick*="deleteCategory"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const categoryId = onclick.match(/deleteCategory\((\d+)\)/)?.[1];
            if (categoryId) {
                deleteCategory(parseInt(categoryId));
            }
        }
        
        // Change item color buttons
        if (e.target.matches('[onclick*="changeItemColor"]') || e.target.closest('[onclick*="changeItemColor"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            console.log('Change color onclick:', onclick);
            const match = onclick.match(/changeItemColor\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                const [, itemId, cellId] = match;
                console.log('Change color match:', { itemId, cellId });
                changeItemColor(parseInt(itemId), cellId);
            } else {
                console.warn('No match for changeItemColor:', onclick);
            }
        }
        
        // Remove item from cell buttons
        if (e.target.matches('[onclick*="removeItemFromCell"]') || e.target.closest('[onclick*="removeItemFromCell"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            console.log('Remove item onclick:', onclick);
            const match = onclick.match(/removeItemFromCell\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                const [, cellId, itemId] = match;
                console.log('Remove item match:', { cellId, itemId });
                removeItemFromCell(cellId, parseInt(itemId));
            } else {
                console.warn('No match for removeItemFromCell:', onclick);
            }
        }
        
        // Update purchase status buttons
        if (e.target.matches('[onclick*="updatePurchaseStatus"]') || e.target.closest('[onclick*="updatePurchaseStatus"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const match = onclick.match(/updatePurchaseStatus\((\d+),\s*'([^']+)'\)/);
            if (match) {
                const [, requestId, status] = match;
                updatePurchaseStatus(parseInt(requestId), status);
            }
        }
        
        // Complete purchase buttons
        if (e.target.matches('[onclick*="completePurchase"]') || e.target.closest('[onclick*="completePurchase"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const requestId = onclick.match(/completePurchase\((\d+)\)/)?.[1];
            if (requestId) {
                completePurchase(parseInt(requestId));
            }
        }
        
        // Delete purchase buttons
        if (e.target.matches('[onclick*="deletePurchase"]') || e.target.closest('[onclick*="deletePurchase"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const requestId = onclick.match(/deletePurchase\((\d+)\)/)?.[1];
            if (requestId) {
                deletePurchase(parseInt(requestId));
            }
        }
        
        // Preset buttons
        if (e.target.matches('[onclick*="checkPresetAvailability"]') || e.target.closest('[onclick*="checkPresetAvailability"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const presetId = onclick.match(/checkPresetAvailability\((\d+)\)/)?.[1];
            if (presetId) {
                checkPresetAvailability(parseInt(presetId));
            }
        }
        
        if (e.target.matches('[onclick*="withdrawFromPreset"]') || e.target.closest('[onclick*="withdrawFromPreset"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const presetId = onclick.match(/withdrawFromPreset\((\d+)\)/)?.[1];
            if (presetId) {
                withdrawFromPreset(parseInt(presetId));
            }
        }
        
        if (e.target.matches('[onclick*="editPreset"]') || e.target.closest('[onclick*="editPreset"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const presetId = onclick.match(/editPreset\((\d+)\)/)?.[1];
            if (presetId) {
                editPreset(parseInt(presetId));
            }
        }
        
        if (e.target.matches('[onclick*="deletePreset"]') || e.target.closest('[onclick*="deletePreset"]')) {
            e.preventDefault();
            const onclick = e.target.getAttribute('onclick') || e.target.closest('[onclick]')?.getAttribute('onclick');
            const presetId = onclick.match(/deletePreset\((\d+)\)/)?.[1];
            if (presetId) {
                deletePreset(parseInt(presetId));
            }
        }
    });
    
    console.log('Event listeners initialized');
}

function initializeTableSorting() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            sortItems(column);
        });
    });
}

function sortItems(column) {
    // Toggle direction if same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Update visual indicators
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.getAttribute('data-sort') === column) {
            th.classList.add(`sort-${currentSort.direction}`);
        }
    });
    
    // Reload items with sorting
    loadItems(currentItemsPage);
}

function switchPage(page) {
    console.log('Switching to page:', page);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected page and activate nav button
    const targetPage = document.getElementById(page);
    const targetButton = document.querySelector(`[data-page="${page}"]`);
    
    console.log('Target page element:', targetPage);
    console.log('Target button element:', targetButton);
    
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Page element not found:', page);
    }
    
    if (targetButton) {
        targetButton.classList.add('active');
    } else {
        console.error('Button element not found for page:', page);
    }
    
    currentPage = page;
    
    // Save current page to localStorage
    localStorage.setItem('currentPage', page);
    
    // Load page-specific content
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'items':
            loadItems();
            // Initialize sorting after a short delay to ensure DOM is ready
            setTimeout(() => {
                initializeTableSorting();
            }, 100);
            break;
        case 'presets':
            loadPresets();
            break;
        case 'purchases':
            loadPurchases();
            break;
        case 'transactions':
            loadTransactions();
            break;
        case 'categories':
            loadCategoriesPage();
            break;
        case 'warehouse':
            loadWarehouse();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        // Load categories with stats in one request
        const categoriesStatsResponse = await apiRequest(`${API_BASE}/categories/stats/all`);
        if (!categoriesStatsResponse) return;
        const categoriesStats = await categoriesStatsResponse.json();
        
        // Update dashboard stats
        let totalComponents = 0;
        let totalTools = 0;
        let lowStockCount = 0;
        
        categoriesStats.forEach(category => {
            if (category.name === 'Компоненти') {
                totalComponents = category.total_items || 0;
            } else if (category.name === 'Інструменти') {
                totalTools = category.total_items || 0;
            }
            lowStockCount += category.low_stock_count || 0;
        });
        
        document.getElementById('total-components').textContent = totalComponents;
        document.getElementById('total-tools').textContent = totalTools;
        document.getElementById('low-stock').textContent = lowStockCount;
        
        // Load pending purchase requests
        const purchasesResponse = await apiRequest(`${API_BASE}/purchase-requests?status=pending&limit=1000`);
        const purchasesData = await purchasesResponse.json();
        document.getElementById('pending-requests').textContent = purchasesData.requests.length;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Помилка завантаження даних', 'error');
    }
}

// Items Management
async function loadItems(page = 1) {
    try {
        // Load categories for filter
        await loadCategoriesForFilter();
        
        const filters = getItemFilters();
        const queryParams = new URLSearchParams({
            page: page,
            limit: itemsPerPage,
            ...filters
        });
        
        // Add sorting parameters
        if (currentSort.column) {
            queryParams.append('sort', currentSort.column);
            queryParams.append('order', currentSort.direction);
        }
        
        const response = await apiRequest(`${API_BASE}/items?${queryParams}`);
        if (!response) return;
        const data = await response.json();
        
        renderItemsTable(data.items);
        renderPagination(data.pagination, 'items-pagination', loadItems);
        
    } catch (error) {
        console.error('Error loading items:', error);
        showToast('Помилка завантаження компонентів', 'error');
    }
}

function getItemFilters() {
    const filters = {};
    
    const category = document.getElementById('category-filter').value;
    if (category) filters.category = category;
    
    const search = document.getElementById('search-filter').value;
    if (search) filters.search = search;
    
    const location = document.getElementById('location-filter').value;
    if (location) filters.location = location;
    
    const quantity = document.getElementById('quantity-filter').value;
    if (quantity) {
        if (quantity === 'available') filters.quantity_min = 5;
        else if (quantity === 'low') filters.quantity_max = 4;
        else if (quantity === 'none') filters.quantity_max = 0;
    }
    
    return filters;
}

function renderItemsTable(items) {
    const tbody = document.getElementById('items-table-body');
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Немає компонентів</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        
        // Quantity class for styling
        let quantityClass = 'quantity-available';
        if (item.quantity === 0) quantityClass = 'quantity-none';
        else if (item.quantity < 5) quantityClass = 'quantity-low';
        
        // Properties display
        const properties = item.properties ? Object.entries(item.properties)
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>') : '';
        
        row.innerHTML = `
            <td><strong>${item.name}</strong><br><small>${item.description || ''}</small></td>
            <td>${item.category_name}</td>
            <td class="${quantityClass}">${item.quantity}</td>
            <td>${item.location || '-'}</td>
            <td><small>${properties || '-'}</small></td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="editItem(${item.id})">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn btn-small btn-danger" onclick="withdrawItem(${item.id}, '${item.name}', ${item.quantity})">
                    <span class="material-icons">remove_shopping_cart</span>
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteItem(${item.id})">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function filterItems() {
    currentItemsPage = 1;
    loadItems(1);
}

// Presets Management
async function loadPresets() {
    try {
        const response = await apiRequest(`${API_BASE}/presets`);
        const presets = await response.json();
        
        renderPresetsGrid(presets);
        
    } catch (error) {
        console.error('Error loading presets:', error);
        showToast('Помилка завантаження пресетів', 'error');
    }
}

function renderPresetsGrid(presets) {
    const grid = document.getElementById('presets-grid');
    grid.innerHTML = '';
    
    if (presets.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;">Немає пресетів</div>';
        return;
    }
    
    presets.forEach(preset => {
        const card = document.createElement('div');
        card.className = 'preset-card';
        
        // Generate components list
        let componentsHtml = '';
        if (preset.items && preset.items.length > 0) {
            componentsHtml = '<div class="preset-components">';
            preset.items.forEach(item => {
                componentsHtml += `
                    <div class="preset-component-item">
                        <span class="preset-component-name">${item.name}</span>
                        <span class="preset-component-quantity">${item.quantity} шт.</span>
                    </div>
                `;
            });
            componentsHtml += '</div>';
        } else {
            componentsHtml = '<div class="preset-components"><div style="text-align: center; color: #7f8c8d; font-size: 12px; padding: 20px;">Немає компонентів</div></div>';
        }
        
        card.innerHTML = `
            <div class="preset-header">
                <h3>${preset.name}</h3>
                <p>${preset.description || 'Без опису'}</p>
            </div>
            <div class="preset-content">
                ${componentsHtml}
                <div class="preset-actions">
                    <button class="btn btn-secondary" onclick="checkPresetAvailability(${preset.id})">
                        <span class="material-icons">check_circle</span>
                        Перевірити
                    </button>
                    <button class="btn btn-primary" onclick="withdrawFromPreset(${preset.id})">
                        <span class="material-icons">shopping_cart</span>
                        Списати
                    </button>
                    <button class="btn btn-secondary" onclick="editPreset(${preset.id})">
                        <span class="material-icons">edit</span>
                        Редагувати
                    </button>
                    <button class="btn btn-danger" onclick="deletePreset(${preset.id})">
                        <span class="material-icons">delete</span>
                        Видалити
                    </button>
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Purchases Management
async function loadPurchases(page = 1) {
    try {
        const filters = getPurchaseFilters();
        const queryParams = new URLSearchParams({
            page: page,
            limit: itemsPerPage,
            ...filters
        });
        
        const response = await apiRequest(`${API_BASE}/purchase-requests?${queryParams}`);
        const data = await response.json();
        
        renderPurchasesTable(data.requests);
        renderPagination(data.pagination, 'purchases-pagination', loadPurchases);
        
    } catch (error) {
        console.error('Error loading purchases:', error);
        showToast('Помилка завантаження закупівель', 'error');
    }
}

function getPurchaseFilters() {
    const filters = {};
    
    const status = document.getElementById('purchase-status-filter').value;
    if (status) filters.status = status;
    
    const search = document.getElementById('purchase-search').value;
    if (search) filters.search = search;
    
    return filters;
}

function renderPurchasesTable(requests) {
    const tbody = document.getElementById('purchases-table-body');
    tbody.innerHTML = '';
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Немає запитів на закупівлю</td></tr>';
        return;
    }
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        
        const statusClass = `status-${request.status}`;
        const statusText = getStatusText(request.status);
        
        row.innerHTML = `
            <td><strong>${request.category_name || 'Категорія не вказана'}</strong><br><small>${request.description || ''}</small></td>
            <td>${request.units_count || 1}</td>
            <td>${request.requester}</td>
            <td>${request.deadline ? new Date(request.deadline).toLocaleDateString('uk-UA') : '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                ${request.status === 'pending' ? `
                    <button class="btn btn-small btn-secondary" onclick="updatePurchaseStatus(${request.id}, 'approved')">
                        <span class="material-icons">check</span>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="updatePurchaseStatus(${request.id}, 'cancelled')">
                        <span class="material-icons">close</span>
                    </button>
                ` : ''}
                ${request.status === 'approved' ? `
                    <button class="btn btn-small btn-primary" onclick="completePurchase(${request.id})">
                        <span class="material-icons">done</span>
                    </button>
                ` : ''}
                <button class="btn btn-small btn-danger" onclick="deletePurchase(${request.id})">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Очікує',
        'approved': 'Затверджено',
        'completed': 'Завершено',
        'cancelled': 'Скасовано'
    };
    return statusMap[status] || status;
}

function filterPurchases() {
    currentPurchasesPage = 1;
    loadPurchases(1);
}

// Transactions Management
async function loadTransactions(page = 1) {
    try {
        const filters = getTransactionFilters();
        const queryParams = new URLSearchParams({
            page: page,
            limit: itemsPerPage,
            ...filters
        });
        
        const response = await apiRequest(`${API_BASE}/transactions?${queryParams}`);
        const data = await response.json();
        
        renderTransactionsTable(data.transactions);
        renderPagination(data.pagination, 'transactions-pagination', loadTransactions);
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Помилка завантаження транзакцій', 'error');
    }
}

function getTransactionFilters() {
    const filters = {};
    
    const type = document.getElementById('transaction-type-filter').value;
    if (type) filters.type = type;
    
    const user = document.getElementById('transaction-user-filter').value;
    if (user) filters.user_name = user;
    
    return filters;
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Немає транзакцій</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const typeText = transaction.type === 'withdrawal' ? 'Списання' : 'Додавання';
        const typeClass = transaction.type === 'withdrawal' ? 'text-danger' : 'text-success';
        
        row.innerHTML = `
            <td>${new Date(transaction.created_at).toLocaleString('uk-UA')}</td>
            <td>${transaction.item_name}</td>
            <td class="${typeClass}">${typeText}</td>
            <td>${transaction.quantity}</td>
            <td>${transaction.user_name}</td>
            <td><small>${transaction.purpose || '-'}</small></td>
        `;
        
        tbody.appendChild(row);
    });
}

function filterTransactions() {
    currentTransactionsPage = 1;
    loadTransactions(1);
}

// Pagination
function renderPagination(pagination, containerId, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (pagination.pages <= 1) return;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '←';
    prevBtn.disabled = pagination.page <= 1;
    prevBtn.onclick = () => loadFunction(pagination.page - 1);
    container.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.pages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === pagination.page ? 'active' : '';
        pageBtn.onclick = () => loadFunction(i);
        container.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '→';
    nextBtn.disabled = pagination.page >= pagination.pages;
    nextBtn.onclick = () => loadFunction(pagination.page + 1);
    container.appendChild(nextBtn);
}

// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Add Item Modal
function showAddItemModal() {
    showModal('add-item-modal');
    loadCategoriesForSelect();
}

async function loadCategoriesForSelect() {
    try {
        const response = await apiRequest(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const select = document.getElementById('item-category');
        select.innerHTML = '<option value="">Виберіть категорію</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoriesForEditSelect() {
    try {
        const response = await apiRequest(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const select = document.getElementById('edit-item-category');
        select.innerHTML = '<option value="">Виберіть категорію</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading categories for edit:', error);
    }
}

async function loadCategoriesForFilter() {
    try {
        const response = await apiRequest(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const select = document.getElementById('category-filter');
        if (select) {
            // Keep the first option (Всі категорії)
            const firstOption = select.querySelector('option[value=""]');
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories for filter:', error);
    }
}

// Add Property
function addProperty() {
    const container = document.getElementById('properties-container');
    const propertyRow = document.createElement('div');
    propertyRow.className = 'property-row';
    
    propertyRow.innerHTML = `
        <input type="text" placeholder="Ключ" class="property-key">
        <input type="text" placeholder="Значення" class="property-value">
        <button type="button" class="btn btn-small btn-danger" onclick="removeProperty(this)">
            <span class="material-icons">remove</span>
        </button>
    `;
    
    container.appendChild(propertyRow);
}

function removeProperty(button) {
    button.parentElement.remove();
}

// Edit Property functions
function addEditProperty() {
    const container = document.getElementById('edit-properties-container');
    const propertyRow = document.createElement('div');
    propertyRow.className = 'property-row';
    propertyRow.innerHTML = `
        <input type="text" placeholder="Ключ" class="edit-property-key">
        <input type="text" placeholder="Значення" class="edit-property-value">
        <button type="button" class="btn btn-small btn-danger" onclick="removeEditProperty(this)">
            <span class="material-icons">remove</span>
        </button>
    `;
    container.appendChild(propertyRow);
}

function removeEditProperty(button) {
    button.parentElement.remove();
}

function loadEditProperties(properties) {
    const container = document.getElementById('edit-properties-container');
    container.innerHTML = '';
    
    Object.entries(properties).forEach(([key, value]) => {
        const propertyRow = document.createElement('div');
        propertyRow.className = 'property-row';
        propertyRow.innerHTML = `
            <input type="text" placeholder="Ключ" class="edit-property-key" value="${key}">
            <input type="text" placeholder="Значення" class="edit-property-value" value="${value}">
            <button type="button" class="btn btn-small btn-danger" onclick="removeEditProperty(this)">
                <span class="material-icons">remove</span>
            </button>
        `;
        container.appendChild(propertyRow);
    });
}

// Add Item Form
const addItemForm = document.getElementById('add-item-form');
if (addItemForm) {
    addItemForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this);
        const itemData = {
            name: formData.get('name'),
            category_id: parseInt(formData.get('category_id')),
            description: formData.get('description'),
            quantity: parseInt(formData.get('quantity')),
            location: formData.get('location'),
            properties: {}
        };
        
        // Build properties object
        const propertyRows = document.querySelectorAll('.property-row');
        console.log('Found property rows:', propertyRows.length);
        propertyRows.forEach((row, index) => {
            const keyInput = row.querySelector('.property-key');
            const valueInput = row.querySelector('.property-value');
            
            console.log(`Property row ${index}:`, { keyInput, valueInput });
            
            if (keyInput && valueInput) {
                const key = keyInput.value.trim();
                const value = valueInput.value.trim();
                if (key && value) {
                    itemData.properties[key] = value;
                }
            } else {
                console.warn(`Property row ${index} missing inputs:`, { keyInput, valueInput });
            }
        });
        
        const response = await apiRequest(`${API_BASE}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });
        
        if (response.ok) {
            showToast('Компонент успішно додано', 'success');
            closeModal('add-item-modal');
            this.reset();
            document.getElementById('properties-container').innerHTML = `
                <div class="property-row">
                    <input type="text" placeholder="Ключ" class="property-key">
                    <input type="text" placeholder="Значення" class="property-value">
                    <button type="button" class="btn btn-small btn-danger" onclick="removeProperty(this)">
                        <span class="material-icons">remove</span>
                    </button>
                </div>
            `;
            
            if (currentPage === 'items') {
                loadItems(currentItemsPage);
            }
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
        } catch (error) {
            console.error('Error adding item:', error);
            showToast('Помилка додавання компонента', 'error');
        }
    });
} else {
    console.error('Add item form not found');
}

// Withdraw Item Modal
function withdrawItem(itemId, itemName, currentQuantity) {
    document.getElementById('withdraw-item-name').value = itemName;
    document.getElementById('withdraw-quantity').max = currentQuantity;
    document.getElementById('withdraw-quantity').value = 1;
    showModal('withdraw-item-modal');
}

// Withdraw Item Form
document.getElementById('withdraw-item-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const withdrawData = {
            quantity: parseInt(formData.get('quantity')),
            purpose: formData.get('purpose'),
            user_name: formData.get('user_name')
        };
        
        const itemId = this.dataset.itemId;
        
        const response = await apiRequest(`${API_BASE}/items/${itemId}/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(withdrawData)
        });
        
        if (response.ok) {
            showToast('Компонент успішно списано', 'success');
            closeModal('withdraw-item-modal');
            this.reset();
            
            if (currentPage === 'items') {
                loadItems(currentItemsPage);
            }
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error withdrawing item:', error);
        showToast('Помилка списання компонента', 'error');
    }
});

// Edit Item Form
document.getElementById('edit-item-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const itemData = {
            name: formData.get('name'),
            category_id: parseInt(formData.get('category_id')),
            description: formData.get('description'),
            quantity: parseInt(formData.get('quantity')),
            location: formData.get('location')
        };
        
        // Collect properties
        const properties = {};
        const propertyKeys = document.querySelectorAll('#edit-properties-container .edit-property-key');
        const propertyValues = document.querySelectorAll('#edit-properties-container .edit-property-value');
        
        for (let i = 0; i < propertyKeys.length; i++) {
            const key = propertyKeys[i].value.trim();
            const value = propertyValues[i].value.trim();
            if (key && value) {
                properties[key] = value;
            }
        }
        
        itemData.properties = properties;
        
        const itemId = formData.get('id');
        
        const response = await apiRequest(`${API_BASE}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemData)
        });
        
        if (response.ok) {
            showToast('Компонент успішно оновлено', 'success');
            closeModal('edit-item-modal');
            this.reset();
            
            if (currentPage === 'items') {
                loadItems(currentItemsPage);
            }
            if (currentPage === 'warehouse') {
                loadWarehouse();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating item:', error);
        showToast('Помилка оновлення компонента', 'error');
    }
});

// Add Preset Modal
function showAddPresetModal() {
    showModal('add-preset-modal');
}

// Add Preset Item
function addPresetItem() {
    const container = document.getElementById('preset-items-container');
    const itemRow = document.createElement('div');
    itemRow.className = 'preset-item-row';
    
    itemRow.innerHTML = `
        <select class="preset-item-category" required>
            <option value="">Виберіть категорію</option>
            ${window.categories ? window.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('') : ''}
        </select>
        <input type="number" placeholder="Кількість" class="preset-item-quantity" min="1" required>
        <input type="text" placeholder="Вимоги/специфікації" class="preset-item-requirements">
        <input type="text" placeholder="Примітки" class="preset-item-notes">
        <button type="button" class="btn btn-small btn-danger" onclick="removePresetItem(this)">
            <span class="material-icons">remove</span>
        </button>
    `;
    
    container.appendChild(itemRow);
}

function removePresetItem(button) {
    button.parentElement.remove();
}

// Add Preset Form
document.getElementById('add-preset-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const presetData = {
            name: formData.get('name'),
            description: formData.get('description'),
            items: []
        };
        
        // Build items array
        const itemRows = document.querySelectorAll('.preset-item-row');
        itemRows.forEach(row => {
            const categoryId = row.querySelector('.preset-item-category').value;
            const quantity = parseInt(row.querySelector('.preset-item-quantity').value);
            const requirements = row.querySelector('.preset-item-requirements').value.trim();
            const notes = row.querySelector('.preset-item-notes').value.trim();
            
            if (categoryId && quantity) {
                presetData.items.push({
                    category_id: parseInt(categoryId),
                    quantity_needed: quantity,
                    requirements: requirements,
                    notes: notes
                });
            }
        });
        
        if (presetData.items.length === 0) {
            showToast('Додайте хоча б один компонент', 'error');
            return;
        }
        
        const response = await apiRequest(`${API_BASE}/presets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(presetData)
        });
        
        if (response.ok) {
            showToast('Пресет успішно створено', 'success');
            closeModal('add-preset-modal');
            this.reset();
            document.getElementById('preset-items-container').innerHTML = `
                <div class="preset-item-row">
                    <select class="preset-item-category" required>
                        <option value="">Виберіть категорію</option>
                        ${window.categories ? window.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('') : ''}
                    </select>
                    <input type="number" placeholder="Кількість" class="preset-item-quantity" min="1" required>
                    <input type="text" placeholder="Вимоги/специфікації" class="preset-item-requirements">
                    <input type="text" placeholder="Примітки" class="preset-item-notes">
                    <button type="button" class="btn btn-small btn-danger" onclick="removePresetItem(this)">
                        <span class="material-icons">remove</span>
                    </button>
                </div>
            `;
            
            if (currentPage === 'presets') {
                loadPresets();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding preset:', error);
        showToast('Помилка створення пресету', 'error');
    }
});

// Purchase Request Modal
function showPurchaseRequestModal() {
    showModal('purchase-request-modal');
}

// Purchase Request Form
document.getElementById('purchase-request-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const purchaseData = {
            category_id: parseInt(formData.get('category_id')),
            units_count: parseInt(formData.get('units_count')),
            description: formData.get('description'),
            deadline: formData.get('deadline') || null,
            requester: formData.get('requester'),
            notes: formData.get('notes')
        };
        
        const response = await apiRequest(`${API_BASE}/purchase-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        });
        
        if (response.ok) {
            showToast('Запит на закупівлю успішно створено', 'success');
            closeModal('purchase-request-modal');
            this.reset();
            
            if (currentPage === 'purchases') {
                loadPurchases(currentPurchasesPage);
            }
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error creating purchase request:', error);
        showToast('Помилка створення запиту на закупівлю', 'error');
    }
});

// Preset Functions
async function checkPresetAvailability(presetId) {
    try {
        const response = await apiRequest(`${API_BASE}/presets/${presetId}/check`);
        const availability = await response.json();
        
        let message = 'Перевірка наявності:\n\n';
        availability.forEach(item => {
            const status = item.status === 'sufficient' ? '✅ Достатньо' : 
                          item.status === 'low' ? '⚠️ Мало' : '❌ Немає';
            message += `${item.category_name}: ${status}\n`;
            if (item.requirements) {
                message += `   Вимоги: ${item.requirements}\n`;
            }
        });
        
        alert(message);
        
    } catch (error) {
        console.error('Error checking preset availability:', error);
        showToast('Помилка перевірки наявності', 'error');
    }
}

async function withdrawFromPreset(presetId) {
    const user_name = prompt('Введіть ваше ім\'я:');
    if (!user_name) return;
    
    const purpose = prompt('Введіть мету використання:');
    if (!purpose) return;
    
    try {
        const response = await apiRequest(`${API_BASE}/presets/${presetId}/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_name, purpose })
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast('Компоненти успішно списано з пресету', 'success');
            
            // Refresh data
            if (currentPage === 'presets') {
                loadPresets();
            }
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error withdrawing from preset:', error);
        showToast('Помилка списання з пресету', 'error');
    }
}

// Purchase Functions
async function updatePurchaseStatus(requestId, status) {
    try {
        const response = await apiRequest(`${API_BASE}/purchase-requests/${requestId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast(`Статус запиту оновлено на "${getStatusText(status)}"`, 'success');
            loadPurchases(currentPurchasesPage);
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating purchase status:', error);
        showToast('Помилка оновлення статусу', 'error');
    }
}

async function completePurchase(requestId) {
    const item_name = prompt('Введіть назву отриманого компонента:');
    if (!item_name) return;
    
    const quantity_received = prompt('Введіть отриману кількість:');
    if (!quantity_received || isNaN(quantity_received)) return;
    
    const location = prompt('Введіть розташування для зберігання:');
    if (!location) return;
    
    const properties = prompt('Властивості компонента (JSON формат, необов\'язково):');
    let parsedProperties = {};
    if (properties) {
        try {
            parsedProperties = JSON.parse(properties);
        } catch (e) {
            showToast('Неправильний формат JSON для властивостей', 'error');
            return;
        }
    }
    
    const notes = prompt('Додаткові примітки (необов\'язково):');
    
    try {
        const response = await apiRequest(`${API_BASE}/purchase-requests/${requestId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_name,
                quantity_received: parseInt(quantity_received),
                location,
                properties: parsedProperties,
                notes
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast('Компонент успішно додано до закупівлі', 'success');
            loadPurchases(currentPurchasesPage);
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error completing purchase:', error);
        showToast('Помилка завершення закупівлі', 'error');
    }
}

// Delete Functions
async function deleteItem(itemId) {
    if (!confirm('Ви впевнені, що хочете видалити цей компонент?')) return;
    
    try {
        const response = await apiRequest(`${API_BASE}/items/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Компонент успішно видалено', 'success');
            loadItems(currentItemsPage);
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Помилка видалення компонента', 'error');
    }
}

// Edit Preset Functions
async function editPreset(presetId) {
    try {
        const response = await apiRequest(`${API_BASE}/presets/${presetId}`);
        const preset = await response.json();
        
        // Populate form fields
        document.getElementById('edit-preset-name').value = preset.name;
        document.getElementById('edit-preset-description').value = preset.description || '';
        
        // Render preset items
        const container = document.getElementById('edit-preset-items-container');
        container.innerHTML = '';
        
        if (preset.items && preset.items.length > 0) {
            preset.items.forEach((item, index) => {
                addEditPresetItem(item, index);
            });
        } else {
            addEditPresetItem(); // Add empty row
        }
        
        // Store preset ID for form submission
        document.getElementById('edit-preset-form').dataset.presetId = presetId;
        
        showModal('edit-preset-modal');
        
    } catch (error) {
        console.error('Error loading preset for editing:', error);
        showToast('Помилка завантаження пресету', 'error');
    }
}

function addEditPresetItem(item = null, index = null) {
    const container = document.getElementById('edit-preset-items-container');
    const itemIndex = index !== null ? index : container.children.length;
    
    const options = (window.categories || []).map(cat => 
        `<option value="${cat.id}" ${item && item.category_id === cat.id ? 'selected' : ''}>${cat.name}</option>`
    ).join('');
    
    const row = document.createElement('div');
    row.className = 'edit-preset-item-row';
    row.innerHTML = `
        <select class="preset-item-category" required>
            <option value="">Виберіть категорію</option>
            ${options}
        </select>
        <input type="number" placeholder="Кількість" class="preset-item-quantity" min="1" required value="${item ? item.quantity_needed : ''}">
        <input type="text" placeholder="Вимоги/специфікації" class="preset-item-requirements" value="${item ? item.requirements || '' : ''}">
        <input type="text" placeholder="Примітки" class="preset-item-notes" value="${item ? item.notes || '' : ''}">
        <button type="button" class="btn btn-small btn-danger" onclick="removeEditPresetItem(this)">
            <span class="material-icons">remove</span>
        </button>
    `;
    
    container.appendChild(row);
}

function removeEditPresetItem(button) {
    button.closest('.edit-preset-item-row').remove();
}

// Edit Preset Form Handler
document.getElementById('edit-preset-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const presetId = this.dataset.presetId;
        const formData = new FormData(this);
        const presetData = {
            name: formData.get('name'),
            description: formData.get('description'),
            items: []
        };
        
        // Build items array
        const itemRows = document.querySelectorAll('.edit-preset-item-row');
        itemRows.forEach(row => {
            const categoryId = row.querySelector('.preset-item-category').value;
            const quantity = parseInt(row.querySelector('.preset-item-quantity').value);
            const requirements = row.querySelector('.preset-item-requirements').value.trim();
            const notes = row.querySelector('.preset-item-notes').value.trim();
            
            if (categoryId && quantity) {
                presetData.items.push({
                    category_id: parseInt(categoryId),
                    quantity_needed: quantity,
                    requirements: requirements,
                    notes: notes
                });
            }
        });
        
        if (presetData.items.length === 0) {
            showToast('Додайте хоча б один компонент', 'error');
            return;
        }
        
        const response = await apiRequest(`${API_BASE}/presets/${presetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(presetData)
        });
        
        if (response.ok) {
            showToast('Пресет успішно оновлено', 'success');
            closeModal('edit-preset-modal');
            
            if (currentPage === 'presets') {
                loadPresets();
            }
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating preset:', error);
        showToast('Помилка оновлення пресету', 'error');
    }
});

// Delete Preset Function
async function deletePreset(presetId) {
    if (!confirm('Ви впевнені, що хочете видалити цей пресет? Ця дія незворотна.')) {
        return;
    }
    
    try {
        const response = await apiRequest(`${API_BASE}/presets/${presetId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Пресет успішно видалено', 'success');
            loadPresets(); // Reload presets
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting preset:', error);
        showToast('Помилка видалення пресету', 'error');
    }
}

// Edit Functions (placeholder for future implementation)
async function editItem(itemId) {
    try {
        // Load item data
        const response = await apiRequest(`${API_BASE}/items/${itemId}`);
        if (!response) return;
        const item = await response.json();
        
        // Load categories for dropdown
        await loadCategoriesForEditSelect();
        
        // Fill form with item data
        document.getElementById('edit-item-id').value = item.id;
        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-category').value = item.category_id;
        document.getElementById('edit-item-description').value = item.description || '';
        document.getElementById('edit-item-quantity').value = item.quantity;
        document.getElementById('edit-item-location').value = item.location || '';
        
        // Load properties
        loadEditProperties(item.properties || {});
        
        // Show modal
        showModal('edit-item-modal');
        
    } catch (error) {
        console.error('Error loading item for edit:', error);
        showToast('Помилка завантаження компонента', 'error');
    }
}

async function editPreset(presetId) {
    try {
        // Load preset data
        const response = await apiRequest(`${API_BASE}/presets/${presetId}`);
        const preset = await response.json();
        
        // Load categories for dropdown
        const categoriesResponse = await apiRequest(`${API_BASE}/categories`);
        const categories = await categoriesResponse.json();
        
        // Populate form
        document.getElementById('edit-preset-name').value = preset.name;
        document.getElementById('edit-preset-description').value = preset.description || '';
        
        // Clear existing items
        const itemsContainer = document.getElementById('edit-preset-items-container');
        itemsContainer.innerHTML = '';
        
        // Add existing items
        if (preset.items && preset.items.length > 0) {
            preset.items.forEach(item => {
                addEditPresetItem(item.category_id, item.quantity_needed, item.requirements, item.notes);
            });
        } else {
            // Add one empty item by default
            addEditPresetItem();
        }
        
        // Store preset ID for form submission
        document.getElementById('edit-preset-form').dataset.presetId = presetId;
        
        // Show modal
        showModal('edit-preset-modal');
        
    } catch (error) {
        console.error('Error loading preset for editing:', error);
        showToast('Помилка завантаження пресету для редагування', 'error');
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = type === 'success' ? 'check_circle' : 
                      type === 'error' ? 'error' : 'info';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Load categories for global use
async function loadCategories() {
    try {
        const response = await apiRequest(`${API_BASE}/categories`);
        const categories = await response.json();
        
        // Store categories globally if needed
        window.categories = categories;
        
        // Populate category selects in modals
        populateCategorySelects(categories);
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Populate category selects in modals
function populateCategorySelects(categories) {
    // Purchase request modal
    const purchaseCategorySelect = document.getElementById('purchase-category');
    if (purchaseCategorySelect) {
        purchaseCategorySelect.innerHTML = '<option value="">Виберіть категорію</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            purchaseCategorySelect.appendChild(option);
        });
    }
    
    // Add category modal
    const categoryParentSelect = document.getElementById('category-parent');
    if (categoryParentSelect) {
        categoryParentSelect.innerHTML = '<option value="">Без батьківської категорії</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryParentSelect.appendChild(option);
        });
    }
}

// Categories Management
async function loadCategoriesPage() {
    try {
        const response = await apiRequest(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const tbody = document.getElementById('categories-tbody');
        tbody.innerHTML = '';
        
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.id}</td>
                <td><strong>${category.name}</strong></td>
                <td>${category.description || '-'}</td>
                <td>${category.parent_id ? getCategoryName(category.parent_id, categories) : '-'}</td>
                <td><span class="quantity-low">${category.items_count || 0}</span></td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="editCategory(${category.id})" title="Редагувати">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteCategory(${category.id})" title="Видалити">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Помилка завантаження категорій', 'error');
    }
}

function getCategoryName(categoryId, categories) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Невідома';
}

function showAddCategoryModal() {
    showModal('add-category-modal');
    document.getElementById('add-category-form').reset();
    loadParentCategories();
}

async function loadParentCategories() {
    try {
        const response = await apiRequest(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const select = document.getElementById('parent-category');
        select.innerHTML = '<option value="">Без батьківської категорії</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading parent categories:', error);
    }
}

// Add category form submission
document.addEventListener('DOMContentLoaded', function() {
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const categoryData = {
                name: formData.get('name'),
                description: formData.get('description'),
                parent_id: formData.get('parent_id') || null
            };
            
            try {
                const response = await apiRequest(`${API_BASE}/categories`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(categoryData)
                });
                
                if (response.ok) {
                    const newCategory = await response.json();
                    showToast('Категорію успішно створено', 'success');
                    closeModal('add-category-modal');
                    loadCategoriesPage();
                    loadCategories(); // Reload global categories
                } else {
                    const error = await response.json();
                    showToast(`Помилка: ${error.error}`, 'error');
                }
                
            } catch (error) {
                console.error('Error creating category:', error);
                showToast('Помилка створення категорії', 'error');
            }
        });
    }
});

async function deleteCategory(categoryId) {
    if (!confirm('Ви впевнені, що хочете видалити цю категорію?')) return;
    
    try {
        const response = await apiRequest(`${API_BASE}/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Категорію успішно видалено', 'success');
            loadCategoriesPage();
            loadCategories(); // Reload global categories
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Помилка видалення категорії', 'error');
    }
}

function editCategory(categoryId) {
    showToast('Функція редагування категорій буде додана в наступній версії', 'info');
}

// Warehouse Management
let selectedCell = null;
let warehouseData = {};

// Load warehouse data
async function loadWarehouse() {
    try {
        // Load warehouse data from API
        const response = await apiRequest(`${API_BASE}/items/warehouse/data`);
        if (response.ok) {
            warehouseData = await response.json();
        } else {
            console.error('Failed to load warehouse data from API');
            // Fallback to demo data if API fails
            createDemoWarehouseData();
        }
        
        renderWarehouse();
        updateWarehouseStats();
        
    } catch (error) {
        console.error('Error loading warehouse:', error);
        // Fallback to demo data if API fails
        createDemoWarehouseData();
        renderWarehouse();
        updateWarehouseStats();
        showToast('Використовуються демонстраційні дані', 'info');
    }
}

// Create demo warehouse data
function createDemoWarehouseData() {
    warehouseData = {
        'A1': [
            {
                id: 1,
                itemId: 1,
                name: 'Резистори 10кОм',
                quantity: 50,
                boxName: 'plastik1',
                color: 'red',
                groupNumber: 1,
                addedAt: new Date().toISOString()
            }
        ],
        'A2': [
            {
                id: 2,
                itemId: 2,
                name: 'Конденсатори 100мкФ',
                quantity: 25,
                boxName: 'plastik2',
                color: 'blue',
                groupNumber: 2,
                addedAt: new Date().toISOString()
            }
        ],
        'A3': [
            {
                id: 3,
                itemId: 3,
                name: 'Світлодіоди',
                quantity: 100,
                boxName: 'plastik3',
                color: 'green',
                groupNumber: 3,
                addedAt: new Date().toISOString()
            },
            {
                id: 4,
                itemId: 4,
                name: 'Транзистори BC547',
                quantity: 30,
                boxName: 'plastik3',
                color: 'green',
                groupNumber: 3,
                addedAt: new Date().toISOString()
            }
        ],
        'B1': [
            {
                id: 5,
                itemId: 5,
                name: 'Мікроконтролери ATmega',
                quantity: 10,
                color: 'purple',
                groupNumber: 4,
                addedAt: new Date().toISOString()
            }
        ],
        'B2': [
            {
                id: 6,
                itemId: 6,
                name: 'Плати Arduino',
                quantity: 5,
                color: 'orange',
                groupNumber: 5,
                addedAt: new Date().toISOString()
            }
        ],
        'C1': [
            {
                id: 7,
                itemId: 7,
                name: 'Дроти та кабелі',
                quantity: 20,
                boxName: 'cable_box',
                color: 'black',
                groupNumber: 6,
                addedAt: new Date().toISOString()
            }
        ],
        'C2': [
            {
                id: 8,
                itemId: 8,
                name: 'Паяльники',
                quantity: 3,
                color: 'brown',
                groupNumber: 7,
                addedAt: new Date().toISOString()
            }
        ]
    };
    
    // Save demo data to localStorage
    localStorage.setItem('warehouseData', JSON.stringify(warehouseData));
}

// Render warehouse grid
function renderWarehouse() {
    const cells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
    
    cells.forEach(cellId => {
        const cellElement = document.getElementById(`cell-${cellId}`);
        const cellData = warehouseData[cellId] || [];
        
        cellElement.innerHTML = '';
        
        if (cellData.length === 0) {
            cellElement.parentElement.classList.add('empty');
        } else {
            cellElement.parentElement.classList.remove('empty');
            
            // Group items by color/box
            const groupedItems = {};
            cellData.forEach(item => {
                const groupKey = item.color || item.boxName || 'default';
                if (!groupedItems[groupKey]) {
                    groupedItems[groupKey] = [];
                }
                groupedItems[groupKey].push(item);
            });
            
            // Create color box for each group
            Object.keys(groupedItems).forEach(groupKey => {
                const groupItems = groupedItems[groupKey];
                const colorBox = document.createElement('div');
                colorBox.className = `color-box ${groupKey}`;
                
                if (Object.keys(groupedItems).length > 1) {
                    colorBox.classList.add('multiple');
                }
                
                // Display count or first item name
                if (groupItems.length === 1) {
                    colorBox.textContent = groupItems[0].name.substring(0, 8);
                } else {
                    colorBox.textContent = `${groupItems.length}`;
                }
                
                // Tooltip with all items in group
                let tooltip = `Група: ${groupKey}\n`;
                groupItems.forEach(item => {
                    tooltip += `• ${item.name} (${item.quantity})\n`;
                });
                colorBox.title = tooltip.trim();
                
                colorBox.onclick = (e) => {
                    e.stopPropagation();
                    showItemDetails(groupItems[0], cellId);
                };
                
                cellElement.appendChild(colorBox);
            });
        }
    });
}

// Select cell
function selectCell(cellId) {
    const container = document.querySelector('.warehouse-container');
    const wasSelected = selectedCell === cellId;
    
    // Remove previous selection
    document.querySelectorAll('.warehouse-cell').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // Toggle selection
    if (wasSelected) {
        // Deselect - return to normal state
        selectedCell = null;
        container.classList.remove('cell-selected');
        document.getElementById('cell-info').innerHTML = '<p>Оберіть комірку для перегляду деталей</p>';
    } else {
        // Select new cell
        document.querySelector(`[data-position="${cellId}"]`).classList.add('selected');
        selectedCell = cellId;
        container.classList.add('cell-selected');
        
        // Update cell info
        updateCellInfo(cellId);
    }
}

// Update cell info panel
function updateCellInfo(cellId) {
    const cellData = warehouseData[cellId] || [];
    const cellInfo = document.getElementById('cell-info');
    
    if (cellData.length === 0) {
        cellInfo.innerHTML = `
            <h4>Комірка ${cellId}</h4>
            <p>Порожня</p>
            <button class="btn btn-primary btn-small" onclick="showAddToWarehouseModal('${cellId}')">
                <span class="material-icons">add</span>
                Додати компонент
            </button>
        `;
    } else {
        let itemsHtml = cellData.map(item => {
            let boxInfo = '';
            let bgClass = 'default-bg';
            
            if (item.boxName) {
                boxInfo = `<br><small>Коробка: ${item.boxName}`;
                if (item.boxNumber) {
                    boxInfo += ` (${item.boxNumber})`;
                }
                boxInfo += '</small>';
                bgClass = 'default-bg';
            } else if (item.color && item.groupNumber) {
                boxInfo = `<br><small>Колір: ${item.color}${item.groupNumber}</small>`;
                bgClass = `${item.color}-bg`;
            }
            
            return `
                <div class="warehouse-item-detail ${bgClass}">
                    <div style="flex: 1; margin-right: 30px;">
                        <strong>${item.name}</strong>
                        <span class="quantity">x${item.quantity}</span>
                        ${boxInfo}
                        ${item.category_name ? `<small> • ${item.category_name}</small>` : ''}
                    </div>
                    <div style="display: flex; gap: 2px;">
                        <button class="btn btn-small btn-primary" onclick="changeItemColor('${item.id}', '${cellId}')" title="Змінити колір">
                            <span class="material-icons">palette</span>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="removeItemFromCell('${cellId}', '${item.id}')" title="Видалити">
                            <span class="material-icons">remove</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        cellInfo.innerHTML = `
            <h4>Комірка ${cellId}</h4>
            <div class="cell-items">
                ${itemsHtml}
            </div>
            <button class="btn btn-primary btn-small" onclick="showAddToWarehouseModal('${cellId}')">
                <span class="material-icons">add</span>
                Додати ще
            </button>
        `;
    }
}

// Show add to warehouse modal
function showAddToWarehouseModal(preSelectedCell = null) {
    showModal('add-to-warehouse-modal');
    loadItemsForWarehouse();
    
    if (preSelectedCell) {
        document.getElementById('warehouse-cell').value = preSelectedCell;
    }
}

// Load items for warehouse dropdown
async function loadItemsForWarehouse() {
    try {
        const response = await apiRequest(`${API_BASE}/items?limit=1000`);
        const data = await response.json();
        
        const select = document.getElementById('warehouse-item');
        select.innerHTML = '<option value="">Виберіть компонент</option>';
        
        data.items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.quantity} шт.)`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading items for warehouse:', error);
    }
}

// Add to warehouse form submission
document.getElementById('add-to-warehouse-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(this);
        const cellId = formData.get('cell');
        const itemId = parseInt(formData.get('item_id'));
        const quantity = parseInt(formData.get('quantity'));
        const boxName = formData.get('box_name');
        const color = formData.get('color');
        const groupNumber = formData.get('group_number');
        
        // Build location string
        let location = cellId;
        if (boxName) {
            location += `:${boxName}`;
        } else if (color && groupNumber) {
            location += `:${color}${groupNumber}`;
        }
        
        // Update item location in database
        const response = await apiRequest(`${API_BASE}/items/${itemId}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location })
        });
        
        if (response.ok) {
            // Reload warehouse data from API
            await loadWarehouse();
            
            // Update cell info if selected
            if (selectedCell === cellId) {
                updateCellInfo(cellId);
            }
            
            showToast('Компонент додано в комірку', 'success');
            closeModal('add-to-warehouse-modal');
            this.reset();
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error adding to warehouse:', error);
        showToast('Помилка додавання в комірку', 'error');
    }
});

// Remove item from cell
async function removeItemFromCell(cellId, itemId) {
    if (!confirm('Ви впевнені, що хочете видалити цей компонент з комірки?')) return;
    
    try {
        // Clear location in database
        const response = await apiRequest(`${API_BASE}/items/${itemId}/location`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ location: '' })
        });
        
        if (response.ok) {
            // Reload warehouse data from API
            await loadWarehouse();
            
            // Update cell info if selected
            if (selectedCell === cellId) {
                updateCellInfo(cellId);
            }
            
            showToast('Компонент видалено з комірки', 'success');
        } else {
            const error = await response.json();
            showToast(`Помилка: ${error.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error removing item from cell:', error);
        showToast('Помилка видалення з комірки', 'error');
    }
}

// Show item details
function showItemDetails(item, cellId) {
    let details = `
Компонент: ${item.name}
Кількість: ${item.quantity}
Комірка: ${cellId}
Категорія: ${item.category_name || 'Не вказана'}`;

    if (item.boxName) {
        details += `\nКоробка: ${item.boxName}`;
        if (item.boxNumber) {
            details += ` (${item.boxNumber})`;
        }
    }
    
    if (item.color && item.groupNumber) {
        details += `\nКолір: ${item.color}${item.groupNumber}`;
    }
    
    if (item.description) {
        details += `\nОпис: ${item.description}`;
    }
    
    if (item.properties && Object.keys(item.properties).length > 0) {
        details += `\nВластивості:`;
        Object.entries(item.properties).forEach(([key, value]) => {
            details += `\n  ${key}: ${value}`;
        });
    }
    
    details += `\nДодано: ${new Date(item.addedAt).toLocaleString('uk-UA')}`;
    
    alert(details);
}

// Change item color
function changeItemColor(itemId, cellId) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'gray'];
    const currentItem = warehouseData[cellId]?.find(item => item.id == itemId);
    
    if (!currentItem) return;
    
    // Find next color or start from beginning
    const currentColor = currentItem.color || 'default';
    const currentIndex = colors.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % colors.length;
    const newColor = colors[nextIndex];
    
    // Generate new group number (simple increment)
    const newGroupNumber = (currentItem.groupNumber || 1) + 1;
    
    // Update location in database
    const newLocation = `${cellId}:${newColor}${newGroupNumber}`;
    
    fetch(`${API_BASE}/items/${itemId}/location`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ location: newLocation })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast(`Колір змінено на ${newColor}${newGroupNumber}`, 'success');
            loadWarehouse(); // Reload warehouse data
        } else {
            showToast('Помилка зміни кольору', 'error');
        }
    })
    .catch(error => {
        console.error('Error changing item color:', error);
        showToast('Помилка зміни кольору', 'error');
    });
}

// Update warehouse statistics
function updateWarehouseStats() {
    const cells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
    
    let filledCells = 0;
    let totalItems = 0;
    let uniqueTypes = new Set();
    
    cells.forEach(cellId => {
        const cellData = warehouseData[cellId] || [];
        if (cellData.length > 0) {
            filledCells++;
            totalItems += cellData.length;
            cellData.forEach(item => uniqueTypes.add(item.name));
        }
    });
    
    document.getElementById('filled-cells').textContent = `${filledCells}/18`;
    document.getElementById('total-warehouse-items').textContent = totalItems;
    document.getElementById('unique-item-types').textContent = uniqueTypes.size;
}

// Warehouse settings modal
function showWarehouseSettingsModal() {
    showModal('warehouse-settings-modal');
    updateWarehouseSettingsStats();
}

// Update warehouse settings stats
function updateWarehouseSettingsStats() {
    const statsContainer = document.getElementById('warehouse-settings-stats');
    
    const cells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
    
    let filledCells = 0;
    let totalItems = 0;
    let uniqueTypes = new Set();
    let colorStats = {};
    
    cells.forEach(cellId => {
        const cellData = warehouseData[cellId] || [];
        if (cellData.length > 0) {
            filledCells++;
            totalItems += cellData.length;
            cellData.forEach(item => {
                uniqueTypes.add(item.name);
                if (item.color) {
                    colorStats[item.color] = (colorStats[item.color] || 0) + 1;
                }
            });
        }
    });
    
    let colorStatsHtml = '';
    Object.entries(colorStats).forEach(([color, count]) => {
        colorStatsHtml += `<div class="stat-item"><span class="stat-label">${color}:</span><span class="stat-value">${count}</span></div>`;
    });
    
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Заповнені комірки:</span>
            <span class="stat-value">${filledCells}/18</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Всього компонентів:</span>
            <span class="stat-value">${totalItems}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Різних типів:</span>
            <span class="stat-value">${uniqueTypes.size}</span>
        </div>
        ${colorStatsHtml ? `<h5>Кольорові коробки:</h5>${colorStatsHtml}` : ''}
    `;
}

// Clear all warehouse
async function clearAllWarehouse() {
    if (!confirm('Ви впевнені, що хочете очистити весь склад? Ця дія незворотна.')) return;
    
    try {
        // Get all items with locations
        const response = await apiRequest(`${API_BASE}/items/warehouse/data`);
        if (response.ok) {
            const data = await response.json();
            
            // Clear location for all items
            const clearPromises = [];
            Object.values(data).forEach(items => {
                items.forEach(item => {
                    clearPromises.push(
                        apiRequest(`${API_BASE}/items/${item.id}/location`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ location: '' })
                        })
                    );
                });
            });
            
            await Promise.all(clearPromises);
            
            // Reload warehouse data
            await loadWarehouse();
            
            // Clear cell info if selected
            if (selectedCell) {
                updateCellInfo(selectedCell);
            }
            
            showToast('Склад очищено', 'success');
        } else {
            showToast('Помилка очищення складу', 'error');
        }
        
    } catch (error) {
        console.error('Error clearing warehouse:', error);
        showToast('Помилка очищення складу', 'error');
    }
}

// Export warehouse data
function exportWarehouseData() {
    const dataStr = JSON.stringify(warehouseData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `warehouse-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('Дані складу експортовано', 'success');
}

// Import warehouse data
function importWarehouseData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                warehouseData = importedData;
                localStorage.setItem('warehouseData', JSON.stringify(warehouseData));
                
                renderWarehouse();
                updateWarehouseStats();
                
                showToast('Дані складу імпортовано', 'success');
            } catch (error) {
                showToast('Помилка імпорту даних', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}
