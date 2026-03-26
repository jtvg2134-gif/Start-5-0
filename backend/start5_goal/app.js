import http from "node:http";
import { CatalogController } from "./controllers/catalog.controller.js";
import { OnboardingController } from "./controllers/onboarding.controller.js";
import { query } from "./db/connection.js";
import { CatalogRepository } from "./repositories/catalog.repository.js";
import { CutoffRepository } from "./repositories/cutoff.repository.js";
import { OfferRepository } from "./repositories/offer.repository.js";
import { QuotaRepository } from "./repositories/quota.repository.js";
import { ScoreRuleRepository } from "./repositories/scoreRule.repository.js";
import { TargetResultRepository } from "./repositories/targetResult.repository.js";
import { UserProfileRepository } from "./repositories/userProfile.repository.js";
import { buildCatalogRoutes } from "./routes/catalog.routes.js";
import { buildOnboardingRoutes } from "./routes/onboarding.routes.js";
import { CatalogService } from "./services/catalog/CatalogService.js";
import { OfferDiscoveryService } from "./services/OfferDiscoveryService.js";
import { OnboardingResolutionService } from "./services/OnboardingResolutionService.js";
import { StudyPlanService } from "./services/StudyPlanService.js";
import { TargetScoreService } from "./services/TargetScoreService.js";
import { getRoutePath, sendJson, sendRouteError } from "./shared/http.js";

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function applyCors(response) {
  response.setHeader("Access-Control-Allow-Origin", process.env.START5_GOAL_CORS_ORIGIN || "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
}

const db = { query };
const catalogRepository = new CatalogRepository({ db });
const quotaRepository = new QuotaRepository({ db });
const offerRepository = new OfferRepository({ db });
const cutoffRepository = new CutoffRepository({ db });
const scoreRuleRepository = new ScoreRuleRepository({ db });
const userProfileRepository = new UserProfileRepository({ db });
const targetResultRepository = new TargetResultRepository({ db });

const catalogService = new CatalogService({ catalogRepository, quotaRepository });
const offerDiscoveryService = new OfferDiscoveryService({ offerRepository });
const targetScoreService = new TargetScoreService({
  cutoffRepository,
  quotaRepository,
  scoreRuleRepository,
});
const studyPlanService = new StudyPlanService();
const onboardingResolutionService = new OnboardingResolutionService({
  offerDiscoveryService,
  targetScoreService,
  studyPlanService,
  userProfileRepository,
  targetResultRepository,
});

const catalogController = new CatalogController({ catalogService });
const onboardingController = new OnboardingController({ onboardingResolutionService });

const routes = [
  ...buildCatalogRoutes({ catalogController }),
  ...buildOnboardingRoutes({ onboardingController }),
];

const server = http.createServer(async (request, response) => {
  applyCors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const path = normalizePath(getRoutePath(url.pathname));

  if (request.method === "GET" && path === "/health") {
    sendJson(response, 200, { ok: true, service: "start5-goal-api" });
    return;
  }

  const route = routes.find((candidate) => candidate.method === request.method && candidate.path === path);

  if (!route) {
    sendJson(response, 404, { error: "Rota Start5 Goal nao encontrada." });
    return;
  }

  try {
    await route.handler({ request, response, url });
  } catch (error) {
    sendRouteError(response, error);
  }
});

const port = Number(process.env.START5_GOAL_PORT || process.env.PORT || 3020);

server.listen(port, () => {
  console.log(`Start5 Goal API rodando em http://localhost:${port}`);
});
