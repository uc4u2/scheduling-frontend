import React, { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  Alert,
  Divider,
  Link,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
} from "@mui/material";
import api from "../../utils/api";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getUserTimezone } from "../../utils/timezone";
import { isoFromParts, formatDate, formatTime } from "../../utils/datetime";

const toTitle = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  return raw
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const money = (amount, currency) => {
  const numeric = Number(amount || 0);
  const code = String(currency || "USD").toUpperCase();
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
};

const customerShippingStatusLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  const map = {
    pre_transit: "Label created",
    label_created: "Label created",
    pending: "Preparing shipment",
    packed: "Preparing shipment",
    in_transit: "In transit",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    available_for_pickup: "Ready for pickup",
    ready_for_pickup: "Ready for pickup",
    return_to_sender: "Returning to sender",
    returning: "Returning to sender",
    failure: "Shipping issue",
    issue: "Shipping issue",
    cancelled: "Shipment cancelled",
    unknown: "Tracking pending",
  };
  return map[normalized] || toTitle(normalized);
};

const customerShippingStatusColor = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["delivered", "available_for_pickup", "ready_for_pickup"].includes(normalized)) return "success";
  if (["in_transit", "out_for_delivery", "pre_transit", "label_created"].includes(normalized)) return "info";
  if (["failure", "issue", "return_to_sender", "returning", "cancelled"].includes(normalized)) return "warning";
  return "default";
};

export default function ClientBookings() {
  const [activeSlice, setActiveSlice] = useState(0);

  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteMsg, setNoteMsg] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { slug: routeSlug } = useParams();

  const tenantSlug = useMemo(() => {
    if (routeSlug) return routeSlug;
    try {
      const params = new URLSearchParams(location.search || "");
      return params.get("site") || "";
    } catch {
      return "";
    }
  }, [routeSlug, location.search]);

  const userTimezone = getUserTimezone();

  // Helper to preserve current query string (e.g. ?embed=1&primary=...)
  const go = (to) =>
    navigate(
      typeof to === "string"
        ? { pathname: to, search: location.search }
        : { ...to, search: location.search }
    );

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const loadBookings = () => {
    api
      .get("/api/client/bookings", { headers: authHeaders() })
      .then((res) => {
        const data = res.data.bookings || res.data || [];
        setBookings(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load bookings:", err));
  };

  const loadOrders = () => {
    setOrdersLoading(true);
    setOrdersError("");
    api
      .get("/api/client/product-orders", {
        headers: authHeaders(),
        params: {
          page: 1,
          per_page: 50,
          ...(tenantSlug ? { slug: tenantSlug } : {}),
        },
      })
      .then((res) => {
        const data = res.data?.orders || [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
        setOrdersError("Could not load your product orders.");
      })
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    loadBookings();
    loadOrders();
  }, []);

  useEffect(() => {
    const handler = () => {
      loadBookings();
      loadOrders();
    };

    window.addEventListener("booking:changed", handler);
    return () => window.removeEventListener("booking:changed", handler);
  }, [tenantSlug]);

  function handleCancel(row) {
    if (row.status === "cancelled" || row.status === "unavailable") return;
    if (window.confirm("Cancel this booking?")) {
      api
        .post(`/api/client/bookings/${row.id}/cancel`, null, {
          headers: authHeaders(),
        })
        .then(() => {
          setBookings((prev) =>
            prev.map((b) => (b.id === row.id ? { ...b, status: "cancelled" } : b))
          );
          setDetailOpen(false);
        })
        .catch((err) => console.error("Cancel failed:", err));
    }
  }

  function handleSendNote() {
    if (!note.trim()) return;
    api
      .post(
        `/api/client/bookings/${selected.id}/note`,
        { note },
        { headers: authHeaders() }
      )
      .then(() => {
        setNoteMsg("Note sent successfully!");
        setNote("");
      })
      .catch(() => setNoteMsg("Failed to send note. Please try again."));
  }

  function handleView(row) {
    setSelected(row);
    setDetailOpen(true);
    setNoteMsg("");
  }

  const openOrderDetail = (row) => {
    setOrderOpen(true);
    setOrderLoading(true);
    setSelectedOrder(null);
    api
      .get(`/api/client/product-orders/${row.id}`, {
        headers: authHeaders(),
        params: tenantSlug ? { slug: tenantSlug } : {},
      })
      .then((res) => setSelectedOrder(res.data || null))
      .catch((err) => {
        console.error("Failed to load order detail:", err);
        setSelectedOrder({ error: "Could not load order details." });
      })
      .finally(() => setOrderLoading(false));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "cancelled":
        return "error";
      case "booked":
        return "success";
      case "unavailable":
        return "warning";
      default:
        return "primary";
    }
  };

  const paymentChipColor = (status) => {
    const v = String(status || "").toLowerCase();
    if (v === "paid") return "success";
    if (v === "refunded") return "warning";
    if (v === "failed") return "error";
    return "default";
  };

  const fulfillmentChipColor = (status) => {
    const v = String(status || "").toLowerCase();
    if (["fulfilled", "delivered", "ready_for_pickup"].includes(v)) return "success";
    if (["packed", "in_transit"].includes(v)) return "info";
    if (["cancelled", "blocked"].includes(v)) return "error";
    return "default";
  };

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    {
      field: "date",
      headerName: "Date",
      width: 130,
      valueGetter: (p) => {
        const tz = p.row.timezone || userTimezone;
        const iso = isoFromParts(p.row.date, p.row.start_time, tz);
        return formatDate(new Date(iso));
      },
    },
    {
      field: "start_time",
      headerName: "Start",
      width: 90,
      valueGetter: (p) => {
        const tz = p.row.timezone || userTimezone;
        const iso = isoFromParts(p.row.date, p.row.start_time, tz);
        return formatTime(new Date(iso));
      },
    },
    {
      field: "end_time",
      headerName: "End",
      width: 90,
      valueGetter: (p) => {
        const tz = p.row.timezone || userTimezone;
        const iso = isoFromParts(p.row.date, p.row.end_time, tz);
        return formatTime(new Date(iso));
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "unavailable" ? "Unavailable" : params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    { field: "recruiter", headerName: "With", width: 140 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => {
        const isDisabled =
          params.row.status === "cancelled" || params.row.status === "unavailable";
        return (
          <Box>
            <Button size="small" onClick={() => handleView(params.row)}>
              View
            </Button>
            {!isDisabled && (
              <Button
                size="small"
                color="error"
                variant="outlined"
                sx={{ ml: 1 }}
                onClick={() => handleCancel(params.row)}
              >
                Cancel
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  const orderColumns = [
    {
      field: "display_number",
      headerName: "Order",
      width: 110,
      valueGetter: (p) => p.row.display_number || `#${p.row.id}`,
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 180,
      valueGetter: (p) => {
        const dt = p.row.created_at ? new Date(p.row.created_at) : null;
        return dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleString() : "-";
      },
    },
    {
      field: "payment_status",
      headerName: "Payment",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row?.payment_status_label || toTitle(params.value)}
          size="small"
          color={paymentChipColor(params.value)}
        />
      ),
    },
    {
      field: "fulfillment_status",
      headerName: "Fulfillment",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row?.fulfillment_status_label || toTitle(params.value)}
          size="small"
          color={fulfillmentChipColor(params.value)}
        />
      ),
    },
    {
      field: "delivery_method",
      headerName: "Delivery",
      width: 130,
      valueGetter: (p) => p.row.delivery_method_label || toTitle(p.row.delivery_method),
    },
    {
      field: "total_amount",
      headerName: "Total",
      width: 130,
      valueGetter: (p) => money(p.row.total_amount, p.row.currency),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Button size="small" onClick={() => openOrderDetail(params.row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        My Bookings
      </Typography>

      <Tabs value={activeSlice} onChange={(_, value) => setActiveSlice(value)} sx={{ mb: 2 }}>
        <Tab label="Bookings" />
        <Tab label="Orders" />
      </Tabs>

      {activeSlice === 0 ? (
        <div style={{ height: 420, width: "100%" }}>
          <DataGrid rows={bookings} columns={columns} pageSize={5} disableSelectionOnClick />
        </div>
      ) : (
        <Box>
          {ordersError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ordersError}
            </Alert>
          )}
          <div style={{ height: 420, width: "100%" }}>
            <DataGrid
              rows={orders}
              columns={orderColumns}
              pageSize={5}
              disableSelectionOnClick
              loading={ordersLoading}
            />
          </div>
        </Box>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Booking Details
              </Typography>

              {(() => {
                const tz = selected.timezone || userTimezone;
                const startIso = isoFromParts(selected.date, selected.start_time, tz);
                const endIso = isoFromParts(selected.date, selected.end_time, tz);
                const startDateObj = new Date(startIso);
                const endDateObj = new Date(endIso);
                const displayDate = formatDate(startDateObj);
                const displayStartTime = formatTime(startDateObj);
                const displayEndTime = formatTime(endDateObj);
                return (
                  <>
                    <Typography>
                      <b>Date:</b> {displayDate}
                    </Typography>
                    <Typography>
                      <b>Start Time:</b> {displayStartTime} - {displayEndTime}
                    </Typography>
                  </>
                );
              })()}

              <Typography>
                <b>Service:</b> {selected.service}
              </Typography>
              <Typography>
                <b>Provider:</b> {selected.recruiter}
              </Typography>
              <Typography>
                <b>Status:</b>{" "}
                <Chip
                  label={selected.status}
                  color={getStatusColor(selected.status)}
                  size="small"
                />
              </Typography>
              {selected.meeting_link && (
                <Typography sx={{ mt: 1 }}>
                  <b>Video:</b>{" "}
                  <Link href={selected.meeting_link} target="_blank" rel="noreferrer">
                    Join video
                  </Link>
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1">Company Info:</Typography>
              {(selected.company_public_url || selected.company_slug) && (
                <Typography>
                  <b>Company:</b>{" "}
                  <Link
                    href={selected.company_public_url || `/${selected.company_slug}`}
                    underline="hover"
                    target="_blank"
                  >
                    {selected.company_name || selected.company_slug}
                  </Link>
                </Typography>
              )}
              {selected.company_address && (
                <Typography>
                  <b>Address:</b> {selected.company_address}
                </Typography>
              )}
              {selected.company_phone && (
                <Typography>
                  <b>Phone:</b> {selected.company_phone}
                </Typography>
              )}
              {selected.company_email && (
                <Typography>
                  <b>Email:</b> {selected.company_email}
                </Typography>
              )}
              {(selected.reschedule_link || selected.cancel_link) && (
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {selected.reschedule_link && (
                    <Button
                      variant="outlined"
                      size="small"
                      href={selected.reschedule_link}
                      target="_blank"
                      rel="noopener"
                    >
                      Reschedule
                    </Button>
                  )}
                  {selected.cancel_link && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      href={selected.cancel_link}
                      target="_blank"
                      rel="noopener"
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              )}

              {selected.status !== "cancelled" && selected.status !== "unavailable" && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Send a note to your provider"
                    multiline
                    minRows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button
                    sx={{ mt: 1 }}
                    variant="contained"
                    size="small"
                    onClick={handleSendNote}
                  >
                    Send Note
                  </Button>
                  {noteMsg && (
                    <Alert sx={{ mt: 1 }} severity="info">
                      {noteMsg}
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        {selected && selected.status !== "cancelled" && selected.status !== "unavailable" && (
          <DialogActions sx={{ justifyContent: "flex-end", p: 1 }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => handleCancel(selected)}
            >
              Cancel Booking
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Dialog open={orderOpen} onClose={() => setOrderOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {orderLoading ? (
            <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : selectedOrder?.error ? (
            <Alert severity="error">{selectedOrder.error}</Alert>
          ) : selectedOrder ? (
            <Stack spacing={2}>
              <Typography variant="h6">Order {selectedOrder.display_number || `#${selectedOrder.id}`}</Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Chip label={`Payment: ${selectedOrder.payment_status_label || toTitle(selectedOrder.payment_status)}`} color={paymentChipColor(selectedOrder.payment_status)} size="small" />
                <Chip label={`Fulfillment: ${selectedOrder.fulfillment_status_label || toTitle(selectedOrder.fulfillment_status)}`} color={fulfillmentChipColor(selectedOrder.fulfillment_status)} size="small" />
                <Chip label={`Delivery: ${selectedOrder.delivery_method_label || toTitle(selectedOrder.delivery_method)}`} size="small" />
                <Chip label={`Status: ${selectedOrder.status_label || "Processing"}`} size="small" variant="outlined" />
                <Chip label={`Total: ${money(selectedOrder.total_amount, selectedOrder.currency)}`} size="small" />
              </Stack>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Summary</Typography>
                <Typography variant="body2" color="text.secondary">
                  Placed {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Items</Typography>
                {(selectedOrder.items || []).length ? (
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {(selectedOrder.items || []).map((item) => (
                      <Box key={item.id} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                        <Typography sx={{ fontWeight: 600 }}>{item.name || "Item"}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Qty {item.quantity} • {money(item.unit_price, selectedOrder.currency)} each
                        </Typography>
                        <Typography variant="body2">Line total: {money(item.total_price, selectedOrder.currency)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No items available.</Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Delivery</Typography>
                {String(selectedOrder.delivery_method || "pickup").toLowerCase() === "pickup" ? (
                  <Typography variant="body2" color="text.secondary">
                    Pickup order.
                    {selectedOrder.pickup_instructions ? ` ${selectedOrder.pickup_instructions}` : ""}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {(selectedOrder.shipping?.name || "").trim() || "-"}
                    {selectedOrder.shipping?.address1 ? ` • ${selectedOrder.shipping.address1}` : ""}
                    {selectedOrder.shipping?.city ? ` • ${selectedOrder.shipping.city}` : ""}
                    {selectedOrder.shipping?.region ? ` • ${selectedOrder.shipping.region}` : ""}
                    {selectedOrder.shipping?.postal_code ? ` • ${selectedOrder.shipping.postal_code}` : ""}
                    {selectedOrder.shipping?.country ? ` • ${selectedOrder.shipping.country}` : ""}
                  </Typography>
                )}
              </Box>

              {String(selectedOrder.delivery_method || "pickup").toLowerCase() !== "pickup" ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Shipping</Typography>
                  {(() => {
                    const shipment = selectedOrder.latest_shipment || null;
                    const carrier = String(shipment?.carrier || selectedOrder.tracking_company || "").trim();
                    const service = String(shipment?.service || "").trim();
                    const trackingCode = String(
                      shipment?.tracking_code || selectedOrder.tracking_number || ""
                    ).trim();
                    const trackingUrl = String(
                      selectedOrder.tracking_url_public ||
                      shipment?.tracking_url ||
                      selectedOrder.tracking_url ||
                      ""
                    ).trim();
                    const shippingStatus = customerShippingStatusLabel(
                      selectedOrder.tracking_status || shipment?.status
                    );
                    const hasShipmentSummary = Boolean(
                      carrier || service || trackingCode || trackingUrl || shippingStatus
                    );

                    if (!hasShipmentSummary) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Shipping details will appear here once your order is prepared.
                        </Typography>
                      );
                    }

                    return (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          {shippingStatus ? (
                            <Chip
                              label={`Status: ${shippingStatus}`}
                              size="small"
                              color={customerShippingStatusColor(selectedOrder.tracking_status || shipment?.status)}
                            />
                          ) : null}
                          {carrier || service ? (
                            <Chip
                              label={`Carrier: ${[carrier, service].filter(Boolean).join(" • ")}`}
                              size="small"
                              variant="outlined"
                            />
                          ) : null}
                        </Stack>
                        {trackingCode ? (
                          <Typography variant="body2" color="text.secondary">
                            Tracking code: {trackingCode}
                          </Typography>
                        ) : null}
                        {shipment ? (
                          <Box sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Latest shipment update
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {carrier || "Carrier assigned"}
                              {service ? ` • ${service}` : ""}
                              {shipment?.purchased_at
                                ? ` • Purchased ${new Date(shipment.purchased_at).toLocaleString()}`
                                : ""}
                            </Typography>
                            {(shipment?.updated_at || shipment?.created_at) ? (
                              <Typography variant="caption" color="text.secondary">
                                Last update: {new Date(shipment.updated_at || shipment.created_at).toLocaleString()}
                              </Typography>
                            ) : null}
                          </Box>
                        ) : null}
                        {trackingUrl ? (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => window.open(trackingUrl, "_blank", "noopener,noreferrer")}
                            sx={{ alignSelf: "flex-start" }}
                          >
                            Track package
                          </Button>
                        ) : null}
                      </Stack>
                    );
                  })()}
                </Box>
              ) : null}

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Timeline</Typography>
                {(selectedOrder.events || []).length ? (
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {(selectedOrder.events || []).map((event) => (
                      <Box key={event.id} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                        <Typography sx={{ fontWeight: 600 }}>{toTitle(event.event_type)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.created_at ? new Date(event.created_at).toLocaleString() : "-"}
                        </Typography>
                        {event.note ? (
                          <Typography variant="body2" sx={{ mt: 0.25 }}>{event.note}</Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No timeline events yet.</Typography>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
