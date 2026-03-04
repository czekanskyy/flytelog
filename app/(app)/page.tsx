import { getTranslations } from "next-intl/server"
import {
  PlaneTakeoff,
  Sailboat,
  Monitor,
  Map,
  CloudSun,
  FileText,
} from "lucide-react"
import { MenuCategory } from "@/components/menu-category"
import { MenuTile } from "@/components/menu-tile"

export default async function HomePage() {
  const t = await getTranslations("home")

  return (
    <div className="space-y-8">
      <MenuCategory title={t("logbook.title")}>
        <MenuTile
          href="/logbook/aeroplane"
          icon={PlaneTakeoff}
          label={t("logbook.aeroplane")}
          description={t("logbook.aeroplaneDesc")}
        />
        <MenuTile
          href="/logbook/glider"
          icon={Sailboat}
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
          href="/planning/route"
          icon={Map}
          label={t("planning.route")}
          description={t("planning.routeDesc")}
        />
        <MenuTile
          href="/planning/weather"
          icon={CloudSun}
          label={t("planning.weather")}
          description={t("planning.weatherDesc")}
        />
        <MenuTile
          href="/planning/ofp"
          icon={FileText}
          label={t("planning.ofp")}
          description={t("planning.ofpDesc")}
        />
      </MenuCategory>
    </div>
  )
}
