import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  currentPage: string;
}

export default function Breadcrumbs({ items, currentPage }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home link */}
        <li>
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Home
          </Link>
        </li>

        {/* Separator */}
        <li className="text-gray-400">
          <svg
            className="w-4 h-4"
            width={16}
            height={16}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </li>

        {/* Intermediate items */}
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center space-x-2">
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
            <span className="text-gray-400">
              <svg
                className="w-4 h-4"
                width={16}
                height={16}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </li>
        ))}

        {/* Current page */}
        <li>
          <span className="text-gray-900 font-medium" aria-current="page">
            {currentPage}
          </span>
        </li>
      </ol>
    </nav>
  );
}
