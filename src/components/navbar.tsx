import { Link } from '@tanstack/react-router';

export function Navbar() {
  return (
    <div className="flex gap-2 p-2">
      <Link to="/exp" className="[&.active]:font-bold">
        Exp
      </Link>{' '}
      <Link to="/zeny" className="[&.active]:font-bold">
        Zeny
      </Link>
    </div>
  );
}
