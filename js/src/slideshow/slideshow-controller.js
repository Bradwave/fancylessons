// patch all methods
seamless.polyfill();

/**
 * Device dpi.
 */
let dpi = window.devicePixelRatio;

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
     * True if the options panel is visible, false otherwise.
     */
    let isFormatOptionsPanelExpanded = false;

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

        // Init the slideshow and the slide index
        initSlideshow();

        // Sets the visibility of the slide picker
        setLocallyStoredSlidePickerVisibility();
    });

    window.onload = () => {
        // Makes page content visible
        document.getElementById("page-container").classList.add("visible");
        document.getElementById("page-container").classList.remove("hidden");

        setTimeout(() => {
            // Removes the spinning loader
            document.getElementById("loading-container").classList.add("transparent")
            setTimeout(() => {
                document.getElementById("loading-container").remove();
            }, 400);

            // Makes page content visible
            document.getElementById("page-container").classList.remove("transparent");

            // If slideshow mode isn't active
            if (!isSlideshowMode) {
                // Scrolls to stored scroll position
                let scrollPosition = localStorage.getItem("scrollPosition");
                if (scrollPosition) window.scrollTo({ top: scrollPosition, behavior: "smooth" });
            }
        }, 1000);

        if (isSlideshowMode) {
            // Start the slideshow
            toggleSlideshow(true, { timeout: 1500 });
        }
    }

    // Executes before reload
    window.onbeforeunload = function (e) {
        // Stores the current scroll position
        localStorage.setItem("scrollPosition", window.scrollY);
    };

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

        // Styles the slider as inactive
        setDefaultSlidersStyle();

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
        setFontStyle(fontStyle == "serif" ? fontStyle : "sans-serif");
        // Shows and hides the corresponding buttons
        if (fontStyle == "serif") twoOptionsPickers.get("serif").secondButton.classList.add("transparent");
        else twoOptionsPickers.get("serif").firstButton.classList.add("transparent");
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

        // Sets the font style
        hidePageContainerTemporarily(() => {
            document.getElementById("page-container").classList.remove(isSerif ? "sans-serif-font" : "serif-font");
            document.getElementById("page-container").classList.add(fontStyle + "-font");
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
        document.documentElement.style.setProperty("--font-size", fontSize + "pt");
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
            document.documentElement.style.setProperty("--text-alignment", isAlignedLeft ? "left" : "justify");
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

        // Hides or shows the corresponding button
        if (textAlignment == "justify") twoOptionsPickers.get("text-alignment").firstButton.classList.add("transparent");
        else twoOptionsPickers.get("text-alignment").secondButton.classList.add("transparent");
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
        document.documentElement.style.setProperty("--line-height", lineHeight);
        // Resizes the progress bar for the line spacing
        resizeSliderProgress("line-height", lineHeights.indexOf(lineHeight));
    }

    /* ------ Portrait mode ------ */

    /**
     * Sets the locally stored portrait mode.
     */
    function setLocallyStoredPortraitMode() {
        // Portrait mode status is defaulted to false
        let isPortrait = false;
        // Gets the stored value for the portrait mode status
        const storedIsPortraitMode = localStorage.getItem("isPortraitMode");
        // If the stored value for the portrait mode is undefined..
        if (storedIsPortraitMode == undefined) {
            // ...checks the device orientation
            if (window.innerWidth < 1.1 * window.innerHeight) {
                isPortrait = true;
            }
        } else {
            // Otherwise sets the status according to the stored value
            isPortrait = storedIsPortraitMode == "true";
        }
        // Sets the portrait mode
        setPortraitMode(isPortrait);
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
        if (isPortraitMode) {
            toggleButtons.get("portrait").icon.classList.remove("rotated-90deg");
        } else {
            toggleButtons.get("portrait").icon.classList.add("rotated-90deg");

        }

        // Styles the page size slider and the page container
        hidePageContainerTemporarily(() => {
            if (isPortraitMode) {
                // Removes the grid template, by adding the "portrait-mode" class
                document.getElementById("page-container").classList.add("portrait-mode")
                // Sets the padding as large
                pageContent.classList.add("large-padding");
                // Locks the page size slider
                styleSlider(sliders.get("page-size"), "locked");
                // Changes the cursor
                sliders.get("page-size").base.classList.add("default-cursor");
            } else {
                // Removes the "portrait-mode" class
                document.getElementById("page-container").classList.remove("portrait-mode")
                // Resets the grid template
                setLocallyStoredPageSize();
                // Unlocks the page size slider (status bust be changed first, or style can't be changed)
                sliders.get("page-size").status = "unlocked";
                styleSlider(sliders.get("page-size"), "inactive");
                // Changes the cursor
                sliders.get("page-size").base.classList.remove("default-cursor");
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
            // Sets the page container layout, by setting the sidebar and the page size
            document.documentElement.style.setProperty("--sidebar-size", "0fr");
            document.documentElement.style.setProperty("--page-content-size", "1fr");
            // Sets the page content padding to large
            pageContent.classList.add("large-padding");
        } else {
            // Converts to numbers
            fractionalPageSize = parseInt(fractionalPageSize);
            // Sets the page container layout, by setting the sidebar and the page size
            document.documentElement.style.setProperty("--sidebar-size", "1fr");
            document.documentElement.style.setProperty("--page-content-size", fractionalPageSize + "fr");
            // Sets the page content padding to large
            pageContent.classList.remove("large-padding");
        }
        // Resizes the progress bar for the font size slider
        resizeSliderProgress("page-size", fractionalPageSizes.indexOf(fractionalPageSize));
    }

    /* ------ Sliders, buttons, two-options picker ------ */

    /**
     * Adds the toggle button, its icon and its status to the map
     * @param {String} id Id of the toggle button.
     */
    function addToggleButton(id) {
        toggleButtons.set(id, {
            button: document.getElementById(id + "-toggle-button"),
            icon: document.getElementById(id + "-toggle-icon"),
            status: false
        })
    }

    /**
     * Adds the slider, its progress bar, its icon and its status to the map.
     * @param {String} id Id of the slider.
     */
    function addSlider(id) {
        sliders.set(id, {
            base: document.getElementById(id + "-slider-base"),
            slider: document.getElementById(id + "-slider"),
            progress: document.getElementById(id + "-slider-progress"),
            icon: document.getElementById(id + "-slider-icon"),
            status: "inactive",
        })
    }

    /**
     * Adds the two-options picker, composed of a capsule, a selection circle and two buttons.
     * @param {String} id Id of the two-options picker.
     * @param {String} firstOptionId Id of the first option button.
     * @param {String} secondOptionId Id of the second option button.
     */
    function addTwoOptionsPicker(id, firstOptionId, secondOptionId) {
        twoOptionsPickers.set(id, {
            capsule: document.getElementById(id + "-picker-capsule"),
            selectionCircle: document.getElementById(id + "-picker-selection-circle"),
            firstButton: document.getElementById(firstOptionId + "-button"),
            secondButton: document.getElementById(secondOptionId + "-button"),
            isFirstOptionPicked: true,
            isPicking: false
        })
    }

    /* ------ Element styling ------ */

    /**
     * Sets the default slider style ("inactive").
     */
    function setDefaultSlidersStyle() {
        sliders.forEach((s) => {
            s.progress.classList.add("inactive");
            s.progress.classList.add("inactive");
        });
    }

    /**
     * Styles the slider according to its status (active/hover/inactive/locked/unlocked).
     * @param {*} slider Slider.
     * @param {String} status Can be "active", "inactive", "hover", "locked", "unlocked".
     */
    function styleSlider(slider, status) {
        // Executes only if the status has changed
        if (slider.status !== status && slider.status !== "locked") {
            // Styles the slider progress bar
            slider.progress.classList.add(status);
            if (slider.status == "unlocked") slider.progress.classList.remove("locked");
            else slider.progress.classList.remove(slider.status);

            // Styles the slider icon
            slider.icon.classList.add(status);
            if (slider.status == "unlocked") slider.icon.classList.remove("locked");
            else slider.icon.classList.remove(slider.status);

            // Changes the status
            slider.status = status;
        }
    }

    /**
     * Styles the toggle button and sets its status.
     * @param {String} id Id of the toggle button.
     * @param {Boolean} isToggled True if toggled, false otherwise.
     */
    function styleToggleButton(id, isToggled) {
        // Gets the correct toggle button
        const toggleButton = toggleButtons.get(id);
        // Sets the status
        toggleButton.status = isToggled;
        if (isToggled) {
            // Styles the button
            toggleButton.button.classList.add("toggled");
            // Styles the icon
            toggleButton.icon.classList.add("toggled");
        } else {
            // Styles the button
            toggleButton.button.classList.remove("toggled");
            // Styles the icon
            toggleButton.icon.classList.remove("toggled");
        }
    }

    /* ------ Slider resize ------ */

    /**
     * Resizes the progress bar for the font size slider
     * @param {String} id Id of the slider.
     * @param {Number} value Current slider value.
     */
    function resizeSliderProgress(id, value) {
        // Gets the slider
        const slider = sliders.get(id).slider;
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
        sliders.get(id).progress.style.width = progressSize + "px";
    }

    /* ------ Format options visibility ------ */

    /**
     * Expands or shrinks the options panel
     * @param {Boolean} isExpanded True if panel must be expanded, false otherwise.
     * @param {Duration} animationDelay Animation delay.
     */
    function toggleFormatOptionsPanel(isExpanded, animationDelay = 150) {
        // Sets the corresponding variable
        isFormatOptionsPanelExpanded = isExpanded;
        // Delays the contraction
        setTimeout(() => {
            document.documentElement.style.setProperty("--format-options-panel-width", isFormatOptionsPanelExpanded ?
                "var(--expanded-format-options-panel-width)" : "var(--shrunk-format-options-panel-width)");
            document.documentElement.style.setProperty("--format-options-panel-height", isFormatOptionsPanelExpanded ?
                "var(--expanded-format-options-panel-height)" : "var(--shrunk-format-options-panel-height)");
            // Displays/hides the options panel groups
            if (isFormatOptionsPanelExpanded) document.getElementById("complete-format-options-panel-group").classList.add("visible")
            else document.getElementById("complete-format-options-panel-group").classList.remove("visible")
        }, isFormatOptionsPanelExpanded ? 0 : animationDelay);
        // Delays the opacity animation
        setTimeout(() => {
            if (isFormatOptionsPanelExpanded) document.getElementById("complete-format-options-panel-group").classList.add("opaque")
            else document.getElementById("complete-format-options-panel-group").classList.remove("opaque")
        }, isFormatOptionsPanelExpanded ? animationDelay : 0);
    }

    /* ------ Two-options picker ------ */

    /**
     * Toggles the serif picker.
     * @param {Boolean} isSerifClicked True if serif is clicked, false otherwise.
     */
    function toggleSerifPicker(isSerifClicked) {
        toggleTwoOptionsPicker("serif", isSerifClicked, {
            panelWidthVariable: "--format-options-panel-width",
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
            panelWidthVariable: "--format-options-panel-width",
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
     * @param {String} id Id of the two-options picker.
     * @param {Boolean} isFirstButtonClicked True if serif is clicked, false otherwise.
     * @param {*} Options Options.
     */
    function toggleTwoOptionsPicker(id, isFirstButtonClicked, options = {
        panelWidthVariable: null,
        shrunkPanelWidth: null,
        expandedPanelWidth: null,
        otherPickers: []
    }) {
        // Gets the two-options picker
        const twoOptionsPicker = twoOptionsPickers.get(id);
        // Sets the picking status
        twoOptionsPicker.isPicking = !twoOptionsPicker.isPicking;

        if (twoOptionsPicker.isPicking) {
            // Expands the toggle if the picker started
            expandTwoOptionsPicker(id);
            // Expands the format options panel
            if (options.panelWidthVariable !== null) {
                document.documentElement.style.setProperty(options.panelWidthVariable, options.expandedPanelWidth);
            }
        } else {
            // If the selection was already ongoing...
            // ...moves the picker selection circle
            if (isFirstButtonClicked) twoOptionsPicker.selectionCircle.classList.add("translated");
            else twoOptionsPicker.selectionCircle.classList.remove("translated");
            // Shrinks the toggle after the selection circle is moved
            setTimeout(() => {
                shrinkTwoOptionsPicker(id, isFirstButtonClicked);

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
                    if (options.panelWidthVariable !== null) {
                        document.documentElement.style.setProperty(options.panelWidthVariable, options.shrunkPanelWidth);
                    }
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
     * @param {String} id Id of the two-options picker.
     */
    function expandTwoOptionsPicker(id) {
        // Gets the two-options picker
        const twoOptionsPicker = twoOptionsPickers.get(id);

        // Makes the buttons visible


        if (!twoOptionsPicker.isFirstOptionPicked) twoOptionsPicker.firstButton.classList.remove("transparent")
        else twoOptionsPicker.secondButton.classList.remove("transparent");

        // Expands the toggle
        twoOptionsPicker.firstButton.classList.add("translated");
        if (twoOptionsPicker.isFirstOptionPicked) twoOptionsPicker.selectionCircle.classList.add("translated");
        twoOptionsPicker.capsule.classList.add("expanded");
    }

    /**
     * Shrinks the two-options picker.
     * @param {String} id Id of the two-options picker.
     * @param {Boolean} isFirstOptionPicked True if the serif button is visible, false otherwise.
     */
    function shrinkTwoOptionsPicker(id, isFirstOptionPicked) {
        // Gets the two-options picker
        const twoOptionsPicker = twoOptionsPickers.get(id);

        // Hides the serif or sans-serif button
        if (isFirstOptionPicked) twoOptionsPicker.secondButton.classList.add("transparent");
        else twoOptionsPicker.firstButton.classList.add("transparent");

        // Shrinks the toggle and the options panel
        twoOptionsPicker.firstButton.classList.remove("translated");
        twoOptionsPicker.selectionCircle.classList.remove("translated");
        twoOptionsPicker.capsule.classList.remove("expanded")
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
        document.documentElement.style.setProperty("--slideshow-navigation-width", isSlidePickerVisible ?
            "var(--visible-slideshow-navigation-width)" : "var(--collapsed-slideshow-navigation-width)");

        // Hides or displays the slide picker
        setTimeout(() => {
            // Waits before changing the opacity if the control panel is expanding
            if (isSlidePickerVisible) sliders.get("slideshow").base.classList.remove("transparent");
            else sliders.get("slideshow").base.classList.add("transparent");
        }, isSlidePickerVisible ? getCssTimeInMs("general-long-transition-duration") * .9 : 0);

        setTimeout(() => {
            // Waits before setting the visibility to "hidden" if the control panel is collapsing
            if (isSlidePickerVisible) sliders.get("slideshow").base.classList.remove("hidden");
            else sliders.get("slideshow").base.classList.add("transparent");
        }, isSlidePickerVisible ? 0 : getCssTimeInMs("slider-general-transition-duration"));

        setTimeout(() => {
            // Makes adjustments to the margin of the slide number button to counter the spare gap
            if (isSlidePickerVisible) {
                document.getElementById("slide-number-button").classList.remove("compressed-right-margin");
                document.getElementById("slide-number-button").classList.add("extended-left-margin")
            } else {
                document.getElementById("slide-number-button").classList.add("compressed-right-margin");
                document.getElementById("slide-number-button").classList.remove("extended-left-margin")
            }
        }, isSlidePickerVisible ? 50 : getCssTimeInMs("general-long-transition-duration") * 0.75);

        // Resizes the progress bar for the slide picker and readjust the right margin of the slide number button
        if (isSlidePickerVisible) {
            setTimeout(() => {
                resizeSliderProgress("slideshow", currentSlideIndex);
                document.getElementById("slide-number-button").classList.remove("extended-left-margin")
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
        document.getElementById("slide-number-button").classList.add("active-animation")
        // Removes the animation (necessary to add the animation again at a later time)
        setTimeout(() => {
            document.getElementById("slide-number-button").classList.remove("active-animation");
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
        document.getElementById("page-container").classList.add("transparent");

        // Styles the page size slider and the page container
        setTimeout(() => {
            action();
        }, hidingDuration);
        // Displays the page container
        setTimeout(() => {
            document.getElementById("page-container").classList.remove("transparent")
        }, hidingDuration * 2);
    }

    /*_______________________________________
    |   Slideshow related methods
    */

    /**
     * Inits the slideshow and the slide number
     */
    function initSlideshow() {
        // Get the location hash property
        let hash = location.hash;

        // Executes if the hash exists, meaning the slideshow was ongoing
        if (hash) {
            // Sets the current slide to the hash value
            currentSlideIndex = parseInt(hash.substring(1));
            isSlideshowMode = true;
        } else {
            // Retrieves the slide number from local storage
            storedSlideIndex = parseInt(localStorage.getItem("slide-index"));
            // Sets the slide number if stored (0 otherwise)
            currentSlideIndex = isNaN(storedSlideIndex) ? 0 : storedSlideIndex;
        }
    }

    /**
     * Starts or pauses the slideshow.
     * @param {boolean} isActive Starts if true, pauses otherwise.
     * @param {*} options Toggle slideshow options (timeout).
     */
    function toggleSlideshow(isActive = undefined, options = { timeout: 0 }) {
        isSlideshowMode = isActive !== undefined ? isActive : (isSlideshowMode ? false : true);

        // Sets the opacity of the hidden slides div elements
        hiddenSlides.forEach(slide => {
            if (isSlideshowMode) slide.classList.add("hidden")
            else slide.classList.remove("hidden")
        })

        // If the slideshow mode is active...
        if (isSlideshowMode) {
            // ...displays the navigation panel
            slideshowNavigationOptionsPanel.classList.add("visible", "opaque");
        } else {
            // If it isn't, it first lowers the opacity...
            slideshowNavigationOptionsPanel.classList.remove("opaque");
            // ...and then - once the animation is completed - it hides the panel
            setTimeout(() => {
                slideshowNavigationOptionsPanel.classList.remove("visible");
            }, getCssTimeInMs("general-long-transition-duration"));
        }
        // Styles the toggle button
        styleToggleButton("slideshow", isSlideshowMode);

        if (isSlideshowMode) {
            // If slideshow mode is active, updates the slides
            updateSlides(options.timeout);

            // Sets the hash as the currently selected slide index
            window.location.hash = currentSlideIndex;
        } else {
            // Makes all the slides visible and non blurred
            slides.forEach(slide => {
                slide.classList.remove("non-selected");
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
        // Stores the current slide index
        localStorage.setItem("slide-index", currentSlideIndex);

        // Lowers the opacity of every slides and blurs them, aside from the currently selected one
        for (let i = 0; i < slides.length; i++) {
            if (i == currentSlideIndex) slides[i].classList.remove("non-selected");
            else slides[i].classList.add("non-selected");
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