window.RELEVATEME_REFERRALS_CONFIG = Object.freeze({
  sources: {
    "linkedin-featured": { source: "linkedin", medium: "social", placement: "featured", campaign: "profile" },
    "linkedin-about": { source: "linkedin", medium: "social", placement: "about", campaign: "profile" },
    "linkedin-contact": { source: "linkedin", medium: "social", placement: "contact", campaign: "profile" },
    "mentor-referral": { source: "mentor", medium: "referral", placement: "direct", campaign: "mentor_referrals" }
  },
  sourceAliases: { featured: "linkedin-featured", about: "linkedin-about", contact: "linkedin-contact" },
  mentors: {
    "milosz-stawecki": { name: "Miłosz Stawecki", role: "Mentor biznesowy", expertIndex: 0 },
    "paulina-mackiewicz": { name: "Paulina Mackiewicz", role: "Executive coach", expertIndex: 1 }
  },
  mentorAliases: { milosz: "milosz-stawecki", paulina: "paulina-mackiewicz" }
});
