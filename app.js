var countElem = 0;
function Shape(x, y, w, h, fill) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.fill = fill || '#AAAAAA';
    this.id = countElem++;
}

// Draws this shape to a given context
Shape.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
}

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
    // All we have to do is make sure the Mouse X,Y fall in the area between
    // the shape's X and (X + Width) and its Y and (Y + Height)
    return  (this.x <= mx) && (this.x + this.w >= mx) &&
        (this.y <= my) && (this.y + this.h >= my);
}

function CanvasState(canvas) {
    // **** First some setup! ****
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    // This complicates things a little but but fixes mouse co-ordinate problems
    // when there's a border or padding. See getMouse for more detail
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
        this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
        this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
        this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
    }
    // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
    // They will mess up mouse coordinates and this fixes that
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    this.valid = false; // when set to false, the canvas will redraw everything
    this.shapes = [];  // the collection of things to be drawn
    this.dragging = false; // Keep track of when we are dragging
    // the current selected object. In the future we could turn this into an array for multiple selection
    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;
    this.startPosition = null;

    var myState = this;

    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
    // Up, down, and move are for dragging
    canvas.addEventListener('mousedown', function(e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var shapes = myState.shapes;
        var l = shapes.length;
        for (var i = l-1; i >= 0; i--) {
            if (shapes[i].contains(mx, my)) {
                var mySel = shapes[i];
                // Keep track of where in the object we clicked
                // so we can move it smoothly (see mousemove)
                myState.dragoffx = mx - mySel.x;
                myState.dragoffy = my - mySel.y;
                myState.startPosition = { x: mySel.x, y: mySel.y };
                myState.dragging = true;
                myState.selection = mySel;
                myState.valid = false;
                return;
            }
        }
        // havent returned means we have failed to select anything.
        // If there was an object selected, we deselect it
        if (myState.selection) {
            myState.selection = null;
            myState.valid = false; // Need to clear the old selection border
        }
    }, true);
    canvas.addEventListener('mousemove', function(e) {
        if (myState.dragging){

            var mouse = myState.getMouse(e);

            var r = ( mouse.x + myState.selection.w - myState.dragoffx <= myState.width);
            var b = ( mouse.y + myState.selection.h - myState.dragoffy <= myState.height);
            // We don't want to drag the object by its top-left corner, we want to drag it
            // from where we clicked. Thats why we saved the offset and use it here
            myState.selection.fill = '#AAAAAA';
            if(mouse.x - myState.dragoffx <= 0 ){
                myState.selection.x = 0;
                myState.selection.fill = 'blue';
            } else if( !r ){
                myState.selection.x = myState.width - myState.selection.w;
                myState.selection.fill = 'blue';
            } else {
                myState.selection.x = mouse.x - myState.dragoffx;
            }

            if( mouse.y - myState.dragoffy <= 0 ){
                myState.selection.y = 0;
                myState.selection.fill = 'red';
            } else if( !b ) {
                myState.selection.y = myState.height - myState.selection.h;
                myState.selection.fill = 'red';
            } else {
                myState.selection.y = mouse.y - myState.dragoffy;
            }

            myState.overlap(myState);

            myState.valid = false; // Something's dragging so we must redraw
        }
    }, true);
    canvas.addEventListener('mouseup', function(e) {
        if(myState.overlap(myState)){
            myState.selection.x = myState.startPosition.x;
            myState.selection.y = myState.startPosition.y;
            myState.shapes.map(function (el) {
               el.fill = '#AAAAAA';
            });
            myState.valid = false;
        };
        console.log( myState.shapes[0].fill )
        /*for( var i = 0; myState.shapes.length; i++ ){
            myState.shapes[i].fill = '#AAAAAA';
        }*/
        myState.draw();
        myState.dragging = false;
    }, true);
    // double click for making new shapes

    /*canvas.addEventListener('dblclick', function(e) {
        var mouse = myState.getMouse(e);
        myState.addShape(new Shape(mouse.x - 10, mouse.y - 10, 20, 20, 'rgba(0,255,0,.6)'));
    }, true);*/

    // **** Options! ****

    this.selectionColor = '#CC0000';
    this.selectionWidth = 2;
    this.interval = 30;
    setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
    this.shapes.push(shape);
    this.valid = false;
}

CanvasState.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.overlap = function( myState ) {
    var over = false;
    var megerSpace = 20;
    if( myState.selection ){
        var X = myState.selection.x,
            Y = myState.selection.y,
            W = myState.selection.w,
            H = myState.selection.h;

        console

        myState.shapes.map(function ( elem, i ) {
            console.log(X - elem.x + elem.w , Math.abs(Y - elem.y ))
            if( elem.id != myState.selection.id ){
                if( X + W > elem.x &&
                    X < elem.x + elem.w &&
                    Y + H > elem.y &&
                    Y < elem.y + elem.h ){
                    myState.selection.fill = 'orange';
                    elem.fill = 'orange';
                    over = true;
                }else if( elem.x - (X + W) <= megerSpace && elem.x - (X + W) >= 0 && Math.abs(Y - elem.y ) <= megerSpace ){
                    myState.selection.x = elem.x - W;
                    myState.selection.y = elem.y;
                    console.log('to right');
                    elem.fill = '#AAAAAA';
                }else if( (X - ( elem.x + elem.w )) <= megerSpace && (X - ( elem.x + elem.w )) >= 0 && Math.abs(Y - elem.y ) <= megerSpace ){
                    myState.selection.x = elem.x + elem.w;
                    myState.selection.y = elem.y;
                    console.log('to left');
                    elem.fill = '#AAAAAA';
                }else if( elem.y - ( Y + H ) <= megerSpace && elem.y - ( Y + H ) >= 0 && Math.abs( X - elem.x ) <= megerSpace ){
                    myState.selection.x = elem.x;
                    myState.selection.y = elem.y - H;
                    console.log('to bottom to left');
                    elem.fill = '#AAAAAA';
                }else if( elem.y - ( Y + H ) <= megerSpace && elem.y - ( Y + H ) >= 0 && Math.abs( ( X + W )- ( elem.x + elem.w ) ) <= megerSpace ){
                    myState.selection.x = elem.x + ( elem.w - W );
                    myState.selection.y = elem.y - H;
                    console.log('to bottom to right');
                    elem.fill = '#AAAAAA';
                }else if( Y - ( elem.y + elem.h ) <= megerSpace && Y - ( elem.y + elem.h ) >= 0 && Math.abs( X - elem.x ) <= megerSpace ){
                    myState.selection.x = elem.x;
                    myState.selection.y = elem.y + elem.h;
                    console.log('to top to left');
                    elem.fill = '#AAAAAA';
                }else if( Y - ( elem.y + elem.h ) <= megerSpace && Y - ( elem.y + elem.h ) >= 0 && Math.abs( ( X + W )- ( elem.x + elem.w ) ) <= megerSpace ){
                    myState.selection.x = elem.x + ( elem.w - W );
                    myState.selection.y = elem.y + elem.h;
                    console.log('to top to right');
                    elem.fill = '#AAAAAA';
                }else if( Y - ( elem.y + elem.h ) <= megerSpace && Y - ( elem.y + elem.h ) >= 0 ){
                    myState.selection.y = elem.y + elem.h;
                    console.log('to top all');
                    elem.fill = '#AAAAAA';
                }else if( elem.y - ( Y + H ) <= megerSpace && elem.y - ( Y + H ) >= 0 ){
                    myState.selection.y = elem.y - H;
                    console.log('to bottom all');
                    elem.fill = '#AAAAAA';
                }else if( (X - ( elem.x + elem.w )) <= megerSpace && (X - ( elem.x + elem.w )) >= 0 ){
                    myState.selection.x = elem.x + elem.w;
                    console.log('to left all');
                    elem.fill = '#AAAAAA';
                }else if( elem.x - (X + W) <= megerSpace && elem.x - (X + W) >= 0 ){
                    myState.selection.x = elem.x - W;
                    console.log('to right all');
                    elem.fill = '#AAAAAA';
                }else{
                    elem.fill = '#AAAAAA';
                }
            }
        });

    }
    return over;
}
// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
    if (!this.valid) {
        var ctx = this.ctx;
        var shapes = this.shapes;
        this.clear();

        // draw all shapes
        var l = shapes.length;
        for (var i = 0; i < l; i++) {
            var shape = shapes[i];
            // We can skip the drawing of elements that have moved off the screen:
            if (shape.x > this.width || shape.y > this.height ||
                shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
            shapes[i].draw(ctx);
        }

        // draw selection
        // right now this is just a stroke along the edge of the selected Shape
        if (this.selection != null) {
            ctx.strokeStyle = this.selectionColor;
            ctx.lineWidth = this.selectionWidth;
            var mySel = this.selection;
            ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
        }

        // ** Add stuff you want drawn on top all the time here **

        this.valid = true;
    }
}


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
CanvasState.prototype.getMouse = function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

    // Compute the total offset
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }


    // Also add the <html> offsets in case there's a position:fixed bar
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    return {x: mx, y: my};
}

function init() {
    var canvas = document.getElementById('canvas');

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = window.innerWidth - 80;
        canvas.height = window.innerHeight - 80;
        drawStuff();
    };

    resizeCanvas();

    function drawStuff(){
        s = new CanvasState(canvas);
        s.addShape(new Shape(100,100,200,150));
        s.addShape(new Shape(100,300,300,150));
        s.addShape(new Shape(100,500,160,150));
        s.addShape(new Shape(100,700,340,150));
    }
}
init()