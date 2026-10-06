jest.mock("../index", () => ({ isModuleEnabled: jest.fn() }));

import express, { type Express, type Router } from "express";
import { isModuleEnabled } from "../index";
import { registerFeatureModuleRoutes } from "../registerModules";

describe("registerFeatureModuleRoutes", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("mounts only enabled modules and returns their bootstraps", () => {
    (isModuleEnabled as jest.Mock).mockImplementation((module: string) => module === "ai");
    const app = { use: jest.fn() } as unknown as Express & { use: jest.Mock };
    const aiRouter = express.Router() as Router;
    const crmRouter = express.Router() as Router;
    const warm = jest.fn();

    const hooks = registerFeatureModuleRoutes(app, [
      { module: "ai", path: "/api/ai", router: aiRouter, onListen: warm },
      { module: "crm", path: "/api/crm", router: crmRouter, onListen: jest.fn() },
      { module: "ai", path: "/api/ai2", router: aiRouter },
    ]);

    expect(app.use.mock.calls).toEqual([
      ["/api/ai", aiRouter],
      ["/api/ai2", aiRouter],
    ]);
    expect(hooks).toEqual([warm]);
  });
});
