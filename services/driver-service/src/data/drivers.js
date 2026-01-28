module.exports = [
  {
    id: "driver-001",
    name: "Nguyen Van A",
    phone: "0909123456",
    status: "online",
    rating: 4.7,

    documents: [
      {
        id: "doc-1",
        type: "license",
        file: "license_a.jpg",
        uploadedAt: "2025-01-01"
      }
    ],

    vehicle: {
      type: "car",
      brand: "Toyota",
      model: "Vios",
      plateNumber: "51A-12345",
      color: "White"
    },

    earnings: {
      total: 350000,
      daily: {
        "2026-01-27": 150000,
        "2026-01-26": 200000
      }
    },

    rides: [
      { rideId: "r1", fare: 50000, date: "2026-01-27" },
      { rideId: "r2", fare: 100000, date: "2026-01-26" }
    ],

    location: {
      lat: 10.762622,
      lng: 106.660172
    }
  }
];
