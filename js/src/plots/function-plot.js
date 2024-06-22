/**
 * Plots of a function.
 * @param {String} id ID/Key of the plots (array of strings).
 * @param {Array} functions Functions to be plotted. 
 * @param {Array} options Options of the plot. 
 * @returns Public APIs.
 */
let functionPlot = function (id, functions, options) {

    /**
     * Public methods.
     */
    let publicAPIs = {};

    /**
     * Coordinate system.
     */
    let cs;

    /*_______________________________________
    |   Resizing variables
    */

    /**
     * Width of the plot.
     */
    let width;

    /**
     * Height of the plot.
     */
    let height;

    /*_______________________________________
    |   Plots of functions
    */

    /**
     * Functions plots map.
     */
    let fPlots = new Map();

    /**
     * Functions contexts map.
     */
    let fCtxs = new Map();

    /*_______________________________________
    |   General variables
    */

    /**
     * True if the renderer is running, false otherwise.
     */
    let isRunning = true;

    /**
     * True if the plot is being translated along a certain axes, false otherwise.
     */
    let isTranslating = { x: false, y: false };

    /**
     * True if touch on the canvas started, false otherwise.
     */
    let isLeftMouseDown = false;

    /**
     * Mouse or touch position in screen coordinates (x, y).
     */
    let touchPosition;

    /**
     * Current zoom factor.
     */
    let currentZoom = 1;

    /**
     * True if the grid is visible, false otherwise.
     */
    let isGridVisible = true;

    /**
     * True if the plot is full screen, false otherwise.
     */
    let isFullscreen = false;

    /*_______________________________________
    |   Math
    */

    let params = [];

    let epsilon;

    /*_______________________________________
    |   Methods
    */

    /**
     * Inits the plot.
     */
    function init() {
        // Sets default parameters
        if (functions == undefined) functions = [];
        if (options.parameters == undefined) options.parameters = [];
        if (options.parameters == undefined) options.parameters = [];
        if (options.labelSize == undefined) options.labelSize = 15;
        if (options.backgroundColor == undefined) options.backgroundColor = "#ffffff";
        if (options.axisColor == undefined) options.axisColor = "#3c3c3c";
        if (options.gridColor == undefined) options.gridColor = "#777777";
        if (options.gridLineWidth == undefined) options.gridLineWidth = 1;
        if (options.secondaryGridColor == undefined) options.secondaryGridColor = "#7777776e";
        if (options.secondaryGridLineWidth == undefined) options.secondaryGridLineWidth = 1
        if (options.isGridVisible == undefined) options.isGridVisible = true;
        if (options.isGridToggleActive == undefined) options.isGridToggleActive = true;
        if (options.isRefreshActive == undefined) options.isRefreshActive = true;
        if (options.isTranslationActive == undefined) options.isTranslationActive = true;
        if (options.isZoomActive == undefined) options.isZoomActive = true;
        if (options.isFullscreenToggleActive == undefined) options.isFullscreenToggleActive = true;
        if (options.epsilon == undefined) options.epsilon = 0.01;

        // Sets the epsilon
        epsilon = options.epsilon;

        // Sets the grid visibility
        isGridVisible = options.isGridVisible;

        functions.forEach((f) => {
            const functionPlot = new plotStructure(f.id + "-" + id, { alpha: true });
            // Stores the function plot
            fPlots.set(f.id, functionPlot);
            // Stores the function plot context
            fCtxs.set(f.id, functionPlot.getCtx());

            // Sets default function parameters
            if (f.color == undefined) f.color = "#1484e6";
            if (f.lineWidth == undefined) f.lineWidth = 3;
        })

        // Sets the initial value of the parameters
        options.parameters.forEach((p) => {
            params[p.id] = parseFloat(document.getElementById(id + "-param-" + p.id).value);
        });

        // Updates width and heigh of the canvas
        updateCanvasDimension();

        // Create a new coordinate system
        cs = new CoordinateSystem(width, height,
            { x: options.viewportCenter.x, y: options.viewportCenter.y }, options.initialPixelsPerUnit);

        // Adds event listeners
        addEventListeners();
    }

    /*_______________________________________
    |   Canvas and canvas dimension
    */

    const axisPlot = new plotStructure(id, { alpha: true });
    const axisCtx = axisPlot.getCtx();

    /**
     * Updates width and heigh of the canvas.
     */
    function updateCanvasDimension() {
        axisPlot.resizeCanvas();
        fPlots.forEach((plot) => {
            plot.resizeCanvas();
        })
        width = Math.ceil(axisPlot.getWidth());
        height = Math.ceil(axisPlot.getHeight());
    }


    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        // Updates width and heigh of the canvas
        updateCanvasDimension();
        // Updates the edges of the canvas in the coordinate system
        cs.updateSystem(width, height);
    }

    /*_______________________________________
    |   Events and controls
    */

    function addEventListeners() {

        /* -- Axis translation -- */

        if (options.isTranslationActive) {
            // Executes when a mouse button si pressed the canvas
            axisPlot.getCanvas().onmousedown = (e) => {
                // If the left button is clicked
                if (e.button == 0) {
                    isLeftMouseDown = true;
                    // The mouse position is stored
                    touchPosition = { x: e.clientX * dpi, y: e.clientY * dpi };
                }
            }

            // Executes when a mouse button is released on the whole document
            document.onmouseup = (e) => {
                if (e.button == 0) {
                    isLeftMouseDown = false;
                }
            }

            // Executes when the mouse is moved on the whole document
            document.onmousemove = (e) => {
                // If the left mouse is pressed
                if (isLeftMouseDown) {
                    // Stops running animations
                    isRunning = false;
                    // Stores the current mouse position
                    const newTouchPosition = { x: e.clientX * dpi, y: e.clientY * dpi }
                    // Translates the axis
                    translateAxis(newTouchPosition);
                }
            }

            // Executes when the touch starts on the canvas
            axisPlot.getCanvas().ontouchstart = (e) => {
                // Stores the current touch position
                touchPosition = getTouchPosition(e);
            }


            // Executes when a touch move event is detected
            document.ontouchmove = (e) => {
                // Stores the current touch position
                const newTouchPosition = getTouchPosition(e);
                // Translates the axis
                translateAxis(newTouchPosition);
            }

            /**
             * Store the latest touch position.
             * @param {*} e Event
             * @returns The current touch position.
             */
            const getTouchPosition = (e) => {
                e.preventDefault();
                // Stores the touches
                let touches = e.changedTouches;
                return {
                    x: touches[0].pageX * dpi,
                    y: touches[0].pageY * dpi
                }
            }

            /**
             * Translates the axis according to the latest touch/mouse position and the starting touch/mouse position.
             * @param {Object} newTouchPosition The latest touch/mouse position (x, y);
             */
            function translateAxis(newTouchPosition) {
                // Translates the origin
                cs.translateOrigin(
                    newTouchPosition.x - touchPosition.x,
                    newTouchPosition.y - touchPosition.y
                );
                // Updates the touch position
                touchPosition = newTouchPosition;
                // Draws the updated plot
                publicAPIs.drawPlot();
            }
        }

        /* -- Zoom -- */

        if (options.isZoomActive) {
            // Executes when the zoom-in button is pressed
            document.getElementById(id + "-plot-zoom-in").onclick = () => {
                isRunning = true;
                // Stores current zoom as 1
                currentZoom = 1;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Sets the maximum zoom, compared to current (which is set to 1)
                const maxZoom = 2;
                // Animates the zoom-in
                animate(() => {
                    zoomViewport(zoomInc, maxZoom, () => { return currentZoom > maxZoom / zoomInc });
                });
            }

            // Executes when the zoom-out button is pressed
            document.getElementById(id + "-plot-zoom-out").onclick = () => {
                isRunning = true;
                // Stores current zoom as 1
                currentZoom = 1;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Sets the minimum zoom, compared to current (which is set to 1)
                const minZoom = 1 / 2;
                // Animates the zoom-out
                animate(() => {
                    zoomViewport(1 / zoomInc, minZoom, () => { return currentZoom < minZoom * zoomInc });
                });
            }

            // Executes when the mouse wheel is scrolled
            axisPlot.getCanvas().addEventListener("wheel", (e) => {
                // Prevents page scrolling
                e.preventDefault();

                // Bounding client rectangle
                const rect = e.target.getBoundingClientRect();
                // x position within the canvas
                const zoomX = (e.clientX - rect.left) * dpi;
                // y position within the canvas
                const zoomY = (e.clientY - rect.top) * dpi;

                // Updates the zoom level
                cs.updateZoom(Math.exp(-e.deltaY / 1000), { x: zoomX, y: zoomY });
                // Draws the plot
                publicAPIs.drawPlot();
                // "passive: false" allows preventDefault() to be called
            }, { passive: false });
        }

        if (options.isGridToggleActive) {
            // Executes when the grid button is pressed
            document.getElementById(id + "-plot-toggle-grid").onclick = () => {
                isGridVisible = !isGridVisible;
                // Styles the button
                if (isGridVisible) document.getElementById(id + "-plot-toggle-grid").classList.remove("transparent");
                else document.getElementById(id + "-plot-toggle-grid").classList.add("transparent")
                // Draws the plot
                publicAPIs.drawPlot();
            }
        }

        if (options.isRefreshActive) {
            // Executes when the refresh button is pressed
            document.getElementById(id + "-plot-refresh").onclick = () => {
                isRunning = true;

                /* -- Zoom setup -- */

                // Stores current zoom level as 1
                currentZoom = 1;
                // Computes the end zoom level, compared to current (which is set to 1)
                const endZoom = options.initialPixelsPerUnit / cs.pixelsPerUnit;
                // Sets the zoom increment factor
                const zoomInc = 1.05;
                // Zoom needs to be performed by default (not locked)
                let isZoomLocked = false;

                /* -- Translation setup -- */

                // The translation is performed by default
                isTranslating = { x: true, y: true };

                /* -- Animation -- */

                animate(() => {
                    // Animates the zoom-in or zoom-out
                    zoomViewport(endZoom > 1 ? zoomInc : (1 / zoomInc), endZoom,
                        () => {
                            if (endZoom > 1) return currentZoom > endZoom / zoomInc;
                            else return currentZoom <= endZoom * zoomInc
                        }, cs.toScreen(0, 0), isZoomLocked);

                    // If the zoom animation is stopped, the zoom is locked
                    // The value of "running" could change depending on the translation animation
                    if (!isRunning) {
                        isZoomLocked = true;
                    }

                    // Animates the translation
                    autoTranslate(options.viewportCenter, 0.05);

                    // The animation keeps running until both the zoom and the translation stop
                    isRunning = isRunning || isTranslating.x || isTranslating.y
                });
            }
        }

        if (options.isFullscreenToggleActive) {
            // Executes when the fullscreen button is pressed
            document.getElementById(id + "-plot-toggle-fullscreen").onclick = () => {
                // Changes the fullscreen status
                isFullscreen = !isFullscreen;

                // Changes the icon
                document.getElementById(id + "-plot-toggle-fullscreen-icon").innerText =
                    isFullscreen ? "fullscreen_exit" : "fullscreen";

                // Stores the fullscreen and original container
                let fullscreenContainer = document.getElementById("fullscreen-container");
                let fullscreenSlidersContainer = document.getElementById("fullscreen-sliders-container");
                let originalPlotContainer = document.getElementById(id + "-plot-container");
                let originalSlidersContainer = document.getElementById(id + "-plot-sliders-container");

                // Sets the body opacity to zero
                document.body.classList.add("transparent");

                // Executes after the body opacity is lowered
                setTimeout(() => {
                    if (isFullscreen) {
                        // Makes the container for fullscreen content visible
                        fullscreenContainer.classList.add("visible");
                        fullscreenSlidersContainer.classList.add("visible")
                        // Hides the scrollbar
                        document.body.classList.add("hidden-overflow");
                        // Moves the plot into the full screen container
                        moveHTML(originalPlotContainer, fullscreenContainer);
                        // Moves the slider panel into the full screen container
                        moveHTML(originalSlidersContainer, fullscreenSlidersContainer);
                        // Styles the plot as fullscreen
                        document.getElementById(id + "-plot").classList.add("fullscreen");
                        // Makes the plot canvas borders squared
                        document.getElementById(id + "-canvas").classList.add("squared-border");
                        // Moves the sliders panel in the top-left corner
                        document.getElementById(id + "-plot-sliders-panel").classList.add("fullscreen");
                    } else {
                        // Hides the container for fullscreen content
                        fullscreenContainer.classList.remove("visible");
                        fullscreenSlidersContainer.classList.remove("visible");
                        // Displays the scrollbar
                        document.body.classList.remove("hidden-overflow");
                        // Moves the plot into its original container
                        moveHTML(fullscreenContainer, originalPlotContainer)
                        // Moves the sliders back where they belong
                        moveHTML(fullscreenSlidersContainer, originalSlidersContainer);
                        // Removes the fullscreen class and style
                        document.getElementById(id + "-plot").classList.remove("fullscreen");
                        // Makes the plot canvas borders rounded
                        document.getElementById(id + "-canvas").classList.remove("squared-border")
                        // Moves back the sliders panel where it was before
                        document.getElementById(id + "-plot-sliders-panel").classList.remove("fullscreen");
                    }

                    // Changes the border radius of every function canvas
                    fPlots.forEach((fPlot) => {
                        if (isFullscreen) fPlot.getCanvas().classList.add("squared-border");
                        else fPlot.getCanvas().classList.remove("squared-border")
                    })

                    // Resizes the canvas
                    publicAPIs.resizeCanvas();
                    // Draws the plot
                    publicAPIs.drawPlot();
                }, 200);

                // After the transition between fullscreen and non-fullscreen (or viceversa) is completed...
                setTimeout(() => {
                    // ...resets the body opacity
                    document.body.classList.remove("transparent");
                }, 300);
            }
        }

        // If some parameter is used
        if (options.parameters.length > 0) {
            options.parameters.forEach((p) => {
                // Executes when the input changes
                document.getElementById(id + "-param-" + p.id).oninput = () => {
                    // Stores the value
                    params[p.id] = parseFloat(document.getElementById(id + "-param-" + p.id).value);

                    // Gets the span with the slider value
                    const sliderValueSpan = document.getElementById(id + "-param-" + p.id + "-value");
                    // MathJax will forget about the math inside said span
                    MathJax.typesetClear([sliderValueSpan]);
                    // The inner text of the span is edited
                    sliderValueSpan.innerText =
                        "$" + p.id + "=" + roundNumberDigit(params[p.id], 2) + "$";
                    // MathJax does its things and re-renders the formula
                    MathJax.typesetPromise([sliderValueSpan]).then(() => {
                        // the new content is has been typeset
                    });

                    // Clears the functions and draws them
                    clearFunctions();
                    drawFunctions();
                }
            })
        }
    }

    /* -- Utils -- */

    /**
     * Moves an HTML element and its children to a new parent.
     * @param {HTMLElement} oldParent Old parent HTML element.
     * @param {HTMLElement} newParent New parent HTML element.
     */
    function moveHTML(oldParent, newParent) {
        while (oldParent.childNodes.length > 0) {
            newParent.appendChild(oldParent.childNodes[0]);
        }
    }

    /*_______________________________________
    |   Animations
    */

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @param {Function} action Function to be executed every frame.
     * @returns Early return if not playing.
     */
    function animate(action) {
        if (!isRunning) {
            return;
        }
        // Executes action to be performed every frame
        action();
        // Draws the ring
        publicAPIs.drawPlot();
        // Keeps executing this function
        requestAnimationFrame(() => { animate(action); });
    }

    /**
     * Zooms the viewport.
     * @param {Number} zoomInc Zoom multiplication factor by which zoom is increased every frame.
     * @param {Number} endZoom Maximum zoom multiplication factor
     * @param {Function} condition Function returning true or false; when true, it ends the zoom.
     * @param {Boolean} isLocked True if zoom must not be performed, false otherwise. 
     */
    function zoomViewport(zoomInc, endZoom, condition,
        zoomCenter = { x: width / 2, y: height / 2 }, isLocked = false) {
        // If zoom isn't locked (needed in case another animations is playing as well, translating e.g.)
        if (!isLocked) {
            // Multiplies the current zoom by the zoom increment factor
            currentZoom *= zoomInc;
            // IF the end condition is met
            if (condition()) {
                // The zoom increment is set so that the final zoom matches endZoom
                zoomInc = endZoom / (currentZoom / zoomInc);
                // Animations is gonna stop
                isRunning = false;
            }
            // Updates the zoom
            cs.updateZoom(zoomInc, { x: zoomCenter.x, y: zoomCenter.y });
        }
    }

    /**
     * Performs a step in the auto translation animation to center a given point.
     * @param {Object} endingPoint Ending point which needs to moved in the middle of the screen.
     * @param {*} translationFactor Translation factor.
     */
    function autoTranslate(endingPoint, translationFactor) {
        // Screen center in cartesian coordinates
        const screenCenterInCartesian = cs.toCartesian(width / 2, height / 2);
        // Total translation vector from current point to ending point, measured in pixels
        const totalTranslation = {
            x: (screenCenterInCartesian.x - endingPoint.x) * cs.pixelsPerUnit,
            y: -(screenCenterInCartesian.y - endingPoint.y) * cs.pixelsPerUnit
        }
        // Sign of the translation vector components
        const translationSign = {
            x: Math.sign(totalTranslation.x),
            y: Math.sign(totalTranslation.y)
        }
        // Translation increment (always positive)
        const tInc = {
            x: translationFactor * Math.abs(totalTranslation.x) + 1,
            y: translationFactor * Math.abs(totalTranslation.y) + 1,
        }
        // Executes if, along the x axes, the increment is greater than the total translation magnitude
        if (tInc.x > Math.abs(totalTranslation.x)) {
            // Increment is set equal to the total translation along the x axes
            tInc.x = Math.abs(totalTranslation.x);
            // Translation is stopped along the x axes
            isTranslating.x = false;
        }
        // Executes if, along the y axes, the increment is greater than the total translation magnitude
        if (tInc.y > Math.abs(totalTranslation.y)) {
            // Increment is set equal to the total translation the y axes
            tInc.y = Math.abs(totalTranslation.y);
            // Translation is stopped along the y axes
            isTranslating.y = false;
        }

        // The translation is performed
        cs.translateOrigin(translationSign.x * tInc.x, translationSign.y * tInc.y);
    }

    /*_______________________________________
    |   Plot
    */

    /**
     * Draws the plots.
     */
    publicAPIs.drawPlot = () => {
        // Clears the canvases
        publicAPIs.clearPlot();

        // ------- STUFF HERE -------
        drawAxisPlot();

        drawFunctions();
    }

    /**
     * Draws the functions
     */
    function drawFunctions() {
        // For each function
        functions.forEach((f) => {
            // Stores the corresponding context
            let fCtx = fCtxs.get(f.id);

            // Sets the style
            fCtx.strokeStyle = f.color;
            fCtx.lineWidth = f.lineWidth;

            // For each domain interval
            f.domain.forEach((interval) => {
                // If the interval is at least partially framed
                if (interval[0] <= cs.cartesianXMax || interval[1] >= cs.cartesianXMin) {
                    // Checks if the interval boundary are infinite (and constrains them if necessary)
                    const intervalStart = interval[0] == -Infinity ? cs.cartesianEdgeXMin : interval[0];
                    const intervalEnd = interval[1] == Infinity ? cs.cartesianEdgeXMax : interval[1];
                    // Computes the loop starting and ending point
                    const loopStart = Math.max(cs.toScreenX(intervalStart), cs.screenXMin);
                    const loopEnd = Math.min(cs.toScreenX(intervalEnd), cs.screenXMax);

                    let isOutOfBound = true;

                    // Draws the function, by first opening a path
                    fCtx.beginPath();
                    // Moves to the first graph point
                    fCtx.moveTo(loopStart, cs.toScreenY(f.definition(cs.toCartesianX(loopStart), params)))

                    // Sets the loop index (which is equal to the pixel position in screen coordinates)
                    let i = loopStart;
                    // While the index is less the
                    while (i < loopEnd) {
                        // Evaluates the function
                        let fValue = f.definition(cs.toCartesianX(i), params);

                        // If the value is greater then max allowed...
                        if (fValue > cs.cartesianEdgeYMax) {
                            // ...it draws the line only if previous value was in bounds
                            if (!isOutOfBound) fCtx.lineTo(i, cs.screenYMin);
                            // Otherwise it just moves
                            else fCtx.moveTo(i, cs.screenYMin)
                            isOutOfBound = true;
                        } else if (fValue < cs.cartesianEdgeYMin) {
                            // If the value is less the min allowed...
                            // ...same as before, it draws the line ony if previous was in bounds
                            if (!isOutOfBound) fCtx.lineTo(i, cs.screenYMax)
                            // Otherwise it just moves
                            else fCtx.moveTo(i, cs.screenYMax)
                            isOutOfBound = true;
                        } else {
                            // If the value is between min and max allowed, it draws the line
                            fCtx.lineTo(i, cs.toScreenY(fValue));
                            isOutOfBound = false;
                        }

                        // Updates the index
                        i = i + 1 > loopEnd ? loopEnd : i + 1;
                    }
                    // Closes the path and draws the line
                    fCtx.stroke();
                }
            });
        })
    }

    function drawAxisPlot() {
        if (isGridVisible) {
            /* -- Secondary grid  -- */
            drawGrid({ x: cs.screenSecondaryGridXMin, y: cs.screenSecondaryGridYMin }, cs.screenSecondaryGridStep,
                options.secondaryGridColor, options.secondaryGridLineWidth
            );

            /* -- Main grid  -- */
            drawGrid({ x: cs.screenGridXMin, y: cs.screenGridYMin }, cs.screenGridStep,
                options.gridColor, options.gridLineWidth
            );

            /* -- Axis -- */
            drawAxis(options.axisColor, options.axisLineWidth);
        }

        /* -- Plot border -- */
        drawBorders(options.gridColor, options.gridLineWidth + 1);

        if (isGridVisible) {
            /* -- Labels -- */
            drawLabels(options.gridColor, 3);

            /* -- Origin --  */
            drawOrigin(options.axisColor, 4);
        }
    }

    /**
     * Draws a grid, given the (x, y) starting points and the step.
     * @param {Object} gridMin Starting points of the grid (x, y).
     * @param {Number} gridStep Grid step value.
     * @param {String} color Color of the grid.
     * @param {Number} lineWidth Line width of the grid lines.
     */
    function drawGrid(gridMin, gridStep, color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the vertical grid lines
        for (i = gridMin.x; i < cs.screenXMax; i += gridStep) {
            if (i > cs.screenXMin) {
                axisCtx.moveTo(i, cs.screenYMin);
                axisCtx.lineTo(i, cs.screenYMax);
            }
        }
        // Draws the horizontal grid lines
        for (j = gridMin.y; j < cs.screenYMax; j += gridStep) {
            if (j > cs.screenYMin) {
                axisCtx.moveTo(cs.screenXMin, j);
                axisCtx.lineTo(cs.screenXMax, j);
            }
        }
        axisCtx.stroke();
    }

    /**
     * Draws the axis of the plot.alpha
     * @param {String} color Color of the axis.
     * @param {Number} lineWidth Line width of the axis.
     */
    function drawAxis(color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the x axes
        const xAxes = cs.toScreenX(0);
        if (xAxes > cs.screenXMin) {
            axisCtx.moveTo(xAxes, cs.screenYMin);
            axisCtx.lineTo(xAxes, cs.screenYMax);
        }
        // Draws the y axes
        const yAxes = cs.toScreenY(0);
        if (yAxes > cs.screenYMin) {
            axisCtx.moveTo(cs.screenXMin, yAxes);
            axisCtx.lineTo(cs.screenXMax, yAxes);
        }
        axisCtx.stroke();
    }

    /**
     * Draws the origin dot.
     * @param {String} color Color of the origin dot.
     * @param {Number} size Size of the origin dot.
     */
    function drawOrigin(color, size) {
        axisCtx.fillStyle = color;

        axisCtx.beginPath();
        axisCtx.arc(cs.toScreenX(0), cs.toScreenY(0), size, 0, 2 * Math.PI);
        axisCtx.fill();
    }

    /**
     * Draws the border of the plot.
     * @param {String} color Color of the border.
     * @param {Number} lineWidth Line width of the border.
     */
    function drawBorders(color, lineWidth) {
        // Sets the style
        axisCtx.strokeStyle = color;
        axisCtx.lineWidth = lineWidth;

        axisCtx.beginPath();
        // Draws the right border
        if (cs.screenXMin > 0) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMin, cs.screenYMax);
        }
        // Draws the left border
        if (cs.screenXMax < width) {
            axisCtx.moveTo(cs.screenXMax, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMax);
        }
        // Draws the top border
        if (cs.screenYMin > 0) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMin);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMin);
        }
        // Draws the bottom border
        if (cs.screenYMax < height) {
            axisCtx.moveTo(cs.screenXMin, cs.screenYMax);
            axisCtx.lineTo(cs.screenXMax, cs.screenYMax);
        }
        axisCtx.stroke();
    }

    function drawLabels(color, lineWidth) {
        // Sets the style of the outline
        axisCtx.strokeStyle = options.backgroundColor;
        axisCtx.lineWidth = lineWidth;

        // Sets the style of the label
        axisCtx.fillStyle = color;
        axisCtx.font = options.labelSize + "px sans-serif";

        // Computes the axis coordinates
        const xAxes = cs.toScreenX(0);
        const yAxes = cs.toScreenY(0);

        axisCtx.beginPath();

        /* -- Labels along the x axes -- */

        for (i = cs.screenGridXMin; i < cs.screenXMax + 2; i += cs.screenGridStep) {
            if (i > cs.screenXMin - 2) {
                // Label numerical value
                const labelValue = roundNumberDigit(cs.toCartesianX(i), cs.maxNumberOfGridLabelDigits);

                // If it's not the origin
                if (labelValue != 0) {
                    // Label text
                    const labelText = labelValue.toString();
                    // Label measure
                    const labelMeasure = axisCtx.measureText(labelText);
                    // Horizontal position of the label
                    const xPos = i -
                        // Moves to the left by half the label width
                        (labelMeasure.width
                            // Moves to the left if negative, to compensate for minus sign
                            + (labelValue < 0 ? axisCtx.measureText("-").width : 0)) / 2;
                    // Vertical position
                    const yPos = getLabelPosition(yAxes, cs.screenYMin, cs.screenYMax,
                        {
                            min: 0,
                            max: -5 - options.labelSize * dpi
                        },
                        {
                            default: options.labelSize * dpi,
                            min: options.labelSize * dpi,
                            max: -5
                        }
                    );

                    // Draws the label
                    axisCtx.strokeText(labelValue, xPos, yPos);
                    axisCtx.fillText(labelValue, xPos, yPos);
                }
            }
        }

        /* -- Labels along the y axes -- */

        for (j = cs.screenGridYMin; j < cs.screenYMax + 2; j += cs.screenGridStep) {
            if (j > cs.screenYMin - 2) {
                // Label numerical value
                const labelValue = roundNumberDigit(cs.toCartesianY(j), cs.maxNumberOfGridLabelDigits);

                // If it's not the origin
                if (labelValue != 0) {
                    // Label text
                    const labelText = labelValue.toString();
                    // Label measure
                    const labelMeasure = axisCtx.measureText(labelText);
                    // Horizontal label offset
                    const xOffset = labelMeasure.width + 8;
                    // Horizontal position of the label; the label is moved to the left by its width
                    const xPos = getLabelPosition(xAxes, cs.screenXMin, cs.screenXMax,
                        {
                            min: xOffset + 8,
                            max: 0
                        },
                        {
                            default: -xOffset,
                            min: 5,
                            max: -xOffset
                        }
                    );
                    // Vertical position, the label is moved up by half its height
                    const yPos = j + (options.labelSize / 2) / dpi;

                    // Draws the label
                    axisCtx.strokeText(labelValue, xPos, yPos);
                    axisCtx.fillText(labelValue, xPos, yPos);
                }

            }
        }

        /* -- Origin label -- */

        // Cartesian origin in screen coordinates
        const origin = cs.toScreen(0, 0)
        // Origin label text
        const labelText = "0";
        // Label measure
        const labelMeasure = axisCtx.measureText(labelText);

        // If the origin in on screen
        if (origin.x > cs.screenXMin && origin.x < cs.screenXMax + labelMeasure.width + 8 &&
            origin.y > cs.screenYMin - options.labelSize * dpi && origin.y < cs.screenYMax) {
            // Horizontal position
            const xPos = origin.x - labelMeasure.width - 8;
            // Vertical position
            const yPos = origin.y + options.labelSize * dpi;
            // Draws the label
            axisCtx.strokeText("0", xPos, yPos);
            axisCtx.fillText("0", xPos, yPos);
        }

        axisCtx.closePath();
    }

    /**
     * Gets the label position given the axes coordinate, the viewport edges and the offset.
     * @param {Number} axes Screen coordinate of the axes.
     * @param {*} minValue Min screen coordinate along the perpendicular axes.
     * @param {*} maxValue Max screen coordinate along the perpendicular axes
     * @param {*} tolerance Tolerance when reaching the min and max screen coordinates.
     * @param {Object} offset Label offset.
     * @returns The label position.
     */
    const getLabelPosition = (axes, minValue, maxValue, tolerance, offset) => {
        if (axes < minValue + tolerance.min) {
            return minValue + offset.min;
        } else if (axes > maxValue + tolerance.max) {
            return maxValue + offset.max;
        } else {
            return axes + offset.default;
        }
    }

    /**
     * Clears the plots.
     */
    publicAPIs.clearPlot = () => {
        axisCtx.clearRect(0, 0, width + 1, height + 1)

        axisCtx.fillStyle = options.backgroundColor;

        axisCtx.beginPath();
        axisCtx.rect(0, 0, width + 1, height + 1);
        axisCtx.fill();

        clearFunctions();
    }

    /**
     * Clears the function plots
     */
    function clearFunctions() {
        fCtxs.forEach((ctx) => {
            ctx.clearRect(0, 0, width + 1, height + 1);
        })
    }

    init();

    // Returns public methods
    return publicAPIs;
}