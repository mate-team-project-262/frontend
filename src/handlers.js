import { scrollToSection } from './utils/scrollToSection.js';

/**
 * Button actions of the landing page.
 * The navigation links scroll to their section. The rest (`onSignIn`, `onCreateAccount`,
 * `onStart`, `onSessionStarted`) are placeholders that intentionally do nothing yet - those
 * buttons only show their pressed state. Implement them here later (modals, API calls).
 */
export const onNavHowItWorks = () => scrollToSection('how-it-works');
export const onNavAccountBenefits = () => scrollToSection('account-benefits');
export const onSignIn = () => {};
export const onCreateAccount = () => {};
export const onStart = () => {};

/**
 * Called by the room lobby after the backend started the session.
 * TODO: navigate to the swipe page when it exists, e.g. navigate(`/room/${code}/swipe`).
 */
export const onSessionStarted = () => {};
