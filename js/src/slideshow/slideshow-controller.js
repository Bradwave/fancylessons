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
    let slideshowMode = false;

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

    let viewControlsPanel;

    /* ------ Toggle buttons ------ */

    let toggleButtons = new Map();

    /* ------ Slideshow navigation ------ */

    /**
     * slideshow controls panel.
     */
    let slideshowNavigationControlsPanel;

    /* ------ Font size range slider ------ */

    /**
     * Map of sliders and respective progress bars and icons.
     */
    let sliders = new Map();

    /* ------ Font serif picker ------ */

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
    let serifPickerSelectionCircle;

    /**
     * Container for the serif/sans-serif toggle.
     */
    let serifPickerCapsule;

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

        // Gets the locally stored font size, if present
        const fontSize = localStorage.getItem("fontSize");
        // Sets the locally stored font size, if present
        setFontSize(fontSize === null ? 14 : fontSize);

        // Gets the locally stored font style
        const fontStyle = localStorage.getItem("fontStyle");
        // Sets the locally stored font style, if present
        setFontStyle(fontStyle);
        // Makes the serif button visible if necessary
        if (fontStyle == "serif") {
            setTimeout(() => {
                serifButton.style.opacity = 1;
            }, 100);
            sansSerifButton.style.opacity = 0;
        };

        // Gets the locally stored page size, if present
        const pageSize = localStorage.getItem("pageSize")
        // Sets the locally stored page size, if present
        setPageSize(pageSize === null ? 2 : pageSize);

        // Get the location hash property
        let hash = location.hash;

        // Executes if the hash exists, meaning the slideshow was ongoing
        if (hash) {
            // Sets the current slide to the hash value
            currentSlideIndex = parseInt(hash.substring(1));
            slideshowMode = true;
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

        if (slideshowMode) {
            // Start the slideshow
            toggleSlideshow(true, { timeout: 1000 });
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

        // Gets the slideshow navigation elements
        slideshowNavigationControlsPanel = document.getElementById("slideshow-navigation-controls-panel");

        /* ------ View controls ------ */

        viewControlsPanel = document.getElementById("view-controls-panel");

        /* ------ Options toggle ------ */

        // Adds the options toggle button
        addToggleButton("options");

        // Expands and shrinks the view controls panel on click
        toggleButtons.get("options").button.onclick = () => {
            styleToggleButton("options", !toggleButtons.get("options").status);
            if (toggleButtons.get("options").status) {
                // Expands the view controls panel
                toggleViewControlsPanel(true);
            } else {
                // Toggle the serif picker if expanded
                if (isSerifSelecting) toggleSerifPicker(isSerif, true);
                // Shrinks the view controls panel
                toggleViewControlsPanel(false);
            }
        }

        /**
         * Expands or shrinks the controls panel
         * @param {Boolean} isExpanded True if panel must be expanded, false otherwise.
         * @param {Duration} animationDelay Animation delay.
         */
        function toggleViewControlsPanel(isExpanded, animationDelay = 150) {
            // Delays the contraction
            setTimeout(() => {
                viewControlsPanel.style.width
                    = isExpanded ? "var(--expanded-view-controls-panel-width)" : "var(--view-controls-panel-width)";
                viewControlsPanel.style.height
                    = isExpanded ? "var(--expanded-view-controls-panel-height)" : "var(--view-controls-panel-height)";
                // Displays/hides the controls panel groups
                document.getElementById("font-options-controls-panel-group").style.visibility = isExpanded ? "visible" : "hidden";
                document.getElementById("page-size-controls-panel-group").style.visibility = isExpanded ? "visible" : "hidden";
            }, isExpanded ? 0 : animationDelay);
            // Delays the opacity animation
            setTimeout(() => {
                document.getElementById("font-options-controls-panel-group").style.opacity = isExpanded ? "1" : "0";
                document.getElementById("page-size-controls-panel-group").style.opacity = isExpanded ? "1" : "0";
            }, isExpanded ? animationDelay : 0);
        }

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

        /* ------ Sliders ------ */

        // Adds sliders and related elements to the sliders map
        addSlider("font-size");
        addSlider("page-size");
        addSlider("slideshow");

        /* -- Font size slider -- */

        sliders.get("font-size").slider.addEventListener("input", () => {
            // Gets the font size from the slider
            const fontSize = parseInt(sliders.get("font-size").slider.value);
            // Sets the font size
            setFontSize(fontSize);
            // After a certain interval, Scrolls the current slide into view if necessary
            if (slideshowMode) centerSlide(1000);
            // Stores the font size in the local storage
            localStorage.setItem("fontSize", fontSize);
        });

        /* -- Page size slider -- */

        sliders.get("page-size").slider.addEventListener("input", () => {
            // Gets the fractional page content size from the slider
            const pageSize = parseInt(sliders.get("page-size").slider.value);
            // Sets the fractional page size
            setPageSize(pageSize);
            // After a certain interval, Scrolls the current slide into view if necessary
            if (slideshowMode) centerSlide(1000);
            // Stores the font size in the local storage
            localStorage.setItem("pageSize", pageSize);
        })

        /* -- Slide picker slider -- */

        // Sets max value for the slide picker slider
        sliders.get("slideshow").slider.max = slides.length - 1;

        // Resizes the slide picker progress bar on window resize.
        window.addEventListener("resize", () => {
            resizeSliderProgress("slideshow", currentSlideIndex);
        })

        sliders.get("slideshow").slider.oninput = () => {
            // Gets the font size from the slider
            const slideValue = parseInt(sliders.get("slideshow").slider.value);
            // Goes to the desired slide
            goToSlide(slideValue);
        }

        /* -- Common listeners -- */

        // Styles the slide appropriately according to the current status (active/hover/inactive)
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

        /* ------ Font serif picker ------ */

        // Gets the serif picker elements
        serifButton = document.getElementById("serif-button");
        sansSerifButton = document.getElementById("sans-serif-button");
        serifPickerSelectionCircle = document.getElementById("serif-picker-selection-circle");
        serifPickerCapsule = document.getElementById("serif-picker-capsule");

        // Toggles the picker when the serif button is clicked
        serifButton.onclick = () => {
            toggleSerifPicker(true);
        }

        // Toggles the picker when the sans serif button is clicked
        sansSerifButton.onclick = () => {
            toggleSerifPicker(false);
        }

        /**
         * Toggles the serif picker.
         * @param {Boolean} isSerifClicked True if serif is clicked, false otherwise.
         * @param {Boolean} isPanelCollapsed True if the panel has to be completely collapsed, false otherwise.
         */
        function toggleSerifPicker(isSerifClicked, isPanelCollapsed = false) {
            // Flags the picker start/end
            isSerifSelecting = !isSerifSelecting;

            if (isSerifSelecting) {
                // Expands the toggle if the picker started
                expandSerifPicker();
            } else {
                // If the selection was already ongoing...
                if (isSerifClicked) {
                    if (!isSerif) {
                        isSerif = true;
                        // Moves the picker selection circle
                        serifPickerSelectionCircle.style.transform = "translateX(calc(-1 * var(--serif-picker-offset)))";
                        // Shrinks the toggle after the selection circle is moved
                        setTimeout(() => {
                            shrinkSerifPicker(true, isPanelCollapsed);
                        }, 200);
                    } else {
                        shrinkSerifPicker(true, isPanelCollapsed);
                    }
                    // Sets the serif font style
                    setFontStyle("serif");
                    // After a certain interval, Scrolls the current slide into view if necessary
                    if (slideshowMode) centerSlide(500);
                } else {
                    if (isSerif) {
                        isSerif = false;
                        // Moves the picker selection circle
                        serifPickerSelectionCircle.style = "transform: translateX(0)";
                        // Shrinks the toggle after the picker selection circle is moved
                        setTimeout(() => {
                            shrinkSerifPicker(false, isPanelCollapsed);
                        }, 200);
                    } else {
                        shrinkSerifPicker(false, isPanelCollapsed);
                    }
                    // Sets the sans-serif font style
                    setFontStyle("sans-serif");
                    // After a certain interval, Scrolls the current slide into view if necessary
                    if (slideshowMode) centerSlide(500);
                }
            }
        }

        /**
         * Expands the serif picker.
         */
        function expandSerifPicker() {
            // Makes the buttons visible
            serifButton.style.opacity = 1;
            sansSerifButton.style.opacity = 1;

            // Expands the toggle
            viewControlsPanel.style.width = "var(--extended-view-controls-panel-width)"
            serifButton.style.transform = "translateX(calc(-1 * var(--serif-picker-offset)))";
            serifPickerSelectionCircle.style.transform =
                isSerif ? "translateX(calc(-1 * var(--serif-picker-offset)))" : "transform: translateX(0)";
            serifPickerCapsule.style.width = "var(--extended-serif-picker-capsule-width)";
        }

        /**
         * Shrinks the serif picker.
         * @param {Boolean} isSerifVisible True if the serif button is visible, false otherwise.
         */
        function shrinkSerifPicker(isSerifVisible, isPanelCollapsed = false) {
            // Hides the serif or sans-serif button
            if (isSerifVisible) {
                sansSerifButton.style.opacity = 0;
                sansSerifButton.style.zIndex = "var(--serif-picker-lower-index)"
                serifButton.style.zIndex = "var(--serif-picker-upper-index)"
            } else {
                serifButton.style.opacity = 0;
                serifButton.style.zIndex = "var(--serif-picker-lower-index)"
                sansSerifButton.style.zIndex = "var(--serif-picker-upper-index)"
            }

            // Shrinks the toggle
            serifButton.style.transform = "translateX(0)"
            serifPickerSelectionCircle.style.transform = "translateX(0)"
            serifPickerCapsule.style.width = "var(--serif-picker-capsule-width)";
            viewControlsPanel.style.width = "var(--expanded-view-controls-panel-width)";
        }

        /* ------ Hotkeys ------ */

        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case "KeyS":
                    // Toggles the slideshow on and off
                    toggleSlideshow(!slideshowMode);
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
         * Styles the slider according to its status (active/hover/inactive).
         * @param {*} slider Slider.
         * @param {String} status Can be "active", "inactive" or "hover".
         */
    function styleSlider(slider, status) {
        // Executes only if the status has changed
        if (slider.status !== status) {
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
     * @param {String} key Keyword of the toggle button.
     * @param {*} status Status of the toggle.
     */
    function styleToggleButton(key, status) {
        // Gets the correct toggle button
        const toggleButton = toggleButtons.get(key);
        // Sets the status
        toggleButton.status = status;
        // Styles the button
        toggleButton.button.style = status ?
            "background-color: var(--accent);" :
            "background-color: var(--light-grey)";
        // Styles the icon
        toggleButton.icon.style = status ?
            "fill: var(--highlight);" :
            "fill: var(--dark-grey)";
    }


    /**
     * Adds the toggle button, its icon and its status to the map
     * @param {String} key Keyword of the toggle button.
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
     * @param {String} key Keyword of the slider.
     */
    function addSlider(key) {
        sliders.set(key, {
            slider: document.getElementById(key + "-slider"),
            progress: document.getElementById(key + "-slider-progress"),
            icon: document.getElementById(key + "-slider-icon"),
            status: "inactive"
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
        fontSize = constrain(fontSize, min, max);

        // Sets the font size
        pageContent.style = "font-size: " + fontSize + "pt";
        // Changes the font size slider value if necessary
        sliders.get("font-size").slider.value = fontSize;
        // Resizes the progress bar for the font size slider
        resizeSliderProgress("font-size", fontSize);
    }

    /**
     * Sets the font style (serif/sans-serif).
     * @param {String} fontStyle Can be "serif" or "sans-serif".
     */
    function setFontStyle(fontStyle) {
        if (fontStyle == undefined || fontStyle === null) fontStyle = "sans-serif";
        // Sets the font style
        document.getElementById("page-container").style.fontFamily = "var(--" + fontStyle + "-font)";
        // Stores the font style
        localStorage.setItem("fontStyle", fontStyle);
    }

    /**
     * Sets the fractional size for the page.
     * @param {Number} pageSize Size of the page content (from 0 to 4);
     */
    function setPageSize(pageSize) {
        // Available fractional sizes
        const fractionalSizes = [3, 4, 5, 10, "full"];
        // Selects the fractional size
        let selectedFractionalSize = fractionalSizes[pageSize];

        if (selectedFractionalSize == "full") {
            // Sets the font size
            document.getElementById("page-container").style.gridTemplateColumns = "0fr 1fr 0fr";
            pageContent.style.padding = "var(--large-page-padding)";
        } else {
            // Sets the font size
            document.getElementById("page-container").style.gridTemplateColumns = "1fr " + selectedFractionalSize + "fr 1fr";
            pageContent.style.padding = "var(--small-page-padding)";
        }
        // Resizes the progress bar for the font size slider
        resizeSliderProgress("page-size", pageSize);
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
     * Updates and animates the slide number.
     * @param {Number} animationDuration Duration of the animation in ms.
     */
    function updateSlideNumber(animationDuration = 300) {
        // Updates the slide number
        document.getElementById("slide-number").innerText = currentSlideIndex;
        // Animates the slider number
        document.getElementById("slide-number-capsule").style.animation = "enlarge " + (animationDuration / 1000) + "s ease-in-out 1";
        // Removes the animation (necessary to add the animation again at a later time)
        setTimeout(() => {
            document.getElementById("slide-number-capsule").style.animation = "none";
        }, animationDuration);
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
        slideshowMode = isActive !== undefined ? isActive : (slideshowMode ? false : true);

        // Sets the opacity of the hidden slides div elements
        hiddenSlides.forEach(slide => {
            slide.style = slideshowMode ? nonSelectedSlideStyle : selectedSlideStyle;
        })

        // Shows or hides the controls for the slideshow
        slideshowNavigationControlsPanel.style.opacity = slideshowMode ? "1" : "0";
        // Styles the toggle button
        styleToggleButton("slideshow", slideshowMode);

        if (slideshowMode) {
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
        if (slideshowMode) {
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
        if (slideshowMode) {
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
        if (slideshowMode) {
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