import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banknote,
  Check,
  ChevronDown,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tractor,
  X
} from 'lucide-react';
import './EquipmentSidebarFilter.css';
import { useLanguage } from '../i18n/LanguageContext';
import { getMarketplaceCopy } from './Marketplace/marketplaceCopy';

const PRICE_MIN = 0;
const PRICE_MAX = 5000;

const createDefaultFilters = () => ({
  search: '',
  startDate: '',
  endDate: '',
  types: [],
  priceRange: [PRICE_MIN, PRICE_MAX],
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
});

const EquipmentSidebarFilter = ({
  onFilter,
  equipmentTypes = [],
  locations = [],
  brands = [],
  fuelTypes = [],
  transmissions = [],
  searchSuggestions = [],
  resultCount = 0,
  resetKey = 0,
  className = '',
}) => {
  const { language } = useLanguage();
  const c = getMarketplaceCopy(language);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(createDefaultFilters);
  const [open, setOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(() => window.matchMedia('(max-width: 999px)').matches);
  const searchTimer = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 999px)');
    const updateViewport = (event) => setIsCompact(event.matches);
    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const defaults = createDefaultFilters();
    setFilters(defaults);
    setAppliedFilters(defaults);
  }, [resetKey]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setFilters(appliedFilters);
        setOpen(false);
      }
    };
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [appliedFilters, open]);

  const sortedTypes = useMemo(
    () => [...new Set(equipmentTypes.filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [equipmentTypes]
  );
  const sortedLocations = useMemo(
    () => [...new Set(locations.filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [locations]
  );

  const activeCount = [
    Boolean(filters.search.trim()),
    Boolean(filters.location),
    filters.types.length > 0,
    Boolean(filters.startDate || filters.endDate),
    filters.priceRange[0] !== PRICE_MIN || filters.priceRange[1] !== PRICE_MAX,
    Boolean(filters.brand || filters.fuelType || filters.transmission),
    Boolean(filters.minHp !== '' || filters.maxHp !== ''),
    Boolean(filters.deliveryAvailable || filters.instantBooking || filters.verifiedOwner),
    Boolean(filters.minRating !== ''),
  ].filter(Boolean).length;

  const updateFilters = (changes) => {
    const nextFilters = { ...filters, ...changes };
    setFilters(nextFilters);
    if (!isCompact) {
      setAppliedFilters(nextFilters);
      onFilter(nextFilters);
    }
  };

  const updateSearch = (value) => {
    const nextFilters = { ...filters, search: value };
    setFilters(nextFilters);
    if (!isCompact) {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = window.setTimeout(() => {
        setAppliedFilters(nextFilters);
        onFilter(nextFilters);
      }, 250);
    }
  };

  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  const highlightedSuggestion = (value) => {
    const query = filters.search.trim();
    const index = value.toLowerCase().indexOf(query.toLowerCase());
    if (!query || index < 0) return value;
    return <>{value.slice(0, index)}<mark>{value.slice(index, index + query.length)}</mark>{value.slice(index + query.length)}</>;
  };

  const toggleType = (type) => {
    const nextTypes = filters.types.includes(type)
      ? filters.types.filter(item => item !== type)
      : [...filters.types, type];
    updateFilters({ types: nextTypes });
  };

  const updatePrice = (index, value) => {
    const numericValue = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Number(value) || 0));
    const nextRange = [...filters.priceRange];
    nextRange[index] = numericValue;

    if (index === 0 && numericValue > nextRange[1]) nextRange[1] = numericValue;
    if (index === 1 && numericValue < nextRange[0]) nextRange[0] = numericValue;
    updateFilters({ priceRange: nextRange });
  };

  const resetFilters = () => {
    const defaults = createDefaultFilters();
    setFilters(defaults);
    setAppliedFilters(defaults);
    onFilter(defaults);
  };

  const applyMobileFilters = () => {
    setAppliedFilters(filters);
    onFilter(filters);
    setOpen(false);
  };

  const closeMobileFilters = () => {
    setFilters(appliedFilters);
    setOpen(false);
  };

  const panel = (
    <div className="market-filter-panel">
      <div className="market-filter-header">
        <div className="market-filter-title">
          <span className="market-filter-title-icon"><SlidersHorizontal size={18} /></span>
          <div>
            <h2>{c.filterTitle}</h2><p>{resultCount} {resultCount === 1 ? c.match : c.matches}</p>
          </div>
        </div>
        <div className="market-filter-header-actions">
          {activeCount > 0 && (
            <button type="button" className="market-filter-reset-link" onClick={resetFilters}>
              {c.reset}
            </button>
          )}
          {isCompact && (
            <button type="button" className="market-filter-close" onClick={closeMobileFilters} aria-label={c.close}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {filters.search.trim() && (
        <div className="market-search-suggestions" role="listbox" aria-label={c.suggestions}>
          {searchSuggestions.filter(value => value.toLowerCase().includes(filters.search.toLowerCase())).slice(0, 6).map(value => (
            <button key={value} type="button" onClick={() => updateSearch(value)}>{highlightedSuggestion(value)}</button>
          ))}
        </div>
      )}

      <div className="market-filter-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => updateSearch(event.target.value)}
          placeholder={c.search}
          aria-label={c.search}
        />
        {filters.search && (
          <button type="button" onClick={() => updateSearch('')} aria-label={c.clearSearch}>
            <X size={15} />
          </button>
        )}
      </div>

      <details className="market-filter-section" open>
        <summary className="market-filter-section-title">
          <MapPin size={16} aria-hidden="true" />
          <h3>{c.whereWhen}</h3>
          <ChevronDown className="market-filter-chevron" size={16} aria-hidden="true" />
        </summary>
        <div className="market-filter-section-body">
          <label className="market-filter-field">
            <span>{c.city}</span>
            <select value={filters.location} onChange={(event) => updateFilters({ location: event.target.value })}>
              <option value="">{c.allCities}</option>
              {sortedLocations.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <div className="market-filter-date-grid">
            <label className="market-filter-field">
              <span>{c.from}</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(event) => updateFilters({
                  startDate: event.target.value,
                  endDate: filters.endDate && filters.endDate <= event.target.value ? '' : filters.endDate,
                })}
              />
            </label>
            <label className="market-filter-field">
              <span>{c.to}</span>
              <input
                type="date"
                min={filters.startDate || undefined}
                value={filters.endDate}
                onChange={(event) => updateFilters({ endDate: event.target.value })}
              />
            </label>
          </div>
        </div>
      </details>

      <details className="market-filter-section">
        <summary className="market-filter-section-title">
          <Tractor size={16} aria-hidden="true" />
          <h3>{c.machineType}</h3>
          {filters.types.length > 0 && <span>{filters.types.length}</span>}
          <ChevronDown className="market-filter-chevron" size={16} aria-hidden="true" />
        </summary>
        <div className="market-filter-section-body market-filter-types">
          {sortedTypes.length > 0 ? sortedTypes.map(type => {
              const selected = filters.types.includes(type);
              return (
                <label key={type} className={`market-filter-type${selected ? ' selected' : ''}`}>
                  <input type="checkbox" checked={selected} onChange={() => toggleType(type)} />
                  <span className="market-filter-checkbox">{selected && <Check size={13} />}</span>
                  <span>{type}</span>
                </label>
              );
            }) : <p className="market-filter-empty">{c.noTypes}</p>}
        </div>
      </details>

      <details className="market-filter-section">
        <summary className="market-filter-section-title">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <h3>{c.more}</h3>
          <ChevronDown className="market-filter-chevron" size={16} aria-hidden="true" />
        </summary>
        <div className="market-filter-section-body market-more-filters">
          <label className="market-filter-field"><span>{c.brand}</span><select value={filters.brand} onChange={event => updateFilters({ brand: event.target.value })}><option value="">{c.allBrands}</option>{brands.map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="market-filter-field"><span>{c.fuel}</span><select value={filters.fuelType} onChange={event => updateFilters({ fuelType: event.target.value })}><option value="">{c.anyFuel}</option>{fuelTypes.map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="market-filter-field"><span>{c.transmission}</span><select value={filters.transmission} onChange={event => updateFilters({ transmission: event.target.value })}><option value="">{c.anyTransmission}</option>{transmissions.map(value => <option key={value}>{value}</option>)}</select></label>
          <div className="market-filter-date-grid">
            <label className="market-filter-field"><span>{c.minHp}</span><input type="number" min="0" value={filters.minHp} onChange={event => updateFilters({ minHp: event.target.value })} /></label>
            <label className="market-filter-field"><span>{c.maxHp}</span><input type="number" min="0" value={filters.maxHp} onChange={event => updateFilters({ maxHp: event.target.value })} /></label>
          </div>
          <label className="market-filter-switch"><input type="checkbox" checked={filters.deliveryAvailable} onChange={event => updateFilters({ deliveryAvailable: event.target.checked })} /><span>{c.deliveryAvailable}</span></label>
          <label className="market-filter-switch"><input type="checkbox" checked={filters.instantBooking} onChange={event => updateFilters({ instantBooking: event.target.checked })} /><span>{c.instantBooking}</span></label>
          <label className="market-filter-switch"><input type="checkbox" checked={filters.verifiedOwner} onChange={event => updateFilters({ verifiedOwner: event.target.checked })} /><span>{c.verifiedOnly}</span></label>
          <label className="market-filter-field"><span>{c.minimumRating}</span><select value={filters.minRating} onChange={event => updateFilters({ minRating: event.target.value })}><option value="">{c.anyRating}</option><option value="4">4★ {c.andAbove}</option><option value="4.5">4.5★ {c.andAbove}</option></select></label>
        </div>
      </details>

      <details className="market-filter-section">
        <summary className="market-filter-section-title">
          <Banknote size={16} aria-hidden="true" />
          <h3>{c.budget}</h3>
          <ChevronDown className="market-filter-chevron" size={16} aria-hidden="true" />
        </summary>
        <div className="market-filter-section-body market-filter-price-grid">
          <label className="market-filter-field">
            <span>{c.minimum}</span>
            <div className="market-filter-money-input">
              <input
                type="number"
                min={PRICE_MIN}
                max={filters.priceRange[1]}
                step="50"
                value={filters.priceRange[0]}
                onChange={(event) => updatePrice(0, event.target.value)}
              />
              <span>MAD</span>
            </div>
          </label>
          <label className="market-filter-field">
            <span>{c.maximum}</span>
            <div className="market-filter-money-input">
              <input
                type="number"
                min={filters.priceRange[0]}
                max={PRICE_MAX}
                step="50"
                value={filters.priceRange[1]}
                onChange={(event) => updatePrice(1, event.target.value)}
              />
              <span>MAD</span>
            </div>
          </label>
        </div>
      </details>

      <div className="market-filter-footer">
        <button type="button" className="market-filter-reset-button" onClick={resetFilters} disabled={!activeCount}>
          <RotateCcw size={16} />
          {c.reset}
        </button>
        {isCompact && (
          <button type="button" className="market-filter-apply" onClick={applyMobileFilters}>
            {c.apply}
          </button>
        )}
      </div>
    </div>
  );

  if (!isCompact) {
    return <div className={className}>{panel}</div>;
  }

  return (
    <div className={className}>
      <button type="button" className="mobile-filter-trigger" onClick={() => {
        setFilters(appliedFilters);
        setOpen(true);
      }}>
        <SlidersHorizontal size={18} />
        {c.filters}
        {activeCount > 0 && <span>{activeCount}</span>}
      </button>
      {open && (
        <div className="market-filter-overlay" role="presentation" onMouseDown={closeMobileFilters}>
          <aside
            className="market-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={c.filterTitle}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {panel}
          </aside>
        </div>
      )}
    </div>
  );
};

export default EquipmentSidebarFilter;
