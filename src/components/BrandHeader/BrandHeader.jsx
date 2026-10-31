import { Link, useNavigate } from 'react-router';
import logo from '../../assets/landing/w2w-logo.svg';
import { ROUTES } from '../../routes.js';
import './BrandHeader.css';

function ArrowLeft() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path
        d="M17 7H1.5M7.5 1 1.5 7l6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Header of the dark pages: W2W logo and a "Back" button. Without `onBack` it goes to the
 * landing page; pass `onBack` when going back must do something first (e.g. leave the room).
 */
export default function BrandHeader({ onBack }) {
  const navigate = useNavigate();

  return (
    <header className="brand-header">
      <div className="container brand-header__inner">
        <Link to={ROUTES.home} className="brand-header__logo" aria-label="W2W, home page">
          <img src={logo} width="106" height="48" alt="" />
        </Link>
        <button
          type="button"
          className="brand-header__back"
          onClick={onBack ?? (() => navigate(ROUTES.home))}
        >
          <ArrowLeft />
          Back
        </button>
      </div>
    </header>
  );
}