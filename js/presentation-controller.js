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

    /**
     * Progress bar div element.
     */
    let progressBar;

    /* ------ Font size range slider ------ */

    /**
     * Font size range slider.
     */
    let fontSizeSlider;

    /**
     * Progress bar for the font size slider.
     */
    let fontSizeSliderProgress;

    /**
     * Icon for the font size slider.
     */
    let fontSizeSliderIcon;

    /* ------ Slide selection range slider ------ */

    /**
     * slide selection range slider.
     */
    let presentationSlider;

    /**
     * Progress bar for the slide selection slider.
     */
    let presentationSliderProgress;

    /**
     * Icon for the slide selection slider.
     */
    let presentationSliderIcon;

    let sliders = new Map();
    let slidersProgress = new Map();
    let slidersIcons = new Map();

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

        // Gets the font size from local storage and sets the font size
        let fontSize = localStorage.getItem("fontSize");
        // Min font size value
        const min = fontSizeSlider.min;
        // Max font size value
        const max = fontSizeSlider.max;
        // Checks if the font size is between the minimum and maximum value allowed
        fontSize = fontSize < min ? max : (fontSize > max ? max : fontSize);

        // Sets the font size
        pageContent.style = "font-size: " + fontSize + "pt";
        fontSizeSlider.value = fontSize;
        // Resizes the progress bar for the font size slider
        resizeSliderProgress(fontSizeSlider, fontSizeSliderProgress, fontSize);

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
        progressBar = document.getElementById("progress-bar");

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

        /* ------ Font size slider ------ */

        // Gets the font size slider elements
        fontSizeSlider = document.getElementById("font-size-slider");
        fontSizeSliderProgress = document.getElementById("font-slider-progress");
        fontSizeSliderIcon = document.getElementById("font-slider-icon");

        fontSizeSlider.oninput = () => {
            // Gets the font size from the slider
            const fontSize = parseInt(fontSizeSlider.value);

            // Sets the font size
            pageContent.style = "font-size: " + fontSize + "pt";

            // Styles the slider
            resizeSliderProgress(fontSizeSlider, fontSizeSliderProgress, fontSize);
            fontSizeSliderProgress.style.backgroundColor = "var(--accent)";
            fontSizeSliderProgress.style.opacity = 1;
            fontSizeSliderIcon.style.fill = "#ffffff";

            // Stores the font size in the local storage
            localStorage.setItem("fontSize", fontSize);
        }

        fontSizeSlider.onmouseover = () => {
            styleSliderProgress(fontSizeSliderProgress, fontSizeSliderIcon, true);
        }

        fontSizeSlider.onmouseleave = () => {
            styleSliderProgress(fontSizeSliderProgress, fontSizeSliderIcon, false);
        }

        fontSizeSlider.onchange = () => {
            styleSliderProgress(fontSizeSliderProgress, fontSizeSliderIcon, false);
        }

        /* ------ Slide selection slider ------ */

        // Gets the slide selection slider elements
        presentationSlider = document.getElementById("presentation-slider");
        presentationSliderProgress = document.getElementById("presentation-slider-progress");
        presentationSliderIcon = document.getElementById("presentation-slider-icon");

        // Sets max value for the slide selection slider
        presentationSlider.max = slides.length - 1;

        presentationSlider.oninput = () => {
            // Gets the font size from the slider
            const slideValue = parseInt(presentationSlider.value);

            // Goes to the desired slide
            goToSlide(slideValue);

            // Styles the slider
            presentationSliderProgress.style.backgroundColor = "var(--accent)";
            presentationSliderProgress.style.opacity = 1;
            presentationSliderIcon.style.fill = "#ffffff";
        }

        presentationSlider.onmouseover = () => {
            styleSliderProgress(presentationSliderProgress, presentationSliderIcon, true);
        }

        presentationSlider.onmouseleave = () => {
            styleSliderProgress(presentationSliderProgress, presentationSliderIcon, false);
        }

        presentationSlider.onchange = () => {
            styleSliderProgress(presentationSliderProgress, presentationSliderIcon, false);
        }

        window.addEventListener("resize", () => {
            resizeSliderProgress(presentationSlider, presentationSliderProgress, currentSlideIndex);
        })

        /**
         * Resets the slider progress and icon style corresponding to the given key.
         * @param {String} key Key of the slider.
         */
        function styleSliderProgress(sliderProgress, sliderIcon, isActive) {
            sliderProgress.style.backgroundColor = isActive ? "var(--accent)" : "var(--light-grey)";
            sliderProgress.style.opacity = isActive ? .9 : .7;
            sliderIcon.style.fill = isActive ? "#ffffff" : "var(--dark-grey)";
            sliderIcon.style.color = isActive ? "#ffffff" : "var(--dark-grey)";
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
     * Resizes the progress bar for the font size slider
     * @param {*} slider 
     * @param {*} sliderProgress 
     * @param {Number} value Current slider value.
     */
    function resizeSliderProgress(slider, sliderProgress, value) {
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
        sliderProgress.style.width = progressSize + "px";
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
        progressBar.style.opacity = presentationMode ? "1" : "0";
        presentationToggleButton.style = presentationMode ?
            "background-color: var(--accent);" :
            "background-color: var(--light-grey)";
        presentationToggleIcon.style = presentationMode ?
            "fill: #ffffff;" :
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
        progressBar.style.width = currentSlideIndex / (slides.length - 1) * 100 + "%";
        resizeSliderProgress(presentationSlider, presentationSliderProgress, currentSlideIndex);

        // Scrolls to the correct slide position
        setTimeout(() => {
            slides[currentSlideIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 0);
    }

}