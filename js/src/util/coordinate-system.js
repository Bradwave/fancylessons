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

    /**
     * Edges of the screen and cartesian frames of reference.
     */
    #edges = {
        screen: { xMin: 0, xMax: undefined, yMin: 0, yMax: undefined },
        cartesian: { xMin: -1000, xMax: 1000, yMin: -1000, yMax: 1000 }
    };

    /**
     * Edges of the rendering viewport in cartesian and screen coordinates.
     */
    #renderingEdges = {
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

    #zoom;

    constructor(width, height, center, pixelsPerUnit) {
        // Stores the pixels per unit
        this.#pixelsPerUnit = pixelsPerUnit;

        // Sets the edges of screen frame of reference, based on width and height of the canvas
        this.#setScreenEdges(width, height);
        // Computes the origin of the screen frames of reference in cartesian coordinates
        this.#calcScreenOriginInCartesian(center);
        // Computes the origin of the cartesian frame of reference in screen coordinates
        this.#calcCartesianOriginInScreen();
        // Computes the edges of the viewport
        this.#calcRenderingEdges(width, height);
    }

    /**
     * Sets the edges of screen frame of reference, based on width and height of the canvas.
     * @param {Number} width Width of the canvas.
     * @param {*} height Height of the canvas.
     */
    #setScreenEdges(width, height) {
        // Sets the edges of the screen frame of reference
        this.#edges.screen = { xMin: 0, xMax: width, yMin: 0, yMax: height }
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
    #calcRenderingEdges() {
        // Sets the edges in cartesian coordinates
        this.#renderingEdges.cartesian = {
            xMin: Math.max(this.toCartesianX(this.#edges.screen.xMin), this.#edges.cartesian.xMin),
            xMax: Math.min(this.toCartesianX(this.#edges.screen.xMax), this.#edges.cartesian.xMax),
            yMin: Math.max(this.toCartesianY(this.#edges.screen.xMin), this.#edges.cartesian.yMin),
            yMax: Math.max(this.toCartesianY(this.#edges.screen.xMax), this.#edges.cartesian.yMax)
        };

        // Sets the edges in 
        this.#renderingEdges.screen = {
            xMin: Math.max(0, this.toScreenX(this.#edges.cartesian.xMin)),
            xMax: Math.min(this.#edges.screen.xMax, this.toScreenX(this.#edges.cartesian.xMax)),
            yMin: Math.max(0, this.toScreenY(this.#edges.cartesian.yMax)),
            yMax: Math.min(this.#edges.screen.yMax, this.toScreenY(this.#edges.cartesian.yMin))
        }
    }

    /**
     * Updates the edges of the screen reference frame and the edges of the viewport.
     * @param {Number} width Width of the canvas.
     * @param {*} height Height of the canvas.
     */
    updateEdges(width, height) {
        this.#setScreenEdges(width, height);
        this.#calcRenderingEdges();
    }

    /**
     * Translates the origin of both the screen and cartesian frame of reference by a certain amount.
     * @param {Number} x Translation amount along the x axes in screen units (pixels).
     * @param {Number} y Translation amount along the y axes in screen units (pixels).
     */
    translateOrigin(x, y) {
        this.#cartesianOriginInScreen.x += x;
        this.#cartesianOriginInScreen.y += y;

        this.#screenOriginInCartesian = this.toCartesian(0, 0);

        this.#calcRenderingEdges();
    }

    get renderingXMin() {
        return this.#renderingEdges.screen.xMin;
    }

    get renderingXMax() {
        return this.#renderingEdges.screen.xMax;
    }

    get renderingYMin() {
        return this.#renderingEdges.screen.yMin;
    }

    get renderingYMax() {
        return this.#renderingEdges.screen.yMax;
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