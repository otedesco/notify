import { describe, expect, test } from "vitest";

import { ProvidersEnum } from "../enums/ProvidersEnum";

describe("notification providers", () => {
  test("exposes the supported provider identifiers", () => {
    expect(Object.values(ProvidersEnum)).toEqual(["serviceBus", "kafka"]);
  });
});
