"use strict";

window.onload = main;

const keyColors = [
    'rgb(255, 0, 0)',
    'rgb(0, 255, 0)',
    'rgb(0, 0, 255)',
    'rgb(255, 255, 0)',
    'rgb(255, 0, 255)',
    'rgb(0, 255, 255)',
    'rgb(255, 128, 0)',
    'rgb(255, 0, 128)',
    'rgb(128, 255, 0)',
    'rgb(128, 0, 255)',
    'rgb(0, 255, 128)',
    'rgb(0, 128, 255)',
];

function main() {
    const graph = generateGraph();

    const canvas = document.getElementById('canvas');

    drawGraph(canvas, graph);
}

function drawGraph(canvas, graph) {
    const ctx = canvas.getContext('2d');

    const canvasSizeX = canvas.width;
    const canvasSizeY = canvas.height;

    const [graphSizeX, graphSizeY] = graphExtents(graph);

    const mapScale = Math.floor((graphSizeX * canvasSizeY > graphSizeY * canvasSizeX) ?
        canvasSizeX / (graphSizeX * 3 + 3) :
        canvasSizeY / (graphSizeY * 3 + 3)
    );
    const mapOffsetX = Math.floor((canvasSizeX - graphSizeX * mapScale * 3) / 2);
    const mapOffsetY = Math.floor((canvasSizeY - graphSizeY * mapScale * 3) / 2);

    ctx.fillStyle = 'rgb(200, 200, 200)';

    for (const room of graph.rooms) {
        const x0 = Math.floor((room.pos[0] * 3 - 1) * mapScale + mapOffsetX);
        const y0 = Math.floor((room.pos[1] * 3 - 1) * mapScale + mapOffsetY);
        const s = Math.floor(2 * mapScale);

        ctx.fillRect(x0, y0, s, s);
    }

    ctx.fillStyle = 'rgb(120, 120, 120)';

    for (const edge of graph.edges) {
        const room0X = graph.rooms[edge.room[0]].pos[0];
        const room0Y = graph.rooms[edge.room[0]].pos[1];
        const room1X = graph.rooms[edge.room[1]].pos[0];
        const room1Y = graph.rooms[edge.room[1]].pos[1];

        const dx = room1X - room0X;
        const dy = room1Y - room0Y;

        const rx = Math.floor(mapScale * (0.25 + 0.25 * dx));
        const ry = Math.floor(mapScale * (0.25 + 0.25 * dy));

        const cx = Math.floor((room0X * 3 + dx * 1.5) * mapScale + mapOffsetX);
        const cy = Math.floor((room0Y * 3 + dy * 1.5) * mapScale + mapOffsetY);

        ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    }

    // Draw keys in the rooms

    for (const room of graph.rooms) {
        if (room.keyIndex === null) {
            continue;
        }

        const x0 = Math.floor((room.pos[0] * 3 - 0.25) * mapScale + mapOffsetX);
        const y0 = Math.floor((room.pos[1] * 3 - 0.25) * mapScale + mapOffsetY);
        const s = Math.floor(mapScale * 0.5);

        ctx.fillStyle = keyColors[room.keyIndex % keyColors.length];
        ctx.fillRect(x0, y0, s, s);
    }

    // Draw locks on the edges

    for (const edge of graph.edges) {
        if (edge.keyIndex === null) {
            continue;
        }

        const room0X = graph.rooms[edge.room[0]].pos[0];
        const room0Y = graph.rooms[edge.room[0]].pos[1];
        const room1X = graph.rooms[edge.room[1]].pos[0];
        const room1Y = graph.rooms[edge.room[1]].pos[1];

        const dx = room1X - room0X;
        const dy = room1Y - room0Y;

        const rx = Math.floor(mapScale * 0.25);
        const ry = Math.floor(mapScale * 0.25);

        const cx = Math.floor((room0X * 3 + dx * 1.5) * mapScale + mapOffsetX);
        const cy = Math.floor((room0Y * 3 + dy * 1.5) * mapScale + mapOffsetY);

        ctx.fillStyle = keyColors[edge.keyIndex % keyColors.length];
        ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
    }

    // Draw starting room

    {
        const room = graph.rooms[graph.startRoomIndex];

        const x0 = Math.floor((room.pos[0] * 3 - 0.25) * mapScale + mapOffsetX);
        const y0 = Math.floor((room.pos[1] * 3 - 0.25) * mapScale + mapOffsetY);
        const s = Math.floor(mapScale * 0.5);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(x0, y0, s, s);
    }

    // Draw ending room

    {
        const room = graph.rooms[graph.endRoomIndex];

        const x0 = Math.floor((room.pos[0] * 3 - 0.25) * mapScale + mapOffsetX);
        const y0 = Math.floor((room.pos[1] * 3 - 0.25) * mapScale + mapOffsetY);
        const s = Math.floor(mapScale * 0.5);

        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(x0, y0, s, s);
    }
}

function generateGraph() {
//    const initialGraph = fullyConnectedGrid(4, 4);
    const initialGraph = freeformGraph(20);//16);
    return lockedGraph(minimumSpanningTree(initialGraph));
}

function fullyConnectedGrid(sizeX, sizeY) {
    const rooms = [];
    for (let x = 0; x < sizeX; ++x) {
        for (let y = 0; y < sizeY; ++y) {
            rooms[x * sizeY + y] = {pos: [x, y]};
        }
    }

    const edges = [];
    for (let x = 1; x < sizeX; ++x) {
        for (let y = 0; y < sizeY; ++y) {
            edges.push({room: [(x - 1) * sizeY + y, x * sizeY + y]});
        }
    }
    for (let x = 0; x < sizeX; ++x) {
        for (let y = 1; y < sizeY; ++y) {
            edges.push({room: [x * sizeY + (y - 1), x * sizeY + y]});
        }
    }

    return {
        rooms: rooms,
        edges: edges,
    };
}

function freeformGraph(numRooms) {
    const rooms = new Array();
    const toVisit = [[0, 0]];
    while (toVisit.length > 0 && rooms.length < numRooms) {
        const [x, y] = extractRandomElement(toVisit);

        if (rooms.findIndex(room => x == room.pos[0] && y == room.pos[1]) >= 0) {
            continue;
        }

        rooms.push({pos: [x, y]});

        toVisit.push([x - 1, y]);
        toVisit.push([x + 1, y]);
        toVisit.push([x, y - 1]);
        toVisit.push([x, y + 1]);
    }

    // Offset so no room position is negative

    let offset = [rooms[0].pos[0], rooms[0].pos[1]];
    for (let i = 1; i < rooms.length; ++i) {
        offset[0] = Math.min(offset[0], rooms[i].pos[0]);
        offset[1] = Math.min(offset[1], rooms[i].pos[1]);
    }

    offset = [-offset[0], -offset[1]];

    rooms.forEach(room => {
        room.pos = [room.pos[0] + offset[0], room.pos[1] + offset[1]];
    });

    // Build edges between adjacent rooms

    const edges = [];
    for (let i = 0; i < rooms.length; ++i) {
        let j = rooms.findIndex(room => room.pos[0] === rooms[i].pos[0] + 1 && room.pos[1] === rooms[i].pos[1]);
        if (j >= 0) {
            edges.push({room: [i, j]});
        }
        j = rooms.findIndex(room => room.pos[0] === rooms[i].pos[0] && room.pos[1] === rooms[i].pos[1] + 1);
        if (j >= 0) {
            edges.push({room: [i, j]});
        }
    }

    return {
        rooms: rooms,
        edges: edges,
    };
}

function minimumSpanningTree(graph) {
    const potentialEdges = graph.edges;
    shuffleArray(potentialEdges);
    graph.edges = [];
    const roomGroup = Array.from(graph.rooms, (_, i) => i);

    while (potentialEdges.length > 0) {
        const edge = potentialEdges.pop();
        if (roomGroup[edge.room[0]] === roomGroup[edge.room[1]]) {
            continue;
        }

        graph.edges.push(edge);

        const groupKeep = roomGroup[edge.room[0]];
        const groupDiscard = roomGroup[edge.room[1]];

        for (let i = 0; i < roomGroup.length; ++i) {
            if (roomGroup[i] === groupDiscard) {
                roomGroup[i] = groupKeep;
            }
        }
    }

    return graph;
}

function lockedGraph(graph) {
    // Build an adjacency data structure to make it easier to navigate the graph

    const adj = Array.from(graph.rooms, () => []);
    for (let i = 0; i < graph.edges.length; ++i) {
        const roomIndex0 = graph.edges[i].room[0];
        const roomIndex1 = graph.edges[i].room[1];
        adj[roomIndex0].push({edge: i, room: roomIndex1});
        adj[roomIndex1].push({edge: i, room: roomIndex0});
    }

    // Find all of the dead ends

    const deadEndRooms = [];
    for (let i = 0; i < graph.rooms.length; ++i) {
        if (adj[i].length < 2) {
            deadEndRooms.push(i);
        }
    }

    // Pick a dead end as a starting point

    //graph.startRoomIndex = deadEndRooms[randomInRange(deadEndRooms.length)];
    graph.startRoomIndex = randomInRange(graph.rooms.length);

    // Measure subtree size at each node, with the starting room as the root

    const subtreeSize = new Array(graph.rooms.length).fill(0);
    function measureSubtree(roomIndex, roomParentIndex) {
        let size = 0;
        for (const i of adj[roomIndex]) {
            const roomChildIndex = i.room;
            if (roomChildIndex != roomParentIndex) {
                measureSubtree(roomChildIndex, roomIndex);
                size += 1 + subtreeSize[roomChildIndex];
            }
        }
        subtreeSize[roomIndex] = size;
    }
    measureSubtree(graph.startRoomIndex, -1);

    // Walk the graph. Keep a list of branches not taken; when we hit a dead end,
    // place a key and begin walking the branch for that key.

    graph.rooms.forEach(room => { room.keyIndex = null; });
    graph.edges.forEach(edge => { edge.keyIndex = null; });

    let roomIndex = graph.startRoomIndex;
    let roomIndexPrev = graph.startRoomIndex;
    let keyIndexNext = 0;
    const lockedDoors = [];

    while (true) {
        const edgesNext = adj[roomIndex].filter(adj => adj.room !== roomIndexPrev);
        if (edgesNext.length === 0) {
            if (lockedDoors.length === 0) {
                graph.endRoomIndex = roomIndex;
                break;
            } else {
                // Choose which key to provide based on proximity?
                //const edgeLocked = extractRandomElement(lockedDoors);
                //const edgeLocked = lockedDoors.pop();
                const edgeLocked = lockedDoors.shift();
                const keyIndex = keyIndexNext;
                ++keyIndexNext;
                graph.rooms[roomIndex].keyIndex = keyIndex;
                graph.edges[edgeLocked.edge].keyIndex = keyIndex;
                roomIndex = edgeLocked.roomTo;
                roomIndexPrev = edgeLocked.roomFrom;
            }
        } else {
            let edgeNextIndex = 0;
            let subtreeSizeBest = graph.rooms.length;
            for (let i = 0; i < edgesNext.length; ++i) {
                const size = subtreeSize[edgesNext[i].room];
                if (size < subtreeSizeBest) {
                    subtreeSizeBest = size;
                    edgeNextIndex = i;
                }
            }

            const edgeNext = edgesNext[edgeNextIndex];
            edgesNext[edgeNextIndex] = edgesNext[edgesNext.length - 1];
            --edgesNext.length;
//            const edgeNext = extractRandomElement(edgesNext);

            edgesNext.forEach(edgeNext => { lockedDoors.push({ roomFrom: roomIndex, roomTo: edgeNext.room, edge: edgeNext.edge })});

            roomIndexPrev = roomIndex;
            roomIndex = edgeNext.room;
        }
    }

    return graph;
}

function graphExtents(graph) {
    const maxX = graph.rooms.reduce((maxX, room) => Math.max(maxX, room.pos[0]), 0);
    const maxY = graph.rooms.reduce((maxY, room) => Math.max(maxY, room.pos[1]), 0);
    return [maxX, maxY];
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
