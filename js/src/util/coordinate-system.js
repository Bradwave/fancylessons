/**
 * Manages the coordinate system of a plot.
 * It handles the conversion between the cartesian and screen frames of reference.
 */
class CoordinateSystem {

    /*
        FRAMES OF REFERENCE
        SCREEN:     CARTESIAN:

                           y
                     ..... ^ .....   
        0 ---- > x   :     |     :
        |      :     ----- 0 --- > x
        |      :     :     |     :
        v ......     ..... | .....
        y
    */

    #initialConfig = {
        center: { x: undefined, y: undefined },
        pixelsPerUnit: undefined
    };

    /**
     * Edges of the screen and cartesian frames of reference.
     */
    #edges = {
        screen: { xMin: 0, xMax: undefined, yMin: 0, yMax: undefined },
        cartesian: { xMin: -10000, xMax: 10000, yMin: -10000, yMax: 10000 }
    };

    /**
     * Edges of the rendering viewport in cartesian and screen coordinates.
     */
    #viewport = {
        screen: { xMin: undefined, xMax: undefined, yMin: undefined, yMax: undefined },
        cartesian: { xMin: undefined, xMax: undefined, yMin: undefined, yMax: undefined }
    };

    /**
     * Origin of the cartesian frame of reference in screen coordinates.
     */
    #cartesianOriginInScreen = { x: undefined, y: undefined };

    /**
     * Origin of the screen frame of reference in cartesian coordinates.
     */
    #screenOriginInCartesian = { x: undefined, y: undefined };

    /**
     * Number of pixels per cartesian unit.
     */
    #pixelsPerUnit;

    /**
     * Minimum number of pixels per cartesian unit.
     */
    #minPixelsPerUnit;

    /**
     * Maximum number of pixels per cartesian unit.
     */
    #maxPixelsPerUnit = 100000;

    /**
     * Step for the main grid in both cartesian units and pixel units.
     */
    #gridStep = { cartesian: undefined, screen: undefined };

    /**
     * Step for the secondary grid in both cartesian units and pixel units.
     */
    #secondaryGridStep = { cartesian: undefined, screen: undefined };

    /**
     * Main grid starting points in both cartesian and screen coordinates.
     */
    #grid = {
        screen: { xMin: undefined, yMin: undefined },
        cartesian: { xMin: undefined, yMax: undefined }
    }

    /**
     * Secondary grid starting points in both cartesian and screen coordinates.
     */
    #secondaryGrid = {
        screen: { xMin: undefined, yMin: undefined },
        cartesian: { xMin: undefined, yMax: undefined }
    }

    /**
     * Constructs the coordinate system.
     * @param {Number} width Width of the canvas.
     * @param {Number} height Height of the canvas.
     * @param {Object} center Center of the canvas in cartesian coordinates (x, y);
     * @param {Number} pixelsPerUnit Number of pixels per cartesian unit.
     */
    constructor(width, height, center, pixelsPerUnit) {
        // Stores the initial config
        this.#initialConfig = {
            center: center,
            pixelsPerUnit: pixelsPerUnit
        }

        // Stores the pixels per unit
        this.#pixelsPerUnit = pixelsPerUnit;

        // Updates the system.
        this.updateSystem(width, height, center);
    }

    /**
     * Updates the edges of the screen reference frame and the edges of the viewport.
     * Computes the screen origin in cartesian coordinates and the cartesian origin in screen coordinates.
     * @param {Number} width Width of the canvas.
     * @param {*} height Height of the canvas.
     */
    updateSystem(width, height, center = {
        x: this.toCartesianX(this.#edges.screen.xMax / 2),
        y: this.toCartesianY(this.#edges.screen.yMax / 2)
    }) {
        // Sets the edges of screen frame of reference, based on width and height of the canvas
        this.#setScreenEdges(width, height);
        // Computes the origin of the screen frames of reference in cartesian coordinates
        this.#calcScreenOriginInCartesian(center);
        // Computes the origin of the cartesian frame of reference in screen coordinates
        this.#calcCartesianOriginInScreen();
        // Computes the edges of the viewport
        this.#calcViewport(width, height);
        // Computes the grid skip
        this.#calcGridStep();
        // Computes the grid starting points
        this.#calcGrid();
    }

    /**
     * Sets the edges of screen frame of reference, based on width and height of the canvas.
     * @param {Number} width Width of the canvas.
     * @param {*} height Height of the canvas.
     */
    #setScreenEdges(width, height) {
        // Sets the edges of the screen frame of reference
        this.#edges.screen = { xMin: 0, xMax: width, yMin: 0, yMax: height }
        // Stores the minimum number of pixels per cartesian unit
        this.#minPixelsPerUnit = this.#getMinPixelsPerUnit();
    }

    /**
     * Computes and gets the minimum number of pixels per unit, based on the canvas size and the cartesian edges.
     */
    #getMinPixelsPerUnit() {
        return (this.#edges.screen.xMax >= this.#edges.screen.yMax) *
            this.#edges.screen.xMax / (this.#edges.cartesian.xMax - this.#edges.cartesian.xMin) * 0.4 +
            (this.#edges.screen.xMax < this.#edges.screen.yMax) *
            this.#edges.screen.yMax / (this.#edges.cartesian.yMax - this.#edges.cartesian.yMin) * 0.4
    }

    /**
     * Computes the origin of the screen frames of reference in cartesian coordinates.
     * It requires the screen edges to be set and the pixels per cartesian unit to be stored.
     * @param {*} center Center of the canvas in cartesian coordinates.
     */
    #calcScreenOriginInCartesian(center) {
        this.#screenOriginInCartesian = {
            x: center.x - this.#edges.screen.xMax / (2 * this.#pixelsPerUnit),
            y: center.y + this.#edges.screen.yMax / (2 * this.#pixelsPerUnit)
        }
    }

    /**
     * Computes the origin of the cartesian frame of reference in screen coordinates.
     * It requires screen origin in cartesian coordinates to be computed already.
     */
    #calcCartesianOriginInScreen() {
        this.#cartesianOriginInScreen = this.toScreen(0, 0);
    }

    /**
     * Computes the edges of the viewport, which needs to be rendered.
     * It requires the edges of the screen frame of reference to be computed already.
     */
    #calcViewport() {
        // Sets the edges in cartesian coordinates
        this.#viewport.cartesian = {
            xMin: Math.max(this.toCartesianX(this.#edges.screen.xMin), this.#edges.cartesian.xMin),
            xMax: Math.min(this.toCartesianX(this.#edges.screen.xMax), this.#edges.cartesian.xMax),
            yMin: Math.max(this.toCartesianY(this.#edges.screen.yMax), this.#edges.cartesian.yMin),
            yMax: Math.min(this.toCartesianY(this.#edges.screen.yMin), this.#edges.cartesian.yMax)
        };

        // Sets the edges in 
        this.#viewport.screen = {
            xMin: Math.max(this.toScreenX(this.#edges.cartesian.xMin), 0),
            xMax: Math.min(this.toScreenX(this.#edges.cartesian.xMax), this.#edges.screen.xMax,),
            yMin: Math.max(this.toScreenY(this.#edges.cartesian.yMax), 0),
            yMax: Math.min(this.toScreenY(this.#edges.cartesian.yMin), this.#edges.screen.yMax,)
        }
    }

    /**
     * Computes the main and secondary grid steps
     */
    #calcGridStep() {
        // Stores the cartesian width of the viewport
        const cartesianWidth = (this.#viewport.screen.xMax - this.#viewport.screen.xMin) / this.#pixelsPerUnit;
        // Stores the cartesian height of the viewport
        const cartesianHeight = (this.#viewport.screen.yMax - this.#viewport.screen.yMin) / this.#pixelsPerUnit;
        // Stores the min dimension of the viewport
        const minCartesianDimension = Math.min(cartesianWidth, cartesianHeight);

        // Computes the step of the main grid in cartesian units
        this.#gridStep.cartesian = Math.pow(10, Math.ceil((Math.log10(minCartesianDimension) - 1)));
        // Converts the step for the main grid in pixel units.
        this.#gridStep.screen = this.#gridStep.cartesian * this.#pixelsPerUnit;

        // Computes the step of the secondary grid in cartesian units
        this.#secondaryGridStep.cartesian = this.#gridStep.cartesian / 5;
        // Computes the step of the secondary grid in pixel units
        this.#secondaryGridStep.screen = this.#gridStep.screen / 5;
    }

    /**
     * Computes the grid starting points
     */
    #calcGrid() {
        /* -- Main grid -- */

        // Computes the main grid starting point on the x axes in cartesian coordinates
        this.#grid.cartesian.xMin = this.#getGridMin(this.#gridStep.cartesian, this.#viewport.cartesian.xMin, -1);
        // Computes the main grid starting point on the x axes in screen coordinates
        this.#grid.screen.xMin = this.toScreenX(this.#grid.cartesian.xMin);

        // Computes the main grid starting point on the y axes in cartesian coordinates
        this.#grid.cartesian.yMax = this.#getGridMin(this.#gridStep.cartesian, this.#viewport.cartesian.yMax, +1);

        // Computes the main grid starting point on the y axes in screen coordinates
        this.#grid.screen.yMin = this.toScreenY(this.#grid.cartesian.yMax);

        /* -- Secondary grid -- */

        // Computes the secondary grid starting point on the x axes in cartesian coordinates
        this.#secondaryGrid.cartesian.xMin =
            this.#getGridMin(this.#secondaryGridStep.cartesian, this.#viewport.cartesian.xMin, -1);
        // Computes the secondary grid starting point on the x axes in screen coordinates
        this.#secondaryGrid.screen.xMin = this.toScreenX(this.#secondaryGrid.cartesian.xMin)

        // Computes the secondary grid starting point on the y axes in cartesian coordinates
        this.#secondaryGrid.cartesian.yMax =
            this.#getGridMin(this.#secondaryGridStep.cartesian, this.#viewport.cartesian.yMax, +1);
        // Computes the secondary grid starting point on the y axes in screen coordinates
        this.#secondaryGrid.screen.yMin = this.toScreenY(this.#secondaryGrid.cartesian.yMax)
    }

    /**
     * Computes the starting point for a grid, given the step and the minimum viewport value.
     * @param {Number} step Step of the grid.
     * @param {Number} viewportMin Minimum value of the viewport along a certain axes.
     * @param {Number} inc -1 for the x axes, +1 for the y axes.
     * @returns 
     */
    #getGridMin(step, viewportMin, inc) {
        return step * (Math.floor(viewportMin / step) + inc)
    }

    /**
     * Gets the main grid step, in pixels unit.
     */
    get screenGridStep() {
        return this.#gridStep.screen;
    }

    /**
     *  Gets the secondary grid step, in pixels unit.
     */
    get screenSecondaryGridStep() {
        return this.#secondaryGridStep.screen;
    }

    /**
     * Gets the main grid starting point along the x axes.
     */
    get screenGridXMin() {
        return this.#grid.screen.xMin;
    }

    /**
     * Gets the main grid starting point along the y axes.
     */
    get screenGridYMin() {
        return this.#grid.screen.yMin;
    }

    /**
     * Gets the secondary grid starting point along the x axes.
     */
    get screenSecondaryGridXMin() {
        return this.#secondaryGrid.screen.xMin;
    }

    /**
     * Gets the secondary grid starting point along the y axes.
     */
    get screenSecondaryGridYMin() {
        return this.#secondaryGrid.screen.yMin;
    }

    get maxNumberOfGridLabelDigits() {
        return Math.round(Math.log10(this.#maxPixelsPerUnit) - 2);
    }

    /**
     * Translates the origin of both the screen and cartesian frame of reference by a certain amount.
     * @param {Number} x Translation amount along the x axes in screen units (pixels).
     * @param {Number} y Translation amount along the y axes in screen units (pixels).
     */
    translateOrigin(x, y) {
        // Moves the cartesian origin in screen coordinates
        this.#cartesianOriginInScreen.x += x;
        this.#cartesianOriginInScreen.y += y;

        // Computes the screen origin in cartesian coordinates
        this.#screenOriginInCartesian = this.toCartesian(0, 0);

        // Updates the viewport, the grid step and the grid starting points
        this.#calcViewport();
        this.#calcGridStep();
        this.#calcGrid();
    }

    /**
     * Updates the zoom level.
     * @param {Number} zoomFactor Zoom multiplying factor.
     * @param {Object} zoomCenter Center of the zoom in screen coordinates (x, y);
     */
    updateZoom(zoomFactor, zoomCenter) {
        // Stores the current number of pixels per cartesian unit
        const oldPpu = this.#pixelsPerUnit;

        // Constrains the pixels per unit
        this.#pixelsPerUnit = constrain(
            this.#pixelsPerUnit * zoomFactor, // New number of pixels per cartesian unit
            this.#minPixelsPerUnit,// Min number of pixels per cartesian unit
            this.#maxPixelsPerUnit // Max number of pixels per cartesian unit
        );

        // Computes the scale change
        const scaleChange = this.#pixelsPerUnit / oldPpu - 1;

        // Translates the origin in order to keep the center of zoom constant
        this.translateOrigin(
            -((zoomCenter.x - this.#cartesianOriginInScreen.x) * scaleChange),
            ((this.#cartesianOriginInScreen.y - zoomCenter.y) * scaleChange),
        );
    }

    /**
     * Gets the pixels per cartesian unit.
     */
    get pixelsPerUnit() {
        return this.#pixelsPerUnit;
    }

    /**
     * Gets the rendering viewport minimum x value in screen coordinates.
     */
    get screenXMin() {
        return this.#viewport.screen.xMin;
    }

    /**
     * Gets the rendering viewport maximum x value in screen coordinates.
     */
    get screenXMax() {
        return this.#viewport.screen.xMax;
    }

    /**
     * Gets the rendering viewport minimum y value in screen coordinates.
     */
    get screenYMin() {
        return this.#viewport.screen.yMin;
    }

    /**
     * Gets the rendering viewport maximum y value in screen coordinates.
     */
    get screenYMax() {
        return this.#viewport.screen.yMax;
    }

    /**
     * Gets the rendering viewport minimum x value in screen coordinates.
     */
    get cartesianXMin() {
        return this.#viewport.cartesian.xMin;
    }

    /**
     * Gets the rendering viewport maximum x value in cartesian coordinates.
     */
    get cartesianXMax() {
        return this.#viewport.cartesian.xMax;
    }

    /**
     * Gets the rendering viewport minimum y value in cartesian coordinates.
     */
    get cartesianYMin() {
        return this.#viewport.cartesian.yMin;
    }

    /**
     * Gets the y value bottom edge of rendering viewport in cartesian coordinates.
     */
    get cartesianYMax() {
        return this.#viewport.cartesian.yMax;
    }

    /**
     * Gets the cartesian coordinate of the left edge of the plot.
     */
    get cartesianEdgeXMin() {
        return this.#edges.cartesian.xMin;
    }

    /**
     * Gets the cartesian coordinate of the right edge of the plot.
     */
    get cartesianEdgeXMax() {
        return this.#edges.cartesian.xMax;
    }

    /**
     * Gets the cartesian coordinate of the bottom edge of the plot.
     */
    get cartesianEdgeYMin() {
        return this.#edges.cartesian.yMin;
    }

    /**
     * Gets the cartesian coordinate of the top edge of the plot.
     */
    get cartesianEdgeYMax() {
        return this.#edges.cartesian.yMax;
    }

    /**
     * Converts x in screen coordinates to cartesian coordinates.
     * It requires cartesian origin in screen coordinates to be computed.
     * @param {Number} sx x in screen coordinates.
     * @returns x in cartesian coordinates.
     */
    toCartesianX(sx) {
        return (sx - this.#cartesianOriginInScreen.x) / this.#pixelsPerUnit;
    }

    /**
     * Converts y in screen coordinates to cartesian coordinates.
     * It requires cartesian origin in screen coordinates to be computed.
     * @param {Number} sy y in screen coordinates.
     * @returns y in cartesian coordinates.
     */
    toCartesianY(sy) {
        return (this.#cartesianOriginInScreen.y - sy) / this.#pixelsPerUnit;
    }

    /**
     * Converts screen coordinates to cartesian coordinates.
     * It requires cartesian origin in screen coordinates to be computed.
     * @param {Number} sx x in screen coordinates.
     * @param {Number} sy y in screen coordinates.
     * @returns {Object} Point (x, y) in cartesian coordinates.
     */
    toCartesian(sx, sy) {
        return {
            x: this.toCartesianX(sx),
            y: this.toCartesianY(sy)
        };
    }

    /**
     * Converts x in cartesian coordinates to screen coordinates.
     * It requires screen origin in cartesian coordinates to be computed.
     * @param {Number} x x in cartesian coordinates.
     * @returns x in screen coordinates.
     */
    toScreenX(x) {
        return (x - this.#screenOriginInCartesian.x) * this.#pixelsPerUnit;
    }

    /**
     * Converts y in cartesian coordinates to screen coordinates.
     * It requires screen origin in cartesian coordinates to be computed.
     * @param {Number} y y in cartesian coordinates.
     * @returns y in screen coordinates.
     */
    toScreenY(y) {
        return (this.#screenOriginInCartesian.y - y) * this.#pixelsPerUnit;
    }

    /**
    * Converts cartesian coordinates to screen coordinates.
    * It requires screen origin in cartesian coordinates to be computed.
    * @param {Number} x x in cartesian coordinates.
    * @param {Number} y y in cartesian coordinates.
    */
    toScreen(x, y) {
        return {
            x: this.toScreenX(x),
            y: this.toScreenY(y)
        }
    }
}