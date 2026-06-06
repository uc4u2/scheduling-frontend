export const getClientDisplayName = (client, fallback = "Client") => {
  const explicitName = String(client?.name || "").trim();
  const fullName = `${client?.first_name || ""} ${client?.last_name || ""}`.trim();
  return explicitName || fullName || client?.email || fallback;
};

export const buildClientCreatePayload = ({ name = "", email = "", phone = "" } = {}) => {
  const normalizedName = String(name || "").trim();
  const [firstName, ...rest] = normalizedName.split(/\s+/).filter(Boolean);
  return {
    first_name: firstName || normalizedName || "Client",
    last_name: rest.join(" ") || "-",
    email: String(email || "").trim(),
    phone: String(phone || "").trim() || undefined,
  };
};
