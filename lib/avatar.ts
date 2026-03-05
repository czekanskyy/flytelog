const AVATAR_COLORS = [
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#fbbf24", // amber-400
  "#a3e635", // lime-400
  "#4ade80", // green-400
  "#34d399", // emerald-400
  "#2dd4bf", // teal-400
  "#22d3ee", // cyan-400
  "#38bdf8", // sky-400
  "#60a5fa", // blue-400
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c084fc", // purple-400
  "#e879f9", // fuchsia-400
  "#f472b6", // pink-400
  "#fb7185", // rose-400
] as const

export function getRandomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
