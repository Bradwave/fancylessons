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
     * Functions contexts map.
     */
    let fCtxs = new Map();

    /*_______________________________________
    |   General variables
    */

    /**
     * True if the renderer is running, false otherwise.
     */
    let running = true;

    /**
     * True if touch on the canvas started, false otherwise.
     */
    let isLeftMouseDown = false;

    let touchPosition;

    /*_______________________________________
    |   Methods
    */

    /**
     * Inits the plot.
     */
    function init() {
        functions.forEach((f) => {
            const functionPlot = new plotStructure(f.id + "-" + id, { alpha: true });
            fCtxs.set(f.id, functionPlot.getCtx());
        })

        // Updates width and heigh of the canvas
        updateCanvasDimension();

        // Create a new coordinate system
        cs = new CoordinateSystem(width, height, { x: 0, y: 0 }, 0.1);

        // ------- STUFF HERE -------
    }

    /*_______________________________________
    |   Canvas and canvas dimension
    */

    const axisPlot = new plotStructure(id, { alpha: false });
    const axisCtx = axisPlot.getCtx();

    /**
     * Updates width and heigh of the canvas.
     */
    function updateCanvasDimension() {
        axisPlot.resizeCanvas();
        width = axisPlot.getWidth();
        height = axisPlot.getHeight();
    }


    /**
     * Resizes the canvas to fill the HTML canvas element.
     */
    publicAPIs.resizeCanvas = () => {
        // Updates width and heigh of the canvas
        updateCanvasDimension();
        // Updates the edges of the canvas in the coordinate system
        cs.updateEdges(width, height);
    }

    /*_______________________________________
    |   Events
    */

    /* -- Axis translation -- */

    // Executes when a mouse button si pressed the canvas
    axisPlot.getCanvas().onmousedown = (e) => {
        // If the left button is clicked
        if (e.button == 0) {
            isLeftMouseDown = true;
            // The mouse position is stored
            touchPosition = { x: e.clientX * dpi, y: e.clientY * dpi };
        }
    };

    // Executes when a mouse button is released on the whole document
    document.onmouseup = (e) => {
        if (e.button == 0) {
            isLeftMouseDown = false;
        }
    };

    // Executes when the mouse is moved on the whole document
    document.onmousemove = (e) => {
        // If the left mouse is pressed
        if (isLeftMouseDown) {
            // Stores the current mouse position
            const newTouchPosition = { x: e.clientX * dpi, y: e.clientY * dpi }
            // Translates the axis
            translateAxis(newTouchPosition);
        }
    };

    // Executes when the touch starts on the canvas
    axisPlot.getCanvas().ontouchstart = (e) => {
        // Stores the current touch position
        touchPosition = getTouchPosition(e);
    };


    // Executes when a touch move event is detected
    document.ontouchmove = (e) => {
        // Stores the current touch position
        const newTouchPosition = getTouchPosition(e);
        // Translates the axis
        translateAxis(newTouchPosition);
    };

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

    /*_______________________________________
    |   Plot
    */

    /**
     * A (probably poor) implementation of the pause-able loop.
     * @returns Early return if not playing.
     */
    function animate() {
        if (!running) {
            return;
        }
        // Draws the ring
        publicAPIs.drawPlot();
        // Keeps executing this function
        requestAnimationFrame(animate);
    }

    /**
     * Draws the plots.
     */
    publicAPIs.drawPlot = () => {
        // Clears the canvases
        publicAPIs.clearPlot();

        // ------- STUFF HERE -------
        drawGrid();
    }

    /**
     * Clears the plots.
     */
    publicAPIs.clearPlot = () => {
        axisCtx.fillStyle = getCssVariable("very-light-grey");

        axisCtx.beginPath();
        axisCtx.rect(0, 0, width, height);
        axisCtx.fill();
    }

    function drawGrid() {
        axisCtx.fillStyle = getCssVariable("accent");

        axisCtx.beginPath();
        axisCtx.rect(cs.renderingXMin, cs.renderingYMin, cs.renderingXMax - cs.renderingXMin, cs.renderingYMax - cs.renderingYMin)
        axisCtx.fill();

        axisCtx.fillStyle = getCssVariable("highlight");

        axisCtx.beginPath();
        axisCtx.arc(cs.toScreenX(0), cs.toScreenY(0), 5, 0, 2 * Math.PI);
        axisCtx.fill();
    }

    init();

    // Returns public methods
    return publicAPIs;
}