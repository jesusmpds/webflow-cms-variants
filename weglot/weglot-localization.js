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
function setFoxyLang(lang) {
  lang = lang || Weglot.getCurrentLang();
  if (lang == default_language) {
    lang = "DEFAULT";
  }
  var existing_template_set = FC.json.template_set == "" ? "DEFAULT" : FC.json.template_set;
  if (lang && existing_template_set != lang) {
    FC.client.request("https://" + FC.settings.storedomain + "/cart?template_set=" + lang);
  }
}
