import React from "react";
import BookingPageTemplate from "./BookingPageTemplate";
import { bookingPages } from "./config";

const SalonBookingPage = () => <BookingPageTemplate config={bookingPages.salon} />;

export default SalonBookingPage;

