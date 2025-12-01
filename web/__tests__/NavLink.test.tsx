import { render, screen } from "@testing-library/react";
import { NavLink } from "@/components/ui/NavLink";

describe("NavLink", () => {
    it("renders correctly", () => {
        render(<NavLink href="/test" icon={<span>Icon</span>} label="Test Link" />);

        expect(screen.getByText("Test Link")).toBeInTheDocument();
        expect(screen.getByText("Icon")).toBeInTheDocument();
        expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
    });

    it("applies active styles when active prop is true", () => {
        render(<NavLink href="/test" icon={<span>Icon</span>} label="Test Link" active={true} />);

        const link = screen.getByRole("link");
        expect(link).toHaveClass("bg-white/10");
        expect(link).toHaveAttribute("aria-current", "page");
    });
});
