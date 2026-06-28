import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { deleteEquipment, getUserEquipment } from '../../services/api';
import './MyEquipmentDetails.css';

const MyEquipmentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [equipment, setEquipment] = useState(location.state?.equipment || null);
  const [loading, setLoading] = useState(!equipment);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!equipment) {
      getUserEquipment().then(res => {
        const found = (res.data || []).find(eq => String(eq.id) === String(id));
        setEquipment(found || null);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [equipment, id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteEquipment(equipment.id);
      toast.success('Equipment listing deleted.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error?.message || 'Could not delete this listing.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!equipment) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger mt-4">Equipment data not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="manage-equipment-page">
        <button className="manage-equipment-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} /> Back
        </button>

        <div className="manage-equipment-heading">
          <div>
            <span>Manage listing</span>
            <h1>{equipment.name}</h1>
          </div>
          <span className={`manage-equipment-status status-${equipment.status}`}>{equipment.status}</span>
        </div>

        <div className="manage-equipment-card">
          <dl className="manage-equipment-details">
            <div><dt>Type</dt><dd>{equipment.type || 'Not provided'}</dd></div>
            <div><dt>Daily rate</dt><dd>{equipment.price || equipment.minPrice || '-'} MAD</dd></div>
            <div><dt>Year</dt><dd>{equipment.year || 'Not provided'}</dd></div>
            <div><dt>License</dt><dd>{equipment.license || 'Not provided'}</dd></div>
            <div className="wide"><dt>Location</dt><dd>{equipment.address || equipment.city || 'Not provided'}</dd></div>
            <div className="wide"><dt>Description</dt><dd>{equipment.description || 'No description provided.'}</dd></div>
          </dl>

          <div className="manage-equipment-actions">
            <button className="manage-edit-button" onClick={() => navigate('/equipment/list', { state: { edit: true, equipment } })}>
              <Pencil size={16} /> Edit listing
            </button>
          </div>

          <div className="manage-danger-zone">
            <div>
              <strong>Delete this listing</strong>
              <p>This permanently removes the equipment and cannot be undone.</p>
            </div>
            {!confirmingDelete ? (
              <button className="manage-delete-button" onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={16} /> Delete
              </button>
            ) : (
              <div className="manage-delete-confirmation">
                <span><AlertTriangle size={15} /> Are you sure?</span>
                <button onClick={() => setConfirmingDelete(false)} disabled={deleting}>Cancel</button>
                <button className="confirm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default MyEquipmentDetails;
