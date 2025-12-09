export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Circulo";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/circulo-logo.png";

// Login URL now points to our local auth page
export const getLoginUrl = () => {
  return "/auth/login";
};
