import { Fragment } from 'react';

/**
 * Workflow stepper: Open → Approved → In Progress → Submitted → Completed
 *
 * @param {string} status         Project status
 * @param {boolean} hasFreelancer Whether a freelancer has been approved
 */
const STEPS = ['Open', 'Approved', 'In Progress', 'Submitted', 'Completed'];

export default function WorkflowStepper({ status, hasFreelancer }) {
  if (status === 'Cancelled') {
    return (
      <div className="alert alert-danger rounded-4 mb-4 d-flex align-items-center gap-2 mb-4">
        <span style={{ fontSize: '1.2rem' }}>⛔</span>
        <div className="mb-0">
          <strong>Project Cancelled</strong>
          <div className="small">This project was cancelled and is no longer active.</div>
        </div>
      </div>
    );
  }

  // Map project status → active step index
  let activeIndex = 0;
  if (status === 'Open') activeIndex = hasFreelancer ? 1 : 0;
  else if (status === 'In Progress') activeIndex = 2;
  else if (status === 'Submitted') activeIndex = 3;
  else if (status === 'Completed') activeIndex = 4;

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
      <div className="d-flex align-items-start justify-content-between">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <Fragment key={step}>
              {i > 0 && (
                <div
                  className={`flex-grow-1 mx-1 ${i <= activeIndex ? 'bg-success' : 'bg-light'}`}
                  style={{ height: 3, marginTop: 15 }}
                />
              )}
              <div className="d-flex flex-column align-items-center" style={{ minWidth: 56 }}>
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                    done
                      ? 'bg-success text-white'
                      : active
                        ? 'bg-primary text-white shadow'
                        : 'bg-light text-secondary border'
                  }`}
                  style={{ width: 34, height: 34, fontSize: '0.85rem' }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <small
                  className={`mt-1 text-center ${
                    active ? 'text-primary fw-bold' : done ? 'text-success fw-semibold' : 'text-muted'
                  }`}
                  style={{ fontSize: '0.7rem', lineHeight: 1.2 }}
                >
                  {step}
                </small>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
