///<reference path="World.ts"/>
///<reference path="Parser.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
module Interpreter {

  //////////////////////////////////////////////////////////////////////
  // exported functions, classes and interfaces/types

  /**
  Top-level function for the Interpreter. It calls `interpretCommand` for each possible parse of the command. No need to change this one.
  * @param parses List of parses produced by the Parser.
  * @param currentState The current state of the world.
  * @returns Augments ParseResult with a list of interpretations. Each interpretation is represented by a list of Literals.
  */
  export function interpret(parses: Parser.ParseResult[], currentState: WorldState): InterpretationResult[] {
    var errors: Error[] = [];
    var interpretations: InterpretationResult[] = [];
    parses.forEach((parseresult) => {
      try {
        var result: InterpretationResult = <InterpretationResult>parseresult;
        result.interpretation = interpretCommand(result.parse, currentState);
        interpretations.push(result);
      } catch (err) {
        errors.push(err);
      }
    });
    if (interpretations.length) {
      return interpretations;
    } else {
      // only throw the first error found
      throw errors[0];
    }
  }

  export interface InterpretationResult extends Parser.ParseResult {
    interpretation: DNFFormula;
  }

  export type DNFFormula = Conjunction[];
  type Conjunction = Literal[];

  /**
  * A Literal represents a relation that is intended to
  * hold among some objects.
  */
  export interface Literal {
    /** Whether this literal asserts the relation should hold
     * (true polarity) or not (false polarity). For example, we
     * can specify that "a" should *not* be on top of "b" by the
     * literal {polarity: false, relation: "ontop", args:
     * ["a","b"]}.
     */
    polarity: boolean;
    /** The name of the relation in question. */
    relation: string;
    /** The arguments to the relation. Usually these will be either objects
       * or special strings such as "floor" or "floor-N" (where N is a column) */
    args: string[];
  }

  export function stringify(result: InterpretationResult): string {
    return result.interpretation.map((literals) => {
      return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
      // return literals.map(stringifyLiteral).join(" & ");
    }).join(" | ");
  }

  export function stringifyLiteral(lit: Literal): string {
    return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
  }

  //////////////////////////////////////////////////////////////////////
  // private functions
  /**
   * The core interpretation function. The code here is just a
   * template; you should rewrite this function entirely. In this
   * template, the code produces a dummy interpretation which is not
   * connected to `cmd`, but your version of the function should
   * analyse cmd in order to figure out what interpretation to
   * return.
   * @param cmd The actual command. Note that it is *not* a string, but rather an object of type `Command` (as it has been parsed by the parser).
   * @param state The current state of the world. Useful to look up objects in the world.
   * @returns A list of list of Literal, representing a formula in disjunctive normal form (disjunction of conjunctions). See the dummy interpetation returned in the code for an example, which means ontop(a,floor) AND holding(b).
   */
  function interpretCommand(cmd: Parser.Command, state: WorldState): DNFFormula {
    var objects: string[] = Array.prototype.concat.apply([], state.stacks);
    var matchingObjects: string[] = [];

    // The interpetation to return. Will be filled when applicable.
    var interpretation: DNFFormula = [];

    // First a few useful functions are defined.
    /**
    * Contains wrapper for arrays.
    * @param arr The array to be checked.
    * @param elem The element that might exists in arr.
    * @returns True if the array contains the element.
    */
    function contains<T>(arr: T[], elem: T) {
      return arr.indexOf(elem) > -1;
    }

    /**
    * Calculates the specific position of an object in the world.
    * @param object The object to find the position of.
    * @returns Two numbers; which stack the object is in, and where in the stack it is.
    */
    function getPosition(object: string): number[] {
      var stacknumber: number = 0;
      var objectnumber: number = 0;
      for (var j = 0; j < state.stacks.length; j++) {
        objectnumber = state.stacks[j].indexOf(object);
        if (objectnumber > -1) {
          stacknumber = j;
          break;
        }
      }
      return [stacknumber, objectnumber];
    }

    /**
    * Interprets an object into a bunch of strings, representing objects in the world.
    * @param object The parser object that is to be interpreted.
    * @returns A list of strings, representing objects in the world.
    */
    function interpretObject(object: Parser.Object): string[] {
      var returnObjects: string[] = [];
      // if there's an object.object, there's also an object.location
      if (object.object) {
        // objects matching and locations matching, the intersection are the objects.
        var matchObjects: string[] = interpretObject(object.object);
        var locObjects: string[] = interpretLocation(object.location);
        // Intersection function, might not work.
        returnObjects = matchObjects.filter(function(n) {
          return contains(locObjects, n); //.indexOf(n) != -1;
        });
      } else {
        // There's color/size/form. match against objects in the world.
        if (object.form === "floor") {
          returnObjects.push("floor");
        } else {
          for (var i = 0; i < objects.length; i++) {
            if (isMatching(state.objects[objects[i]], object)) {
              returnObjects.push(objects[i]);
            }
          }
        }
      }
      return returnObjects;
    }

    /**
    * Interprets location into a bunch of strings, representing objects in the world.
    * @param location The parser location that is to be interpreted.
    * @returns A list of strings, representing objects in the world.
    */
    function interpretLocation(location: Parser.Location): string[] {
      // find _entites_ in correct _relation_
      var entityObjs: string[] = interpretEntity(location.entity);
      // for each object in entityObjs, add relating objects to return value.
      var returnObjects: string[] = [];

      for (var i = 0; i < entityObjs.length; i++) {
        // pos[0] is stacknumber, pos[1] is number in stack
        var pos: number[] = getPosition(entityObjs[i]);
        switch (location.relation) {
          case "ontop":
          case "inside":
            // if there's an object just above the current one in the stack, add it.
            var potential = state.stacks[pos[0]][pos[1] + 1];
            if (potential) {
              returnObjects.push(potential);
            }
            break;

          case "above":
            // add each object above the entityObj to returnObjects.
            var aboveObjs = state.stacks[pos[0]].slice(pos[1] + 1);
            for (let o in aboveObjs) {
              returnObjects.push(aboveObjs[o]);
            }
            break;
          case "under":
            var underObjs = state.stacks[pos[0]].slice(0, pos[1]);
            for (let o in underObjs) {
              returnObjects.push(underObjs[o]);
            }
            break;

          case "right of":
            var rightObjs = state.stacks[pos[0] + 1];
            for (let o in rightObjs) {
              returnObjects.push(rightObjs[o]);
            }
            break;
          case "left of":
            var leftObjs = state.stacks[pos[0] - 1];
            for (let o in leftObjs) {
              returnObjects.push(leftObjs[o]);
            }
            break;
          case "beside":
            // Left of and right of combined
            var leftObjs = state.stacks[pos[0] - 1];
            var rightObjs = state.stacks[pos[0] + 1];
            for (let o in leftObjs) {
              returnObjects.push(leftObjs[o]);
            }
            for (let o in rightObjs) {
              returnObjects.push(rightObjs[o]);
            }
            break;
        }
      }
      return returnObjects;
    }

    /**
    * Interprets an entity into a bunch of strings, representing objects in the world.
    * @param entity The parser entity that is to be interpreted.
    * @returns A list of strings, representing objects in the world.
    */
    function interpretEntity(entity: Parser.Entity): string[] {
      // an entity is right now just an object. Might implement quantifiers later.
      var matching: string[] = interpretObject(entity.object);
      return matching;
    }



    /**
    * Internal function used to compare an object to a description.
    * @param currentObject The object to be compared.
    * @param prelObject An object description. Can contain color, size and/or form.
    * @returns True if currentObject matches the description in prelObject.
    */
    function isMatching(currentObject: ObjectDefinition, object: Parser.Object): boolean {
      if (object.form !== "anyform" && object.form) {
        if (currentObject.form !== object.form) {
          return false;
        }
      }
      if (object.size) {
        if (currentObject.size !== object.size) {
          return false;
        }
      }
      if (object.color) {
        if (currentObject.color !== object.color) {
          return false;
        }
      }
      return true;
    }

    /**
    * @param moveObj Object that is set to be moved.
    * @param destObj Object that moveObj is set to be placed in relation to.
    * @returns True if the placement of moveObj complies with the physical laws of the world.
    */
    function isAllowed(moveObjKey: string, relation: string, destObjKey: string): boolean {
      var moveObj: ObjectDefinition = state.objects[moveObjKey];
      var destObj: ObjectDefinition = state.objects[destObjKey];
      if (moveObjKey === destObjKey) {
        // Objects can't be moved in relation to themselves.
        return false;
      }
      if (destObj.form === "floor" && !contains(["above","ontop"], relation)) {
        // everything must be ontop of or above the floor
        return false;
      }
      if (moveObj.size === "large" && destObj.size === "small"
        && contains(["ontop", "inside", "above"], relation)) {
        // Small objects cannot support large objects.
        return false;

      } else if (moveObj.size === "small" && destObj.size === "large"
        && relation === "under") {
        // Small objects cannot support large objects.
        return false;

      } else if (moveObj.form === "ball" && ((!contains(["floor", "box"], destObj.form)
        && contains(["ontop", "inside"], cmd.location.relation)) || cmd.location.relation === "under")) {
        // Balls must be in boxes or on the floor, otherwise they roll away.
        // Balls cannot support anything.
        return false;
      }

      switch (destObj.form) {
        case "box":
          if (cmd.location.relation === "ontop") {
            // Objects are “inside” boxes, but “ontop” of other objects.
            return false;
          }
          if (contains(["box", "pyramid", "plank"],moveObj.form) && moveObj.size === destObj.size) {
            // Boxes cannot contain pyramids, planks or boxes of the same size.
            return false;
          }
          break;
        case "ball":
          if (contains(["ontop", "above"], cmd.location.relation)) {
            // Balls cannot support anything.
            return false;
          }
          break;
        case "pyramid":
          if (moveObj.form === "box" && moveObj.size === destObj.size) {
            // Small boxes cannot be supported by small bricks or pyramids.
            // Large boxes cannot be supported by large pyramids.
            return false;
          }
          break;
        case "brick":
          if (moveObj.form === "box" && destObj.size === "small") {
            // Small boxes cannot be supported by small bricks or pyramids.
            return false;
          }
          break;
        default:
          break;
      }
      return true;
    }

    if (cmd.command === "take") {
      var takeObjs = interpretEntity(cmd.entity);
      for (var i = 0; i < takeObjs.length; i++) {
        interpretation.push(
          [{ polarity: true, relation: "holding", args: [takeObjs[i]] }]);
      }
    } else { // command is put etc.
      // Objects that can be moved.
      var moveObjs = interpretEntity(cmd.entity);
      // Objects that the moveObj can be moved in relation to.
      var posObjs = interpretEntity(cmd.location.entity);

      // Go through each match and see if it is allowed.
      for (let m in moveObjs) {
        for (let p in posObjs) {
          if (isAllowed(moveObjs[m], cmd.location.relation, posObjs[p])) {
            interpretation.push([
              { polarity: true, relation: cmd.location.relation, args: [moveObjs[m], posObjs[p]] }
            ]);
          }
        }
      }
    }

    if (interpretation.length) {
      return interpretation;
    } else {
      throw new Error("No interpetation found.");
    }

  }
}
