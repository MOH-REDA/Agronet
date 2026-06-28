import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addEquipmentFavorite, getAllEquipment, getEquipmentTypes, getFavoriteEquipmentIds, getMarketplaceStats, removeEquipmentFavorite } from '../../services/api';
import { toast } from 'react-toastify';
import './Equipment.css';
import EquipmentSidebarFilter from '../../components/EquipmentSidebarFilter';
import { getStorageUrl } from '../../config/api';
import { Grid3X3, List, PackageSearch, RotateCcw } from 'lucide-react';
import EquipmentCard from '../../components/Marketplace/EquipmentCard';
import MarketplaceStats from '../../components/Marketplace/MarketplaceStats';
import SkeletonCard from '../../components/Marketplace/SkeletonCard';
import SmartEquipmentAdvisor from '../../components/Marketplace/SmartEquipmentAdvisor';
import { useLanguage } from '../../i18n/LanguageContext';

const marketplaceCopy = {
  fr: { eyebrow:'Marché AgroNet',title:'Trouvez le matériel adapté',listing:'annonce',listings:'annonces',saved:'dans vos favoris',ready:'à découvrir',all:'Afficher toutes les machines',clear:'Effacer les filtres',sort:'Trier par',recommended:'Recommandé',newest:'Plus récent',low:'Prix croissant',high:'Prix décroissant',booked:'Plus réservé',rated:'Mieux noté',previous:'Précédent',next:'Suivant',page:'Page',of:'sur',empty:'Aucun matériel trouvé',emptyCopy:'Élargissez les dates, la localisation ou les filtres.',clearAll:'Réinitialiser les filtres' },
  en: { eyebrow:'AgroNet marketplace',title:'Find equipment for the job',listing:'listing',listings:'listings',saved:'saved to your favorites',ready:'ready to explore',all:'Show all machines',clear:'Clear filters',sort:'Sort by',recommended:'Recommended',newest:'Newest',low:'Price: Low to High',high:'Price: High to Low',booked:'Most booked',rated:'Highest rated',previous:'Previous',next:'Next',page:'Page',of:'of',empty:'No equipment found',emptyCopy:'Try widening your dates, location, or filters.',clearAll:'Clear all filters' },
  ar: { eyebrow:'سوق أغرونت',title:'اعثر على المعدات المناسبة',listing:'إعلان',listings:'إعلانات',saved:'في المفضلة',ready:'جاهزة للاستكشاف',all:'عرض كل المعدات',clear:'مسح الفلاتر',sort:'الترتيب',recommended:'مقترح',newest:'الأحدث',low:'السعر تصاعدياً',high:'السعر تنازلياً',booked:'الأكثر حجزاً',rated:'الأعلى تقييماً',previous:'السابق',next:'التالي',page:'صفحة',of:'من',empty:'لم يتم العثور على معدات',emptyCopy:'وسّع التواريخ أو الموقع أو الفلاتر.',clearAll:'إعادة ضبط الفلاتر' }
};

const ITEMS_PER_PAGE = 9;
const DEFAULT_FILTERS = {
  search: '',
  startDate: '',
  endDate: '',
  types: [],
  priceRange: [0, 5000],
  location: '',
  brand: '',
  fuelType: '',
  transmission: '',
  minHp: '',
  maxHp: '',
  deliveryAvailable: false,
  instantBooking: false,
  verifiedOwner: false,
  minRating: '',
};

const Equipment = () => {
  const { language } = useLanguage();
  const mc = marketplaceCopy[language] || marketplaceCopy.fr;
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  
  // Filter states
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [marketplaceStats, setMarketplaceStats] = useState(null);
  const favoritesOnly = new URLSearchParams(location.search).get('favorites') === '1';

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  const isOwnEquipment = (item) => {
    const ownerId = item.user_id ?? item.owner_id ?? item.user?.id;
    return ownerId && currentUser?.id && Number(ownerId) === Number(currentUser.id);
  };

  const getFallbackImage = (item) => {
    const type = item.type?.toLowerCase() || '';
    if (type.includes('harvest')) return '/agronet-harvest-v2.webp';
    return '/agronet-hero-v2.webp';
  };

  const getImageUrl = (item) => {
    if (item.images && item.images.length > 0) {
      return getStorageUrl(item.images[0]);
    }
    return getFallbackImage(item);
  };

  // Fetch equipment types and initial equipment data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [typesResponse, equipmentResponse, statsResponse, favoritesResponse] = await Promise.all([
          getEquipmentTypes(),
          getAllEquipment({ per_page: 100 }),
          getMarketplaceStats(),
          localStorage.getItem('token') ? getFavoriteEquipmentIds().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        setEquipmentTypes(typesResponse.data || []);
        setEquipment(equipmentResponse.data || []);
        setFilteredEquipment(equipmentResponse.data || []);
        setMarketplaceStats(statsResponse.data || null);
        setFavoriteIds(new Set(favoritesResponse.data || []));
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load equipment data');
        toast.error(err.message || 'Failed to load equipment data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle filter changes from EquipmentSidebarFilter
  const handleFilter = useCallback((filterParams, requestedSort = sortBy) => {
    setActiveFilters(filterParams);
    let filtered = [...equipment];

    if (filterParams.search?.trim()) {
      const query = filterParams.search.trim().toLowerCase();
      filtered = filtered.filter(item => [
        item.name,
        item.brand,
        item.type,
        item.description,
        item.city,
        item.state,
        item.user?.name,
        item.user?.prenom,
        ...(item.crop_types || []),
      ].some(value => value?.toLowerCase().includes(query)));
    }

    // Filter by type
    if (filterParams.types && filterParams.types.length > 0) {
      filtered = filtered.filter(item => {
        return filterParams.types.some(type => {
          // Remove 's' from the end of the type for comparison
          const normalizedType = type.toLowerCase().replace(/s$/, '');
          const normalizedItemType = item.type?.toLowerCase().replace(/s$/, '');
          return normalizedItemType === normalizedType;
        });
      });
    }

    // Filter by price range
    if (filterParams.priceRange && filterParams.priceRange.length === 2) {
      const [minPrice, maxPrice] = filterParams.priceRange;
      filtered = filtered.filter(item => {
        const price = item.price || item.minPrice;
        return price >= minPrice && price <= maxPrice;
      });
    }

    // Filter by location
    if (filterParams.location) {
      filtered = filtered.filter(item => 
        item.city?.toLowerCase() === filterParams.location.toLowerCase()
      );
    }

    if (filterParams.brand) filtered = filtered.filter(item => item.brand === filterParams.brand);
    if (filterParams.fuelType) filtered = filtered.filter(item => item.fuel_type === filterParams.fuelType);
    if (filterParams.transmission) filtered = filtered.filter(item => item.transmission === filterParams.transmission);
    if (filterParams.minHp !== '') filtered = filtered.filter(item => Number(item.hp || 0) >= Number(filterParams.minHp));
    if (filterParams.maxHp !== '') filtered = filtered.filter(item => Number(item.hp || 0) <= Number(filterParams.maxHp));
    if (filterParams.deliveryAvailable) filtered = filtered.filter(item => item.delivery_available);
    if (filterParams.instantBooking) filtered = filtered.filter(item => item.instant_booking);
    if (filterParams.verifiedOwner) filtered = filtered.filter(item => item.user?.is_verified_owner);
    if (filterParams.minRating !== '') filtered = filtered.filter(item => Number(item.user?.reviews_received_avg_rating || 0) >= Number(filterParams.minRating));
    if (favoritesOnly) filtered = filtered.filter(item => favoriteIds.has(item.id));

    // Filter by date availability
    if (filterParams.startDate && filterParams.endDate) {
      const start = new Date(filterParams.startDate);
      const end = new Date(filterParams.endDate);
      
      filtered = filtered.filter(item => {
        // Check if the equipment has any reservations that overlap with the selected dates
        const hasOverlappingReservation = item.availability_ranges?.some(reservation => {
          const reservationStart = new Date(reservation.start);
          const reservationEnd = new Date(reservation.end);
          
          // Check if the selected date range overlaps with any reservation
          return (
            (start <= reservationEnd && end >= reservationStart) || // Overlap
            (start >= reservationStart && start <= reservationEnd) || // Start date falls within reservation
            (end >= reservationStart && end <= reservationEnd) // End date falls within reservation
          );
        });

        // If there's no overlapping reservation, the equipment is available
        return !hasOverlappingReservation;
      });
    }

    // Apply sorting
    switch (requestedSort) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || a.minPrice) - (b.price || b.minPrice));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || b.minPrice) - (a.price || a.minPrice));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'most-booked':
        filtered.sort((a, b) => Number(b.completed_hires_count || 0) - Number(a.completed_hires_count || 0));
        break;
      case 'highest-rated':
        filtered.sort((a, b) => Number(b.user?.reviews_received_avg_rating || 0) - Number(a.user?.reviews_received_avg_rating || 0));
        break;
    }

    setFilteredEquipment(filtered);
    setCurrentPage(1);
  }, [equipment, favoriteIds, favoritesOnly, sortBy]);

  useEffect(() => {
    if (loading) return;
    handleFilter(activeFilters, sortBy);
  }, [activeFilters, handleFilter, loading, sortBy]);

  const getOwner = (item) => {
    const fullName = [item.user?.prenom, item.user?.name].filter(Boolean).join(' ') || 'AgroNet owner';
    const initials = [item.user?.prenom, item.user?.name]
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AO';

    return { fullName, initials };
  };

  const getTypeBadgeClass = (type = '') => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('tractor')) return 'tractor';
    if (normalizedType.includes('harvest')) return 'harvester';
    if (normalizedType.includes('spray')) return 'sprayer';
    if (normalizedType.includes('irrigation')) return 'irrigation';
    if (normalizedType.includes('plant')) return 'planter';
    if (normalizedType.includes('seed')) return 'seeder';
    return 'other';
  };

  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);

  // Reservation modal logic
  const openReserveModal = (equipment) => {
    if (isOwnEquipment(equipment)) {
      navigate(`/my-equipment/${equipment.id}`);
      return;
    }

    navigate(`/equipment/${equipment.id}/reserve`);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilteredEquipment(equipment);
    setActiveFilters(DEFAULT_FILTERS);
    setSortBy('recommended');
    setCurrentPage(1);
    setFilterResetKey(key => key + 1);
  };

  const activeFilterCount = [
    Boolean(activeFilters.search?.trim()),
    Boolean(activeFilters.location),
    activeFilters.types?.length > 0,
    Boolean(activeFilters.startDate || activeFilters.endDate),
    activeFilters.priceRange?.[0] !== 0 || activeFilters.priceRange?.[1] !== 5000,
    Boolean(activeFilters.brand || activeFilters.fuelType || activeFilters.transmission),
    Boolean(activeFilters.minHp !== '' || activeFilters.maxHp !== ''),
    Boolean(activeFilters.deliveryAvailable || activeFilters.instantBooking || activeFilters.verifiedOwner),
    Boolean(activeFilters.minRating !== ''),
  ].filter(Boolean).length;

  const availableLocations = [...new Set(equipment.map(item => item.city).filter(Boolean))];
  const availableBrands = [...new Set(equipment.map(item => item.brand).filter(Boolean))];
  const availableFuelTypes = [...new Set(equipment.map(item => item.fuel_type).filter(Boolean))];
  const availableTransmissions = [...new Set(equipment.map(item => item.transmission).filter(Boolean))];
  const searchSuggestions = [...new Set(equipment.flatMap(item => [
    item.name, item.brand, item.type, item.city, item.user?.name, item.user?.prenom, ...(item.crop_types || []),
  ]).filter(Boolean))];

  const toggleFavorite = async (item) => {
    if (!localStorage.getItem('token')) return navigate('/login');
    const wasFavorite = favoriteIds.has(item.id);
    setFavoriteIds(previous => {
      const next = new Set(previous);
      if (wasFavorite) next.delete(item.id); else next.add(item.id);
      return next;
    });
    try {
      if (wasFavorite) await removeEquipmentFavorite(item.id); else await addEquipmentFavorite(item.id);
      window.dispatchEvent(new Event('agronet:favorites-updated'));
    } catch (favoriteError) {
      setFavoriteIds(previous => {
        const next = new Set(previous);
        if (wasFavorite) next.add(item.id); else next.delete(item.id);
        return next;
      });
      toast.error(favoriteError.message || 'Could not update favorites.');
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="equipment-page">
      <div className="marketplace-shell">
        <div className="content-header">
          <div className="header-left">
            <span className="marketplace-eyebrow">{mc.eyebrow}</span>
            <h1>{mc.title}</h1>
            <p className="results-count">
              {filteredEquipment.length} {filteredEquipment.length === 1 ? mc.listing : mc.listings} {favoritesOnly ? mc.saved : mc.ready}
            </p>
          </div>
          <div className="hero-stats-row">
            <MarketplaceStats stats={marketplaceStats} />
          </div>
          <div className="header-right">
            {favoritesOnly && (
              <button className="marketplace-clear-filters favorite-view-toggle" onClick={() => navigate('/equipment')}>
                {mc.all}
              </button>
            )}
            {activeFilterCount > 0 && (
              <button className="marketplace-clear-filters" onClick={clearFilters}>
                <RotateCcw size={15} />
                {mc.clear}
              </button>
            )}
            <label className="marketplace-sort-control">
              <span>{mc.sort}</span>
              <select
                className="sort-dropdown"
                value={sortBy}
                onChange={(event) => {
                  const nextSort = event.target.value;
                  setSortBy(nextSort);
                  handleFilter(activeFilters, nextSort);
                }}
                aria-label="Sort equipment"
              >
                <option value="recommended">{mc.recommended}</option><option value="newest">{mc.newest}</option><option value="price-low">{mc.low}</option><option value="price-high">{mc.high}</option><option value="most-booked">{mc.booked}</option><option value="highest-rated">{mc.rated}</option>
              </select>
            </label>
            <div className="view-toggles">
              <button
                className={`view-btn grid ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid3X3 size={17} />
              </button>
              <button
                className={`view-btn list ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
        <SmartEquipmentAdvisor filters={activeFilters} />
        <div className="marketplace-layout">
          <aside className="filters-sidebar">
            <EquipmentSidebarFilter
              onFilter={handleFilter}
              equipmentTypes={equipmentTypes}
              locations={availableLocations}
              brands={availableBrands}
              fuelTypes={availableFuelTypes}
              transmissions={availableTransmissions}
              searchSuggestions={searchSuggestions}
              resultCount={filteredEquipment.length}
              resetKey={filterResetKey}
              className="equipment-sidebar-filter"
            />
          </aside>
          <main className="marketplace-content">
            <div className={`equipment-grid ${viewMode}`}>
              {loading
                ? Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)
                : paginatedEquipment.map(item => {
                    const ownListing = isOwnEquipment(item);
                    return (
                      <EquipmentCard
                        key={item.id}
                        item={item}
                        ownListing={ownListing}
                        owner={getOwner(item)}
                        imageUrl={getImageUrl(item)}
                        typeClass={getTypeBadgeClass(item.type)}
                        favorite={favoriteIds.has(item.id)}
                        onToggleFavorite={() => toggleFavorite(item)}
                        onOpen={() => navigate(ownListing ? `/my-equipment/${item.id}` : `/equipment/${item.id}`)}
                        onReserve={() => ownListing ? navigate(`/my-equipment/${item.id}`) : openReserveModal(item)}
                      />
                    );
                  })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {mc.previous}
                </button>
                <span>
                  {mc.page} {currentPage} {mc.of} {totalPages}
                </span>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {mc.next}
                </button>
              </div>
            )}

            {filteredEquipment.length === 0 && !loading && (
              <div className="no-results">
                <span className="no-results-icon"><PackageSearch size={30} /></span>
                <h3>{mc.empty}</h3><p>{mc.emptyCopy}</p>
                <button onClick={clearFilters} className="clear-filters-btn">
                  {mc.clearAll}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Equipment;
