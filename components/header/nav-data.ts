// Header navigation content. Only the Solutions mega menu is designed (Figma 3008:9974);
// the other menus reuse link groups from the footer (assumptions H1).
// No page navigation is required by the brief, so every href is "#".

export interface NavLink {
  label: string;
  href: string;
}

export interface MegaGroup {
  label: string;
  links: NavLink[];
}

export type NavItem =
  | { kind: "link"; id: string; label: string; href: string }
  | { kind: "dropdown"; id: string; label: string; links: NavLink[] }
  | { kind: "mega"; id: string; label: string; groups: MegaGroup[] };

const links = (...labels: string[]): NavLink[] => labels.map((label) => ({ label, href: "#" }));

export const NAV_ITEMS: NavItem[] = [
  { kind: "dropdown", id: "product", label: "Product", links: links("How it works?", "Check All Document Types", "Integrations") },
  {
    kind: "mega",
    id: "solutions",
    label: "Solutions",
    groups: [
      { label: "Capabilities", links: links("Data Processing", "Data Extraction", "Data Interpretation", "Straight Through Processing (STP)") },
      { label: "Features", links: links("Fraud Detection", "Compliance Checks", "Audit Trail", "Human-in-the-Loop Review") },
      { label: "Integration", links: links("SAP", "Tally", "QuickBooks", "REST API & Webhooks") },
      { label: "Document Types", links: links("Accounts Payable", "Supply Chain", "Consumer Loans", "ID Card") },
    ],
  },
  { kind: "dropdown", id: "industries", label: "Industries", links: links("BFSI", "Healthcare", "Telecom", "Manufacturing") },
  { kind: "link", id: "pricing", label: "Pricing", href: "#" },
  {
    kind: "dropdown",
    id: "resources",
    label: "Resources",
    links: links("Blog", "Guides", "Newsroom", "API Documentation", "Product Documentation"),
  },
  { kind: "dropdown", id: "company", label: "Company", links: links("About", "Contact", "Careers") },
];

/** The section this page belongs to, styled as active (as in the design). */
export const ACTIVE = { item: "solutions", group: "Capabilities", link: "Data Processing" } as const;

/** Links go nowhere on this single page; keep link semantics but don't jump to the top. */
export function preventNavigation(event: { preventDefault(): void }) {
  event.preventDefault();
}
