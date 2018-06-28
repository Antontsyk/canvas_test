window.onload = function () {
    var canvas = document.getElementById('canvas');
    if (canvas && canvas.getContext) {
        var ctx = canvas.getContext('2d');
        if (ctx) {

            var cw = canvas.width = window.innerWidth;
            var ch = canvas.height = window.innerHeight;


            ctx.globalAlpha = 0.95;
            var isDragging = false;
            var delta = new Object();

            function oMousePos(canvas, evt) {
                var rect = canvas.getBoundingClientRect();
                return {// devuelve un objeto
                    x: Math.round(evt.clientX - rect.left),
                    y: Math.round(evt.clientY - rect.top)
                };
            }

            function dibujarUnPoligono(X, Y, R, L, paso, color) {
                var beta = L / paso;
                var rad = (2 * Math.PI) / beta;
                var way = [];
                ctx.fillStyle = color;
                ctx.beginPath();
                for (var i = 0; i < L; i++) {
                    x = X + R * Math.cos(rad * i);
                    y = Y + R * Math.sin(rad * i);
                    ctx.lineTo(x, y);
                    way.push([x,y]);
                }
                ctx.closePath();
                ctx.fill();

                return way;
            }

            var positions = [];

            function dibujarPoligonos() {
                for (var i = 0; i < poligonosRy.length; i++) {
                    positions.push(dibujarUnPoligono(poligonosRy[i].X, poligonosRy[i].Y, poligonosRy[i].R, poligonosRy[i].L, poligonosRy[i].paso, poligonosRy[i].color));
                }
            }

            var poligonosRy = [
                {'X': 250, 'Y': 230, 'R': 85, 'L': 10, 'paso': 1, 'color': '#4CD964', 'bool': false},
                {'X': 110, 'Y': 80, 'R': 70, 'L': 5, 'paso': 0.4, 'color': '#FF9500', 'bool': false},
                {'X': 340, 'Y': 90, 'R': 80, 'L': 5, 'paso': 2, 'color': '#FF3B30', 'bool': false},
                {'X': 100, 'Y': 260, 'R': 65, 'L': 9, 'paso': 2, 'color': '#CC73E1', 'bool': false},
                {'X': 400, 'Y': 270, 'R': 75, 'L': 8, 'paso': 3, 'color': '#1BADF8', 'bool': false}
            ];
            poligonosRy.sort(function (a, b) {
                return b.R - a.R
            })
//console.log(poligonosRy);
            dibujarPoligonos();

// mousedown ***************************
            canvas.addEventListener('mousedown', function (evt) {
                isDragging = true;
                var mousePos = oMousePos(canvas, evt);
                for (var i = 0; i < poligonosRy.length; i++) {
//dibujarUnPoligono(X,Y,R,L,paso,color)   
                    dibujarUnPoligono(poligonosRy[i].X, poligonosRy[i].Y, poligonosRy[i].R, poligonosRy[i].L, poligonosRy[i].paso, poligonosRy[i].color);
                    if (ctx.isPointInPath(mousePos.x, mousePos.y)) {
                        poligonosRy[i].bool = true;
                        delta.x = poligonosRy[i].X - mousePos.x;
                        delta.y = poligonosRy[i].Y - mousePos.y;
                        break;
                    } else {
                        poligonosRy[i].bool = false;
                    }
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                dibujarPoligonos();
            }, false);
// mousemove ***************************
            canvas.addEventListener('mousemove', function (evt) {
                if (isDragging) {
                    var mousePos = oMousePos(canvas, evt);
                    for (var i = 0; i < poligonosRy.length; i++) {
                        if (poligonosRy[i].bool) {
                            console.log( crossLine( positions[i], positions[0] ) )
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            X = mousePos.x + delta.x, Y = mousePos.y + delta.y
                            poligonosRy[i].X = X;
                            poligonosRy[i].Y = Y;
                            break;
                        }
                    }
                    dibujarPoligonos();
                }
            }, false);
// mouseup ***************************
            canvas.addEventListener('mouseup', function (evt) {
                isDragging = false;
                for (var i = 0; i < poligonosRy.length; i++) {
                    poligonosRy[i].bool = false
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                dibujarPoligonos();
            }, false);
// mouseout ***************************
            canvas.addEventListener('mouseout', function (evt) {
                isDragging = false;
                for (var i = 0; i < poligonosRy.length; i++) {
                    poligonosRy[i].bool = false
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                dibujarPoligonos();
            }, false);
        }
    }
}

function crossLine(l1,l2) {
    var dx1 = l1[1][0] - l1[0][0],
        dy1 = l1[1][1] - l1[0][1],
        dx2 = l2[1][0] - l2[0][0],
        dy2 = l2[1][1] - l2[0][1],
        x = dy1 * dx2 - dy2 * dx1;

    if(!x, !dx2) {
        return false;
    }

    var y = l2[0][0] * l2[1][1] - l2[0][1] * l2[1][0];
    x = ((l1[0][0] * l1[1][1] - l1[0][1] * l1[1][0]) * dx2 - y * dx1) / x;
    y = (dy2 * x - y) / dx2;

    return ((l1[0][0] <= x && l1[1][0] >= x) || (l1[1][0] <= x && l1[0][0] >= x)) &&
        ((l2[0][0] <= x && l2[1][0] >= x) || (l2[1][0] <= x && l2[0][0] >= x));
}