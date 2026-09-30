/**
 * ─── Payment Service (provider-agnostic) ─────────────────────────────────────
 *
 * All payment operations go through a provider interface so a real gateway
 * (Stripe, PayPal, etc.) can be dropped in later without touching controllers.
 *
 * Provider interface:
 *   charge({ amount, currency, metadata })  → { ok, gatewayId, failureReason? }
 *   release({ gatewayId, amount, ... })     → { ok, gatewayId, failureReason? }
 *   refund({ gatewayId, amount, ... })      → { ok, gatewayId, failureReason? }
 *
 * Set PAYMENT_PROVIDER=mock in .env (default). Add new providers to `providers`.
 */

const mockProvider = {
  name: 'mock',

  /** Simulate charging the client's payment method into escrow. */
  async charge({ amount, metadata = {} }) {
    // Simulated gateway latency
    await new Promise((r) => setTimeout(r, 50));

    // Mock rule: charges over $100,000 are declined to exercise the Failed path.
    if (amount > 100000) {
      return { ok: false, gatewayId: null, failureReason: 'Mock gateway: amount exceeds test limit.' };
    }
    return { ok: true, gatewayId: `mock_chg_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, metadata };
  },

  /** Simulate releasing escrowed funds to the freelancer. */
  async release({ gatewayId, amount }) {
    await new Promise((r) => setTimeout(r, 50));
    if (!gatewayId) return { ok: false, gatewayId: null, failureReason: 'No charge to release.' };
    return { ok: true, gatewayId: `mock_payout_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, amount };
  },

  /** Simulate refunding escrowed funds back to the client. */
  async refund({ gatewayId, amount }) {
    await new Promise((r) => setTimeout(r, 50));
    if (!gatewayId) return { ok: false, gatewayId: null, failureReason: 'No charge to refund.' };
    return { ok: true, gatewayId: `mock_ref_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, amount };
  },
};

// ── Registry ─────────────────────────────────────────────────────────────────
const providers = {
  mock: mockProvider,
  // stripe: require('./providers/stripe'),  // ← future integration
  // paypal: require('./providers/paypal'),  // ← future integration
};

/**
 * Resolve the active payment provider.
 * @returns {{ charge: Function, release: Function, refund: Function, name: string }}
 */
const getPaymentProvider = () => {
  const name = process.env.PAYMENT_PROVIDER || 'mock';
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown payment provider "${name}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
};

module.exports = { getPaymentProvider, providers };
