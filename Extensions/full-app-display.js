(function FullAppDisplay() {
  if (!FullAppDisplay.extensionUrl && document.currentScript?.src) {
    FullAppDisplay.extensionUrl = document.currentScript.src;
  }

  if (!Spicetify.Keyboard || !Spicetify.React || !Spicetify.ReactDOM) {
    setTimeout(FullAppDisplay, 200);
    return;
  }

  const { React: react, ReactDOM: reactDOM } = Spicetify;
  const { useState, useEffect, useRef } = react;

  const CONFIG = getConfig();
  const themeRegistry =
    window.FullAppDisplayThemeRegistry ||
    (window.FullAppDisplayThemeRegistry = {
      modules: Object.create(null),
      register(themeId, themeModule) {
        if (!themeId || typeof themeModule?.mount !== "function") {
          throw new TypeError("A theme module must provide an id and mount function.");
        }
        this.modules[themeId] = themeModule;
      },
    });
  const themeScriptLoads = new Map();
  let updateVisual;

  const style = document.createElement("style");

  const styleBase = () => `
#full-app-display {
    display: none;
    position: fixed;
    width: 100%;
    height: 100%;
    cursor: default;
    left: 0;
    top: 0;
}
#full-app-display.hide-cursor {
	cursor: none;
}
#fad-header {
    position: fixed;
    width: 100%;
    height: 80px;
    -webkit-app-region: drag;
}
#fad-body {
    height: 100vh;
    color: var(--fad-content-color, var(--spice-text));
    background-color: var(--fad-background-color, var(--spice-player));
}
#fad-theme-artwork {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
}
#fad-foreground {
    position: relative;
    z-index: 2;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(var(--fad-scale));
}
#fad-art-image {
    position: relative;
    width: 100%;
    height: 100%;
    padding-bottom: 100%;
    border-radius: 15px;
    background-size: cover;
}
#fad-art-inner {
    position: absolute;
    left: 3%;
    bottom: 0;
    width: 94%;
    height: 94%;
    z-index: -1;
    backface-visibility: hidden;
    transform: translateZ(0);
    filter: blur(6px);
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}
#fad-art-overlay {
    display: none;
}
#fad-art:hover #fad-art-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    backdrop-filter: none !important;
}
#fad-heart {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: transparent;
    border: 0;
    color: currentColor;
    padding: 0;
    cursor: pointer;
}
#fad-heart svg {
    display: block;
    width: 28px;
    height: 28px;
}
#fad-progress-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    gap: 10px;
}
#fad-progress {
    width: 100%;
    height: 6px;
    border-radius: 6px;
    background-color: color-mix(in srgb, currentColor 30%, transparent);
    flex-grow: 1;
    min-width: 150px;
}
#fad-controls > button:hover > svg {
    fill: currentColor;
}
#fad-controls > button:hover,
#fad-heart:hover {
    color: var(--fad-icon-hover-color, currentColor);
}
#fad-progress:hover #fad-thumb {
    margin-top: -1px;
    visibility: visible;
}
#fad-progress-inner {
    width: var(--progress-width);
    height: 100%;
    border-radius: 6px;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.8);
	  position: relative;
    box-shadow: unset;
    background-color: currentColor;
}
#fad-thumb {
    position: absolute;
    top: -3px;
    right: -6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
    visibility: hidden;
    background-color: currentColor;
}
#fad-background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
}
body.fad-activated #full-app-display {
    display: block
}
.fad-background-fade {
    transition: background-image 1s linear;
}
body.video-full-screen.video-full-screen--hide-ui {
    cursor: auto;
}
#fad-controls button {
    background-color: transparent;
    border: 0;
    color: currentColor;
    padding: 0 5px;
    cursor: pointer;
}
#fad-controls button svg {
    vertical-align: middle;
}
#fad-elapsed, #fad-duration {
    font-variant-numeric: tabular-nums;
}
#fad-artist svg, #fad-album svg, #fad-release-date svg {
    display: inline-block;
}
::-webkit-scrollbar {
    width: 8px;
}
`;

  const styleChoices = [
    `
#fad-foreground {
    flex-direction: row;
    text-align: left;
}
#fad-art {
    width: calc(100vw - 840px);
    min-width: 200px;
    max-width: 340px;
}
#fad-details {
    padding-left: 50px;
    line-height: initial;
    max-width: 70%;
}
#fad-title {
    font-size: 87px;
    font-weight: var(--glue-font-weight-black);
}
#fad-artist, #fad-album, #fad-release-date {
    font-size: 54px;
    font-weight: var(--glue-font-weight-medium);
}
#fad-artist svg, #fad-album svg, #fad-release-date svg {
    margin-right: 5px;
}
#fad-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
#fad-status.active {
    margin-top: 20px;
}
#fad-controls {
    display: flex;
    margin: 0 auto;
}`,
    `
#fad-art {
    width: calc(100vh - 400px);
    max-width: 340px;
}
#fad-foreground {
    flex-direction: column;
    text-align: center;
}
#fad-details {
    margin-top: 20px;
    padding-top: 50px;
    line-height: initial;
    max-width: 70%;
}
#fad-title {
    font-size: 54px;
    font-weight: var(--glue-font-weight-black);
}
#fad-artist, #fad-album, #fad-release-date {
    font-size: 33px;
    font-weight: var(--glue-font-weight-medium);
}
#fad-artist svg, #fad-album svg, #fad-release-date svg {
    width: 25px;
    height: 25px;
    margin-right: 5px;
}
#fad-status {
    display: flex;
    min-width: min(400px, 90vw);
    max-width: min(400px, 90vw);
    align-items: center;
    flex-direction: column;
}
#fad-status.active {
    margin: 20px auto 0;
}
#fad-controls {
    margin-top: 20px;
    order: 2
}
#fad-progress-container {
    width: 100%;
}`,
  ];

  const lyricsPlusBase = `
#fad-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
}
#fad-foreground {
    padding: 0 50px 0 100px;
    width: 50vw;
}
#fad-lyrics-plus-container {
    position: relative;
    width: 50vw;
}
`;
  const lyricsPlusStyleChoices = [
    `
#fad-title {
    font-size: 54px;
}
#fad-art {
    max-width: 210px;
}`,
    "",
  ];

  updateStyle();

  const DisplayIcon = ({ icon, size, style = {} }) => {
    return react.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "currentColor",
      style,
      dangerouslySetInnerHTML: {
        __html: icon,
      },
    });
  };

  const HeartIcon = ({ liked }) =>
    react.createElement(
      "svg",
      {
        viewBox: "-0.25 0 24.5 24.5",
        width: 28,
        height: 28,
        fill: "currentColor",
        "aria-hidden": true,
      },
      liked &&
        react.createElement("path", {
          d: "M12,22.75 C11.8498702,22.7515167 11.7030217,22.7060636 11.58,22.62 C11.26,22.41 3.78999996,17.35 1.33999995,12.86 C-0.120000051,10.18 -0.450000053,6.39999998 2.08999996,3.99999997 C4.57644544,1.69049757 8.42355452,1.69049757 10.91,3.99999997 L12,4.99999997 L13.08,3.99999997 C15.5664455,1.69049757 19.4135546,1.69049757 21.9,3.99999997 C24.4400001,6.40999998 24.11,10.19 22.65,12.87 C20.2,17.36 12.75,22.42 12.43,22.63 C12.3030009,22.7145484 12.1524272,22.756569 12,22.75 Z",
        }),
      react.createElement("path", {
        fillRule: "evenodd",
        d: "M12,22.75 C11.8498702,22.7515167 11.7030217,22.7060636 11.58,22.62 C11.26,22.41 3.78999996,17.35 1.33999995,12.86 C-0.120000051,10.18 -0.450000053,6.39999998 2.08999996,3.99999997 C4.57644544,1.69049757 8.42355452,1.69049757 10.91,3.99999997 L12,4.99999997 L13.08,3.99999997 C15.5664455,1.69049757 19.4135546,1.69049757 21.9,3.99999997 C24.4400001,6.40999998 24.11,10.19 22.65,12.87 C20.2,17.36 12.75,22.42 12.43,22.63 C12.3030009,22.7145484 12.1524272,22.756569 12,22.75 Z M6.49999998,3.74991869 C5.24918643,3.7427924 4.04316499,4.21518062 3.12999996,5.06999997 C1.12999995,6.93999998 1.46999996,9.96999999 2.65999996,12.14 C4.65999997,15.73 10.39,19.96 12,21.14 C13.6,20 19.36,15.78 21.32,12.19 C22.6,9.84999999 22.86,6.50999998 20.32,4.69999997 C18.3515073,3.3719103 15.7249427,3.58802004 14,5.21999997 L13.12,6.05999998 L14.57,7.45999998 L14.22,7.81999998 C13.8299626,8.20772358 13.2000375,8.20772358 12.81,7.81999998 L9.86999999,5.06999997 C8.95683497,4.21518062 7.75081353,3.7427924 6.49999998,3.74991869 Z",
      })
    );

  const SubInfo = ({ text, id, icon }) => {
    return react.createElement(
      "div",
      {
        id,
      },
      CONFIG.icons && react.createElement(DisplayIcon, { icon, size: 35 }),
      react.createElement("span", null, text)
    );
  };

  const ButtonIcon = ({ icon, onClick }) => {
    return react.createElement(
      "button",
      {
        onClick,
      },
      react.createElement(DisplayIcon, { icon, size: 20 })
    );
  };

  const ProgressBar = () => {
    const [progress, setProgress] = useState(Spicetify.Player.getProgress());
    const duration = Spicetify.Platform.PlayerAPI._state.duration;

    const progressDivRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      if (isDragging) {
        return;
      }

      const update = ({ data }) => setProgress(data);
      Spicetify.Player.addEventListener("onprogress", update);
      return () => Spicetify.Player.removeEventListener("onprogress", update);
    }, [isDragging]);

    // Handle click on progress bar to set progress
    const handleClick = (e) => {
      const container = progressDivRef.current;
      if (isDragging || !container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const clickX = e.clientX - containerRect.left;
      const newProgress = (clickX / containerRect.width) * duration;
      Spicetify.Player.seek(newProgress);
      setProgress(newProgress);
    };

    // Handle dragging functionality
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseMove = (e) => {
      const container = progressDivRef.current;
      if (!isDragging || !container) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left;
      const newProgress = (offsetX / containerRect.width) * duration;
      setProgress(newProgress);
    };
    const handleMouseUp = () => {
      if (!isDragging) {
        return;
      }

      Spicetify.Player.seek(progress);
      setIsDragging(false);
    };

    // Attach mousemove and mouseup listeners when dragging starts
    useEffect(() => {
      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      } else {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      }

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging]);

    // Calculate the thumb position
    const thumbPosition = (progress / duration) * 100;

    return react.createElement(
      "div",
      { id: "fad-progress-container" },
      react.createElement(
        "span",
        { id: "fad-elapsed" },
        Spicetify.Player.formatTime(progress)
      ),
      react.createElement(
        "div",
        {
          id: "fad-progress",
          ref: progressDivRef,
          onClick: handleClick,
          style: {
            "--progress-width": `${thumbPosition}%`,
          },
        },
        react.createElement(
          "div",
          {
            id: "fad-progress-inner",
          },
          react.createElement("div", {
            id: "fad-thumb",
            onMouseDown: handleMouseDown,
          })
        )
      ),
      react.createElement(
        "span",
        { id: "fad-duration" },
        Spicetify.Player.formatTime(duration)
      )
    );
  };

  const PlayerControls = () => {
    const [value, setValue] = useState(Spicetify.Player.isPlaying());
    useEffect(() => {
      const update = ({ data }) => setValue(!data.isPaused);
      Spicetify.Player.addEventListener("onplaypause", update);
      return () => Spicetify.Player.removeEventListener("onplaypause", update);
    });
    return react.createElement(
      "div",
      { id: "fad-controls" },
      react.createElement(ButtonIcon, {
        icon: Spicetify.SVGIcons["skip-back"],
        onClick: Spicetify.Player.back,
      }),
      react.createElement(ButtonIcon, {
        icon: Spicetify.SVGIcons[value ? "pause" : "play"],
        onClick: Spicetify.Player.togglePlay,
      }),
      react.createElement(ButtonIcon, {
        icon: Spicetify.SVGIcons["skip-forward"],
        onClick: Spicetify.Player.next,
      })
    );
  };

  function formatReleaseDate(releaseDate) {
    const dateParts =
      typeof releaseDate === "string" &&
      /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(
        releaseDate
      );
    if (!dateParts) return "";

    const year = Number(dateParts[1]);
    const month = dateParts[2] ? Number(dateParts[2]) : 1;
    const day = dateParts[3] ? Number(dateParts[3]) : 1;
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
      return "";
    }

    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return "";
    }

    const options = { year: "numeric", timeZone: "UTC" };
    if (dateParts[2]) options.month = "short";
    if (dateParts[3]) options.day = "numeric";
    return date.toLocaleDateString(undefined, options);
  }

  class FAD extends react.Component {
    constructor(props) {
      super(props);

      this.state = {
        title: "",
        artist: "",
        album: "",
        releaseDate: "",
        cover: "",
        heart: Spicetify.Player.getHeart(),
        configOpen: false,
      };
      this.currTrackImg = new Image();
      this.nextTrackImg = new Image();
      this.mousetrap = new Spicetify.Mousetrap();
    }

    async getAlbumDate(uri, metadata) {
      const albumUri = typeof uri === "string" ? uri : uri?.uri || "";
      const id = /^spotify:album:([A-Za-z0-9]+)/.exec(albumUri)?.[1];
      const metadataDate = formatReleaseDate(
        metadata?.album_release_date ??
          metadata?.release_date ??
          metadata?.album_date
      );
      if (!id) {
        if (!metadataDate) {
          console.warn(
            "[Full App Display] Album URI and release-date metadata were unavailable."
          );
        }
        return metadataDate;
      }

      try {
        const albumInfo = await Spicetify.CosmosAsync.get(
          `https://api.spotify.com/v1/albums/${id}`
        );
        const releaseDate = formatReleaseDate(
          albumInfo?.release_date ??
            albumInfo?.album?.release_date ??
            albumInfo?.data?.release_date ??
            albumInfo?.body?.release_date
        );
        if (releaseDate) return releaseDate;
        if (metadataDate) return metadataDate;

        console.warn(
          `[Full App Display] Album response did not contain a valid release date (fields: ${Object.keys(albumInfo || {}).join(", ") || "none"}).`
        );
      } catch (error) {
        console.error(
          "[Full App Display] Failed to retrieve album release date.",
          error
        );
      }

      return metadataDate;
    }

    async fetchInfo() {
      const meta = Spicetify.Player.data.item.metadata;

      // prepare title
      let rawTitle = meta.title;
      if (CONFIG.trimTitle) {
        rawTitle = rawTitle
          .replace(/\(.+?\)/g, "")
          .replace(/\[.+?\]/g, "")
          .replace(/\s\-\s.+?$/, "")
          .replace(/,.+?$/, "")
          .trim();
      }

      // prepare artist
      let artistName;
      if (CONFIG.showAllArtists) {
        artistName = Object.keys(meta)
          .filter((key) => key.startsWith("artist_name"))
          .sort()
          .map((key) => meta[key])
          .join(", ");
      } else {
        artistName = meta.artist_name;
      }

      // prepare release date
      let releaseDate;
      if (CONFIG.showReleaseDate) {
        const albumURI = meta.album_uri;
        releaseDate = await this.getAlbumDate(albumURI, meta);
      }

      // prepare album
      const albumText = meta.album_title || "";
      if (meta.image_xlarge_url === this.currTrackImg.src) {
        this.setState({
          title: rawTitle || "",
          artist: artistName || "",
          album: albumText || "",
          releaseDate: releaseDate || "",
          heart: Spicetify.Player.getHeart(),
        });
        return;
      }

      // TODO: Pre-load next track
      // Wait until next track image is downloaded then update UI text and images
      const previousImg = this.currTrackImg.cloneNode();
      this.currTrackImg.src = meta.image_xlarge_url;
      this.currTrackImg.onload = () => {
        const bgImage = `url("${this.currTrackImg.src}")`;

        this.animateCanvas(previousImg, this.currTrackImg);
        this.setState({
          title: rawTitle || "",
          artist: artistName || "",
          album: albumText || "",
          releaseDate: releaseDate || "",
          cover: bgImage,
          heart: Spicetify.Player.getHeart(),
        });
      };
      this.currTrackImg.onerror = () => {
        // Placeholder
        this.currTrackImg.src =
          "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo=";
      };
    }

    animateCanvas(prevImg, nextImg) {
      const { innerWidth: width, innerHeight: height } = window;
      this.back.width = width;
      this.back.height = height;

      const ctx = this.back.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.filter = "blur(30px) brightness(0.6)";
      const blur = 30;

      const x = -blur * 2;

      let y;
      let dim;

      if (width > height) {
        dim = width;
        y = x - (width - height) / 2;
      } else {
        dim = height;
        y = x;
      }

      const size = dim + 4 * blur;

      if (!CONFIG.enableFade) {
        ctx.globalAlpha = 1;
        ctx.drawImage(nextImg, x, y, size, size);
        return;
      }

      let factor = 0.0;
      const animate = () => {
        ctx.globalAlpha = 1;
        ctx.drawImage(prevImg, x, y, size, size);
        ctx.globalAlpha = Math.sin((Math.PI / 2) * factor);
        ctx.drawImage(nextImg, x, y, size, size);

        if (factor < 1.0) {
          factor += 0.016;
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }

    componentDidMount() {
      this.themeMounted = true;
      this.mountTheme();
      this.updateInfo = this.fetchInfo.bind(this);
      Spicetify.Player.addEventListener("songchange", this.updateInfo);
      this.updateInfo();

      updateVisual = () => {
        updateStyle();
        this.fetchInfo();
      };

      this.onQueueChange = async (queueData) => {
        const queue = queueData.data;
        let nextTrack;
        if (queue.queued.length) {
          nextTrack = queue.queued[0];
        } else {
          nextTrack = queue.nextUp[0];
        }
        this.nextTrackImg.src = nextTrack?.metadata.image_xlarge_url;
      };

      const scaleLimit = { min: 0.1, max: 4, step: 0.05 };
      this.onScaleChange = (event) => {
        if (!event.ctrlKey) return;
        const dir = event.deltaY < 0 ? 1 : -1;
        let temp = (CONFIG.scale || 1) + dir * scaleLimit.step;
        if (temp < scaleLimit.min) {
          temp = scaleLimit.min;
        } else if (temp > scaleLimit.max) {
          temp = scaleLimit.max;
        }
        CONFIG.scale = temp;
        saveConfig();
        updateVisual();
      };

      Spicetify.Platform.PlayerAPI._events.addListener(
        "queue_update",
        this.onQueueChange
      );
      this.mousetrap.bind("esc", () => {
        if (this.state.configOpen) {
          this.setState({ configOpen: false });
        } else {
          deactivate();
        }
      });
      window.dispatchEvent(new Event("fad-request"));
    }

    componentWillUnmount() {
      this.themeMounted = false;
      this.themeCleanup?.();
      Spicetify.Player.removeEventListener("songchange", this.updateInfo);
      Spicetify.Platform.PlayerAPI._events.removeListener(
        "queue_update",
        this.onQueueChange
      );
      this.mousetrap.unbind("esc");
    }

    async mountTheme() {
      const body = document.getElementById("fad-body");
      const themeRoot = this.themeRoot;
      if (!body || !themeRoot) return;

      const computedStyle = getComputedStyle(body);
      const themeId = computedStyle.getPropertyValue("--fad-theme-id").trim();
      const scriptFile = computedStyle
        .getPropertyValue("--fad-theme-script-file")
        .trim();
      if (!themeId && !scriptFile) return;
      if (!themeId || !scriptFile) {
        console.error(
          "[Full App Display] Theme configuration must set both --fad-theme-id and --fad-theme-script-file."
        );
        return;
      }

      try {
        const themeModule = await loadThemeModule(themeId, scriptFile);
        if (!this.themeMounted) return;
        this.themeCleanup = themeModule.mount(themeRoot);
      } catch (error) {
        console.error(
          `[Full App Display] Could not load theme module "${themeId}" (${scriptFile}). ` +
            "Check that the file is in the theme assets directory and reapply the theme.",
          error
        );
      }
    }

    render() {
      return react.createElement(
        "div",
        {
          id: "full-app-display",
          className: "Video VideoPlayer--fullscreen VideoPlayer--landscape",
          onDoubleClick: deactivate,
          onContextMenu: (event) => {
            event.preventDefault();
            this.setState({ configOpen: true });
          },
        },
        react.createElement("canvas", {
          id: "fad-background",
          ref: (el) => {
            this.back = el;
          },
        }),
        react.createElement("div", { id: "fad-header" }),
        react.createElement(
          "div",
          {
            id: "fad-body",
            style: {
              colorScheme: CONFIG.darkMode ? "dark" : "light",
            },
          },
          react.createElement("div", {
            id: "fad-theme-artwork",
            "aria-hidden": true,
            ref: (el) => {
              this.themeRoot = el;
            },
          }),
          this.state.configOpen &&
            react.createElement(ConfigModal, {
              onClose: () => this.setState({ configOpen: false }),
              onVerticalModeChange: () => {
                const foreground = document.getElementById("fad-foreground");
                if (foreground) {
                  foreground.className = CONFIG.vertical
                    ? "fad-vertical"
                    : "fad-horizontal";
                }
                updateStyle();
              },
            }),
          react.createElement(
            "div",
            {
              id: "fad-foreground",
              className: CONFIG.vertical ? "fad-vertical" : "fad-horizontal",
              style: {
                "--fad-scale": CONFIG.scale || 1,
              },
              ref: (el) => {
                if (!el) return;
                el.onmousewheel = this.onScaleChange;
              },
            },
            react.createElement(
              "div",
              { id: "fad-art" },
              react.createElement(
                "div",
                {
                  id: "fad-art-image",
                  className: CONFIG.enableFade && "fad-background-fade",
                  style: {
                    backgroundImage: this.state.cover,
                  },
                },
                react.createElement(
                  "div",
                  {
                    id: "fad-art-overlay",
                  },
                  react.createElement(
                    "button",
                    {
                      id: "fad-heart",
                      "aria-label": this.state.heart
                        ? "Unlike this track"
                        : "Like this track",
                      "aria-pressed": this.state.heart,
                      onClick: () => {
                        Spicetify.Player.toggleHeart();
                        this.setState((state) => ({ heart: !state.heart }));
                      },
                    },
                    react.createElement(HeartIcon, { liked: this.state.heart })
                  )
                ),
                react.createElement("div", {
                  id: "fad-art-inner",
                })
              )
            ),
            react.createElement(
              "div",
              { id: "fad-details" },
              CONFIG.showDetails &&
                react.createElement(
                  "div",
                  { id: "fad-title" },
                  this.state.title
                ),
              CONFIG.showDetails &&
                react.createElement(SubInfo, {
                  id: "fad-artist",
                  text: this.state.artist,
                  icon: Spicetify.SVGIcons.artist,
                }),
              CONFIG.showDetails &&
                (CONFIG.showAlbum || CONFIG.showReleaseDate) &&
                react.createElement(
                  "div",
                  {
                    id: "fad-meta",
                    className:
                      CONFIG.showAlbum && CONFIG.showReleaseDate
                        ? "has-divider"
                        : "",
                  },
                  CONFIG.showAlbum &&
                    react.createElement(SubInfo, {
                      id: "fad-album",
                      text: this.state.album,
                      icon: Spicetify.SVGIcons.album,
                    }),
                  CONFIG.showReleaseDate &&
                    react.createElement(SubInfo, {
                      id: "fad-release-date",
                      text: this.state.releaseDate,
                      icon: Spicetify.SVGIcons.clock,
                    })
                ),
              react.createElement(
                "div",
                {
                  id: "fad-status",
                  className:
                    (CONFIG.enableControl || CONFIG.enableProgress) && "active",
                },
                CONFIG.enableControl &&
                  react.createElement(PlayerControls),
                CONFIG.enableProgress &&
                  react.createElement(ProgressBar)
              )
            )
          ),
          CONFIG.lyricsPlus &&
            react.createElement("div", {
              id: "fad-lyrics-plus-container",
              style: {
                "--lyrics-color-active": "var(--fad-content-color, var(--spice-text))",
                "--lyrics-color-inactive": "color-mix(in srgb, var(--fad-content-color, var(--spice-text)) 30%, transparent)",
              },
            })
        )
      );
    }
  }

  function loadThemeModule(themeId, filename) {
    if (
      !FullAppDisplay.extensionUrl ||
      filename.includes("/") ||
      filename.includes("\\") ||
      filename === "." ||
      filename === ".."
    ) {
      return Promise.reject(
        new Error(`Invalid theme module filename: ${filename || "(empty)"}`)
      );
    }

    const scriptUrl = new URL(
      `../${encodeURIComponent(filename)}`,
      FullAppDisplay.extensionUrl
    ).href;
    const cachedLoad = themeScriptLoads.get(scriptUrl);
    if (cachedLoad) {
      return cachedLoad.then(() => {
        const themeModule = themeRegistry.modules[themeId];
        if (!themeModule) {
          throw new Error(`Theme module did not register "${themeId}".`);
        }
        return themeModule;
      });
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = scriptUrl;
    const load = new Promise((resolve, reject) => {
      script.onload = () => {
        const themeModule = themeRegistry.modules[themeId];
        if (!themeModule) {
          reject(new Error(`Theme module did not register "${themeId}".`));
          return;
        }
        resolve(themeModule);
      };
      script.onerror = () => {
        reject(new Error(`Theme module failed to load from ${scriptUrl}.`));
      };
    });
    themeScriptLoads.set(scriptUrl, load);
    document.head.appendChild(script);
    return load;
  }

  const classes = [
    "video",
    "video-full-screen",
    "video-full-window",
    "video-full-screen--hide-ui",
    "fad-activated",
  ];

  const container = document.createElement("div");
  container.id = "fad-main";
  let lastApp;
  let cursorTimeout;
  let fad;

  async function toggleFullscreen() {
    if (CONFIG.enableFullscreen) {
      await document.documentElement.requestFullscreen();
      toggleCursor(false);
    } else if (document.webkitIsFullScreen) {
      await document.exitFullscreen();
      toggleCursor(true);
    }
  }

  function eventListener() {
    showCursor();
    cursorTimeout = setTimeout(hideCursor, 2000);
  }

  function showCursor() {
    fad.classList.remove("hide-cursor");
    clearTimeout(cursorTimeout);
  }

  function hideCursor() {
    fad.classList.add("hide-cursor");
  }

  function toggleCursor(show = true) {
    fad = document.getElementById("full-app-display");

    if (!fad) {
      setTimeout(toggleCursor, 300, show);
      return;
    }

    if (show) {
      document.removeEventListener("mousemove", eventListener);
      showCursor();
    } else {
      cursorTimeout = setTimeout(hideCursor, 2000);
      document.addEventListener("mousemove", eventListener);
    }
  }

  async function activate() {
    if (!Spicetify.Player.data) return;

    await toggleFullscreen();

    document.body.classList.add(...classes);
    document.body.append(style, container);
    reactDOM.render(react.createElement(FAD), container);

    requestLyricsPlus();
  }

  function deactivate() {
    if (CONFIG.enableFullscreen || document.webkitIsFullScreen) {
      document.exitFullscreen();
    }
    toggleCursor(true);
    document.body.classList.remove(...classes);
    reactDOM.unmountComponentAtNode(container);
    style.remove();
    container.remove();
    window.dispatchEvent(new Event("fad-request"));

    if (lastApp && lastApp !== "/lyrics-plus") {
      Spicetify.Platform.History.push(lastApp);
    }
  }

  function toggleFad() {
    if (document.body.classList.contains("fad-activated")) {
      deactivate();
    } else {
      activate();
    }
  }

  function updateStyle() {
    style.innerHTML =
      styleBase() +
      styleChoices[CONFIG.vertical ? 1 : 0] +
      (checkLyricsPlus() && CONFIG.lyricsPlus
        ? lyricsPlusBase + lyricsPlusStyleChoices[CONFIG.vertical ? 1 : 0]
        : "");
  }

  function checkLyricsPlus() {
    return (
      Spicetify.Config?.custom_apps?.includes("lyrics-plus") ||
      !!document.querySelector("a[href='/lyrics-plus']")
    );
  }

  function requestLyricsPlus() {
    if (CONFIG.lyricsPlus && checkLyricsPlus()) {
      lastApp = Spicetify.Platform.History.location.pathname;
      if (lastApp !== "/lyrics-plus") {
        Spicetify.Platform.History.push("/lyrics-plus");
      }
    }
    window.dispatchEvent(new Event("fad-request"));
  }

  function getConfig() {
    try {
      const parsed = JSON.parse(
        Spicetify.LocalStorage.get("full-app-display-config") || "{}"
      );
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
      throw "";
    } catch {
      Spicetify.LocalStorage.set("full-app-display-config", "{}");
      return {};
    }
  }

  function saveConfig() {
    Spicetify.LocalStorage.set(
      "full-app-display-config",
      JSON.stringify(CONFIG)
    );
  }

  const ConfigItem = ({ name, field, func, disabled = false }) => {
    const [value, setValue] = useState(CONFIG[field]);
    return react.createElement(
      "div",
      { className: "fad-config-row" },
      react.createElement("label", { className: "fad-config-label" }, name),
      react.createElement(
        "div",
        { className: "fad-config-action" },
        react.createElement(
          "button",
          {
            className: `fad-config-switch${value ? "" : " is-disabled"}`,
            disabled,
            onClick: () => {
              const state = !value;
              CONFIG[field] = state;
              setValue(state);
              saveConfig();
              func();
            },
          },
          react.createElement(DisplayIcon, {
            icon: Spicetify.SVGIcons.check,
            size: 16,
          })
        )
      )
    );
  };

  const ConfigModal = ({ onClose, onVerticalModeChange }) => {
    const style = react.createElement("style", {
      dangerouslySetInnerHTML: {
        __html: `
.fad-config-backdrop {
   position: fixed;
   inset: 0;
   z-index: 10000;
   display: flex;
   align-items: center;
   justify-content: center;
   box-sizing: border-box;
   padding: 16px;
   background: rgba(0, 0, 0, .7);
}
.fad-config {
   width: min(420px, 100%);
   max-height: min(80vh, 640px);
    overflow-y: auto;
    box-sizing: border-box;
   padding: 18px 24px;
   border-radius: 12px;
   background: var(--spice-main, #181818);
   color: var(--spice-text, #ffffff);
   box-shadow: 0 12px 48px rgba(0, 0, 0, .45);
}
.fad-config-heading {
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 16px;
   margin-bottom: 12px;
}
.fad-config-title {
   min-width: 0;
   margin: 0;
   color: inherit;
   font-size: 20px;
   line-height: 1.3;
}
.fad-config button.fad-config-close {
   display: flex;
   align-items: center;
   justify-content: center;
   flex: 0 0 32px;
   width: 32px;
   height: 32px;
   padding: 0;
   border: 0;
   border-radius: 50%;
   background: transparent;
   color: inherit;
   cursor: pointer;
   font-size: 24px;
   line-height: 1;
}
.fad-config-row {
   display: grid;
   grid-template-columns: minmax(0, 1fr) 40px;
   align-items: center;
   gap: 16px;
   min-height: 44px;
}
.fad-config-label {
   display: block;
   min-width: 0;
   margin: 0;
   padding-block: 8px;
   text-align: left !important;
   line-height: 1.35;
   overflow-wrap: anywhere;
}
.fad-config-action {
   display: flex;
   align-items: center;
   justify-content: flex-end;
}
.fad-config button.fad-config-switch {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background-color: rgba(var(--spice-rgb-shadow), .7);
    color: var(--spice-text);
    cursor: pointer;
}
.fad-config button.fad-config-switch.is-disabled,
.fad-config button.fad-config-switch[disabled] {
    color: rgba(var(--spice-rgb-text), .3);
}
`,
      },
    });
    return react.createElement(
      "div",
      {
        className: "fad-config-backdrop",
        onClick: (event) => {
          if (event.target === event.currentTarget) onClose();
        },
        onContextMenu: (event) => {
          event.preventDefault();
          event.stopPropagation();
        },
        onDoubleClick: (event) => event.stopPropagation(),
      },
      react.createElement(
        "section",
        {
          className: "fad-config",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "fad-config-title",
          onClick: (event) => event.stopPropagation(),
          onContextMenu: (event) => {
            event.preventDefault();
            event.stopPropagation();
          },
          onDoubleClick: (event) => event.stopPropagation(),
        },
        style,
        react.createElement(
          "header",
          { className: "fad-config-heading" },
          react.createElement(
            "h2",
            { className: "fad-config-title", id: "fad-config-title" },
            "Full App Display"
          ),
          react.createElement(
            "button",
            {
              type: "button",
              className: "fad-config-close",
              "aria-label": "Close settings",
              onClick: onClose,
            },
            "×"
          )
        ),
        react.createElement(ConfigItem, {
          name: "Dark mode",
          field: "darkMode",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Enable progress bar",
          field: "enableProgress",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Enable controls",
          field: "enableControl",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Trim title",
          field: "trimTitle",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Show details",
          field: "showDetails",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Show album",
          field: "showAlbum",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Show all artists",
          field: "showAllArtists",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Show release date",
          field: "showReleaseDate",
          func: updateVisual,
        }),
        react.createElement(ConfigItem, {
          name: "Vertical mode",
          field: "vertical",
          func: onVerticalModeChange,
        }),
        react.createElement(ConfigItem, {
          name: "Enable fullscreen",
          field: "enableFullscreen",
          func: toggleFullscreen,
        }),
        react.createElement(ConfigItem, {
          name: "Enable song change animation",
          field: "enableFade",
          func: updateVisual,
        })
      )
    );
  };

  // Add activator on top bar
  new Spicetify.Topbar.Button(
    "Full App Display",
    `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.projector}</svg>`,
    activate
  );

  Spicetify.Mousetrap.bind("f11", toggleFad);
})();
