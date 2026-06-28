import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/api';
import { getPublicMediaUrl } from '../../config/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { getOwnerVerification, submitOwnerVerification, uploadProfileAvatar } from '../../services/api';
import { BadgeCheck, Camera, Landmark, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  // User information state
  const [userInfo, setUserInfo] = useState({
    prenom: '',
    name: '',
    email: '',
    address: '',
    phone_number: '',
    payout_account_holder: '',
    payout_bank_name: '',
    payout_rib: '',
    payout_iban: '',
    payout_verified_at: null,
    avatar_url: null,
    is_verified_owner: false
  });

  // Password update state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState(null);
  const [verification, setVerification] = useState(null);
  const [identityDocument, setIdentityDocument] = useState(null);
  const [ownershipDocument, setOwnershipDocument] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [response, verificationResponse] = await Promise.all([
        axios.get(`${API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } }),
        getOwnerVerification(),
      ]);
      setUserInfo(response.data);
      setVerification(verificationResponse.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user data');
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setUploadingAvatar(true);
      const response = await uploadProfileAvatar(formData);
      setUserInfo(previous => ({ ...previous, ...response.user }));
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.user }));
      window.dispatchEvent(new Event('agronet:user-updated'));
      toast.success('Profile picture updated.');
    } catch (err) {
      toast.error(err.message || 'Could not upload profile picture.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleVerificationSubmit = async (event) => {
    event.preventDefault();
    if (!identityDocument) return toast.error('Choose an identity document.');
    const formData = new FormData();
    formData.append('identity_document', identityDocument);
    if (ownershipDocument) formData.append('ownership_document', ownershipDocument);
    try {
      setSubmittingVerification(true);
      const response = await submitOwnerVerification(formData);
      setVerification(response.data);
      setIdentityDocument(null);
      setOwnershipDocument(null);
      toast.success(response.message);
    } catch (err) {
      toast.error(err.message || 'Could not submit verification.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePasswordForm = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/user/update`, userInfo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/user/password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="settings-loading">
          <div className="spinner"></div>
          <p>Loading your settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="settings-error">
          <p>{error}</p>
          <button onClick={fetchUserData}>Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  const profileChecks = [userInfo.avatar_url, userInfo.prenom, userInfo.name, userInfo.phone_number, userInfo.address, userInfo.is_verified_owner, userInfo.payout_rib];
  const profileReadiness = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);

  return (
    <DashboardLayout>
      <div className="settings-container">
        <div className="settings-header">
          <div><span className="settings-eyebrow">Account workspace</span><h1>Settings</h1><p>Keep your public identity, owner trust, payouts, and account security up to date.</p></div>
          <div className="settings-header-statuses">
            <span className="settings-readiness"><strong>{profileReadiness}%</strong> Profile readiness</span>
            <span className={userInfo.is_verified_owner ? 'complete' : ''}><BadgeCheck size={16} /> {userInfo.is_verified_owner ? 'Verified owner' : 'Verification incomplete'}</span>
            <span className={userInfo.payout_verified_at ? 'complete' : ''}><Landmark size={16} /> {userInfo.payout_verified_at ? 'Payout verified' : 'Payout setup'}</span>
          </div>
        </div>

        <nav className="settings-quick-nav" aria-label="Settings sections">
          <a href="#profile-photo">Profile</a><a href="#owner-verification">Verification</a><a href="#personal-information">Personal details</a><a href="#payout-information">Payouts</a><a href="#account-security">Security</a>
        </nav>

      <div className="settings-content">
        <section className="settings-section profile-photo-section" id="profile-photo">
          <div className="settings-avatar-preview">
            {userInfo.avatar_url ? <img src={getPublicMediaUrl(userInfo.avatar_url)} alt="Your profile" /> : <span>{`${userInfo.prenom?.[0] || ''}${userInfo.name?.[0] || ''}`.toUpperCase()}</span>}
          </div>
          <div className="settings-avatar-copy">
            <span className="settings-section-kicker"><Camera size={15} /> Public profile</span><h2>Profile picture</h2>
            <p>A clear photo helps renters and owners recognize who they are working with.</p>
            <label className="settings-upload-button">
              {uploadingAvatar ? 'Uploading…' : 'Choose photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
            <small>JPG, PNG, or WebP. Maximum 3 MB.</small>
          </div>
        </section>

        <section className="settings-section owner-verification-section" id="owner-verification">
          <div className="verification-heading">
            <div>
              <span className="settings-section-kicker"><ShieldCheck size={15} /> Trust and safety</span><h2>Verified owner</h2>
              <p>Confirm your identity to earn a visible trust badge on your listings.</p>
            </div>
            <span className={`verification-status status-${verification?.status || (userInfo.is_verified_owner ? 'approved' : 'not-submitted')}`}>
              {userInfo.is_verified_owner ? 'Verified' : verification?.status?.replace('_', ' ') || 'Not submitted'}
            </span>
          </div>
          {verification?.status === 'rejected' && <div className="verification-rejection"><strong>Needs attention:</strong> {verification.rejection_reason}</div>}
          {!userInfo.is_verified_owner && verification?.status !== 'pending' && (
            <form className="verification-form" onSubmit={handleVerificationSubmit}>
              <label>Identity document <span>Required</span><input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={event => setIdentityDocument(event.target.files?.[0] || null)} required /></label>
              <label>Proof of equipment ownership <span>Recommended</span><input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={event => setOwnershipDocument(event.target.files?.[0] || null)} /></label>
              <p>Your files are private and only accessible to AgroNet administrators.</p>
              <button type="submit" className="btn-primary" disabled={submittingVerification}>{submittingVerification ? 'Submitting…' : 'Submit for review'}</button>
            </form>
          )}
          {verification?.status === 'pending' && <div className="verification-pending-copy">Your documents are securely submitted. An administrator will review them.</div>}
          {userInfo.is_verified_owner && <div className="verification-approved-copy">Identity reviewed by AgroNet. Your public listings now show the verified-owner badge.</div>}
        </section>

        <section className="settings-section personal-info-section" id="personal-information">
          <span className="settings-section-kicker"><UserRound size={15} /> Your identity</span><h2>Personal information</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="prenom">First Name</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={userInfo.prenom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Last Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={userInfo.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userInfo.email}
                onChange={handleInputChange}
                required
                readOnly
                className="readonly"
              />
              <small>Email address cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={userInfo.phone_number || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={userInfo.address || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        <section className="settings-section payout-info-section" id="payout-information">
          <span className="settings-section-kicker"><Landmark size={15} /> Payment destination</span><h2>Owner payout information</h2>
          <p className="settings-note">
            AgroNet uses these details to manually transfer owner payouts after a rental or service is completed.
          </p>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="payout_account_holder">Account Holder Name</label>
              <input
                type="text"
                id="payout_account_holder"
                name="payout_account_holder"
                value={userInfo.payout_account_holder || ''}
                onChange={handleInputChange}
                placeholder="Full legal name or business name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="payout_bank_name">Bank Name</label>
              <input
                type="text"
                id="payout_bank_name"
                name="payout_bank_name"
                value={userInfo.payout_bank_name || ''}
                onChange={handleInputChange}
                placeholder="e.g. Attijariwafa Bank, CIH, BMCE"
              />
            </div>

            <div className="form-group">
              <label htmlFor="payout_rib">RIB</label>
              <input
                type="text"
                id="payout_rib"
                name="payout_rib"
                value={userInfo.payout_rib || ''}
                onChange={handleInputChange}
                placeholder="24-digit Moroccan RIB"
                maxLength={32}
              />
              <small>Required for Moroccan owner payouts.</small>
            </div>

            <div className="form-group">
              <label htmlFor="payout_iban">IBAN</label>
              <input
                type="text"
                id="payout_iban"
                name="payout_iban"
                value={userInfo.payout_iban || ''}
                onChange={handleInputChange}
                placeholder="Optional for international payouts"
                maxLength={64}
              />
            </div>

            <div className={`payout-status ${userInfo.payout_verified_at ? 'verified' : 'pending'}`}>
              {userInfo.payout_verified_at ? 'Payout details verified' : 'Payout details pending admin verification'}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Payout Details'}
              </button>
            </div>
          </form>
        </section>

        <section className="settings-section password-section" id="account-security">
          <div className="password-header">
            <div><span className="settings-section-kicker"><LockKeyhole size={15} /> Account security</span><h2>Password</h2></div>
            <button
              type="button"
              className={`settings-password-toggle ${showPasswordForm ? 'active' : ''}`}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <LockKeyhole size={16} />
              {showPasswordForm ? 'Cancel change' : 'Change password'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
