import React from 'react';
import { CalendarDays, ClipboardCheck, CreditCard, Check } from 'lucide-react';

const steps = [
  { label: 'Dates & service', icon: CalendarDays },
  { label: 'Review details', icon: ClipboardCheck },
  { label: 'Payment', icon: CreditCard },
];

const BookingProgress = ({ current = 1 }) => (
  <nav className="booking-progress" aria-label="Booking progress">
    {steps.map(({ label, icon: Icon }, index) => {
      const number = index + 1;
      const complete = number < current;
      const active = number === current;
      return (
        <React.Fragment key={label}>
          {index > 0 && <span className={`booking-progress-line ${complete || active ? 'filled' : ''}`} />}
          <div className={`booking-progress-step ${active ? 'active' : ''} ${complete ? 'complete' : ''}`} aria-current={active ? 'step' : undefined}>
            <span className="booking-progress-icon">{complete ? <Check size={17} /> : React.createElement(Icon, { size: 17 })}</span>
            <span><small>Step {number}</small><strong>{label}</strong></span>
          </div>
        </React.Fragment>
      );
    })}
  </nav>
);

export default BookingProgress;
