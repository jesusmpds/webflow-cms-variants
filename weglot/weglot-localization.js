var default_language = "en";

Weglot.on("languageChanged", function (newLang, prevLang) {
  setFoxyLang(newLang);
});
var FC = FC || {};
var existingOnLoadWeglot = typeof FC.onLoad == "function" ? FC.onLoad : function () {};
FC.onLoad = function () {
  existingOnLoadWeglot();
  FC.client.on("ready.done", function () {
    setFoxyLang();
  });
};
function setFoxyTemplate(lang) {
  lang = lang || Weglot.getCurrentLang();
  if (lang == default_language) {
    lang = "DEFAULT";
  }
  var existing_template_set = FC.json.template_set == "" ? "DEFAULT" : FC.json.template_set;
  if (lang && existing_template_set != lang) {
    FC.client.request("https://" + FC.settings.storedomain + "/cart?template_set=" + lang);
  }
}


<script type="text/javascript" src="https://cdn.weglot.com/weglot.min.js"></script>
<script>
    Weglot.initialize({
        api_key: '',
  		extra_definitions: [
      {
        type: 1, // Type of translation, 1 for text, others: https://developers.weglot.com/api/reference#wordtype
        selector: "[foxy-id=variant-item]", // Selector to find element with attribute
        attribute: "foxy-variant-size" // Name of attribute which is translated
      },
       {
        type: 1, // Type of translation, 1 for text, others: https://developers.weglot.com/api/reference#wordtype
        selector: "[foxy-id=variant-item]", // Selector to find element with attribute
        attribute:"foxy-variant-color" // Name of attribute which is translated
      }
         
   ]
 
    });
</script>