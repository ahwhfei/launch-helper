/*
 * This file wraps several WebGL constructs and provides a simple, single texture based WebGLCanvas as well as a
 * specialized YUVWebGLCanvas that can handle YUV->RGB conversion.
 */


/**
 * Creates a new prototype object derived from another objects prototype along with a list of additional properties.
 *
 * @param base object whose prototype to use as the created prototype object's prototype
 * @param properties additional properties to add to the created prototype object
 */
function webGlInherit(base, properties) {
    var prot = Object.create(base.prototype);
    for (var p in properties) {
        prot[p] = properties[p];
    }
    return prot;
}

/**
 * Represents a WebGL shader script.
 */
var WebGLScript = (function script() {
    function constructor() { }

    constructor.createFromElementId = function (id) {
        var script = document.getElementById(id);

        // Didn't find an element with the specified ID, abort.
        if (!script) {
            throw WEBGLERROR.NOT_SUPPORTED;
        }

        // Walk through the source element's children, building the shader source string.
        var source = "";
        var currentChild = script.firstChild;
        while (currentChild) {
            if (currentChild.nodeType == 3) {
                source += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }

        var res = new constructor();
        res.type = script.type;
        res.source = source;
        return res;
    };

    constructor.createFromSource = function (type, source) {
        var res = new constructor();
        res.type = type;
        res.source = source;
        return res;
    };
    return constructor;
})();

/**
 * Represents a WebGL shader object and provides a mechanism to load shaders from HTML
 * script tags.
 */
var WebGLShader = (function shader() {
    function constructor(gl, mgr, script) {
        this.gl = gl;
        // Now figure out what type of shader script we have, based on its MIME type.
        if (script.type == "x-shader/x-fragment") {
            this.shader = gl.createShader(gl.FRAGMENT_SHADER);
        }
        else if (script.type == "x-shader/x-vertex") {
            this.shader = gl.createShader(gl.VERTEX_SHADER);
        }
        else {
            throw WEBGLERROR.NOT_SUPPORTED;
        }

        if (mgr) {
            mgr.appendShader(this);
        }
        // Send the source to the shader object.
        gl.shaderSource(this.shader, script.source);

        // Compile the shader program.
        gl.compileShader(this.shader);

        // See if it compiled successfully.
        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            throw WEBGLERROR.NOT_SUPPORTED;
        }
    }
    constructor.prototype = {
        deleteData: function () {
            var gl = this.gl;
            gl.deleteShader(this.shader);
        }

    };
    return constructor;
})();

var WebGLProgram = (function () {
    function constructor(gl, mgr) {
        this.gl = gl;
        this.program = this.gl.createProgram();
        if (mgr) {
            mgr.appendProgramme(this);
        }
    }
    constructor.prototype = {
        attach: function (shader) {
            this.gl.attachShader(this.program, shader.shader);
        },
        link: function () {
            this.gl.linkProgram(this.program);
            // If creating the shader program failed.
            if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
                throw WEBGLERROR.NOT_SUPPORTED;
            }
        },
        use: function () {
            this.gl.useProgram(this.program);
        },
        getAttributeLocation: function (name) {
            return this.gl.getAttribLocation(this.program, name);
        },
        setMatrixUniform: function (name, array) {
            var uniform = this.gl.getUniformLocation(this.program, name);
            this.gl.uniformMatrix4fv(uniform, false, array);
        },
        getUniformLocation: function (name) {
            return this.gl.getUniformLocation(this.program, name);
        },
        deleteData: function () {
            var gl = this.gl;
            gl.deleteProgram(this.program);
        }

    };
    return constructor;
})();

/*
 * It contain handle for memory location that allocate to that context
 * and on reinitialize it deallocate that memory reference
 */
var WebGLManager = (function() {
    var bufferArray = new Array(0);
    var framebufferArray = new Array(0);
    var programmeArray = new Array(0);
    var textureArray = new Array(0);
    var renderbufferArray = new Array(0);
    var shaderArray = new Array(0);
    function constructor() {
    }

    constructor.prototype = {
        appendBuffer: function (buffer) {
            bufferArray[bufferArray.length] = buffer;
        },
        appendFrameBuffer: function (fb) {
            framebufferArray[framebufferArray.length] = fb;
        },
        appendProgramme: function (prog) {
            programmeArray[programmeArray.length] = prog;
        },
        appendTexture: function (tx) {
            textureArray[textureArray.length] = tx;
        },
        appendRenderBuffer: function (rb) {
            renderbufferArray[renderbufferArray.length] = rb;
        },
        appendShader: function (sd) {
            shaderArray[shaderArray.length] = sd;
        },
        deleteBuffer: function () {
            for (var i = 0 ; i < bufferArray.length ; i++) {
                bufferArray[i].deleteData();
            }
        },
        deleteFrameBuffer: function (fb) {
            for (var i = 0 ; i < framebufferArray.length ; i++) {
                framebufferArray[i].deleteData();
            }
        },
        deleteProgramme: function () {
            for (var i = 0 ; i < programmeArray.length ; i++) {
                programmeArray[i].deleteData();
            }
        },
        deleteTexture: function () {
            for (var i = 0 ; i < textureArray.length ; i++) {
                textureArray[i].deleteData();
            }
        },
        deleteRenderBuffer: function () {
            for (var i = 0 ; i < renderbufferArray.length ; i++) {
                renderbufferArray[i].deleteData();
            }
        },
        deleteShader: function () {
            for (var i = 0 ; i < shaderArray.length ; i++) {
                shaderArray[i].deleteData();
            }
        },
        reInitialize: function (completeCleanup) {
            this.deleteBuffer();
            this.deleteFrameBuffer();
            this.deleteTexture();
            this.deleteRenderBuffer();
            bufferArray = new Array(0);
            framebufferArray = new Array(0);
            textureArray = new Array(0);
            renderbufferArray = new Array(0);
            if (completeCleanup === true) {
                this.deleteProgramme();
                this.deleteShader();
                shaderArray = new Array(0);
                programmeArray = new Array(0);
            }
        }
    };
    return constructor;
})();
/**
 * Represents a WebGL texture object.
 */
var Texture = (function texture() {
    function constructor(gl, mgr, width, height, format) {
        this.id = -1;
        this.gl = gl;
        this.texture = gl.createTexture();
        this.width = width;
        this.height = height;
        if (mgr) {
            mgr.appendTexture(this);
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.format = format ? format : gl.LUMINANCE;
        gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, null);
        this.glError |= gl.getError( );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    var textureIDs = null;
    constructor.prototype = {
        fill: function (textureData, width, height) {
            var gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // texImage2D seems to be faster, thus keeping it as the default
            gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, textureData);
            this.glError |= WebGLCanvas.getError(gl);
        },
        fillSubTex: function (textureData, width, height, x, y) {
            var gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, this.format, gl.UNSIGNED_BYTE, textureData);
            this.glError |= WebGLCanvas.getError(gl);
        },
        bind: function (n, program, name) {
            var gl = this.gl;
            if (!textureIDs) {
                textureIDs = [gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4, gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7];
            }
            this.id = n+1;
            gl.activeTexture(textureIDs[n]);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(gl.getUniformLocation(program.program, name), n+1);
        },
        deleteData: function () {
            var gl = this.gl;
            gl.deleteTexture(this.texture);
        }
    };
    return constructor;
})();
/**
 * Represents a WebGL buffer object.
 */
var WebGLBuffer = (function glbuffer() {
    this.buffer = null;
    function constructor(gl, mgr) {
        this.gl = gl;
        this.buffer = this.gl.createBuffer();
        if (mgr) {
            mgr.appendBuffer(this);
        }
    }
    constructor.prototype = {
        deleteData: function () {
            var gl = this.gl;
            gl.deleteBuffer(this.buffer);
        }
    };
    return constructor;
})();
/**
 * Represents a WebGL frame buffer object.
 */
var WebGLFrameBuffer = (function frameBuffer() {
    this.framebuffer = null;
    function constructor(gl, mgr) {
        this.gl = gl;
        this.framebuffer = gl.createFramebuffer();
        if (mgr) {
            mgr.appendFrameBuffer(this);
        }
    }
    constructor.prototype = {
        deleteData: function () {
            var gl = this.gl;
            gl.deleteFramebuffer(this.framebuffer);
        }
    };
    return constructor;
})();
/**
 * Represents a WebGL render frame buffer object.
 */
var WebGLRenderBuffer = (function renderBuffer() {
    this.renderbuffer = null;
    function constructor(gl, mgr) {
        this.gl = gl;
        this.renderbuffer = gl.createRenderbuffer();
        if (mgr) {
            mgr.appendRenderBuffer(this);
        }
    }
    constructor.prototype = {
        deleteData: function () {
            var gl = this.gl;
            gl.deleteRenderbuffer(this.renderbuffer);
        }
    };
    return constructor;
})();

/**
 * Generic WebGL backed canvas that sets up: a quad to paint a texture on, appropriate vertex/fragment shaders,
 * scene parameters and other things. Specialized versions of this class can be created by overriding several
 * initialization methods.
 *
 * <code>
 * var canvas = new WebGLCanvas(document.getElementById('canvas'), new Size(512, 512);
 * canvas.texture.fill(data);
 * canvas.drawScene();
 * </code>
 */
var WebGLCanvas = (function () {

    var vertexShaderScript = WebGLScript.createFromSource("x-shader/x-vertex", [
        "attribute vec3 aVertexPosition;",
        "attribute vec2 aTextureCoord;",
        "uniform mat4 uMVMatrix;",
        "uniform mat4 uPMatrix;",
        "varying mediump vec2 vTextureCoord;",
        "void main(void) {",
        "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
        "  vTextureCoord = aTextureCoord;",
        "}"
    ].join("\n"));

    var fragmentShaderScript = WebGLScript.createFromSource("x-shader/x-fragment", [
        "precision mediump float;",
        "varying mediump vec2 vTextureCoord;",
        "uniform sampler2D texture;",
        "void main(void) {",
        "  gl_FragColor = texture2D(texture, vTextureCoord);",
        "}"
    ].join("\n"));

    function constructor(canvas, gl) {
        this.gl = gl;
        this.canvas = canvas;
        this.glManager = new WebGLManager();
        this.onInitWebGL();
        this.onInitShaders();
        this.glError = 0;
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
        this.setDimension = function (width, height, textureWidth, textureHeight, useFrameBuffer) {
            // Workaround for firefox issue RFHTMCRM-989
            // When the canvas with webgl context resized to smaller resolution, the dom area
            // uncovered by the canvas not getting refreshed which results in old texture data
            // of the webgl context appears in rest of the document body area gives impression of
            // screen corruption. To overcome the issue, clear the surface before resizing 
            // so that the rest document area appears cleared.
            if (g.environment.browser.isFirefox) {
				this.gl.clearColor(0, 0, 0, 1);
				this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			}
            this.canvas.width = width;
            this.canvas.height = height;
            this.reInitialize();
            this.onInitBuffers(textureWidth, textureHeight);
            if (useFrameBuffer) {
                initFramebuffer.call(this);
            }
            this.onInitTextures(textureWidth, textureHeight);
			this.onInitSceneTextures();
			this.gl.viewport(0, 0, width, height);
        };
        this.reInitMemory = function (completeCleanup) {
            this.glManager.reInitialize(completeCleanup);
        };
    }

    /**
    * Initialize a frame buffer so that we can render off-screen.
    */
    function initFramebuffer() {
        var gl = this.gl;

        // Create framebuffer object and texture.
        var glframebuffer = new WebGLFrameBuffer(gl, this.glManager);
        this.framebuffer = glframebuffer.framebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.framebufferTexture = new Texture(this.gl, this.glManager, this.size, gl.RGBA);

        // Create and allocate renderbuffer for depth data.
        var glrenderbuffer = new WebGLRenderBuffer(this.gl, this.glManager);
        var renderbuffer = glrenderbuffer.renderbuffer;
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.size.w, this.size.h);

        // Attach texture and renderbuffer to the framebuffer.
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.framebufferTexture.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    }

    /**
    * Initialize vertex and texture coordinate buffers for a plane.
    */
    function initBuffers() {
        var tmp;
        var gl = this.gl;

        // Create vertex position buffer.
        var glBuffer = new WebGLBuffer(gl, this.glManager);
        this.quadVPBuffer = glBuffer.buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVPBuffer);
        tmp = [
           1.0, 1.0, 0.0,
          -1.0, 1.0, 0.0,
           1.0, -1.0, 0.0,
          -1.0, -1.0, 0.0];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
        this.quadVPBuffer.itemSize = 3;
        this.quadVPBuffer.numItems = 4;

        /*
         +--------------------+
         | -1,1 (1)           | 1,1 (0)
         |                    |
         |                    |
         |                    |
         |                    |
         |                    |
         | -1,-1 (3)          | 1,-1 (2)
         +--------------------+
         */

        var scaleX = 1.0;
        var scaleY = 1.0;

        // Create vertex texture coordinate buffer.
        glBuffer = new WebGLBuffer(gl, this.glManager);
        this.quadVTCBuffer = glBuffer.buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVTCBuffer);
        tmp = [
          scaleX, 0.0,
          0.0, 0.0,
          scaleX, scaleY,
          0.0, scaleY
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tmp), gl.STATIC_DRAW);
    }

    function mvIdentity() {
        this.mvMatrix = Matrix.I(4);
    }

    function mvMultiply(m) {
        this.mvMatrix = this.mvMatrix.x(m);
    }

    function mvTranslate(m) {
        mvMultiply.call(this, Matrix.Translation($V([m[0], m[1], m[2]])).ensure4x4());
    }

    function setMatrixUniforms() {
        this.program.setMatrixUniform("uPMatrix", new Float32Array(this.perspectiveMatrix.flatten()));
        this.program.setMatrixUniform("uMVMatrix", new Float32Array(this.mvMatrix.flatten()));
    }

    constructor.prototype = {
        toString: function () {
            return "WebGLCanvas Size: " + this.size;
        },
        checkLastError: function (operation) {
            var err = this.gl.getError();
            if (err != this.gl.NO_ERROR) {
                var name = this.glNames[err];
                name = (name !== undefined) ? name + "(" + err + ")" :
                    ("Unknown WebGL ENUM (0x" + value.toString(16) + ")");
                if (operation) {
                    console.log("WebGL Error: %s, %s", operation, name);
                } else {
                    console.log("WebGL Error: %s", name);
                }
                //console.trace();
            }
        },
        onInitWebGL: function () {
            if (this.glNames) {
                return;
            }
            this.glNames = {};
            for (var propertyName in this.gl) {
                if (typeof this.gl[propertyName] == 'number') {
                    this.glNames[this.gl[propertyName]] = propertyName;
                }
            }
        },
        onInitShaders: function () {
            this.program = new WebGLProgram(this.gl, this.glManager);
            this.program.attach(new WebGLShader(this.gl, this.glManager, vertexShaderScript));
            this.program.attach(new WebGLShader(this.gl, this.glManager, fragmentShaderScript));
            this.program.link();
            this.program.use();
            this.vertexPositionAttribute = this.program.getAttributeLocation("aVertexPosition");
            this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
            this.textureCoordAttribute = this.program.getAttributeLocation("aTextureCoord");
            this.gl.enableVertexAttribArray(this.textureCoordAttribute);
        },
		onInitBuffers: function(textureWidth, textureHeight) {
			initBuffers.call(this);
		},
        onInitTextures: function (width, height) {
            var gl = this.gl;
            this.texture = new Texture(gl, this.glManager, width, height, gl.RGBA);
        },
        onInitSceneTextures: function () {
            this.texture.bind(0, this.program, "texture");
        },
        drawScene: function () {
            // this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        },
        readPixels: function (buffer) {
            var gl = this.gl;
            gl.readPixels(0, 0, this.size.w, this.size.h, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
        }
    };
    return constructor;
})();

// Enabling preserveDrawingBuffer by default
var pdbEnable = true;
WebGLCanvas.getContext = function (canvas) {
    var gl;
    try {
		// on iOs preserveDrawingBuffer has issues with performance and stability.
		var os = PlatformInfo["OS"];
		if (os === OSInfo["IPHONE"] || os === OSInfo["IPAD"] || (HTML5_CONFIG['hardware'] && (HTML5_CONFIG['hardware']['pdbEnable'] === false))) {
            console.info("PDB disabled");
			pdbEnable = false;
		}
        gl = canvas.getContext("experimental-webgl", { "preserveDrawingBuffer": pdbEnable, "failIfMajorPerformanceCaveat": true });
        var glerror = 0;
        glerror |= gl.getError();
        if (!gl) {
            throw WEBGLERROR.NOT_SUPPORTED;
        }
        /*
         * Checking RGBA texture is supporting
         */
        var texture = gl.createTexture(); glerror |= gl.getError();
        gl.bindTexture(gl.TEXTURE_2D, texture); glerror |= gl.getError();
        var format = gl.RGBA;
        gl.texImage2D(gl.TEXTURE_2D, 0, format, 32, 32, 0, format, gl.UNSIGNED_BYTE, null); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); glerror |= gl.getError();
        if (glerror != 0) {
            throw WEBGLERROR.UNSUPPORTED_TEXTURE;
        }
        gl.deleteTexture(texture);
        /*
         * Checking gray texture is supporting
         */
        var texture1 = gl.createTexture(); glerror |= gl.getError();
        gl.bindTexture(gl.TEXTURE_2D, texture1); glerror |= gl.getError();
        var format = gl.LUMINANCE;
        gl.texImage2D(gl.TEXTURE_2D, 0, format, 32, 32, 0, format, gl.UNSIGNED_BYTE, null); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); glerror |= gl.getError();
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); glerror |= gl.getError();
        if (glerror != 0) {
            throw WEBGLERROR.UNSUPPORTED_TEXTURE;
        }
        gl.deleteTexture(texture1);
    }
    catch (e) {
        throw WEBGLERROR.UNSUPPORTED_TEXTURE;
    }
    return gl;
};

WebGLCanvas.checkerror = true;
WebGLCanvas.getError = function (gl) {
    if (WebGLCanvas.checkerror == true) {
        return gl.getError();
    }
    else {
        return 0;
    }
};

var YUVWebGLCanvas = (function () {
    var vertexShaderScript = WebGLScript.createFromSource("x-shader/x-vertex", [
        "uniform vec2 u_resolution;",
        "varying mediump vec2 vTextureCoord;",
        "attribute vec2 a_position;",
        "void main(void) {",
        "  vec2 zeroToOne = a_position / u_resolution;",
        // convert from 0->1 to 0->2
        "  vec2 zeroToTwo = zeroToOne * 2.0;",
        // convert from 0->2 to -1->+1 (clipspace)
        "  vec2 clipSpace = zeroToTwo - 1.0;",
        "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        "  vTextureCoord = zeroToOne;",
        "}"
    ].join("\n"));

    var fragmentShaderScriptOld = WebGLScript.createFromSource("x-shader/x-fragment", [
        "precision mediump float;",
        "varying mediump vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "void main(void) {",
        "  vec3 YUV = vec3",
        "  (",
        "    texture2D(YTexture, vTextureCoord).x * 1.1643828125,   // premultiply Y",
        "    texture2D(UTexture, vTextureCoord).x,",
        "    texture2D(VTexture, vTextureCoord).x",
        "  );",
        "  gl_FragColor = vec4",
        "  (",
        "    YUV.x + 1.59602734375 * YUV.z - 0.87078515625,",
        "    YUV.x - 0.39176171875 * YUV.y - 0.81296875 * YUV.z + 0.52959375,",
        "    YUV.x + 2.017234375   * YUV.y - 1.081390625,",
        "    1",
        "  );",
        "}"
    ].join("\n"));

    var fragmentShaderScriptSimple = WebGLScript.createFromSource("x-shader/x-fragment", [
        "precision mediump float;",
        "varying mediump vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",

        "void main(void) {",
        "  gl_FragColor = texture2D(YTexture, vTextureCoord);",
        "}"
    ].join("\n"));

    var fragmentShaderScript = WebGLScript.createFromSource("x-shader/x-fragment", [
        "precision mediump float;",
        "varying mediump vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "const mat4 YUV2RGB = mat4",
        "(",
        " 1.1643828125, 0, 1.59602734375, -.87078515625,",
        " 1.1643828125, -.39176171875, -.81296875, .52959375,",
        " 1.1643828125, 2.017234375, 0, -1.081390625,",
        " 0, 0, 0, 1",
        ");",

        "void main(void) {",
        " gl_FragColor = vec4( texture2D(YTexture,  vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;",
        "}"
    ].join("\n"));


    function constructor(canvas, gl) {
        WebGLCanvas.call(this, canvas, gl);
    }

    constructor.prototype = webGlInherit(WebGLCanvas, {
        onInitShaders: function () {
            this.program = new WebGLProgram(this.gl, this.glManager);
            this.program.attach(new WebGLShader(this.gl, this.glManager, vertexShaderScript));
            this.program.attach(new WebGLShader(this.gl, this.glManager, fragmentShaderScript));
            this.program.link();
        },
        reInitialize: function () {
            this.program.use();
            var resolutionLocation = this.program.getUniformLocation("u_resolution");
            this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
            this.positionLocation = this.program.getAttributeLocation("a_position");
        },
		onInitBuffers: function(textureWidth, textureHeight) {
			var x1 = 0;
			var x2 = textureWidth;
			var y1 = 0;
			var y2 = textureHeight;
			var gl = this.gl;
			var glBuffer = new WebGLBuffer(gl, this.glManager);
			var buffer = glBuffer.buffer;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(this.positionLocation);
			gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW);
		},
        onInitTextures: function (width, height) {
            this.width = width;
            this.height = height;
            this.YTexture = new Texture(this.gl, this.glManager, width, height);
            this.UTexture = new Texture(this.gl, this.glManager, width >>> 1, height >>> 1);
            this.VTexture = new Texture(this.gl, this.glManager, width >>> 1, height >>> 1);
        },
        onInitSceneTextures: function () {
            this.YTexture.bind(0, this.program, "YTexture");
            this.UTexture.bind(1, this.program, "UTexture");
            this.VTexture.bind(2, this.program, "VTexture");
        },
        fillYUVTextures: function (y, u, v) {
            this.YTexture.fill(y, this.width, this.height);
            this.UTexture.fill(u, this.width >>> 1, this.height >>> 1);
            this.VTexture.fill(v, this.width >>> 1, this.height >>> 1);
        },
        toString: function () {
            return "YUVCanvas Size: " + this.size;
        }
    });

    return constructor;
})();

var YUVWebGLCanvasWithOverlays = (function () {
    var vertexShaderScript = WebGLScript.createFromSource("x-shader/x-vertex", [
        "uniform vec2 u_resolution;",
        "varying mediump vec2 vTextureCoord;",
        "attribute vec2 a_position;",
        "void main(void) {",
        "  vec2 zeroToOne = a_position / u_resolution;",
        // convert from 0->1 to 0->2
        "  vec2 zeroToTwo = zeroToOne * 2.0;",
        // convert from 0->2 to -1->+1 (clipspace)
        "  vec2 clipSpace = zeroToTwo - 1.0;",
        "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        "  vTextureCoord = zeroToOne;",
        "}"
    ].join("\n"));

    var fragmentShaderScript = WebGLScript.createFromSource("x-shader/x-fragment", [
        "precision mediump float;",
        "varying mediump vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "uniform sampler2D uOverlayTexture;",
        "uniform sampler2D uTextTexture;",
        "uniform bool uFrameBGRA;",
        "const mat4 YUV2RGB = mat4",
        "(",
        " 1.1643828125, 0, 1.59602734375, -.87078515625,",
        " 1.1643828125, -.39176171875, -.81296875, .52959375,",
        " 1.1643828125, 2.017234375, 0, -1.081390625,",
        " 0, 0, 0, 1",
        ");",

        "void main(void) {",
    	"  vec4 overlayColor = texture2D(uOverlayTexture, vTextureCoord);",
        "  vec4 textColor = texture2D(uTextTexture, vTextureCoord);",
    	"  vec4 frameColor;",
    	"  if (overlayColor.a == 1.0) {",
        "    gl_FragColor = overlayColor;",
        "  }",
        "  else if (textColor.a == 1.0) {",
        "      gl_FragColor = textColor;",
        "  }",
        "  else {",
        "      frameColor = vec4(texture2D(YTexture, vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;",
        "      if (uFrameBGRA) {",
        "       frameColor = frameColor.bgra;",
        "      }",
        "      gl_FragColor = frameColor;",
        "  }",
        "}"
    ].join("\n"));

    function constructor(canvas, gl) {
        YUVWebGLCanvas.call(this, canvas, gl);
    }

    constructor.prototype = webGlInherit(YUVWebGLCanvas, {
        onInitShaders: function () {
            this.program = new WebGLProgram(this.gl, this.glManager);
            this.program.attach(new WebGLShader(this.gl, this.glManager, vertexShaderScript));
            this.program.attach(new WebGLShader(this.gl, this.glManager, fragmentShaderScript));
            this.program.link();
        },
        reInitialize: function () {
            this.program.use();
			this.positionLocation = this.program.getAttributeLocation("a_position");
            var resolutionLocation = this.program.getUniformLocation("u_resolution");
            this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        },
		onInitBuffers: function(textureWidth, textureHeight) {
			this.vertexCount = 0;
			this.verticesBuffer = new WebGLBuffer(this.gl, this.glManager);
			this.setupVertices(1, [new Rectangle(0, 0, textureWidth, textureHeight)]);
		},
        onInitTextures: function (width, height) {
            this.width = width;
            this.height = height;
			this.haveFrame = false;
            this.overlayBoundingRect = null;
            this.YTexture = new Texture(this.gl, this.glManager, width, height);
            this.UTexture = new Texture(this.gl, this.glManager, width >>> 1, height >>> 1);
            this.VTexture = new Texture(this.gl, this.glManager, width >>> 1, height >>> 1);
            this.OverlayTexture = new Texture(this.gl, this.glManager, width, height, this.gl.RGBA);
            this.TextTexture = new Texture(this.gl, this.glManager, width, height, this.gl.RGBA);
            this.frameBGRA = false;
			this.gl.uniform1i(this.gl.getUniformLocation(this.program.program, "uFrameBGRA"), this.frameBGRA);
        },
        onInitSceneTextures: function () {
            this.YTexture.bind(0, this.program, "YTexture");
            this.UTexture.bind(1, this.program, "UTexture");
            this.VTexture.bind(2, this.program, "VTexture");
            this.OverlayTexture.bind(3, this.program, "uOverlayTexture");
            this.TextTexture.bind(4, this.program, "uTextTexture");
        },
		setupVertices: function(rectCount, rects) {
			// bind vertex buffer
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer.buffer);
			
			// update dirty vertices.
			this.vertexCount = rectCount*6;
			var vertexArr = new Float32Array(rectCount*12);
			for (var i = 0, j=0; i < rectCount; i++) {				
				// enlarge rect if top/left/bottom/right is odd
				var rect = rects[i];
				if (rect.top & 1) rect.top--;
				if (rect.bottom & 1) rect.bottom++;
				if (rect.left & 1) rect.left--;
				if (rect.right & 1) rect.right++;

				vertexArr[j++] = rect.left;  vertexArr[j++] = rect.top;	   // 0,0
				vertexArr[j++] = rect.right; vertexArr[j++] = rect.top;	   // 1,0
				vertexArr[j++] = rect.left;  vertexArr[j++] = rect.bottom; // 0,1
				vertexArr[j++] = rect.left;  vertexArr[j++] = rect.bottom; // 0,1
				vertexArr[j++] = rect.right; vertexArr[j++] = rect.top;	   // 1,0
				vertexArr[j++] = rect.right; vertexArr[j++] = rect.bottom; // 1,1
			}
			this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArr, this.gl.STATIC_DRAW);
			// update vertex positions, same will be used for texture
			this.gl.enableVertexAttribArray(this.positionLocation);
			this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
		},
        fillYUVTextures: function (y, u, v, rectCount, rects, colorFormat) {
		  // Setup dirty rectangle vertices only if preserveDrawingBuffer capable
		  if (pdbEnable === true) {
		    this.haveFrame = true;
			
			// No rectangles dirty!
		    if (rectCount < 1) {
		      return;
		    }
		    this.setupVertices(rectCount, rects);
		  }

          // adjust uv width/height based on format
          var uvw = this.width, uvh = this.height;
          var old = this.frameBGRA;
          if (colorFormat == DecoderConstants.TW2_YUV420) {
            uvw = this.width >>> 1;
            uvh = this.height >>> 1;
            this.frameBGRA = false;
          } else {
            this.frameBGRA = true;
          }

          // resize uv texture if required and update shader uniform
          if (old != this.frameBGRA) {
            this.UTexture.fill(null, uvw, uvh);
            this.VTexture.fill(null, uvw, uvh);
			this.gl.uniform1i(this.gl.getUniformLocation(this.program.program, "uFrameBGRA"), this.frameBGRA);
          }

          // Use subtex by updating existing surface as it doesn't create new one
          this.YTexture.fillSubTex(y, this.width, this.height, 0, 0);
          this.UTexture.fillSubTex(u, uvw, uvh, 0, 0);
          this.VTexture.fillSubTex(v, uvw, uvh, 0, 0);
        },
        addOverlayBitmap: function (rect, bmp) {
            if (this.overlayBoundingRect === null) {
                this.overlayBoundingRect = rect;
            }
            else {
                this.overlayBoundingRect = this.overlayBoundingRect.Union(rect);
            }
            this.OverlayTexture.fillSubTex(bmp, rect.Width, rect.Height, rect.X, rect.Y);
        },
        addOverlaySolidRect: function (rect, color) {
            if (this.overlayBoundingRect === null) {
                this.overlayBoundingRect = rect;
            }
            else {
                this.overlayBoundingRect = this.overlayBoundingRect.Union(rect);
            }
            //TODO: improve this by not creating array if possible
            var colorData = new ArrayBuffer(rect.Width * rect.Height * 4);
            var colorBytes = new Uint8Array(colorData);
            var rByte = ((color & 0x00ff0000) >> 16);
            var gByte = ((color & 0x0000ff00) >> 8);
            var bByte = (color & 0x000000ff);
            var aByte = 0xff;
            for (var i = 0; i < colorBytes.length; i+=4) {
                colorBytes[i] = rByte;
                colorBytes[i + 1] = gByte;
                colorBytes[i + 2] = bByte;
                colorBytes[i + 3] = aByte;
            }
            this.OverlayTexture.fillSubTex(colorBytes, rect.Width, rect.Height, rect.X, rect.Y);
        },
        addTextBitmap: function (rect, bmp) {
            this.TextTexture.fillSubTex(bmp, rect.Width, rect.Height, rect.X, rect.Y);
        },
        deleteText: function (rect) {
			// initializing array sets values to 0
			var clearData = new Uint8Array(rect.Width*rect.Height*4);
            this.TextTexture.fillSubTex(clearData, rect.Width, rect.Height, rect.X, rect.Y);
        },
        clearOverlays: function () {
            if (this.overlayBoundingRect !== null) {
				// initializing array sets values to 0
				var clearData = new Uint8Array(this.overlayBoundingRect.Width*this.overlayBoundingRect.Height*4);
                this.OverlayTexture.fillSubTex(clearData, this.overlayBoundingRect.Width, this.overlayBoundingRect.Height,
                    this.overlayBoundingRect.X, this.overlayBoundingRect.Y);
                this.overlayBoundingRect = null;
            }
        },
        toString: function () {
            return "YUVCanvasWithOverlays Size: " + this.size;
        },
        drawScene: function () {
			// setup just the overlays, if no h264 frame update. If preserveDrawingBuffer not enabled we draw entire frame anyway.
			var gl = this.gl;
			if ((pdbEnable === true) && (this.haveFrame === false)) {
				this.setupVertices(1, [this.overlayBoundingRect]);
			}
			
			// Nothing to render
			if (this.vertexCount == 0) {
			  return;
			}
			
			// Bind all the textures again, if we do not do we have rendering issues
			this.onInitSceneTextures();
			
			// render everything now
            gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount);
			
			//reset
			if (pdbEnable === true) {
			  this.haveFrame = false;
			  this.vertexCount = 0;
			}
        }
    });

    return constructor;
})();

var RGBWebGLCanvas = (function () {
    
    // Bad access of configuration setting. TODO: Typical configuration setting should be queried from common configuration query 
    // method rather than accessing the properties directly.
    var useTextures;
    
    // TODO: move shader source strings to common shader source collection module
    var vertexShaderScript = WebGLScript.createFromSource("x-shader/x-vertex", [
        "uniform vec2 u_resolution;",
        "varying mediump vec2 vTextureCoord;",
        "attribute vec2 a_position;",
        "void main(void) {",
        "  vec2 zeroToOne = a_position / u_resolution;",
        // convert from 0->1 to 0->2
        "  vec2 zeroToTwo = zeroToOne * 2.0;",
        // convert from 0->2 to -1->+1 (clipspace)
        "  vec2 clipSpace = zeroToTwo - 1.0;",
        "  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);",
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        "  vTextureCoord = zeroToOne;",
        "}"
    ].join("\n"));

    var fragmentShaderScript;
    var fragmentShaderSourceSimple = ["precision mediump float;",
        "uniform sampler2D RGBTexture;",
        "varying mediump vec2 vTextureCoord;",
        "void main(void) {",
         "gl_FragColor = vec4( texture2D(RGBTexture, vTextureCoord).z, texture2D(RGBTexture, vTextureCoord).y, texture2D(RGBTexture, vTextureCoord).x , 1);",
        "}"
    ].join("\n");
    
    var fragmentShaderSourceYuvOverlay = [
        "precision mediump float;",
        "uniform sampler2D RGBTexture;",
		"uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "uniform sampler2D OTexture;",
        "varying mediump vec2 vTextureCoord;",
		"const mat4 YUV2RGB = mat4",
        "(",
        " 1.1643828125, 0, 1.59602734375, -.87078515625,",
        " 1.1643828125, -.39176171875, -.81296875, .52959375,",
        " 1.1643828125, 2.017234375, 0, -1.081390625,",
        " 0, 0, 0, 1",
        ");",

        "void main(void) {",
		"  vec4 overlayColor = texture2D(OTexture, vTextureCoord);",
		"  if (overlayColor.a == 1.0) {",
        "     gl_FragColor = vec4(texture2D(YTexture, vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;",
        "  }",
		"  else {",
		 "    gl_FragColor = vec4(texture2D(RGBTexture, vTextureCoord).z, texture2D(RGBTexture, vTextureCoord).y, texture2D(RGBTexture, vTextureCoord).x , 1);",
        "  }",
        "}"].join("\n");
    
    function constructor(canvas, gl) {
        WebGLCanvas.call(this, canvas, gl);
    }

    constructor.prototype = webGlInherit(WebGLCanvas, {
        onInitShaders: function () {
			// Use the correct shader. This should be used ideally only if server has selective H.264
			useTextures = (HTML5_CONFIG && HTML5_CONFIG['features'] && HTML5_CONFIG['features']['graphics'] && (HTML5_CONFIG['features']['graphics']['useGlTexH264'] == false))? false : true;
            if(useTextures && !fragmentShaderScript) {
                fragmentShaderScript = WebGLScript.createFromSource("x-shader/x-fragment", fragmentShaderSourceYuvOverlay);
            } else {
                fragmentShaderScript = WebGLScript.createFromSource("x-shader/x-fragment", fragmentShaderSourceSimple);
            }
			
            this.program = new WebGLProgram(this.gl, this.glManager);
            this.program.attach(new WebGLShader(this.gl, this.glManager, vertexShaderScript));
            this.program.attach(new WebGLShader(this.gl, this.glManager, fragmentShaderScript));
            this.program.link();
        },
        reInitialize: function () {
            this.program.use();
            this.positionLocation = this.program.getAttributeLocation("a_position");
            var resolutionLocation = this.program.getUniformLocation("u_resolution");
            this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        },
		onInitBuffers: function(textureWidth, textureHeight) {
			var x1 = 0;
			var x2 = textureWidth;
			var y1 = 0;
			var y2 = textureHeight;
			var gl = this.gl;
			var glBuffer = new WebGLBuffer(gl, this.glManager);
			var buffer = glBuffer.buffer;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(this.positionLocation);
			gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW);
		},
        onInitTextures: function (width, height) {
            this.width = width;
            this.height = height;
            this.RGBTexture = new Texture(this.gl, this.glManager, width, height, this.gl.RGBA);
            if (useTextures) {
                this.YTexture = new Texture(this.gl, this.glManager, width, height);
                this.UTexture = new Texture(this.gl, this.glManager, width >>> 1, height >>> 1);
                this.VTexture = new Texture(this.gl, this.glManager, width >>> 1, height >>> 1);
                this.OTexture = new Texture(this.gl, this.glManager, width, height, this.gl.RGBA);
                this.sH264Context = false;
            }
        },
        fillRGBTexture: function (rgbBuf, w, h) {
            this.RGBTexture.fill(rgbBuf, w, h);
        },
        fillRGBSubTexture: function (rgbBuf, x, y, w, h) {
			this.RGBTexture.fillSubTex(rgbBuf, w, h, x, y);
        },
		clearOverlays: function () {
			this.YTexture.fill(null, 
				this.width, 
				this.height);
            this.UTexture.fill(null, 
				this.width >> 1, 
				this.height >> 1);
            this.VTexture.fill(null,
				this.width >> 1, 
				this.height >> 1);
			this.OTexture.fill(null, 
				this.width, 
				this.height);
			this.sH264Context = false;
		},
		fillYUVTextures: function (y, u, v, rectCount, rects, colorFormat) {
			var rect = rects[0];
            if (!this.sH264Context) {
                // reset textures when new yuv overlay is drawn
                var tmp = rect;
                var dirty = new Uint8Array(
                    tmp.Width * 
                    tmp.Height * 4);
                dirty.fill(0xFF);
                this.OTexture.fillSubTex(dirty,
                    tmp.Width, 
                    tmp.Height, 
                    tmp.X, 
                    tmp.Y);
                this.sH264Context = true;    
            }
			
            // Use subtex by updating existing surface as it doesn't create new one
            // use YUV texture width/height
            var uvw = rect.Width >>> 1;
            var uvh = rect.Height >>> 1;
            var uvx = rect.X >>> 1;
            var uvy = rect.Y >>> 1;
            this.YTexture.fillSubTex(y, 
              rect.Width, 
              rect.Height, 
              rect.X, 
              rect.Y);
            this.UTexture.fillSubTex(u, 
              uvw, uvh, uvx, uvy);
            this.VTexture.fillSubTex(v, 
              uvw, uvh, uvx, uvy);
        },
        onInitSceneTextures: function () {
            this.RGBTexture.bind(0, this.program, "RGBTexture");
            if (useTextures) {
                this.YTexture.bind(1, this.program, "YTexture");
                this.UTexture.bind(2, this.program, "UTexture");
                this.VTexture.bind(3, this.program, "VTexture");
                this.OTexture.bind(4, this.program, "OTexture");
            }
        },
        toString: function () {
            return "RGB Size: " + this.size;
        },
        drawScene: function () {
			this.onInitSceneTextures();

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    });

    return constructor;
})();
