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

  // Node with parent and scores, based on Node
  class NodeScore {
    parent: NodeScore;
    node: Node;
    f: number;
    g: number;
    constructor(p: NodeScore, n: Node, f: number, g: number) {
      this.parent = p;
      this.node = n;
      this.f = f;
      this.g = g;
    }

    toString() : string {
      return this.node.toString();
    }
  }

  // Equals function to use for LinkedList, just compares the actual node in the NodeScore
  // Sent to indexOf and contains function in the LinkedList object.
  var cmp: collections.IEqualsFunction<NodeScore> = function(a, b) : boolean {
    return (graph.compareNodes(a.node,b.node) === 0)
  }

  // function to get the lowest scoring node from the openSet
  var getLowest = function() : NodeScore {
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
  }

  // add the starting node to the open set
  var openSet = new collections.LinkedList<NodeScore>();
  openSet.add(new NodeScore(null, start, heuristics(start), 0));
  // closed set is the ones looked at
  var closedSet: Node[] = [];
  var startTime : number = Date.now();
  while (!openSet.isEmpty() || Date.now() - startTime <= timeout*1000) {
    var current = getLowest();
    // If we're at goal node, reconstruct the path and add to the result
    if (goal(current.node)) {
      // g-cost is already calculated on the way here
      result.cost = current.g;
      while(current !== null) {
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
      if (closedSet.indexOf(n.to) > -1) {
        continue
      }
      // Temporary g-score for the the neighbouring node. current g-score plus the
      // edge cost between the neighbour and the current.
      var t_gScore: number = current.g + n.cost;
      // create a new node, where current is the parent, f and g are given by  the temporary g-score
      var next = new NodeScore(current, n.to, heuristics(n.to) + t_gScore, t_gScore);


      // node compare questionable
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
  // if we get here, we didn't get to a goal node in time.
  return undefined;
}
