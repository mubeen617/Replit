import { ChevronRight } from "lucide-react";

interface HeaderProps {
  title: string;
  breadcrumb: string;
  action?: React.ReactNode;
}

export function Header({ title, breadcrumb, action }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">{title}</h1>
          <nav className="flex mt-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-secondary-500">
              <li>
                <a href="#" className="hover:text-secondary-700">Dashboard</a>
              </li>
              <li>
                <ChevronRight size={16} className="text-xs" />
              </li>
              <li className="text-secondary-900 font-medium">{breadcrumb}</li>
            </ol>
          </nav>
        </div>
        {action && (
          <div className="flex items-center space-x-3">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
