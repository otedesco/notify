import * as cerberus from "./cerberus";
import * as hermes from "./hermes";

const AUTH_SERVICE = "cerberus";

const NOTIFICATION_SERVICE = "hermes";

export const Components = {
  ACCOUNT: "account",
  PROFILE: "profile",
  ORGANIZATION: "organization",
  ROLE: "role",
} as const;

export const ServicesTopics = {
  [`${AUTH_SERVICE}_${Components.ACCOUNT}_topic`]: NOTIFICATION_SERVICE,
  [`${AUTH_SERVICE}_${Components.PROFILE}_topic`]: NOTIFICATION_SERVICE,
  [`${AUTH_SERVICE}_${Components.ORGANIZATION}_topic`]: NOTIFICATION_SERVICE,
  [`${AUTH_SERVICE}_${Components.ROLE}_topic`]: NOTIFICATION_SERVICE,
  [`${NOTIFICATION_SERVICE}_${Components.ACCOUNT}_topic`]: AUTH_SERVICE,
  [`${NOTIFICATION_SERVICE}_${Components.PROFILE}_topic`]: AUTH_SERVICE,
  [`${NOTIFICATION_SERVICE}_${Components.ORGANIZATION}_topic`]: AUTH_SERVICE,
  [`${NOTIFICATION_SERVICE}_${Components.ROLE}_topic`]: AUTH_SERVICE,
} as const;

export const Services = {
  [AUTH_SERVICE]: cerberus,
  [NOTIFICATION_SERVICE]: hermes,
};

export const getService = (topic: string) => {
  const service = Services[ServicesTopics[topic]];

  return service;
};
