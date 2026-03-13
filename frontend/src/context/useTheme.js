import { useContext } from "react";
import { ThemeContext } from "./ThemeContextBase";

export function useTheme() {
  return useContext(ThemeContext);
}
