///<reference path="lib/collections.ts"/>
/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/


/** An edge in a graph. */
class Edge<Node> {
  from: Node;
  to: Node;
  cost: number;
}

/** A directed graph. */
interface Graph<Node> {
  /** Computes the edges that leave from a node. */
  outgoingEdges(node: Node): Edge<Node>[];
  /** A function that compares nodes. */
  compareNodes: collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
  /** The path (sequence of Nodes) found by the search algorithm. */
  path: Node[];
  /** The total cost of the path. */
  cost: number;
}

// Node with parent and scores, based on Node
class NodeScore<Node> {
  parent: NodeScore<Node>;
  node: Node;
  f: number;
  g: number;
  constructor(p: NodeScore<Node>, n: Node, f: number, g: number) {
    this.parent = p;
    this.node = n;
    this.f = f;
    this.g = g;
  }
}

// Equals function to use for LinkedList, just compares the actual node in the NodeScore
// Sent to indexOf and contains function in the LinkedList object.
var cmp: collections.IEqualsFunction<NodeScore<Node>> = function(a, b) : boolean {
  if (a.node === b.node)
    return true;
  return false;
}



/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node>(
  graph: Graph<Node>,
  start: Node,
  goal: (n: Node) => boolean,
  heuristics: (n: Node) => number,
  timeout: number
  ): SearchResult<Node> {

  // A dummy search result: it just picks the first possible neighbour
  var result: SearchResult<Node> = {
    path: [],
    cost: 0
  };

  var openSet = new collections.LinkedList<NodeScore<Node>>();
  // function to get the lowest scoring node from the openSet
  var getLowest = function() : NodeScore<Node> {
    var cur = openSet.firstNode;
    var ret = cur.element;
    while (cur.next) {
      if (cur.element.f < ret.f){
        ret = cur.element;
      }
      cur = cur.next;
    }
    openSet.remove(ret);
    return ret;
  }
  openSet.add(new NodeScore(undefined, start, heuristics(start), 0));
  var closedSet: Node[] = [];

  while (!openSet.isEmpty) {
    var current = getLowest();
    // If we're at goal node, reconstruct the path and add to the result
    if (goal(current.node)) {
      // g-cost is already calculated on the way here
      result.cost = current.g;
      while(current.parent) {
        // the adding/reconstruction
        result.path.push(current.node);
        current = current.parent;
      }
      // Reversing to get the start node at the start
      result.path = result.path.reverse();
      return result;
    }
    // If we're not at a goal node, set current node to closed, and check the neighbours
    closedSet.push(current.node);
    var neighbours = graph.outgoingEdges(current.node);
    for (let n of neighbours) {
      // if they're checked, continue to next
      if (closedSet.indexOf(n.from) > -1) {
        continue
      }
      // Temporary g-score for the the neighbouring node. current g-score plus the
      // edge cost between the neighbour and the current.
      var t_gScore: number = current.g + n.cost;
      // create a new node, where current is the parent, f and g are given by  the temporary g-score
      var next = new NodeScore(current, n.to, heuristics(n.to) + t_gScore, t_gScore);
      var existing = openSet.elementAtIndex(openSet.indexOf(next,cmp));
      // if the node isn't in the open set, add it.
      // if it is, check if the score is better.
      // If score is better, update the node.
      if (!openSet.contains(next,cmp)) {
        openSet.add(next);
      } else if (t_gScore >= existing.g) {
        continue
      } else {
        openSet.remove(existing);
        openSet.add(next);
      }
    }
  }
  // if we get here, we didn't get to a goal node.
  return undefined;
}




//////////////////////////////////////////////////////////////////////
// here is an example graph

interface Coordinate {
  x: number;
  y: number;
}


class GridNode {
  constructor(
    public pos: Coordinate
    ) { }

  add(delta: Coordinate): GridNode {
    return new GridNode({
      x: this.pos.x + delta.x,
      y: this.pos.y + delta.y
    });
  }

  compareTo(other: GridNode): number {
    return (this.pos.x - other.pos.x) || (this.pos.y - other.pos.y);
  }

  toString(): string {
    return "(" + this.pos.x + "," + this.pos.y + ")";
  }
}

/** Example Graph. */
class GridGraph implements Graph<GridNode> {
  private walls: collections.Set<GridNode>;

  constructor(
    public size: Coordinate,
    obstacles: Coordinate[]
    ) {
    this.walls = new collections.Set<GridNode>();
    for (var pos of obstacles) {
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

  outgoingEdges(node: GridNode): Edge<GridNode>[] {
    var outgoing: Edge<GridNode>[] = [];
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
  }

  compareNodes(a: GridNode, b: GridNode): number {
    return a.compareTo(b);
  }

  toString(): string {
    var borderRow = "+" + new Array(this.size.x + 1).join("--+");
    var betweenRow = "+" + new Array(this.size.x + 1).join("  +");
    var str = "\n" + borderRow + "\n";
    for (var y = this.size.y - 1; y >= 0; y--) {
      str += "|";
      for (var x = 0; x < this.size.x; x++) {
        str += this.walls.contains(new GridNode({ x: x, y: y })) ? "## " : "   ";
      }
      str += "|\n";
      if (y > 0) str += betweenRow + "\n";
    }
    str += borderRow + "\n";
    return str;
  }
}
