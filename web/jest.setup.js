import '@testing-library/jest-dom'

// Mock next-intl/navigation
jest.mock('next-intl/navigation', () => ({
    createNavigation: () => ({
        Link: (props) => <a {...props} />,
        usePathname: () => '/',
        useRouter: () => ({
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
        }),
    }),
}));

// Mock the local navigation file which re-exports from next-intl/navigation
jest.mock('@/i18n/navigation', () => ({
    Link: (props) => <a {...props} />,
    usePathname: () => '/',
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
}));
