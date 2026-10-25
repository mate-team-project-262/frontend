/**
 * Placeholders for buttons whose behaviour is not implemented yet.
 * They intentionally do nothing - the buttons only show their pressed state.
 * Implement the real behaviour here (navigation, modals, API calls) later.
 */
export const onNavHowItWorks = () => {};
export const onNavAccountBenefits = () => {};
export const onSignIn = () => {};
export const onCreateAccount = () => {};
export const onStart = () => {};

/**
 * Called by the room lobby after the backend started the session.
 * TODO: navigate to the swipe page when it exists, e.g. navigate(`/room/${code}/swipe`).
 */
export const onSessionStarted = () => {};

/**
 * Called after the backend let a guest into a room (from "Join a movie room" or the invite page).
 * TODO: navigate to the waiting room page ("You're in!") when it exists.
 */
export const onRoomJoined = () => {};
