export function buildCatalogRoutes({ catalogController }) {
  return [
    {
      method: "GET",
      path: "/catalog/courses",
      handler: (context) => catalogController.listCourses(context),
    },
    {
      method: "GET",
      path: "/catalog/processes",
      handler: (context) => catalogController.listSelectionProcesses(context),
    },
    {
      method: "GET",
      path: "/catalog/states",
      handler: (context) => catalogController.listStates(context),
    },
    {
      method: "GET",
      path: "/catalog/cities",
      handler: (context) => catalogController.listCities(context),
    },
    {
      method: "GET",
      path: "/catalog/institutions",
      handler: (context) => catalogController.listInstitutions(context),
    },
    {
      method: "GET",
      path: "/catalog/campuses",
      handler: (context) => catalogController.listCampuses(context),
    },
    {
      method: "GET",
      path: "/catalog/quotas",
      handler: (context) => catalogController.listQuotaCategories(context),
    },
  ];
}
