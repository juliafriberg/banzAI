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
function aStarSearch(graph, start, goal, heuristics, timeout) {
    var result = {
        path: [],
        cost: 0
    };
    var NodeScore = (function () {
        function NodeScore(p, n, f, g) {
            this.parent = p;
            this.node = n;
            this.f = f;
            this.g = g;
        }
        NodeScore.prototype.toString = function () {
            return this.node.toString();
        };
        return NodeScore;
    }());
    var cmp = function (a, b) {
        return (a.node.toString() === b.node.toString());
    };
    var getLowest = function () {
        var cur = openSet.firstNode;
        var ret = cur.element;
        while (cur !== null) {
            if (cur.element.f < ret.f) {
                ret = cur.element;
            }
            cur = cur.next;
        }
        openSet.remove(ret);
        return ret;
    };
    var openSet = new collections.LinkedList();
    openSet.add(new NodeScore(null, start, heuristics(start), 0));
    var closedSet = [];
    while (!openSet.isEmpty()) {
        var current = getLowest();
        if (goal(current.node)) {
            result.cost = current.g;
            while (current !== null) {
                result.path.push(current.node);
                current = current.parent;
            }
            result.path = result.path.reverse();
            console.log("Found path. ---------------------------------------------------");
            return result;
        }
        closedSet.push(current.node);
        var neighbours = graph.outgoingEdges(current.node);
        for (var _i = 0, neighbours_1 = neighbours; _i < neighbours_1.length; _i++) {
            var n = neighbours_1[_i];
            if (closedSet.indexOf(n.to) > -1) {
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
    console.log("COULDN*T FIND PATH");
    return undefined;
}
