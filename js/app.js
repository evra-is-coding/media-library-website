
// --- 1. DEĞİŞKENLER VE SEÇİCİLER ---
const mediaListContainer = document.getElementById('media-list');
const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');
const modal = document.getElementById('detail-modal');
const closeModalBtn = document.querySelector('.close-btn');
const modalFavBtn = document.getElementById('modal-fav-btn');

// Navigasyon Butonları
const btnHome = document.getElementById('btn-home');
const btnFavorites = document.getElementById('btn-favorites');
const favCountSpan = document.getElementById('fav-count');

// Uygulama Durumu (State)
let allMedia = []; // Tüm veri burada tutulur
let favorites = []; // Favori ID'ler burada tutulur
let currentActiveMedia = null; // Şu an modalda açık olan medya

// --- 2. BAŞLANGIÇ VE VERİ ÇEKME (FETCH) ---
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites(); // Önce hafızadaki favorileri yükle
    fetchMedia();    // Sonra verileri çek
    setupEventListeners(); // Olay dinleyicilerini kur
});

async function fetchMedia() {
    // Yükleniyor animasyonunu göster
    mediaListContainer.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>`;

    try {
        // Yapay bir gecikme ekleyelim ki animasyon görünsün (500ms) - İsteğe bağlı
        await new Promise(r => setTimeout(r, 500)); 

        const response = await fetch('./data/media.json');
        if (!response.ok) throw new Error("Veri okunamadı!");
        
        allMedia = await response.json();
        renderMedia(allMedia); // Veri gelince ekrana bas
    } catch (error) {
        console.error(error);
        mediaListContainer.innerHTML = `<p style="color:red; text-align:center;">Veriler yüklenirken hata oluştu.</p>`;
    }
}

// --- 3. EKRANA BASMA (RENDER) ---
function renderMedia(list) {
    mediaListContainer.innerHTML = ''; // Önce listeyi temizle

    if (list.length === 0) {
        mediaListContainer.innerHTML = '<p>Aradığınız kriterlere uygun içerik bulunamadı.</p>';
        return;
    }

    list.forEach(media => {
        // Kart HTML'ini oluştur
        const card = document.createElement('div');
        card.classList.add('media-card');
        card.innerHTML = `
            <img src="${media.image}" alt="${media.title}" loading="lazy">
            <div class="card-info">
                <h3>${media.title}</h3>
                <div class="card-meta">
                    <span>${media.year}</span>
                    <span class="rating-badge">⭐ ${media.rating}</span>
                </div>
            </div>
        `;

        // Karta tıklanınca detayı aç
        card.addEventListener('click', () => openModal(media));
        
        mediaListContainer.appendChild(card);
    });
}

// --- 4. ARAMA VE FİLTRELEME ---
function filterContent() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedType = filterType.value;

    // Hem arama metnine hem de kategoriye göre filtrele
    const filteredList = allMedia.filter(media => {
        const matchesSearch = media.title.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === 'all' || media.type === selectedType;
        
        return matchesSearch && matchesType;
    });

    renderMedia(filteredList);
}

// --- 5. MODAL İŞLEMLERİ (DETAY GÖSTERME) ---
function openModal(media) {
    currentActiveMedia = media; // Hangi medyanın açık olduğunu kaydet
    
    // Modal içeriğini doldur [cite: 26]
    document.getElementById('modal-image').src = media.image;
    document.getElementById('modal-title').textContent = media.title;
    document.getElementById('modal-type').textContent = media.type.toUpperCase();
    document.getElementById('modal-year').textContent = media.year;
    document.getElementById('modal-rating').textContent = media.rating;
    document.getElementById('modal-desc').textContent = media.description;

    // Favori butonu durumunu güncelle
    updateModalFavButton();

    // Modalı göster
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    currentActiveMedia = null;
}

// --- 6. FAVORİ YÖNETİMİ (LOCALSTORAGE) ---
function loadFavorites() {
    // LocalStorage'dan veriyi al, yoksa boş dizi yap [cite: 52]
    const storedFavs = localStorage.getItem('myFavorites');
    favorites = storedFavs ? JSON.parse(storedFavs) : [];
    updateFavCount();
}

function toggleFavorite() {
    if (!currentActiveMedia) return;

    const index = favorites.findIndex(f => f.id === currentActiveMedia.id);

    if (index === -1) {
        // Listede yoksa ekle
        favorites.push(currentActiveMedia);
    } else {
        // Listede varsa çıkar
        favorites.splice(index, 1);
    }

    // Yeni listeyi kaydet
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
    
    updateModalFavButton();
    updateFavCount();
}

function updateModalFavButton() {
    // Şu anki film favorilerde var mı kontrol et
    const isFav = favorites.some(f => f.id === currentActiveMedia.id);
    
    if (isFav) {
        modalFavBtn.textContent = "Favorilerden Çıkar";
        modalFavBtn.style.backgroundColor = "#333";
    } else {
        modalFavBtn.textContent = "Favorilere Ekle";
        modalFavBtn.style.backgroundColor = "#e50914"; // Ana renk
    }
}

function updateFavCount() {
    favCountSpan.textContent = `(${favorites.length})`;
}

// --- 7. SPA NAVİGASYON (SAYFA GEÇİŞLERİ) ---
function showHome() {
    btnHome.classList.add('active');
    btnFavorites.classList.remove('active');
    
    // Arama ve filtreleme kısmını göster
    document.getElementById('controls').style.display = 'flex';
    
    // Tüm medyaları (veya mevcut filtreyi) göster
    filterContent(); 
}

function showFavorites() {
    btnHome.classList.remove('active');
    btnFavorites.classList.add('active');

    // Favoriler sayfasında aramayı gizle (isteğe bağlı)
    document.getElementById('controls').style.display = 'none';

    // Sadece favorileri listele [cite: 28]
    renderMedia(favorites);
}

// --- 8. EVENT LISTENERS (OLAY DİNLEYİCİLERİ) ---
function setupEventListeners() {
    // Arama ve Filtreleme
    searchInput.addEventListener('input', filterContent);
    filterType.addEventListener('change', filterContent);

    // Modal Kapatma
    closeModalBtn.addEventListener('click', closeModal);
    // Modalın dışına (siyah alana) tıklanırsa da kapat
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Favori Butonu
    modalFavBtn.addEventListener('click', toggleFavorite);

    // Menü Geçişleri
    btnHome.addEventListener('click', showHome);
    btnFavorites.addEventListener('click', showFavorites);

    // --- 9. BONUS: PWA SERVICE WORKER KAYDI ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Kayıt Başarılı:', reg.scope))
            .catch(err => console.log('SW Kayıt Hatası:', err));
    });
}
}