const STATUS_STYLES = {
  Pending: { cls: 'bg-warning text-dark', icon: '⏳', label: 'In Escrow' },
  Completed: { cls: 'bg-success', icon: '✅', label: 'Released' },
  Failed: { cls: 'bg-danger', icon: '❌', label: 'Failed' },
  Refunded: { cls: 'bg-secondary', icon: '↩️', label: 'Refunded' },
};

/**
 * Escrow transaction display.
 *
 * @param {object} props
 * @param {object|null} props.transaction  Transaction from API
 * @param {string} props.role              'Client' | 'Freelancer'
 * @param {boolean} props.loading          Action in-flight
 * @param {Function} props.onRelease       Client: release funds
 * @param {Function} props.onRefund        Client: refund escrow
 * @param {Function} props.onFail          Client: simulate gateway failure (mock testing)
 */
export default function TransactionCard({ transaction, role, loading, onRelease, onRefund, onFail }) {
  if (!transaction) {
    return (
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
        <h5 className="fw-bold mb-2">💳 Payment</h5>
        <p className="text-muted mb-0 small">
          No payment has been initiated yet. An escrow transaction is created automatically when a
          freelancer is approved.
        </p>
      </div>
    );
  }

  const st = STATUS_STYLES[transaction.status] || STATUS_STYLES.Pending;
  const isClient = role === 'Client';

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 mb-4">
      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-3">
        <h5 className="fw-bold mb-0">💳 Payment / Escrow</h5>
        <span className={`badge rounded-pill px-3 py-2 ${st.cls}`}>
          {st.icon} {st.label}
        </span>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-sm-4">
          <div className="text-muted small">Amount</div>
          <div className="fw-bold fs-5">
            {transaction.currency || 'USD'} ${transaction.amount?.toLocaleString()}
          </div>
        </div>
        <div className="col-sm-4">
          <div className="text-muted small">Reference</div>
          <div className="fw-semibold small text-break">{transaction.paymentReference}</div>
        </div>
        <div className="col-sm-4">
          <div className="text-muted small">Provider</div>
          <div className="fw-semibold small text-capitalize">
            {transaction.provider} {transaction.gatewayId ? `· ${transaction.gatewayId.slice(0, 18)}…` : ''}
          </div>
        </div>
      </div>

      {transaction.status === 'Pending' && (
        <div className="alert alert-info rounded-3 small mb-3">
          💰 Funds are held in escrow. They will be released to the freelancer automatically when the
          project is marked completed.
        </div>
      )}
      {transaction.status === 'Completed' && transaction.releasedAt && (
        <div className="alert alert-success rounded-3 small mb-3">
          🎉 Funds released to the freelancer on{' '}
          {new Date(transaction.releasedAt).toLocaleString()}.
        </div>
      )}
      {transaction.status === 'Failed' && transaction.failureReason && (
        <div className="alert alert-danger rounded-3 small mb-3">
          ❌ {transaction.failureReason}
        </div>
      )}
      {transaction.status === 'Refunded' && (
        <div className="alert alert-secondary rounded-3 small mb-3">
          ↩️ This payment was refunded to the client.
        </div>
      )}

      {/* Timeline */}
      <div className="d-flex flex-wrap gap-3 small text-muted mb-3">
        <span>Created: {new Date(transaction.createdAt).toLocaleString()}</span>
        {transaction.releasedAt && <span>Released: {new Date(transaction.releasedAt).toLocaleString()}</span>}
        {transaction.refundedAt && <span>Refunded: {new Date(transaction.refundedAt).toLocaleString()}</span>}
      </div>

      {/* Client actions on a Pending escrow */}
      {isClient && transaction.status === 'Pending' && (
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-success rounded-3 fw-semibold"
            onClick={onRelease}
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
            💸 Release Funds
          </button>
          <button className="btn btn-outline-danger rounded-3" onClick={onRefund} disabled={loading}>
            ↩️ Refund
          </button>
          <button
            className="btn btn-outline-secondary rounded-3"
            onClick={onFail}
            disabled={loading}
            title="Simulate a gateway failure (mock payment provider)"
          >
            ⚠️ Simulate Failure
          </button>
        </div>
      )}

      {!isClient && transaction.status === 'Pending' && (
        <div className="text-muted small">
          ⏳ Awaiting the client to complete the project — funds will be released automatically.
        </div>
      )}
    </div>
  );
}
