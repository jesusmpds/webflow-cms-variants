function multiCurrencyLogic() {
  // Multi-Currency Logic Scenarios
  let template_set;
  // Customer currency by URL Path
  const currentPagePath = window.location.pathname;
  if (currentPagePath.includes("/es/")) {
    template_set = "EUR";
    // Add the right locale and currency code here if the condition is met.
    config.locale = "es-ES";
    config.currency = "EUR";
  } else {
    template_set = "DEFAULT";
  }

  // Customer country by IP
  const country = FC.json.shipping_address.country;

  if (country == "AR") {
    template_set = "EUR";
    config.locale = "es-ES";
    config.currency = "EUR";
  } else {
    // Default
    template_set = "DEFAULT";
  }

  // Update Foxy Template Set Function
  const existing_template_set = FC.json.template_set == "" ? "DEFAULT" : FC.json.template_set;
  if (existing_template_set != template_set) {
    FC.client.request("https://" + FC.settings.storedomain + "/cart?template_set=" + template_set);
  }
}
