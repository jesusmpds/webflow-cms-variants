// Foxy Variant Script v2.0.0
// const config = {
//   sortBy: "",
//   sortOrder: "",
//   defaultLocale: "en-US",
//   defaultCurrency: "USD",
//   priceDisplay: "low",
//   inventoryDefaultLabel: "Please choose options",
//   selectUnavailableLabel: "Unavailable",
//   inventoryControl: false,
//   multiCurrency: true,
//   multilingual: true,
//   addonsConfig: {
//     // Add template sets for new currencies/languages with their currency-locale pairs as needed
//     templateSets: {
//       es: { currency: "eur", locale: "es-ES" },
//       gb: { currency: "gbp", locale: "en-GB" },
//     },
//     translations: {
//       // Add translations for each template set code.
//       es: {
//         inventoryDefaultLabel: "Por favor, elige opciones",
//         selectUnavailableLabel: "No disponible",
//       },
//     },
//     templateChangeTrigger: window.location.href.includes("spanish") ? "subdirectory" : "weglotjs",
//   },
// };

var FC = FC || {};
var Weglot = Weglot || {};
var Foxy = (function () {
  // Static properties
  let stylesAdded = false;

  function setVariantConfig(newConfig) {
    // Constants and variables
    const config = {
      sortBy: "",
      sortOrder: "",
      defaultLocale: "en-US",
      defaultCurrency: "USD",
      priceDisplay: "low",
      inventoryDefaultLabel: "Please choose options",
      selectUnavailableLabel: "Unavailable",
      inventoryControl: false,
      multiCurrency: false,
      multilingual: false,
      addonsConfig: null,
    };
    const disableClass = "foxy-disable";
    const disableOptionClass = "foxy-disable-option";
    const foxy_variant_group = "foxy-variant-group";
    const foxy_variant_group_order = "foxy-variant-group-order";
    const foxy_variant_item = "[foxy-id='variant-item']";
    const foxy_variant_group_name = "foxy-variant-group-name";
    const foxy_template_switch = "[foxy-id='switch']";
    let variantSelectionCompleteProduct = [];
    let variantItems = { serialized: {}, array: [] };
    let variantGroups = [];
    let addonInit = true;

    let switchEventListenerSet = false;

    // Save first config and update internal config for instance
    const firstConfigDefaults = { ...newConfig };
    setConfig(config, newConfig);
    // Check container where the instance will get it's data
    let container = setContainer();

    const foxyForm = container.querySelector("[foxy-id='form']");
    const imageElement = container.querySelector("[foxy-id='image']");
    const priceElement = container.querySelector("[foxy-id='price']");
    const inventoryElement = container.querySelector("[foxy-id='inventory']");
    const quantityElement = foxyForm?.querySelector("input[name='quantity']");
    const priceAddToCart = foxyForm?.querySelector("input[name='price']");
    const addToCartQuantityMax = foxyForm?.querySelector("input[name='quantity_max']");
    const variantGroupElements = foxyForm?.querySelectorAll(`[${foxy_variant_group}]`);
    const foxyTemplateSwitch = document.querySelector(foxy_template_switch);

    //Insert disabled class styles
    if (!stylesAdded) {
      document.head.insertAdjacentHTML(
        "beforeend",
        `<style>
         .${disableClass} {opacity: 0.5 !important; }  
          .${disableOptionClass} {color: #808080 !important;} 
          </style>`
      );
      stylesAdded = true;
    }

    function setConfig(config, newConfig) {
      if (newConfig && typeof newConfig === "object") {
        for (const key in newConfig) {
          if (key in config) {
            config[key] = newConfig[key];
          }
        }
      }
    }

    function setContainer() {
      let container = document;
      const foxyInstanceContainer = document?.currentScript?.closest("[foxy-id='container']");
      if (foxyInstanceContainer) container = foxyInstanceContainer;
      return container;
    }

    function getTemplateSetFromURL(url, config) {
      // Extracting the subdomain and subdirectory from the URL
      const urlParts = url.split("/");
      const subdomain = urlParts[2].split(".")[0]; // Assuming subdomain is the first part
      const subdirectory = urlParts[3]; // Assuming subdirectory is the second part
      const isTemplateChangeBySubdomain = config.addonsConfig.templateChangeTrigger === "subdomain";
      const isTemplateChangeBySubdirectory =
        config.addonsConfig.templateChangeTrigger === "subdirectory";

      // Check if the configuration flags are enabled
      if (isTemplateChangeBySubdomain) {
        // Check if the subdomain matches any templateSet
        const matchingSubdomainSet = config.addonsConfig.templateSets[subdomain];
        if (matchingSubdomainSet) return subdomain;
      }

      if (isTemplateChangeBySubdirectory) {
        // Check if the subdirectory matches any templateSet
        const matchingSubdirectorySet = config.addonsConfig.templateSets[subdirectory];
        if (matchingSubdirectorySet) return subdirectory;
      }

      // No matching templateSet found
      return null;
    }

    function handleAddons() {
      let templateSet = "DEFAULT";
      const newAddonConfig = {
        defaultCurrency: config.defaultCurrency,
        defaultLocale: config.defaultLocale,
      };
      // Get templateSet from URL
      const templateSetFromURL = getTemplateSetFromURL(window.location.href, config);

      const isTemplateChangeByCountry = config.addonsConfig.templateChangeTrigger === "country";
      const isTemplateChangeByWeglotJS = config.addonsConfig.templateChangeTrigger === "weglotjs";

      // helper function
      const updateNewConfig = templateSetCode => {
        const templateSetConfig = config.addonsConfig.templateSets[templateSetCode];
        if (templateSetConfig) {
          const { currency, locale } = templateSetConfig;
          newAddonConfig.defaultCurrency = currency;
          newAddonConfig.defaultLocale = locale;
          templateSet = templateSetCode;

          const translation = config.addonsConfig.translations[templateSetCode];
          if (translation) {
            const { selectUnavailableLabel, inventoryDefaultLabel } = translation;
            newAddonConfig.selectUnavailableLabel = selectUnavailableLabel;
            newAddonConfig.inventoryDefaultLabel = inventoryDefaultLabel;
          }
        } else {
          const { defaultCurrency, defaultLocale, selectUnavailableLabel, inventoryDefaultLabel } =
            firstConfigDefaults;
          newAddonConfig.defaultCurrency = defaultCurrency;
          newAddonConfig.defaultLocale = defaultLocale;
          newAddonConfig.selectUnavailableLabel = selectUnavailableLabel;
          newAddonConfig.inventoryDefaultLabel = inventoryDefaultLabel;
          templateSet = "DEFAULT";
        }
      };
      // Handlers
      const handleWeglotLanguageChange = (newLang, prevLang) => {
        updateNewConfig(newLang);
        removeVariantOptions();
        addonInit = false;
        // Set config with newConfig
        setConfig(config, newAddonConfig);
        // Update Foxy Template Set Function
        updateTemplateSet(templateSet, true);
      };

      const handleTemplateSwitcher = e => {
        const element = e.target;
        const templateSetCode = element.getAttribute("foxy-template");
        if (templateSetCode) {
          addonInit = false;
          removeVariantOptions();
          updateNewConfig(templateSetCode);
          setConfig(config, newAddonConfig);
          updateTemplateSet(templateSet, true);
        }
      };

      if (isTemplateChangeByCountry) {
        // Customer country by IP
        const country = FC.json.shipping_address.country.toLowerCase();
        updateNewConfig(country);
      }

      // Handle Weglot Integration
      if (isTemplateChangeByWeglotJS) {
        updateNewConfig(Weglot.getCurrentLang());
        // Event listener
        Weglot.on("languageChanged", handleWeglotLanguageChange);
      }

      // Subdomain or subdirectory
      if (templateSetFromURL) updateNewConfig(templateSetFromURL);

      // Set config with newConfig
      setConfig(config, newAddonConfig);

      // Update Foxy Template Set Function
      updateTemplateSet(templateSet);

      // Set event handler for template set switcher if it exists
      if (!switchEventListenerSet && foxyTemplateSwitch) {
        foxyTemplateSwitch?.addEventListener("click", handleTemplateSwitcher);
        switchEventListenerSet = true;
      }
    }

    function updateTemplateSet(templateSet, initVariantLogic = false) {
      const existingTemplateSet = FC.json.template_set || "DEFAULT";
      if (existingTemplateSet !== templateSet) {
        FC.client.request(`https://${FC.settings.storedomain}/cart?template_set=${templateSet}`);
      }
      if (initVariantLogic) init();
    }

    function init() {
      if ((config.multiCurrency || config.multilingual) && addonInit) {
        const existingOnLoad = typeof FC.onLoad == "function" ? FC.onLoad : function () {};

        FC.onLoad = function () {
          existingOnLoad();
          addonInit = false;
          FC.client.on("ready.done", handleAddons).on("ready.done", init);
        };
        return;
      }

      // Set quantity input defaults
      setDefaults();
      // Build variant list info into variable
      buildVariantList();
      // Build variant group list info into variable
      buildVariantGroupList();
      // Build variant/radio options
      renderVariantGroups();

      addPrice();

      setInventory();

      // Handle selected variants if foxy form is set
      foxyForm?.addEventListener("change", handleVariantSelection);
    }

    function setDefaults() {
      if (quantityElement) {
        quantityElement.setAttribute("value", "1");
        quantityElement.setAttribute("min", "1");
      }
    }

    function buildVariantList() {
      const variantList = container.querySelectorAll(foxy_variant_item);

      if (!variantList.length) return;

      variantList.forEach(variantItem => {
        const variant = Object.values(variantItem.attributes).reduce((acc, currAttr) => {
          const { name, value } = currAttr;

          if (name.includes("foxy-variant") && value) {
            const key = sanitize(name.split("foxy-variant-")[1]);
            const currency = sanitize(config.defaultCurrency);

            if (!acc[key]) {
              // Handle multi-currency scenario
              if (config.multiCurrency && key === `price-${currency}`) {
                acc["price"] = value.trim();
                return acc;
              }

              if (config.multiCurrency && key.includes("price") && key !== `price-${currency}`)
                return acc;

              acc[key === "sku" ? "code" : key] = value.trim();
            }
            return acc;
          }
          return acc;
        }, {});

        variantItems.serialized[variant?.code ?? variant.name] = filterEmpty(variant);
        variantItems.array.push(filterEmpty(variant));
      });
      console.log("variantItems", variantItems);
    }

    function buildVariantGroupList() {
      // Get variant group names, any custom sort orders if they exist, and their element design
      // either radio or select
      if (!variantGroupElements) return;

      variantGroupElements.forEach(variantGroupElement => {
        let editorElementGroupName;
        const cmsVariantGroupName = sanitize(variantGroupElement.getAttribute(foxy_variant_group));
        const variantOptionsData = getVariantGroupOptions(cmsVariantGroupName);
        const variantGroupOptions = variantOptionsData.map(option => option.variantOption);

        const variantGroupType = variantGroupElementsType(variantGroupElement);
        const variantOptionDesignElement = variantGroupType === "select" ? "select" : ".w-radio";
        if (variantOptionDesignElement === "select") {
          editorElementGroupName = variantGroupElement
            .querySelector(variantOptionDesignElement)
            .getAttribute("data-name");
        } else {
          editorElementGroupName = variantGroupElement
            .querySelector(`${variantOptionDesignElement} input[type=radio]`)
            .getAttribute("data-name");
        }

        const customSortOrder =
          variantGroupElement
            .getAttribute(foxy_variant_group_order)
            ?.trim()
            .split(/\s*,\s*/) ?? null;

        if (variantGroupOptions.length === 0) {
          variantGroupElement.remove();
        } else {
          variantGroups.push({
            editorElementGroupName,
            customSortOrder,
            element: variantGroupElement,
            options: variantGroupOptions,
            optionsData: variantOptionsData,
            name: cmsVariantGroupName,
            variantGroupType,
            variantOptionDesign: variantGroupElement.querySelector(variantOptionDesignElement),
            variantOptionDesignParent: variantGroupElement.querySelector(variantOptionDesignElement)
              .parentElement,
          });
          variantGroupElement.querySelector(variantOptionDesignElement).remove();
        }
      });
      console.log("variantGroups", variantGroups);
    }

    function variantGroupElementsType(variantGroupElement) {
      // check if the element contains a select tag or a radio tag
      const select = variantGroupElement.querySelector("select");
      const radio = variantGroupElement.querySelector("input[type=radio]");
      if (select) return "select";
      if (radio) return "radio";
    }

    function getVariantGroupOptions(groupName) {
      const variantGroupOptions = [];
      variantItems.array.forEach(variantItem => {
        const variantOption = variantItem[groupName]?.trim();
        // Filter the variantItem for keys with the groupName plus a "-", slice it off and use the rest as they key for the variantGroupOPtions object
        const variantItemStyles = Object.fromEntries(
          Object.entries(variantItem)
            .filter(([key, value]) => {
              if (key.includes(`${groupName}-`) && value) return true;
            })
            .map(([key, value]) => [key.replace(`${groupName}-`, ""), value])
        );

        // Only add variant option to array if it is not already in the array
        if (
          variantOption &&
          !variantGroupOptions.some(option => option.variantOption === variantOption)
        ) {
          variantGroupOptions.push({
            inventory: variantItem.inventory,
            label: variantItem.label,
            price: variantItem.price,
            variantOption,
            styles: variantItemStyles,
          });
        }
      });

      sortOptions(variantGroupOptions);
      return variantGroupOptions;
    }

    function sortOptions(variantGroupOptions) {
      const { sortBy, sortOrder } = config;

      const compareFn = (a, b) => {
        if (sortBy === "price") {
          const priceA = a.price;
          const priceB = b.price;

          return sortOrder === "Descending" ? priceB - priceA : priceA - priceB;
        } else if (sortBy === "label") {
          const labelA = a.label;
          const labelB = b.label;

          if (sortOrder === "descending") {
            return labelB.localeCompare(labelA);
          } else if (sortOrder === "ascending") {
            return labelA.localeCompare(labelB);
          }
        }
        // If sortBy is not "Price" or "Label", return 0 to maintain the original order
        return 0;
      };

      if (sortBy) {
        variantGroupOptions.sort(compareFn);
      } else {
        // Default sorting
        variantGroupOptions.sort((a, b) => {
          const labelA = a.variantOption;
          const labelB = b.variantOption;

          if (sortOrder === "descending") {
            return labelB.localeCompare(labelA);
          } else if (sortOrder === "ascending") {
            return labelA.localeCompare(labelB);
          }
          // If sortOrder is not specified, return 0 to maintain original order
          return 0;
        });
      }

      return variantGroupOptions;
    }

    function renderVariantGroups() {
      const style = (node, styles) =>
        Object.keys(styles).forEach(key => (node.style[key] = styles[key]));

      const addRadioOptions = variantGroup => {
        const {
          editorElementGroupName,
          element,
          name,
          options,
          optionsData,
          customSortOrder,
          variantOptionDesign,
          variantOptionDesignParent,
        } = variantGroup;
        const variantOptions = customSortOrder ? customSortOrder : options;

        variantOptions.forEach((option, index) => {
          const variantOptionData = optionsData.find(
            optionData => optionData.variantOption === option
          );

          const variantOptionClone = variantOptionDesign.cloneNode(true);
          const radioInput = variantOptionClone.querySelector("input[type=radio]");
          const label = variantOptionClone.querySelector("span[for]");

          label.textContent = option;
          label.setAttribute("for", `${option}-${index}`);

          radioInput.id = `${option}-${index}`;
          radioInput.name = editorElementGroupName ? editorElementGroupName : name;

          radioInput.value = option;
          radioInput.setAttribute(foxy_variant_group_name, name);
          radioInput.required = true;

          // Add disabled class to options that don't have inventory
          if (
            config.inventoryControl &&
            variantGroups.length === 1 &&
            !Number(variantOptionData.inventory)
          ) {
            radioInput.disabled = true;
            radioInput.parentElement.classList.add(disableClass);
          }

          const customInput = variantOptionClone.querySelector("div.w-radio-input");
          // Apply any css styles to the current variant option
          customInput ? style(customInput, variantOptionData.styles) : null;

          // Add radio to variant group container containing parent
          if (variantOptionDesignParent?.getAttribute(foxy_variant_group)) {
            element.append(variantOptionClone);
          } else {
            variantOptionDesignParent.append(variantOptionClone);
          }
        });
      };
      const addSelectOptions = variantGroup => {
        const {
          editorElementGroupName,
          element,
          name,
          options,
          optionsData,
          customSortOrder,
          variantOptionDesign,
          variantOptionDesignParent,
        } = variantGroup;

        const variantOptions = customSortOrder ? customSortOrder : options;
        let variantSelect = variantOptionDesign.cloneNode(true);
        variantSelect.required = true;
        variantSelect.name = editorElementGroupName ? editorElementGroupName : name;

        variantSelect.setAttribute(foxy_variant_group_name, name);

        variantOptions.forEach(option => {
          const variantOptionData = optionsData.find(
            optionData => optionData.variantOption === option
          );
          let selectOption = new Option(option, option);
          // Add disabled class to options that don't have inventory
          // when variant group is the only one
          if (
            config.inventoryControl &&
            variantGroups.length === 1 &&
            !Number(variantOptionData.inventory)
          ) {
            let unavailableText;
            if (config.selectUnavailableLabel)
              unavailableText = `(${config.selectUnavailableLabel})`;
            selectOption = new Option(`${option} ${unavailableText}`, option);
            selectOption.disabled = true;
          }

          variantSelect.add(selectOption);
        });

        // Add select to variant group container
        if (variantOptionDesignParent.getAttribute(foxy_variant_group)) {
          element.append(variantSelect);
        } else {
          variantOptionDesignParent.append(variantSelect);
        }
      };

      // No variant groups early return
      if (!variantGroups.length) return;

      variantGroups.forEach(variantGroup => {
        // Add select or radio to variant group container
        if (variantGroup.variantGroupType === "select") {
          addSelectOptions(variantGroup);
        } else {
          addRadioOptions(variantGroup);
        }
      });
    }

    function removeVariantOptions() {
      if (!variantGroups.length) return;
      // Iterate through each variant group element
      variantGroups.forEach(variantGroup => {
        const { variantOptionDesignParent } = variantGroup;

        // If variant group type is radio, remove all radio inputs except the first one
        // known issue that if the first one is selected on re rendering all will have that style applied
        if (variantGroup.variantGroupType === "radio") {
          const radioInputs = variantOptionDesignParent.querySelectorAll("input[type=radio]");
          for (let i = 1; i < radioInputs.length; i++) {
            radioInputs[i].parentNode.remove(); // Remove the parent element of the radio input
          }
        }

        // If variant group type is select, remove all options except the first one
        if (variantGroup.variantGroupType === "select") {
          const selectOptions = variantOptionDesignParent.querySelectorAll("option");
          for (let i = 1; i < selectOptions.length; i++) {
            selectOptions[i].remove();
          }
        }
      });

      // Reset variantSelectionCompleteProduct, variantItems, and variantGroups
      variantSelectionCompleteProduct = [];
      variantItems = { serialized: {}, array: [] };
      variantGroups = [];
    }

    function addPrice() {
      //--- Product doesn't have variants or it's just 1---
      if (variantItems.array.length === 1) {
      const variantPrice = variantItems.array[0].price;
      if (priceElement) {
        priceElement.textContent = moneyFormat(
          config.defaultLocale,
          config.defaultCurrency,
          variantPrice
        );
        priceElement.classList.remove("w-dyn-bind-empty");
      }
      if (priceAddToCart) {
        priceAddToCart.value = parseFloat(variantPrice);
      }
    } 
    
    if(!variantItems.array.length){
      // Case: no variants—try to use the priceElement's existing text, if valid.
      if (priceElement && priceElement.textContent) {
        const numericPrice = Number(priceElement.textContent);
        if (!isNaN(numericPrice)) {
          priceElement.textContent = moneyFormat(
            config.defaultLocale,
            config.defaultCurrency,
            numericPrice
          );
          priceElement.classList.remove("w-dyn-bind-empty");
        } else {
          // No valid price to display.
          priceElement.textContent = "";
          priceElement.classList.add("w-dyn-bind-empty");
        }
      }
      return;
    }

      //--- Product has variants---
      if (variantItems.array.length > 1) {
        // Variants that affect price
        const sortedPrices = variantItems.array
          .map(variant => Number(variant.price))
          .sort((a, b) => a - b);

        if (sortedPrices[0] !== sortedPrices[sortedPrices.length - 1]) {
          if (config.priceDisplay === "low") {
            if (priceElement)
              priceElement.textContent = moneyFormat(
                config.defaultLocale,
                config.defaultCurrency,
                sortedPrices[0]
              );
            priceElement?.classList.remove("w-dyn-bind-empty");
            return;
          }
          if (config.priceDisplay === "high") {
            if (priceElement)
              priceElement.textContent = moneyFormat(
                config.defaultLocale,
                config.defaultCurrency,
                sortedPrices[sortedPrices.length - 1]
              );
            priceElement?.classList.remove("w-dyn-bind-empty");
            return;
          }

          const priceText = `${moneyFormat(
            config.defaultLocale,
            config.defaultCurrency,
            sortedPrices[0]
          )}–${moneyFormat(
            config.defaultLocale,
            config.defaultCurrency,
            sortedPrices[sortedPrices.length - 1]
          )}`;
          if (priceElement) priceElement.textContent = priceText;
          priceElement?.classList.remove("w-dyn-bind-empty");
        } else {
          // Variants that don't affect price
          const price = moneyFormat(config.defaultLocale, config.defaultCurrency, sortedPrices[0]);
          // if priceElement exists, update it
          priceElement?.classList.remove("w-dyn-bind-empty");
          if (priceElement) priceElement.textContent = price;
          if (priceAddToCart) priceAddToCart.value = parseFloat(sortedPrices[0]);
        }
      }
    }

    function setInventory(isVariantsSelectionDone) {
      // Variant selection complete
      if (isVariantsSelectionDone) {
        // return early if inventory control is disabled
        if (!config.inventoryControl) return;

        const quantity = quantityElement?.value ?? 1;
        const submitButton = foxyForm.querySelector("input[type=submit]");
        const inventory =
          variantItems.array.length === 1
            ? variantItems.array[0]?.inventory
            : variantSelectionCompleteProduct?.inventory;

        if (Number(quantity) > Number(inventory)) {
          quantityElement.value = 1;
        }

        if (inventoryElement) {
          // Update inventory element if ti exists
          if (inventory === undefined) {
            inventoryElement.textContent = "0";
            submitButton.disabled = true;
            submitButton.classList.add(disableClass);
            return;
          }

          if (Number(quantity) <= Number(inventory)) {
            inventoryElement.textContent = inventory;
            submitButton.disabled = false;
            submitButton.classList.remove(disableClass);
            return;
          }
        }
        return;
      }

      // First render or variant selection not complete
      if (variantItems.array.length === 1) {
        if (config.inventoryControl)
          addToCartQuantityMax.value = variantItems.array[0]?.inventory ?? 0;
        return;
      }

      if (variantItems.array.length > 1) {
        if (inventoryElement) {
          inventoryElement.textContent = config.inventoryDefaultLabel;
          inventoryElement.classList.remove("w-dyn-bind-empty");
        }
        return;
      }
    }

    function handleVariantSelection(e) {
      const targetElement = e.target;
      const currentVariantSelection = targetElement.value;
      if (!currentVariantSelection) return;

      if (!targetElement.closest(`div[foxy-variant-group]`)) return;

      const variantSelectionGroup = sanitize(targetElement.getAttribute("foxy-variant-group-name"));

      removeDisabledStyleVariantGroupOptions(targetElement, false);

      updateVariantOptions(variantSelectionGroup, currentVariantSelection, targetElement);

      const selectedProductVariants = getSelectedVariantOptions();
      const finalAvailable = getAvailableProductsPerVariantSelection(selectedProductVariants);
      updateProductInfo(finalAvailable, selectedProductVariants);
    }

    function removeDisabledStyleVariantGroupOptions(currentVariantSelectionElement, resetChoices) {
      const { nodeName } = currentVariantSelectionElement;
      // Remove disabled class from current selections
      // if resetChoices then this removal is coming from a variant options update with variantGroupsStateChange
      if (nodeName === "INPUT") {
        currentVariantSelectionElement.parentElement.classList.remove(disableClass);

        if (resetChoices) {
          const variantGroupContainer = currentVariantSelectionElement.closest(
            `[${foxy_variant_group}]`
          );
          variantGroupContainer
            .querySelectorAll(`.${disableClass}`)
            .forEach(input => input.classList.remove(disableClass));
        }
      } else if (nodeName === "SELECT") {
        currentVariantSelectionElement
          .querySelectorAll(`select option.${disableOptionClass}`)
          .forEach(option => {
            option.classList.remove(disableOptionClass);
            // Get the option textContent split it by the unavailable text and remove it
            const unavailableText = ` (${config.selectUnavailableLabel})`;
            const optionText = option.textContent.split(unavailableText)[0];
            option.textContent = optionText;
          });
      }
    }

    function getSelectedVariantOptions() {
      // Save the selected product variants
      const selectedProductVariants = {};
      foxyForm
        .querySelectorAll(
          `div[${foxy_variant_group}] input:checked, div[${foxy_variant_group}] select[required]:valid option:checked,div[${foxy_variant_group}] option:checked`
        )
        .forEach(variant => {
          // If option selected is default option.value === "", return early
          if (!variant.value) return;
          if (variant.nodeName === "OPTION") {
            selectedProductVariants[
              sanitize(variant.parentElement.getAttribute(foxy_variant_group_name))
            ] = variant.value;
            return;
          }
          selectedProductVariants[sanitize(variant.getAttribute(foxy_variant_group_name))] =
            variant.value;
        });
      return selectedProductVariants;
    }

  function getAvailableProductsPerVariantSelection(selectedProductVariants, restrictedMatch = false) {

    const ifIsInventoryControlEnabled = inventory =>
      config.inventoryControl ? Number(inventory) > 0 : true;

    const userHasChosenAllGroups = isVariantsSelectionComplete();

    const chosenKeys = Object.keys(selectedProductVariants).filter(key => {
      const val = selectedProductVariants[key];
      return val !== undefined && val !== "";
    });

    if (userHasChosenAllGroups && !restrictedMatch) {
      return variantItems.array.filter(variant => {
        // If inventoryControl is on, skip zero or negative
        return ifIsInventoryControlEnabled(variant.inventory);
      });
    }
    
    return variantItems.array.filter(variant => {
      if (!ifIsInventoryControlEnabled(variant.inventory)) {
        return false;
      }
      for (const key of chosenKeys) {
        if (variant[key] !== selectedProductVariants[key]) {
          return false;
        }
      }
      return true;
    });
  }

    function updateVariantOptions(variantSelectionGroup, currentVariantSelection, currentVariantSelectionElement) {
      const selectedProductVariants = getSelectedVariantOptions();
      const availableProducts = getAvailableProductsPerVariantSelection(selectedProductVariants);
      console.log("selectedProductVariants", selectedProductVariants);
      console.log("availableProducts updateVariantOptions", availableProducts);
      let variantGroupsStateChange = false;

      variantGroups.forEach(group => {
        const { name, variantGroupType, element } = group;
        const currentValue = selectedProductVariants[name] || "";

        // Skip reset for the last selected group
        if (!currentValue || name === variantSelectionGroup) return;

        const availableProducts = getAvailableProductsPerVariantSelection(selectedProductVariants, true);
        const stillValid = availableProducts.some(prod => prod[name] === currentValue);
        console.log( `Checking if "${currentValue}" is still valid for group "${name}": ${stillValid}`);
        if (!stillValid) {
          console.log(`Resetting group "${name}" from "${currentValue}" (now invalid).`);
          selectedProductVariants[name] = "";
          variantGroupsStateChange = true;

          if (variantGroupType === "select") {
            const selectEl = element.querySelector("select");
            if (selectEl) selectEl.selectedIndex = 0;
          } else if (variantGroupType === "radio") {
            const radios = element.querySelectorAll("input[type='radio']");
            radios.forEach(radio => {
              if (radio.checked) {
                radio.checked = false;
                if (radio.parentElement.classList.contains(disableClass)) {
                  radio.parentElement.classList.remove(disableClass);
                }
                if (radio.previousElementSibling) {
                  radio.previousElementSibling.classList.remove("w--redirected-checked");
                }
              }
            });
          }
        }
      });

      let finalSelected = selectedProductVariants;
      let finalAvailable = availableProducts;
      if (variantGroupsStateChange) {
        finalSelected = getSelectedVariantOptions();
        finalAvailable = getAvailableProductsPerVariantSelection(finalSelected);
        console.log("finalAvailable", finalAvailable);
      }

      disableInvalidOptionsAcrossAllGroups(
        finalSelected,
        finalAvailable,
        variantSelectionGroup,
        currentVariantSelection
      );

      if (variantGroupsStateChange && currentVariantSelectionElement) {
        console.log("Some old selection was reset. Removing disabled style from changed element...");
        removeDisabledStyleVariantGroupOptions(currentVariantSelectionElement, true);
      }
    }

    function disableInvalidOptionsAcrossAllGroups(
      selectedProductVariants,
      finalAvailable,
      lastChangedGroup,
      lastChangedValue
    ) {
      variantGroups.forEach(group => {
        const { name, variantGroupType, element } = group;
        const isChangedGroup = name === lastChangedGroup;

        if (variantGroupType === "select") {
          const selectEl = element.querySelector("select");
          if (!selectEl) return;

          const options = Array.from(selectEl.options);
          const unavailableText = config.selectUnavailableLabel
            ? ` (${config.selectUnavailableLabel})`
            : "";

          options.forEach(opt => {
            if (!opt.value) return;

            const candidate = { ...selectedProductVariants, [name]: opt.value };
            const canExist = finalAvailable.some(prod => {
              return Object.entries(candidate).every(([k, val]) => {
                if (!val) return true;
                return prod[k] === val;
              });
            });

            const isLastSelected = isChangedGroup && opt.value === lastChangedValue;

            if (!canExist && !isLastSelected) {
              if (!opt.classList.contains(disableOptionClass)) {
                opt.classList.add(disableOptionClass);
              }
              if (unavailableText && !opt.textContent.includes(unavailableText)) {
                opt.textContent += unavailableText;
              }
            } else {
              if (opt.classList.contains(disableOptionClass)) {
                opt.classList.remove(disableOptionClass);
              }
              if (unavailableText && opt.textContent.includes(unavailableText)) {
                opt.textContent = opt.textContent.replace(unavailableText, "");
              }
            }
          });
        } else if (variantGroupType === "radio") {
          const radios = element.querySelectorAll("input[type='radio']");
          radios.forEach(radio => {
            if (!radio.value) return;
            const candidate = { ...selectedProductVariants, [name]: radio.value };
            const canExist = finalAvailable.some(prod => {
              return Object.entries(candidate).every(([k, val]) => {
                if (!val) return true;
                return prod[k] === val;
              });
            });

            const isLastSelected = isChangedGroup && radio.value === lastChangedValue;

            if (!canExist && !isLastSelected) {
              if (!radio.parentElement.classList.contains(disableClass)) {
                radio.parentElement.classList.add(disableClass);
              }
            } else {
              if (radio.parentElement.classList.contains(disableClass)) {
                radio.parentElement.classList.remove(disableClass);
              }
            }
          });
        }
      });
    }

    function updateProductInfo(availableProductsPerVariant, selectedProductVariants) {
      const isVariantsSelectionDone = isVariantsSelectionComplete();
      if (isVariantsSelectionDone) {
        // Find Selected Product Variant Total Information
        variantSelectionCompleteProduct = availableProductsPerVariant.find(product => {
          let isProduct = [];
          Object.keys(selectedProductVariants).forEach(key => {
            product[key] === selectedProductVariants[key]
              ? isProduct.push(true)
              : isProduct.push(false);
          });
          return isProduct.every(productCheck => productCheck === true);
        });

        // Update Hidden Add to Cart Inputs with Variant Data and
        //DOM customer facing elements with product info
        Object.keys(variantSelectionCompleteProduct).forEach(key => {
          const inputToUpdate = foxyForm.querySelector(`input[type='hidden'][name="${key}"]`);
          if (inputToUpdate) inputToUpdate.value = variantSelectionCompleteProduct[key];

          switch (key) {
            case "inventory":
              if (!config.inventoryControl) {
                break;
              }
              // Update max quantity
              foxyForm.querySelector(`input[name="quantity_max"]`).value =
                variantSelectionCompleteProduct[key];
              // Update max quantity element
              quantityElement?.setAttribute("max", variantSelectionCompleteProduct[key]);
              // Update inventory element
              setInventory(isVariantsSelectionDone);
              break;
            case "price":
              if (priceElement)
                priceElement.textContent = moneyFormat(
                  config.defaultLocale,
                  config.defaultCurrency,
                  variantSelectionCompleteProduct[key]
                );
              break;
            case "image":
              // Remove srcset from primary image element
              imageElement?.setAttribute("srcset", "");
              imageElement?.setAttribute("src", variantSelectionCompleteProduct[key]);
              break;
          }
        });
        return;
      }
      // Not variant selection complete
      addPrice();

      setInventory();
    }

    // Utils

    function isVariantsSelectionComplete() {
      if (foxyForm.querySelectorAll("[foxy-variant-group] [required]:invalid").length === 0) {
        return true;
      }
      return false;
    }

    function moneyFormat(locale, currency, number) {
      const numericValue = parseFloat(number);
      let decimalPlaces = numericValue.toString().includes(".")
        ? numericValue.toString().split(".")[1].length
        : 0;

      const webflowFractionDigits = window?.__WEBFLOW_CURRENCY_SETTINGS?.fractionDigits;

      if (webflowFractionDigits && webflowFractionDigits > decimalPlaces) {
        decimalPlaces = webflowFractionDigits;
      }

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(numericValue);
    }

    function sanitize(string) {
      if (typeof string !== "string") return string;
      return string.trim().toLowerCase();
    }

    function filterEmpty(obj) {
      return Object.entries(obj).reduce((a, [k, v]) => (v ? ((a[k] = v), a) : a), {});
    }

    // Access to methods
    return {
      init,
      setConfig,
    };
  }
  // Function factory to handle several instances
  return {
    setVariantConfig,
  };
})(FC, Weglot);