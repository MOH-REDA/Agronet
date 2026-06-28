import React from 'react';

const SkeletonCard = () => (
  <article className="equipment-card skeleton-card" aria-hidden="true">
    <div className="skeleton-block skeleton-image" />
    <div className="skeleton-card-body">
      <span className="skeleton-block skeleton-title" />
      <span className="skeleton-block skeleton-price" />
      <span className="skeleton-block skeleton-line" />
      <span className="skeleton-block skeleton-line short" />
      <span className="skeleton-block skeleton-footer" />
    </div>
  </article>
);

export default SkeletonCard;
