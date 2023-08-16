// Foxy Variant Script v1.0.0
const config = {
  sortBy: "price",
  sortOrder: "ascending",
  locale: "en-US",
  currency: "USD",
  priceDisplay: "high",
  inventoryDefaultLabel: "Please choose options",
  selectUnavailableLabel: "Unavailable",
};

(function () {
  // Constants and variables
  const disableClass = "foxy-disable";
  const disableOptionClass = "foxy-disable-option";
  const foxy_variant_group = "foxy-variant-group";
  const foxy_variant_group_order = "foxy-variant-group-order";
  const foxy_variant_item = "[foxy-id='variant-item']";
  const foxy_variant_group_name = "foxy-variant-group-name";
  let variantSelectionCompleteProduct;
  const variantItems = { serialized: {}, array: [] };
  const variantGroups = [];
  const foxyForm = document.querySelector("[foxy-id='form']");
  const imageElement = document.querySelector("[foxy-id='image']");
  const quantityElement = foxyForm.querySelector("input[name='quantity']");
  const priceElement = document.querySelector("[foxy-id='price']");
  const inventoryElement = document.querySelector("[foxy-id='inventory']");
  const priceAddToCart = foxyForm.querySelector("input[name='price']");
  const addToCartQuantityMax = foxyForm.querySelector("input[name='quantity_max']");
  const variantGroupElements = foxyForm.querySelectorAll(`[${foxy_variant_group}]`);

  function init() {
    //Insert disabled class styles
    document.head.insertAdjacentHTML(
      "beforeend",
      `<style>
    .${disableClass} {opacity: 0.5 !important; }  
    .${disableOptionClass} {color: #808080 !important;} 
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
          if (!acc[key]) {
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
    // Get variant group names, any custom sort orders if they exist, and their element design, either radio or select
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
        Object.entries(variantItem).filter(([key, value]) => {
          if (key.includes(`${groupName}-`)) {
            return [key.slice(`${groupName}-`), value];
          }
        })
      );

      // Only add variant option to array if it is not already in the array
      if (
        variantOption &&
        !variantGroupOptions.some(option => option.variantOption === variantOption)
      ) {
        variantGroupOptions.push({
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

        const customInput = variantOptionDesign.querySelector(".w-radio-input");
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
        const selectOption = option;
        variantSelect.add(new Option(selectOption, selectOption));
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
        if (config.priceDisplay === "low") {
          priceElement.textContent = moneyFormat(config.locale, config.currency, sortedPrices[0]);
          priceElement?.classList.remove("w-dyn-bind-empty");
          return;
        }
        if (config.priceDisplay === "high") {
          priceElement.textContent = moneyFormat(
            config.locale,
            config.currency,
            sortedPrices[sortedPrices.length - 1]
          );
          priceElement?.classList.remove("w-dyn-bind-empty");
          return;
        }

        const priceText = `${moneyFormat(
          config.locale,
          config.currency,
          sortedPrices[0]
        )} - ${moneyFormat(config.locale, config.currency, sortedPrices[sortedPrices.length - 1])}`;
        priceElement.textContent = priceText;
        priceElement?.classList.remove("w-dyn-bind-empty");
      } else {
        // Variants that don't affect price
        const price = moneyFormat(config.locale, config.currency, sortedPrices[0]);
        priceElement.textContent = price;
        priceAddToCart.value = price;
      }
    }
  }

  function setInventory(isVariantsSelectionDone) {
    // Variant selection complete
    if (isVariantsSelectionDone) {
      const quantity = quantityElement.value;
      const submitButton = foxyForm.querySelector("input[type=submit]");
      const inventory =
        variantItems.array.length === 1
          ? variantItems.array[0]?.inventory
          : variantSelectionCompleteProduct?.inventory;

      if (inventory == undefined) return;

      if (Number(quantity) > Number(inventory)) {
        quantityElement.value = 1;
      }

      if (inventoryElement) {
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
    const { nodeName, value } = targetElement;
    // Selecting the default select option returns early.
    if (!value) return;

    // Selecting or making a change to a input or select outside a variant group won't work
    if (!targetElement.closest(`div[${foxy_variant_group}]`)) return;

    const variantSelectionGroup = sanitize(targetElement.getAttribute(foxy_variant_group_name));
    const currentVariantSelection = value;

    // Remove disabled class from current selections
    if (nodeName === "INPUT") {
      targetElement.parentElement.classList.remove(disableClass);
    } else if (nodeName === "SELECT") {
      targetElement.querySelectorAll(`select option.${disableOptionClass}`).forEach(option => {
        option.classList.remove(disableOptionClass);

        // Get the option textContent split it by the unavailable text and remove it
        const unavailableText = ` (${config.selectUnavailableLabel})`;
        const optionText = option.textContent.split(unavailableText)[0];
        option.textContent = optionText;
      });
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
      const { editorElementGroupName, element, variantGroupType, name, options } =
        otherVariantGroup;
      console.log("otherVariantGroup", otherVariantGroup);
      const otherVariantGroupName = capitalizeFirstLetter(
        editorElementGroupName ? editorElementGroupName : name
      );
      // Check if other groups have selections
      const hasSelection = hasVariantSelection(element, variantGroupType);

      const availableProductOptions = availableProductsPerVariant.map(e => e[name]);

      const unavailableOptions = options.filter(value => !availableProductOptions.includes(value));
      console.log("unavailableOptions", unavailableOptions);

      // Disable unavailable options for radio elements or select input elements.
      if (variantGroupType === "radio") {
        //Remove disabled
        element.querySelectorAll(`input[name=${otherVariantGroupName}]`).forEach(input => {
          input.parentElement.classList.remove(disableClass);
        });
        if (unavailableOptions.length !== 0) {
          // Add disabled class to unavailable options
          unavailableOptions.forEach(option => {
            const variantOption = option;
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

          // Get the option textContent split it by the unavailable text and remove it
          const unavailableText = ` (${config.selectUnavailableLabel})`;
          const optionText = option.textContent.split(unavailableText)[0];
          option.textContent = optionText;
        });

        if (unavailableOptions.length !== 0) {
          // Add disabled class to unavailable options and unavailable text from config
          unavailableOptions.forEach(option => {
            const selectOption = element.querySelector(`select option[value="${option}"]`);
            const selectedOptionValue = element.querySelector("select").selectedOptions[0].value;
            selectOption.classList.add(disableOptionClass);
            if (config.selectUnavailableLabel) {
              const unavailableText = `(${config.selectUnavailableLabel})`;
              selectOption.textContent = `${selectOption.textContent} ${unavailableText}`;
            }

            // if variant group already has a selection
            if (hasSelection && selectedOptionValue === option) {
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
            priceElement.textContent = moneyFormat(
              config.locale,
              config.currency,
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

  function moneyFormat(locale, currency, number) {
    const numericValue = parseFloat(number);
    const decimalPlaces = numericValue.toString().includes(".")
      ? numericValue.toString().split(".")[1].length
      : 0;

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(numericValue);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function sanitize(string) {
    if (typeof string !== "string") return string;
    return string.trim().toLowerCase();
  }

  function filterEmpty(obj) {
    return Object.entries(obj).reduce((a, [k, v]) => (v ? ((a[k] = v), a) : a), {});
  }

  // Initialization
  init();
})();
