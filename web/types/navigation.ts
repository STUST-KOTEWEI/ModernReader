import { ReactNode } from "react";

export interface NavItem {
    href: string;
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}
