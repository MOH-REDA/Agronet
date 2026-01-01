import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEquipment, getEquipmentTypes, reserveEquipment } from '../../services/api';
import { toast } from 'react-toastify';
import './Equipment.css';
import EquipmentSidebarFilter from '../../components/EquipmentSidebarFilter';
import { useMediaQuery, Paper } from '@mui/material';

const ITEMS_PER_PAGE = 9;

const Equipment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  
  // Filter states
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recommended');
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [modalEquipment, setModalEquipment] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const priceRanges = [
    { label: 'Under $300', value: 'under-300', min: 0, max: 300 },
    { label: '$300 - $350', value: '300-350', min: 300, max: 350 },
    { label: 'Over $350', value: 'over-350', min: 350, max: Infinity }
  ];

  const availabilityOptions = [
    { label: 'Available Now', value: 'now' },
    { label: 'Next Week', value: 'next-week' },
    { label: 'Next Month', value: 'next-month' }
  ];

  const BASE_URL = "http://localhost:8000/api";

  const getImageUrl = (item) => {
    if (item.images && item.images.length > 0) {
      let imgPath = item.images[0].replace(/\\/g, '/').trim();
      imgPath = imgPath.replace(/^\/+/, '');
      if (imgPath.startsWith('storage/')) {
        imgPath = imgPath.substring('storage/'.length);
      }
      if (!imgPath.startsWith('equipment/')) {
        imgPath = 'equipment/' + imgPath;
      }
      return 'http://localhost:8000/storage/' + imgPath;
    }
    return '/placeholder-equipment.jpg';
  };

  const isMobile = useMediaQuery('(max-width: 900px)');

  // Fetch equipment types and initial equipment data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [typesResponse, equipmentResponse] = await Promise.all([
          getEquipmentTypes(),
          getAllEquipment()
        ]);

        console.log('Equipment Types:', typesResponse.data);
        console.log('Equipment Data:', equipmentResponse.data);

        setEquipmentTypes(typesResponse.data || []);
        setEquipment(equipmentResponse.data || []);
        setFilteredEquipment(equipmentResponse.data || []);
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
  const handleFilter = (filterParams) => {
    console.log('Filter Params:', filterParams);
    let filtered = [...equipment];

    // Filter by type
    if (filterParams.types && filterParams.types.length > 0) {
      console.log('Filtering by types:', filterParams.types);
      filtered = filtered.filter(item => {
        console.log('Item type:', item.type);
        const matches = filterParams.types.some(type => {
          // Remove 's' from the end of the type for comparison
          const normalizedType = type.toLowerCase().replace(/s$/, '');
          const normalizedItemType = item.type?.toLowerCase().replace(/s$/, '');
          return normalizedItemType === normalizedType;
        });
        console.log('Matches:', matches);
        return matches;
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

    // Filter by date availability
    if (filterParams.startDate && filterParams.endDate) {
      const start = new Date(filterParams.startDate);
      const end = new Date(filterParams.endDate);
      
      filtered = filtered.filter(item => {
        // Check if the equipment has any reservations that overlap with the selected dates
        const hasOverlappingReservation = item.reservations?.some(reservation => {
          const reservationStart = new Date(reservation.start_date);
          const reservationEnd = new Date(reservation.end_date);
          
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
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || a.minPrice) - (b.price || b.minPrice));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || b.minPrice) - (a.price || a.minPrice));
        break;
      // Add more sorting options as needed
    }

    console.log('Filtered Results:', filtered);
    setFilteredEquipment(filtered);
    setCurrentPage(1);
  };

  // Handle equipment reservation
  const handleReserve = async (equipmentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: '/equipment' } });
        return;
      }

      await reserveEquipment(equipmentId, {
        startDate: new Date().toISOString(),
        // Add other reservation details as needed
      });

      // Refresh equipment list after reservation
      const response = await getAllEquipment({
        type: selectedType,
        priceRange,
        availability,
        sortBy
      });
      
      setEquipment(response.data || []);
      toast.success('Equipment reserved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to reserve equipment');
    }
  };

  // Tag generator for each equipment card
  const getTags = (item) => {
    const tags = [];
    if (item.gps_ready) tags.push('GPS Ready');
    if (item.hp) tags.push(`${item.hp} HP`);
    return tags;
  };

  const paginatedEquipment = filteredEquipment.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);

  // Reservation modal logic
  const openReserveModal = (equipment) => {
    setModalEquipment(equipment);
    setShowModal(true);
    setStartDate('');
    setEndDate('');
    setDateError('');
  };
  const closeReserveModal = () => {
    setShowModal(false);
    setModalEquipment(null);
    setStartDate('');
    setEndDate('');
    setDateError('');
  };
  const handleReserveSubmit = async () => {
    setDateError('');
    if (!startDate || !endDate) {
      setDateError('Both start and end dates are required.');
      return;
    }
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start < new Date(today.toDateString())) {
      setDateError('Start date must be today or later.');
      return;
    }
    if (end <= start) {
      setDateError('End date must be after start date.');
      return;
    }
    try {
      await reserveEquipment(modalEquipment.id, { startDate, endDate });
      toast.success('Reservation successful!');
      closeReserveModal();
    } catch (err) {
      setDateError(err.message || 'Reservation failed.');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilteredEquipment(equipment);
    setSortBy('recommended');
    setCurrentPage(1);
    // Reset the sidebar filter component
    if (document.querySelector('.equipment-sidebar-filter')) {
      const resetEvent = new CustomEvent('resetFilters');
      document.querySelector('.equipment-sidebar-filter').dispatchEvent(resetEvent);
    }
  };

  if (loading && !equipment.length) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading equipment...</p>
      </div>
    );
  }

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
      <div className="filters-sidebar">
        <EquipmentSidebarFilter 
          onFilter={handleFilter} 
          equipmentTypes={equipmentTypes}
          className="equipment-sidebar-filter"
        />
      </div>
      <div className="main-content">
        <div className="content-header">
          <div className="header-left">
            <h2>Browse Equipment</h2>
            <p className="results-count">
              Showing {filteredEquipment.length} items available near you
            </p>
          </div>
          <div className="header-right">
            <button
              className="clear-filters-btn"
              onClick={clearFilters}
              style={{
                marginRight: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #2B5727',
                color: '#2B5727',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#eaf6ea';
                e.target.style.borderColor = '#1e3d1c';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.borderColor = '#2B5727';
              }}
            >
              Clear All Filters
            </button>
            <select
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="distance">Distance</option>
            </select>
            <div className="view-toggles">
              <button
                className={`view-btn grid ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <span className="grid-icon">▤</span>
              </button>
              <button
                className={`view-btn list ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <span className="list-icon">☰</span>
              </button>
            </div>
          </div>
        </div>
        <div className={`equipment-grid ${viewMode}`}>
          {paginatedEquipment.map((item) => (
            <div
              key={item.id}
              className="equipment-card"
              onClick={e => {
                if (e.target.closest('.reserve-btn')) return;
                navigate(`/equipment/${item.id}`);
              }}
            >
              <img
                src={getImageUrl(item)}
                alt={item.name}
                className="equipment-image"
              />
              <div className="card-content">
                <div className="equipment-title-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 className="title" style={{ margin: 0 }}>{item.name}</h3>
                  {item.type && <span className="equipment-type">{item.type}</span>}
                </div>
                <p className="subtitle">{item.description || ''}</p>
                <div className="price" style={{ marginTop: '12px' }}>
                  {item.minPrice ? `${item.minPrice} MAD` : (item.price ? `${item.price} MAD` : 'MAD')} <span style={{ fontWeight: 400, marginLeft: 4 }}>per day</span>
                </div>
                <div className="tags-row">
                  {getTags(item).map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="status-row">
                  <span className="location">
                    <span className="location-dot">📍</span>
                    {item.city || item.state || item.address || '-'}
                  </span>
                </div>
                <button
                  className="reserve-btn w-100 mt-2"
                  disabled={item.status !== 'active'}
                  onClick={() => openReserveModal(item)}
                >
                  Reserve Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {filteredEquipment.length === 0 && !loading && (
          <div className="no-results">
            <p>No equipment found matching your filters</p>
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Equipment; 