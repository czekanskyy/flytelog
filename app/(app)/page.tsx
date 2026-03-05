import { getTranslations } from "next-intl/server"
import {
  Plane,
  Send,
  Monitor,
  Route,
  CloudSun,
  FileText,
} from "lucide-react"
import { MenuCategory } from "@/components/menu-category"
import { MenuTile } from "@/components/menu-tile"

export default async function HomePage() {
  const t = await getTranslations("home")

  return (
    <main className="flex flex-1 items-center justify-center min-h-[calc(100svh-5rem)] px-4">
      <div className="w-full max-w-3xl space-y-8">
        <MenuCategory title={t("logbook.title")}>
          <MenuTile
            href="/logbook/aircraft"
            icon={Plane}
            label={t("logbook.aeroplane")}
            description={t("logbook.aeroplaneDesc")}
          />
          <MenuTile
            href="/logbook/glider"
            icon={Send}
            label={t("logbook.glider")}
            description={t("logbook.gliderDesc")}
          />
          <MenuTile
            href="/logbook/fstd"
            icon={Monitor}
            label={t("logbook.fstd")}
            description={t("logbook.fstdDesc")}
          />
        </MenuCategory>

        <MenuCategory title={t("planning.title")}>
          <MenuTile
            href="/plan/route"
            icon={Route}
            label={t("planning.route")}
            description={t("planning.routeDesc")}
          />
          <MenuTile
            href="/plan/ofp"
            icon={FileText}
            label={t("planning.ofp")}
            description={t("planning.ofpDesc")}
          />
          <MenuTile
            href="/plan/weather"
            icon={CloudSun}
            label={t("planning.weather")}
            description={t("planning.weatherDesc")}
          />
        </MenuCategory>
      </div>
    </main>
  )
}
