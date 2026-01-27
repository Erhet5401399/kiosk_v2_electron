import logo from "../../assets/logo.png";

type LogoSize = "small" | "medium" | "large";

interface LogoProps {
  size?: LogoSize;
}

export function Logo({ size = "medium" }: LogoProps) {
  return (
    <img
      src={logo}
      alt="Logo"
      className={`header-logo header-logo--${size}`}
    />
  );
}