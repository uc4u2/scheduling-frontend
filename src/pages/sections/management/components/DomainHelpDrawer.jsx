// src/pages/sections/management/components/DomainHelpDrawer.jsx
import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Link,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import PublicIcon from "@mui/icons-material/Public";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DnsIcon from "@mui/icons-material/Dns";
import VerifiedIcon from "@mui/icons-material/Verified";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CachedIcon from "@mui/icons-material/Cached";
import BoltIcon from "@mui/icons-material/Bolt";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTranslation } from "react-i18next";

const BASE_SECTION_ICONS = [
  TaskAltIcon,
  ShoppingCartIcon,
  DnsIcon,
  PublicIcon,
  VerifiedIcon,
  RocketLaunchIcon,
];

const CONNECT_STEP_ICONS = [
  BoltIcon,
  ManageAccountsIcon,
  PublicIcon,
  AutoFixHighIcon,
];

const SUPPORT_SECTION_ICONS = [SupportAgentIcon];

const formatDuration = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
};

const getDrawerAnchor = (provided, isSmall) => {
  if (provided) return provided;
  return isSmall ? "bottom" : "right";
};

export default function DomainHelpDrawer({
  open,
  onClose,
  anchor,
  width,
  status,
  sslStatus,
  registrarHint,
  domain,
  nextRetrySeconds,
  docsUrl,
  supportUrl,
  onGenerateDns,
  onVerifyDns,
  onStartConnect,
  onRefreshStatus,
}) {
  const { t } = useTranslation();
  const isSmall = useMediaQuery("(max-width:900px)");
  const drawerAnchor = getDrawerAnchor(anchor, isSmall);
  const drawerWidth = width ?? (isSmall ? "100%" : 460);

  const statusMeta = useMemo(
    () => ({
      none: { label: t("management.domainHelp.status.none"), color: "default", icon: <ErrorOutlineIcon fontSize="small" /> },
      pending_dns: { label: t("management.domainHelp.status.pending"), color: "warning", icon: <InfoOutlinedIcon fontSize="small" /> },
      verified: { label: t("management.domainHelp.status.verified"), color: "success", icon: <CheckCircleIcon fontSize="small" /> },
    }),
    [t]
  );

  const sslMeta = useMemo(
    () => ({
      pending: { label: t("management.domainHelp.ssl.pending"), color: "warning" },
      active: { label: t("management.domainHelp.ssl.active"), color: "success" },
      error: { label: t("management.domainHelp.ssl.error"), color: "error" },
    }),
    [t]
  );

  const quickSummaryItems = useMemo(
    () => t("management.domainHelp.quickSummary.items", { returnObjects: true }) || [],
    [t]
  );
  const dnsInstructionsItems = useMemo(
    () => t("management.domainHelp.dnsInstructions.items", { returnObjects: true }) || [],
    [t]
  );
  const timingItems = useMemo(
    () => t("management.domainHelp.timing.items", { returnObjects: true }) || [],
    [t]
  );
  const securityItems = useMemo(
    () => t("management.domainHelp.security.items", { returnObjects: true }) || [],
    [t]
  );
  const baseSections = useMemo(
    () => t("management.domainHelp.baseSections", { returnObjects: true }) || [],
    [t]
  );
  const connectSteps = useMemo(
    () => t("management.domainHelp.connectSteps", { returnObjects: true }) || [],
    [t]
  );
  const advancedItems = useMemo(
    () => t("management.domainHelp.advanced.items", { returnObjects: true }) || [],
    [t]
  );
  const ownershipItems = useMemo(
    () => t("management.domainHelp.ownership.items", { returnObjects: true }) || [],
    [t]
  );
  const summaryItems = useMemo(
    () => t("management.domainHelp.summary.items", { returnObjects: true }) || [],
    [t]
  );
  const supportSections = useMemo(
    () => t("management.domainHelp.supportSections", { returnObjects: true }) || [],
    [t]
  );
  const commands = useMemo(
    () => t("management.domainHelp.commands.items", { returnObjects: true }) || [],
    [t]
  );
  const troubleshooting = useMemo(
    () => t("management.domainHelp.troubleshooting", { returnObjects: true }) || {},
    [t]
  );

  const retryHintSeconds = formatDuration(nextRetrySeconds);
  const retryChipLabel = retryHintSeconds
    ? t("management.domainHelp.chips.retry", { time: retryHintSeconds })
    : null;

  const registrarLabel = registrarHint
    ? t("management.domainHelp.chips.registrarDetected", { registrar: registrarHint })
    : null;

  const statusChip = statusMeta[status] || statusMeta.none;
  const sslChip = sslStatus ? sslMeta[sslStatus] : null;

  return (
    <Drawer
      anchor={drawerAnchor}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2000,
        "& .MuiDrawer-paper": { zIndex: "inherit" },
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          maxWidth: "100vw",
          p: 0,
          zIndex: "inherit",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <HelpOutlineIcon />
          <Typography variant="h5">{t("management.domainHelp.title")}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("management.domainHelp.subtitle")}
        </Typography>

        <QuickSummary title={t("management.domainHelp.quickSummary.title")} items={quickSummaryItems} />
        <Callout
          title={t("management.domainHelp.dnsInstructions.title")}
          icon={<DnsIcon color="primary" />}
          items={dnsInstructionsItems}
        />
        <Callout
          title={t("management.domainHelp.timing.title")}
          icon={<CachedIcon color="primary" />}
          items={timingItems}
        />
        <Callout
          title={t("management.domainHelp.security.title")}
          icon={<ShieldOutlinedIcon color="success" />}
          items={securityItems}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
          <Chip
            label={statusChip.label}
            color={statusChip.color === "default" ? undefined : statusChip.color}
            variant={statusChip.color === "default" ? "outlined" : "filled"}
            size="small"
          />
          {sslChip && (
            <Chip label={sslChip.label} color={sslChip.color} size="small" variant="outlined" />
          )}
          {registrarLabel && <Chip label={registrarLabel} size="small" variant="outlined" />}
          {domain && <Chip label={domain} size="small" variant="outlined" />}
          {retryChipLabel && (
            <Chip
              label={retryChipLabel}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </Stack>

        {(onGenerateDns || onVerifyDns || onStartConnect || onRefreshStatus) && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              {t("management.domainHelp.labels.quickActions")}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {onGenerateDns && (
                <Button size="small" variant="contained" onClick={onGenerateDns} startIcon={<DnsIcon />}>
                  {t("management.domainHelp.buttons.generateDns")}
                </Button>
              )}
              {onVerifyDns && (
                <Button size="small" variant="outlined" onClick={onVerifyDns} startIcon={<VerifiedIcon />}>
                  {t("management.domainHelp.buttons.verify")}
                </Button>
              )}
              {onStartConnect && (
                <Button size="small" variant="outlined" onClick={onStartConnect} startIcon={<BoltIcon />}>
                  {t("management.domainHelp.buttons.startConnect")}
                </Button>
              )}
              {onRefreshStatus && (
                <Button size="small" variant="text" onClick={onRefreshStatus} startIcon={<RefreshIcon />}>
                  {t("management.domainHelp.buttons.refreshStatus")}
                </Button>
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        {baseSections.map((section, index) => {
          const Icon = BASE_SECTION_ICONS[index] || TaskAltIcon;
          return (
            <Section
              key={section?.title || index}
              icon={<Icon fontSize="small" color="primary" />}
              title={section?.title}
              bullets={section?.bullets || []}
              tip={section?.tip}
            />
          );
        })}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t("management.domainHelp.labels.registrarPlaybooks")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("management.domainHelp.labels.registrarPlaybooksSubtitle")}
        </Typography>

        {connectSteps.map((step, index) => {
          const Icon = CONNECT_STEP_ICONS[index] || BoltIcon;
          return (
            <Section
              key={step?.title || index}
              icon={<Icon fontSize="small" color="secondary" />}
              title={step?.title}
              bullets={step?.bullets || []}
            />
          );
        })}

        <Divider sx={{ my: 3 }} />

        <TroubleshootingTable
          title={troubleshooting?.title}
          rows={troubleshooting?.rows || []}
          labels={troubleshooting?.labels || {}}
        />
        <Callout
          title={t("management.domainHelp.advanced.title")}
          icon={<AutoFixHighIcon color="secondary" />}
          items={advancedItems}
        />
        <Callout
          title={t("management.domainHelp.ownership.title")}
          icon={<ManageAccountsIcon color="action" />}
          items={ownershipItems}
        />
        <CommandBlock
          title={t("management.domainHelp.commands.title")}
          commands={commands}
          footer={t("management.domainHelp.commands.footer")}
        />

        {supportSections.map((section, index) => {
          const Icon = SUPPORT_SECTION_ICONS[index] || SupportAgentIcon;
          return (
            <Section
              key={section?.title || index}
              icon={<Icon fontSize="small" color="action" />}
              title={section?.title}
              bullets={section?.bullets || []}
            />
          );
        })}

        <SummaryBlock title={t("management.domainHelp.summary.title")} items={summaryItems} />

        <Stack spacing={1} sx={{ mt: 3 }}>
          {docsUrl && (
            <Button component={Link} href={docsUrl} target="_blank" rel="noopener" variant="outlined">
              {t("management.domainHelp.buttons.openDocs")}
            </Button>
          )}
          {supportUrl && (
            <Button
              component={Link}
              href={supportUrl}
              target="_blank"
              rel="noopener"
              variant="contained"
              startIcon={<SupportAgentIcon />}
            >
              {t("management.domainHelp.buttons.contactSupport")}
            </Button>
          )}
          <Button onClick={onClose} variant="text">
            {t("management.domainHelp.buttons.close")}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

const QuickSummary = ({ title, items }) => (
  <Box
    sx={{
      mb: 3,
      p: 2,
      borderRadius: 1,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      backgroundColor: (theme) => theme.palette.action.hover,
    }}
  >
    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
      {title}
    </Typography>
    <BulletList items={items} />
  </Box>
);

const Callout = ({ title, icon, items }) => (
  <Box
    sx={{
      mb: 3,
      p: 2,
      borderRadius: 1,
      border: (theme) => `1px solid ${theme.palette.divider}`,
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
      {icon}
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Stack>
    <BulletList items={items} />
  </Box>
);

const TroubleshootingTable = ({ title, rows, labels }) => (
  <Box sx={{ mb: 3 }}>
    {title && (
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
    )}
    <Stack spacing={1.5}>
      {rows.map((row, index) => (
        <Box
          key={row?.issue || index}
          sx={{
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            p: 2,
          }}
        >
          {row?.issue && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {(labels?.issue || "Issue") + ": "}{row.issue}
            </Typography>
          )}
          {row?.cause && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {(labels?.likelyCause || "Likely cause") + ": "}{row.cause}
            </Typography>
          )}
          {row?.fix && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {(labels?.fix || "Fix") + ": "}{row.fix}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  </Box>
);

const CommandBlock = ({ title, commands, footer }) => (
  <Box sx={{ mb: 3 }}>
    {title && (
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
    )}
    <Box
      component="pre"
      sx={{
        fontFamily: "monospace",
        fontSize: 14,
        p: 2,
        borderRadius: 1,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: (theme) => theme.palette.action.hover,
        whiteSpace: "pre-wrap",
      }}
    >
      {(commands || []).join("\n")}
    </Box>
    {footer && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {footer}
      </Typography>
    )}
  </Box>
);

const SummaryBlock = ({ title, items }) => (
  <Box sx={{ mb: 3 }}>
    {title && (
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
    )}
    <BulletList items={items} />
  </Box>
);

const BulletList = ({ items }) => (
  <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2 }}>
    {(items || []).map((text, index) => (
      <Box component="li" key={index} sx={{ lineHeight: 1.6 }}>
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      </Box>
    ))}
  </Box>
);

function Section({ icon, title, bullets, tip }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Stack>
      <BulletList items={bullets} />
      {tip && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {tip}
        </Typography>
      )}
    </Box>
  );
}
