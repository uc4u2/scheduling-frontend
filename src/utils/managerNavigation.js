export const OPEN_MANAGER_NAVIGATION_EVENT = "schedulaa:open-manager-navigation";

export const requestManagerNavigation = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_MANAGER_NAVIGATION_EVENT));
};
