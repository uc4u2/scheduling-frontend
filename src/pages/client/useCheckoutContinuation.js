// Checkout continuation extracted from CheckoutFormCore so the module stays uploadable.
// Behavior matches the previous single-file function, including hook order.
import React, { useEffect } from "react";
import { api as apiClient } from "../../utils/api";
import { CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE } from "../../utils/bookingErrors";
import { normalizeCurrency } from "../../utils/currency";
import { clearCart } from "../../utils/cart";
import { buildHostedCheckoutPayload, startHostedCheckout, clearCheckoutRequestKey } from "../../utils/hostedCheckout";
import { confirmIssuedClientSession, issueClientSessionHandoff } from "../../utils/clientSession";
import { requestTransactionalNavigation } from "../../utils/transactionalFrameBridge";
import { Box, Paper, Stack, Typography, List, ListItem, ListItemText, Divider, Button, Alert, AlertTitle } from "@mui/material";
import { formatCurrency } from "../../utils/formatters";

export function useCheckoutContinuation(props) {
  const {
    physicalProductItems,
    deliveryMethodPolicy,
    requiresShippingAddress,
    deliveryOk,
    slugLocal,
    verificationEnabled,
    hasAcceptedShippingVerification,
    setShippingRates,
    EMPTY_SHIPPING_RATES,
    productDelivery,
    deliveryMethodOptions,
    normalizeDeliveryCountryCode,
    productItems,
    getQuantity,
    addressVerification,
    manualShippingPricingActive,
    shippingEstimateRefreshNonce,
    productMetadataLoading,
    setErr,
    deliveryErrors,
    shippingRates,
    manualShippingKnown,
    isCrossBorderShipping,
    requireImportChargesAcknowledgement,
    importChargesAcknowledged,
    setProductDelivery,
    allowedDeliveryMethods,
    clearShippingRatesState,
    resetShippingVerificationState,
    setImportChargesAcknowledged,
    setAddressVerification,
    setGuest,
    guest,
    serviceItems,
    setActiveItemId,
    setDlgAddonOpen,
    setDlgSvcOpen,
    activeItemId,
    cart,
    getAddonIds,
    getAddons,
    recomputeTip,
    persist,
    couponCode,
    setCouponError,
    isProduct,
    isPackage,
    setCouponCode,
    client,
    clientPackages,
    packagesForService,
    finalTotal,
    tipAllowedNow,
    showPublicBookingUnavailable,
    displayCurrency,
    selectedShippingRateSnapshot,
    importChargesNoticeVersion,
    importChargesAcknowledgementQuotePublicId,
    currentShippingCountry,
    importChargesAcknowledgementCustomsHash,
    stashProductOrder,
    clearProductOrderStash,
    setCart,
    setDone,
    onSuccess,
    loading,
    packageItems,
    productCheckoutEnabled,
    packageOnlyTotal,
    setLoading,
    normalizeProductOrder,
    companySlug,
    showPayOption,
    effectivePaymentMode,
    checkoutRequestKey,
    setCheckoutRequestGeneration,
    setShippingEstimateRefreshNonce,
    showCaptureOption,
    cardOnFileEnabled,
    cardOnFileConsentAccepted,
    setCardOnFileConsentError,
    policy,
    setClient,
    onRequestAddService,
    productsReturnTo,
    isCustomDomain,
    navigate,
    done,
    embedSuffix,
    basePath,
    primaryButtonSx,
    outlineButtonSx,
    textButtonSx,
    borderColor,
    checkoutTextColor,
    infoAlertSx,
    onBack,
  } = props;

useEffect(() => {
    if (
      physicalProductItems.length === 0 ||
      deliveryMethodPolicy.loading ||
      deliveryMethodPolicy.source === "default" ||
      !requiresShippingAddress ||
      !deliveryOk ||
      !slugLocal ||
      (verificationEnabled && !hasAcceptedShippingVerification)
    ) {
      setShippingRates((prev) => ({ ...EMPTY_SHIPPING_RATES, selectedRateId: prev?.selectedRateId || "" }));
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setShippingRates((prev) => ({ ...prev, loading: true, message: "" }));
        const selectedDeliveryMethod = productDelivery.delivery_method || deliveryMethodOptions[0]?.[0] || "";
        const payload = {
          delivery_method: selectedDeliveryMethod,
          shipping: {
            name: productDelivery.shipping?.name || "",
            phone: productDelivery.shipping?.phone || "",
            address1: productDelivery.shipping?.address1 || "",
            address2: productDelivery.shipping?.address2 || "",
            city: productDelivery.shipping?.city || "",
            region: productDelivery.shipping?.region || "",
            postal_code: productDelivery.shipping?.postal_code || "",
            country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
            instructions: productDelivery.shipping?.instructions || "",
          },
          items: productItems.map((item) => ({
            product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
            variant_id: item.variant_id != null ? Number(item.variant_id) : undefined,
            quantity: getQuantity(item),
          })),
        };
        if (verificationEnabled && hasAcceptedShippingVerification && addressVerification.token) {
          payload.shipping_address_verification_token = addressVerification.token;
        }
        const endpoint = manualShippingPricingActive
          ? `/public/${slugLocal}/shipping/manual-estimate`
          : `/public/${slugLocal}/shipping/rates`;
        const { data } = await apiClient.post(endpoint, payload);
        if (cancelled) return;
        if (manualShippingPricingActive) {
          setShippingRates({
            ...EMPTY_SHIPPING_RATES,
            loading: false,
            available: false,
            message: data?.message || "",
            manualDecision: data || null,
            manualEstimateToken: data?.estimate_token || "",
          });
          return;
        }
        const rates = Array.isArray(data?.rates) ? data.rates : [];
        const defaultRateId =
          data?.default_rate_id || (rates[0] && (rates[0].rate_id || rates[0].id)) || "";
        setShippingRates((prev) => {
          const priorSelected = prev?.selectedRateId || "";
          const stillExists = rates.some((rate) => String(rate?.rate_id || rate?.id || "") === String(priorSelected));
          return {
            loading: false,
            available: Boolean(data?.available) && rates.length > 0,
            fallbackManual: Boolean(data?.fallback_manual),
            message: data?.message || "",
            rates,
            selectedRateId: stillExists ? priorSelected : String(defaultRateId || ""),
            quoteToken: data?.shipping_rate_quote_token || "",
            quoteExpiresAt: data?.quote_expires_at || "",
            dutiesIncluded: Boolean(data?.duties_included),
            importChargesNoticeVersion: String(data?.import_charges_notice_version || "").trim(),
            importChargesNoticeSnapshot:
              data?.import_charges_notice_snapshot && typeof data.import_charges_notice_snapshot === "object"
                ? data.import_charges_notice_snapshot
                : null,
            requireImportChargesAcknowledgement: Boolean(data?.require_import_charges_acknowledgement),
            incompatibleItems: Array.isArray(data?.incompatible_items) ? data.incompatible_items : [],
          };
        });
      } catch (error) {
        if (cancelled) return;
        const message = error?.response?.data?.message || error?.response?.data?.error || (
          manualShippingPricingActive
            ? "Shipping could not be confirmed. Check the address and try again."
            : "Live rates unavailable. You can continue with manual shipping."
        );
        setShippingRates({
          ...EMPTY_SHIPPING_RATES,
          loading: false,
          available: false,
          fallbackManual: Boolean(error?.response?.data?.fallback_manual),
          message,
          rates: [],
          selectedRateId: "",
          quoteToken: "",
          quoteExpiresAt: "",
          dutiesIncluded: false,
          importChargesNoticeVersion: "",
          importChargesNoticeSnapshot: null,
          requireImportChargesAcknowledgement: false,
          incompatibleItems: Array.isArray(error?.response?.data?.incompatible_items)
            ? error.response.data.incompatible_items
            : [],
        });
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    physicalProductItems,
    productItems,
    deliveryMethodPolicy.loading,
    deliveryMethodPolicy.source,
    requiresShippingAddress,
    deliveryOk,
    slugLocal,
    productDelivery.delivery_method,
    deliveryMethodOptions,
    productDelivery.shipping?.name,
    productDelivery.shipping?.phone,
    productDelivery.shipping?.address1,
    productDelivery.shipping?.address2,
    productDelivery.shipping?.city,
    productDelivery.shipping?.region,
    productDelivery.shipping?.postal_code,
    productDelivery.shipping?.country,
    productDelivery.shipping?.instructions,
    verificationEnabled,
    hasAcceptedShippingVerification,
    addressVerification.token,
    manualShippingPricingActive,
    shippingEstimateRefreshNonce,
  ]);
const persistDeliveryPrefill = () => {
    try {
      localStorage.setItem(
        "checkout_product_delivery_prefill",
        JSON.stringify({
          delivery_method: productDelivery.delivery_method || "",
          pickup_instructions: productDelivery.pickup_instructions || "",
          shipping: productDelivery.shipping || {},
        })
      );
    } catch {
      // ignore
    }
  };
const ensureProductDeliveryValid = () => {
    if (physicalProductItems.length === 0) return true;
    if (productMetadataLoading) {
      setErr("Checking product delivery requirements. Please wait a moment.");
      return false;
    }
    if (!deliveryOk) {
      setErr(deliveryErrors[0] || "Please complete delivery details.");
      return false;
    }
    if (
      requiresShippingAddress &&
      verificationEnabled &&
      !hasAcceptedShippingVerification
    ) {
      setErr("Verify the delivery address before continuing.");
      return false;
    }
    if (requiresShippingAddress && manualShippingPricingActive && shippingRates.loading) {
      setErr("Confirming shipping. Please wait a moment.");
      return false;
    }
    if (
      requiresShippingAddress &&
      manualShippingPricingActive &&
      (!manualShippingKnown || !shippingRates.manualEstimateToken)
    ) {
      setErr(shippingRates.message || "Shipping could not be confirmed for this destination. Refresh the estimate before paying.");
      return false;
    }
    if (
      requiresShippingAddress &&
      shippingRates.available &&
      Array.isArray(shippingRates.rates) &&
      shippingRates.rates.length > 0 &&
      !shippingRates.selectedRateId
    ) {
      setErr("Please select a shipping option.");
      return false;
    }
    if (
      requiresShippingAddress &&
      shippingRates.quoteExpiresAt &&
      new Date(shippingRates.quoteExpiresAt).getTime() <= Date.now()
    ) {
      setErr("Your shipping quote expired. Refresh rates and select a current shipping option.");
      return false;
    }
    if (
      requiresShippingAddress &&
      isCrossBorderShipping &&
      requireImportChargesAcknowledgement &&
      !importChargesAcknowledged
    ) {
      setErr("Please acknowledge that import charges may be collected separately before continuing.");
      return false;
    }
    return true;
  };
const handleDeliveryMethod = (event) => {
    const value = String(event.target.value || "pickup").toLowerCase();
    setProductDelivery((prev) => ({
      ...prev,
      delivery_method: allowedDeliveryMethods.includes(value)
        ? value
        : (allowedDeliveryMethods.length === 1 ? (deliveryMethodOptions[0]?.[0] || "") : ""),
    }));
    clearShippingRatesState();
    resetShippingVerificationState();
    setImportChargesAcknowledged(false);
  };
const handleShippingField = (field) => (event) => {
    const value = field === "country"
      ? normalizeDeliveryCountryCode(event.target.value)
      : event.target.value;
    setProductDelivery((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [field]: value,
      },
    }));
    clearShippingRatesState();
    resetShippingVerificationState();
    setImportChargesAcknowledged(false);
  };
const verifyAddressForShipping = async () => {
    if (!slugLocal || !verificationEnabled || addressVerification.loading) return;
    const shippingPayload = {
      address1: productDelivery.shipping?.address1 || "",
      address2: productDelivery.shipping?.address2 || "",
      city: productDelivery.shipping?.city || "",
      region: productDelivery.shipping?.region || "",
      postal_code: productDelivery.shipping?.postal_code || "",
      country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
    };
    setErr("");
    clearShippingRatesState();
    setAddressVerification((prev) => ({ ...prev, loading: true, messages: [] }));
    try {
      const { data } = await apiClient.post(`/public/${slugLocal}/shipping/verify-address`, {
        shipping: shippingPayload,
      });
      const status = String(data?.status || "idle");
      if (status === "verified") {
        const acceptedAddress = data?.accepted_address || shippingPayload;
        setProductDelivery((prev) => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            ...acceptedAddress,
          },
        }));
        setAddressVerification({
          loading: false,
          status,
          token: data?.verification_token || "",
          acceptedAddress,
          originalAddress: null,
          suggestedAddress: null,
          differences: [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          retryable: false,
          residential: data?.residential ?? null,
          verificationLevel: String(data?.verification_level || "provider_verified"),
        });
        return;
      }
      if (status === "corrected") {
        setAddressVerification({
          loading: false,
          status,
          token: data?.verification_token || "",
          acceptedAddress: null,
          originalAddress: data?.original_address || shippingPayload,
          suggestedAddress: data?.suggested_address || null,
          differences: Array.isArray(data?.differences) ? data.differences : [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          retryable: false,
          residential: data?.residential ?? null,
          verificationLevel: String(data?.verification_level || "provider_corrected"),
        });
        return;
      }
      if (status === "customer_confirmation_required") {
        const acceptedAddress = data?.accepted_address || shippingPayload;
        setAddressVerification({
          loading: false,
          status,
          token: data?.verification_token || "",
          acceptedAddress,
          originalAddress: acceptedAddress,
          suggestedAddress: null,
          differences: [],
          messages: Array.isArray(data?.messages) ? data.messages : [],
          retryable: false,
          residential: data?.residential ?? null,
          verificationLevel: String(data?.verification_level || ""),
        });
        return;
      }
      setAddressVerification({
        loading: false,
        status,
        token: "",
        acceptedAddress: null,
        originalAddress: data?.original_address || null,
        suggestedAddress: data?.suggested_address || null,
        differences: [],
        messages: Array.isArray(data?.messages) ? data.messages : [],
        retryable: Boolean(data?.retryable),
        residential: data?.residential ?? null,
        verificationLevel: "",
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || "Address verification is temporarily unavailable. Please try again.";
      setAddressVerification({
        loading: false,
        status: "provider_unavailable",
        token: "",
        acceptedAddress: null,
        originalAddress: null,
        suggestedAddress: null,
        differences: [],
        messages: [message],
        retryable: true,
        residential: null,
        verificationLevel: "",
      });
    }
  };
const acceptVerifiedAddress = async (choice) => {
    if (!slugLocal || !addressVerification.token || addressVerification.loading) return;
    setErr("");
    clearShippingRatesState();
    setAddressVerification((prev) => ({ ...prev, loading: true }));
    try {
      const { data } = await apiClient.post(`/public/${slugLocal}/shipping/accept-address`, {
        verification_token: addressVerification.token,
        choice,
      });
      const acceptedAddress = data?.accepted_address || {};
      setProductDelivery((prev) => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          ...acceptedAddress,
        },
      }));
      setAddressVerification({
        loading: false,
        status: "verified",
        token: data?.verification_token || "",
        acceptedAddress,
        originalAddress: null,
        suggestedAddress: null,
        differences: [],
        messages: Array.isArray(data?.messages) ? data.messages : [],
        retryable: false,
        residential: data?.residential ?? null,
        verificationLevel: String(data?.verification_level || addressVerification.verificationLevel || ""),
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || "Unable to accept the verified address.";
      setAddressVerification((prev) => ({
        ...prev,
        loading: false,
        messages: [message],
      }));
    }
  };
const handleGuest = (e) => setGuest({ ...guest, [e.target.name]: e.target.value });
const openAddons = () => {
    if (serviceItems.length === 0) return;
    if (serviceItems.length === 1) {
      setActiveItemId(serviceItems[0].id);
      setDlgAddonOpen(true);
    } else {
      setDlgSvcOpen(true);
    }
  };
const pickService = (id) => {
    setActiveItemId(id);
    setDlgSvcOpen(false);
    setDlgAddonOpen(true);
  };
const activeItem = serviceItems.find((c) => c.id === activeItemId);
const toggleAddon = (addon) => {
    if (!activeItem) return;
    const updatedCart = cart.map((c) => {
      if (c.id !== activeItem.id) return c;
      const existingIds = getAddonIds(c);
      const existingAddons = getAddons(c);
      const has = existingIds.includes(addon.id);
      const updated = {
        ...c,
        addon_ids: has ? existingIds.filter((a) => a !== addon.id) : [...existingIds, addon.id],
        addons: has ? existingAddons.filter((a) => a.id !== addon.id) : [...existingAddons, addon],
      };
      return updated.tip_mode === "percent" ? recomputeTip(updated) : updated;
    });
    persist(updatedCart);
    setActiveItemId(activeItem.id);
  };
const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponError("");
    try {
      const updatedCart = await Promise.all(
        cart.map(async (item) => {
          if (isProduct(item) || isPackage(item) || item.client_package_id) return item;
          try {
            const { data } = await apiClient.post(`/booking/coupons/validate`, {
              code: couponCode.trim(),
              service_id: item.service_id,
            });
            if (data.valid) {
              const withCoupon = { ...item, couponApplied: true, coupon: data.coupon };
              return withCoupon.tip_mode === "percent" ? recomputeTip(withCoupon) : withCoupon;
            } else {
              const cleared = { ...item, couponApplied: false, coupon: null };
              return cleared.tip_mode === "percent" ? recomputeTip(cleared) : cleared;
            }
          } catch {
            const cleared = { ...item, couponApplied: false, coupon: null };
            return cleared.tip_mode === "percent" ? recomputeTip(cleared) : cleared;
          }
        })
      );

      const anyValid = updatedCart.some((item) => !isProduct(item) && !isPackage(item) && item.couponApplied);
      if (!anyValid) {
        setCouponError("Coupon does not apply to any services");
        persist(updatedCart.map(({ couponApplied, coupon, ...rest }) => rest));
        return;
      }

      persist(updatedCart);
      setCouponError("");
      setCouponCode("");
    } catch {
      setCouponError("Failed to validate coupon");
    }
  };
const removeCouponFromItem = (id) => {
    const updatedCart = cart.map((c) => {
      if (c.id !== id) return c;
      const cleared = { ...c, couponApplied: false, coupon: null };
      return cleared.tip_mode === "percent" ? recomputeTip(cleared) : cleared;
    });
    persist(updatedCart);
  };
const setTipPercent = (id, pct) => {
    const updated = cart.map((i) =>
      i.id === id ? recomputeTip({ ...i, tip_mode: "percent", tip_value: Number(pct || 0) }) : i
    );
    persist(updated);
  };
const setTipCustomPercent = (id, pct) => setTipPercent(id, pct);
const setTipAmount = (id, amt) => {
    const updated = cart.map((i) =>
      i.id === id ? { ...i, tip_mode: "amount", tip_amount: Math.max(0, Number(amt || 0)) } : i
    );
    persist(updated);
  };
const setPackageForItem = (id, packageId) => {
    const normalizedId = packageId ? Number(packageId) : null;
    const updated = cart.map((i) => {
      if (i.id !== id) return i;
      const next = {
        ...i,
        client_package_id: normalizedId,
        package_auto_opt_out: normalizedId ? false : true,
        couponApplied: normalizedId ? false : i.couponApplied,
        coupon: normalizedId ? null : i.coupon,
      };
      return next.tip_mode === "percent" ? recomputeTip(next) : next;
    });
    persist(updated);
  };
useEffect(() => {
    if (!client || serviceItems.length === 0 || clientPackages.length === 0) return;

    const remainingByPackage = new Map();
    clientPackages.forEach((pkg) => {
      const pkgId = Number(pkg?.id || 0);
      const remaining = Number(pkg?.remaining ?? 0);
      if (pkgId > 0 && remaining > 0) remainingByPackage.set(pkgId, remaining);
    });

    let changed = false;
    const updated = cart.map((item) => {
      if (isProduct(item) || isPackage(item) || !item?.allow_packages) return item;

      const eligible = packagesForService(item.service_id).filter((pkg) => {
        const pkgId = Number(pkg?.id || 0);
        return pkgId > 0 && Number(remainingByPackage.get(pkgId) || 0) > 0;
      });

      if (eligible.length === 0) {
        if (item.client_package_id) {
          changed = true;
          return { ...item, client_package_id: null };
        }
        return item;
      }

      const selectedId = Number(item.client_package_id || 0);
      if (selectedId > 0 && Number(remainingByPackage.get(selectedId) || 0) > 0) {
        remainingByPackage.set(selectedId, Number(remainingByPackage.get(selectedId) || 0) - 1);
        return item;
      }

      if (item.package_auto_opt_out) {
        return { ...item, client_package_id: null };
      }

      const autoPkg = eligible[0];
      const autoPkgId = Number(autoPkg?.id || 0);
      if (autoPkgId > 0) {
        remainingByPackage.set(autoPkgId, Number(remainingByPackage.get(autoPkgId) || 0) - 1);
        changed = true;
        const next = {
          ...item,
          client_package_id: autoPkgId,
          package_auto_opt_out: false,
          couponApplied: false,
          coupon: null,
        };
        return next.tip_mode === "percent" ? recomputeTip(next) : next;
      }

      return item;
    });

    if (changed) {
      persist(updated);
    }
  }, [cart, client, clientPackages]);
const bookServiceLines = async (
    paymentIntentId = null,
    setupIntentId = null,
    { shouldRethrow = false } = {}
  ) => {
    if (serviceItems.length === 0) return [];

    const useBatchBooking = serviceItems.length > 1;

    const compactCart = serviceItems.map(
      ({
        service_id,
        artist_id,
        date,
        start_time,
        end_time,
        start_utc,
        end_utc,
        availability_id,
        timezone,
        addon_ids,
        client_package_id,
      }) => ({
        service_id,
        artist_id,
        date,
        start_time,
        end_time: end_time || null,
        start_utc: start_utc || null,
        end_utc: end_utc || null,
        availability_id: availability_id ?? null,
        timezone: timezone || null,
        addon_ids,
        client_package_id: client_package_id ?? null,
      })
    );

    const headers = {
      "Idempotency-Key": window.crypto?.randomUUID?.() ?? String(Date.now()),
    };

    if (useBatchBooking) {
      const payload = {
        client_name: client?.full_name || guest.name,
        client_email: client?.email || guest.email,
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...(setupIntentId ? { setup_intent_id: setupIntentId } : {}),
        ...(finalTotal <= 0 ? { allow_unpaid: true } : {}),
        send_email: true,
        items: serviceItems.map((it) => ({
          artist_id: it.artist_id,
          service_id: it.service_id,
          date: it.date,
          start_time: it.start_time,
          end_time: it.end_time || null,
          start_utc: it.start_utc || null,
          end_utc: it.end_utc || null,
          availability_id: it.availability_id ?? null,
          timezone: it.timezone || null,
          addon_ids: getAddonIds(it),
          ...(it.client_package_id ? { client_package_id: it.client_package_id } : {}),
          ...(it.couponApplied && it.coupon ? { coupon_code: it.coupon.code } : {}),
          tip_amount: tipAllowedNow ? Number((it.tip_amount || 0).toFixed(2)) : 0,
        })),
      };

      try {
        const { data: res } = await apiClient.post(
          `/public/${slugLocal}/book-batch`,
          payload,
          { headers }
        );
        const appointmentIds = Array.isArray(res?.appointment_ids) ? res.appointment_ids : [];
        return serviceItems.map((it, idx) => ({
          appointment_id: appointmentIds[idx] || null,
          service_name: it.service_name || it.name || "Service",
          artist_name: it.artist_name || "Provider",
          date: it.date,
          start_time: it.start_time,
          tip_amount: tipAllowedNow ? Number((it.tip_amount || 0).toFixed(2)) : 0,
          payment_status: res?.payment_status || null,
          paid_via: it.client_package_id ? "package" : null,
        }));
      } catch (err) {
        const data = err?.response?.data;
        if (err?.response?.status === 402 && data?.error === "subscription_required") {
          showPublicBookingUnavailable();
        } else if (data?.error_code === "CLIENT_BOOKING_BLOCKED") {
          setErr(CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE);
        } else if (err?.response?.status === 409 && data) {
          const conflicts = Array.isArray(data.conflicts)
            ? data.conflicts
                .map((c) => `  ${c.source || "busy"}: ${c.busy_start_local} ? ${c.busy_end_local}`)
                .join("\n")
            : "";
          const parts = [
            data.error || "Selected time is no longer available.",
            conflicts ? `Conflicts:\n${conflicts}` : null,
          ].filter(Boolean);
          setErr(parts.join("\n\n"));
        } else {
          setErr(data?.error || err.message || "Booking failed");
        }
        if (shouldRethrow) throw err;
        return [];
      }
    }

    const results = [];
    for (const it of serviceItems) {
      const payload = {
        service_id: it.service_id,
        artist_id: it.artist_id,
        date: it.date,
        start_time: it.start_time,
        end_time: it.end_time || null,
        start_utc: it.start_utc || null,
        end_utc: it.end_utc || null,
        availability_id: it.availability_id ?? null,
        timezone: it.timezone || null,
        addon_ids: getAddonIds(it),
        client_name: client?.full_name || guest.name,
        client_email: client?.email || guest.email,
        ...(it.client_package_id ? { client_package_id: it.client_package_id } : {}),
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...(setupIntentId ? { setup_intent_id: setupIntentId } : {}),
        ...(it.couponApplied && it.coupon ? { coupon_code: it.coupon.code } : {}),
        tip_amount: tipAllowedNow ? Number((it.tip_amount || 0).toFixed(2)) : 0,
        cart: compactCart,
      };
      try {
        const { data: res } = await apiClient.post(
          `/public/${slugLocal}/book`,
          payload,
          { headers }
        );
        results.push(res);
      } catch (err) {
        const data = err?.response?.data;
        if (err?.response?.status === 402 && data?.error === "subscription_required") {
          showPublicBookingUnavailable();
        } else if (data?.error_code === "CLIENT_BOOKING_BLOCKED") {
          setErr(CLIENT_BOOKING_BLOCKED_PUBLIC_MESSAGE);
        } else if (err?.response?.status === 409 && data) {
          const conflicts = Array.isArray(data.conflicts)
            ? data.conflicts
                .map((c) => `  ${c.source || "busy"}: ${c.busy_start_local} ? ${c.busy_end_local}`)
                .join('\n')
            : '';
          const parts = [
            data.error || 'Selected time is no longer available.',
            data.requested_start_local && data.requested_end_local
              ? `Requested: ${data.requested_start_local} ? ${data.requested_end_local}`
              : null,
            data.cooling_minutes_applied
              ? `Includes ${data.cooling_minutes_applied} min cooling`
              : null,
            conflicts ? `Conflicts:\n${conflicts}` : null,
          ].filter(Boolean);
          setErr(parts.join('\n\n'));
        } else {
          setErr(data?.error || err.message || "Booking failed");
        }
        if (shouldRethrow) throw err;
        return [];
      }
    }
    return results;
  };
const submitProductOrder = async ({
    paymentIntentId = null,
    setupIntentId = null,
    allowUnpaid = false,
  } = {}) => {
    if (productItems.length === 0) return null;
    if (!ensureProductDeliveryValid()) {
      throw new Error("Delivery details are incomplete.");
    }
    const shippingPayload = {
      name: productDelivery.shipping?.name || "",
      phone: productDelivery.shipping?.phone || "",
      address1: productDelivery.shipping?.address1 || "",
      address2: productDelivery.shipping?.address2 || "",
      city: productDelivery.shipping?.city || "",
      region: productDelivery.shipping?.region || "",
      postal_code: productDelivery.shipping?.postal_code || "",
      country: normalizeDeliveryCountryCode(productDelivery.shipping?.country || ""),
      instructions: productDelivery.shipping?.instructions || "",
    };
    const payload = {
      items: productItems.map((item) => ({
        product_id: Number(item.product_id ?? String(item.id).replace(/^product-/, "")),
        variant_id: item.variant_id != null ? Number(item.variant_id) : undefined,
        quantity: getQuantity(item),
      })),
      client_name: client?.full_name || guest.name,
      client_email: client?.email || guest.email,
      client_phone: client?.phone || productDelivery.shipping?.phone || "",
      payment_intent_id: paymentIntentId,
      setup_intent_id: setupIntentId,
      allow_unpaid: allowUnpaid,
      currency: (normalizeCurrency(displayCurrency) || "USD").toLowerCase(),
      delivery_method: productDelivery.delivery_method || deliveryMethodOptions[0]?.[0] || "",
      pickup_instructions: productDelivery.pickup_instructions || "",
      shipping: shippingPayload,
      selected_rate_id: shippingRates.selectedRateId || undefined,
      shipping_rate_quote_token: shippingRates.quoteToken || undefined,
      manual_shipping_estimate_token: shippingRates.manualEstimateToken || undefined,
      selected_shipping_rate_snapshot: selectedShippingRateSnapshot || undefined,
      shipping_address_verification_token: addressVerification.token || undefined,
      import_charges_acknowledged:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesAcknowledged
          : undefined,
      import_charges_notice_version:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesNoticeVersion || undefined
          : undefined,
      import_charges_acknowledgement_quote_public_id:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesAcknowledgementQuotePublicId || undefined
          : undefined,
      import_charges_acknowledgement_destination_country:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? currentShippingCountry || undefined
          : undefined,
      import_charges_acknowledgement_customs_hash:
        requireImportChargesAcknowledgement && isCrossBorderShipping
          ? importChargesAcknowledgementCustomsHash || undefined
          : undefined,
    };

    try {
      persistDeliveryPrefill();
      const { data } = await apiClient.post(
        `/public/${slugLocal}/buy-products`,
        payload
      );
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error.message || "Product order failed";
      setErr(msg);
      throw error;
    }
  };
const finalizeSuccess = ({ serviceResults = [], productOrder = null }) => {
    const name = client?.full_name || guest.name;
    const email = client?.email || guest.email;
    try {
      if (productOrder) {
        stashProductOrder(productOrder, productOrder.stripe_session_id);
      } else {
        clearProductOrderStash();
      }
    } catch {}
    clearCart();
    setCart([]);
    setErr("");
    setDone({
      customer: { name, email },
      serviceResults,
      productOrder,
    });
    try {
      window.dispatchEvent(new Event("booking:changed"));
    } catch {}
    const primaryResult =
      serviceResults.length === 1 && serviceResults[0]?.success
        ? serviceResults[0]
        : null;
    if (primaryResult) {
      onSuccess?.(primaryResult);
    }
  };
const bookWithoutPayment = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    if (!slugLocal) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }
    if (serviceItems.length === 0 && productItems.length === 0 && packageItems.length === 0) {
      setErr("Your cart is empty.");
      return;
    }
    if (productItems.length > 0 && !productCheckoutEnabled) {
      setErr("This store is not currently accepting online Product payments.");
      return;
    }
    if (packageItems.length > 0) {
      setErr("Package purchases require online payment.");
      return;
    }
    if (finalTotal <= 0 && !packageOnlyTotal) {
      setErr("Cart total must be greater than zero.");
      return;
    }
    if ((serviceItems.length > 0 && productItems.length > 0) || (packageItems.length > 0 && (serviceItems.length > 0 || productItems.length > 0))) {
      setErr("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      return;
    }
    if (!ensureProductDeliveryValid()) {
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const serviceResults = serviceItems.length > 0 ? await bookServiceLines() : [];
      if (serviceItems.length > 0 && !serviceResults.length) {
        return;
      }

      const productOrder =
        productItems.length > 0
          ? normalizeProductOrder(await submitProductOrder({ allowUnpaid: true }))
          : null;
      finalizeSuccess({ serviceResults, productOrder });
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        showPublicBookingUnavailable();
        return;
      }
      setErr(ex.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };
const payAndBook = async (e) => {
    e.preventDefault();
    if (loading) return;

    const slug = slugLocal || companySlug;
    if (!slug) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }

    if (!showPayOption) {
      setErr(productItems.length > 0 ? "This store is not currently accepting online Product payments." : "Immediate payment is not enabled for this company.");
      return;
    }

    if (serviceItems.length === 0 && productItems.length === 0 && packageItems.length === 0) {
      setErr("Your cart is empty.");
      return;
    }
    if (finalTotal <= 0) {
      setErr("No payment is due. Use Confirm booking to apply your package credits.");
      return;
    }
    if ((serviceItems.length > 0 && productItems.length > 0) || (packageItems.length > 0 && (serviceItems.length > 0 || productItems.length > 0))) {
      setErr("Services and retail products must be checked out separately. Please complete one checkout before starting another.");
      return;
    }
    if (!ensureProductDeliveryValid()) {
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const policyMode = effectivePaymentMode === "deposit" ? "deposit" : "pay";

      const payload = buildHostedCheckoutPayload({
        cartItems: cart,
        policyMode,
        currency: displayCurrency,
        clientName: client?.full_name || guest.name,
        clientEmail: client?.email || guest.email,
        clientPhone: client?.phone || productDelivery.shipping?.phone || "",
        productDelivery,
        selectedShippingRateSnapshot,
        selectedRateId: shippingRates.selectedRateId || undefined,
        shippingRateQuoteToken: shippingRates.quoteToken || undefined,
        manualShippingEstimateToken: shippingRates.manualEstimateToken || undefined,
        checkoutRequestKey: checkoutRequestKey || undefined,
        shippingAddressVerificationToken: addressVerification.token || undefined,
        importChargesAcknowledged:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledged
            : undefined,
        importChargesNoticeVersion:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesNoticeVersion || undefined
            : undefined,
        importChargesAcknowledgementQuotePublicId:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementQuotePublicId || undefined
            : undefined,
        importChargesAcknowledgementDestinationCountry:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? currentShippingCountry || undefined
            : undefined,
        importChargesAcknowledgementCustomsHash:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementCustomsHash || undefined
            : undefined,
        metadata: { source: "checkout", flow: policyMode },
      });

      persistDeliveryPrefill();
      await startHostedCheckout({
        slug,
        payload,
      });
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        showPublicBookingUnavailable();
        setLoading(false);
        return;
      }
      const message = data?.message || data?.error || ex?.message || "Unable to start Stripe Checkout.";
      if (data?.error === "checkout_session_expired") {
        clearCheckoutRequestKey({ scope: slug });
        setCheckoutRequestGeneration((value) => value + 1);
        setErr("The previous checkout expired and was verified as unpaid. Select Pay again to start a new checkout.");
      } else if (data?.error === "checkout_request_in_progress") {
        setErr("Checkout is still being created. Wait a moment, then select Pay again to recover the same checkout.");
      } else if (data?.error === "checkout_reconciliation_required") {
        setErr("Payment status is not confirmed yet. Do not start another payment; check this checkout again shortly.");
      } else if (data?.error === "checkout_request_conflict") {
        setErr("This checkout was already submitted with different details. Restore the original basket or wait for its payment status before starting a new purchase.");
      } else {
        setErr(message);
      }
      if (data?.error === "manual_shipping_requote_required") {
        setShippingEstimateRefreshNonce((value) => value + 1);
      }
      setLoading(false);
    }
  };
const saveCardAndBook = async (e) => {
    e.preventDefault();
    if (loading) return;

    const slug = slugLocal || companySlug;
    if (!slug) {
      setErr("Unable to determine company. Please reload the page or navigate from the site home.");
      return;
    }
    if (!showCaptureOption) {
      setErr("Saving a card on file is not enabled for this company.");
      return;
    }
    if (!cardOnFileEnabled) {
      setErr("Card on file is not available for this company.");
      return;
    }
    if (serviceItems.length === 0) {
      setErr("Save card is only available for service bookings. Please add a service to continue.");
      return;
    }
    if (productItems.length > 0 || packageItems.length > 0) {
      setErr("Save card is only available for service bookings. Please remove products or packages to continue.");
      return;
    }
    if (finalTotal <= 0) {
      setErr("No payment is due. Use Confirm booking to apply your package credits.");
      return;
    }
    if (!cardOnFileConsentAccepted) {
      setCardOnFileConsentError("Please accept the card-saving authorization to continue.");
      return;
    }

    setErr("");
    setCardOnFileConsentError("");
    setLoading(true);

    try {
      const payload = buildHostedCheckoutPayload({
        cartItems: cart,
        policyMode: "capture",
        currency: displayCurrency,
        clientName: client?.full_name || guest.name,
        clientEmail: client?.email || guest.email,
        clientPhone: client?.phone || productDelivery.shipping?.phone || "",
        productDelivery,
        selectedShippingRateSnapshot,
        selectedRateId: shippingRates.selectedRateId || undefined,
        shippingRateQuoteToken: shippingRates.quoteToken || undefined,
        manualShippingEstimateToken: shippingRates.manualEstimateToken || undefined,
        checkoutRequestKey: checkoutRequestKey || undefined,
        shippingAddressVerificationToken: addressVerification.token || undefined,
        importChargesAcknowledged:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledged
            : undefined,
        importChargesNoticeVersion:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesNoticeVersion || undefined
            : undefined,
        importChargesAcknowledgementQuotePublicId:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementQuotePublicId || undefined
            : undefined,
        importChargesAcknowledgementDestinationCountry:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? currentShippingCountry || undefined
            : undefined,
        importChargesAcknowledgementCustomsHash:
          requireImportChargesAcknowledgement && isCrossBorderShipping
            ? importChargesAcknowledgementCustomsHash || undefined
            : undefined,
        cardOnFileConsent: {
          accepted: true,
          policy_version: policy?.policy_version || undefined,
          policy_text_hash: policy?.policy_text_hash || undefined,
        },
        metadata: { source: "checkout", flow: "capture" },
      });

      await startHostedCheckout({
        slug,
        payload,
      });
    } catch (ex) {
      const data = ex?.response?.data || {};
      if (ex?.response?.status === 402 && data?.error === "subscription_required") {
        showPublicBookingUnavailable();
        setLoading(false);
        return;
      }
      const message = data?.message || data?.error || ex?.message || "Unable to start Stripe Checkout.";
      if (data?.error === "checkout_session_expired") {
        clearCheckoutRequestKey({ scope: slug });
        setCheckoutRequestGeneration((value) => value + 1);
        setErr("The previous checkout expired and was verified as incomplete. Select Save card again to start a new checkout.");
      } else if (data?.error === "checkout_request_in_progress") {
        setErr("Checkout is still being created. Wait a moment, then try again to recover the same checkout.");
      } else if (data?.error === "checkout_reconciliation_required") {
        setErr("Checkout status is not confirmed yet. Do not start another attempt; check again shortly.");
      } else {
        setErr(message);
      }
      setLoading(false);
    }
  };
const establishCheckoutClientSession = async (token) => {
    const tenantSlug = slugLocal || companySlug || "";
    const result = await confirmIssuedClientSession(token, tenantSlug, { apiClient });
    if (!result.signedIn || !result.profile?.email) {
      setClient(null);
      setErr(result.message);
      return;
    }
    setErr("");
    setClient(result.profile);
    setGuest({ name: result.profile.name || "", email: result.profile.email });
    issueClientSessionHandoff(tenantSlug, { apiClient });
  };
const handleLoginSuccess = (token) => {
    establishCheckoutClientSession(token);
  };
const handleRegisterSuccess = (token) => {
    establishCheckoutClientSession(token);
  };
const handleContinueProductShopping = () => {
    onRequestAddService?.();
    if (
      productsReturnTo &&
      typeof window !== "undefined" &&
      window.parent !== window &&
      requestTransactionalNavigation(window.parent, productsReturnTo)
    ) {
      return;
    }
    const target = slugLocal || companySlug;
    if (!target) return;
    const params = new URLSearchParams();
    params.set("page", "products");
    const path = isCustomDomain ? "/products" : `/${target}`;
    navigate({ pathname: path, search: isCustomDomain ? "" : `?${params.toString()}` });
  };
if (done) {
    const { customer, serviceResults = [], productOrder } = done;
    const productItems = Array.isArray(productOrder?.items) ? productOrder.items : [];
    const stripeCurrency = (productOrder?.stripe_currency || productOrder?.currency || productOrder?.currency_code || "USD").toUpperCase();
    const stripeSubtotal = productOrder?.stripe_subtotal_cents != null ? productOrder.stripe_subtotal_cents / 100 : null;
    const stripeTax = productOrder?.stripe_tax_cents != null ? productOrder.stripe_tax_cents / 100 : null;
    const productTotal = productOrder?.stripe_total_cents != null
      ? productOrder.stripe_total_cents / 100
      : Number(productOrder?.total_amount || productOrder?.total || 0);
    const displayCurrency = stripeCurrency;
    const buildSearch = (extra = {}) => {
      const qs = new URLSearchParams();
      if (embedSuffix) {
        const existing = new URLSearchParams(embedSuffix.slice(1));
        existing.forEach((value, key) => qs.set(key, value));
      }
      Object.entries(extra).forEach(([key, value]) => {
        if (value == null || value === '') return;
        qs.set(key, String(value));
      });
      const str = qs.toString();
      return str ? `?${str}` : '';
    };
    const goProducts = () => {
      if (!slugLocal) return;
      const search = buildSearch();
      navigate({ pathname: `${basePath}/products`, search });
    };
    const goBookings = () => {
      if (!slugLocal) return;
      const search = buildSearch({ page: 'my-bookings' });
      navigate({ pathname: basePath || "/", search });
    };
    const goHome = () => {
      if (!slugLocal) return;
      const search = buildSearch();
      navigate({ pathname: basePath || "/", search });
    };
    const disableNav = !slugLocal;

    return { early: <Box py={{ xs: 6, md: 8 }} px={{ xs: 2, md: 0 }} maxWidth={720} mx="auto">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
            color: "var(--page-body-color, inherit)",
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={1}>
              <Typography variant="h3" fontWeight={800}>
                Order confirmed
              </Typography>
              <Typography color="text.secondary">
                We sent a confirmation to {customer?.email || 'your inbox'}.
              </Typography>
              {productOrder?.id && (
                <Typography variant="body2" color="text.secondary">
                  Order #{productOrder.id}
                </Typography>
              )}
            </Stack>

            {serviceResults.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h5" fontWeight={700}>Appointments</Typography>
                <List disablePadding>
                  {serviceResults.map((res, idx) => {
                    const subtitle = res?.start_local && res?.end_local
                      ? `${res.start_local} - ${res.end_local}`
                      : res?.date
                      ? `${res.date} ${res.start_time || ''}`.trim()
                      : undefined;
                    return (
                      <React.Fragment key={res?.appointment_id || res?.id || idx}>
                        <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
                          <ListItemText
                            primaryTypographyProps={{ fontWeight: 600 }}
                            primary={
                              res?.service_name
                                ? `${res.service_name}${res?.artist_name ? ` with ${res.artist_name}` : ''}`
                                : 'Appointment'
                            }
                            secondary={subtitle}
                          />
                        </ListItem>
                        {idx !== serviceResults.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Stack>
            )}

            {productItems.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h5" fontWeight={700}>Products</Typography>
                <List disablePadding>
                  {productItems.map((item, idx) => {
                    const total = Number(item.total_price ?? (item.unit_price || 0) * (item.quantity || 1));
                    return (
                      <React.Fragment key={item.id || idx}>
                        <ListItem disableGutters sx={{ py: 1 }}>
                          <ListItemText
                            primaryTypographyProps={{ fontWeight: 600 }}
                            primary={`${item.name} x ${item.quantity || 1}`}
                            secondary={item.sku ? `SKU: ${item.sku}` : undefined}
                          />
                          <Typography fontWeight={600}>
                            {formatCurrency(total, displayCurrency)}
                          </Typography>
                        </ListItem>
                        {idx !== productItems.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    );
                  })}
                </List>
                {stripeSubtotal != null && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography fontWeight={600}>
                      {formatCurrency(stripeSubtotal, displayCurrency)}
                    </Typography>
                  </Stack>
                )}
                {stripeTax != null && stripeTax > 0 && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Tax</Typography>
                    <Typography fontWeight={600}>
                      {formatCurrency(stripeTax, displayCurrency)}
                    </Typography>
                  </Stack>
                )}
                {productOrder?.customer_shipping_amount_cents != null ? (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">Shipping</Typography>
                    <Typography fontWeight={600}>
                      {Number(productOrder.customer_shipping_amount_cents || 0) === 0
                        ? "Free"
                        : formatCurrency(
                            Number(productOrder.customer_shipping_amount_cents) / 100,
                            (productOrder.customer_shipping_currency || displayCurrency || "USD").toUpperCase()
                          )}
                    </Typography>
                  </Stack>
                ) : null}
                {Boolean(productOrder?.is_cross_border) && (
                  <>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography color="text.secondary">Duties included</Typography>
                      <Typography fontWeight={600}>No</Typography>
                    </Stack>
                    <Typography color="text.secondary">
                      Import charges may be collected separately.
                    </Typography>
                    {productOrder?.import_charges_notice_snapshot?.standard_notice ? (
                      <Typography color="text.secondary">
                        {productOrder.import_charges_notice_snapshot.standard_notice}
                      </Typography>
                    ) : null}
                  </>
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography color="text.secondary">
                    {productOrder?.is_cross_border ? "Total charged now" : "Total"}
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatCurrency(productTotal, displayCurrency)}
                  </Typography>
                </Stack>
              </Stack>
            )}

            <Typography color="text.secondary">
              Need to make a change? Reply to the confirmation email and our team will help.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                onClick={goProducts}
                disabled={disableNav}
                sx={primaryButtonSx}
              >
                Continue shopping
              </Button>
              {serviceResults.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={goBookings}
                  disabled={disableNav}
                  sx={outlineButtonSx}
                >
                  View my bookings
                </Button>
              )}
              <Button
                variant="text"
                onClick={goHome}
                disabled={disableNav}
                sx={textButtonSx}
              >
                Back to home
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box> };
  }
if (productItems.length > 0 && !productCheckoutEnabled) {
    return { early: <Box
        sx={{
          px: { xs: 1, sm: 2, md: 2.5 },
          py: { xs: 1.5, md: 2 },
          maxWidth: 720,
          mx: "auto",
        }}
      >
        <Paper
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            border: `1px solid ${borderColor}`,
            backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
            color: checkoutTextColor,
            boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.12))",
          }}
        >
          <Stack spacing={2}>
            <Alert severity="info" sx={infoAlertSx}>
              <AlertTitle>Online product checkout is currently unavailable</AlertTitle>
              This store is not accepting online product orders right now.
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                onClick={handleContinueProductShopping}
                sx={{ ...primaryButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                Continue shopping
              </Button>
              {onBack ? (
                <Button variant="text" onClick={onBack} sx={textButtonSx}>
                  Back
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Box> };
  }

  return {
    early: null,
    handleDeliveryMethod,
    handleShippingField,
    verifyAddressForShipping,
    acceptVerifiedAddress,
    handleGuest,
    openAddons,
    pickService,
    activeItem,
    toggleAddon,
    applyCoupon,
    removeCouponFromItem,
    setTipPercent,
    setTipCustomPercent,
    setTipAmount,
    setPackageForItem,
    bookWithoutPayment,
    payAndBook,
    saveCardAndBook,
    handleLoginSuccess,
    handleRegisterSuccess,
    handleContinueProductShopping,
  };
}
