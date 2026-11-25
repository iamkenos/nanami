(function registerModoludensTheme() {
  const themeScriptUrl = document.currentScript?.src;
  const registry = window.FullAppDisplayThemeRegistry;
  if (!registry) {
    console.error(
      "[Full App Display] The shared theme registry is unavailable for Modoludens."
    );
    return;
  }

  registry.register("modoludens", {
    mount(root) {
      const background = document.createElement("div");
      background.className = "modoludens-background";

      const character = document.createElement("div");
      character.className = "modoludens-ludens";

      if (themeScriptUrl) {
        const characterImage = new Image();
        const imageUrl = new URL("modoludens-ludens.svg", themeScriptUrl).href;
        characterImage.onload = () => {
          character.style.setProperty(
            "--modoludens-ludens-mask",
            `url("${imageUrl}")`
          );
        };
        characterImage.onerror = () => {
          console.error(
            "[Full App Display] Modoludens character artwork could not be loaded."
          );
        };
        characterImage.src = imageUrl;
      } else {
        console.error(
          "[Full App Display] Could not resolve the Modoludens asset directory."
        );
      }

      root.replaceChildren(background, character);
      return () => root.replaceChildren();
    },
  });
})();
