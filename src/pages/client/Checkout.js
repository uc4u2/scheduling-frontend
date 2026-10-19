// src/pages/client/Checkout.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { setActiveCurrency, normalizeCurrency, resolveCurrencyForCountry, getActiveCurrency } from "../../utils/currency";
import { api as apiClient, API_BASE_URL } from "../../utils/api";
import { CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE } from "../../utils/bookingErrors";
import {
  buildHostedCheckoutPayload,
  startHostedCheckout,
  releasePendingCheckout,
  getOrCreateCheckoutRequestKey,
  clearCheckoutRequestKey,
} from "../../utils/hostedCheckout";
import { CartTypes, loadCart, saveCart, clearCart, setCartTenantContext } from "../../utils/cart";
import { getTenantHostMode } from "../../utils/tenant";
import {
  confirmIssuedClientSession,
  publishClientSessionState,
  verifyClientSessionForTenant,
} from "../../utils/clientSession";
