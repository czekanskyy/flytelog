"use client"

import { getInitials } from "@/lib/avatar"

export function UserAvatar({
  firstName,
  lastName,
  color,
  size = "md",
}: {
  firstName: string
  lastName: string
  color: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full font-semibold text-white select-none`}
      style={{ backgroundColor: color }}
    >
      {getInitials(firstName, lastName)}
    </div>
  )
}
