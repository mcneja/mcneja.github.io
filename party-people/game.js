/*
Party People

Need to get a 3D scene going, with some geometry and lighting
Basic primitives are plane, sphere, cylinder; could use scaling
and coloring to do a lot of the rest.
Then movement and camera, and game controller input
Will need to expand the vector module

*/
import { vec2, vec3, mat4, MatrixStack } from './my-matrix.js';
window.onload = loadResourcesThenRun;
var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["Solid"] = 0] = "Solid";
    TerrainType[TerrainType["Wall"] = 1] = "Wall";
    TerrainType[TerrainType["Hall"] = 2] = "Hall";
    TerrainType[TerrainType["Room"] = 3] = "Room";
})(TerrainType || (TerrainType = {}));
var GeomAttribs;
(function (GeomAttribs) {
    GeomAttribs[GeomAttribs["Position"] = 0] = "Position";
    GeomAttribs[GeomAttribs["Normal"] = 1] = "Normal";
})(GeomAttribs || (GeomAttribs = {}));
const playerRadius = 0.5;
const bulletRadius = 0.25;
const bulletMinSpeed = 4;
const monsterRadius = 0.5;
const lootRadius = 0.5;
const turretFireDelayStart = 4.0;
const turretFireDelayEnd = 2.0;
const turretFireSpeed = 10.0;
const turretBulletLifetime = 4.0;
const numCellsX = 4;
const numCellsY = 4;
const corridorWidth = 3;
class BooleanGrid {
    constructor(sizeX, sizeY, initialValue) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.values = new Uint8Array(sizeX * sizeY);
        this.fill(initialValue);
    }
    fill(value) {
        this.values.fill(value ? 1 : 0);
    }
    get(x, y) {
        return this.values[this.sizeX * y + x] !== 0;
    }
    set(x, y, value) {
        this.values[this.sizeX * y + x] = value ? 1 : 0;
    }
}
class TerrainTypeGrid {
    constructor(sizeX, sizeY, initialValue) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.values = new Uint8Array(sizeX * sizeY);
        this.values.fill(initialValue);
    }
    fill(value) {
        this.values.fill(value);
    }
    get(x, y) {
        return this.values[this.sizeX * y + x];
    }
    set(x, y, value) {
        this.values[this.sizeX * y + x] = value;
    }
}
function loadResourcesThenRun() {
    loadImage('font.png').then((fontImage) => { main(fontImage); });
}
function main(fontImage) {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2", { alpha: false, depth: true });
    if (gl == null) {
        alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
        return;
    }
    const renderer = createRenderer(gl, fontImage);
    const state = initState(renderer.createColoredTrianglesRenderer);
    canvas.onmousedown = () => {
        if (state.paused) {
            canvas.requestPointerLock();
        }
    };
    document.body.addEventListener('keydown', e => {
        if (e.code == 'KeyR') {
            e.preventDefault();
            resetState(state, renderer.createColoredTrianglesRenderer);
            if (state.paused) {
                requestUpdateAndRender();
            }
        }
        else if (e.code == 'KeyM') {
            e.preventDefault();
            state.showMap = !state.showMap;
            if (state.paused) {
                requestUpdateAndRender();
            }
        }
    });
    function requestUpdateAndRender() {
        requestAnimationFrame(now => updateAndRender(now, renderer, state));
    }
    function onLockChanged() {
        const mouseCaptured = document.pointerLockElement === canvas;
        if (mouseCaptured) {
            document.addEventListener("mousemove", onMouseMoved, false);
            document.addEventListener("mousedown", onMouseDown, false);
            if (state.paused) {
                state.paused = false;
                state.tLast = undefined;
                requestUpdateAndRender();
            }
        }
        else {
            document.removeEventListener("mousemove", onMouseMoved, false);
            document.removeEventListener("mousedown", onMouseDown, false);
            state.paused = true;
        }
    }
    function onMouseMoved(e) {
        updatePosition(state, e);
    }
    function onMouseDown(e) {
        if (state.paused) {
            return;
        }
        if (e.button == 0) {
            tryShootBullet(state);
        }
        else if (e.button == 2) {
            alignCameraBehindPlayer(state);
        }
    }
    function onWindowResized() {
        requestUpdateAndRender();
    }
    document.addEventListener('pointerlockchange', onLockChanged, false);
    document.addEventListener('mozpointerlockchange', onLockChanged, false);
    window.addEventListener('resize', onWindowResized);
    requestUpdateAndRender();
}
const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});
function updatePosition(state, e) {
    const speedScale = 0.05;
    state.posMouse[0] += e.movementX * speedScale;
    state.posMouse[1] -= e.movementY * speedScale;
}
function alignCameraBehindPlayer(state) {
    if (state.showMap) {
        return;
    }
    // Rotate the current velocity vector so it keeps the same direction in world space
    state.camera.heading = state.player.heading;
    const viewUpDir = vec2.fromValues(Math.cos(state.camera.heading), Math.sin(state.camera.heading));
    const viewRightDir = vec2.fromValues(viewUpDir[1], -viewUpDir[0]);
    state.posMouse[0] = vec2.dot(viewRightDir, state.player.velocity);
    state.posMouse[1] = vec2.dot(viewUpDir, state.player.velocity);
}
function tryShootBullet(state) {
    const pos = vec2.create();
    vec2.copy(pos, state.player.position);
    const vel = vec2.create();
    const playerSpeed = vec2.length(state.player.velocity);
    const scale = Math.max(2 * playerSpeed, bulletMinSpeed) / Math.max(playerSpeed, 0.001);
    vec2.scale(vel, state.player.velocity, scale);
    state.playerBullets.push({
        position: pos,
        velocity: vel,
        timeRemaining: 2,
    });
}
function updatePlayerBullets(state, dt) {
    filterInPlace(state.playerBullets, bullet => updatePlayerBullet(state, bullet, dt));
}
function updatePlayerBullet(state, bullet, dt) {
    vec2.scaleAndAdd(bullet.position, bullet.position, bullet.velocity, dt);
    bullet.timeRemaining -= dt;
    if (bullet.timeRemaining <= 0) {
        return false;
    }
    let hitSomething = false;
    for (const turret of state.level.turrets) {
        if (turret.dead) {
            continue;
        }
        if (areDiscsTouching(bullet.position, bulletRadius, turret.position, monsterRadius)) {
            vec2.scaleAndAdd(turret.velocity, turret.velocity, bullet.velocity, 0.2);
            turret.dead = true;
            hitSomething = true;
        }
    }
    for (const swarmer of state.level.swarmers) {
        if (swarmer.dead) {
            continue;
        }
        if (areDiscsTouching(bullet.position, bulletRadius, swarmer.position, swarmer.radius)) {
            vec2.scaleAndAdd(swarmer.velocity, swarmer.velocity, bullet.velocity, 0.2);
            swarmer.dead = true;
            hitSomething = true;
        }
    }
    if (hitSomething) {
        return false;
    }
    if (isDiscTouchingLevel(bullet.position, bulletRadius, state.level.solid)) {
        return false;
    }
    return true;
}
function renderPlayerBullets(state, renderer, matScreenFromWorld) {
    const color = 0xffffff40;
    const discs = state.playerBullets.map(bullet => ({
        position: bullet.position,
        radius: bulletRadius,
        discColor: color,
        glyphColor: color,
        glyphIndex: 0,
    }));
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function renderPlayer(state, renderer, matScreenFromWorld) {
    const discs = [{
            position: state.player.position,
            radius: state.player.radius,
            discColor: 0xff000000,
            glyphColor: 0xff00ffff,
            glyphIndex: 1,
        }];
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function updateTurretBullets(state, dt) {
    filterInPlace(state.turretBullets, bullet => updateTurretBullet(state, bullet, dt));
}
function updateTurretBullet(state, bullet, dt) {
    vec2.scaleAndAdd(bullet.position, bullet.position, bullet.velocity, dt);
    bullet.timeRemaining -= dt;
    if (bullet.timeRemaining <= 0) {
        return false;
    }
    if (isDiscTouchingLevel(bullet.position, bulletRadius, state.level.solid)) {
        return false;
    }
    const playerMass = 1;
    const bulletMass = 0.125;
    const elasticity = 1;
    if (areDiscsTouching(bullet.position, bulletRadius, state.player.position, playerRadius)) {
        elasticCollision(state.player, bullet, playerMass, bulletMass, elasticity);
        return false;
    }
    return true;
}
function renderTurretBullets(bullets, renderer, matScreenFromWorld) {
    const color = 0xff4080ff;
    const discs = bullets.map(bullet => ({
        position: bullet.position,
        radius: bulletRadius,
        discColor: color,
        glyphColor: color,
        glyphIndex: 0,
    }));
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function fractionOfLootCollected(state) {
    return (state.level.numLootItemsTotal - state.level.lootItems.length) / state.level.numLootItemsTotal;
}
function turretFireDelay(state) {
    return lerp(turretFireDelayStart, turretFireDelayEnd, fractionOfLootCollected(state));
}
function updateTurrets(state, dt) {
    const dpos = vec2.create();
    for (const turret of state.level.turrets) {
        slideToStop(turret, dt);
        vec2.scaleAndAdd(turret.position, turret.position, turret.velocity, dt);
        // Disable cooldown once turret is no longer near player.
        if (turret.onContactCooldown) {
            vec2.subtract(dpos, turret.position, state.player.position);
            if (vec2.length(dpos) >= 1.5 * monsterRadius + playerRadius) {
                turret.onContactCooldown = false;
            }
        }
        if (!turret.dead) {
            turret.timeToFire -= dt;
            if (turret.timeToFire <= 0) {
                turret.timeToFire += turretFireDelay(state);
                if (distanceBetween(turret.position, state.player.position) < 20) {
                    const dpos = vec2.create();
                    vec2.subtract(dpos, state.player.position, turret.position);
                    const d = Math.max(1.0e-6, vec2.length(dpos));
                    const pos = vec2.create();
                    vec2.scaleAndAdd(pos, turret.position, dpos, turret.radius / d);
                    const vel = vec2.create();
                    vec2.scale(vel, dpos, turretFireSpeed / d);
                    const bullet = {
                        position: pos,
                        velocity: vel,
                        timeRemaining: turretBulletLifetime,
                    };
                    state.turretBullets.push(bullet);
                }
            }
        }
    }
    // Fix up turret positions relative to the environment and other objects.
    for (let i = 0; i < state.level.turrets.length; ++i) {
        const turret0 = state.level.turrets[i];
        fixupPositionAndVelocityAgainstLevel(turret0.position, turret0.velocity, turret0.radius, state.level.solid);
        if (turret0.dead)
            continue;
        for (let j = i + 1; j < state.level.turrets.length; ++j) {
            const turret1 = state.level.turrets[j];
            if (turret1.dead)
                continue;
            fixupDiscPair(turret0, turret1);
        }
    }
}
function updateSwarmers(state, dt) {
    const uLoot = fractionOfLootCollected(state);
    const accelerationRate = lerp(10, 20, uLoot);
    const dragAccelerationRate = 3;
    const perturbationAccelerationRate = 8;
    const separationDist = 5;
    const separationForce = 1;
    const velPrev = vec2.create();
    const perturbationDir = vec2.create();
    const dpos = vec2.create();
    for (const swarmer of state.level.swarmers) {
        vec2.copy(velPrev, swarmer.velocity);
        swarmer.heading += swarmer.headingRate * dt;
        swarmer.heading -= Math.floor(swarmer.heading);
        if (swarmer.dead) {
            slideToStop(swarmer, dt);
        }
        else {
            const heading = swarmer.heading * 2 * Math.PI;
            vec2.set(perturbationDir, Math.cos(heading), Math.sin(heading));
            const dposToTarget = vec2.create();
            vec2.subtract(dposToTarget, swarmer.position, state.player.position);
            const distToTarget = vec2.length(dposToTarget);
            if (distToTarget < 24 && clearLineOfSight(state.level.solid, swarmer.position, state.player.position)) {
                vec2.scaleAndAdd(swarmer.velocity, swarmer.velocity, dposToTarget, -accelerationRate * dt / distToTarget);
            }
            vec2.scaleAndAdd(swarmer.velocity, swarmer.velocity, perturbationDir, perturbationAccelerationRate * dt);
            vec2.scaleAndAdd(swarmer.velocity, swarmer.velocity, velPrev, -dragAccelerationRate * dt);
            // Avoid other turrets and swarmers
            for (const turret of state.level.turrets) {
                if (turret.dead)
                    continue;
                vec2.subtract(dpos, turret.position, swarmer.position);
                const dist = vec2.length(dpos);
                if (dist < separationDist) {
                    const scale = (dist - separationDist) * (separationForce * dt / dist);
                    vec2.scaleAndAdd(swarmer.velocity, swarmer.velocity, dpos, scale);
                }
            }
            for (const swarmerOther of state.level.swarmers) {
                if (swarmerOther.dead)
                    continue;
                if (swarmerOther == swarmer)
                    continue;
                vec2.subtract(dpos, swarmerOther.position, swarmer.position);
                const dist = vec2.length(dpos);
                if (dist < separationDist) {
                    const scale = (dist - separationDist) * (separationForce * dt / dist);
                    vec2.scaleAndAdd(swarmer.velocity, swarmer.velocity, dpos, scale);
                }
            }
        }
        vec2.scaleAndAdd(swarmer.position, swarmer.position, velPrev, dt / 2);
        vec2.scaleAndAdd(swarmer.position, swarmer.position, swarmer.velocity, dt / 2);
        // Disable cooldown once swarmer is no longer near player.
        if (swarmer.onContactCooldown) {
            vec2.subtract(dpos, swarmer.position, state.player.position);
            if (vec2.length(dpos) >= 1.5 * monsterRadius + playerRadius) {
                swarmer.onContactCooldown = false;
            }
        }
    }
    // Fix up swarmer positions relative to the environment and other objects.
    for (let i = 0; i < state.level.swarmers.length; ++i) {
        const swarmer0 = state.level.swarmers[i];
        fixupPositionAndVelocityAgainstLevel(swarmer0.position, swarmer0.velocity, swarmer0.radius, state.level.solid);
        if (swarmer0.dead)
            continue;
        for (let j = i + 1; j < state.level.swarmers.length; ++j) {
            const swarmer1 = state.level.swarmers[j];
            if (swarmer1.dead)
                continue;
            fixupDiscPair(swarmer0, swarmer1);
        }
    }
}
function renderTurretsDead(turrets, renderer, matScreenFromWorld) {
    const color = { r: 0.45, g: 0.45, b: 0.45 };
    const discs = turrets.filter(turret => turret.dead).map(turret => ({
        position: turret.position,
        radius: monsterRadius,
        discColor: 0xff737373,
        glyphColor: 0xff808080,
        glyphIndex: 119,
    }));
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function renderTurretsAlive(state, turrets, renderer, matScreenFromWorld) {
    const colorWindup = 0xff4080ff;
    const color = 0xff404058;
    const discs = turrets.filter(turret => !turret.dead).map(turret => ({
        position: turret.position,
        radius: monsterRadius,
        discColor: colorLerp(colorWindup, color, Math.min(1, 4 * turret.timeToFire / turretFireDelay(state))),
        glyphColor: 0xff8080b0,
        glyphIndex: 119,
    }));
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function renderSwarmersDead(swarmers, renderer, matScreenFromWorld) {
    const discs = swarmers.filter(swarmer => swarmer.dead).map(swarmer => ({
        position: swarmer.position,
        radius: monsterRadius,
        discColor: 0xff737373,
        glyphColor: 0xff808080,
        glyphIndex: 98,
    }));
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function renderSwarmersAlive(swarmers, renderer, matScreenFromWorld) {
    const discs = swarmers.filter(swarmer => !swarmer.dead).map(swarmer => ({
        position: swarmer.position,
        radius: monsterRadius,
        discColor: 0xff202020,
        glyphColor: 0xff5555ff,
        glyphIndex: 98,
    }));
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function colorLerp(color0, color1, u) {
    const r = Math.floor(lerp(color0 & 0xff, color1 & 0xff, u));
    const g = Math.floor(lerp((color0 >> 8) & 0xff, (color1 >> 8) & 0xff, u));
    const b = Math.floor(lerp((color0 >> 16) & 0xff, (color1 >> 16) & 0xff, u));
    const a = Math.floor(lerp((color0 >> 24) & 0xff, (color1 >> 24) & 0xff, u));
    return (a << 24) + (b << 16) + (g << 8) + r;
}
function lerp(v0, v1, u) {
    return v0 + (v1 - v0) * u;
}
function filterInPlace(array, condition) {
    let i = 0, j = 0;
    while (i < array.length) {
        const val = array[i];
        if (condition(val, i, array)) {
            if (i != j) {
                array[j] = val;
            }
            ++j;
        }
        ++i;
    }
    ;
    array.length = j;
    return array;
}
function createRenderer(gl, fontImage) {
    gl.enable(gl.CULL_FACE);
    const glyphTexture = createGlyphTextureFromImage(gl, fontImage);
    function setDepthTestEnabled(enabled) {
        if (enabled) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }
    }
    const renderer = {
        beginFrame: createBeginFrame(gl),
        renderDiscs: createDiscRenderer(gl, glyphTexture),
        renderGlyphs: createGlyphRenderer(gl, glyphTexture),
        renderGeom: createLitGeomRenderer(gl),
        createColoredTrianglesRenderer: createColoredTrianglesRenderer(gl),
        geomSphere: createGeomSphere(gl),
        geomCylinder: createGeomCylinder(gl),
        setDepthTestEnabled: setDepthTestEnabled,
    };
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    return renderer;
}
function createCamera(posPlayer) {
    const camera = {
        position: vec2.create(),
        velocity: vec2.create(),
        heading: Math.PI / 2,
    };
    vec2.copy(camera.position, posPlayer);
    vec2.zero(camera.velocity);
    return camera;
}
function createPlayer(posStart) {
    const player = {
        position: vec2.create(),
        velocity: vec2.create(),
        heading: 0,
        headingVelocity: 0,
        headHeading: 0,
        headHeadingVelocity: 0,
        eyesOpen: true,
        eyeStateDuration: 0,
        radius: playerRadius,
        armPhase: 0,
    };
    vec2.copy(player.position, posStart);
    vec2.zero(player.velocity);
    return player;
}
function initState(createColoredTrianglesRenderer) {
    const level = createLevel();
    const lightDirectionWorld = vec3.fromValues(2, -1, 3);
    vec3.scale(lightDirectionWorld, lightDirectionWorld, 1 / vec3.length(lightDirectionWorld));
    const lighting = {
        lightDirection: lightDirectionWorld,
        lightColor: vec3.fromValues(0.75, 0.675, 0.6),
        ambientColor: vec3.fromValues(0.2, 0.25, 0.5),
    };
    return {
        renderColoredTriangles: createColoredTrianglesRenderer(level.vertexData),
        tLast: undefined,
        paused: true,
        showMap: false,
        posMouse: vec2.fromValues(0, 0),
        player: createPlayer(level.playerStartPos),
        playerBullets: [],
        turretBullets: [],
        camera: createCamera(level.playerStartPos),
        level: level,
        lighting: lighting,
    };
}
function resetState(state, createColoredTrianglesRenderer) {
    const level = createLevel();
    state.renderColoredTriangles = createColoredTrianglesRenderer(level.vertexData);
    state.player = createPlayer(level.playerStartPos);
    state.playerBullets = [];
    state.turretBullets = [];
    state.camera = createCamera(level.playerStartPos);
    state.level = level;
}
function createBeginFrame(gl) {
    return (screenSize) => {
        resizeCanvasToDisplaySize(gl.canvas);
        const screenX = gl.canvas.clientWidth;
        const screenY = gl.canvas.clientHeight;
        gl.viewport(0, 0, screenX, screenY);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        vec2.set(screenSize, screenX, screenY);
    };
}
function createDiscRenderer(gl, glyphTexture) {
    const vsSource = `#version 300 es
        // per-vertex parameters
        in highp vec2 vPosition;
        // per-instance parameters
        in highp vec4 vScaleAndOffset;
        in highp vec4 vDiscColorAndOpacity;
        in highp vec3 vGlyphColor;
        in highp float vGlyphIndex;

        uniform mat4 uMatScreenFromWorld;
        uniform vec4 uScaleAndOffsetGlyphFromDisc;

        out highp vec2 fDiscPosition;
        out highp vec3 fGlyphTexCoord;
        out highp vec4 fDiscColorAndOpacity;
        out highp vec3 fGlyphColor;

        void main() {
            fDiscPosition = vPosition;
            fGlyphTexCoord = vec3(vPosition * uScaleAndOffsetGlyphFromDisc.xy + uScaleAndOffsetGlyphFromDisc.zw, vGlyphIndex);
            fDiscColorAndOpacity = vDiscColorAndOpacity;
            fGlyphColor = vGlyphColor;
            gl_Position = uMatScreenFromWorld * vec4(vPosition * vScaleAndOffset.xy + vScaleAndOffset.zw, 0, 1);
        }
    `;
    const fsSource = `#version 300 es
        in highp vec2 fDiscPosition;
        in highp vec3 fGlyphTexCoord;
        in highp vec4 fDiscColorAndOpacity;
        in highp vec3 fGlyphColor;

        uniform highp sampler2DArray uGlyphOpacity;

        out lowp vec4 fragColor;

        void main() {
            highp float glyphOpacity =
                step(0.0, fGlyphTexCoord.x) *
                step(0.0, 1.0 - fGlyphTexCoord.x) *
                step(0.0, fGlyphTexCoord.y) *
                step(0.0, 1.0 - fGlyphTexCoord.y) *
                texture(uGlyphOpacity, fGlyphTexCoord).x;
            highp float r = length(fDiscPosition);
            highp float aaf = fwidth(r);
            highp float discOpacity = fDiscColorAndOpacity.w * (1.0 - smoothstep(1.0 - aaf, 1.0, r));
            highp vec3 color = mix(fDiscColorAndOpacity.xyz, fGlyphColor, glyphOpacity);
            fragColor = vec4(color, discOpacity);
        }
    `;
    const attribs = {
        vPosition: 0,
        vScaleAndOffset: 1,
        vDiscColorAndOpacity: 2,
        vGlyphColor: 3,
        vGlyphIndex: 4,
    };
    const vecScaleAndOffsetGlyphFromDisc = [1, -0.5, 0.5, 0.45];
    const program = initShaderProgram(gl, vsSource, fsSource, attribs);
    const locMatScreenFromWorld = gl.getUniformLocation(program, 'uMatScreenFromWorld');
    const locScaleAndOffsetGlyphFromDisc = gl.getUniformLocation(program, 'uScaleAndOffsetGlyphFromDisc');
    const locGlyphOpacity = gl.getUniformLocation(program, 'uGlyphOpacity');
    const maxInstances = 64;
    const bytesPerInstance = 24; // 2 float scale, 2 float offset, 4 byte disc color/opacity, 4 byte glyph color/index
    const instanceData = new ArrayBuffer(maxInstances * bytesPerInstance);
    const instanceDataAsFloat32 = new Float32Array(instanceData);
    const instanceDataAsUint32 = new Uint32Array(instanceData);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    // per-vertex attributes
    const vertexBuffer = createDiscVertexBuffer(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(attribs.vPosition);
    gl.vertexAttribPointer(attribs.vPosition, 2, gl.FLOAT, false, 0, 0);
    // per-instance attributes
    const instanceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(attribs.vScaleAndOffset);
    gl.enableVertexAttribArray(attribs.vDiscColorAndOpacity);
    gl.enableVertexAttribArray(attribs.vGlyphColor);
    gl.enableVertexAttribArray(attribs.vGlyphIndex);
    gl.vertexAttribPointer(attribs.vScaleAndOffset, 4, gl.FLOAT, false, bytesPerInstance, 0);
    gl.vertexAttribPointer(attribs.vDiscColorAndOpacity, 4, gl.UNSIGNED_BYTE, true, bytesPerInstance, 16);
    gl.vertexAttribPointer(attribs.vGlyphColor, 3, gl.UNSIGNED_BYTE, true, bytesPerInstance, 20);
    gl.vertexAttribPointer(attribs.vGlyphIndex, 1, gl.UNSIGNED_BYTE, false, bytesPerInstance, 23);
    gl.vertexAttribDivisor(attribs.vScaleAndOffset, 1);
    gl.vertexAttribDivisor(attribs.vDiscColorAndOpacity, 1);
    gl.vertexAttribDivisor(attribs.vGlyphColor, 1);
    gl.vertexAttribDivisor(attribs.vGlyphIndex, 1);
    gl.bindVertexArray(null);
    return (matScreenFromWorld, discs) => {
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(locMatScreenFromWorld, false, matScreenFromWorld);
        gl.uniform4fv(locScaleAndOffsetGlyphFromDisc, vecScaleAndOffsetGlyphFromDisc);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, glyphTexture);
        gl.uniform1i(locGlyphOpacity, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        let discIndexStart = 0;
        while (discIndexStart < discs.length) {
            const numInstances = Math.min(maxInstances, discs.length - discIndexStart);
            // Load disc data into the instance buffer
            for (let i = 0; i < numInstances; ++i) {
                const disc = discs[discIndexStart + i];
                let j = i * bytesPerInstance / 4;
                instanceDataAsFloat32[j + 0] = disc.radius;
                instanceDataAsFloat32[j + 1] = disc.radius;
                instanceDataAsFloat32[j + 2] = disc.position[0];
                instanceDataAsFloat32[j + 3] = disc.position[1];
                instanceDataAsUint32[j + 4] = disc.discColor;
                instanceDataAsUint32[j + 5] = (disc.glyphColor & 0xffffff) + (disc.glyphIndex << 24);
            }
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData); // would like to only submit data for instances we will draw, not the whole buffer
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, numInstances);
            discIndexStart += numInstances;
        }
        gl.bindVertexArray(null);
    };
}
function createDiscVertexBuffer(gl) {
    const v = new Float32Array(6 * 2);
    let i = 0;
    function makeVert(x, y) {
        v[i++] = x;
        v[i++] = y;
    }
    makeVert(-1, -1);
    makeVert(1, -1);
    makeVert(1, 1);
    makeVert(1, 1);
    makeVert(-1, 1);
    makeVert(-1, -1);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    return vertexBuffer;
}
function createGlyphRenderer(gl, glyphTexture) {
    const vsSource = `#version 300 es
        in vec2 vPosition;
        in vec3 vTexcoord;
        in vec4 vColor;

        uniform mat4 uMatScreenFromWorld;

        out highp vec3 fTexcoord;
        out highp vec4 fColor;

        void main() {
            fTexcoord = vTexcoord;
            fColor = vColor;
            gl_Position = uMatScreenFromWorld * vec4(vPosition, 0, 1);
        }
    `;
    const fsSource = `#version 300 es
        in highp vec3 fTexcoord;
        in highp vec4 fColor;

        uniform highp sampler2DArray uOpacity;

        out lowp vec4 fragColor;

        void main() {
            fragColor = fColor * vec4(1, 1, 1, texture(uOpacity, fTexcoord));
        }
    `;
    const attribs = {
        vPosition: 0,
        vTexcoord: 1,
        vColor: 2,
    };
    const program = initShaderProgram(gl, vsSource, fsSource, attribs);
    const uProjectionMatrixLoc = gl.getUniformLocation(program, 'uMatScreenFromWorld');
    const uOpacityLoc = gl.getUniformLocation(program, 'uOpacity');
    const maxQuads = 64;
    const numVertices = 4 * maxQuads;
    const bytesPerVertex = 2 * Float32Array.BYTES_PER_ELEMENT + 2 * Uint32Array.BYTES_PER_ELEMENT;
    const wordsPerQuad = bytesPerVertex; // divide by four bytes per word, but also multiply by four vertices per quad
    const vertexData = new ArrayBuffer(numVertices * bytesPerVertex);
    const vertexDataAsFloat32 = new Float32Array(vertexData);
    const vertexDataAsUint32 = new Uint32Array(vertexData);
    const vertexBuffer = gl.createBuffer();
    let numQuads = 0;
    const matScreenFromWorldCached = mat4.create();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(attribs.vPosition);
    gl.enableVertexAttribArray(attribs.vTexcoord);
    gl.enableVertexAttribArray(attribs.vColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(attribs.vPosition, 2, gl.FLOAT, false, bytesPerVertex, 0);
    gl.vertexAttribPointer(attribs.vTexcoord, 3, gl.UNSIGNED_BYTE, false, bytesPerVertex, 8);
    gl.vertexAttribPointer(attribs.vColor, 4, gl.UNSIGNED_BYTE, true, bytesPerVertex, 12);
    gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.DYNAMIC_DRAW);
    const indexBuffer = createGlyphIndexBuffer(gl, maxQuads);
    gl.bindVertexArray(null);
    function setMatScreenFromWorld(matScreenFromWorld) {
        mat4.copy(matScreenFromWorldCached, matScreenFromWorld);
    }
    function addGlyph(x0, y0, x1, y1, glyphIndex, color) {
        if (numQuads >= maxQuads) {
            flushQuads();
        }
        const i = numQuads * wordsPerQuad;
        const srcBase = glyphIndex << 16;
        vertexDataAsFloat32[i + 0] = x0;
        vertexDataAsFloat32[i + 1] = y0;
        vertexDataAsUint32[i + 2] = srcBase + 256;
        vertexDataAsUint32[i + 3] = color;
        vertexDataAsFloat32[i + 4] = x1;
        vertexDataAsFloat32[i + 5] = y0;
        vertexDataAsUint32[i + 6] = srcBase + 257;
        vertexDataAsUint32[i + 7] = color;
        vertexDataAsFloat32[i + 8] = x0;
        vertexDataAsFloat32[i + 9] = y1;
        vertexDataAsUint32[i + 10] = srcBase;
        vertexDataAsUint32[i + 11] = color;
        vertexDataAsFloat32[i + 12] = x1;
        vertexDataAsFloat32[i + 13] = y1;
        vertexDataAsUint32[i + 14] = srcBase + 1;
        vertexDataAsUint32[i + 15] = color;
        ++numQuads;
    }
    function flushQuads() {
        if (numQuads <= 0) {
            return;
        }
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, glyphTexture);
        gl.uniform1i(uOpacityLoc, 0);
        gl.uniformMatrix4fv(uProjectionMatrixLoc, false, matScreenFromWorldCached);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexDataAsFloat32, 0);
        gl.drawElements(gl.TRIANGLES, 6 * numQuads, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        numQuads = 0;
    }
    return {
        start: setMatScreenFromWorld,
        addGlyph: addGlyph,
        flush: flushQuads,
    };
}
function createGlyphIndexBuffer(gl, maxQuads) {
    const indices = new Uint16Array(maxQuads * 6);
    for (let i = 0; i < maxQuads; ++i) {
        let j = 6 * i;
        let k = 4 * i;
        indices[j + 0] = k + 0;
        indices[j + 1] = k + 1;
        indices[j + 2] = k + 2;
        indices[j + 3] = k + 2;
        indices[j + 4] = k + 1;
        indices[j + 5] = k + 3;
    }
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return indexBuffer;
}
function createGlyphTextureFromImage(gl, image) {
    const numGlyphsX = 16;
    const numGlyphsY = 16;
    const numGlyphs = numGlyphsX * numGlyphsY;
    const srcGlyphSizeX = image.naturalWidth / numGlyphsX;
    const srcGlyphSizeY = image.naturalHeight / numGlyphsY;
    const scaleFactor = 4;
    const dstGlyphSizeX = srcGlyphSizeX * scaleFactor;
    const dstGlyphSizeY = srcGlyphSizeY * scaleFactor;
    // Rearrange the glyph data from a grid to a vertical array
    const canvas = document.createElement('canvas');
    canvas.width = dstGlyphSizeX;
    canvas.height = dstGlyphSizeY * numGlyphs;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < numGlyphsY; ++y) {
        for (let x = 0; x < numGlyphsX; ++x) {
            const sx = x * srcGlyphSizeX;
            const sy = y * srcGlyphSizeY;
            const dx = 0;
            const dy = (numGlyphsX * y + x) * dstGlyphSizeY;
            ctx.drawImage(image, sx, sy, srcGlyphSizeX, srcGlyphSizeY, dx, dy, dstGlyphSizeX, dstGlyphSizeY);
        }
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = new Uint8Array(imageData.data.buffer);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA, dstGlyphSizeX, dstGlyphSizeY, numGlyphs, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    return texture;
}
function updateAndRender(now, renderer, state) {
    const t = now / 1000;
    const dt = (state.paused || state.tLast === undefined) ? 0 : Math.min(1 / 30, t - state.tLast);
    state.tLast = t;
    if (dt > 0) {
        updateState(state, dt);
    }
    renderScene(renderer, state);
    if (!state.paused) {
        requestAnimationFrame(now => updateAndRender(now, renderer, state));
    }
}
function compileGeom(gl, geom) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geom.vertexData, gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geom.indexData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(GeomAttribs.Position);
    gl.enableVertexAttribArray(GeomAttribs.Normal);
    const bytesPerVertex = 24; // six 4-byte floats
    gl.vertexAttribPointer(GeomAttribs.Position, 3, gl.FLOAT, false, bytesPerVertex, 0);
    gl.vertexAttribPointer(GeomAttribs.Normal, 3, gl.FLOAT, false, bytesPerVertex, 12);
    gl.bindVertexArray(null);
    const numIndices = geom.indexData.length;
    return { vao: vao, numIndices: numIndices };
}
function createGeomSphere(gl) {
    return compileGeom(gl, unitSphereMesh(3));
}
function createGeomCylinder(gl) {
    const numSides = 32;
    const numVerts = numSides * 4;
    const numFloats = 6 * numVerts;
    const numIndices = (2 * numSides - 2) * 6;
    const geom = {
        vertexData: new Float32Array(numFloats),
        indexData: new Uint16Array(numIndices),
    };
    let i = 0;
    for (let side = 0; side < numSides; ++side) {
        const angle = (side / numSides) * Math.PI * 2;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        geom.vertexData[i++] = x;
        geom.vertexData[i++] = y;
        geom.vertexData[i++] = -1;
        geom.vertexData[i++] = 0;
        geom.vertexData[i++] = 0;
        geom.vertexData[i++] = -1;
        geom.vertexData[i++] = x;
        geom.vertexData[i++] = y;
        geom.vertexData[i++] = -1;
        geom.vertexData[i++] = x;
        geom.vertexData[i++] = y;
        geom.vertexData[i++] = 0;
        geom.vertexData[i++] = x;
        geom.vertexData[i++] = y;
        geom.vertexData[i++] = 1;
        geom.vertexData[i++] = x;
        geom.vertexData[i++] = y;
        geom.vertexData[i++] = 0;
        geom.vertexData[i++] = x;
        geom.vertexData[i++] = y;
        geom.vertexData[i++] = 1;
        geom.vertexData[i++] = 0;
        geom.vertexData[i++] = 0;
        geom.vertexData[i++] = 1;
    }
    i = 0;
    for (let side = 0; side < numSides - 2; ++side) {
        geom.indexData[i++] = 0;
        geom.indexData[i++] = 4 * (side + 2);
        geom.indexData[i++] = 4 * (side + 1);
    }
    for (let side = 0; side < numSides - 2; ++side) {
        geom.indexData[i++] = 3;
        geom.indexData[i++] = 4 * (side + 1) + 3;
        geom.indexData[i++] = 4 * (side + 2) + 3;
    }
    for (let side = 0; side < numSides; ++side) {
        const i0 = 4 * side + 1;
        const i1 = 4 * side + 2;
        const i2 = 4 * ((side + 1) % numSides) + 1;
        const i3 = 4 * ((side + 1) % numSides) + 2;
        geom.indexData[i++] = i0;
        geom.indexData[i++] = i2;
        geom.indexData[i++] = i1;
        geom.indexData[i++] = i1;
        geom.indexData[i++] = i2;
        geom.indexData[i++] = i3;
    }
    return compileGeom(gl, geom);
}
function createLitGeomRenderer(gl) {
    const vsSource = `#version 300 es
        in vec3 vPosition;
        in vec3 vNormal;

        uniform mat4 uMatClipFromLocal;
        uniform mat4 uMatLightFromLocal;

        out highp vec3 fNormal;

        void main() {
            fNormal = vec3(uMatLightFromLocal * vec4(vNormal.xyz, 0));
            gl_Position = uMatClipFromLocal * vec4(vPosition.xyz, 1);
        }
    `;
    const fsSource = `#version 300 es
        in highp vec3 fNormal;

        uniform highp vec3 uColorDiffuse;
        uniform highp vec3 uColorAmbient;
        uniform highp vec3 uLightDirection;
        
        out lowp vec4 fragColor;

        void main() {
            highp vec3 normal = normalize(fNormal);
            highp float diffuseFraction = max(0.0, dot(normal, uLightDirection));
            highp vec3 color = uColorAmbient + uColorDiffuse * diffuseFraction;
            fragColor = vec4(color.xyz, 1);
        }
    `;
    const attribs = {
        vPosition: 0,
        vNormal: 1,
    };
    const program = initShaderProgram(gl, vsSource, fsSource, attribs);
    const locMatClipFromLocal = gl.getUniformLocation(program, 'uMatClipFromLocal');
    const locMatLightFromLocal = gl.getUniformLocation(program, 'uMatLightFromLocal');
    const locColorDiffuse = gl.getUniformLocation(program, 'uColorDiffuse');
    const locColorAmbient = gl.getUniformLocation(program, 'uColorAmbient');
    const locLightDirection = gl.getUniformLocation(program, 'uLightDirection');
    const colorDiffuse = vec3.create();
    const colorAmbient = vec3.create();
    const matWorldFromLocalNormal = mat4.create();
    const matScreenFromLocal = mat4.create();
    return (compiledGeom, matScreenFromWorld, matWorldFromLocal, lighting, color) => {
        vec3.multiply(colorDiffuse, lighting.lightColor, color);
        vec3.multiply(colorAmbient, lighting.ambientColor, color);
        mat4.invert(matWorldFromLocalNormal, matWorldFromLocal);
        mat4.transpose(matWorldFromLocalNormal, matWorldFromLocalNormal);
        mat4.multiply(matScreenFromLocal, matScreenFromWorld, matWorldFromLocal);
        gl.useProgram(program);
        gl.uniformMatrix4fv(locMatClipFromLocal, false, matScreenFromLocal);
        gl.uniformMatrix4fv(locMatLightFromLocal, false, matWorldFromLocalNormal);
        gl.uniform3fv(locColorDiffuse, colorDiffuse);
        gl.uniform3fv(locColorAmbient, colorAmbient);
        gl.uniform3fv(locLightDirection, lighting.lightDirection);
        gl.bindVertexArray(compiledGeom.vao);
        gl.drawElements(gl.TRIANGLES, compiledGeom.numIndices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    };
}
function unitSphereMesh(numSubdivisions) {
    const t = (1 + Math.sqrt(5)) / 2;
    let vertexData = [
        -1, t, 0,
        1, t, 0,
        -1, -t, 0,
        1, -t, 0,
        0, -1, t,
        0, 1, t,
        0, -1, -t,
        0, 1, -t,
        t, 0, -1,
        t, 0, 1,
        -t, 0, -1,
        -t, 0, 1,
    ];
    let indexData = [
        0, 11, 5,
        0, 5, 1,
        0, 1, 7,
        0, 7, 10,
        0, 10, 11,
        1, 5, 9,
        5, 11, 4,
        11, 10, 2,
        10, 7, 6,
        7, 1, 8,
        3, 9, 4,
        3, 4, 2,
        3, 2, 6,
        3, 6, 8,
        3, 8, 9,
        4, 9, 5,
        2, 4, 11,
        6, 2, 10,
        8, 6, 7,
        9, 8, 1,
    ];
    // Normalize the vertex positions
    for (let i = 2; i < vertexData.length; i += 3) {
        const x = vertexData[i - 2];
        const y = vertexData[i - 1];
        const z = vertexData[i];
        const s = 1 / Math.sqrt(x * x + y * y + z * z);
        vertexData[i - 2] = x * s;
        vertexData[i - 1] = y * s;
        vertexData[i] = z * s;
    }
    for (let i = 0; i < numSubdivisions; ++i) {
        [vertexData, indexData] = subdivideUnitSphereMesh(vertexData, indexData);
    }
    // Convert to position+normal format
    const numVertices = vertexData.length / 3;
    const verts = new Float32Array(6 * numVertices);
    const indices = new Uint16Array(indexData);
    for (let i = 0; i < numVertices; ++i) {
        const x = vertexData[3 * i + 0];
        const y = vertexData[3 * i + 1];
        const z = vertexData[3 * i + 2];
        verts[6 * i + 0] = x;
        verts[6 * i + 1] = y;
        verts[6 * i + 2] = z;
        verts[6 * i + 3] = x;
        verts[6 * i + 4] = y;
        verts[6 * i + 5] = z;
    }
    return { vertexData: verts, indexData: indices };
}
function subdivideUnitSphereMesh(vertexData, indexData) {
    const vertexIndex = new Map();
    const vertexDataNew = [];
    const indexDataNew = [];
    function ensureVertex(v0, v1) {
        let i = vertexIndex.get([v0, v1]);
        if (i === undefined) {
            i = vertexDataNew.length / 3;
            if (v0 === v1) {
                vertexIndex.set([v0, v0], i);
                vertexDataNew.push(vertexData[3 * v0 + 0]);
                vertexDataNew.push(vertexData[3 * v0 + 1]);
                vertexDataNew.push(vertexData[3 * v0 + 2]);
            }
            else {
                vertexIndex.set([v0, v1], i);
                vertexIndex.set([v1, v0], i);
                const x = vertexData[3 * v0 + 0] + vertexData[3 * v1 + 0];
                const y = vertexData[3 * v0 + 1] + vertexData[3 * v1 + 1];
                const z = vertexData[3 * v0 + 2] + vertexData[3 * v1 + 2];
                const s = 1 / Math.sqrt(x * x + y * y + z * z);
                vertexDataNew.push(x * s);
                vertexDataNew.push(y * s);
                vertexDataNew.push(z * s);
            }
        }
        return i;
    }
    for (let i = 2; i < indexData.length; i += 3) {
        const v0 = indexData[i - 2];
        const v1 = indexData[i - 1];
        const v2 = indexData[i];
        const v00 = ensureVertex(v0, v0);
        const v11 = ensureVertex(v1, v1);
        const v22 = ensureVertex(v2, v2);
        const v01 = ensureVertex(v0, v1);
        const v12 = ensureVertex(v1, v2);
        const v20 = ensureVertex(v2, v0);
        indexDataNew.push(v00);
        indexDataNew.push(v01);
        indexDataNew.push(v20);
        indexDataNew.push(v11);
        indexDataNew.push(v12);
        indexDataNew.push(v01);
        indexDataNew.push(v22);
        indexDataNew.push(v20);
        indexDataNew.push(v12);
        indexDataNew.push(v20);
        indexDataNew.push(v01);
        indexDataNew.push(v12);
    }
    return [vertexDataNew, indexDataNew];
}
function createColoredTrianglesRenderer(gl) {
    const vsSource = `#version 300 es
        in vec2 vPosition;
        in vec4 vColor;

        uniform mat4 uMatClipFromLocal;

        out highp vec4 fColor;

        void main() {
            fColor = vColor;
            gl_Position = uMatClipFromLocal * vec4(vPosition.xy, 0, 1);
        }
    `;
    const fsSource = `#version 300 es
        in highp vec4 fColor;
        out lowp vec4 fragColor;
        void main() {
            fragColor = fColor;
        }
    `;
    const attribs = {
        vPosition: 0,
        vColor: 1,
    };
    const program = initShaderProgram(gl, vsSource, fsSource, attribs);
    const locMatClipFromLocal = gl.getUniformLocation(program, 'uMatClipFromLocal');
    const vertexBuffer = gl.createBuffer();
    const bytesPerVertex = 12; // two 4-byte floats and one 32-bit color
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(attribs.vPosition);
    gl.enableVertexAttribArray(attribs.vColor);
    gl.bindVertexArray(null);
    return vertexData => {
        const numVerts = Math.floor(vertexData.byteLength / bytesPerVertex);
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(attribs.vPosition, 2, gl.FLOAT, false, bytesPerVertex, 0);
        gl.vertexAttribPointer(attribs.vColor, 4, gl.UNSIGNED_BYTE, true, bytesPerVertex, 8);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        return matScreenFromWorld => {
            gl.useProgram(program);
            gl.uniformMatrix4fv(locMatClipFromLocal, false, matScreenFromWorld);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.TRIANGLES, 0, numVerts);
            gl.bindVertexArray(null);
        };
    };
}
function slideToStop(body, dt) {
    const r = Math.exp(-3 * dt);
    vec2.scale(body.velocity, body.velocity, r);
}
function updateState(state, dt) {
    // Player
    const heading = state.showMap ? Math.PI / 2 : state.camera.heading;
    const viewUpDir = vec2.fromValues(Math.cos(heading), Math.sin(heading));
    const viewRightDir = vec2.fromValues(viewUpDir[1], -viewUpDir[0]);
    vec2.scale(state.player.velocity, viewUpDir, state.posMouse[1]);
    vec2.scaleAndAdd(state.player.velocity, state.player.velocity, viewRightDir, state.posMouse[0]);
    vec2.scaleAndAdd(state.player.position, state.player.position, state.player.velocity, dt);
    const playerSpeed = vec2.length(state.player.velocity);
    const armPhaseSpeed = 0.0035;
    state.player.armPhase += playerSpeed * armPhaseSpeed;
    state.player.armPhase -= Math.floor(state.player.armPhase);
    // Update body heading and angular velocity
    const minReorientSpeed = 1.0;
    const headingTarget = (playerSpeed >= minReorientSpeed) ? Math.atan2(state.player.velocity[1], state.player.velocity[0]) : state.player.heading;
    let headingError = headingTarget - state.player.heading;
    if (headingError > Math.PI) {
        headingError -= 2 * Math.PI;
    }
    else if (headingError < -Math.PI) {
        headingError += 2 * Math.PI;
    }
    const headingVelocityError = -state.player.headingVelocity;
    const headingSpringFreq = 10;
    const headingAcceleration = headingSpringFreq * (headingSpringFreq * headingError + 2 * headingVelocityError);
    const headingVelocityNext = state.player.headingVelocity + headingAcceleration * dt;
    state.player.heading += (state.player.headingVelocity + headingVelocityNext) * (dt / 2);
    while (state.player.heading < -Math.PI) {
        state.player.heading += 2 * Math.PI;
    }
    while (state.player.heading > Math.PI) {
        state.player.heading -= 2 * Math.PI;
    }
    state.player.headingVelocity = headingVelocityNext;
    // Update head heading and angular velocity
    const maxHeadHeading = 1.0;
    let headHeadingError = headingTarget - (state.player.heading + state.player.headHeading);
    if (headHeadingError > Math.PI) {
        headHeadingError -= 2 * Math.PI;
    }
    else if (headHeadingError < -Math.PI) {
        headHeadingError += 2 * Math.PI;
    }
    headHeadingError = Math.max(-maxHeadHeading, Math.min(maxHeadHeading, headHeadingError));
    const headHeadingVelocityError = -(state.player.headingVelocity + state.player.headHeadingVelocity);
    const headHeadingSpringFreq = 30;
    const headHeadingAcceleration = headHeadingSpringFreq * (headHeadingSpringFreq * headHeadingError + 2 * headHeadingVelocityError);
    const headHeadingVelocityNext = state.player.headHeadingVelocity + headHeadingAcceleration * dt;
    state.player.headHeading += (state.player.headHeadingVelocity + headHeadingVelocityNext) * (dt / 2);
    state.player.headHeading = Math.max(-maxHeadHeading, Math.min(maxHeadHeading, state.player.headHeading));
    state.player.headHeadingVelocity = headHeadingVelocityNext;
    // Update blink
    const minBlinkDuration = 0.2;
    const minLookDuration = 1.5;
    const headHeadingVelocityWorld = state.player.headingVelocity + state.player.headHeadingVelocity;
    if (state.player.eyesOpen) {
        if (headHeadingVelocityWorld >= 2.0) {
            state.player.eyesOpen = false;
            state.player.eyeStateDuration = 0;
        }
        else if (state.player.eyeStateDuration >= minLookDuration && Math.random() < 0.01) {
            state.player.eyesOpen = false;
            state.player.eyeStateDuration = 0;
        }
        else {
            state.player.eyeStateDuration += dt;
        }
    }
    else {
        if (state.player.eyeStateDuration >= minBlinkDuration && headHeadingVelocityWorld < 1.0) {
            state.player.eyesOpen = true;
            state.player.eyeStateDuration = 0;
        }
        else {
            state.player.eyeStateDuration += dt;
        }
    }
    // Other
    updateLootItems(state);
    updateCamera(state, dt);
    updateTurrets(state, dt);
    updateSwarmers(state, dt);
    updatePlayerBullets(state, dt);
    updateTurretBullets(state, dt);
    // Collide player against objects and the environment
    const turretElasticity = 0.5;
    const swarmerElasticity = 0.8;
    const turretMass = 1;
    const swarmerMass = 0.25;
    for (let i = 0; i < 4; ++i) {
        for (const turret of state.level.turrets) {
            if (!turret.dead) {
                collideDiscs(state.player, turret, 1, turretMass, turretElasticity);
            }
        }
        for (const swarmer of state.level.swarmers) {
            if (!swarmer.dead) {
                collideDiscs(state.player, swarmer, 1, swarmerMass, swarmerElasticity);
            }
        }
        fixupPositionAndVelocityAgainstLevel(state.player.position, state.player.velocity, state.player.radius, state.level.solid);
    }
    // Translate the player's velocity back into the mouse speed
    state.posMouse[0] = vec2.dot(viewRightDir, state.player.velocity);
    state.posMouse[1] = vec2.dot(viewUpDir, state.player.velocity);
}
function updateCamera(state, dt) {
    // Update player follow
    const posError = vec2.create();
    vec2.subtract(posError, state.player.position, state.camera.position);
    const velError = vec2.create();
    vec2.negate(velError, state.camera.velocity);
    const kSpring = 8; // spring constant, radians/sec
    const acc = vec2.create();
    vec2.scale(acc, posError, Math.pow(kSpring, 2));
    vec2.scaleAndAdd(acc, acc, velError, 2 * kSpring);
    const velNew = vec2.create();
    vec2.scaleAndAdd(velNew, state.camera.velocity, acc, dt);
    vec2.scaleAndAdd(state.camera.position, state.camera.position, state.camera.velocity, 0.5 * dt);
    vec2.scaleAndAdd(state.camera.position, state.camera.position, velNew, 0.5 * dt);
    vec2.copy(state.camera.velocity, velNew);
    // Rotate to follow
    const cameraDir = vec2.fromValues(Math.cos(state.camera.heading), Math.sin(state.camera.heading));
    const torqueRate = 0.079;
    const torque = torqueRate * vec2.perpDot(cameraDir, state.camera.velocity);
    state.camera.heading += torque * dt;
}
function fixupDiscPair(disc0, disc1) {
    collideDiscs(disc0, disc1, 1, 1, 0);
}
function collideDiscs(disc0, disc1, mass0, mass1, elasticity) {
    const dpos = vec2.create();
    vec2.subtract(dpos, disc1.position, disc0.position);
    const d = vec2.length(dpos);
    const dist = d - (disc0.radius + disc1.radius);
    if (dist >= 0) {
        return false;
    }
    const scalePosFixup = dist / (d * (mass0 + mass1));
    vec2.scaleAndAdd(disc0.position, disc0.position, dpos, scalePosFixup * mass1);
    vec2.scaleAndAdd(disc1.position, disc1.position, dpos, -scalePosFixup * mass0);
    const dvel = vec2.create();
    vec2.subtract(dvel, disc1.velocity, disc0.velocity);
    const vn = vec2.dot(dpos, dvel);
    if (vn >= 0) {
        return false;
    }
    const scaleVelFixup = ((1 + elasticity) * vn) / (d * d * (mass0 + mass1));
    vec2.scaleAndAdd(disc0.velocity, disc0.velocity, dpos, scaleVelFixup * mass1);
    vec2.scaleAndAdd(disc1.velocity, disc1.velocity, dpos, -scaleVelFixup * mass0);
    return true;
}
function elasticCollision(body0, body1, mass0, mass1, elasticity) {
    const dpos = vec2.create();
    vec2.subtract(dpos, body1.position, body0.position);
    const d = vec2.length(dpos);
    const dvel = vec2.create();
    vec2.subtract(dvel, body1.velocity, body0.velocity);
    const vn = vec2.dot(dpos, dvel);
    if (vn >= 0) {
        return false;
    }
    const scaleVelFixup = ((1 + elasticity) * vn) / (d * d * (mass0 + mass1));
    vec2.scaleAndAdd(body0.velocity, body0.velocity, dpos, scaleVelFixup * mass1);
    vec2.scaleAndAdd(body1.velocity, body1.velocity, dpos, -scaleVelFixup * mass0);
    return true;
}
function isDiscTouchingLevel(discPos, discRadius, solid) {
    const gridMinX = Math.max(0, Math.floor(discPos[0] - discRadius));
    const gridMinY = Math.max(0, Math.floor(discPos[1] - discRadius));
    const gridMaxX = Math.min(solid.sizeX, Math.floor(discPos[0] + discRadius + 1));
    const gridMaxY = Math.min(solid.sizeY, Math.floor(discPos[1] + discRadius + 1));
    for (let gridX = gridMinX; gridX <= gridMaxX; ++gridX) {
        for (let gridY = gridMinY; gridY <= gridMaxY; ++gridY) {
            const isSolid = solid.get(gridX, gridY);
            if (!isSolid) {
                continue;
            }
            let dx = discPos[0] - gridX;
            let dy = discPos[1] - gridY;
            dx = Math.max(-dx, 0, dx - 1);
            dy = Math.max(-dy, 0, dy - 1);
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < discRadius) {
                return true;
            }
        }
    }
    return false;
}
function areDiscsTouching(pos0, radius0, pos1, radius1) {
    const dpos = vec2.create();
    vec2.subtract(dpos, pos1, pos0);
    const d = vec2.length(dpos);
    return d < radius0 + radius1;
}
function fixupPositionAndVelocityAgainstLevel(position, velocity, radius, solid) {
    let vNormalMin = 0;
    for (let i = 0; i < 4; ++i) {
        const gridMinX = Math.max(0, Math.floor(position[0] - radius));
        const gridMinY = Math.max(0, Math.floor(position[1] - radius));
        const gridMaxX = Math.min(solid.sizeX, Math.floor(position[0] + radius + 1));
        const gridMaxY = Math.min(solid.sizeY, Math.floor(position[1] + radius + 1));
        let smallestSeparatingAxis = { unitDir: vec2.fromValues(0, 0), d: radius };
        for (let gridX = gridMinX; gridX <= gridMaxX; ++gridX) {
            for (let gridY = gridMinY; gridY <= gridMaxY; ++gridY) {
                const isSolid = solid.get(gridX, gridY);
                if (!isSolid) {
                    continue;
                }
                const dx = position[0] - (0.5 + gridX);
                const dy = position[1] - (0.5 + gridY);
                const axis = separatingAxis(dx, dy);
                if (axis.d < smallestSeparatingAxis.d) {
                    smallestSeparatingAxis = axis;
                }
            }
        }
        smallestSeparatingAxis.d -= radius;
        if (smallestSeparatingAxis.d < 0) {
            vec2.scaleAndAdd(position, position, smallestSeparatingAxis.unitDir, -smallestSeparatingAxis.d);
            const vNormal = vec2.dot(smallestSeparatingAxis.unitDir, velocity);
            vNormalMin = Math.min(vNormalMin, vNormal);
            vec2.scaleAndAdd(velocity, velocity, smallestSeparatingAxis.unitDir, -vNormal);
        }
    }
    const xMin = radius;
    const yMin = radius;
    const xMax = solid.sizeX - radius;
    const yMax = solid.sizeY - radius;
    if (position[0] < xMin) {
        position[0] = xMin;
        velocity[0] = 0;
    }
    else if (position[0] > xMax) {
        position[0] = xMax;
        velocity[0] = 0;
    }
    if (position[1] < yMin) {
        position[1] = yMin;
        velocity[1] = 0;
    }
    else if (position[1] > yMax) {
        position[1] = yMax;
        velocity[1] = 0;
    }
    return -vNormalMin;
}
function separatingAxis(dx, dy) {
    const ax = Math.abs(dx) - 0.5;
    const ay = Math.abs(dy) - 0.5;
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    if (ax > ay) {
        if (ay > 0) {
            const d = Math.sqrt(Math.pow(ax, 2) + Math.pow(ay, 2));
            return { unitDir: vec2.fromValues(sx * ax / d, sy * ay / d), d: d };
        }
        else {
            return { unitDir: vec2.fromValues(sx, 0), d: ax };
        }
    }
    else {
        if (ax > 0) {
            const d = Math.sqrt(Math.pow(ax, 2) + Math.pow(ay, 2));
            return { unitDir: vec2.fromValues(sx * ax / d, sy * ay / d), d: d };
        }
        else {
            return { unitDir: vec2.fromValues(0, sy), d: ay };
        }
    }
}
function distanceBetween(pos0, pos1) {
    const dpos = vec2.create();
    vec2.subtract(dpos, pos1, pos0);
    return vec2.length(dpos);
}
function clearLineOfSight(solid, pos0, pos1) {
    const dx = Math.abs(pos1[0] - pos0[0]);
    const dy = Math.abs(pos1[1] - pos0[1]);
    let x = Math.floor(pos0[0]);
    let y = Math.floor(pos0[1]);
    let n = 1;
    let xInc, yInc, error;
    if (pos1[0] > pos0[0]) {
        xInc = 1;
        n += Math.floor(pos1[0]) - x;
        error = (Math.floor(pos0[0]) + 1 - pos0[0]) * dy;
    }
    else {
        xInc = -1;
        n += x - Math.floor(pos1[0]);
        error = (pos0[0] - Math.floor(pos0[0])) * dy;
    }
    if (pos1[1] > pos0[1]) {
        yInc = 1;
        n += Math.floor(pos1[1]) - y;
        error -= (Math.floor(pos0[1]) + 1 - pos0[1]) * dx;
    }
    else {
        yInc = -1;
        n += y - Math.floor(pos1[1]);
        error -= (pos0[1] - Math.floor(pos0[1])) * dx;
    }
    while (n > 0) {
        if (x < 0 || y < 0 || x >= solid.sizeX || y >= solid.sizeY)
            return false;
        const isSolid = solid.get(x, y);
        if (isSolid)
            return false;
        if (error > 0) {
            y += yInc;
            error -= dx;
        }
        else {
            x += xInc;
            error += dy;
        }
        --n;
    }
    return true;
}
function renderPerson(renderer, lighting, matScreenFromWorld, person) {
    const skinColor = vec3.fromValues(1, 0.8, 0.5);
    const eyeWhiteColor = vec3.fromValues(1, 1, 1);
    const eyeCenterColor = vec3.fromValues(0, 0, 0);
    const xfm = new MatrixStack();
    xfm.translate(person.position);
    xfm.rotateZ(person.heading);
    xfm.scaleXYZ(0.66667, 0.66667, 0.66667); // scale so body radius is 0.5
    // Body
    xfm.push(); // body
    xfm.translateZ(1);
    xfm.scaleXYZ(0.75, 0.75, 1);
    renderer.renderGeom(renderer.geomCylinder, matScreenFromWorld, xfm.top(), lighting, person.clothingColor);
    xfm.pop(); // body
    // Head
    xfm.push(); // head
    xfm.translateZ(2); // up to neck
    xfm.rotateZ(person.headHeading);
    xfm.rotateY(person.headPitch);
    xfm.translateZ(1); // up to center of head
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, skinColor);
    xfm.push(); // nose
    xfm.translateX(1);
    xfm.scaleXYZ(0.25, 0.25, 0.25);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, skinColor);
    xfm.pop(); // nose
    xfm.push(); // eyes
    xfm.translateX(0.8);
    xfm.translateZ(0.2);
    xfm.push(); // left eye
    xfm.translateY(0.3);
    xfm.rotateZ(person.eyeLHeading);
    xfm.rotateY(person.eyeLPitch);
    xfm.push(); // eyeball
    xfm.scaleXYZ(0.25, 0.25, 0.25);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, person.eyeLOpen ? eyeWhiteColor : skinColor);
    xfm.pop(); // eyeball
    if (person.eyeLOpen) {
        xfm.translateX(0.06);
        xfm.scaleXYZ(0.2, 0.2, 0.2);
        renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, eyeCenterColor);
    }
    xfm.pop(); // left eye
    xfm.push(); // right eye
    xfm.translateY(-0.3);
    xfm.rotateZ(person.eyeRHeading);
    xfm.rotateY(person.eyeRPitch);
    xfm.push(); // eyeball
    xfm.scaleXYZ(0.25, 0.25, 0.25);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, person.eyeROpen ? eyeWhiteColor : skinColor);
    xfm.pop(); // eyeball
    if (person.eyeROpen) {
        xfm.translateX(0.06);
        xfm.scaleXYZ(0.2, 0.2, 0.2);
        renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, eyeCenterColor);
    }
    xfm.pop(); // right eye
    xfm.pop(); // eyes
    xfm.pop(); // head
    // Arms
    xfm.push(); // arms
    xfm.translateZ(2);
    // Left arm
    xfm.push(); // left arm
    xfm.translateY(0.95);
    xfm.rotateY(person.armAngle);
    xfm.push(); // sleeve
    xfm.translateZ(-0.5);
    xfm.scaleXYZ(0.2, 0.2, 0.5);
    renderer.renderGeom(renderer.geomCylinder, matScreenFromWorld, xfm.top(), lighting, person.clothingColor);
    xfm.pop(); // sleeve
    xfm.push(); // shoulder
    xfm.scaleXYZ(0.35, 0.35, 0.35);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, person.clothingColor);
    xfm.pop(); // shoulder
    xfm.push(); // hand
    xfm.translateZ(-1.25);
    xfm.scaleXYZ(0.25, 0.25, 0.25);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, skinColor);
    xfm.pop(); // hand
    xfm.pop(); // left arm
    // Right arm
    xfm.push(); // right arm
    xfm.translateY(-0.95);
    xfm.rotateY(-person.armAngle);
    xfm.push(); // sleeve
    xfm.translateZ(-0.5);
    xfm.scaleXYZ(0.2, 0.2, 0.5);
    renderer.renderGeom(renderer.geomCylinder, matScreenFromWorld, xfm.top(), lighting, person.clothingColor);
    xfm.pop(); // sleeve
    xfm.push(); // shoulder
    xfm.scaleXYZ(0.35, 0.35, 0.35);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, person.clothingColor);
    xfm.pop(); // shoulder
    xfm.push(); // hand
    xfm.translateZ(-1.25);
    xfm.scaleXYZ(0.25, 0.25, 0.25);
    renderer.renderGeom(renderer.geomSphere, matScreenFromWorld, xfm.top(), lighting, skinColor);
    xfm.pop(); // hand
    xfm.pop(); // right arm
    xfm.pop(); // arms
}
function renderScene(renderer, state) {
    const screenSize = vec2.create();
    renderer.beginFrame(screenSize);
    const matScreenFromWorld = mat4.create();
    setupViewMatrix(state, screenSize, matScreenFromWorld);
    state.renderColoredTriangles(matScreenFromWorld);
    renderTurretsDead(state.level.turrets, renderer, matScreenFromWorld);
    renderSwarmersDead(state.level.swarmers, renderer, matScreenFromWorld);
    renderLootItems(state, renderer, matScreenFromWorld);
    renderTurretsAlive(state, state.level.turrets, renderer, matScreenFromWorld);
    renderSwarmersAlive(state.level.swarmers, renderer, matScreenFromWorld);
    renderTurretBullets(state.turretBullets, renderer, matScreenFromWorld);
    renderPlayerBullets(state, renderer, matScreenFromWorld);
    renderPlayer(state, renderer, matScreenFromWorld);
    renderer.setDepthTestEnabled(true);
    const speed = vec2.length(state.player.velocity);
    const maxArmSwingAngle = Math.min(0.5, 0.1 * speed);
    const personRenderState = {
        position: vec3.fromValues(state.player.position[0], state.player.position[1], 0),
        heading: state.player.heading,
        headHeading: state.player.headHeading,
        headPitch: 0.125,
        eyeLHeading: 0,
        eyeRHeading: 0,
        eyeLPitch: 0,
        eyeRPitch: 0,
        eyeLOpen: state.player.eyesOpen,
        eyeROpen: state.player.eyesOpen,
        armAngle: maxArmSwingAngle * Math.sin(state.player.armPhase * 2.0 * Math.PI),
        clothingColor: vec3.fromValues(0.5, 0.8, 1),
    };
    renderPerson(renderer, state.lighting, matScreenFromWorld, personRenderState);
    // Status displays
    renderer.setDepthTestEnabled(false);
    renderLootCounter(state, renderer, screenSize);
    // Text
    if (state.paused) {
        renderTextLines(renderer, screenSize, [
            'Paused: Click to unpause',
        ]);
    }
}
function setupViewMatrix(state, screenSize, matScreenFromWorld) {
    if (state.showMap) {
        const mapSizeX = state.level.solid.sizeX + 2;
        const mapSizeY = state.level.solid.sizeY + 2;
        let rxMap, ryMap;
        if (screenSize[0] * mapSizeY < screenSize[1] * mapSizeX) {
            // horizontal is limiting dimension
            rxMap = mapSizeX / 2;
            ryMap = rxMap * screenSize[1] / screenSize[0];
        }
        else {
            // vertical is limiting dimension
            ryMap = mapSizeY / 2;
            rxMap = ryMap * screenSize[0] / screenSize[1];
        }
        const cxMap = state.level.solid.sizeX / 2;
        const cyMap = state.level.solid.sizeY / 2;
        mat4.identity(matScreenFromWorld);
        mat4.translate(matScreenFromWorld, vec3.fromValues(-cxMap, -cyMap, 0));
        mat4.scale(matScreenFromWorld, vec3.fromValues(1 / rxMap, 1 / ryMap, -0.1));
    }
    else {
        const cxGame = state.camera.position[0];
        const cyGame = state.camera.position[1];
        const rGame = 6;
        let rxGame, ryGame;
        if (screenSize[0] < screenSize[1]) {
            rxGame = rGame;
            ryGame = rGame * screenSize[1] / screenSize[0];
        }
        else {
            ryGame = rGame;
            rxGame = rGame * screenSize[0] / screenSize[1];
        }
        const ySlope = 0.4; // ryGame / rzGame --> rzGame = ryGame / ySlope
        const tiltAngle = 1.0; //1.3;
        const czGame = ryGame / ySlope;
        mat4.identity(matScreenFromWorld);
        mat4.translate(matScreenFromWorld, vec3.fromValues(-cxGame, -cyGame, 0));
        mat4.rotateZ(matScreenFromWorld, Math.PI / 2 - state.camera.heading);
        mat4.rotateX(matScreenFromWorld, tiltAngle);
        mat4.translate(matScreenFromWorld, vec3.fromValues(0, 0, -czGame));
        mat4.frustum(matScreenFromWorld, -rxGame / 2, rxGame / 2, -ryGame / 2, ryGame / 2, czGame / 2, czGame * 4);
    }
}
function renderLootCounter(state, renderer, screenSize) {
    const numLootItemsTotal = state.level.numLootItemsTotal;
    const numLootItemsCollected = numLootItemsTotal - state.level.lootItems.length;
    const strMsg = numLootItemsCollected + '/' + numLootItemsTotal + '\x0f';
    const cCh = strMsg.length;
    const minCharsX = 40;
    const minCharsY = 20;
    const scaleLargestX = Math.max(1, Math.floor(screenSize[0] / (8 * minCharsX)));
    const scaleLargestY = Math.max(1, Math.floor(screenSize[1] / (16 * minCharsY)));
    const scaleFactor = Math.min(scaleLargestX, scaleLargestY);
    const pixelsPerCharX = 8 * scaleFactor;
    const pixelsPerCharY = 16 * scaleFactor;
    const numCharsX = screenSize[0] / pixelsPerCharX;
    const numCharsY = screenSize[1] / pixelsPerCharY;
    const offsetX = (cCh + 1) - numCharsX;
    const offsetY = 0;
    const matScreenFromTextArea = mat4.create();
    mat4.ortho(matScreenFromTextArea, offsetX, offsetX + numCharsX, offsetY, offsetY + numCharsY, 1, -1);
    renderer.renderGlyphs.start(matScreenFromTextArea);
    const color = 0xff55ffff;
    for (let i = 0; i < cCh; ++i) {
        const glyphIndex = strMsg.charCodeAt(i);
        renderer.renderGlyphs.addGlyph(i, 0, i + 1, 1, glyphIndex, color);
    }
    renderer.renderGlyphs.flush();
}
function renderTextLines(renderer, screenSize, lines) {
    let maxLineLength = 0;
    for (const line of lines) {
        maxLineLength = Math.max(maxLineLength, line.length);
    }
    const minCharsX = 40;
    const minCharsY = 22;
    const scaleLargestX = Math.max(1, Math.floor(screenSize[0] / (8 * minCharsX)));
    const scaleLargestY = Math.max(1, Math.floor(screenSize[1] / (16 * minCharsY)));
    const scaleFactor = Math.min(scaleLargestX, scaleLargestY);
    const pixelsPerCharX = 8 * scaleFactor;
    const pixelsPerCharY = 16 * scaleFactor;
    const linesPixelSizeX = maxLineLength * pixelsPerCharX;
    const numCharsX = screenSize[0] / pixelsPerCharX;
    const numCharsY = screenSize[1] / pixelsPerCharY;
    const offsetX = Math.floor((screenSize[0] - linesPixelSizeX) / -2) / pixelsPerCharX;
    const offsetY = (lines.length + 2) - numCharsY;
    const matScreenFromTextArea = mat4.create();
    mat4.ortho(matScreenFromTextArea, offsetX, offsetX + numCharsX, offsetY, offsetY + numCharsY, 1, -1);
    renderer.renderGlyphs.start(matScreenFromTextArea);
    const colorText = 0xffeeeeee;
    const colorBackground = 0xe0555555;
    // Draw a stretched box to make a darkened background for the text.
    renderer.renderGlyphs.addGlyph(-1, -1, maxLineLength + 1, lines.length + 1, 219, colorBackground);
    for (let i = 0; i < lines.length; ++i) {
        const row = lines.length - (1 + i);
        for (let j = 0; j < lines[i].length; ++j) {
            const col = j;
            const ch = lines[i];
            if (ch === ' ') {
                continue;
            }
            const glyphIndex = lines[i].charCodeAt(j);
            renderer.renderGlyphs.addGlyph(col, row, col + 1, row + 1, glyphIndex, colorText);
        }
    }
    renderer.renderGlyphs.flush();
}
function resizeCanvasToDisplaySize(canvas) {
    const parentElement = canvas.parentNode;
    const rect = parentElement.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
}
function initShaderProgram(gl, vsSource, fsSource, attribs) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    for (const attrib in attribs) {
        gl.bindAttribLocation(program, attribs[attrib], attrib);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    }
    return program;
}
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    return shader;
}
function priorityQueuePop(q) {
    const x = q[0];
    q[0] = q[q.length - 1]; // q.at(-1);
    q.pop();
    let i = 0;
    const c = q.length;
    while (true) {
        let iChild = i;
        const iChild0 = 2 * i + 1;
        if (iChild0 < c && q[iChild0].priority < q[iChild].priority) {
            iChild = iChild0;
        }
        const iChild1 = iChild0 + 1;
        if (iChild1 < c && q[iChild1].priority < q[iChild].priority) {
            iChild = iChild1;
        }
        if (iChild == i) {
            break;
        }
        [q[i], q[iChild]] = [q[iChild], q[i]];
        i = iChild;
    }
    return x;
}
function priorityQueuePush(q, x) {
    q.push(x);
    let i = q.length - 1;
    while (i > 0) {
        const iParent = Math.floor((i - 1) / 2);
        if (q[i].priority >= q[iParent].priority) {
            break;
        }
        [q[i], q[iParent]] = [q[iParent], q[i]];
        i = iParent;
    }
}
function randomInRange(n) {
    return Math.floor(Math.random() * n);
}
function createLevel() {
    // Create some rooms in a grid.
    const roomGrid = [];
    for (let roomY = 0; roomY < numCellsY; ++roomY) {
        roomGrid[roomY] = [];
        for (let roomX = 0; roomX < numCellsX; ++roomX) {
            roomGrid[roomY][roomX] = roomY * numCellsX + roomX;
        }
    }
    // Build a minimum spanning tree of the rooms.
    const potentialEdges = [];
    for (let roomY = 0; roomY < numCellsY; ++roomY) {
        for (let roomX = 1; roomX < numCellsX; ++roomX) {
            const room1 = roomY * numCellsX + roomX;
            const room0 = room1 - 1;
            potentialEdges.push([room0, room1]);
        }
    }
    for (let roomY = 1; roomY < numCellsY; ++roomY) {
        for (let roomX = 0; roomX < numCellsX; ++roomX) {
            const room1 = roomY * numCellsX + roomX;
            const room0 = room1 - numCellsX;
            potentialEdges.push([room0, room1]);
        }
    }
    shuffleArray(potentialEdges);
    const numRooms = numCellsX * numCellsY;
    const roomGroup = [];
    for (let i = 0; i < numRooms; ++i) {
        roomGroup.push(i);
    }
    const edges = [];
    // Add edges between as-yet-unconnected sub-graphs
    for (const edge of potentialEdges) {
        const group0 = roomGroup[edge[0]];
        const group1 = roomGroup[edge[1]];
        if (group0 == group1)
            continue;
        edges.push(edge);
        for (let i = 0; i < numRooms; ++i) {
            if (roomGroup[i] === group1) {
                roomGroup[i] = group0;
            }
        }
    }
    // Calculate all-pairs shortest path distances
    const dist = [];
    for (let i = 0; i < numRooms; ++i) {
        dist[i] = [];
        for (let j = 0; j < numRooms; ++j) {
            dist[i][j] = (i == j) ? 0 : Infinity;
        }
    }
    for (const edge of edges) {
        dist[edge[0]][edge[1]] = 1;
        dist[edge[1]][edge[0]] = 1;
    }
    for (let k = 0; k < numRooms; ++k) {
        for (let i = 0; i < numRooms; ++i) {
            for (let j = 0; j < numRooms; ++j) {
                if (dist[i][j] > dist[i][k] + dist[k][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }
    // Pick a starting room and an ending room that are maximally distant
    let maxDistPairs = [];
    let maxDist = 0;
    for (let i = 0; i < numRooms; ++i) {
        for (let j = i + 1; j < numRooms; ++j) {
            if (dist[i][j] > maxDist) {
                maxDist = dist[i][j];
                maxDistPairs = [[i, j]];
            }
            else if (dist[i][j] == maxDist) {
                maxDistPairs.push([i, j]);
            }
        }
    }
    shuffleArray(maxDistPairs);
    shuffleArray(maxDistPairs[0]);
    const roomIndexEntrance = maxDistPairs[0][0];
    const roomIndexExit = maxDistPairs[0][1];
    // Compute distances for each room from the entrance.
    const roomDistanceFromEntrance = [];
    const roomDistanceFromExit = [];
    computeDistances(roomDistanceFromEntrance, numRooms, edges, roomIndexEntrance);
    computeDistances(roomDistanceFromExit, numRooms, edges, roomIndexExit);
    // Find dead-end rooms and add edges to them if they don't change the length
    // of the path from the entrance to the exit.
    filterInPlace(potentialEdges, edge => !hasEdge(edges, edge[0], edge[1]));
    const roomIndexShuffled = [];
    for (let i = 0; i < numRooms; ++i) {
        roomIndexShuffled.push(i);
    }
    shuffleArray(roomIndexShuffled);
    const minDistEntranceToExit = roomDistanceFromEntrance[roomIndexExit];
    for (const roomIndex of roomIndexShuffled) {
        const numEdgesCur = edges.reduce((count, edge) => count + ((edge[0] == roomIndex || edge[1] == roomIndex) ? 1 : 0), 0);
        if (numEdgesCur != 1) {
            continue;
        }
        const edgesToAdd = potentialEdges.filter(edge => edge[0] == roomIndex || edge[1] == roomIndex);
        filterInPlace(edgesToAdd, edge => {
            const e0 = edge[0];
            const e1 = edge[1];
            if (hasEdge(edges, e0, e1)) {
                return false;
            }
            const newDistEntranceToExit = 1 + Math.min(roomDistanceFromEntrance[e0] + roomDistanceFromExit[e1], roomDistanceFromEntrance[e1] + roomDistanceFromExit[e0]);
            return newDistEntranceToExit >= minDistEntranceToExit;
        });
        if (edgesToAdd.length > 0) {
            edges.push(edgesToAdd[randomInRange(edgesToAdd.length)]);
            computeDistances(roomDistanceFromEntrance, numRooms, edges, roomIndexEntrance);
            computeDistances(roomDistanceFromExit, numRooms, edges, roomIndexExit);
        }
    }
    // Pick sizes for the rooms. The entrance and exit rooms are special and
    // have fixed sizes.
    const minRoomSize = corridorWidth + 6;
    const maxRoomSize = 33;
    const squaresPerBlock = maxRoomSize + corridorWidth + 2;
    const rooms = [];
    for (let roomY = 0; roomY < numCellsY; ++roomY) {
        for (let roomX = 0; roomX < numCellsX; ++roomX) {
            const roomIndex = roomY * numCellsX + roomX;
            let roomSizeX, roomSizeY;
            if (roomIndex == roomIndexEntrance) {
                roomSizeX = 7;
                roomSizeY = 7;
            }
            else if (roomIndex == roomIndexExit) {
                roomSizeX = maxRoomSize;
                roomSizeY = maxRoomSize;
            }
            else {
                const halfRoomSizeRange = 1 + Math.floor((maxRoomSize - minRoomSize) / 2);
                roomSizeX = randomInRange(halfRoomSizeRange) + randomInRange(halfRoomSizeRange) + minRoomSize;
                roomSizeY = randomInRange(halfRoomSizeRange) + randomInRange(halfRoomSizeRange) + minRoomSize;
            }
            const cellMinX = roomX * squaresPerBlock;
            const cellMinY = roomY * squaresPerBlock;
            const roomMinX = randomInRange(1 + maxRoomSize - roomSizeX) + cellMinX + 1;
            const roomMinY = randomInRange(1 + maxRoomSize - roomSizeY) + cellMinY + 1;
            const room = {
                minX: roomMinX,
                minY: roomMinY,
                sizeX: roomSizeX,
                sizeY: roomSizeY,
            };
            rooms.push(room);
        }
    }
    // Compress the rooms together where possible
    const [mapSizeX, mapSizeY] = compressRooms(roomGrid, edges, rooms);
    // Plot rooms into a grid
    const grid = new TerrainTypeGrid(mapSizeX, mapSizeY, TerrainType.Solid);
    for (const room of rooms) {
        for (let y = 0; y < room.sizeY; ++y) {
            for (let x = 0; x < room.sizeX; ++x) {
                grid.set(x + room.minX, y + room.minY, TerrainType.Room);
            }
        }
        for (let x = 0; x < room.sizeX; ++x) {
            grid.set(x + room.minX, room.minY - 1, TerrainType.Wall);
            grid.set(x + room.minX, room.minY + room.sizeY, TerrainType.Wall);
        }
        for (let y = 0; y < room.sizeY + 2; ++y) {
            grid.set(room.minX - 1, y + room.minY - 1, TerrainType.Wall);
            grid.set(room.minX + room.sizeX, y + room.minY - 1, TerrainType.Wall);
        }
    }
    // Decorate the rooms
    const roomsToDecorate = rooms.filter((room, roomIndex) => roomIndex != roomIndexEntrance && roomIndex != roomIndexExit);
    decorateRooms(roomsToDecorate, grid);
    tryCreatePillarRoom(rooms[roomIndexExit], grid);
    // Plot corridors into grid
    for (let roomY = 0; roomY < numCellsY; ++roomY) {
        for (let roomX = 0; roomX < (numCellsX - 1); ++roomX) {
            const roomIndex0 = roomY * numCellsX + roomX;
            const roomIndex1 = roomIndex0 + 1;
            if (!hasEdge(edges, roomIndex0, roomIndex1)) {
                continue;
            }
            const room0 = rooms[roomIndex0];
            const room1 = rooms[roomIndex1];
            const xMin = room0.minX + room0.sizeX;
            const xMax = room1.minX;
            const xMid = Math.floor((xMax - (xMin + 1 + corridorWidth)) / 2) + xMin + 1;
            const yMinIntersect = Math.max(room0.minY, room1.minY) + 1;
            const yMaxIntersect = Math.min(room0.minY + room0.sizeY, room1.minY + room1.sizeY) - 1;
            const yRangeIntersect = yMaxIntersect - yMinIntersect;
            let yMinLeft, yMinRight;
            if (yRangeIntersect >= corridorWidth) {
                yMinLeft = yMinRight = yMinIntersect + Math.floor((yRangeIntersect - corridorWidth) / 2);
            }
            else {
                yMinLeft = Math.floor((room0.sizeY - corridorWidth) / 2) + room0.minY;
                yMinRight = Math.floor((room1.sizeY - corridorWidth) / 2) + room1.minY;
            }
            for (let x = xMin; x < xMid; ++x) {
                for (let y = 0; y < corridorWidth; ++y) {
                    grid.set(x, yMinLeft + y, TerrainType.Hall);
                }
            }
            for (let x = xMid + corridorWidth; x < xMax; ++x) {
                for (let y = 0; y < corridorWidth; ++y) {
                    grid.set(x, yMinRight + y, TerrainType.Hall);
                }
            }
            const yMin = Math.min(yMinLeft, yMinRight);
            const yMax = Math.max(yMinLeft, yMinRight);
            for (let y = yMin; y < yMax + corridorWidth; ++y) {
                for (let x = 0; x < corridorWidth; ++x) {
                    grid.set(xMid + x, y, TerrainType.Hall);
                }
            }
        }
    }
    for (let roomY = 0; roomY < (numCellsY - 1); ++roomY) {
        for (let roomX = 0; roomX < numCellsX; ++roomX) {
            const roomIndex0 = roomY * numCellsX + roomX;
            const roomIndex1 = roomIndex0 + numCellsX;
            if (!hasEdge(edges, roomIndex0, roomIndex1)) {
                continue;
            }
            const room0 = rooms[roomIndex0];
            const room1 = rooms[roomIndex1];
            const xMinIntersect = Math.max(room0.minX, room1.minX) + 1;
            const xMaxIntersect = Math.min(room0.minX + room0.sizeX, room1.minX + room1.sizeX) - 1;
            const xRangeIntersect = xMaxIntersect - xMinIntersect;
            let xMinLower, xMinUpper;
            if (xRangeIntersect >= corridorWidth) {
                xMinLower = xMinUpper = xMinIntersect + Math.floor((xRangeIntersect - corridorWidth) / 2);
            }
            else {
                xMinLower = Math.floor((room0.sizeX - corridorWidth) / 2) + room0.minX;
                xMinUpper = Math.floor((room1.sizeX - corridorWidth) / 2) + room1.minX;
            }
            const yMin = room0.minY + room0.sizeY;
            const yMax = room1.minY;
            const yMid = Math.floor((yMax - (yMin + 1 + corridorWidth)) / 2) + yMin + 1;
            for (let y = yMin; y < yMid; ++y) {
                for (let x = 0; x < corridorWidth; ++x) {
                    grid.set(xMinLower + x, y, TerrainType.Hall);
                }
            }
            for (let y = yMid + corridorWidth; y < yMax; ++y) {
                for (let x = 0; x < corridorWidth; ++x) {
                    grid.set(xMinUpper + x, y, TerrainType.Hall);
                }
            }
            const xMin = Math.min(xMinLower, xMinUpper);
            const xMax = Math.max(xMinLower, xMinUpper);
            for (let x = xMin; x < xMax + corridorWidth; ++x) {
                for (let y = 0; y < corridorWidth; ++y) {
                    grid.set(x, yMid + y, TerrainType.Hall);
                }
            }
        }
    }
    // Convert to colored squares.
    const roomColor = 0xff808080;
    const hallColor = 0xff707070;
    const wallColor = 0xff0055aa;
    const squares = [];
    for (let y = 0; y < grid.sizeY; ++y) {
        for (let x = 0; x < grid.sizeX; ++x) {
            const type = grid.get(x, y);
            if (type == TerrainType.Room) {
                squares.push({ x: x, y: y, color: roomColor });
            }
            else if (type == TerrainType.Hall) {
                squares.push({ x: x, y: y, color: hallColor });
            }
            else if (type == TerrainType.Wall) {
                squares.push({ x: x, y: y, color: wallColor });
            }
        }
    }
    // Convert squares to triangles
    const numVertices = squares.length * 6;
    const bytesPerVertex = 12;
    const vertexData = new ArrayBuffer(numVertices * bytesPerVertex);
    const vertexDataAsFloat32 = new Float32Array(vertexData);
    const vertexDataAsUint32 = new Uint32Array(vertexData);
    for (let i = 0; i < squares.length; ++i) {
        const j = 18 * i;
        const color = squares[i].color;
        const x0 = squares[i].x;
        const y0 = squares[i].y;
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        vertexDataAsFloat32[j + 0] = x0;
        vertexDataAsFloat32[j + 1] = y0;
        vertexDataAsUint32[j + 2] = color;
        vertexDataAsFloat32[j + 3] = x1;
        vertexDataAsFloat32[j + 4] = y0;
        vertexDataAsUint32[j + 5] = color;
        vertexDataAsFloat32[j + 6] = x0;
        vertexDataAsFloat32[j + 7] = y1;
        vertexDataAsUint32[j + 8] = color;
        vertexDataAsFloat32[j + 9] = x0;
        vertexDataAsFloat32[j + 10] = y1;
        vertexDataAsUint32[j + 11] = color;
        vertexDataAsFloat32[j + 12] = x1;
        vertexDataAsFloat32[j + 13] = y0;
        vertexDataAsUint32[j + 14] = color;
        vertexDataAsFloat32[j + 15] = x1;
        vertexDataAsFloat32[j + 16] = y1;
        vertexDataAsUint32[j + 17] = color;
    }
    // Pick a starting position within the starting room
    const startRoom = rooms[roomIndexEntrance];
    const playerStartPos = vec2.fromValues(startRoom.minX + startRoom.sizeX / 2, startRoom.minY + startRoom.sizeY / 2);
    // Put an exit position in the exit room
    const amuletRoom = rooms[roomIndexExit];
    const amuletPos = vec2.fromValues(amuletRoom.minX + amuletRoom.sizeX / 2 - 0.5, amuletRoom.minY + amuletRoom.sizeY / 2 - 0.5);
    const positionsUsed = [amuletPos];
    // Create a boolean grid indicating which squares on the map are solid and which are open space
    const solid = new BooleanGrid(grid.sizeX, grid.sizeY, false);
    for (let x = 0; x < grid.sizeX; ++x) {
        for (let y = 0; y < grid.sizeY; ++y) {
            const terrainType = grid.get(x, y);
            const isSolid = terrainType == TerrainType.Solid || terrainType == TerrainType.Wall;
            solid.set(x, y, isSolid);
        }
    }
    // Enemies
    const [turrets, swarmers] = createEnemies(rooms, roomDistanceFromEntrance, solid, positionsUsed);
    // Place loot in the level. Distribute it so rooms that are far from
    // the entrance or the exit have the most? Or so dead ends have the
    // most? Bias toward the rooms that aren't on the path between the
    // entrance and the exit?
    const lootItems = createLootItems(rooms, positionsUsed, roomIndexEntrance, amuletPos, solid);
    return {
        solid: solid,
        vertexData: vertexData,
        playerStartPos: playerStartPos,
        startRoom: startRoom,
        amuletRoom: amuletRoom,
        amuletPos: amuletPos,
        turrets: turrets,
        swarmers: swarmers,
        lootItems: lootItems,
        numLootItemsTotal: lootItems.length,
    };
}
function computeDistances(roomDistance, numRooms, edges, roomIndexStart) {
    roomDistance.length = numRooms;
    roomDistance.fill(numRooms);
    const toVisit = [{ priority: 0, value: roomIndexStart }];
    while (toVisit.length > 0) {
        const { priority, value: roomIndex } = priorityQueuePop(toVisit);
        if (roomDistance[roomIndex] <= priority) {
            continue;
        }
        roomDistance[roomIndex] = priority;
        const dist = priority + 1;
        for (const edge of edges) {
            if (edge[0] == roomIndex) {
                if (roomDistance[edge[1]] > dist) {
                    priorityQueuePush(toVisit, { priority: dist, value: edge[1] });
                }
            }
            else if (edge[1] == roomIndex) {
                if (roomDistance[edge[0]] > dist) {
                    priorityQueuePush(toVisit, { priority: dist, value: edge[0] });
                }
            }
        }
    }
}
function createEnemies(rooms, roomDistance, solid, positionsUsed) {
    const turrets = [];
    const swarmers = [];
    const dMax = roomDistance.reduce((d0, d1) => Math.max(d0, d1), 0);
    for (let roomIndex = 0; roomIndex < roomDistance.length; ++roomIndex) {
        const d = roomDistance[roomIndex];
        if (d === 0)
            continue;
        const room = rooms[roomIndex];
        const depthDensity = lerp(0.005, 0.035, d / dMax);
        const maxEnemies = Math.ceil(room.sizeX * room.sizeY * depthDensity);
        let numEnemies = 0;
        for (let i = 0; i < 1024 && numEnemies < maxEnemies; ++i) {
            // Pick a kind of monster to create.
            const monsterKind = Math.random();
            let success = false;
            if ((monsterKind < 0.7 || d < 3) && d != 3) {
                success = tryCreateTurret(room, turrets, solid, positionsUsed);
            }
            else {
                success = tryCreateSwarmer(room, swarmers, solid, positionsUsed);
            }
            if (success) {
                ++numEnemies;
            }
        }
    }
    return [turrets, swarmers];
}
function tryCreateTurret(room, turrets, solid, positionsUsed) {
    const x = Math.random() * (room.sizeX - 2 * monsterRadius) + room.minX + monsterRadius;
    const y = Math.random() * (room.sizeY - 2 * monsterRadius) + room.minY + monsterRadius;
    const position = vec2.fromValues(x, y);
    if (isDiscTouchingLevel(position, monsterRadius * 2, solid)) {
        return false;
    }
    if (isPositionTooCloseToOtherPositions(positionsUsed, 4 * monsterRadius, position)) {
        return false;
    }
    turrets.push({
        position: position,
        velocity: vec2.fromValues(0, 0),
        radius: monsterRadius,
        onContactCooldown: false,
        dead: false,
        timeToFire: Math.random() * turretFireDelayStart,
    });
    positionsUsed.push(position);
    return true;
}
function tryCreateSwarmer(room, swarmers, solid, positionsUsed) {
    const x = Math.random() * (room.sizeX - 2 * monsterRadius) + room.minX + monsterRadius;
    const y = Math.random() * (room.sizeY - 2 * monsterRadius) + room.minY + monsterRadius;
    const position = vec2.fromValues(x, y);
    if (isDiscTouchingLevel(position, monsterRadius * 2, solid)) {
        return false;
    }
    if (isPositionTooCloseToOtherPositions(positionsUsed, 4 * monsterRadius, position)) {
        return false;
    }
    swarmers.push({
        position: position,
        velocity: vec2.fromValues(0, 0),
        radius: monsterRadius,
        heading: Math.random(),
        headingRate: (Math.random() * 0.15 + 0.15) * (randomInRange(2) * 2 - 1),
        onContactCooldown: false,
        dead: false,
    });
    positionsUsed.push(position);
    return true;
}
function compressRooms(roomGrid, edges, rooms) {
    const numRoomsX = roomGrid[0].length;
    const numRoomsY = roomGrid.length;
    // Try to shift each row downward as much as possible
    for (let roomY = 0; roomY < numRoomsY; ++roomY) {
        let gapMin = Number.MIN_SAFE_INTEGER;
        let gapMax = Number.MAX_SAFE_INTEGER;
        let hasBentCorridor = false;
        for (let roomX = 0; roomX < numRoomsX; ++roomX) {
            const roomIndex0 = (roomY > 0) ? roomGrid[roomY - 1][roomX] : null;
            const roomIndex1 = roomGrid[roomY][roomX];
            const room0 = (roomIndex0 === null) ? null : rooms[roomIndex0];
            const room1 = rooms[roomIndex1];
            const gapMinY = (room0 === null) ? 0 : room0.minY + room0.sizeY + 2;
            const gapMaxY = room1.minY - 1;
            if (room0 !== null &&
                hasEdge(edges, roomIndex0, roomIndex1) &&
                !canHaveStraightVerticalHall(room0, room1)) {
                hasBentCorridor = true;
            }
            gapMin = Math.max(gapMin, gapMinY);
            gapMax = Math.min(gapMax, gapMaxY);
        }
        // Do the shift
        let gapSize = gapMax - gapMin - (hasBentCorridor ? (corridorWidth + 2) : 0);
        if (gapSize > 0) {
            for (let roomYShift = roomY; roomYShift < numRoomsY; ++roomYShift) {
                for (let roomXShift = 0; roomXShift < numRoomsX; ++roomXShift) {
                    const room = rooms[roomGrid[roomYShift][roomXShift]];
                    room.minY -= gapSize;
                }
            }
        }
    }
    // Try to shift each column leftward as much as possible
    for (let roomX = 0; roomX < numRoomsX; ++roomX) {
        let gapMin = Number.MIN_SAFE_INTEGER;
        let gapMax = Number.MAX_SAFE_INTEGER;
        let hasBentCorridor = false;
        for (let roomY = 0; roomY < numRoomsY; ++roomY) {
            const roomIndex0 = (roomX > 0) ? roomGrid[roomY][roomX - 1] : null;
            const roomIndex1 = roomGrid[roomY][roomX];
            const room0 = (roomIndex0 === null) ? null : rooms[roomIndex0];
            const room1 = rooms[roomIndex1];
            const gapMinX = (room0 === null) ? 0 : room0.minX + room0.sizeX + 2;
            const gapMaxX = room1.minX - 1;
            if (room0 !== null &&
                hasEdge(edges, roomIndex0, roomIndex1) &&
                !canHaveStraightHorizontalHall(room0, room1)) {
                hasBentCorridor = true;
            }
            gapMin = Math.max(gapMin, gapMinX);
            gapMax = Math.min(gapMax, gapMaxX);
        }
        // Do the shift
        let gapSize = gapMax - gapMin - (hasBentCorridor ? (corridorWidth + 2) : 0);
        if (gapSize > 0) {
            for (let roomYShift = 0; roomYShift < numRoomsY; ++roomYShift) {
                for (let roomXShift = roomX; roomXShift < numRoomsX; ++roomXShift) {
                    const room = rooms[roomGrid[roomYShift][roomXShift]];
                    room.minX -= gapSize;
                }
            }
        }
    }
    // Compute the new map dimensions
    let mapSizeX = 0;
    let mapSizeY = 0;
    for (let roomY = 0; roomY < numRoomsY; ++roomY) {
        const roomIndex = roomGrid[roomY][numRoomsX - 1];
        const room = rooms[roomIndex];
        mapSizeX = Math.max(mapSizeX, room.minX + room.sizeX + 1);
    }
    for (let roomX = 0; roomX < numRoomsX; ++roomX) {
        const roomIndex = roomGrid[numRoomsY - 1][roomX];
        const room = rooms[roomIndex];
        mapSizeY = Math.max(mapSizeY, room.minY + room.sizeY + 1);
    }
    return [mapSizeX, mapSizeY];
}
function decorateRooms(rooms, grid) {
    const roomsShuffled = [...rooms];
    shuffleArray(roomsShuffled);
    tryPlacePillarRoom(roomsShuffled, grid);
    tryPlaceCenterObstacleRoom(roomsShuffled, grid);
    tryPlacePillarRoom(roomsShuffled, grid);
    tryPlaceCenterObstacleRoom(roomsShuffled, grid);
    tryPlacePillarRoom(roomsShuffled, grid);
}
function tryPlacePillarRoom(rooms, grid) {
    for (let i = 0; i < rooms.length; ++i) {
        const room = rooms[i];
        if (tryCreatePillarRoom(room, grid)) {
            rooms[i] = rooms[rooms.length - 1];
            --rooms.length;
            break;
        }
    }
}
function tryCreatePillarRoom(room, grid) {
    if (room.sizeX < 13 || room.sizeY < 13)
        return false;
    if (((room.sizeX - 3) % 5) != 0 && ((room.sizeY - 3) % 5) != 0)
        return false;
    function plotPillar(x, y) {
        if (Math.random() < 0.125)
            return;
        x += room.minX;
        y += room.minY;
        grid.set(x, y, TerrainType.Wall);
        grid.set(x + 1, y, TerrainType.Wall);
        grid.set(x, y + 1, TerrainType.Wall);
        grid.set(x + 1, y + 1, TerrainType.Wall);
    }
    plotPillar(3, 3);
    plotPillar(3, room.sizeY - 5);
    plotPillar(room.sizeX - 5, 3);
    plotPillar(room.sizeX - 5, room.sizeY - 5);
    if (((room.sizeX - 3) % 5) == 0) {
        for (let x = 8; x < room.sizeX - 5; x += 5) {
            plotPillar(x, 3);
            plotPillar(x, room.sizeY - 5);
        }
    }
    if (((room.sizeY - 3) % 5) == 0) {
        for (let y = 8; y < room.sizeY - 5; y += 5) {
            plotPillar(3, y);
            plotPillar(room.sizeX - 5, y);
        }
    }
    return true;
}
function tryPlaceCenterObstacleRoom(rooms, grid) {
    for (let i = 0; i < rooms.length; ++i) {
        const room = rooms[i];
        if (room.sizeX < 15 || room.sizeY < 15)
            continue;
        rooms[i] = rooms[rooms.length - 1];
        --rooms.length;
        function plotRect(minX, minY, sizeX, sizeY, type) {
            for (let x = minX; x < minX + sizeX; ++x) {
                for (let y = minY; y < minY + sizeY; ++y) {
                    grid.set(x, y, type);
                }
            }
        }
        plotRect(room.minX + 6, room.minY + 6, room.sizeX - 12, room.sizeY - 12, TerrainType.Wall);
        plotRect(room.minX + 7, room.minY + 7, room.sizeX - 14, room.sizeY - 14, TerrainType.Solid);
        return;
    }
}
function createLootItems(rooms, positionsUsed, roomIndexEntrance, posAmulet, solid) {
    const numLoot = 100;
    const loot = [];
    for (let i = 0; i < 1024 && loot.length < numLoot; ++i) {
        const roomIndex = randomInRange(rooms.length);
        if (roomIndex == roomIndexEntrance) {
            continue;
        }
        const room = rooms[roomIndex];
        const x = Math.random() * (room.sizeX - 2 * lootRadius) + room.minX + lootRadius;
        const y = Math.random() * (room.sizeY - 2 * lootRadius) + room.minY + lootRadius;
        const position = vec2.fromValues(x, y);
        if (isDiscTouchingLevel(position, lootRadius * 2, solid)) {
            continue;
        }
        if (isPositionTooCloseToOtherPositions(positionsUsed, 2 * lootRadius + monsterRadius, position)) {
            continue;
        }
        const dposAmulet = vec2.create();
        vec2.subtract(dposAmulet, posAmulet, position);
        if (vec2.length(dposAmulet) < 12 * lootRadius)
            continue;
        positionsUsed.push(position);
        loot.push({ position: position });
    }
    return loot;
}
function renderLootItems(state, renderer, matScreenFromWorld) {
    const discs = state.level.lootItems.map(lootItem => ({
        position: lootItem.position,
        radius: lootRadius,
        discColor: 0xff737373,
        glyphColor: 0xff37ffff,
        glyphIndex: 15,
    }));
    discs.push({
        position: state.level.amuletPos,
        radius: lootRadius,
        discColor: 0xff262666,
        glyphColor: 0xff3737ff,
        glyphIndex: 12,
    });
    renderer.renderDiscs(matScreenFromWorld, discs);
}
function updateLootItems(state) {
    const dpos = vec2.create();
    filterInPlace(state.level.lootItems, lootItem => {
        vec2.subtract(dpos, lootItem.position, state.player.position);
        return (vec2.length(dpos) > playerRadius + lootRadius);
    });
}
function hasEdge(edges, roomIndex0, roomIndex1) {
    return edges.some(edge => edge[0] === roomIndex0 && edge[1] === roomIndex1);
}
function canHaveStraightVerticalHall(room0, room1) {
    const overlapMin = Math.max(room0.minX, room1.minX) + 1;
    const overlapMax = Math.min(room0.minX + room0.sizeX, room1.minX + room1.sizeX) - 1;
    const overlapSize = Math.max(0, overlapMax - overlapMin);
    return overlapSize >= corridorWidth;
}
function canHaveStraightHorizontalHall(room0, room1) {
    const overlapMin = Math.max(room0.minY, room1.minY) + 1;
    const overlapMax = Math.min(room0.minY + room0.sizeY, room1.minY + room1.sizeY) - 1;
    const overlapSize = Math.max(0, overlapMax - overlapMin);
    return overlapSize >= corridorWidth;
}
function isPositionTooCloseToOtherPositions(positions, separationDistance, position) {
    const dpos = vec2.create();
    for (const positionOther of positions) {
        vec2.subtract(dpos, position, positionOther);
        const d = vec2.length(dpos);
        if (d < separationDistance) {
            return true;
        }
    }
    return false;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; --i) {
        let j = randomInRange(i + 1);
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
