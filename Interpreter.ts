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
    function contains<T>(arr : T[], elem : T) {
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
      // if there's an object.object, there's also an object.location
      if (object.object) {
        // objects matching and locations matching, the intersection are the objects.
        var matchObjects: string[] = interpretObject(object.object);
        var locObjects: string[] = interpretLocation(object.location);
        matchObjects.filter(function(n) {
          return contains(locObjects, n); //.indexOf(n) != -1;
        });
      } else {
        // There's color/size/form. match against objects in the world.
        // loop through world and use isMatching
      }

      return [];
    }

    /**
    * Interprets location into a bunch of strings, representing objects in the world.
    * @param location The parser location that is to be interpreted.
    * @returns A list of strings, representing objects in the world.
    */
    function interpretLocation(location: Parser.Location): string[] {
      // find _entites_ in correct _relation_
      var entityObjs : string[] = interpretEntity(location.entity);
      // for each object in entityObjs, add relating objects to return value.
      return [];
    }

    /**
    * Interprets an entity into a bunch of strings, representing objects in the world.
    * @param entity The parser entity that is to be interpreted.
    * @returns A list of strings, representing objects in the world.
    */
    function interpretEntity(entity: Parser.Entity): string[] {
      // an entity is right now just an object. Might implement quantifiers later.
      var matching : string[] = interpretObject(entity.object);
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
    * @param location The location from the command, containing the object description.
    * @param objInWorld The object in the world to match against.
    * @returns True if the object in the command location matches the object in the world, or if there is no location in the command.
    */
    function findMatch(location: Parser.Location, objInWorld: string): boolean {
      // Checking for matches in the different possible relations. If the
      // object matches any of the relations and the correct relating object,
      // the foundMatch variable will be set to true.

      if (location) {
        var pos: number[] = getPosition(objInWorld);
        var object: Parser.Object = location.entity.object;
        var objectnumber: number = pos[1];
        var stacknumber: number = pos[0];

        switch (location.relation) {
          case "inside":
            if (objectnumber > 0) {
              if (isMatching(state.objects[state.stacks[stacknumber][objectnumber - 1]], object)) {
                return true;
              }
            }
            break;
          case "above":
            for (var j = objectnumber; j < state.stacks[stacknumber].length; j++) {
              if (isMatching(state.objects[state.stacks[stacknumber][j]], object)) {
                return true;
              }
            }
            break;
          case "ontop":
            if (objectnumber < state.stacks[stacknumber].length - 1) {
              if (isMatching(state.objects[state.stacks[stacknumber][objectnumber + 1]], object)) {
                return true;
              }
            }
            break;
          case "toleft":
            for (var j = 0; j < stacknumber; j++) {
              for (var k = 0; k < state.stacks[j].length; k++) {
                if (isMatching(state.objects[state.stacks[j][k]], object)) {
                  return true;
                }
              }
            }
            break;
          case "toright":
            for (var j = stacknumber; j >= 0; j--) {
              for (var k = 0; k < state.stacks[j].length; k++) {
                if (isMatching(state.objects[state.stacks[j][k]], object)) {
                  return true;
                }
              }
            }
            break;
          case "beside":
            if (stacknumber > 0) {
              var leftStack: Stack = state.stacks[stacknumber - 1];
              for (var j = 0; j < leftStack.length; j++) {
                if (isMatching(state.objects[leftStack[j]], object)) {
                  return true;
                }
              }
            }

            if (stacknumber < state.stacks.length - 1) {
              var rightStack: Stack = state.stacks[stacknumber + 1];
              for (var j = 0; j < rightStack.length; j++) {
                if (isMatching(state.objects[rightStack[j]], object)) {
                  return true;
                }
              }
            }
            break;
          case "under":
            for (var j = 0; j < objectnumber; j++) {
              if (isMatching(state.objects[state.stacks[stacknumber][j]], object)) {
                return true;
              }
            }
            break;
        }
        return false;
      } else {
        return true;
      }
    }

    /**
    * @param moveObj Object that is set to be moved.
    * @param destObj Object that moveObj is set to be placed in relation to.
    * @returns True if the placement of moveObj complies with the physical laws of the world.
    */
    function isAllowed(moveObj: ObjectDefinition, destObj: ObjectDefinition): boolean {
      if (moveObj.size === "large" && destObj.size === "small"
        && ["ontop", "inside", "above"].indexOf(cmd.location.relation) > -1) {
        // Small objects cannot support large objects.
        return false;

      } else if (moveObj.size === "small" && destObj.size === "large"
        && cmd.location.relation === "under") {
        // Small objects cannot support large objects.
        return false;

      } else if (moveObj.form === "ball" && ((["floor", "box"].indexOf(destObj.form) === -1
        && ["ontop", "inside"].indexOf(cmd.location.relation) > -1) || cmd.location.relation === "under")) {
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
          if (["box", "pyramid", "plank"].indexOf(moveObj.form) > -1 && moveObj.size === destObj.size) {
            // Boxes cannot contain pyramids, planks or boxes of the same size.
            return false;
          }
          break;
        case "ball":
          if (["ontop", "above"].indexOf(cmd.location.relation) > -1) {
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


    // Check each object in the world, to see which of the objects could be moved/taken.
    for (var i = 0; i < objects.length; i++) {
      var currentObject: ObjectDefinition = state.objects[objects[i]];
      // First check it it's matching the description, e.g. large and blue.
      if (!isMatching(currentObject, cmd.entity.object)) continue;

      // If the item is still matching the description of what to be picked
      // up, it is added to the array of matching objects.
      if (findMatch(cmd.entity.object.location, objects[i])) matchingObjects.push(objects[i]);
    }

    // Find all objects which the object to be moved can be moved in relation to. (destination object)
    var matchingDestObj: string[] = [];
    if (cmd.location) {
      for (var i = 0; i < objects.length; i++) {
        var destObj: ObjectDefinition = state.objects[objects[i]];
        // First check it it's matching the description, e.g. large and blue.
        if (!isMatching(destObj, cmd.location.entity.object)) continue;

        // If the destination object has a location, check if that also matches.
        if (cmd.location.entity.object.location) {
          // Floor is special..
          if (cmd.location.entity.object.location.entity.object.form !== "floor") {
            if (findMatch(cmd.location.entity.object.location, objects[i])) matchingDestObj.push(objects[i]);
            continue;
          } else {
            // if getPosition()[1] === 0, then the object is on the floor (bottom of the stack).
            if (getPosition(objects[i])[1] === 0) matchingDestObj.push(objects[i]);
            continue;
          }
        } else {
          // If there is no specific location of the destination object, add it.
          matchingDestObj.push(objects[i]);
        }
      }

      for (var i = 0; i < matchingObjects.length; i++) {
        var moveObj = state.objects[matchingObjects[i]];
        // if the destination is the floor, it always works. Also, floor is special.
        if (cmd.location.entity.object.form === "floor") {
          interpretation.push([
            { polarity: true, relation: cmd.location.relation, args: [matchingObjects[i], "floor"] }
          ]);
        } else {
          // If destination is not floor, check each matching destination object against the laws.
          for (var j = 0; j < matchingDestObj.length; j++) {
            var destObj = state.objects[matchingDestObj[j]];
            if (isAllowed(moveObj, destObj) && matchingObjects[i] !== matchingDestObj[j]) {
              interpretation.push([
                { polarity: true, relation: cmd.location.relation, args: [matchingObjects[i], matchingDestObj[j]] }
              ]);
            }
          }
        }
      }
    }


    // If the command is to take, each object still matching is added to
    // the list of interpretations with a "holding"-relation.
    if (cmd.command == "take") {
      for (var i = 0; i < matchingObjects.length; i++) {
        interpretation.push(
          [{ polarity: true, relation: "holding", args: [matchingObjects[i]] }]);
      }
    }

    // If there's no interpetation, throw error.
    if (interpretation.length) {
      return interpretation;
    } else {
      throw new Error();
    }
  }
}
