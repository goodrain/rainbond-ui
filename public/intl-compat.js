(function () {
  if (
    typeof Intl === 'undefined' ||
    !Intl.DateTimeFormat ||
    typeof Intl.DateTimeFormat.supportedLocalesOf === 'function'
  ) {
    return;
  }

  Intl.DateTimeFormat.supportedLocalesOf = function (locales) {
    if (!locales) {
      return [];
    }
    return Array.isArray(locales) ? locales.slice() : [locales];
  };
})();
