import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Equipment.css';
import { deleteEquipment } from '../../services/api';
import { getStorageUrl } from '../../config/api';

const EquipmentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const form = location.state?.form;

  if (!form) {
    return (
      <div className="equipment-listing-page">
        <div className="listing-container">
          <h2>Error</h2>
          <p>No equipment data found. Please start the listing process again.</p>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/equipment')}>Back to Equipment</button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteEquipment(form.id);
        alert('Announcement deleted successfully.');
        navigate('/equipment');
      } catch (err) {
        alert('Failed to delete announcement: ' + (err.message || err));
      }
    }
  };

  // Prepare image preview (if any)
  let imageUrl = '';
  if (form.images && form.images.length > 0) {
    imageUrl = getStorageUrl(form.images[0]);
  }

  return (
    <div className="equipment-listing-page">
      <div className="listing-container" style={{maxWidth: 800}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:32, flexWrap:'wrap'}}>
          <div style={{flex:'0 0 320px', maxWidth:320}}>
            <div style={{borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(44,62,80,0.08)', background:'#f8faf8'}}>
              {imageUrl ? (
                <img src={imageUrl} alt="Machine" style={{width:'100%',height:220,objectFit:'cover',display:'block'}} />
              ) : (
                <div style={{width:'100%',height:220,display:'flex',alignItems:'center',justifyContent:'center',background:'#eaf6ea',color:'#aaa',fontSize:32}}>
                  No Image
                </div>
              )}
            </div>
          </div>
          <div style={{flex:1,minWidth:220}}>
            <h2 style={{marginBottom:8}}>{form.name}</h2>
            <div className="demand-label" style={{background:'#2B5727',color:'#fff',marginBottom:12,display:'inline-block'}}>{form.type}</div>
            <div className="info-box" style={{marginBottom:18}}>
              <strong>Listing successfully created!</strong> You can review your machine details below.
            </div>
            <div className="form-group"><b>Description:</b> {form.description || <span style={{color:'#aaa'}}>No description</span>}</div>
            <div className="form-group"><b>Location:</b> {form.address || ''}{form.city ? `, ${form.city}` : ''}{form.state ? `, ${form.state}` : ''}{form.zip ? `, ${form.zip}` : ''}</div>
            <div className="form-group"><b>Year:</b> {form.year || 'N/A'} &nbsp; <b>Country:</b> {form.country || 'N/A'}</div>
            <div className="form-group"><b>License/Registration:</b> {form.license || 'N/A'}</div>
            <div className="form-group"><b>Business Owner:</b> {form.isBusiness ? 'Yes' : 'No'}</div>
            <div className="form-group"><b>Contact:</b> {form.contactName || 'N/A'}{form.contactPhone ? ` (${form.contactPhone})` : ''}</div>
            <div className="form-group"><b>Terms Accepted:</b> {form.termsAccepted ? 'Yes' : 'No'}</div>
            <div className="form-group"><b>Available Seasons:</b> {form.availableSeasons?.join(', ') || 'N/A'}</div>
            <div className="form-group"><b>Pricing Type:</b> {form.pricingType || 'N/A'}</div>
            {form.pricingType === 'manual' ? (
              <div className="form-group">
                <b>Manual Prices:</b>
                <ul style={{margin:'6px 0 0 18px',padding:0}}>
                  <li>Low: {form.price_low || '-'} MAD</li>
                  <li>Medium: {form.price_medium || '-'} MAD</li>
                  <li>High: {form.price_high || '-'} MAD</li>
                  <li>Very High: {form.price_very_high || '-'} MAD</li>
                </ul>
              </div>
            ) : (
              <div className="form-group"><b>Minimum Price:</b> {form.minPrice ? `${form.minPrice} MAD` : 'N/A'}</div>
            )}
            <div className="form-group"><b>Minimum Rental Days:</b> {form.minRentalDays || 'N/A'}</div>
            <div className="form-group"><b>Deposit:</b> {form.deposit ? `${form.deposit} MAD` : 'N/A'}</div>
            <div className="form-group"><b>Latitude:</b> {form.lat || 'N/A'}</div>
            <div className="form-group"><b>Longitude:</b> {form.lng || 'N/A'}</div>
            <div style={{display:'flex',gap:12,marginTop:32}}>
              <button className="btn btn-outline-secondary" onClick={() => navigate('/equipment')}>Back to Equipment</button>
              <button className="btn btn-outline-secondary" style={{color:'#dc3545',borderColor:'#dc3545'}} onClick={handleDelete}>Delete Announcement</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentConfirmation;
