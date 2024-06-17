// patch all methods
seamless.polyfill();

/**
 * Device dpi.
 */
let dpi;

/**
 * slideshow mode controller.
 */
let slideshowController = new function () {

    /*_______________________________________
    |   slideshow config
    */

    /**
     * Index of the currently selected slide.
     */
    let currentSlideIndex = 0;

    /**
     * Ture if slideshow mode is active, false otherwise.
     */
    let isSlideshowMode = false;

    /**
     * True if the portrait mode is enabled, false otherwise.
     */
    let isPortraitMode = false;

    /**
     * True if the slide picker is visible, false otherwise.
     */
    let isSlidePickerVisible = true;

    /**
     * Available page sizes (5 options).
     */
    const fractionalPageSizes = [3, 4, 5, 10, "full"];

    /**
     * Available line spacings (5 options).
     */
    const lineHeights = [1.15, 1.25, 1.35, 1.5, 1.75];

    /*_______________________________________
    |   HTML elements
    */

    /* ------ Page content and slides ------ */

    /**
     * Main with page content.
     */
    let pageContent;

    /**
     * Slides div elements.
     */
    let slides;

    /**
     * Hidden slides div elements.
     */
    let hiddenSlides;

    /* ------ View options ------ */

    let formatOptionsPanel;

    /* ------ Slideshow navigation ------ */

    /**
     * slideshow options panel.
     */
    let slideshowNavigationOptionsPanel;

    /* ------ Toggle buttons ------ */

    let toggleButtons = new Map();

    /* ------ Sliders ------ */

    /**
     * Map of sliders and respective progress bars and icons.
     */
    let sliders = new Map();

    /* ------ Two-options picker ------ */

    /**
     * Map of two-options pickers.
     */
    let twoOptionsPickers = new Map();

    /*_______________________________________
    |   Styles
    */

    /**
     * String containing the non selected slide style.
     */
    const nonSelectedSlideStyle = "opacity: 0.5; filter: blur(4px);";

    /**
     * String containing the selected slide style.
     */
    const selectedSlideStyle = "opacity: 1; filter: blur(0);";

    /*_______________________________________
    |   HTML related methods
    */

    // On document content load
    document.addEventListener("DOMContentLoaded", function (e) {
        // Initializes HTML elements and listeners
        initHTMLComponents();

        // Sets the locally stored format options
        setLocallyStoredFontSize();
        setLocallyStoredFontStyle();
        setLocallyStoredTextAlignment();
        setLocallyStoredLineHeight();
        setLocallyStoredPortraitMode();
        setLocallyStoredPageSize();

        // Get the location hash property
        let hash = location.hash;

        // Executes if the hash exists, meaning the slideshow was ongoing
        if (hash) {
            // Sets the current slide to the hash value
            currentSlideIndex = parseInt(hash.substring(1));
            isSlideshowMode = true;
        }

        setLocallyStoredSlidePickerVisibility();
    });

    window.onload = () => {
        setTimeout(() => {
            // Removes the spinning loader
            document.getElementById("loading-container").style.opacity = 0;
            setTimeout(() => {
                document.getElementById("loading-container").remove();
            }, 200);
            // Makes page content visible 
            document.getElementById("page-container").style.visibility = "visible";
            document.getElementById("page-container").style.opacity = 1;
        }, 300);

        if (isSlideshowMode) {
            // Start the slideshow
            toggleSlideshow(true, { timeout: 1000 });
        }

        // Get the device dpi
        dpi = window.devicePixelRatio;
    }

    /**
     * Initializes the HTML elements and their listeners.
     */
    function initHTMLComponents() {
        /* ------ Page content and sliders ------ */

        // Gets the main element with the page content
        pageContent = document.getElementById("page-content");

        // Gets the slide div elements
        slides = [...document.querySelectorAll(".slide:not(.hidden)")];

        // Gets the hidden slide div elements
        hiddenSlides = [...document.querySelectorAll(".slide.hidden")];

        // Gets the slideshow navigation elements
        slideshowNavigationOptionsPanel = document.getElementById("slideshow-navigation-options-panel");

        /* ------ Format options ------ */

        formatOptionsPanel = document.getElementById("format-options-panel");

        /* ------ Format options toggle ------ */

        // Adds the options toggle button
        addToggleButton("options");

        // Expands and shrinks the view options panel on click
        toggleButtons.get("options").button.onclick = () => {
            styleToggleButton("options", !toggleButtons.get("options").status);
            if (toggleButtons.get("options").status) {
                // Expands the view options panel
                toggleFormatOptionsPanel(true);
            } else {
                // Toggles the serif picker if expanded
                if (twoOptionsPickers.get("serif").isPicking) {
                    toggleSerifPicker(twoOptionsPickers.get("serif").isFirstOptionPicked, true);
                }
                // Toggles the text alignment picker if expanded
                if (twoOptionsPickers.get("text-alignment").isPicking) {
                    toggleSerifPicker(twoOptionsPickers.get("text-alignment").isFirstOptionPicked, true);
                }
                // Shrinks the view options panel
                toggleFormatOptionsPanel(false);
            }
        }

        /* ------ Font serif picker ------ */

        addTwoOptionsPicker("serif", "serif", "sans-serif");

        // Toggles the picker when the serif button is clicked
        twoOptionsPickers.get("serif").firstButton.onclick = () => {
            toggleSerifPicker(true);
        }

        // Toggles the picker when the sans serif button is clicked
        twoOptionsPickers.get("serif").secondButton.onclick = () => {
            toggleSerifPicker(false);
        }

        /* ------ Text alignment picker ------ */

        addTwoOptionsPicker("text-alignment", "align-left", "justify");

        // Toggles the picker when the serif button is clicked
        twoOptionsPickers.get("text-alignment").firstButton.onclick = () => {
            toggleTextAlignmentPicker(true);
        }

        // Toggles the picker when the sans serif button is clicked
        twoOptionsPickers.get("text-alignment").secondButton.onclick = () => {
            toggleTextAlignmentPicker(false);
        }

        /* ------ Portrait mode toggle ------ */

        // Adds the portrait mode toggle button
        addToggleButton("portrait");

        toggleButtons.get("portrait").button.onclick = () => {
            // Switches between portrait and non-portrait mode
            setPortraitMode(!isPortraitMode);
            // Saves the portrait mode status as a string
            localStorage.setItem("isPortraitMode", isPortraitMode ? "true" : "false");
        }

        /* ------ Sliders ------ */

        // Adds sliders and related elements to the sliders map
        addSlider("font-size");
        addSlider("line-height");
        addSlider("page-size");
        addSlider("slideshow");

        /* -- Font size slider -- */

        sliders.get("font-size").slider.addEventListener("input", () => {
            // Gets the font size from the slider
            const fontSize = parseInt(sliders.get("font-size").slider.value);
            // Sets the font size
            setFontSize(fontSize);
            // After a certain interval, Scrolls the current slide into view if necessary
            if (isSlideshowMode) centerSlide(1000);
            // Stores the font size in the local storage
            localStorage.setItem("fontSize", fontSize);
        });

        /* -- Line spacing slider -- */

        sliders.get("line-height").slider.addEventListener("input", () => {
            // Gets the line spacing from the slider
            const lineHeightIndex = parseInt(sliders.get("line-height").slider.value);
            // Sets the line spacing
            setLineHeight(lineHeights[lineHeightIndex]);
            // After a certain interval, Scrolls the current slide into view if necessary
            if (isSlideshowMode) centerSlide(500);
            // Stores the line spacing in the local storage
            localStorage.setItem("lineHeight", lineHeights[lineHeightIndex]);
        });

        /* -- Page size slider -- */

        sliders.get("page-size").slider.addEventListener("input", () => {
            if (!isPortraitMode) {
                // Gets the fractional page content size from the slider
                const pageSizeIndex = parseInt(sliders.get("page-size").slider.value);
                // Sets the fractional page size
                setPageSize(fractionalPageSizes[pageSizeIndex]);
                // After a certain interval, Scrolls the current slide into view if necessary
                if (isSlideshowMode) centerSlide(500);
                // Stores the font size in the local storage
                localStorage.setItem("pageSize", fractionalPageSizes[pageSizeIndex]);
            }
        })

        /* -- Slide picker slider -- */

        // Sets max value for the slide picker slider
        sliders.get("slideshow").slider.max = slides.length - 1;

        window.addEventListener("resize", () => {
            // Resizes the slide picker progress bar on window resize.
            resizeSliderProgress("slideshow", currentSlideIndex);
            // Sets the portrait mode if the orientation of the device is vertical
            const isPortrait = window.innerWidth < 1.1 * window.innerHeight;
            localStorage.setItem("isPortraitMode", isPortrait ? "true" : "false");
            setPortraitMode(isPortrait);
            // Centers the slide
            centerSlide(500);
        })

        sliders.get("slideshow").slider.oninput = () => {
            // Gets the font size from the slider
            const slideValue = parseInt(sliders.get("slideshow").slider.value);
            // Goes to the desired slide
            goToSlide(slideValue);
        }

        document.getElementById("slide-number-button").onclick = () => {
            // Hides on displays the slide picker when the slide number button is pressed
            toggleSlidePickerVisibility(!isSlidePickerVisible);
            // Stores the slide picker visibility status
            localStorage.setItem("isSlidePickerVisible", isSlidePickerVisible ? "true" : "false");
        }

        /* -- Common listeners -- */

        // Styles the slide appropriately according to the current status (active/hover/inactive/locked/unlocked)
        sliders.forEach((s) => {
            s.slider.addEventListener("input", () => {
                styleSlider(s, "active");
            })

            s.slider.addEventListener("touchstart", () => {
                styleSlider(s, "active");
            })

            s.slider.addEventListener("mouseover", () => {
                styleSlider(s, "hover");
            })

            s.slider.addEventListener("mouseleave", () => {
                styleSlider(s, "inactive");
            })

            s.slider.addEventListener("change", () => {
                styleSlider(s, "inactive");
            })

            s.slider.addEventListener("touchend", () => {
                styleSlider(s, "inactive");
            })
        })

        /* ------ Slideshow toggle ------ */

        // Adds the slideshow toggle button
        addToggleButton("slideshow");

        toggleButtons.get("slideshow").button.onclick = () => {
            // Starts the slideshow
            toggleSlideshow();
        };

        /* ------ Navigation arrows ------ */

        document.getElementById("next").onclick = () => {
            // Moves to next slide
            nextSlide();
        };

        document.getElementById("previous").onclick = () => {
            // Moves to previous slide
            previousSlide();
        };

        /* ------ Hotkeys ------ */

        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case "KeyS":
                    // Toggles the slideshow on and off
                    toggleSlideshow(!isSlideshowMode);
                    break;
                case "ArrowRight":
                    // Moves to next slide
                    nextSlide();
                    break;
                case "ArrowLeft":
                    // Moves to previous slide
                    previousSlide();
                    break;
                default:
                    break;
            }
        });
    }

    /* ------ Font style ------ */

    /**
     * Sets the locally stored font style.
     */
    function setLocallyStoredFontStyle() {
        // Gets the locally stored font style
        const fontStyle = localStorage.getItem("fontStyle");
        // Sets the locally stored font style if present (otherwise is set to sans serif)
        setFontStyle(fontStyle);
        // Makes the serif button visible if necessary
        if (fontStyle == "serif") {
            // Sans-serif button
            twoOptionsPickers.get("serif").secondButton.style.opacity = 0;
            setTimeout(() => {
                // Serif button
                twoOptionsPickers.get("serif").firstButton.style.opacity = 1;
            }, 100);
        };
    }

    /**
     * Sets the font style (serif/sans-serif).
     * @param {String} fontStyle Can be "serif" or "sans-serif".
     */
    function setFontStyle(fontStyle) {
        // True if serif, false otherwise
        const isSerif = (fontStyle == "serif");
        // Saves the font style status
        twoOptionsPickers.get("serif").isFirstOptionPicked = isSerif;
        if (!isSerif) fontStyle = "sans-serif";
        // Sets the font style
        hidePageContainerTemporarily(() => {
            document.getElementById("page-container").style.fontFamily = "var(--" + fontStyle + "-font)";
        }, 100);
    }

    /* ------ Font size ------ */

    /**
     * Sets the locally stored font size.
     */
    function setLocallyStoredFontSize() {
        // Gets the locally stored font size if present
        const fontSize = localStorage.getItem("fontSize");
        // Sets the locally stored font size if present (otherwise is set to default)
        setFontSize(fontSize === null ?
            getCssVariable("default-font-size", { format: "int" }) :
            parseInt(fontSize)
        );
    }

    /**
     * Sets the font size.
     * @param {Number} fontSize 
     */
    function setFontSize(fontSize) {
        // Constrains the font size
        fontSize = constrain(
            fontSize,
            getCssVariable("min-font-size", { format: "int" }),
            getCssVariable("max-font-size", { format: "int" })
        )
        // Sets the font size
        pageContent.style = "font-size: " + fontSize + "pt";
        // Changes the font size slider value if necessary
        sliders.get("font-size").slider.value = fontSize;
        // Resizes the progress bar for the font size slider
        resizeSliderProgress("font-size", fontSize);
    }

    /* ------ Text alignment ------ */

    /**
     * Sets the text alignment for all paragraphs.
     * @param {String} textAlignment Can be "align-left" or "justify".
     */
    function setTextAlignment(textAlignment) {
        // True if aligned left, false if justified
        const isAlignedLeft = (textAlignment == "align-left");
        // Saves the text alignment status
        twoOptionsPickers.get("text-alignment").isFirstOptionPicked = isAlignedLeft;
        // Sets the desired text alignment for all paragraphs
        hidePageContainerTemporarily(() => {
            document.querySelectorAll("p").forEach((paragraph) => {
                paragraph.style.textAlign = isAlignedLeft ? "left" : "justify";
                // paragraph.style.hyphen = isAlignedLeft ? "none" : "auto";
            });
        }, 100);
    }

    /**
     * Sets the locally stored text alignment.
     */
    function setLocallyStoredTextAlignment() {
        // Gets the locally stored text alignment if present
        const textAlignment = localStorage.getItem("textAlignment");
        // Sets the locally stored text alignment if present (otherwise is set to align left by default)
        setTextAlignment(textAlignment == "justify" ? textAlignment : "align-left");
        // Makes the align-left button visible if necessary
        twoOptionsPickers.get("text-alignment").secondButton.style.opacity = (textAlignment == "justify") ? "1" : "0";
        twoOptionsPickers.get("text-alignment").firstButton.style.opacity = (textAlignment == "justify") ? "0" : "1";
    }

    /* ------ Line height ------ */

    /**
     * Sets the locally stored page line height.
     */
    function setLocallyStoredLineHeight() {
        // Gets the locally stored line spacing if present
        const lineHeight = localStorage.getItem("lineHeight");
        // Sets the locally stored line spacing if present (otherwise is set to default)
        setLineHeight(lineHeight == null ?
            getCssVariable("default-line-height", { format: "float" }) :
            parseFloat(lineHeight)
        );
    }

    /**
     * Sets the line spacing.
     * @param {Number} lineHeight Line spacing.
     */
    function setLineHeight(lineHeight) {
        // Sets the line spacing
        document.querySelectorAll("p").forEach((paragraph) => {
            paragraph.style.lineHeight = lineHeight;
        });
        // Resizes the progress bar for the line spacing
        resizeSliderProgress("line-height", lineHeights.indexOf(lineHeight));
    }

    /* ------ Portrait mode ------ */

    /**
     * Sets the locally stored portrait mode.
     */
    function setLocallyStoredPortraitMode() {
        // Sets the locally stored portrait mode if present (otherwise it's displayed by default)
        setPortraitMode((localStorage.getItem("isPortraitMode") == "true"));
    }

    /**
     * Sets the portrait or non-portrait mode
     * @param {Boolean} portraitMode True if portrait mode is activated, false otherwise
     */
    function setPortraitMode(portraitMode) {
        // Sets the portrait mode status
        isPortraitMode = portraitMode;

        // Sets the button status
        toggleButtons.get("portrait").status = isPortraitMode;

        // Rotates the icon
        toggleButtons.get("portrait").icon.style.transform = isPortraitMode ? "rotate(0)" : "rotate(90deg)";

        // Styles the page size slider and the page container
        hidePageContainerTemporarily(() => {
            if (isPortraitMode) {
                // Removes the grid template
                document.getElementById("page-container").style.gridTemplateColumns = "none";
                // Sets the padding as large
                pageContent.style.padding = "var(--small-page-padding)";
                // Locks the page size slider
                styleSlider(sliders.get("page-size"), "locked");
                sliders.get("page-size").base.style.cursor = "default";
            } else {
                // Resets the grid template
                setLocallyStoredPageSize();
                // Unlocks the page size slider (status bust be changed first, or style can't be changed)
                sliders.get("page-size").status = "unlocked";
                styleSlider(sliders.get("page-size"), "inactive");
                sliders.get("page-size").base.style.cursor = "pointer";
            }
        }, 200);
    }

    /* ------ Page size ------ */

    /**
     * Sets the locally stored page size.
     */
    function setLocallyStoredPageSize() {
        // Gets the locally stored page size if present
        const pageSize = localStorage.getItem("pageSize")
        // Sets the locally stored page size if present
        setPageSize(pageSize === null ? 4 : pageSize);
    }

    /**
     * Sets the fractional size for the page.
     * @param {Number} fractionalPageSize Fractional size of the page content;
     */
    function setPageSize(fractionalPageSize) {
        if (fractionalPageSize == "full") {
            // Sets the font size
            document.getElementById("page-container").style.gridTemplateColumns = "0fr 1fr 0fr";
            pageContent.style.padding = "var(--large-page-padding)";
        } else {
            // Converts to numbers
            fractionalPageSize = parseInt(fractionalPageSize);
            // Sets the font size
            document.getElementById("page-container").style.gridTemplateColumns = "1fr " + fractionalPageSize + "fr 1fr";
            pageContent.style.padding = "var(--small-page-padding)";
        }
        // Resizes the progress bar for the font size slider
        resizeSliderProgress("page-size", fractionalPageSizes.indexOf(fractionalPageSize));
    }

    /* ------ Sliders, buttons, two-options picker ------ */

    /**
     * Adds the toggle button, its icon and its status to the map
     * @param {String} key Key of the toggle button.
     */
    function addToggleButton(key) {
        toggleButtons.set(key, {
            button: document.getElementById(key + "-toggle-button"),
            icon: document.getElementById(key + "-toggle-icon"),
            status: false
        })
    }

    /**
     * Adds the slider, its progress bar, its icon and its status to the map.
     * @param {String} key Key of the slider.
     */
    function addSlider(key) {
        sliders.set(key, {
            base: document.getElementById(key + "-slider-base"),
            slider: document.getElementById(key + "-slider"),
            progress: document.getElementById(key + "-slider-progress"),
            icon: document.getElementById(key + "-slider-icon"),
            status: "inactive",
        })
    }

    /**
     * Adds the two-options picker, composed of a capsule, a selection circle and two buttons.
     * @param {String} key Key of the two-options picker.
     * @param {String} firstOptionKey Key of the first option button.
     * @param {String} secondOptionKey Key of the second option button.
     */
    function addTwoOptionsPicker(key, firstOptionKey, secondOptionKey) {
        twoOptionsPickers.set(key, {
            capsule: document.getElementById(key + "-picker-capsule"),
            selectionCircle: document.getElementById(key + "-picker-selection-circle"),
            firstButton: document.getElementById(firstOptionKey + "-button"),
            secondButton: document.getElementById(secondOptionKey + "-button"),
            isFirstOptionPicked: true,
            isPicking: false
        })
    }

    /* ------ Element styling ------ */

    /**
     * Styles the slider according to its status (active/hover/inactive/locked/unlocked).
     * @param {*} slider Slider.
     * @param {String} status Can be "active", "inactive", "hover", "locked", "unlocked".
     */
    function styleSlider(slider, status) {
        // Executes only if the status has changed
        if (slider.status !== status && slider.status !== "locked") {
            // Changes the status
            slider.status = status;
            // Styles the slider
            slider.progress.style.backgroundColor = "var(--button-" + status + "-color)";
            slider.progress.style.opacity = "var(--button-" + status + "-opacity)";
            slider.icon.style.color = "var(--button-text-" + status + "-color)";
            slider.icon.style.fill = "var(--button-text-" + status + "-color)";
        }
    }

    /**
     * Styles the toggle button and sets its status.
     * @param {String} key Key of the toggle button.
     * @param {*} status Status of the toggle.
     */
    function styleToggleButton(key, status) {
        // Gets the correct toggle button
        const toggleButton = toggleButtons.get(key);
        // Sets the status
        toggleButton.status = status;
        // Styles the button
        toggleButton.button.style = status ?
            "background-color: var(--accent);" : "background-color: var(--light-grey)";
        // Styles the icon
        toggleButton.icon.style = status ?
            "fill: var(--highlight);" : "fill: var(--dark-grey)";
    }

    /* ------ Slider resize ------ */

    /**
     * Resizes the progress bar for the font size slider
     * @param {String} key Key of the slider.
     * @param {Number} value Current slider value.
     */
    function resizeSliderProgress(key, value) {
        // Gets the slider
        const slider = sliders.get(key).slider;
        // Slider min value
        const min = slider.min;
        // Slider max value
        const max = slider.max;
        // Slider width
        const sliderWidth = slider.offsetWidth;
        // Slider height
        const buttonDiameter = getCssVariable("button-diameter", { format: "float" });
        // Computes the progress bar size
        const progressSize = ((value - min) / (max - min) * (sliderWidth - buttonDiameter) + buttonDiameter);

        // Resizes and styles the progress bar for the font size slider
        sliders.get(key).progress.style.width = progressSize + "px";
    }

    /* ------ Format options visibility ------ */

    /**
     * Expands or shrinks the options panel
     * @param {Boolean} isExpanded True if panel must be expanded, false otherwise.
     * @param {Duration} animationDelay Animation delay.
     */
    function toggleFormatOptionsPanel(isExpanded, animationDelay = 150) {
        // Delays the contraction
        setTimeout(() => {
            formatOptionsPanel.style.width = isExpanded ?
                "var(--expanded-format-options-panel-width)" : "var(--format-options-panel-width)";
            formatOptionsPanel.style.height = isExpanded ?
                "var(--expanded-format-options-panel-height)" : "var(--format-options-panel-height)";
            // Displays/hides the options panel groups
            document.getElementById("complete-format-options-panel-group").style.visibility = isExpanded ? "visible" : "hidden";
        }, isExpanded ? 0 : animationDelay);
        // Delays the opacity animation
        setTimeout(() => {
            document.getElementById("complete-format-options-panel-group").style.opacity = isExpanded ? "1" : "0";
        }, isExpanded ? animationDelay : 0);
    }

    /* ------ Two-options picker ------ */

    /**
     * Toggles the serif picker.
     * @param {Boolean} isSerifClicked True if serif is clicked, false otherwise.
     */
    function toggleSerifPicker(isSerifClicked) {
        toggleTwoOptionsPicker("serif", isSerifClicked, {
            panel: formatOptionsPanel,
            shrunkPanelWidth: "var(--expanded-format-options-panel-width)",
            expandedPanelWidth: "var(--extended-format-options-panel-width)",
            otherPickers: [twoOptionsPickers.get("text-alignment")]
        });
        // If an option is picked...
        if (!twoOptionsPickers.get("serif").isPicking) {
            // Sets the font style
            setFontStyle(isSerifClicked ? "serif" : "sans-serif");
            // Stores the font style
            localStorage.setItem("fontStyle", isSerifClicked ? "serif" : "sans-serif");
            // After a certain interval, Scrolls the current slide into view if necessary
            if (isSlideshowMode) centerSlide(500);
        }
    }

    /**
     * Toggles the serif picker.
     * @param {Boolean} isAlignLeftClicked True if serif is clicked, false otherwise.
     */
    function toggleTextAlignmentPicker(isAlignLeftClicked) {
        toggleTwoOptionsPicker("text-alignment", isAlignLeftClicked, {
            panel: formatOptionsPanel,
            shrunkPanelWidth: "var(--expanded-format-options-panel-width)",
            expandedPanelWidth: "var(--extended-format-options-panel-width)",
            otherPickers: [twoOptionsPickers.get("serif")]
        });
        // If an option is picked...
        if (!twoOptionsPickers.get("text-alignment").isPicking) {
            // Sets the alignment
            setTextAlignment(isAlignLeftClicked ? "align-left" : "justify");
            // Stores the alignment
            localStorage.setItem("textAlignment", isAlignLeftClicked ? "align-left" : "justify");
            // After a certain interval, Scrolls the current slide into view if necessary
            if (isSlideshowMode) centerSlide(500);
        }
    }

    /**
     * Toggles the two-options picker.
     * @param {String} key Key of the two-options picker.
     * @param {Boolean} isFirstButtonClicked True if serif is clicked, false otherwise.
     * @param {*} Options Options.
     */
    function toggleTwoOptionsPicker(key, isFirstButtonClicked, options = {
        panel: null,
        shrunkPanelWidth: null,
        expandedPanelWidth: null,
        otherPickers: []
    }) {
        // Gets the two-options picker
        const twoOptionsPicker = twoOptionsPickers.get(key);
        // Sets the picking status
        twoOptionsPicker.isPicking = !twoOptionsPicker.isPicking;

        if (twoOptionsPicker.isPicking) {
            // Expands the toggle if the picker started
            expandTwoOptionsPicker(key);
            // Expands the format options panel
            if (options.panel !== null) options.panel.style.width = options.expandedPanelWidth;
        } else {
            // If the selection was already ongoing...
            // Moves the picker selection circle
            twoOptionsPicker.selectionCircle.style.transform = isFirstButtonClicked ?
                "translateX(calc(-1 * var(--two-options-picker-offset)))" : "translateX(0)";
            // Shrinks the toggle after the selection circle is moved
            setTimeout(() => {
                shrinkTwoOptionsPicker(key, isFirstButtonClicked);

                let isPanelShrinkable = true;
                // If other two-options picker in the same panel are defined...
                if (options.otherPickers !== undefined) {
                    options.otherPickers.some((picker) => {
                        // And if the selection is ongoing
                        if (picker.isPicking) {
                            // The panel is not shrinkable
                            isPanelShrinkable = false;
                            return true;
                        }
                    })
                }

                if (isPanelShrinkable) {
                    // Shrinks the format options panel
                    if (options.panel !== null) options.panel.style.width = options.shrunkPanelWidth;
                }
            }, twoOptionsPicker.isFirstOptionPicked * isFirstButtonClicked == 0 ?
                getCssTimeInMs("general-transition-duration") : 0
            );

            // Sets the value for the boolean flag
            twoOptionsPicker.isFirstOptionPicked = isFirstButtonClicked;
        }
    }

    /**
     * Expands the two-options picker.
     * @param {String} key Key of the two-options picker.
     */
    function expandTwoOptionsPicker(key) {
        // Gets the two-options picker
        const twoOptionsPicker = twoOptionsPickers.get(key);

        // Makes the buttons visible
        twoOptionsPicker.firstButton.style.opacity = 1;
        twoOptionsPicker.secondButton.style.opacity = 1;

        // Expands the toggle
        twoOptionsPicker.firstButton.style.transform = "translateX(calc(-1 * var(--two-options-picker-offset)))";
        twoOptionsPicker.selectionCircle.style.transform = twoOptionsPicker.isFirstOptionPicked ?
            "translateX(calc(-1 * var(--two-options-picker-offset)))" : "transform: translateX(0)";
        twoOptionsPicker.capsule.style.width = "var(--extended-two-options-picker-capsule-width)";
    }

    /**
     * Shrinks the two-options picker.
     * @param {String} key Key of the two-options picker.
     * @param {Boolean} isFirstOptionPicked True if the serif button is visible, false otherwise.
     */
    function shrinkTwoOptionsPicker(key, isFirstOptionPicked) {
        // Gets the two-options picker
        const twoOptionsPicker = twoOptionsPickers.get(key);

        // Hides the serif or sans-serif button
        if (isFirstOptionPicked) {
            twoOptionsPicker.secondButton.style.opacity = 0;
            twoOptionsPicker.secondButton.style.zIndex = "var(--two-options-picker-lower-index)"
            twoOptionsPicker.firstButton.style.zIndex = "var(--two-options-picker-higher-index)"
        } else {
            twoOptionsPicker.firstButton.style.opacity = 0;
            twoOptionsPicker.firstButton.style.zIndex = "var(--two-options-picker-lower-index)"
            twoOptionsPicker.secondButton.style.zIndex = "var(--two-options-picker-higher-index)"
        }

        // Shrinks the toggle and the options panel
        twoOptionsPicker.firstButton.style.transform = "translateX(0)"
        twoOptionsPicker.selectionCircle.style.transform = "translateX(0)"
        twoOptionsPicker.capsule.style.width = "var(--two-options-picker-capsule-width)";
    }

    /* ------ Slide picker visibility ------ */

    /**
     * Sets the slide picker visibility according to the locally stored value.
     */
    function setLocallyStoredSlidePickerVisibility() {
        // Gets the slide picker visibility according to the stored value if present
        const slidePickerVisibility = localStorage.getItem("isSlidePickerVisible");
        // Sets the slide picker visibility according to the stored value if present (visible by default)
        toggleSlidePickerVisibility(slidePickerVisibility == "true" || slidePickerVisibility === null);
    }

    /**
     * Hides or displays the slide picker.
     * @param {Boolean} slidePickerVisibility True if the slide picker is visible, false otherwise.
     */
    function toggleSlidePickerVisibility(slidePickerVisibility) {
        // Sets the slide picker visibility
        isSlidePickerVisible = slidePickerVisibility;

        // Changes the control panel width
        slideshowNavigationOptionsPanel.style.width = isSlidePickerVisible ?
            "var(--slideshow-navigation-width)" : "var(--collapsed-slideshow-navigation-width)";

        // Hides or displays the slide picker
        setTimeout(() => {
            // Waits before changing the opacity if the control panel is expanding
            sliders.get("slideshow").base.style.opacity = isSlidePickerVisible ? "1" : "0";
        }, isSlidePickerVisible ? getCssTimeInMs("general-long-transition-duration") * .9 : 0);

        setTimeout(() => {
            // Waits before setting the visibility to "hidden" if the control panel is collapsing
            sliders.get("slideshow").base.style.visibility = isSlidePickerVisible ? "visible" : "hidden";
        }, isSlidePickerVisible ? 0 : getCssTimeInMs("slider-general-transition-duration"));

        setTimeout(() => {
            // Makes adjustments to the margin of the slide number button to counter the spare gap
            document.getElementById("slide-number-button").style.marginRight = isSlidePickerVisible ?
                "0" : "calc(-1 * var(--options-gap))";
            document.getElementById("slide-number-button").style.marginLeft = isSlidePickerVisible ?
                "calc(-1 * var(--options-small-gap))" : "0";
        }, isSlidePickerVisible ? 50 : getCssTimeInMs("general-long-transition-duration") * 0.75);

        // Resizes the progress bar for the slide picker and readjust the right margin of the slide number button
        if (isSlidePickerVisible) {
            setTimeout(() => {
                resizeSliderProgress("slideshow", currentSlideIndex);
                document.getElementById("slide-number-button").style.marginLeft = "0";
            }, getCssTimeInMs("general-long-transition-duration"));
        }
    }

    /* ------ Slide Number ------ */

    /**
     * Updates and animates the slide number.
     * @param {Number} animationDuration Duration of the animation in ms.
     */
    function updateSlideNumber(animationDuration = 300) {
        // Updates the slide number
        document.getElementById("slide-number").innerText = currentSlideIndex;
        // Animates the slider number
        document.getElementById("slide-number-button").style.animation = "enlarge " + (animationDuration / 1000) + "s ease-in-out 1";
        // Removes the animation (necessary to add the animation again at a later time)
        setTimeout(() => {
            document.getElementById("slide-number-button").style.animation = "none";
        }, animationDuration);
    }

    /* ------ Page visibility ------ */

    /**
     * Temporarily hides the page container to perform an action.
     * @param {Function} action Function to execute while the page container is not visible.
     * @param {Number} hidingDuration Hiding duration in ms.
     */
    function hidePageContainerTemporarily(action, hidingDuration) {
        // Hides the page container
        document.getElementById("page-container").style.opacity = "0";

        // Styles the page size slider and the page container
        setTimeout(() => {
            action();
        }, hidingDuration);
        // Displays the page container
        setTimeout(() => {
            document.getElementById("page-container").style.opacity = "1";
        }, hidingDuration * 2);
    }

    /*_______________________________________
    |   Slideshow related methods
    */

    /**
     * Starts or pauses the slideshow.
     * @param {boolean} isActive Starts if true, pauses otherwise.
     * @param {*} options Toggle slideshow options (timeout).
     */
    function toggleSlideshow(isActive = undefined, options = { timeout: 0 }) {
        isSlideshowMode = isActive !== undefined ? isActive : (isSlideshowMode ? false : true);

        // Sets the opacity of the hidden slides div elements
        hiddenSlides.forEach(slide => {
            slide.style = isSlideshowMode ? nonSelectedSlideStyle : selectedSlideStyle;
        })

        // Shows or hides the options for the slideshow
        slideshowNavigationOptionsPanel.style.opacity = isSlideshowMode ? "1" : "0";
        // Styles the toggle button
        styleToggleButton("slideshow", isSlideshowMode);

        if (isSlideshowMode) {
            // If slideshow mode is active, updates the slides
            updateSlides(options.timeout);

            // Sets the hash as the currently selected slide index
            window.location.hash = currentSlideIndex;
        } else {
            // Lightens all the slides background
            slides.forEach(slide => {
                slide.style = selectedSlideStyle;
            });

            // Deletes the hash
            history.replaceState("", "", location.pathname);
        }
    }

    /**
     * Moves to next slide.
     */
    function nextSlide() {
        // When slideshow mode is active, increases the slide index
        if (isSlideshowMode) {
            // Loops through to first slide if necessary
            if (++currentSlideIndex > slides.length - 1) {
                currentSlideIndex = 0;
            }
            updateSlides();
        }
    }

    /**
     * Moves to previous slide.
     */
    function previousSlide() {
        // When slideshow mode is active, decreases the slide index
        if (isSlideshowMode) {
            // Loops through to last slide if necessary
            if (--currentSlideIndex < 0) {
                currentSlideIndex = slides.length - 1;
            }
            updateSlides();
        }
    }

    /**
     * Goes to the desired slide.
     * @param {Number} index Index of the slide.
     */
    function goToSlide(index) {
        // When slideshow mode is active, goes to the desired slide index
        if (isSlideshowMode) {
            currentSlideIndex = index;
            updateSlides();
        }
    }

    /**
     * Updates the slides.
     * @param {Number} timeout Time in ms to wait before scrolling.
     */
    function updateSlides(timeout) {
        // Sets the hash to the currently selected slide index
        window.location.hash = currentSlideIndex;

        // Lowers the opacity of every slides and blurs them, aside from the currently selected one
        for (let i = 0; i < slides.length; i++) {
            slides[i].style = i == currentSlideIndex ? selectedSlideStyle : nonSelectedSlideStyle;
        }

        // Updates the progress bar
        resizeSliderProgress("slideshow", currentSlideIndex);

        // Updates and animates the slide number
        updateSlideNumber();

        // Scrolls to the correct slide position
        centerSlide(timeout)
    }

    /**
     * Scrolls to the correct slide position, centering the slide.
     * @param {Number} timeout Time in ms to wait before scrolling.
     */
    function centerSlide(timeout = 0) {
        setTimeout(() => {
            slides[currentSlideIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, timeout);

    }

}