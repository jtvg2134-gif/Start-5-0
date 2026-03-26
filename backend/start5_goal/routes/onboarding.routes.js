export function buildOnboardingRoutes({ onboardingController }) {
  return [
    {
      method: "POST",
      path: "/onboarding/resolve-goal",
      handler: (context) => onboardingController.resolveGoal(context),
    },
  ];
}
