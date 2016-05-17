There is only the one file, Interpreter.ts.
There are comments in the code, explaining what happens.

The overall logical structure:
1.  Find every object that matches the first part of the command. These are the
    objects that potentially are to be moved or picked up.
2.  Find every object that matches the second part of the command. These objects
    are the "destination objects", if they exist. The object to be moved is going
    to be moved to a place in relation to one of these objects.
3.  Lastly, we check whether the object to be moved and the destination complies
    with the physical laws.
