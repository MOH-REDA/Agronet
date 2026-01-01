import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Equipment.css';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { createEquipment, updateEquipment } from '../../services/api';

// Fix default marker icon for leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const steps = [
  'Machine',
  'Registration',
  'Business',
  'Contact',
  'Location',
  'Terms',
  'Seasonal',
  'Pricing'
];

const initialData = {
  name: '',
  type: '',
  description: '',
  images: [],
  license: '',
  country: '',
  year: '',
  isBusiness: false,
  contactName: '',
  contactPhone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  termsAccepted: false,
  availableSeasons: [],
  price: '',
  minRentalDays: '',
  deposit: '',
  pricingType: 'smart',
  minPrice: '',
};

const ListEquipment = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialData);
  const [draftSaved, setDraftSaved] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state && location.state.edit && location.state.equipment;
  const equipmentId = isEditMode ? location.state.equipment.id : null;

  // Location step state (move outside renderStep)
  const [addressValue, setAddressValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  React.useEffect(() => {
    setAddressValue(form.address || '');
  }, [form.address]);
  React.useEffect(() => {
    if (addressValue && addressValue.length > 2) {
      setLoadingSuggestions(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}&addressdetails=1&countrycodes=ma&limit=5`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data);
          setLoadingSuggestions(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [addressValue]);
  const handleAddressInput = (e) => {
    setAddressValue(e.target.value);
    setForm(f => ({ ...f, address: e.target.value }));
    setShowSuggestions(true);
  };
  const handleSelectSuggestion = (suggestion) => {
    setAddressValue(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setForm(f => ({
      ...f,
      address: suggestion.display_name,
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '',
      state: suggestion.address?.state || '',
      zip: suggestion.address?.postcode || '',
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    }));
  };
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setForm(f => ({
        ...f,
        address: data.display_name || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        zip: data.address?.postcode || '',
        lat,
        lng,
      }));
      setAddressValue(data.display_name || '');
    } catch (e) {}
  }

  // Only allow authenticated users
  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  // Pre-fill form in edit mode
  React.useEffect(() => {
    if (isEditMode) {
      const equipment = location.state.equipment;
      setForm({
        ...initialData,
        ...equipment,
        images: [], // Do not prefill images, let user re-upload if needed
      });
      if (equipment.address) setAddressValue(equipment.address);
    }
  }, [isEditMode, location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, images: file ? [file] : [] }));
  };

  const handleNext = async () => {
    if (step === steps.length - 1) {
      try {
        const filteredImages = (form.images || []).filter(file => file instanceof File);
        let payload = new FormData();
        Object.entries({ ...form, images: filteredImages }).forEach(([key, value]) => {
          if (key === 'images' && Array.isArray(value) && value.length > 0) {
            value.forEach((file) => {
              if (file instanceof File) {
                payload.append('images[]', file);
              }
            });
          } else if (Array.isArray(value)) {
            value.forEach((v) => payload.append(`${key}[]`, v));
          } else if (typeof value === 'boolean') {
            payload.append(key, value ? 1 : 0);
          } else {
            payload.append(key, value);
          }
        });
        payload.append('status', 'published');
        let created;
        if (isEditMode && equipmentId) {
          created = await updateEquipment(equipmentId, payload);
        } else {
          created = await createEquipment(payload);
        }
        navigate('/equipment/confirmation', { state: { form: created.equipment || created } });
      } catch (err) {
        alert('Failed to add equipment: ' + (err.message || err));
      }
    } else {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));
  const handleSaveDraft = () => setDraftSaved(true);

  // Step content renderers
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h3>Machine Information</h3>
            <div className="form-group">
              <label>Machine Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="e.g., John Deere 8R Tractor" required />
            </div>
            <div className="form-group">
              <label>Machine Type</label>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="">Select machine type</option>
                <option value="Tractor">Tractor</option>
                <option value="Harvester">Harvester</option>
                <option value="Planter">Planter</option>
                <option value="Sprayer">Sprayer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" />
            </div>
            <div className="form-group">
              <label>Machine Images</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {form.images && form.images[0] && (
                <div style={{ marginTop: 8 }}>
                  <span>Selected: {form.images[0].name}</span>
                  <br />
                  <img
                    src={URL.createObjectURL(form.images[0])}
                    alt="preview"
                    style={{ maxWidth: 120, marginTop: 8, borderRadius: 8, border: '1px solid #ccc' }}
                  />
                  <br />
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => setForm(prev => ({ ...prev, images: [] }))}
                  >
                    Remove
                  </button>
                </div>
              )}
              <small>JPG, PNG up to 10MB each (max 1 image)</small>
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <h3>Registration Details</h3>
            <div className="form-group">
              <label>License/Registration Number</label>
              <input name="license" value={form.license} onChange={handleChange} placeholder="e.g., ABC-123-XYZ or 12345678" required />
            </div>
            <div className="form-group">
              <label>Country of Registration</label>
              <select name="country" value={form.country} onChange={handleChange} required>
                <option value="">Select country</option>
                <option value="Morocco">Morocco</option>
                <option value="USA">USA</option>
                <option value="France">France</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Year of Registration</label>
              <select name="year" value={form.year} onChange={handleChange} required>
                <option value="">Select year</option>
                {Array.from({ length: 30 }, (_, i) => 2024 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="info-box">
              <strong>Why do we need this information?</strong>
              <p>Registration details help us verify equipment ownership and ensure compliance with local regulations. This information is kept secure and only used for verification purposes.</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3>Business Information</h3>
            <div className="form-group radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="isBusiness"
                  value="false"
                  checked={form.isBusiness === false}
                  onChange={() => setForm(f => ({ ...f, isBusiness: false }))}
                />
                I am a private owner
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="isBusiness"
                  value="true"
                  checked={form.isBusiness === true}
                  onChange={() => setForm(f => ({ ...f, isBusiness: true }))}
                />
                I am a business owner
              </label>
            </div>
            <div className="info-box">
              Le saviez-vous ? Un loueur professionnel se faisant passer pour un non-professionnel est passible de 2 ans d'emprisonnement et de 300 000 € d'amende pour pratiques commerciales trompeuses.
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3>Contact Information</h3>
            <div className="form-group">
              <label>Contact Name</label>
              <input name="contactName" value={form.contactName} onChange={handleChange} placeholder="Contact person for this equipment" required />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="e.g., +212 600 000 000" required />
            </div>
          </div>
        );
      case 4:
        // Default Morocco center
        const moroccoCenter = [31.7917, -7.0926];
        // If user has set lat/lng, use that
        const markerPosition = form.lat && form.lng ? [form.lat, form.lng] : moroccoCenter;
        function LocationMarker() {
          useMapEvents({
            click(e) {
              setForm(f => ({ ...f, lat: e.latlng.lat, lng: e.latlng.lng }));
              reverseGeocode(e.latlng.lat, e.latlng.lng);
            },
          });
          return form.lat && form.lng ? (
            <Marker position={[form.lat, form.lng]} icon={L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [32, 32], iconAnchor: [16, 32] })} />
          ) : null;
        }
        return (
          <div>
            <h3>Location</h3>
            <div className="form-group address-autocomplete">
              <label>Address</label>
              <div className="input-with-icon">
                
                <input
                  name="address"
                  value={addressValue}
                  onChange={handleAddressInput}
                  placeholder="Type your address or click on the map"
                  required
                  autoComplete="off"
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-dropdown">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.place_id} onClick={() => handleSelectSuggestion(suggestion)}>
                      <FaMapMarkerAlt className="dropdown-icon" />
                      {suggestion.display_name}
                    </li>
                  ))}
                </ul>
              )}
              {loadingSuggestions && <div style={{padding:'8px'}}>Loading...</div>}
            </div>
            <div className="form-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="City" required />
            </div>
            <div className="form-group">
              <label>State/Province</label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="State or province" required />
            </div>
            <div className="form-group">
              <label>ZIP/Postal Code</label>
              <input name="zip" value={form.zip} onChange={handleChange} placeholder="ZIP or postal code" required />
            </div>
            <div className="form-group">
              <label>Set Location on Map</label>
              <MapContainer
                center={markerPosition}
                zoom={6}
                style={{ height: '260px', width: '100%', borderRadius: '10px', marginBottom: '10px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
                {form.lat && form.lng && (
                  <Circle center={[form.lat, form.lng]} radius={400} pathOptions={{ color: '#2B5727', fillColor: '#2B5727', fillOpacity: 0.15 }} />
                )}
              </MapContainer>
              <small>Click on the map to set your equipment's location. Renters will see a 400m radius around this point.</small>
            </div>
            <div className="info-box">
              Make sure renters can always find your equipment within 400m of this point. You can update this information later.
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h3>Terms & Conditions</h3>
            <div className="form-group radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="termsAccepted"
                  checked={!!form.termsAccepted}
                  onChange={() => setForm(f => ({ ...f, termsAccepted: true }))}
                />
                I accept the terms and conditions for renting equipment on Agronet.
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="termsAccepted"
                  checked={!form.termsAccepted}
                  onChange={() => setForm(f => ({ ...f, termsAccepted: false }))}
                />
                I do not accept the terms and conditions.
              </label>
            </div>
            <div className="info-box">
              <p>Read our <a href="/terms" target="_blank" rel="noopener noreferrer">full terms and conditions</a>.</p>
            </div>
          </div>
        );
      case 6:
        // Moroccan agricultural demand pattern (simplified):
        // High: Mar-May, Jun-Jul, Sep-Oct; Medium: Aug, Nov; Low: Dec-Feb
        const demandPattern = [
          Array(20).fill('low'), // Jan
          Array(20).fill('low'), // Feb
          Array(20).fill('high'), // Mar
          Array(20).fill('high'), // Apr
          Array(20).fill('high'), // May
          Array(20).fill('high'), // Jun
          Array(20).fill('high'), // Jul
          Array(20).fill('medium'), // Aug
          Array(20).fill('high'), // Sep
          Array(20).fill('high'), // Oct
          Array(20).fill('medium'), // Nov
          Array(20).fill('low'), // Dec
        ];
        // Add some variation for realism
        demandPattern[0][5] = 'medium'; demandPattern[1][10] = 'medium';
        demandPattern[5][15] = 'very-high'; demandPattern[6][10] = 'very-high';
        demandPattern[8][2] = 'very-high'; demandPattern[9][18] = 'very-high';
        return (
          <div>
            <h3>Seasonal Demand Overview</h3>
            <div className="demand-legend">
              <span className="demand-label low">Low</span>
              <span className="demand-label medium">Medium</span>
              <span className="demand-label high">High</span>
              <span className="demand-label very-high">Very High</span>
            </div>
            <div className="seasonal-heatmap">
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((month, idx) => (
                <div key={month} className="month-block">
                  <div className="month-label">{month}</div>
                  <div className="month-grid">
                    {demandPattern[idx].map((demand, i) => (
                      <span key={i} className={`heat-cell demand-${demand}`}></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="info-box">This illustration is based on real Moroccan agricultural demand.</div>
          </div>
        );
      case 7:
        return (
          <div>
            <h3>Pricing & Rental Terms</h3>
            <div className="form-group radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="pricingType"
                  checked={form.pricingType !== 'manual'}
                  onChange={() => setForm(f => ({ ...f, pricingType: 'smart' }))}
                />
                Smart Pricing (Recommended)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="pricingType"
                  checked={form.pricingType === 'manual'}
                  onChange={() => setForm(f => ({ ...f, pricingType: 'manual' }))}
                />
                Manual Pricing
              </label>
            </div>
            {form.pricingType !== 'manual' ? (
              <div className="smart-pricing-box smart-pricing-vertical">
                <div className="smart-pricing-form-col" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div className="form-group" style={{maxWidth:200, margin:'0 auto'}}>
                    <label style={{textAlign: 'center', display: 'block'}}>Minimum Daily Price (MAD)</label>
                    <div className="min-price-row" style={{justifyContent: 'center'}}>
                      <button type="button" className="btn btn-outline-secondary" onClick={()=>setForm(f=>({...f,minPrice:Math.max(0,(parseInt(f.minPrice)||0)-1)}))}>-</button>
                      <input name="minPrice" type="number" min="0" value={form.minPrice||''} onChange={e=>setForm(f=>({...f,minPrice:e.target.value}))} style={{width:60,textAlign:'center'}} />
                      <button type="button" className="btn btn-outline-secondary" onClick={()=>setForm(f=>({...f,minPrice:(parseInt(f.minPrice)||0)+1}))}>+</button>
                      <span style={{marginLeft:8}}>MAD</span>
                    </div>
                  </div>
                  <div className="info-box" style={{marginTop: '12px'}}>You can change your minimum price at any time.</div>
                </div>
              </div>
            ) : (
              <div className="manual-pricing-box">
                {[{label:'Low',key:'low'},{label:'Medium',key:'medium'},{label:'High',key:'high'},{label:'Very High',key:'very-high'}].map(({label,key})=>(
                  <div className="form-group price-row" key={key}>
                    <span className={`demand-label ${key}`}>{label}</span>
                    <button type="button" className="btn btn-outline-secondary" onClick={()=>setForm(f=>({...f,[`price_${key}`]:Math.max(0,(parseInt(f[`price_${key}`])||0)-1)}))}>-</button>
                    <input name={`price_${key}`} type="number" min="0" value={form[`price_${key}`]||''} onChange={e=>setForm(f=>({...f,[`price_${key}`]:e.target.value}))} style={{width:60,textAlign:'center'}} />
                    <button type="button" className="btn btn-outline-secondary" onClick={()=>setForm(f=>({...f,[`price_${key}`]:(parseInt(f[`price_${key}`])||0)+1}))}>+</button>
                    <span style={{marginLeft:8}}>MAD</span>
                  </div>
                ))}
                <div className="info-box">You can update these prices later.</div>
              </div>
            )}
            <div className="form-group">
              <label>Minimum Rental Days</label>
              <input name="minRentalDays" type="number" min="1" value={form.minRentalDays} onChange={handleChange} placeholder="e.g., 2" required />
            </div>
            <div className="form-group">
              <label>Security Deposit (MAD)</label>
              <input name="deposit" type="number" min="0" value={form.deposit} onChange={handleChange} placeholder="e.g., 100" required />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="equipment-listing-page">
      <div className="listing-container">
        <div className="listing-header">
          <h2>List Your Equipment</h2>
          <span className="step-count">Step {step + 1} of {steps.length}</span>
        </div>
        <div className="custom-stepper">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <div className="step-labels">
            {steps.map((label, idx) => (
              <span
                key={label}
                className={`step-label${step === idx ? ' active' : ''}${step > idx ? ' completed' : ''}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="step-content">
          {renderStep()}
        </div>
        <div className="listing-actions">
          <button onClick={handlePrev} disabled={step === 0} className="btn btn-outline-secondary me-2">Previous</button>
          <button onClick={handleSaveDraft} className="btn btn-outline-secondary me-2">Save as Draft</button>
          <button onClick={handleNext} className="btn btn-success">Continue</button>
        </div>
        {draftSaved && <div className="draft-saved-msg">Draft saved!</div>}
      </div>
    </div>
  );
};

export default ListEquipment; 