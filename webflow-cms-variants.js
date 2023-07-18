// Script configuration

const variantGroupSettings = {
  type: "radio", // select or radio this is required
  sortBy: "Price", // Label, Price (or leave blank for default sorting)
  sortOrder: "Ascending", //Ascending or Descending (or leave blank for default sorting)
};

// End Script Configuration

// Constants and variables
const foxyForm = document.querySelector("[fc-form]");
const quantityElement = document.querySelector("[fc-quantity]");
const fc_image = "[fc-image]";
const priceElement = document.querySelector("[fc-price]");
const priceAddToCart = foxyForm.querySelector("input[name='price']");
const addToCartQuantityMax = foxyForm.querySelector("input[name='quantity_max']");
const fc_variant_item = "[fc-variant-item]";
const variantGroupElements = foxyForm.querySelectorAll("[fc-variant-group]");
const variantItems = { serialized: {}, array: [] };
const variantGroups = [];

const isSelect = variantGroupSettings.type === "select";

function init() {
  // Set quantity input defaults
  const quantityInput = foxyForm.querySelector('input[name="quantity"]');
  quantityInput.value = 1;
  quantityInput.setAttribute("min", "1");

  // Remove srcset from primary image element
  document.querySelector(fc_image).setAttribute("srcset", "");
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
  const variantList = document.querySelectorAll(fc_variant_item);

  variantList.forEach(variantItem => {
    const variant = Object.values(variantItem.attributes).reduce((acc, currAttr) => {
      const { name, value } = currAttr;

      if (name.includes("fc-variant") && value) {
        const key = sanitize(name.split("fc-variant-")[1]);
        if (!acc[key]) acc[key === "sku" ? "code" : key] = sanitize(value);
        return acc;
      }
      return acc;
    }, {});
    variantItems.serialized[variant.code] = filterEmpty(variant);
    variantItems.array.push(filterEmpty(variant));
  });
  console.log("variantItems", variantItems);
}

function buildVariantGroupList() {
  // Get variant group names, any custom sort orders if they exist, and their element design, either radio or select
  const variantOptionDesign = isSelect ? ".w-select" : ".w-radio";

  variantGroupElements.forEach(variantGroupElement => {
    const name = sanitize(variantGroupElement.getAttribute("fc-variant-group"));
    const customSortOrder =
      variantGroupElement
        .getAttribute("fc-variant-group-order")
        ?.trim()
        .split(/\s*,\s*/) ?? null;

    const variantGroupOptions = getVariantGroupOptions(name);
    if (variantGroupOptions.length === 0) {
      variantGroupElement.remove();
    } else {
      variantGroups.push({
        element: variantGroupElement,
        name,
        options: variantGroupOptions,
        customSortOrder,
        variantOptionDesign: variantGroupElement.querySelector(variantOptionDesign),
      });
      variantGroupElement.querySelector(variantOptionDesign).remove();
    }
  });
  console.log("variantGroups", variantGroups);
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
  console.log("variantGroupOptions", variantGroupOptions);
  return variantGroupOptions.map(option => option.variantOption);
}

function sortOptions(variantGroupOptions) {
  const { sortBy, sortOrder } = variantGroupSettings;

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

    console.log("variantOptions", variantOptions);

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
    if (isSelect) {
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
      const priceText = `${moneyFormat(sortedPrices[0])}-${moneyFormat(
        sortedPrices[sortedPrices.length - 1]
      )}`;
      priceElement.textContent = priceText;
      priceElement.classList.remove("w-dyn-bind-empty");
    } else {
      // Variants that don't affect price
      const price = moneyFormat(sortedPrices[0]);
      priceElement.textContent = price;
      priceAddToCart.value = price;
    }
  }
}

function setInventory() {
  if (variantItems.array.length === 1) {
    addToCartQuantityMax.value = variantItems.array[0].inventory;
    return;
  }
}

function handleVariantSelection(e) {
  const { name, value } = e.target;
  console.log("handleVariantSelection", e.target);
  const variantSelectionGroup = name;
  const availableProductsPerVariant = [];
  const sanitizedValue = sanitize(value);
  const isVariantsSelectionDone = isVariantsSelectionComplete();

  if (variantSelectionGroup === "quantity" && isVariantsSelectionDone) return; //handleQuantityChange();

  if (isVariantsSelectionDone) {
    // updateProductInfo(availableProductsPerVariant);
  } else {
    // Update variant group options
    const variantGroup = variantGroups.find(variantGroup => variantGroup.name === name);
    // updateVariantOptions(availableProductsPerVariant, variantSelectionGroup);
  }

  // Update price
  addPrice();
}

function updateVariantOptions(availableProductsPerVariant) {}

function updateProductInfo(availableProductsPerVariant) {}

// Utils

function isVariantsSelectionComplete() {
  if (foxyForm.querySelectorAll("[required]:invalid").length === 0) {
    return true;
  }
  return false;
}

function moneyFormat(price) {
  return typeof FC == "object" &&
    FC.hasOwnProperty("json") &&
    FC.json.config.hasOwnProperty("currency_format")
    ? FC.util.money_format(FC.json.config.currency_format, price).trim()
    : price.formatMoney(2);
}

Number.prototype.formatMoney = function (c, d, t) {
  var n = this,
    c = isNaN((c = Math.abs(c))) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = parseInt((n = Math.abs(+n || 0).toFixed(c))) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    s +
    (j ? i.substr(0, j) + t : "") +
    i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
    (c
      ? d +
        Math.abs(n - i)
          .toFixed(c)
          .slice(2)
      : "")
  );
};

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
