// Checkout form presentation extracted from CheckoutFormCore.

import { Box, Paper, Stack, Typography, Alert, List, ListItem, IconButton, ListItemText, Divider, Chip, TextField, MenuItem, Button, FormControlLabel, Checkbox, Autocomplete, FormControl, Select, AlertTitle, CircularProgress, Dialog, DialogTitle, DialogContent, ListItemButton, ListItemIcon, DialogActions } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatCurrency } from "../../utils/formatters";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { requestTransactionalNavigation } from "../../utils/transactionalFrameBridge";
import PublicBookingUnavailableDialog from "../../components/billing/PublicBookingUnavailableDialog";
import { LoginDialog, RegisterDialog, ForgotPasswordDialog } from "./checkoutDialogs";

export function CheckoutFormView(props) {
  const {
    borderColor,
    checkoutTextColor,
    checkoutHeadingColor,
    holdMinutes,
    serviceItems,
    holdState,
    infoAlertSx,
    formatHoldCountdown,
    checkoutSectionColor,
    cart,
    lineSubtotal,
    client,
    packagesForService,
    isProduct,
    getQuantity,
    removeItem,
    currencyCode,
    isPackage,
    updatePackageQuantity,
    lineDiscount,
    tipAllowedNow,
    getAddons,
    packagesLoading,
    packagesError,
    setCouponExpanded,
    couponExpanded,
    couponError,
    textButtonSx,
    couponCode,
    setCouponCode,
    loading,
    outlineButtonSx,
    showOrderBreakdown,
    totalBeforeDiscount,
    totalDiscount,
    totalTip,
    shippingAmountKnown,
    shippingRateTotal,
    isCrossBorderShipping,
    paymentsEnabled,
    checkoutTotalLabel,
    finalTotal,
    requireImportChargesAcknowledgement,
    importChargesAcknowledged,
    setImportChargesAcknowledged,
    physicalProductItems,
    safeDeliveryMethodValue,
    CHECKOUT_SELECT_MENU_PROPS,
    deliveryMethodPolicy,
    deliveryMethodOptions,
    policyIsApiLoadedEmpty,
    requiresShippingAddress,
    productDelivery,
    shippingRegionRequired,
    shippingPostalRequired,
    normalizeDeliveryCountryCode,
    deliveryCountryOptions,
    currentDeliveryCountryValue,
    verificationEnabled,
    addressVerification,
    deliveryOk,
    resetShippingVerificationState,
    clearShippingRatesState,
    addressConfirmationChecked,
    setAddressConfirmationChecked,
    currentImportChargesNotice,
    manualShippingPricingActive,
    manualShippingKnown,
    manualShippingDecision,
    shippingRates,
    setShippingRates,
    setProductDelivery,
    err,
    packageOnlyTotal,
    effectivePaymentMode,
    productItems,
    hasPackagePurchase,
    businessName,
    showCaptureOption,
    packageItems,
    cardOnFileConsentAccepted,
    setCardOnFileConsentAccepted,
    setCardOnFileConsentError,
    companySlug,
    policy,
    cardOnFileConsentError,
    mobileCheckoutActionSx,
    mobileCheckoutTotal,
    primaryButtonSx,
    showOnlinePayment,
    showPayOption,
    payButtonLabel,
    bookButtonLabel,
    guest,
    setLoginDialogOpen,
    setRegisterDialogOpen,
    guestOk,
    productOnlyCheckout,
    serviceOnlyCheckout,
    onRequestAddService,
    servicesBrowsePath,
    navigate,
    onBack,
    dlgSvcOpen,
    setDlgSvcOpen,
    dlgAddonOpen,
    setDlgAddonOpen,
    addonOpts,
    getAddonIds,
    loginDialogOpen,
    registerDialogOpen,
    setForgotDialogOpen,
    forgotDialogOpen,
    publicUpgradeOpen,
    publicUpgradeMessage,
    companyContactEmail,
    companyContactPhone,
    setPublicUpgradeOpen,
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
  } = props;

  return (
    <Box
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
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
          color: checkoutTextColor,
          boxShadow: "var(--page-card-shadow, 0 18px 45px rgba(15,23,42,0.12))",
        }}
      >
        <Stack spacing={2}>
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ color: checkoutHeadingColor }}
        >
          Checkout
        </Typography>

      {typeof holdMinutes === "number" && holdMinutes > 0 && serviceItems.length > 0 && holdState.overall !== null && (
        <Alert
          severity={holdState.overall > 60_000 ? "info" : "warning"}
          sx={{
            mb: 1,
            py: 0.25,
            alignItems: "center",
            "& .MuiAlert-message": { py: 0.5, fontSize: "0.875rem" },
            ...(holdState.overall > 60_000 ? infoAlertSx : {}),
          }}
        >
          {holdState.overall > 0
            ? `Selected times reserved for ${formatHoldCountdown(holdState.overall)}. Complete checkout before they're released.`
            : "The hold window has expired. If you continue, the selected times may no longer be available."}
        </Alert>
      )}

      {/* Cart */}
      <List
        dense
        sx={{
          mb: 1.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          color: checkoutSectionColor,
          "& .MuiTypography-root": { color: checkoutSectionColor },
          "& .MuiListItemText-primary": { color: checkoutSectionColor },
          "& .MuiListItemText-secondary": { color: checkoutSectionColor },
          "& .MuiListItem-root": { py: 1.25 },
        }}
      >
        {cart.map((it) => {
          const subtotal = lineSubtotal(it);
          const packageOptions =
            client && it.allow_packages ? packagesForService(it.service_id) : [];
          const remainingCredits = packageOptions.reduce((sum, pkg) => {
            const remaining = Number(pkg?.remaining ?? 0);
            return sum + (Number.isFinite(remaining) ? remaining : 0);
          }, 0);
          const selectedPackageId = Number(it.client_package_id || 0);
          const selectedPackage = packageOptions.find(
            (pkg) => Number(pkg?.id || 0) === selectedPackageId
          );
          const selectedPackageLabel = selectedPackage
            ? `${selectedPackage?.template?.name || selectedPackage?.name || "Package"} (${Number(selectedPackage?.remaining ?? 0)} left)`
            : "Pay normally";

          if (isProduct(it)) {
            const quantity = getQuantity(it);
            return (
              <ListItem
                key={it.id}
                divider
                alignItems="flex-start"
                secondaryAction={
                  <IconButton color="error" aria-label={`Remove ${it.name} from checkout`} onClick={() => removeItem(it.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="baseline" sx={{ pr: 2 }}>
                      <Typography sx={{ fontWeight: 700 }}>{it.name}</Typography>
                      <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        {formatCurrency(subtotal, currencyCode)}
                      </Typography>
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Quantity: {quantity}
                      </Typography>
                      {quantity > 1 && (
                        <Typography variant="body2">
                          {quantity} × {formatCurrency(Number(it.price || 0), currencyCode)} each
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          }

          if (isPackage(it)) {
            const quantity = getQuantity(it);
            const sessions = Number(it.session_qty || 0);
            const displayName = it.package_name || `${sessions}-Session ${it.service_name || "Package"}`;
            const expiresIn = Number(it.expires_in || 0);
            return (
              <ListItem
                key={it.id}
                divider
                alignItems="flex-start"
                secondaryAction={
                  <IconButton color="error" aria-label={`Remove ${displayName} from checkout`} onClick={() => removeItem(it.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="baseline" sx={{ pr: 2 }}>
                      <Typography sx={{ fontWeight: 700 }}>{displayName}</Typography>
                      <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        {formatCurrency(subtotal, currencyCode)}
                      </Typography>
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Box>
                      {it.service_name && (
                        <Typography variant="body2">
                          For {it.service_name}
                        </Typography>
                      )}
                      {Number.isFinite(sessions) && sessions > 0 && (
                        <Typography variant="body2">
                          {sessions} sessions
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="body2">Quantity</Typography>
                        <IconButton
                          size="small"
                          onClick={() => updatePackageQuantity(it.id, quantity - 1)}
                          disabled={quantity <= 1}
                          aria-label="Decrease package quantity"
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: "center" }}>
                          {quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updatePackageQuantity(it.id, quantity + 1)}
                          aria-label="Increase package quantity"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      {Number.isFinite(expiresIn) && expiresIn > 0 ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Expires in {expiresIn} days
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          No expiration
                        </Typography>
                      )}
                      {quantity > 1 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Quantity {quantity}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          }

          const discount = lineDiscount(it);
          const tip = tipAllowedNow ? Number(it.tip_amount || 0) : 0;
          const lineTotal = Math.max(0, subtotal - discount) + tip;
          const addons = getAddons(it);
          const basePrice = it.client_package_id ? 0 : Number(it.price || 0);
          const hasLineAdjustments =
            addons.length > 0 || discount > 0 || tip > 0 || Boolean(it.client_package_id);

          return (
            <ListItem
              key={it.id}
              divider
              alignItems="flex-start"
              secondaryAction={
                <IconButton color="error" aria-label={`Remove ${it.service_name} from checkout`} onClick={() => removeItem(it.id)}>
                  <DeleteIcon />
                </IconButton>
              }
              >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="baseline" sx={{ pr: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700 }}>{it.service_name}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.78 }}>
                        With {it.artist_name}
                      </Typography>
                    </Box>
                    {!hasLineAdjustments && (
                      <Typography
                        data-testid={`checkout-item-price-${it.id}`}
                        sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                      >
                        {formatCurrency(lineTotal, currencyCode)}
                      </Typography>
                    )}
                  </Stack>
                }
                secondaryTypographyProps={{ component: "div" }}
                secondary={
                  <Box>
                    <Typography variant="body2">
                      {it.date}&nbsp; at&nbsp; {it.start_time}
                    </Typography>

                    {hasLineAdjustments && (
                      <Stack
                        spacing={0.65}
                        sx={{
                          mt: 1.25,
                          pt: 1.25,
                          borderTop: `1px solid ${borderColor}`,
                          maxWidth: 520,
                        }}
                      >
                        {!it.client_package_id && (
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Typography variant="body2">Service price</Typography>
                            <Typography variant="body2">{formatCurrency(basePrice, currencyCode)}</Typography>
                          </Stack>
                        )}
                        {addons.map((ad) => (
                          <Stack key={ad.id} direction="row" justifyContent="space-between" spacing={2}>
                            <Typography variant="body2">{ad.name}</Typography>
                            <Typography variant="body2">
                              +{formatCurrency(Number(ad.base_price || 0), currencyCode)}
                            </Typography>
                          </Stack>
                        ))}
                        {!!discount && (
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Typography variant="body2">Discount</Typography>
                            <Typography variant="body2">−{formatCurrency(discount, currencyCode)}</Typography>
                          </Stack>
                        )}
                        {tipAllowedNow && !!tip && (
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Typography variant="body2">Tip</Typography>
                            <Typography variant="body2">+{formatCurrency(tip, currencyCode)}</Typography>
                          </Stack>
                        )}
                        <Divider />
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Item total</Typography>
                          <Typography
                            data-testid={`checkout-item-total-${it.id}`}
                            variant="body2"
                            sx={{ fontWeight: 700 }}
                          >
                            {formatCurrency(lineTotal, currencyCode)}
                          </Typography>
                        </Stack>
                      </Stack>
                    )}

                    {it.couponApplied && it.coupon && (
                      <Chip
                        label={`Coupon: ${it.coupon.code}`}
                        color="success"
                        onDelete={() => removeCouponFromItem(it.id)}
                        sx={{ mt: 1 }}
                      />
                    )}

                    {client && it.allow_packages && (
                      <Box sx={{ mt: 1.5 }}>
                        {packagesLoading ? (
                          <Typography variant="caption" color="text.secondary">
                            Loading packages…
                          </Typography>
                        ) : packagesError ? (
                          <Typography variant="caption" color="error">
                            {packagesError}
                          </Typography>
                        ) : packageOptions.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            No active packages available for this service.
                          </Typography>
                        ) : (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                              You have {remainingCredits} credit{remainingCredits === 1 ? "" : "s"} for this service.
                            </Typography>
                            <TextField
                              select
                              label="Use package"
                              size="small"
                              value={it.client_package_id ?? ""}
                              onChange={(e) => setPackageForItem(it.id, e.target.value)}
                              sx={{ minWidth: { xs: "100%", sm: 260 } }}
                              SelectProps={{
                                displayEmpty: true,
                                renderValue: (value) => {
                                  if (value === "" || value === null || value === undefined) {
                                    return "Pay normally";
                                  }
                                  return selectedPackageLabel;
                                },
                              }}
                            >
                              <MenuItem value="">Pay normally</MenuItem>
                              {packageOptions.map((pkg) => {
                                const pkgName =
                                  pkg?.template?.name ||
                                  pkg?.name ||
                                  "Package";
                                const remaining = Number(pkg?.remaining ?? 0);
                                return (
                                  <MenuItem key={pkg.id} value={pkg.id}>
                                    {pkgName} ({remaining} left)
                                  </MenuItem>
                                );
                              })}
                            </TextField>
                          </>
                        )}
                        {it.client_package_id && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            Package applied. Service price covered.
                          </Typography>
                        )}
                      </Box>
                    )}

                    <Box sx={{ mt: 1.5 }}>
                      {tipAllowedNow && (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Tip for {it.artist_name}
                          </Typography>

                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
                            {[0, 10, 15, 20].map((pct) => (
                              <Chip
                                key={pct}
                                label={`${pct}%`}
                                clickable
                                onClick={() => setTipPercent(it.id, pct)}
                                variant={
                                  it.tip_mode === "percent" && Number(it.tip_value) === pct
                                    ? "filled"
                                    : "outlined"
                                }
                              />
                            ))}
                            <Chip
                              label="Custom %"
                              clickable
                              onClick={() => setTipPercent(it.id, it.tip_value || 0)}
                              variant={it.tip_mode === "percent" ? "filled" : "outlined"}
                            />
                            <Chip
                              label="Custom $"
                              clickable
                              onClick={() => setTipAmount(it.id, it.tip_amount || 0)}
                              variant={it.tip_mode === "amount" ? "filled" : "outlined"}
                            />
                          </Stack>

                          {it.tip_mode === "percent" ? (
                          <TextField
                            label="Custom %"
                            type="number"
                            size="small"
                            value={it.tip_value || ""}
                            onChange={(e) => setTipCustomPercent(it.id, Number(e.target.value || 0))}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{
                              width: { xs: "100%", sm: 140 },
                              mr: { sm: 2 },
                              mb: { xs: 1, sm: 0 },
                            }}
                          />
                        ) : (
                          <TextField
                            label="Custom tip ($)"
                            type="number"
                            size="small"
                            value={it.tip_amount || ""}
                            onChange={(e) => setTipAmount(it.id, Number(e.target.value || 0))}
                            inputProps={{ min: 0, step: "0.01" }}
                            sx={{
                              width: { xs: "100%", sm: 160 },
                              mr: { sm: 2 },
                              mb: { xs: 1, sm: 0 },
                            }}
                          />
                        )}
                        </>
                      )}

                    </Box>
                  </Box>
                }
              />
            </ListItem>
          );
        })}

        <Divider />
        <ListItem sx={{ display: "block", py: 1 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setCouponExpanded((value) => !value)}
            aria-expanded={couponExpanded || Boolean(couponError)}
            sx={{ ...textButtonSx, px: 0 }}
          >
            {couponExpanded || couponError ? "Hide coupon code" : "Have a coupon code?"}
          </Button>
          {(couponExpanded || couponError) && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
              <TextField
                label="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                size="small"
                fullWidth
                error={!!couponError}
                helperText={couponError}
              />
              <Button
                variant="outlined"
                onClick={applyCoupon}
                disabled={loading || !couponCode.trim()}
                sx={{ ...outlineButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                Apply
              </Button>
            </Stack>
          )}
        </ListItem>

        <Divider />
        {showOrderBreakdown && (
          <ListItem sx={{ justifyContent: "space-between", gap: 2 }}>
            <Typography>Subtotal</Typography>
            <Typography>{formatCurrency(totalBeforeDiscount, currencyCode)}</Typography>
          </ListItem>
        )}
        {totalDiscount > 0 && (
          <ListItem sx={{ justifyContent: "space-between", gap: 2 }}>
            <Typography>Discount</Typography>
            <Typography>−{formatCurrency(totalDiscount, currencyCode)}</Typography>
          </ListItem>
        )}
        {totalTip > 0 && (
          <ListItem sx={{ justifyContent: "space-between", gap: 2 }}>
            <Typography>Tip</Typography>
            <Typography>+{formatCurrency(totalTip, currencyCode)}</Typography>
          </ListItem>
        )}
        {shippingAmountKnown && (
          <ListItem data-testid="checkout-shipping-total" sx={{ justifyContent: "space-between", gap: 2 }}>
            <Typography>Shipping</Typography>
            <Typography>
              {shippingRateTotal === 0 ? "Free" : `+${formatCurrency(shippingRateTotal, currencyCode)}`}
            </Typography>
          </ListItem>
        )}
        {isCrossBorderShipping && shippingRateTotal > 0 && (
          <ListItem>
            <Typography variant="h6">Import duties and taxes: Not included</Typography>
          </ListItem>
        )}
        {paymentsEnabled && (
          <ListItem>
            <Typography variant="body2" color="text.secondary">
              Tax is calculated during Stripe checkout and itemized on your receipt.
            </Typography>
          </ListItem>
        )}
        <ListItem sx={{ justifyContent: "space-between", gap: 2, py: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {checkoutTotalLabel}
          </Typography>
          <Typography data-testid="checkout-order-total" variant="h6" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
            {formatCurrency(finalTotal, currencyCode)}
          </Typography>
        </ListItem>
      </List>

      {isCrossBorderShipping && shippingRateTotal > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={1.25}>
            <Typography variant="body2">
              The carrier or customs authority may collect import duties, taxes, brokerage charges, or other fees separately before or at delivery.
            </Typography>
            {requireImportChargesAcknowledgement && (
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={importChargesAcknowledged}
                    onChange={(event) => setImportChargesAcknowledged(Boolean(event.target.checked))}
                  />
                )}
                label="I understand that import duties, taxes, brokerage charges, or carrier fees may be collected separately."
              />
            )}
          </Stack>
        </Paper>
      )}

      {physicalProductItems.length > 0 && (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 1.5, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: checkoutSectionColor }}>
            Delivery details
          </Typography>
          <TextField
            select
            fullWidth
            label="Delivery method"
            value={safeDeliveryMethodValue}
            onChange={handleDeliveryMethod}
            SelectProps={{ MenuProps: CHECKOUT_SELECT_MENU_PROPS }}
            sx={{ mb: 1.5 }}
            disabled={deliveryMethodPolicy.loading || deliveryMethodOptions.length === 0}
          >
            {deliveryMethodOptions.length > 1 && (
              <MenuItem value="">
                Choose a delivery method
              </MenuItem>
            )}
            {deliveryMethodOptions.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {deliveryMethodPolicy.loading && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -1, mb: 1 }}>
              Loading available delivery methods...
            </Typography>
          )}
          {!deliveryMethodPolicy.loading && deliveryMethodOptions.length === 0 && (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              {policyIsApiLoadedEmpty
                ? "This Product is not currently available for delivery or pickup."
                : "Delivery methods are temporarily unavailable. Please try again."}
            </Alert>
          )}

          {requiresShippingAddress ? (
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                required
                label="Full name"
                value={productDelivery.shipping?.name || ""}
                onChange={handleShippingField("name")}
              />
              <TextField
                fullWidth
                required
                label="Phone"
                value={productDelivery.shipping?.phone || ""}
                onChange={handleShippingField("phone")}
              />
              <TextField
                fullWidth
                required
                label="Address line 1"
                value={productDelivery.shipping?.address1 || ""}
                onChange={handleShippingField("address1")}
              />
              <TextField
                fullWidth
                label="Address line 2 (optional)"
                value={productDelivery.shipping?.address2 || ""}
                onChange={handleShippingField("address2")}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  required
                  label="City"
                  value={productDelivery.shipping?.city || ""}
                  onChange={handleShippingField("city")}
                />
                <TextField
                  fullWidth
                  required={shippingRegionRequired}
                  label="State / Province / Region"
                  value={productDelivery.shipping?.region || ""}
                  onChange={handleShippingField("region")}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  required={shippingPostalRequired}
                  label="Postal / ZIP code"
                  value={productDelivery.shipping?.postal_code || ""}
                  onChange={handleShippingField("postal_code")}
                  helperText={
                    normalizeDeliveryCountryCode(productDelivery.shipping?.country) === "CA"
                      ? "Format: A1A 1A1"
                      : normalizeDeliveryCountryCode(productDelivery.shipping?.country) === "US"
                        ? "Format: 12345 or 12345-6789"
                        : ""
                  }
                />
                <Autocomplete
                  options={deliveryCountryOptions}
                  value={deliveryCountryOptions.find((country) => country.code === currentDeliveryCountryValue) || null}
                  onChange={(_event, value) =>
                    handleShippingField("country")({ target: { value: value?.code || "" } })
                  }
                  isOptionEqualToValue={(option, value) => option.code === value.code}
                  getOptionLabel={(option) => option?.label || option?.code || ""}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      label="Country"
                      helperText="Available destinations are shown here based on the business shipping policy."
                    />
                  )}
                />
              </Stack>
              {verificationEnabled && (
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    onClick={verifyAddressForShipping}
                    disabled={addressVerification.loading || !deliveryOk}
                  >
                    {addressVerification.loading ? "Verifying address..." : "Verify address & view shipping options"}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Address verification checks deliverability and may suggest corrections before shipping rates are shown.
                  </Typography>
                </Stack>
              )}
              {verificationEnabled && addressVerification.status === "verified" && (
                <Alert severity="success">
                  {addressVerification.messages[0] || "Address verified. Shipping options are ready."}
                </Alert>
              )}
              {verificationEnabled && addressVerification.status === "corrected" && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Alert severity="info">
                      {addressVerification.messages[0] || "We found a suggested version of your address."}
                    </Alert>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Suggested address
                        </Typography>
                        <Typography variant="body2">{addressVerification.suggestedAddress?.address1}</Typography>
                        {addressVerification.suggestedAddress?.address2 ? (
                          <Typography variant="body2">{addressVerification.suggestedAddress.address2}</Typography>
                        ) : null}
                        <Typography variant="body2">
                          {[addressVerification.suggestedAddress?.city, addressVerification.suggestedAddress?.region, addressVerification.suggestedAddress?.postal_code].filter(Boolean).join(", ")}
                        </Typography>
                        <Typography variant="body2">{addressVerification.suggestedAddress?.country}</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Original address
                        </Typography>
                        <Typography variant="body2">{addressVerification.originalAddress?.address1}</Typography>
                        {addressVerification.originalAddress?.address2 ? (
                          <Typography variant="body2">{addressVerification.originalAddress.address2}</Typography>
                        ) : null}
                        <Typography variant="body2">
                          {[addressVerification.originalAddress?.city, addressVerification.originalAddress?.region, addressVerification.originalAddress?.postal_code].filter(Boolean).join(", ")}
                        </Typography>
                        <Typography variant="body2">{addressVerification.originalAddress?.country}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button variant="contained" onClick={() => acceptVerifiedAddress("suggested")} disabled={addressVerification.loading}>
                        Use suggested address
                      </Button>
                      <Button variant="outlined" onClick={() => acceptVerifiedAddress("original")} disabled={addressVerification.loading}>
                        Use original address
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => {
                          resetShippingVerificationState();
                          clearShippingRatesState();
                        }}
                        disabled={addressVerification.loading}
                      >
                        Edit address
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              {verificationEnabled && addressVerification.status === "customer_confirmation_required" && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Alert severity="warning">
                      {addressVerification.messages[0] ||
                        "We could not automatically verify this international address. Please check it carefully before continuing."}
                    </Alert>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Address to confirm
                      </Typography>
                      <Typography variant="body2">{addressVerification.acceptedAddress?.address1}</Typography>
                      {addressVerification.acceptedAddress?.address2 ? (
                        <Typography variant="body2">{addressVerification.acceptedAddress.address2}</Typography>
                      ) : null}
                      <Typography variant="body2">
                        {[addressVerification.acceptedAddress?.city, addressVerification.acceptedAddress?.region, addressVerification.acceptedAddress?.postal_code].filter(Boolean).join(", ")}
                      </Typography>
                      <Typography variant="body2">{addressVerification.acceptedAddress?.country}</Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addressConfirmationChecked}
                          onChange={(event) => setAddressConfirmationChecked(event.target.checked)}
                        />
                      }
                      label="I confirm that this international delivery address is complete and correct."
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => acceptVerifiedAddress("confirm")}
                        disabled={addressVerification.loading || !addressConfirmationChecked}
                      >
                        Confirm address & view shipping options
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => {
                          resetShippingVerificationState();
                          clearShippingRatesState();
                        }}
                        disabled={addressVerification.loading}
                      >
                        Edit address
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              {verificationEnabled && ["undeliverable", "provider_unavailable"].includes(addressVerification.status) && addressVerification.messages.length > 0 && (
                <Alert severity={addressVerification.status === "provider_unavailable" ? "warning" : "error"}>
                  {addressVerification.messages[0]}
                </Alert>
              )}
              {isCrossBorderShipping && (
                <Alert severity="info">
                  {currentImportChargesNotice?.standard_notice ||
                    "International shipping may be subject to import duties, taxes, brokerage charges, or other fees collected separately by the carrier or destination authorities."}
                  {currentImportChargesNotice?.additional_note ? ` ${currentImportChargesNotice.additional_note}` : ""}
                </Alert>
              )}
              {(manualShippingPricingActive || !verificationEnabled) && (productDelivery.delivery_method || "").toLowerCase() === "shipping" && deliveryMethodPolicy.automationMode === "manual" && (
                <Alert severity={manualShippingPricingActive ? "info" : "warning"}>
                  {manualShippingPricingActive
                    ? manualShippingKnown
                      ? shippingRateTotal === 0
                        ? "This order qualifies for free shipping."
                        : `A fixed shipping charge of ${formatCurrency(shippingRateTotal, manualShippingDecision?.currency || currencyCode)} is included in the total.`
                      : "Shipping will be confirmed after an eligible destination is entered."
                    : "Shipping is arranged manually by the business. The order total shown now does not include a shipping charge."}
                </Alert>
              )}
              {manualShippingKnown && Number(manualShippingDecision?.remaining_for_free_shipping_cents || 0) > 0 && (
                <Alert severity="info">
                  Add {formatCurrency(
                    Number(manualShippingDecision.remaining_for_free_shipping_cents) / 100,
                    manualShippingDecision.currency || currencyCode
                  )} more in eligible physical products to qualify for free shipping.
                </Alert>
              )}
              {shippingRates.loading && (
                <Alert severity="info">Fetching live shipping rates...</Alert>
              )}
              {shippingRates.available && shippingRates.rates.length > 0 && (
                <FormControl fullWidth>
                  <Typography
                    component="div"
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.75, fontWeight: 600 }}
                  >
                    Shipping option
                  </Typography>
                  <Select
                    value={shippingRates.selectedRateId || ""}
                    onChange={(event) =>
                      setShippingRates((prev) => ({ ...prev, selectedRateId: String(event.target.value || "") }))
                    }
                    displayEmpty
                    MenuProps={CHECKOUT_SELECT_MENU_PROPS}
                  >
                    <MenuItem value="" disabled>Select a shipping option</MenuItem>
                    {shippingRates.rates.map((rate) => {
                      const rateId = String(rate?.rate_id || rate?.id || "");
                      const amount = Number(rate?.amount || 0);
                      const currency = String(rate?.currency || currencyCode || "USD").toUpperCase();
                      const eta = rate?.delivery_days != null ? ` · ${rate.delivery_days} day(s) transit estimate` : "";
                      return (
                        <MenuItem key={rateId} value={rateId}>
                          {(rate?.carrier || "Carrier")} {(rate?.service || "Service")} · {formatCurrency(amount, currency)}
                          {isCrossBorderShipping ? " · Import charges not included" : ""}
                          {eta}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  {isCrossBorderShipping ? (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
                      {currentImportChargesNotice?.transit_estimate_note ||
                        "Estimated carrier transit time does not include possible customs-processing delays."}
                    </Typography>
                  ) : null}
                </FormControl>
              )}
              {!shippingRates.available && shippingRates.message && (
                <Alert severity={shippingRates.fallbackManual ? "info" : "warning"}>
                  {shippingRates.message}
                  {Array.isArray(shippingRates.incompatibleItems) && shippingRates.incompatibleItems.length > 0 ? (
                    <>
                      {" "}
                      {shippingRates.incompatibleItems
                        .map((item) => item?.name)
                        .filter(Boolean)
                        .join(", ")}
                    </>
                  ) : null}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Delivery instructions (optional)"
                value={productDelivery.shipping?.instructions || ""}
                onChange={handleShippingField("instructions")}
              />
            </Stack>
          ) : (
            <TextField
              fullWidth
              label="Pickup instructions (optional)"
              value={productDelivery.pickup_instructions || ""}
              onChange={(event) =>
                setProductDelivery((prev) => ({ ...prev, pickup_instructions: event.target.value }))
              }
            />
          )}
        </Paper>
      )}

      {err && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {err}
        </Alert>
      )}

      {/* Card   show when either pay-now or card-on-file is enabled */}
      {packageOnlyTotal ? (
        <Alert severity="success" sx={{ mb: 1.5, ...infoAlertSx }}>
          This booking is fully covered by your package credits. No Stripe payment is required.
        </Alert>
      ) : effectivePaymentMode !== "off" ? (
        <Alert severity="info" sx={{ mb: 1.5, ...infoAlertSx }}>
          {productItems.length > 0 ? (
            <>
              <AlertTitle>Secure online payment</AlertTitle>
              Product orders must be paid online. You&apos;ll continue to Stripe to complete your purchase.
            </>
          ) : hasPackagePurchase ? (
            <>
              <AlertTitle>Secure online payment</AlertTitle>
              You&apos;ll continue to Stripe to complete your purchase.
            </>
          ) : effectivePaymentMode === "capture" ? (
            <>
              <AlertTitle>Card required to reserve</AlertTitle>
              No payment will be collected now. Your card will be securely saved with Stripe for charges authorized under the business&apos;s booking and cancellation policy.
            </>
          ) : (
            <>
              <AlertTitle>Secure online payment</AlertTitle>
              You&apos;ll continue to Stripe to pay and complete your booking.
            </>
          )}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 1.5, ...infoAlertSx }}>
          {hasPackagePurchase
            ? "Online payments are disabled for this company. Package purchases require online payment."
            : <>
                <AlertTitle>{businessName ? `Payment handled by ${businessName}` : "Payment handled separately"}</AlertTitle>
                No online payment is required. {businessName || "The business"} will collect payment separately.
              </>}
        </Alert>
      )}

      {/* Auth section with login & sign up buttons */}
      {showCaptureOption &&
        serviceItems.length > 0 &&
        productItems.length === 0 &&
        packageItems.length === 0 && (
          <Paper sx={{ mb: 2, p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cardOnFileConsentAccepted}
                    onChange={(event) => {
                      setCardOnFileConsentAccepted(event.target.checked);
                      if (event.target.checked) {
                        setCardOnFileConsentError("");
                      }
                    }}
                  />
                }
                label={`I agree that ${businessName || companySlug || "this business"} may securely save my card with Stripe and use it for future charges that I authorize under the cancellation and no-show policy shown here.`}
              />
              <Typography variant="body2" color="text.secondary">
                {policy?.cancellation_policy || "The current cancellation and no-show policy will apply to future authorized charges."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No payment is collected now. Saving a card does not guarantee that a future charge will be approved.
              </Typography>
              {cardOnFileConsentError ? (
                <Typography variant="body2" color="error">
                  {cardOnFileConsentError}
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        )}
      {client ? (
        <>
          <TextField
            fullWidth
            disabled
            sx={{ mb: 2 }}
            label="Full name"
            value={client.full_name || `${client.first_name} ${client.last_name}`.trim()}
          />
          <TextField fullWidth disabled sx={{ mb: 2 }} label="Email" value={client.email} />

          {/* If Stripe on ? show Pay & Book, and if allowed ? Save Card & Book */}
          {packageOnlyTotal ? (
            <Box sx={mobileCheckoutActionSx}>
              {mobileCheckoutTotal}
              <Button
                fullWidth
                variant="contained"
                disabled={loading}
                onClick={bookWithoutPayment}
                sx={primaryButtonSx}
              >
                {loading ? <CircularProgress size={24} /> : "Confirm booking"}
              </Button>
            </Box>
          ) : showOnlinePayment ? (
            <Box sx={mobileCheckoutActionSx}>
              {mobileCheckoutTotal}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
                {(showPayOption || hasPackagePurchase) && (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={loading || (!showPayOption && hasPackagePurchase) || !deliveryOk}
                    onClick={payAndBook}
                    sx={primaryButtonSx}
                  >
                    {loading ? <CircularProgress size={24} /> : payButtonLabel}
                  </Button>
                )}
                {showCaptureOption &&
                  serviceItems.length > 0 &&
                  productItems.length === 0 &&
                  packageItems.length === 0 && (
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled={loading}
                      onClick={saveCardAndBook}
                      sx={outlineButtonSx}
                    >
                      {loading ? <CircularProgress size={24} /> : "Save Card & Book"}
                    </Button>
                  )}
              </Stack>
            </Box>
          ) : (
            <Box sx={mobileCheckoutActionSx}>
              {mobileCheckoutTotal}
              <Button
                fullWidth
                variant="contained"
                disabled={loading || !deliveryOk}
                onClick={bookWithoutPayment}
                sx={primaryButtonSx}
              >
                {loading ? <CircularProgress size={24} /> : bookButtonLabel}
              </Button>
            </Box>
          )}
        </>
      ) : (
        <>
          <form onSubmit={(e) => e.preventDefault()}>
            <TextField
              name="name"
              label="Your name"
              fullWidth
              required
              sx={{ mb: 1.5 }}
              value={guest.name}
              onChange={handleGuest}
            />
            <TextField
              name="email"
              type="email"
              label="Your email"
              fullWidth
              required
              sx={{ mb: 1 }}
              value={guest.email}
              onChange={handleGuest}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setLoginDialogOpen(true)}
                sx={{ ...outlineButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                Already have an account? Log in
              </Button>

              <Button
                variant="text"
                size="small"
                onClick={() => setRegisterDialogOpen(true)}
                sx={{ ...textButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                Don't have an account? Sign up
              </Button>
            </Stack>

            {/* Guest buttons mirror the client section */}
            <Box sx={mobileCheckoutActionSx}>
              {mobileCheckoutTotal}
              {showOnlinePayment ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                {(showPayOption || hasPackagePurchase) && (
                  <Button
                    fullWidth
                    variant="contained"
                    type="button"
                    disabled={loading || !guestOk || !deliveryOk || (!showPayOption && hasPackagePurchase)}
                    onClick={payAndBook}
                    sx={primaryButtonSx}
                  >
                    {loading ? <CircularProgress size={24} /> : payButtonLabel}
                  </Button>
                )}
                {showCaptureOption &&
                  serviceItems.length > 0 &&
                  productItems.length === 0 &&
                  packageItems.length === 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    type="button"
                    disabled={loading || !guestOk}
                    onClick={saveCardAndBook}
                    sx={outlineButtonSx}
                  >
                    {loading ? <CircularProgress size={24} /> : "Save Card & Book"}
                  </Button>
                )}
                </Stack>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  type="button"
                  disabled={loading || !guestOk || !deliveryOk}
                  onClick={bookWithoutPayment}
                  sx={primaryButtonSx}
                >
                  {loading ? <CircularProgress size={24} /> : bookButtonLabel}
                </Button>
              )}
            </Box>
            {hasPackagePurchase && !showPayOption && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Package purchases require online payment. Enable checkout to sell packages.
              </Typography>
            )}
          </form>
        </>
      )}

      {/* Footer actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        mt={2}
        justifyContent="center"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        {productOnlyCheckout && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleContinueProductShopping}
            sx={{ ...outlineButtonSx, width: { xs: "100%", sm: "auto" } }}
          >
            Add Another Product
          </Button>
        )}
        {serviceOnlyCheckout && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              onRequestAddService?.();
              if (!servicesBrowsePath) return;
              if (
                typeof window !== "undefined" &&
                window.parent !== window &&
                requestTransactionalNavigation(window.parent, servicesBrowsePath)
              ) {
                return;
              }
              navigate(servicesBrowsePath);
            }}
            sx={{ ...outlineButtonSx, width: { xs: "100%", sm: "auto" } }}
          >
            Add Another Service
          </Button>
        )}
        {serviceOnlyCheckout && (
          <Button
            variant="text"
            startIcon={<AddIcon />}
            onClick={openAddons}
            sx={{ ...textButtonSx, width: { xs: "100%", sm: "auto" } }}
          >
            Add-on(s)
          </Button>
        )}
        <Button
          variant="text"
          onClick={onBack}
          sx={{ ...textButtonSx, width: { xs: "100%", sm: "auto" } }}
        >
          Back
        </Button>
      </Stack>
        </Stack>
      </Paper>

      {/* Dialog ?   choose service when multiple */}
      <Dialog open={dlgSvcOpen} onClose={() => setDlgSvcOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select a service to add add-ons</DialogTitle>
        <DialogContent dividers>
          {cart.map((it) => (
            <ListItemButton key={it.id} onClick={() => pickService(it.id)}>
              {it.service_name}   {it.artist_name} ({it.date}   {it.start_time})
            </ListItemButton>
          ))}
        </DialogContent>
      </Dialog>

      {/* Dialog ?   add-on checklist */}
      <Dialog open={dlgAddonOpen} onClose={() => setDlgAddonOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{activeItem ? `Add-ons for ${activeItem.service_name}` : "Add-ons"}</DialogTitle>
        <DialogContent dividers sx={{ pt: 1 }}>
          {!activeItem ? (
            <CircularProgress />
          ) : addonOpts[activeItem.service_id]?.length ? (
            addonOpts[activeItem.service_id].map((ad, idx) => {
              const img = Array.isArray(ad.images) && ad.images.length > 0
                ? ad.images[0]?.url_public || ad.images[0]?.url || ad.images[0]?.source
                : null;
              return (
                <ListItem key={`${ad.id ?? 'addon'}-${idx}`} disablePadding sx={{ alignItems: "flex-start", py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Checkbox
                      edge="start"
                      checked={getAddonIds(activeItem).includes(ad.id)}
                      onChange={() => toggleAddon(ad)}
                    />
                  </ListItemIcon>
                  {img && (
                    <Box
                      component="img"
                      src={img}
                      alt={ad.name || "Add-on"}
                      loading="lazy"
                      sx={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 1.5,
                        mr: 2,
                        mt: 0.5,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <ListItemText
                    primary={`${ad.name}     $${Number(ad.base_price).toFixed(2)}`}
                    secondary={ad.description || undefined}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              );
            })
          ) : (
            <Typography>No add-ons available for this service.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgAddonOpen(false)} sx={primaryButtonSx}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        companySlug={companySlug}
      />
      <RegisterDialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onOpenLogin={() => {
          setRegisterDialogOpen(false);
          setLoginDialogOpen(true);
        }}
        onOpenForgot={() => {
          setRegisterDialogOpen(false);
          setForgotDialogOpen(true);
        }}
        companySlug={companySlug}
      />
      <ForgotPasswordDialog
        open={forgotDialogOpen}
        onClose={() => setForgotDialogOpen(false)}
        companySlug={companySlug}
      />
      <PublicBookingUnavailableDialog
        open={publicUpgradeOpen}
        message={publicUpgradeMessage}
        contactEmail={companyContactEmail}
        contactPhone={companyContactPhone}
        onClose={() => setPublicUpgradeOpen(false)}
        onBack={() => {
          setPublicUpgradeOpen(false);
          onBack?.();
        }}
      />
    </Box>
  );
}
