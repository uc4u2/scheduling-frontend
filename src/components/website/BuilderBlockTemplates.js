// src/components/website/BuilderBlockTemplates.js
export const NEW_BLOCKS = {
  
  hero: () => ({
    type: "hero",
    props: {
      heading: "Relax. Recharge. Renew.",
      subheading: "Personalized spa treatments for body and mind.",
      ctaText: "Book now",
      ctaLink: "/services",
      backgroundUrl:
       "https://images.unsplash.com/photo-1556229010-aa3f7ff66c6e?q=80&w=1200&auto=format&fit=crop",
       backgroundPosition: "center",
     overlay: 0.28

    },
  }),
  text: () => ({
    type: "text",
    props: {
      title: "About us",
      body:
        "Write a short introduction here. You can talk about your values, your team, and what makes you different.",
    },
  }),
  gallery: () => ({
    type: "gallery",
    props: {
      title: "Our work",
      images: [
        "https://images.unsplash.com/photo-1519827119039-d53d2d2a4389?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
      ],
    },
  }),
  galleryCarousel: () => ({
    type: "galleryCarousel",
    props: {
      title: "Highlights",
      autoplay: true,
      intervalMs: 3500,
      images: [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=1200&auto=format&fit=crop",
      ],
    },
  }),
  faq: () => ({
    type: "faq",
    props: {
      title: "Frequently asked questions",
      items: [
        { q: "How do I book?", a: "Use the Book button or call us." },
        { q: "Do you accept walk-ins?", a: "We recommend booking to guarantee a slot." },
      ],
    },
  }),
  serviceGrid: () => ({
    type: "serviceGrid",
    props: {
      title: "Popular services",
      subtitle: "Transparent pricing, expert care.",
      services: [
        { name: "Haircut", price: "$45", duration: "45m", description: "Classic or modern styles." },
        { name: "Color", price: "$95", duration: "90m", description: "Single process color." },
      ],
    },
  }),
  contact: () => ({
    type: "contact",
    props: {
      title: "Get in touch",
      intro: "Questions? We'd love to hear from you.",
      address: "123 Main St, Your City",
      phone: "+1 (555) 123-4567",
      email: "hello@example.com",
      mapEmbedUrl: "",
      showForm: false,
    },

    
  }),
  contactForm: () => ({
    type: "contactForm",
    props: {
      title: "Send a message",
      intro: "We typically reply within one business day.",
      formKey: "contact",
      fields: [
        { name: "name",    label: "Full name", required: true },
        { name: "email",   label: "Email",     required: true },
        { name: "phone",   label: "Phone" },
        { name: "subject", label: "Subject" },
        { name: "message", label: "Message",   required: true }
      ]
    }
  }),
  footer: () => ({
    type: "footer",
    props: {
      text: "© Your Company",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
      social: [
        { label: "Instagram", href: "https://instagram.com/" },
        { label: "Facebook", href: "https://facebook.com/" },
      ],
    },
  }),
};
