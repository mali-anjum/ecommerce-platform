import { HelpCircle, Mail, Phone, Shield } from "lucide-react";
import type { InfoMenuLink } from "@/components/layout/site-header/types/site-header.types";

/** Footer-style info links shown in mobile sheet and guest account menu. */
export const SITE_HEADER_INFO_LINKS: InfoMenuLink[] = [
  {
    title: "Contact Us",
    to: "/contact",
    icon: <Phone className="mr-2 h-4 w-4" />,
  },
  {
    title: "Help Center",
    to: "/help",
    icon: <HelpCircle className="mr-2 h-4 w-4" />,
  },
  {
    title: "Privacy Policy",
    to: "/privacy",
    icon: <Shield className="mr-2 h-4 w-4" />,
  },
  {
    title: "Terms of Service",
    to: "/terms",
    icon: <Mail className="mr-2 h-4 w-4" />,
  },
];
