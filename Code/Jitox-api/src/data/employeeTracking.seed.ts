/** Demo GPS / visit trail for employee tracking UI when no live data exists. */
export type VisitRow = {
  time: string;
  partyName: string;
  duration: string;
  address: string;
  lat: number;
  lng: number;
};

export type TrackingDay = {
  dateIso: string;
  dateDisplay: string;
  openingKm: number;
  closingKm: number;
  travelledKm: number;
  visit: number;
  workingHours: string;
  visits: VisitRow[];
  mapPath?: [number, number][];
};

export type EmployeeSeed = {
  id: string;
  name: string;
  department: string;
  time: string;
  online: boolean;
  tracking: TrackingDay[];
};

export const employeesTrackingSeed: EmployeeSeed[] = [
  {
    id: "emp-1",
    name: "Stephen Yustiono",
    department: "Sales Department",
    time: "9:36 AM",
    online: true,
    tracking: [
      {
        dateIso: "2025-10-12",
        dateDisplay: "12 Oct 2025",
        openingKm: 1200,
        closingKm: 1285,
        travelledKm: 85,
        visit: 4,
        workingHours: "07:45 Hrs",
        visits: [
          {
            time: "10:15 AM",
            partyName: "Patel Traders",
            duration: "45 min",
            address: "Maninagar, Ahmedabad",
            lat: 22.9925,
            lng: 72.6035,
          },
          {
            time: "2:30 PM",
            partyName: "Krushi Kendra",
            duration: "30 min",
            address: "Navrangpura, Ahmedabad",
            lat: 23.0369,
            lng: 72.5626,
          },
        ],
        mapPath: [
          [22.9982, 72.6101],
          [22.9925, 72.6035],
          [23.005, 72.588],
          [23.022, 72.572],
          [23.0369, 72.5626],
        ],
      },
      {
        dateIso: "2025-10-11",
        dateDisplay: "11 Oct 2025",
        openingKm: 1070,
        closingKm: 1265,
        travelledKm: 85,
        visit: 4,
        workingHours: "07:46 Hrs",
        visits: [],
      },
      {
        dateIso: "2025-10-10",
        dateDisplay: "10 Oct 2025",
        openingKm: 980,
        closingKm: 1065,
        travelledKm: 75,
        visit: 3,
        workingHours: "08:00 Hrs",
        visits: [],
      },
    ],
  },
  {
    id: "emp-2",
    name: "Erin Steed",
    department: "Sales Department",
    time: "9:12 AM",
    online: true,
    tracking: [
      {
        dateIso: "2025-10-12",
        dateDisplay: "12 Oct 2025",
        openingKm: 500,
        closingKm: 612,
        travelledKm: 112,
        visit: 5,
        workingHours: "08:10 Hrs",
        visits: [
          {
            time: "9:00 AM",
            partyName: "Alpha Traders",
            duration: "20 min",
            address: "Katargam, Surat",
            lat: 21.2274,
            lng: 72.8339,
          },
        ],
        mapPath: [
          [21.222, 72.842],
          [21.2274, 72.8339],
        ],
      },
    ],
  },
  {
    id: "emp-3",
    name: "Robert Fox",
    department: "Logistics",
    time: "8:55 AM",
    online: false,
    tracking: [],
  },
];
