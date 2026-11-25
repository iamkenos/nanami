(function registerDandelionWishingTheme() {
  const themeScriptUrl = document.currentScript?.src;
  const registry = window.FullAppDisplayThemeRegistry;
  if (!registry) {
    console.error(
      "[Full App Display] The shared theme registry is unavailable for Dandelion Wishing."
    );
    return;
  }

  registry.register("dandelionwishing", {
    mount(root) {
      const background = document.createElement("div");
      background.className = "dandelionwishing-background";

      const floatingSeeds = document.createElement("div");
      floatingSeeds.className = "dandelionwishing-seeds";
      floatingSeeds.setAttribute("aria-hidden", "true");

      const seedStarts = [
        [10, 12], [45, 16], [80, 14], [25, 26], [60, 30], [90, 28],
        [12, 42], [42, 46], [75, 40], [22, 57], [56, 60], [88, 55],
        [8, 72], [38, 76], [70, 72], [18, 88], [50, 84], [82, 90],
        [30, 18], [68, 22], [15, 62], [48, 68], [78, 58], [92, 80],
      ];
      seedStarts.forEach(([originX, startY], index) => {
        const track = document.createElement("span");
        track.className = "dandelionwishing-seed-track";
        track.style.setProperty("--seed-origin-x", `${originX}vw`);
        track.style.setProperty("--seed-start", `${startY}%`);
        track.style.setProperty("--seed-delay", `${-(index * 2.5)}s`);
        track.style.setProperty("--seed-duration", "30s");
        track.style.setProperty("--seed-drift", `${(index % 7) * 5 - 15}px`);
        track.append(document.createElement("i"));
        floatingSeeds.append(track);
      });

      const seeds = ["one", "two", "three"].map((position) => {
        const seed = document.createElement("div");
        seed.className = `dandelionwishing-seed dandelionwishing-seed--${position}`;
        return seed;
      });

      let displayText = "dandelionwishing";
      const sloth = document.createElement("div");
      sloth.className = "dandelionwishing-sloth";

      if (themeScriptUrl) {
        const slothImage = new Image();
        const extensions = ["png", "svg"];
        let extensionIndex = 0;
        const loadSlothImage = () => {
          const extension = extensions[extensionIndex];
          const imageUrl = new URL(
            `dandelionwishing-sloth.${extension}`,
            themeScriptUrl
          ).href;
          slothImage.onload = () => {
            sloth.dataset.format = extension;
            sloth.style.setProperty(
              "--dandelionwishing-sloth-asset",
              `url("${imageUrl}")`
            );
            sloth.style.setProperty(
              "--dandelionwishing-sloth-aspect-ratio",
              `${slothImage.naturalWidth} / ${slothImage.naturalHeight}`
            );
          };
          slothImage.onerror = () => {
            extensionIndex += 1;
            if (extensionIndex < extensions.length) {
              loadSlothImage();
              return;
            }
            console.error(
              "[Full App Display] Dandelion Wishing sloth artwork could not be loaded as SVG or PNG."
            );
          };
          slothImage.src = imageUrl;
          if (imageUrl.includes("svg")) {
            displayText = "slothyludens";
          }
        };
        loadSlothImage();
      } else {
        console.error(
          "[Full App Display] Could not resolve the Dandelion Wishing asset directory."
        );
      }

      const label = document.createElement("p");
      label.className = "dandelionwishing-sloth-label";
      label.textContent = displayText;
      sloth.append(label);

      root.replaceChildren(background, floatingSeeds, ...seeds, sloth);
      return () => root.replaceChildren();
    },
  });
})();
