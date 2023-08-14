# Configuration

## Form

User will add a custom attribute to the form on the Product CMS page with the value:

`foxy-id="form"`

### Variant Options

Inside of the add to cart form, user will add a div for each variant group and apply the specified data attribute for each variant group, in the format:

`foxy-variant-group={{Color}}`

`foxy-variant-group={{Size}}`

User will add a hidden Collection List using the referenced variants as the source.

On the Collection Item the user will include a custom attribute: `foxy-id="variant-item"`, and the corresponding data attributes for each needed variant attribute (ie: label, price, inventory, etc.) with the following format, e.g:

`foxy-variant-color= {{Color}}`

`foxy-variant-size={{Size}}`

`foxy-variant-inventory={{Inventory}}`

Where `{{Color}}` for example is the field data from the product variant.

Inside the Collection Item add a Webflow Image element and connect it to the image from your variant. This is the only variant data that needs to be added this way.

## Variant Group Options Label Sorting

If the user wants to set a specific order for the variant group values of a variant group, add a custom attribute in the format:

`foxy-variant-group-order={{Sizes}}`

Sizes being a field on the Product CMS that has a comma separated list of values, e.g:

`"Small,Medium,Large"`

## Image

For image change functionality the main product image needs to have the custom attribute:

`foxy-id="image"`

## Price

For real time price change on variant selection the price element must have the custom attribute:

`foxy-id="price"`

## Stock

For stock change functionality the stock element needs to have the custom element:

`foxy-id="inventory"`

## Script Configurations

### Sorting Settings

- sortBy: Label or Price values (or leave blank for default sorting)
- sortOrder: Ascending or Descending (or leave blank for default sorting)

### Pricing Settings

- locale: The language used by and regional preference of the user, e.g: "en-US"
- currency: The currency for the price elements on the page, e.g: "USD"
- priceDisplay: Add "low" or "high". or leave blank for default. The way the price element shows when there are variants that affect price. Default is a range low-high. Here you can set it for only showing the highest or lowest number only on page load.

### Inventory Settings

- inventoryDefaultLabel: If using an inventory element, add the text that you want to show when the product has variants, before variant selection is completed. Or leave blank for default.
