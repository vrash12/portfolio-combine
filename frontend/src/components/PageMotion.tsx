import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { observePageMotion } from "../lib/pageMotion";

export default function PageMotion() {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) return observePageMotion(root);
  }, [pathname]);

  return null;
}
