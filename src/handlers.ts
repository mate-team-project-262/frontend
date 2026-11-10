import { scrollToSection } from './utils/scrollToSection.ts';

/**
 * Button actions of the landing page.
 * The navigation links scroll to their section. The rest (`onSignIn`, `onCreateAccount`)
 * are placeholders that intentionally do nothing yet - those
 * buttons only show their pressed state. Implement them here later (modals, API calls).
 */
export const onNavHowItWorks = () => scrollToSection('how-it-works');
export const onNavAccountBenefits = () => scrollToSection('account-benefits');
export const onSignIn = () => {};
export const onCreateAccount = () => {};
