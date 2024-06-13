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
     * Font size range slider.
     */
    let fontSizeSlider;

    /**
     * Map of sliders and respective progress bars and icons.
     */
    let sliders = new Map();

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
        // Removes the spinning loader
        document.getElementById("loading-container").style.opacity = 0;
        document.getElementById("loading-container").remove();
        // Makes page content visible 
        document.getElementById("page-container").style.visibility = "visible";
        document.getElementById("page-container").style.opacity = 1;

        if (presentationMode) {
            // Start the presentation
            togglePresentation(true);
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

        addSlider("font-size");
        addSlider("presentation");

        /* -- Font size slider -- */

        sliders.get("font-size").slider.addEventListener("input", () => {
            // Gets the font size from the slider
            const fontSize = parseInt(sliders.get("font-size").slider.value);
            // Sets the font size
            setFontSize(fontSize);
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
     */
    function togglePresentation(isActive = undefined) {
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
            updateSlides();

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
     */
    function updateSlides() {
        // Sets the hash to the currently selected slide index
        window.location.hash = currentSlideIndex;

        // Lowers the opacity of every slides and blurs them, aside from the currently selected one
        for (let i = 0; i < slides.length; i++) {
            slides[i].style = i == currentSlideIndex ? selectedSlideStyle : nonSelectedSlideStyle;
        }

        // Updates the progress bar
        resizeSliderProgress("presentation", currentSlideIndex);

        // Scrolls to the correct slide position
        setTimeout(() => {
            slides[currentSlideIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 0);
    }

}