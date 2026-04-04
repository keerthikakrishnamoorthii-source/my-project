export const categories = [
  "Road Safety",
  "Water Supply",
  "Power Outage",
  "Community Event",
  "Emergency Alert",
  "Public Notice",
];

export const neighborhoods = [
  "Market Street",
  "Green Park",
  "Temple Road",
  "Lakeside",
  "Railway Colony",
  "Old Town",
];
const initialPosts = [
  {
    id: 1,
    title: "Water supply interruption near Market Street",
    category: "Water Supply",
    neighborhood: "Market Street",
    radius: 5,
    urgency: "high",
    verified: true,
    reporter: "Ward Volunteer",
    time: "10 mins ago",
    image:
      "https://images.unsplash.com/photo-1521207418485-99c705420785?auto=format&fit=crop&w=900&q=80",
    description:
      "Main line maintenance is delaying the morning water supply. Tanker support is expected by noon.",
  },
  {
    id: 2,
    title: "Minor roadblock due to repair work",
    category: "Road Safety",
    neighborhood: "Temple Road",
    radius: 8,
    urgency: "medium",
    verified: false,
    reporter: "Resident Reporter",
    time: "24 mins ago",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
    description:
      "One lane is blocked close to the temple junction. Two-wheelers can pass slowly, but cars should take the side road.",
  },
  {
    id: 3,
    title: "Community health camp announced for Sunday",
    category: "Community Event",
    neighborhood: "Green Park",
    radius: 10,
    urgency: "low",
    verified: true,
    reporter: "Municipal Team",
    time: "1 hour ago",
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
    description:
      "Free blood pressure and diabetes screening will be available from 9 AM to 2 PM at the community hall.",
  },
];
