# ✈️ flyteLog

**flyteLog** is a modern, web-based **Electronic Flight Bag (EFB)** designed for pilots who want a streamlined, all-in-one tool for managing their flying activities. It provides a fully EASA-compliant digital logbook, integrated flight planning with VFR chart support, performance calculations, and printable documentation — all accessible from any device with a browser.

Whether you're a student pilot tracking your first hours, or an experienced aviator planning cross-country routes, flyteLog aims to replace the clutter of paper logbooks, manual nav-logs, and scattered planning tools with a single, cohesive platform.

## 🚀 Key Features

- **EASA-Compliant Logbook** — Log flights for aeroplanes, gliders, and simulators with all fields required by European Aviation Safety Agency regulations.
- **Flight Planning** — Search for VFR waypoints (with IFR support planned), find locations by name, and build routes with an interactive map.
- **Operational Flight Plan (OFP)** — Auto-generate OFPs with performance calculations including fuel, weight & balance, and takeoff/landing distances.
- **Print Support** — Export and print logbook entries and OFPs for official record-keeping or personal archives.
- **Secure Authentication** — User accounts with email confirmation and role-based access.
- **Admin Dashboard** — Manage users, data, and application settings from a dedicated admin panel.

## 🛠️ Tech Stack

| Layer          | Technology                               |
| -------------- | ---------------------------------------- |
| Framework      | [Next.js](https://nextjs.org)            |
| Styling        | [Tailwind CSS](https://tailwindcss.com)  |
| UI Components  | [shadcn/ui](https://ui.shadcn.com)       |
| ORM            | [Prisma](https://prisma.io)              |
| Authentication | [Auth.js](https://authjs.dev)            |
| Database       | [PostgreSQL](https://www.postgresql.org) |

## 📋 Roadmap

- [x] Authentication system with email confirmation
- [ ] Admin dashboard
- [x] Main menu with feature navigation
- [ ] EASA-compliant logbook for aeroplanes, gliders, and simulators
- [ ] Route planning with VFR waypoint search (IFR in the future), place name lookup, and map integration
- [ ] Operational Flight Plan generation with performance calculations
- [ ] Print support for OFPs and logbook entries

## 🏗️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [PostgreSQL](https://www.postgresql.org) database
- [Bun](https://bun.sh) (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/czekanskyy/flytelog.git
cd flytelog

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and auth secrets

# Run database migrations
bunx prisma migrate dev

# Generate the db
bunx prisma generate

# Start the development server
bun dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.

You are free to:

- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:

- **Attribution** — You must give appropriate credit and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes without explicit permission from the author.
- **ShareAlike** — If you remix or build upon the material, you must distribute your contributions under the same license.

Full license text: [https://creativecommons.org/licenses/by-nc-sa/4.0/](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

Built with ☕ and a passion for aviation.
