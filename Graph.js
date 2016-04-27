var Edge = (function () {
    function Edge() {
    }
    return Edge;
}());
var SearchResult = (function () {
    function SearchResult() {
    }
    return SearchResult;
}());
var NodeScore = (function () {
    function NodeScore(p, n, f, g) {
        this.parent = p;
        this.node = n;
        this.f = f;
        this.g = g;
    }
    return NodeScore;
}());
var cmp = function (a, b) {
    if (a.node === b.node)
        return true;
    return false;
};
function aStarSearch(graph, start, goal, heuristics, timeout) {
    var result = {
        path: [],
        cost: 0
    };
    var openSet = new collections.LinkedList();
    var getLowest = function () {
        var cur = openSet.firstNode;
        var ret = cur.element;
        while (cur.next) {
            if (cur.element.f < ret.f) {
                ret = cur.element;
            }
            cur = cur.next;
        }
        openSet.remove(ret);
        return ret;
    };
    openSet.add(new NodeScore(undefined, start, heuristics(start), 0));
    var closedSet = [];
    while (!openSet.isEmpty) {
        var current = getLowest();
        if (goal(current.node)) {
            result.cost = current.g;
            while (current.parent) {
                result.path.push(current.node);
                current = current.parent;
            }
            result.path = result.path.reverse();
            return result;
        }
        closedSet.push(current.node);
        var neighbours = graph.outgoingEdges(current.node);
        for (var _i = 0, neighbours_1 = neighbours; _i < neighbours_1.length; _i++) {
            var n = neighbours_1[_i];
            if (closedSet.indexOf(n.from) > -1) {
                continue;
            }
            var t_gScore = current.g + n.cost;
            var next = new NodeScore(current, n.to, heuristics(n.to) + t_gScore, t_gScore);
            var existing = openSet.elementAtIndex(openSet.indexOf(next, cmp));
            if (!openSet.contains(next, cmp)) {
                openSet.add(next);
            }
            else if (t_gScore >= existing.g) {
                continue;
            }
            else {
                openSet.remove(existing);
                openSet.add(next);
            }
        }
    }
    return result;
}
var GridNode = (function () {
    function GridNode(pos) {
        this.pos = pos;
    }
    GridNode.prototype.add = function (delta) {
        return new GridNode({
            x: this.pos.x + delta.x,
            y: this.pos.y + delta.y
        });
    };
    GridNode.prototype.compareTo = function (other) {
        return (this.pos.x - other.pos.x) || (this.pos.y - other.pos.y);
    };
    GridNode.prototype.toString = function () {
        return "(" + this.pos.x + "," + this.pos.y + ")";
    };
    return GridNode;
}());
var GridGraph = (function () {
    function GridGraph(size, obstacles) {
        this.size = size;
        this.walls = new collections.Set();
        for (var _i = 0, obstacles_1 = obstacles; _i < obstacles_1.length; _i++) {
            var pos = obstacles_1[_i];
            this.walls.add(new GridNode(pos));
        }
        for (var x = -1; x <= size.x; x++) {
            this.walls.add(new GridNode({ x: x, y: -1 }));
            this.walls.add(new GridNode({ x: x, y: size.y }));
        }
        for (var y = -1; y <= size.y; y++) {
            this.walls.add(new GridNode({ x: -1, y: y }));
            this.walls.add(new GridNode({ x: size.x, y: y }));
        }
    }
    GridGraph.prototype.outgoingEdges = function (node) {
        var outgoing = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (!(dx == 0 && dy == 0)) {
                    var next = node.add({ x: dx, y: dy });
                    if (!this.walls.contains(next)) {
                        outgoing.push({
                            from: node,
                            to: next,
                            cost: Math.sqrt(dx * dx + dy * dy)
                        });
                    }
                }
            }
        }
        return outgoing;
    };
    GridGraph.prototype.compareNodes = function (a, b) {
        return a.compareTo(b);
    };
    GridGraph.prototype.toString = function () {
        var borderRow = "+" + new Array(this.size.x + 1).join("--+");
        var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
        var str = "\n" + borderRow + "\n";
        for (var y = this.size.y - 1; y >= 0; y--) {
            str += "|";
            for (var x = 0; x < this.size.x; x++) {
                str += this.walls.contains(new GridNode({ x: x, y: y })) ? "## " : "   ";
            }
            str += "|\n";
            if (y > 0)
                str += betweenRow + "\n";
        }
        str += borderRow + "\n";
        return str;
    };
    return GridGraph;
}());
