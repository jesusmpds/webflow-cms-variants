const config = {
  sortBy: "",
  sortOrder: "",
  defaultLocale: "en-US",
  defaultCurrency: "USD",
  priceDisplay: "low",
  inventoryDefaultLabel: "Please choose options",
  selectUnavailableLabel: "Unavailable",
  inventoryControl: false,
  multiCurrency: true,
  multilingual: true,
  addonsConfig: {
    // Add template sets for new currencies/languages with their currency-locale pairs as needed
    templateSets: {
      es: { currency: "eur", locale: "es-ES" },
      gb: { currency: "gbp", locale: "en-GB" },
    },
    translations: {
      es: {
        inventoryDefaultLabel: "Por favor, elige opciones",
        selectUnavailableLabel: "No disponible",
      },
    },
    templateChangeByCustomerCountry: false,
    templateChangeBySubdirectory: false,
    templateChangeBySubdomain: false,
    webflowLocalization: false,
    weglotJavascriptIntegration: false,
  },
};

const variants = Foxy.setVariantConfig(config);
variants.init();

// Multiple instances init

(() => {
  const variants = Foxy.setVariantConfig(config);
  variants.init();
})();
