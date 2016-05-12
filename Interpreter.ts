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

    console.log(cmd);

    /**
    * Internal function used to compare an object to a description.
    * @param currentObject The object to be compared.
    * @param object An object description. Can contain color, size and/or form.
    * @returns True if currentObject matches the description in object.
    */
    function isMatching(currentObject: ObjectDefinition, prelObject: Parser.Object): boolean {
      var object : Parser.Object;
      if(prelObject.object) {
        object = prelObject.object;
      } else {
        object = prelObject;
      }

      if (object.form !== "anyform" && object.form) {
        if (currentObject.form !== object.form) {
        //  console.log("form doesn't match " + currentObject.form + " " + object.form)
          return false;
        }
      }
      if (object.size) {
        if (currentObject.size !== object.size) {
        //  console.log("size doesn't match " + currentObject.size + " " + object.size)
          return false;
        }
      }
      if (object.color) {
        if (currentObject.color !== object.color) {
          //console.log("color doesn't match " + currentObject.color + " " + object.color)
          return false;
        }
      }
      return true;
    }

    function relationMatching(relation : string, object : Parser.Object, stacknumber : number, objectnumber : number) : boolean {
      // Checking for matches in the different possible relations. If the
      // object matches any of the relations and the correct relating object,
      // the foundMatch variable will be set to true.
      switch (relation) {
        case "inside":
          //console.log("inside");
          if (objectnumber > 0) {
            if (isMatching(state.objects[state.stacks[stacknumber][objectnumber - 1]], object)) {
              return true;
            }
          }
          break;
        case "above":
          //console.log("above");
          for (var j = objectnumber; j < state.stacks[stacknumber].length; j++) {
            if (isMatching(state.objects[state.stacks[stacknumber][j]], object)) {
              return true;
            }
          }
          break;
        case "ontop":
          //console.log("ontop");
          if (objectnumber < state.stacks[stacknumber].length - 1) {
            if (isMatching(state.objects[state.stacks[stacknumber][objectnumber + 1]], object)) {
              return true;
            }
          }
          break;
        case "toleft":
          //console.log("toleft");
          for (var j = 0; j < stacknumber; j++) {
            for (var k = 0; k < state.stacks[j].length; k++) {
              if (isMatching(state.objects[state.stacks[j][k]], object)) {
                return true;
              }
            }
          }
          break;
        case "toright":
          //console.log("toright");
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
          //console.log("under");
          for (var j = 0; j < objectnumber; j++) {
            if (isMatching(state.objects[state.stacks[stacknumber][j]], object)) {
              return true;
            }
          }
          break;
        default:
          break;

      }
      return false;

    }

    function findMatch(location : Parser.Location, object : string) : boolean {
      // If the object is referenced by location, e.g. object inside a box, the
      // following code block checks which ones still match.
      if (location) {
        // stacknumber: which stack the current object is in.
        // objectnumber: where in the stack the object is.
        var stacknumber: number = 0;
        var objectnumber: number = 0;
        for (var j = 0; j < state.stacks.length; j++) {
          objectnumber = state.stacks[j].indexOf(object);
          if (objectnumber > -1) {
            stacknumber = j;
            break;
          }
        }

        return relationMatching(location.relation, location.entity.object, stacknumber, objectnumber);
      } else {
        return true;
      }
    }

    function isAllowed(moveObj: ObjectDefinition, destObjParser?: Parser.Object, destObjDef?: ObjectDefinition) : boolean {
      var destObj : any;

      if(destObjDef) {
        destObj = destObjDef;
      } else if(destObjParser) {
        if(destObjParser.object) {
          destObj = destObjParser.object;
        } else {
          destObj = destObjParser;
        }
      } else {
        return false;
      }

      if(moveObj.size === "large" && destObj.size === "small"
            && ["ontop","inside","above"].indexOf(cmd.location.relation) > -1) {
              return false;
        // fail
      } else if(moveObj.size === "small" && destObj.size === "large"
            && cmd.location.relation === "under") {
              return false;
        // fail
      } else if(moveObj.form === "ball" && ((["floor","box"].indexOf(destObj.form) === -1
            && ["ontop", "inside"].indexOf(cmd.location.relation) > -1 ) || cmd.location.relation === "under")) {
              return false;
        // fail
      }

      switch(destObj.form) {
        case "box":
          if(cmd.location.relation === "ontop") {
            console.log("Fail: Nothing can be ontop of a box.")
            return false;
          }
          if(["box","pyramid","plank"].indexOf(moveObj.form) > -1 && moveObj.size === destObj.size) {
            console.log("Fail: Boxes cannot contain pyramids, planks or boxes of the same size.");
            return false;
          }
          break;
        case "ball":
          if(["ontop","above"].indexOf(cmd.location.relation) > -1){
            return false;
            // fail
          }
          break;
        case "pyramid":
          if (moveObj.form === "box" && moveObj.size === destObj.size) {
            return false;
            // fail
          }
          break;
        case "brick":
          if (moveObj.form === "box" && destObj.size === "small") {
            return false;
            // fail
          }
          break;
        default:
          break;
      }
      return true;
    }

    // Check each object in the world, to see if it's the one that should be moved/taken.
    for (var i = 0; i < objects.length; i++) {
      var currentObject: ObjectDefinition = state.objects[objects[i]];
      // First check it it's matching the description, e.g. large and blue.
      if (!isMatching(currentObject, cmd.entity.object)) continue;


      // If the item is still matching the description of what to be picked
      // up, it is added to the array of matching objects.
      if (findMatch(cmd.entity.object.location, objects[i])) matchingObjects.push(objects[i]);
    }


    // Now for movement. The location part of the command will be checked. The
    // location and previous matching object(s) must obey the rules of the world.

    if (cmd.location) {
      for(var i = 0; i < matchingObjects.length; i++) {

        var moveObj : ObjectDefinition = state.objects[matchingObjects[i]];
        var destObj : Parser.Object = cmd.location.entity.object;
        if(isAllowed(moveObj, destObj)) {
          if(destObj.form !== "floor") {
            for(var j = 0; j < objects.length; j++) {
              var destObjDef : ObjectDefinition = state.objects[objects[j]];
              if(isMatching(destObjDef, destObj)) {
                var foundMatch : boolean;
                if (matchingObjects[i] !== objects[j] && isAllowed(moveObj, destObjDef)
                    && findMatch(cmd.entity.object.location, objects[j])) {

                  if(destObj.location) {

                    for(var k = 0; k < objects.length; k++) {
                      if(destObj.location.entity.object.form !== "floor") {
                        foundMatch = isMatching(state.objects[objects[k]], destObj.location.entity.object);
                      } else {
                        var objectnumber : number;
                        for (var l = 0; l < state.stacks.length; l++) {
                          objectnumber = state.stacks[l].indexOf(objects[j]);
                          if (objectnumber > -1) {
                            break;
                          }
                        }
                        foundMatch = objectnumber === 0;
                      }
                      if(foundMatch) break;
                    }


                  }else{
                    foundMatch = true;
                  }
                  if(foundMatch) {
                    interpretation.push([
                      { polarity: true, relation: cmd.location.relation, args: [matchingObjects[i], objects[j]] }
                    ]);
                  }
                }
              }
            }
          } else {
            if(!destObj.location) {
              interpretation.push([
                { polarity: true, relation: cmd.location.relation, args: [matchingObjects[i], "floor"] }
              ]);
            }
          }
        } else {
          return undefined;
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


    console.log(interpretation);
    return interpretation;
  }

}
