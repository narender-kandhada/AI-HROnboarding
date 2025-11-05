import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo3.png";

export default function LogoNav({ token }) {
  const navigate = useNavigate();

  return (
    <div className="absolute top-8 right-8 z-50 cursor-pointer">
      <img
        src={logo}
        alt="Sumeru Logo"
        className="h-12 w-auto hover:scale-105 transition-transform duration-200"
        onClick={() => navigate(token ? `/dashboard/${token}` : "/dashboard")}
      />
    </div>
  );
}
