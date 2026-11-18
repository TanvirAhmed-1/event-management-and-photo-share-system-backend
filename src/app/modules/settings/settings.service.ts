import prisma from "../../utils/prisma";

const getPlatformSettings = async () => {
  let settings = await prisma.platformSetting.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.platformSetting.create({
      data: {
        id: "default",
        maxEventsPerDay: 1,
        allowSameDateRequests: true,
        warnAdminOnSameDate: true,
        serviceCities: [],
      },
    });
  }

  return settings;
};

const updatePlatformSettings = async (payload: {
  maxEventsPerDay?: number;
  allowSameDateRequests?: boolean;
  warnAdminOnSameDate?: boolean;
  serviceCities?: string[];
}) => {
  await getPlatformSettings();

  const cleanCities = Array.isArray(payload.serviceCities)
    ? Array.from(
      new Set(
        payload.serviceCities
          .map((c) => String(c || "").trim())
          .filter(Boolean)
      )
    )
    : undefined;

  const updated = await prisma.platformSetting.update({
    where: { id: "default" },
    data: {
      ...(payload.maxEventsPerDay !== undefined
        ? { maxEventsPerDay: Math.max(1, Math.min(50, Number(payload.maxEventsPerDay))) }
        : {}),
      ...(payload.allowSameDateRequests !== undefined
        ? { allowSameDateRequests: Boolean(payload.allowSameDateRequests) }
        : {}),
      ...(payload.warnAdminOnSameDate !== undefined
        ? { warnAdminOnSameDate: Boolean(payload.warnAdminOnSameDate) }
        : {}),
      ...(cleanCities !== undefined ? { serviceCities: cleanCities } : {}),
      ...(cleanCities !== undefined ? { serviceCities: cleanCities } : {}),
    },
  });

  return updated;
};

export const SettingsService = {
  getPlatformSettings,
  updatePlatformSettings,
};
