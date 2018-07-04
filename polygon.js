var countElem = 0;
var paths = [];

function Polygon(way, fill) {
    this.way = way;
    this.fill = fill || '#AAAAAA';
    this.id = countElem++;
}

Polygon.prototype.draw = function(ctx) {
    var path = new Path2D();
    for (var i = 0; i < this.way.length; i++) {
        path.lineTo( this.way[i][0], this.way[i][1]);
    }
    path.closePath();
    ctx.fillStyle = this.fill;
    ctx.fill(path);
    paths.push(path);
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
    this.polygons = [];  // the collection of things to be drawn
    this.dragging = false; // Keep track of when we are dragging
    // the current selected object. In the future we could turn this into an array for multiple selection
    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;
    this.startPosition = null;

    var myState = this;
    // Up, down, and move are for dragging
    canvas.addEventListener('mousedown', function(e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var polygons = myState.polygons;
        var l = polygons.length;

        for( var i = 0; i < paths.length; i++ ){
            var path = paths[i];
            if ( myState.ctx.isPointInPath(path, mx, my)) {
                var pol = myState.polygons[ i ];
                var startWay = myState.polygons[i].way.copyWithin();
                myState.dragoffx = -mx;
                myState.dragoffy = -my;

                myState.dragging = true;
                myState.selection = pol;
                myState.startPosition = new Array();

                for( var k = 0; k < startWay.length; k++ ){
                    myState.startPosition[k] = new Array();
                    myState.startPosition[k][0] = startWay[k][0];
                    myState.startPosition[k][1] = startWay[k][1];
                }

                myState.valid = false;
                break;
                return;
            }
        }

        // havent returned means we have failed to select anything.
        // If there was an object selected, we deselect it
        if (!myState.selection) {
            myState.selection = null;
            myState.valid = false; // Need to clear the old selection border
        }
    }, true);
    canvas.addEventListener('mousemove', function(e) {
        if (myState.dragging){
            var mouse = myState.getMouse(e);

            var newWay = new Array();

            for( var i = 0; i < myState.selection.way.length; i++ ){
                newWay[i] = new Array();
                newWay[i][0] = myState.selection.way[i][0] + myState.dragoffx + mouse.x;
                newWay[i][1] = myState.selection.way[i][1] + myState.dragoffy + mouse.y;
            }

            if(!myState.isEnd(newWay)){
                myState.selection.way = newWay;

                myState.dragoffx = -mouse.x;
                myState.dragoffy = -mouse.y;
            } else {
                return;
            }

            var cross = crossElem( myState.selection, myState.polygons );

            if( cross.resp ){
                myState.selection.fill = 'red'
                myState.polygons[ cross.indexCross ].fill = 'red'
                myState.returnValue = true;
            } else{
                myState.returnValue = false;
                myState.polygons.map( function ( elem, i ) {
                    elem.fill = polygonsInit[i].fill;
                });
            }
            myState.valid = false; // Something's dragging so we must redraw
        }
    }, true);
    canvas.addEventListener('mouseup', function(e) {

        if( myState.returnValue ){
            console.log( myState.startPosition )
            myState.selection.way = myState.startPosition;
            myState.returnValue = false;
            myState.polygons.map( function ( elem, i ) {
                elem.fill = polygonsInit[i].fill;
            });
            myState.valid = false;
        };
        myState.draw();
        myState.dragging = false;
    }, false);

    this.selectionColor = '#CC0000';
    this.selectionWidth = 2;
    this.interval = 33;
    //setInterval(function() { myState.draw(); }, myState.interval);

    window.requestAnimationFrame( myState.draw.bind(this) )
}

CanvasState.prototype.addPolygon = function(polygon) {
    this.polygons.push(polygon);
    this.valid = false;
}

CanvasState.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
    if (!this.valid) {
        var ctx = this.ctx;
        var polygons = this.polygons;
        this.clear();
        ctx.globalAlpha = 1;
        // draw all polygons
        paths = [];
        for (var i = 0; i < polygons.length; i++) {
            var polygon = polygons[i];
            // We can skip the drawing of elements that have moved off the screen:
            /*if (shape.x > this.width || shape.y > this.height ||
                shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;*/
            polygon.draw(ctx);
        }

        // draw selection
        // right now this is just a stroke along the edge of the selected Shape
        if (this.selection != null) {
            ctx.strokeStyle = this.selectionColor;
            ctx.lineWidth = this.selectionWidth;
        }

        // ** Add stuff you want drawn on top all the time here **

        this.valid = true;
    }
    window.requestAnimationFrame( this.draw.bind( this ) )
}

CanvasState.prototype.getMouse = function(e) {
    var canvas = this.canvas;
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top)
    };
}

CanvasState.prototype.isEnd = function (newWay) {
    var way = newWay;
    for ( var i = 0; i < this.selection.way.length; i++ ){
        if( way[i][0] <= 0 || way[i][0] >= this.width || way[i][1] < 0 || way[i][1] > this.height ){
            return true
        }
    }
    return false;
}

function init(polygonsInit) {
    var canvas = document.getElementById('canvas');

    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
        canvas.width = window.innerWidth - 80;
        canvas.height = window.innerHeight - 80;
        drawStuff();
    };

    resizeCanvas();

    var polygonsInit = polygonsInit;

    function drawStuff(){
        s = new CanvasState(canvas);
        if( polygonsInit.length ){
            for ( var i = 0; i < polygonsInit.length; i++ ) {
                s.addPolygon(new Polygon( polygonsInit[i].way, polygonsInit[i].fill ));
            }
        }
    }
}



var polygonsInit = [
    {
        way: [
            [10,10],
            [100,50],
            [40,110]
        ],
        fill: 'orange'
    },
    {
        way: [
            [10,130],
            [100,150],
            [120,180],
            [60,200],
            [20,180]
        ],
        fill: 'black'
    },
    {
        way: [
            [10,230],
            [100,200],
            [140,300],
            [80,250],
            [40,300]
        ],
        fill: 'green'
    }
]

init( polygonsInit )


function crossLine( l1, l2 ) {

    var dx1 = l1[1][0] - l1[0][0],
        dy1 = l1[1][1] - l1[0][1],
        dx2 = l2[1][0] - l2[0][0],
        dy2 = l2[1][1] - l2[0][1],
        x = dy1 * dx2 - dy2 * dx1;

    if( !x || !dx2 || !dx1|| !dy1|| !dy2) {
        return false;
    }

    var y = l2[0][0] * l2[1][1] - l2[0][1] * l2[1][0];
    x = ((l1[0][0] * l1[1][1] - l1[0][1] * l1[1][0]) * dx2 - y * dx1) / x;
    y = (dy2 * x - y) / dx2;

    return ((l1[0][0] <= x && l1[1][0] >= x) || (l1[1][0] <= x && l1[0][0] >= x)) &&
        ((l2[0][0] <= x && l2[1][0] >= x) || (l2[1][0] <= x && l2[0][0] >= x));
}

function crossElem( elem, allElems ) {
    for (  var i = 0; i < allElems.length; i++ ) {
        if ( allElems[i].id == elem.id ) {
            continue;
        } else {
            for ( var j = 0; j < allElems[i].way.length; j++ ) {
                for ( var k = 0; k < elem.way.length; k++ ) {
                    var lk = k+1;
                    var lj = j+1;
                    if( lk >= elem.way.length  ) { lk = 0 }
                    if( lj >= allElems[i].way.length  ) { lj = 0 }
                    var l1 = [elem.way[ k ], elem.way[ lk ]];
                    var l2 = [allElems[ i ].way[ j ], allElems[ i ].way[ lj] ];

                    if( crossLine( l1, l2 ) ){
                        allElems[ i ].color = 'red';
                        allElems[ elem.id ].color = 'red';
                        return {
                            resp: true,
                            indexCross: i
                        };
                        break;
                    }
                }
            }
        }
    }
    return {
        resp: false,
        indexCross: null
    };
}