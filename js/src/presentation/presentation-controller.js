// patch all methods
seamless.polyfill();

/**
 * Device dpi.
 */
let dpi;

/**
 * Presentation mode controller.
 */
let presentationController = new function () {

    /*_______________________________________
    |   Presentation config
    */

    /**
     * Index of the currently selected slide.
     */
    let currentSlideIndex = 0;

    /**
     * Ture if presentation mode is active, false otherwise.
     */
    let presentationMode = false;

    /**
     * True if the serif selection is ongoing, false otherwise.
     */
    let isSerifSelecting = false;

    /**
     * True if serif is selected, false otherwise.
     */
    let isSerif = false;

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

    /* ------ View controls ------ */

    let viewControlsCapsule;

    /* ------ Presentation toggle ------ */

    /**
     * Presentation toggle button.
     */
    let presentationToggleButton;

    /**
     * Presentation toggle icon.
     */
    let presentationToggleIcon;

    /* ------ Presentation navigation ------ */

    /**
     * Presentation controls panel.
     */
    let presentationNavigation;

    /* ------ Font size range slider ------ */

    /**
     * Map of sliders and respective progress bars and icons.
     */
    let sliders = new Map();

    /* ------ Font serif selection ------ */

    /**
     * Serif button.
     */
    let serifButton;

    /**
     * Sans serif button.
     */
    let sansSerifButton;

    /**
     * Selection circle for the serif/sans-serif toggle.
     */
    let serifSelectionCircle;

    /**
     * Container for the serif/sans-serif toggle.
     */
    let serifSelectionCapsule;

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
    |   Methods
    */

    // On document content load
    document.addEventListener("DOMContentLoaded", function (e) {
        // Initializes HTML elements and listeners
        initHTMLComponents();

        // Sets the locally stored font size, if present
        setFontSize(localStorage.getItem("fontSize"));

        // Gets the locally stored font style
        const fontStyle = localStorage.getItem("fontStyle");
        // Sets the locally stored font style, if present
        setFontStyle(fontStyle);
        // Makes the serif button visible if necessary
        if (fontStyle == "serif") {
            serifButton.style.opacity = 1;
            sansSerifButton.style.opacity = 0;
        };

        // Get the location hash property
        let hash = location.hash;

        // Executes if the hash exists, meaning the presentation was ongoing
        if (hash) {
            // Sets the current slide to the hash value
            currentSlideIndex = parseInt(hash.substring(1));
            presentationMode = true;
        }
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

        if (presentationMode) {
            // Start the presentation
            togglePresentation(true, { timeout: 1000 });
        }

        // Get the device dpi
        dpi = window.devicePixelRatio;
    }

    /**
     * Initializes the HTML elements and their listeners
     */
    function initHTMLComponents() {
        /* ------ Page content and sliders ------ */

        // Gets the main element with the page content
        pageContent = document.getElementById("page-content");

        // Gets the slide div elements
        slides = [...document.querySelectorAll(".slide:not(.hidden)")];

        // Gets the hidden slide div elements
        hiddenSlides = [...document.querySelectorAll(".slide.hidden")];

        // Gets the presentation navigation elements
        presentationNavigation = document.getElementById("presentation-navigation");

        /* ------ View controls ------ */

        viewControlsCapsule = document.getElementById("view-controls");

        /* ------ Presentation toggle ------ */

        // Gets the presentation controls elements
        presentationToggleButton = document.getElementById("presentation-toggle-button");
        presentationToggleIcon = document.getElementById("presentation-toggle-icon");

        presentationToggleButton.onclick = () => {
            // Starts the presentation
            togglePresentation();
        };

        document.getElementById("next").onclick = () => {
            // Moves to next slide
            nextSlide();
        };

        document.getElementById("previous").onclick = () => {
            // Moves to previous slide
            previousSlide();
        };

        /* ------ Sliders ------ */

        // Adds sliders and related elements to the sliders map
        addSlider("font-size");
        addSlider("presentation");

        /* -- Font size slider -- */

        sliders.get("font-size").slider.addEventListener("input", () => {
            // Gets the font size from the slider
            const fontSize = parseInt(sliders.get("font-size").slider.value);
            // Sets the font size
            setFontSize(fontSize);
            // After a certain interval, Scrolls the current slide into view if necessary
            if (presentationMode) centerSlide(1000);
            // Stores the font size in the local storage
            localStorage.setItem("fontSize", fontSize);
        });

        /* -- Slide selection slider -- */

        // Sets max value for the slide selection slider
        sliders.get("presentation").slider.max = slides.length - 1;

        // Resizes the slide selection progress bar on window resize.
        window.addEventListener("resize", () => {
            resizeSliderProgress("presentation", currentSlideIndex);
        })

        sliders.get("presentation").slider.oninput = () => {
            // Gets the font size from the slider
            const slideValue = parseInt(sliders.get("presentation").slider.value);
            // Goes to the desired slide
            goToSlide(slideValue);
        }

        /* -- Common listeners -- */

        sliders.forEach((s) => {
            s.slider.addEventListener("oninput", () => {
                styleSlider(s.progress, s.icon, "active");
            })

            s.slider.addEventListener("mouseover", () => {
                styleSlider(s.progress, s.icon, "hover");
            })

            s.slider.addEventListener("mouseleave", () => {
                styleSlider(s.progress, s.icon, "inactive");
            })

            s.slider.addEventListener("change", () => {
                styleSlider(s.progress, s.icon, "inactive");
            })
        })

        /**
         * Styles the slider according to its status (active, hover, inactive).
         * @param {*} sliderProgress 
         * @param {*} sliderIcon 
         * @param {*} status Can be "active", "inactive" or "hover".
         */
        function styleSlider(sliderProgress, sliderIcon, status) {
            sliderProgress.style.backgroundColor = "var(--button-" + status + "-color)";
            sliderProgress.style.opacity = "var(--button-" + status + "-opacity)";
            sliderIcon.style.color = "var(--button-text-" + status + "-color)";
            sliderIcon.style.fill = "var(--button-text-" + status + "-color)";
        }

        /* ------ Font serif selection ------ */

        // Gets the serif selection elements
        serifButton = document.getElementById("serif-button");
        sansSerifButton = document.getElementById("sans-serif-button");
        serifSelectionCircle = document.getElementById("serif-selection-circle");
        serifSelectionCapsule = document.getElementById("serif-selection-capsule");

        // Toggles the selection when the serif button is clicked
        serifButton.onclick = () => {
            toggleSerifSelection(true);
        }

        // Toggles the selection when the sans serif button is clicked
        sansSerifButton.onclick = () => {
            toggleSerifSelection(false);
        }

        /**
         * Toggles the serif selection.
         * @param {Boolean} isSerifClicked True if serif is clicked, false otherwise.
         */
        function toggleSerifSelection(isSerifClicked) {
            // Flags the selection start/end
            isSerifSelecting = !isSerifSelecting;

            if (isSerifSelecting) {
                // Expands the toggle if the selection started
                expandSerifSelection();
            } else {
                // If the selection was already ongoing...
                if (isSerifClicked) {
                    if (!isSerif) {
                        isSerif = true;
                        // Moves the selection circle
                        serifSelectionCircle.style.transform = "translateX(calc(-1 * var(--font-serif-offset)))";
                        // Shrinks the toggle after the selection circle is moved
                        setTimeout(() => {
                            shrinkSerifSelection(true);
                        }, 200);
                    } else {
                        shrinkSerifSelection(true);
                    }
                    // Sets the serif font style
                    setFontStyle("serif");
                    // After a certain interval, Scrolls the current slide into view if necessary
                    if (presentationMode) centerSlide(500);
                } else {
                    if (isSerif) {
                        isSerif = false;
                        // Moves the selection circle
                        serifSelectionCircle.style = "transform: translateX(0)";
                        // Shrinks the toggle after the selection circle is moved
                        setTimeout(() => {
                            shrinkSerifSelection(false);
                        }, 200);
                    } else {
                        shrinkSerifSelection(false);
                    }
                    // Sets the sans-serif font style
                    setFontStyle("sans-serif");
                    // After a certain interval, Scrolls the current slide into view if necessary
                    if (presentationMode) centerSlide(500);
                }
            }
        }

        /**
         * Expands the serif selection toggle.
         */
        function expandSerifSelection() {
            // Makes the buttons visible
            serifButton.style.opacity = 1;
            sansSerifButton.style.opacity = 1;

            // Expands the toggle
            serifButton.style.transform = "translateX(calc(-1 * var(--font-serif-offset)))";
            serifSelectionCircle.style.transform =
                isSerif ? "translateX(calc(-1 * var(--font-serif-offset)))" : "transform: translateX(0)";
            viewControlsCapsule.style.width = "var(--expanded-view-controls-width)"
            serifSelectionCapsule.style.width = "var(--expanded-view-controls-width)";
        }

        /**
         * Shrinks the serif selection toggle.
         * @param {Boolean} isSerifVisible True if the serif button is visible, false otherwise.
         */
        function shrinkSerifSelection(isSerifVisible) {
            // Hides the serif or sans-serif button
            if (isSerifVisible) {
                sansSerifButton.style.opacity = 0;
                sansSerifButton.style.zIndex = "var(--font-serif-lower-index)"
                serifButton.style.zIndex = "var(--font-serif-upper-index)"
            } else {
                serifButton.style.opacity = 0;
                serifButton.style.zIndex = "var(--font-serif-lower-index)"
                sansSerifButton.style.zIndex = "var(--font-serif-upper-index)"
            }

            // Shrinks the toggle
            serifButton.style.transform = "translateX(0)"
            serifSelectionCircle.style.transform = "translateX(0)"
            viewControlsCapsule.style.width = "var(--view-controls-width)"
            serifSelectionCapsule.style.width = "var(--view-controls-width)";
        }

        /* ------ Hotkeys ------ */

        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case "KeyS":
                    // Toggles the presentation on and off
                    togglePresentation(!presentationMode);
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

    /**
     * Adds the slider, its progress bar and its icon to the map.
     * @param {String} key Keyword of the slider.
     */
    function addSlider(key) {
        sliders.set(key, {
            slider: document.getElementById(key + "-slider"),
            progress: document.getElementById(key + "-slider-progress"),
            icon: document.getElementById(key + "-slider-icon")
        })
    }

    /**
     * Sets the font size.
     * @param {Number} fontSize 
     */
    function setFontSize(fontSize) {
        // Min font size value
        const min = sliders.get("font-size").slider.min;
        // Max font size value
        const max = sliders.get("font-size").slider.max;
        // Checks if the font size is between the minimum and maximum value allowed
        fontSize = fontSize < min ? min : (fontSize > max ? max : fontSize);

        // Sets the font size
        pageContent.style = "font-size: " + fontSize + "pt";
        // Changes the font size slider value if necessary
        sliders.get("font-size").slider.value = fontSize;
        // Resizes the progress bar for the font size slider
        resizeSliderProgress("font-size", fontSize);
    }

    function setFontStyle(fontStyle) {
        if (fontStyle == undefined || fontStyle === null) fontStyle = "sans-serif";
        // Sets the font style
        document.getElementById("page-container").style.fontFamily = "var(--" + fontStyle + "-font)";
        // Stores the font style
        localStorage.setItem("fontStyle", fontStyle);
    }

    /**
     * Resizes the progress bar for the font size slider
     * @param {String} key Keyword of the slider.
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
        const sliderHeight = slider.offsetHeight;
        // Computes the progress bar size
        const progressSize = ((value - min) / (max - min) * (sliderWidth - sliderHeight) + sliderHeight);

        // Resizes and styles the progress bar for the font size slider
        sliders.get(key).progress.style.width = progressSize + "px";
    }

    /**
     * Starts or pauses the presentation.
     * @param {boolean} isActive Starts if true, pauses otherwise.
     * @param {*} options Toggle presentation options (timeout).
     */
    function togglePresentation(isActive = undefined, options = { timeout: 0 }) {
        presentationMode = isActive !== undefined ? isActive : (presentationMode ? false : true);

        // Sets the opacity of the hidden slides div elements
        hiddenSlides.forEach(slide => {
            slide.style = presentationMode ? nonSelectedSlideStyle : selectedSlideStyle;
        })

        // Shows or hides the controls for the presentation
        presentationNavigation.style.opacity = presentationMode ? "1" : "0";
        presentationToggleButton.style = presentationMode ?
            "background-color: var(--accent);" :
            "background-color: var(--light-grey)";
        presentationToggleIcon.style = presentationMode ?
            "fill: var(--highlight);" :
            "fill: var(--dark-grey)";

        if (presentationMode) {
            // If presentation mode is active, updates the slides
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
        // When presentation mode is active, increases the slide index
        if (presentationMode) {
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
        // When presentation mode is active, decreases the slide index
        if (presentationMode) {
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
        // When presentation mode is active, goes to the desired slide index
        if (presentationMode) {
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
        resizeSliderProgress("presentation", currentSlideIndex);
        sliders.get("presentation").icon.innerText = currentSlideIndex;

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