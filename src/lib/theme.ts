export const THEME_KEY = "rm-theme";
export type Theme = "light" | "dark";

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the
 * wrong theme. No saved choice = no attribute = the CSS follows the system
 * setting, so static pages need no server-side theme knowledge (R35, R43).
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
