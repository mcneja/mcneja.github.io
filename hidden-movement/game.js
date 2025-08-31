"use strict";

window.onload = main;

const border = 0.025;
const nodeSpacing = 0.035;
const nodeSpacingSquared = nodeSpacing * nodeSpacing;

function main() {
    const graph = generateGraph();

    const state = {
        graph: graph,
        x: 0.5,
        y: 0.5,
        selectedNode: undefined,
    };

    const canvas = document.getElementById('canvas');

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    function requestRedraw() {
        requestAnimationFrame((now) => drawState(canvas, state));
    }

    function onPointerDown(e) {
        const rect = canvas.getBoundingClientRect();
        state.x = (e.clientX - rect.left) / canvas.width;
        state.y = (e.clientY - rect.top) / canvas.height;
        const node = closestNode(state.graph, state.x, state.y);
        state.selectedNode = (node === state.selectedNode) ? undefined : node;
        requestRedraw();
    }

    function onPointerMove(e) {
    }

    function onPointerUp(e) {
    }

    requestRedraw();
}

function drawState(canvas, state) {
    const canvasSizeX = canvas.width;
    const canvasSizeY = canvas.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(canvasSizeX, 0, 0, canvasSizeY, 0, 0);

    drawGraph(ctx, state.graph, state.selectedNode);

    /*
    const x = state.x;
    const y = state.y;
    const r = 0.01;

    ctx.fillStyle = 'rgb(248, 192, 128)';
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(x - r, y - r, 2*r, 2*r);
    ctx.strokeRect(x - r, y - r, 2*r, 2*r);
    */
}

function closestNode(graph, x, y) {
    let sqdistClosest = Infinity;
    let nodeClosest = undefined;

    for (const node of graph.nodes) {
        const dx = node.pos[0] - x;
        const dy = node.pos[1] - y;
        const sqdist = dx*dx + dy*dy;
        if (sqdist < sqdistClosest) {
            sqdistClosest = sqdist;
            nodeClosest = node;
        }
    }

    return nodeClosest;
}

function drawGraph(ctx, graph, selectedNode) {
    ctx.strokeStyle = 'rgb(192, 192, 192)';
    ctx.lineWidth = 0.0075;

    for (const edge of graph.edges) {
        const pos0 = graph.nodes[edge[0]].pos;
        const pos1 = graph.nodes[edge[1]].pos;
        ctx.beginPath();
        ctx.moveTo(pos0[0], pos0[1]);
        ctx.lineTo(pos1[0], pos1[1]);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgb(32, 32, 32)';
    ctx.lineWidth = 0.0025;

    const r = 0.01;
    const s = 0.0065;
    for (const node of graph.nodes) {
        const x = node.pos[0];
        const y = node.pos[1];
        if (node.thief) {
            if (node === selectedNode) {
                ctx.fillStyle = 'rgb(255, 128, 128)';
            } else {
                ctx.fillStyle = 'rgb(248, 248, 248)';
            }
            ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
            ctx.strokeRect(x - r, y - r, 2 * r, 2 * r);
        } else {
            if (node === selectedNode) {
                ctx.fillStyle = 'rgb(192, 32, 32)';
            } else {
                ctx.fillStyle = 'rgb(128, 128, 128)';
            }
            ctx.fillRect(x - s, y - s, 2 * s, 2 * s);
        }
    }
}

function generateGraph() {
    const nodes = [];
    for (let i = 0; i < 5000; ++i) {
        const x = border + Math.random() * (1.0 - 2.0 * border);
        const y = border + Math.random() * (1.0 - 2.0 * border);
        if (posTooClose(x, y, nodes)) {
            continue;
        }
        nodes.push({pos: [x, y], edges: [], thief: false});
    }

    const edges = [];
    for (let i = 1; i < nodes.length; ++i) {
        for (let j = 0; j < i; ++j) {
            if (positionsAreNeighbors(i, j, nodes)) {
                nodes[i].edges.push(j);
                nodes[j].edges.push(i);
                edges.push([i, j]);
            }
        }
    }

    const toVisit = [0];
    const visited = new Set();
    for (let i = 0; i < toVisit.length; ++i) {
        if (visited.has(toVisit[i])) {
            continue;
        }
        const node = nodes[toVisit[i]];
        visited.add(toVisit[i]);
        if (!nodeHasThiefNeighbor(nodes, toVisit[i])) {
            node.thief = true;
        }
        for (const j of node.edges) {
            if (!visited.has(j)) {
                toVisit.push(j);
            }
        }
    }

    const numThief = nodes.reduce((c, node) => c + (node.thief ? 1 : 0), 0);
    const numNonThief = nodes.reduce((c, node) => c + (node.thief ? 0 : 1), 0);
    console.log('thief: ', numThief, ' non-thief: ', numNonThief);

    return {nodes: nodes, edges: edges};
}

function nodeHasThiefNeighbor(nodes, i) {
    for (const j of nodes[i].edges) {
        if (nodes[j].thief) {
            return true;
        }
    }
    return false;
}

function posTooClose(x, y, nodes) {
    for (const node of nodes) {
        const dx = node.pos[0] - x;
        const dy = node.pos[1] - y;
        if (dx*dx + dy*dy < nodeSpacingSquared) {
            return true;
        }
    }
    return false;
}

function positionsAreNeighbors(i, j, nodes) {
    const d = sqdistPoints(nodes[i].pos, nodes[j].pos);
    for (let k = 0; k < nodes.length; ++k) {
        if (k === i || k === j) {
            continue;
        }
        if (sqdistPoints(nodes[i].pos, nodes[k].pos) < d && sqdistPoints(nodes[j].pos, nodes[k].pos) < d) {
            return false;
        }
    }
    return true;
}

function sqdistPoints(pos0, pos1) {
    const dx = pos0[0] - pos1[0];
    const dy = pos0[1] - pos1[1];
    return dx*dx + dy*dy;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; --i) {
        let j = randomInRange(i + 1);
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function extractRandomElement(array) {
    const i = randomInRange(array.length);
    const val = array[i];
    array[i] = array[array.length - 1];
    --array.length;
    return val;
}

function randomInRange(n) {
    return Math.floor(Math.random() * n);
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
    };

    array.length = j;
    return array;
}
