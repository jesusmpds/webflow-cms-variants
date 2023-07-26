# Configuration

## Form

User will add a custom attribute to the form on the Product CMS page with the value:

`fc-form=""`

### Variant Options

Inside of the add to cart form, user will add a div for each variant group and apply the specified data attribute for each variant group, in the format:

`fc-variant-group={{Color}}`

`fc-variant-group={{Size}}`

User will add a hidden Collection List using the referenced variants as the source.

On the Collection Item the user will include a custom attribute: `fc-variant-item=""`, and the corresponding data attributes for each needed variant attribute (ie: label, price, inventory, etc.) with the following format, e.g:

`fc-variant-color= {{Color}}`

`fc-variant-size={{Size}}`

`fc-variant-inventory={{Inventory}}`

Where `{{Color}}` for example is the field data from the product variant.

Inside the Collection Item add a Webflow Image element and connect it to the image from your variant. This is the only variant data that needs to be added this way.

## Variant Group Options Label Sorting

If the user wants to set a specific order for the variant group values of a variant group, add a custom attribute in the format:

`fc-variant-group-order={{Sizes}}`

Sizes being a field on the Product CMS that has a comma separated list of values, e.g:

`"Small,Medium,Large"`

## Image

For image change functionality the main product image needs to have the custom attribute:

`fc-image=""`

## Price

For real time price change on variant selection the price element must have the custom attribute:

`fc-price=""`

## Stock

For stock change functionality the stock element needs to have the custom element:

`fc-stock=""`

## Script Configurations

The script contains `Variant Group Settings` and `Pricing Settings`

Each with it's own variable with different properties.

### Variant Group Settings

- selectOptionDefaultLabel: This is the text label for the default option or placeholder text for any Select fields (or leave blank for default label)
- sortBy: Label or Price values (or leave blank for default sorting)
- sortOrder: Ascending or Descending (or leave blank for default sorting)

### Pricing Settings

- locale: The language used by and regional preference of the user, e.g: "en-US"
- currency: The currency for the price elements on the page, e.g: "USD"
