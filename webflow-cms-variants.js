// Script configuration
// config
const config = {
  sortBy: "price", // label, price (or leave blank for default sorting)
  sortOrder: "ascending", //ascending or descending (or leave blank for default sorting)
  locale: "en-US", // The language used by and regional preference of the user
  currency: "USD", // The currency for the price elements on the page
  priceElementDisplay: "", //Add "low" or "high". or leave blank for default. The way the price element shows when there are variants that affect price. Default is a range low-high. Here you can set it for only showing the highest or lowest number only on page load.
  inventoryDefaultLabel: "Please choose options", // If using an inventory element, add the text that you want to show when the product has variants, before variant selection is completed. Or leave blank for default.
};

// End Script Configuration

(() => {
  // Constants and variables
  const disableClass = "foxy-disable";
  const disableOptionClass = "foxy-disable-option";
  const foxy_variant_group = "foxy-variant-group";
  const foxy_variant_group_order = "foxy-variant-group-order";
  const foxy_variant_item = "[foxy-variant-item]";
  let variantSelectionCompleteProduct;
  const variantItems = { serialized: {}, array: [] };
  const variantGroups = [];
  const foxyForm = document.querySelector("[foxy-form]");
  const imageElement = document.querySelector("[foxy-image]");
  const quantityElement = foxyForm.querySelector("input[name='quantity']");
  const priceElement = document.querySelector("[foxy-price]");
  const inventoryElement = document.querySelector("[foxy-inventory]");
  const priceAddToCart = foxyForm.querySelector("input[name='price']");
  const addToCartQuantityMax = foxyForm.querySelector("input[name='quantity_max']");
  const variantGroupElements = foxyForm.querySelectorAll(`[${foxy_variant_group}]`);
  const money = moneyFormat(config.locale, config.currency);

  function init() {
    //Insert disabled class styles
    document.head.insertAdjacentHTML(
      "beforeend",
      `<style>
    .${disableClass} {opacity: 0.5 !important; }  
    .${disableOptionClass} {color: #808080 !important; } 
    </style>`
    );
    // Set quantity input defaults
    quantityElement.value = 1;
    quantityElement.setAttribute("min", "1");

    // Build variant list info into variable
    buildVariantList();
    // Build variant group list info into variable
    buildVariantGroupList();
    // Build variant/radio options
    renderVariantGroups();

    addPrice();

    setInventory();

    // Handle selected variants
    foxyForm.addEventListener("change", handleVariantSelection);
  }

  function buildVariantList() {
    const variantList = document.querySelectorAll(foxy_variant_item);

    if (!variantList.length) return;

    variantList.forEach(variantItem => {
      const variant = Object.values(variantItem.attributes).reduce((acc, currAttr) => {
        const { name, value } = currAttr;

        if (name.includes("foxy-variant") && value) {
          const key = sanitize(name.split("foxy-variant-")[1]);
          if (!acc[key]) acc[key === "sku" ? "code" : key] = sanitize(value);
          return acc;
        }
        return acc;
      }, {});

      // Add image to variant data
      variant.image = variantItem.querySelector("img")?.src;

      variantItems.serialized[variant?.code ?? variant.name] = filterEmpty(variant);
      variantItems.array.push(filterEmpty(variant));
    });
    console.log("variantItems", variantItems);
  }

  function buildVariantGroupList() {
    // Get variant group names, any custom sort orders if they exist, and their element design, either radio or select
    variantGroupElements.forEach(variantGroupElement => {
      const name = sanitize(variantGroupElement.getAttribute(foxy_variant_group));
      const customSortOrder =
        variantGroupElement
          .getAttribute(foxy_variant_group_order)
          ?.trim()
          .split(/\s*,\s*/) ?? null;

      const variantGroupType = variantGroupElementsType(variantGroupElement);
      const variantOptionDesign = variantGroupType === "select" ? "select" : ".w-radio";
      const variantGroupOptions = getVariantGroupOptions(name);
      if (variantGroupOptions.length === 0) {
        variantGroupElement.remove();
      } else {
        variantGroups.push({
          customSortOrder,
          element: variantGroupElement,
          options: variantGroupOptions,
          name,
          variantGroupType,
          variantOptionDesign: variantGroupElement.querySelector(variantOptionDesign),
        });
        variantGroupElement.querySelector(variantOptionDesign).remove();
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
      const variantOption = variantItem[groupName];

      // Only add variant option to array if it is not already in the array
      if (
        variantOption &&
        !variantGroupOptions.some(option => option.variantOption === variantOption)
      ) {
        variantGroupOptions.push({
          label: variantItem.label,
          price: variantItem.price,
          variantOption,
        });
      }
    });

    sortOptions(variantGroupOptions);
    return variantGroupOptions.map(option => option.variantOption);
  }

  function sortOptions(variantGroupOptions) {
    const { sortBy, sortOrder } = config;

    const compareFn = (a, b) => {
      if (sortBy === "Price") {
        const priceA = a.price;
        const priceB = b.price;

        return sortOrder === "Descending" ? priceB - priceA : priceA - priceB;
      } else if (sortBy === "Label") {
        const labelA = a.label;
        const labelB = b.label;

        if (sortOrder === "Descending") {
          return labelB.localeCompare(labelA);
        } else if (sortOrder === "Ascending") {
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

        if (sortOrder === "Descending") {
          return labelB.localeCompare(labelA);
        } else if (sortOrder === "Ascending") {
          return labelA.localeCompare(labelB);
        }
        // If sortOrder is not specified, return 0 to maintain original order
        return 0;
      });
    }

    return variantGroupOptions;
  }

  function renderVariantGroups() {
    const addRadioOptions = variantGroup => {
      const { element, name, options, customSortOrder, variantOptionDesign } = variantGroup;
      const variantOptions = customSortOrder ? customSortOrder : options;

      variantOptions.forEach((option, index) => {
        const variantOptionClone = variantOptionDesign.cloneNode(true);
        const radioInput = variantOptionClone.querySelector("input[type=radio]");
        const label = variantOptionClone.querySelector("span[for]");

        label.textContent = capitalizeFirstLetter(option);
        label.setAttribute("for", `${option}-${index}`);

        radioInput.id = `${option}-${index}`;
        radioInput.name = capitalizeFirstLetter(name);
        radioInput.value = capitalizeFirstLetter(option);
        radioInput.required = true;

        // Add radio to variant group container
        element.append(variantOptionClone);
      });
    };
    const addSelectOptions = variantGroup => {
      const { element, name, options, customSortOrder, variantOptionDesign } = variantGroup;

      const variantOptions = customSortOrder ? customSortOrder : options;
      let variantSelect = variantOptionDesign.cloneNode(true);
      variantSelect.required = true;
      variantSelect.name = capitalizeFirstLetter(name);

      variantOptions.forEach(option => {
        const selectOption = capitalizeFirstLetter(option);
        variantSelect.add(new Option(selectOption, selectOption));
      });

      // Add select to variant group container
      element.append(variantSelect);
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

  function addPrice() {
    //--- Product doesn't have variants---
    if (variantItems.array.length === 1) return;

    //--- Product has variants---
    if (variantItems.array.length > 1) {
      // Variants that affect price
      const sortedPrices = variantItems.array
        .map(variant => Number(variant.price))
        .sort((a, b) => a - b);

      if (sortedPrices[0] !== sortedPrices[sortedPrices.length - 1]) {
        if (config.priceElementDisplay === "low") {
          priceElement.textContent = money.format(sortedPrices[0]);
          priceElement?.classList.remove("w-dyn-bind-empty");
          return;
        }
        if (config.priceElementDisplay === "high") {
          priceElement.textContent = money.format(sortedPrices[sortedPrices.length - 1]);
          priceElement?.classList.remove("w-dyn-bind-empty");
          return;
        }

        const priceText = `${money.format(sortedPrices[0])} - ${money.format(
          sortedPrices[sortedPrices.length - 1]
        )}`;
        priceElement.textContent = priceText;
        priceElement?.classList.remove("w-dyn-bind-empty");
      } else {
        // Variants that don't affect price
        const price = money.format(sortedPrices[0]);
        priceElement.textContent = price;
        priceAddToCart.value = price;
      }
    }
  }

  function setInventory(isVariantsSelectionDone) {
    if (isVariantsSelectionDone && inventoryElement) {
      const quantity = quantityElement.value;
      const submitButton = foxyForm.querySelector("input[type=submit]");
      const inventory =
        variantItems.array.length === 1
          ? variantItems.array[0]?.inventory
          : variantSelectionCompleteProduct?.inventory;
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
      return;
    }

    // First render or variant selection not complete
    if (variantItems.array.length === 1) {
      addToCartQuantityMax.value = variantItems.array[0]?.inventory ?? 0;
      return;
    }

    if (variantItems.array.length > 1) {
      if (inventoryElement) {
        inventoryElement.textContent = "Please choose options.";
        inventoryElement.classList.remove("w-dyn-bind-empty");
      }
      return;
    }
  }

  function handleVariantSelection(e) {
    const targetElement = e.target;
    const { name, nodeName, value } = targetElement;
    // Selecting the default select option returns early.
    if (!value) return;

    // Selecting or making a change to a input or select outside a variant group won't work
    if (!targetElement.closest(`div[${foxy_variant_group}]`)) return;

    const variantSelectionGroup = sanitize(name);
    const currentVariantSelection = sanitize(value);
    const isVariantsSelectionDone = isVariantsSelectionComplete();
    if (variantSelectionGroup === "quantity" && isVariantsSelectionDone)
      return setInventory(isVariantsSelectionDone);

    // Remove disabled class from current selection
    if (nodeName === "INPUT") {
      targetElement.parentElement.classList.remove(disableClass);
    } else if (nodeName === "SELECT") {
      targetElement
        .querySelector(`option.${disableOptionClass}`)
        ?.classList.remove(disableOptionClass);
    }

    const selectedProductVariants = getSelectedVariantOptions();

    console.log("selectedProductVariants", selectedProductVariants);

    const availableProductsPerVariant = getAvailableProductsPerVariantSelection(
      currentVariantSelection,
      selectedProductVariants
    );

    console.log("availableProductsPerVariant", availableProductsPerVariant);

    updateVariantOptions(
      availableProductsPerVariant,
      variantSelectionGroup,
      currentVariantSelection
    );
    updateProductInfo(availableProductsPerVariant, selectedProductVariants);
  }

  function getSelectedVariantOptions() {
    // Save the selected product variants
    const selectedProductVariants = {};
    foxyForm
      .querySelectorAll("input:checked, select[required]:valid option:checked, option:checked")
      .forEach(variant => {
        // If option selected is default option.value === "", return early
        if (!variant.value) return;
        if (variant.nodeName === "OPTION") {
          selectedProductVariants[sanitize(variant.parentElement.name)] = sanitize(variant.value);
          return;
        }
        selectedProductVariants[sanitize(variant.name)] = sanitize(variant.value);
      });
    return selectedProductVariants;
  }

  function getAvailableProductsPerVariantSelection(
    currentVariantSelection,
    selectedProductVariants
  ) {
    // More than 1 selected variant
    if (Object.values(selectedProductVariants).length > 1 && !isVariantsSelectionComplete()) {
      return variantItems.array.filter(variant => {
        let isProduct = [];
        Object.keys(selectedProductVariants).forEach(variantOptionKey => {
          variant[variantOptionKey] === selectedProductVariants[variantOptionKey]
            ? isProduct.push(true)
            : isProduct.push(false);
        });
        return (
          isProduct.every(productCheck => productCheck === true) && Number(variant.inventory) > 0
        );
      });
    }
    if (Object.values(selectedProductVariants).length <= 1 || isVariantsSelectionComplete()) {
      // One or none selected variants
      const availableProductsPerVariant = [];
      variantItems.array.forEach(variant => {
        const currentProduct = Object.values(variant);
        if (currentProduct.includes(currentVariantSelection) && Number(variant.inventory) > 0) {
          availableProductsPerVariant.push(variant);
        }
      });
      return availableProductsPerVariant;
    }
  }

  function updateVariantOptions(
    availableProductsPerVariant,
    variantSelectionGroup,
    currentVariantSelection
  ) {
    const otherVariantGroups = variantGroups.filter(
      variantGroup => variantGroup.name !== variantSelectionGroup
    );
    console.log("otherVariantGroups", otherVariantGroups);
    let variantGroupsStateChange = false;

    otherVariantGroups.forEach(otherVariantGroup => {
      const { element, variantGroupType, name, options } = otherVariantGroup;
      console.log("otherVariantGroup", otherVariantGroup);
      const variantGroupName = capitalizeFirstLetter(name);
      // Check if other groups have selections
      const hasSelection = hasVariantSelection(element, variantGroupType);

      const availableProductOptions = availableProductsPerVariant.map(e => e[name]);

      const unavailableOptions = options.filter(value => !availableProductOptions.includes(value));
      console.log("unavailableOptions", unavailableOptions);

      // Disable unavailable options for radio elements or select input elements. capitalize the values to match the DOM
      if (variantGroupType === "radio") {
        //Remove disabled
        element.querySelectorAll(`input[name=${variantGroupName}]`).forEach(input => {
          input.parentElement.classList.remove(disableClass);
        });
        if (unavailableOptions.length !== 0) {
          // Add disabled class to unavailable options
          unavailableOptions.forEach(option => {
            const variantOption = capitalizeFirstLetter(option);
            const radioInput = element.querySelector(`input[value="${variantOption}"]`);
            radioInput.parentElement.classList.add(disableClass);

            // if variant group already has a selection
            if (hasSelection) {
              const unavailableElement = element.querySelector(
                `input[value="${variantOption}"]:checked`
              );
              if (unavailableElement) {
                unavailableElement.checked = false;
                unavailableElement.parentElement.classList.add(disableClass);
                console.log(unavailableElement?.previousElementSibling?.classList);
                unavailableElement?.previousElementSibling?.classList?.remove(
                  "w--redirected-checked"
                );
                variantGroupsStateChange = true;
              }
            }
          });
        }
      } else if (variantGroupType === "select") {
        element.querySelectorAll(`select option.${disableOptionClass}`).forEach(option => {
          option.classList.remove(disableOptionClass);
        });

        if (unavailableOptions.length !== 0) {
          // Add disabled class to unavailable options
          unavailableOptions.forEach(option => {
            const variantOption = capitalizeFirstLetter(option);
            const selectOption = element.querySelector(`select option[value="${variantOption}"]`);
            const selectedOptionValue = element.querySelector("select").selectedOptions[0].value;
            selectOption.classList.add(disableOptionClass);

            // if variant group already has a selection
            if (hasSelection && selectedOptionValue === variantOption) {
              element.querySelector(`select`).selectedIndex = 0;
              variantGroupsStateChange = true;
            }
          });
        }
      }
    });

    // Update variant groups state
    if (variantGroupsStateChange) {
      const selectedProductVariants = getSelectedVariantOptions();

      const availableProductsStateChange = getAvailableProductsPerVariantSelection(
        currentVariantSelection,
        selectedProductVariants
      );
      updateVariantOptions(availableProductsStateChange, variantSelectionGroup);
    }
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
        const inputToUpdate = foxyForm.querySelector(`input[name="${key}"]`);
        if (inputToUpdate) inputToUpdate.value = variantSelectionCompleteProduct[key];

        switch (key) {
          case "inventory":
            // Update max quantity
            foxyForm.querySelector(`input[name="quantity_max"]`).value =
              variantSelectionCompleteProduct[key];
            // Update max quantity element
            quantityElement.setAttribute("max", variantSelectionCompleteProduct[key]);
            // Update inventory element
            setInventory(isVariantsSelectionDone);
            break;
          case "price":
            priceElement.textContent = money.format(variantSelectionCompleteProduct[key]);
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
    if (foxyForm.querySelectorAll("[required]:invalid").length === 0) {
      return true;
    }
    return false;
  }

  function hasVariantSelection(variantGroupElement, variantGroupType) {
    if (variantGroupType === "radio") {
      if (variantGroupElement.querySelectorAll("[required]:checked").length > 0) {
        return true;
      }
      return false;
    }
    if (variantGroupType === "select") {
      if (variantGroupElement.querySelector("select").selectedOptions[0].value) {
        return true;
      }
      return false;
    }
    return false;
  }

  function moneyFormat(locale, currency) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function sanitize(string) {
    return string.trim().toLowerCase();
  }

  function filterEmpty(obj) {
    return Object.entries(obj).reduce((a, [k, v]) => (v ? ((a[k] = v), a) : a), {});
  }

  // Initialization

  init();
})();
