import React from "react";
import BookingPageTemplate from "./BookingPageTemplate";
import { bookingPages } from "./config";

const DoctorBookingPage = () => <BookingPageTemplate config={bookingPages.doctor} />;

export default DoctorBookingPage;

