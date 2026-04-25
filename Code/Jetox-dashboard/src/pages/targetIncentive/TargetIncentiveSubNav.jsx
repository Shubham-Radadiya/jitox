import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
    isActive
      ? "bg-primary text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  ].join(" ");

const items = [
  { to: "/dashboard/target-incentive", end: true, label: "Target vs achievement" },
  { to: "/dashboard/target-incentive/team", label: "Team incentives" },
  { to: "/dashboard/target-incentive/assign", label: "Assign incentive" },
  { to: "/dashboard/target-incentive/products", label: "Product incentive table" },
];

export default function TargetIncentiveSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-4 dark:border-slate-700"
      aria-label="Target and incentive sections"
    >
      {items.map(({ to, end, label }) => (
        <NavLink key={to} to={to} end={end} className={linkClass}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
