import React from "react";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";

const ICONS = {
  finance: AccountBalanceWalletOutlinedIcon,
  services: StorefrontOutlinedIcon,
  checkout: PointOfSaleOutlinedIcon,
  clients: PeopleAltOutlinedIcon,
  products: Inventory2OutlinedIcon,
  orders: AssignmentOutlinedIcon,
  calendar: CalendarMonthOutlinedIcon,
  dispatch: LocalShippingOutlinedIcon,
  employees: BadgeOutlinedIcon,
  photos: PhotoCameraOutlinedIcon,
  payroll: PaymentsOutlinedIcon,
  shifts: GroupsOutlinedIcon,
  time: AccessTimeOutlinedIcon,
  leave: EventBusyOutlinedIcon,
  swap: SwapHorizOutlinedIcon,
  training: SchoolOutlinedIcon,
  communications: ForumOutlinedIcon,
  quotes: RequestQuoteOutlinedIcon,
  estimates: ReceiptLongOutlinedIcon,
  workOrders: WorkOutlineOutlinedIcon,
  invoices: ReceiptLongOutlinedIcon,
};

export default function ManagerDashboardActionIcon({ icon, ...props }) {
  const Icon = ICONS[icon] || AssignmentOutlinedIcon;
  return <Icon {...props} />;
}
